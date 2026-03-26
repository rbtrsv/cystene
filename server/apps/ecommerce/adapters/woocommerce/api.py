"""WooCommerce REST API v3 adapter — fetches products and orders via HTTP Basic Auth."""

import aiohttp
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from ...models import EcommerceConnection


class WooCommerceApiAdapter:
    """
    WooCommerce REST API v3 adapter.
    Uses HTTP Basic Auth (consumer_key + consumer_secret) over HTTPS.
    Base URL: {store_url}/wp-json/wc/v3
    """

    # WooCommerce REST API max per_page
    MAX_PER_PAGE = 100

    def __init__(self, connection: EcommerceConnection, api_key: str = None, api_secret: str = None):
        self.connection = connection
        # API credentials:
        # store_url = store base URL (e.g., "https://mystore.com")
        # api_key = consumer_key (e.g., "ck_xxx")
        # api_secret = consumer_secret (e.g., "cs_xxx")
        # Prefer explicit params (decrypted by factory) over connection fields
        if not connection.store_url:
            raise ValueError("Store URL is missing — update it in connection settings before testing")
        self.store_url = connection.store_url.rstrip("/")
        self.consumer_key = api_key or connection.api_key
        self.consumer_secret = api_secret or connection.api_secret
        self.base_url = f"{self.store_url}/wp-json/wc/v3"

    def _get_auth(self) -> aiohttp.BasicAuth:
        """Get HTTP Basic Auth credentials for WooCommerce API requests"""
        return aiohttp.BasicAuth(self.consumer_key, self.consumer_secret)

    async def get_product_count(self) -> int:
        """Get total product count from WooCommerce REST API via X-WP-Total header"""
        async with aiohttp.ClientSession() as session:
            params = {"per_page": 1, "status": "publish"}
            async with session.get(
                f"{self.base_url}/products",
                auth=self._get_auth(),
                params=params,
            ) as response:
                if response.status != 200:
                    return 0
                return int(response.headers.get("X-WP-Total", 0))

    async def get_order_count(self, lookback_days: int = 365) -> int:
        """Get total order count from WooCommerce REST API via X-WP-Total header"""
        since_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).isoformat()
        async with aiohttp.ClientSession() as session:
            params = {
                "per_page": 1,
                "status": "completed,processing",
                "after": since_date,
            }
            async with session.get(
                f"{self.base_url}/orders",
                auth=self._get_auth(),
                params=params,
            ) as response:
                if response.status != 200:
                    return 0
                return int(response.headers.get("X-WP-Total", 0))

    async def get_products(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Get products from WooCommerce REST API.
        Paginates with per_page=100, reads X-WP-TotalPages header.
        """
        products = []
        page = 1
        per_page = min(limit, self.MAX_PER_PAGE)

        async with aiohttp.ClientSession() as session:
            while len(products) < limit:
                params = {
                    "per_page": per_page,
                    "page": page,
                    "status": "publish",
                    "orderby": "id",
                    "order": "asc",
                }

                async with session.get(
                    f"{self.base_url}/products",
                    auth=self._get_auth(),
                    params=params,
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"WooCommerce API error {response.status}: {error_text}")

                    data = await response.json()
                    if not data:
                        break

                    for product in data:
                        products.append({
                            "product_id": str(product["id"]),
                            "title": product.get("name", ""),
                            "handle": product.get("slug", ""),
                            "product_type": product.get("type", ""),
                            "sku": product.get("sku", ""),
                            "price": float(product.get("price", 0) or 0),
                            "regular_price": float(product.get("regular_price", 0) or 0),
                            "sale_price": float(product.get("sale_price", 0) or 0),
                            "inventory_quantity": product.get("stock_quantity", 0),
                            "stock_status": product.get("stock_status", ""),
                            "categories": [cat.get("name", "") for cat in product.get("categories", [])],
                            "images": [img.get("src", "") for img in product.get("images", [])],
                            "created_at": product.get("date_created"),
                            "updated_at": product.get("date_modified"),
                        })

                    # Check if there are more pages
                    total_pages = int(response.headers.get("X-WP-TotalPages", 1))
                    if page >= total_pages:
                        break
                    page += 1

        return products[:limit]

    async def get_orders(self, lookback_days: int = 30, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Get orders from WooCommerce REST API.
        Filters by status (completed, processing) and date range.
        """
        orders = []
        page = 1
        per_page = min(limit, self.MAX_PER_PAGE)

        # Calculate date filter (ISO 8601)
        since_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).isoformat()

        async with aiohttp.ClientSession() as session:
            while len(orders) < limit:
                params = {
                    "per_page": per_page,
                    "page": page,
                    "status": "completed,processing",
                    "after": since_date,
                    "orderby": "date",
                    "order": "desc",
                }

                async with session.get(
                    f"{self.base_url}/orders",
                    auth=self._get_auth(),
                    params=params,
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"WooCommerce API error {response.status}: {error_text}")

                    data = await response.json()
                    if not data:
                        break

                    for order in data:
                        orders.append({
                            "order_id": str(order["id"]),
                            "customer_id": str(order.get("customer_id", "")),
                            "total_price": float(order.get("total", 0) or 0),
                            "status": order.get("status", ""),
                            "order_date": order.get("date_created"),
                        })

                    # Check if there are more pages
                    total_pages = int(response.headers.get("X-WP-TotalPages", 1))
                    if page >= total_pages:
                        break
                    page += 1

        return orders[:limit]

    async def get_order_items(self, lookback_days: int = 30, limit: int = 10000) -> List[Dict[str, Any]]:
        """
        Get order line items from WooCommerce REST API.
        Order items (line_items) are embedded directly in the order response.
        """
        order_items = []
        page = 1
        per_page = self.MAX_PER_PAGE

        # Calculate date filter (ISO 8601)
        since_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).isoformat()

        async with aiohttp.ClientSession() as session:
            while len(order_items) < limit:
                params = {
                    "per_page": per_page,
                    "page": page,
                    "status": "completed,processing",
                    "after": since_date,
                    "orderby": "date",
                    "order": "desc",
                }

                async with session.get(
                    f"{self.base_url}/orders",
                    auth=self._get_auth(),
                    params=params,
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"WooCommerce API error {response.status}: {error_text}")

                    data = await response.json()
                    if not data:
                        break

                    for order in data:
                        order_id = str(order["id"])
                        customer_id = str(order.get("customer_id", ""))
                        order_date = order.get("date_created")

                        for item in order.get("line_items", []):
                            order_items.append({
                                "order_id": order_id,
                                "product_id": str(item.get("product_id", "")),
                                "variant_id": str(item.get("variation_id", "")),
                                "quantity": int(item.get("quantity", 0)),
                                "price": float(item.get("price", 0) or 0),
                                "product_title": item.get("name", ""),
                                "sku": item.get("sku", ""),
                                "order_date": order_date,
                                "customer_id": customer_id,
                            })

                    # Check if there are more pages
                    total_pages = int(response.headers.get("X-WP-TotalPages", 1))
                    if page >= total_pages:
                        break
                    page += 1

        return order_items[:limit]

    async def get_product_by_id(self, product_id: str) -> Dict[str, Any]:
        """Get single product by ID from WooCommerce REST API"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/products/{product_id}",
                auth=self._get_auth(),
            ) as response:
                if response.status == 200:
                    product = await response.json()
                    return {
                        "product_id": str(product["id"]),
                        "title": product.get("name", ""),
                        "handle": product.get("slug", ""),
                        "product_type": product.get("type", ""),
                        "sku": product.get("sku", ""),
                        "price": float(product.get("price", 0) or 0),
                        "regular_price": float(product.get("regular_price", 0) or 0),
                        "sale_price": float(product.get("sale_price", 0) or 0),
                        "inventory_quantity": product.get("stock_quantity", 0),
                        "stock_status": product.get("stock_status", ""),
                        "categories": [cat.get("name", "") for cat in product.get("categories", [])],
                        "images": [img.get("src", "") for img in product.get("images", [])],
                    }
                else:
                    error_text = await response.text()
                    raise Exception(f"WooCommerce API error {response.status}: {error_text}")

        return {}

    async def test_connection(self) -> bool:
        """
        Test if WooCommerce API connection is working.
        Uses GET /wp-json/wc/v3/system_status which also verifies
        WooCommerce version and plugin status.
        """
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/system_status",
                auth=self._get_auth(),
            ) as response:
                if response.status == 200:
                    return True
                error_text = await response.text()
                raise Exception(f"WooCommerce API error {response.status}: {error_text}")
