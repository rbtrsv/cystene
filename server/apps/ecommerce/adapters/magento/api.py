"""Magento 2 REST API adapter — fetches products and orders via Bearer token auth."""

import aiohttp
import math
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from ...models import EcommerceConnection


class MagentoApiAdapter:
    """
    Magento 2 REST API adapter.
    Uses Bearer token authentication (integration access token).
    Base URL: {store_url}/rest/default/V1

    Note on Magento 2.4.4+: Integration tokens can no longer be used as
    standalone Bearer tokens by default. Merchants must enable the setting:
    Stores > Configuration > Services > OAuth > "Allow OAuth Access Tokens
    to be used as standalone Bearer tokens" > Yes.
    """

    # Magento REST API max pageSize
    MAX_PAGE_SIZE = 300

    def __init__(self, connection: EcommerceConnection, api_key: str = None, api_secret: str = None):
        self.connection = connection
        # API credentials:
        # store_url = store base URL (e.g., "https://mymagento.com")
        # api_secret = integration access token
        # Prefer explicit params (decrypted by factory) over connection fields
        self.store_url = connection.store_url.rstrip("/")
        self.access_token = api_secret or connection.api_secret
        self.base_url = f"{self.store_url}/rest/default/V1"

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Magento API requests"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    async def get_product_count(self) -> int:
        """Get total product count from Magento REST API via total_count field"""
        async with aiohttp.ClientSession() as session:
            params = {
                "searchCriteria[pageSize]": 1,
                "searchCriteria[currentPage]": 1,
                "searchCriteria[filterGroups][0][filters][0][field]": "type_id",
                "searchCriteria[filterGroups][0][filters][0][value]": "simple,configurable,virtual,downloadable",
                "searchCriteria[filterGroups][0][filters][0][conditionType]": "in",
            }
            async with session.get(
                f"{self.base_url}/products",
                headers=self._get_headers(),
                params=params,
            ) as response:
                if response.status != 200:
                    return 0
                data = await response.json()
                return data.get("total_count", 0)

    async def get_order_count(self, lookback_days: int = 365) -> int:
        """Get total order count from Magento REST API via total_count field"""
        since_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d %H:%M:%S")
        async with aiohttp.ClientSession() as session:
            params = {
                "searchCriteria[pageSize]": 1,
                "searchCriteria[currentPage]": 1,
                "searchCriteria[filterGroups][0][filters][0][field]": "status",
                "searchCriteria[filterGroups][0][filters][0][value]": "complete,processing",
                "searchCriteria[filterGroups][0][filters][0][conditionType]": "in",
                "searchCriteria[filterGroups][1][filters][0][field]": "created_at",
                "searchCriteria[filterGroups][1][filters][0][value]": since_date,
                "searchCriteria[filterGroups][1][filters][0][conditionType]": "gteq",
            }
            async with session.get(
                f"{self.base_url}/orders",
                headers=self._get_headers(),
                params=params,
            ) as response:
                if response.status != 200:
                    return 0
                data = await response.json()
                return data.get("total_count", 0)

    async def get_products(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Get products from Magento REST API.
        Uses searchCriteria for pagination and filtering.
        Filters by type_id: simple, configurable, virtual, downloadable.
        """
        products = []
        page = 1
        page_size = min(limit, self.MAX_PAGE_SIZE)

        async with aiohttp.ClientSession() as session:
            while len(products) < limit:
                params = {
                    "searchCriteria[pageSize]": page_size,
                    "searchCriteria[currentPage]": page,
                    "searchCriteria[filterGroups][0][filters][0][field]": "type_id",
                    "searchCriteria[filterGroups][0][filters][0][value]": "simple,configurable,virtual,downloadable",
                    "searchCriteria[filterGroups][0][filters][0][conditionType]": "in",
                    "searchCriteria[sortOrders][0][field]": "entity_id",
                    "searchCriteria[sortOrders][0][direction]": "ASC",
                }

                async with session.get(
                    f"{self.base_url}/products",
                    headers=self._get_headers(),
                    params=params,
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Magento API error {response.status}: {error_text}")

                    data = await response.json()
                    items = data.get("items", [])
                    if not items:
                        break

                    for product in items:
                        # Extract custom_attributes into a lookup dict
                        custom_attrs = {
                            attr["attribute_code"]: attr["value"]
                            for attr in product.get("custom_attributes", [])
                        }

                        # Extract stock quantity from extension_attributes
                        stock_item = product.get("extension_attributes", {}).get("stock_item", {})

                        products.append({
                            "product_id": str(product["id"]),
                            "title": product.get("name", ""),
                            "handle": custom_attrs.get("url_key", ""),
                            "product_type": product.get("type_id", ""),
                            "sku": product.get("sku", ""),
                            "price": float(product.get("price", 0) or 0),
                            "inventory_quantity": int(stock_item.get("qty", 0) or 0),
                            "stock_status": "instock" if stock_item.get("is_in_stock") else "outofstock",
                            "description": custom_attrs.get("description", ""),
                            "short_description": custom_attrs.get("short_description", ""),
                            "created_at": product.get("created_at"),
                            "updated_at": product.get("updated_at"),
                        })

                    # Check if there are more pages
                    total_count = data.get("total_count", 0)
                    total_pages = math.ceil(total_count / page_size) if page_size > 0 else 1
                    if page >= total_pages:
                        break
                    page += 1

        return products[:limit]

    async def get_orders(self, lookback_days: int = 30, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Get orders from Magento REST API.
        Filters by status (complete, processing) and date range.
        """
        orders = []
        page = 1
        page_size = min(limit, self.MAX_PAGE_SIZE)

        # Calculate date filter (Magento format: "YYYY-MM-DD HH:MM:SS")
        since_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d %H:%M:%S")

        async with aiohttp.ClientSession() as session:
            while len(orders) < limit:
                params = {
                    "searchCriteria[pageSize]": page_size,
                    "searchCriteria[currentPage]": page,
                    # Filter group 0: status IN (complete, processing)
                    "searchCriteria[filterGroups][0][filters][0][field]": "status",
                    "searchCriteria[filterGroups][0][filters][0][value]": "complete,processing",
                    "searchCriteria[filterGroups][0][filters][0][conditionType]": "in",
                    # Filter group 1: created_at >= since_date (AND with group 0)
                    "searchCriteria[filterGroups][1][filters][0][field]": "created_at",
                    "searchCriteria[filterGroups][1][filters][0][value]": since_date,
                    "searchCriteria[filterGroups][1][filters][0][conditionType]": "gteq",
                    # Sort by created_at descending
                    "searchCriteria[sortOrders][0][field]": "created_at",
                    "searchCriteria[sortOrders][0][direction]": "DESC",
                }

                async with session.get(
                    f"{self.base_url}/orders",
                    headers=self._get_headers(),
                    params=params,
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Magento API error {response.status}: {error_text}")

                    data = await response.json()
                    items = data.get("items", [])
                    if not items:
                        break

                    for order in items:
                        orders.append({
                            "order_id": str(order["entity_id"]),
                            "increment_id": order.get("increment_id", ""),
                            "customer_id": str(order.get("customer_id", "")),
                            "total_price": float(order.get("grand_total", 0) or 0),
                            "status": order.get("status", ""),
                            "order_date": order.get("created_at"),
                        })

                    # Check if there are more pages
                    total_count = data.get("total_count", 0)
                    total_pages = math.ceil(total_count / page_size) if page_size > 0 else 1
                    if page >= total_pages:
                        break
                    page += 1

        return orders[:limit]

    async def get_order_items(self, lookback_days: int = 30, limit: int = 10000) -> List[Dict[str, Any]]:
        """
        Get order line items from Magento REST API.
        Order items are embedded in the order response (items[].items[]).
        """
        order_items = []
        page = 1
        page_size = self.MAX_PAGE_SIZE

        # Calculate date filter (Magento format: "YYYY-MM-DD HH:MM:SS")
        since_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d %H:%M:%S")

        async with aiohttp.ClientSession() as session:
            while len(order_items) < limit:
                params = {
                    "searchCriteria[pageSize]": page_size,
                    "searchCriteria[currentPage]": page,
                    # Filter group 0: status IN (complete, processing)
                    "searchCriteria[filterGroups][0][filters][0][field]": "status",
                    "searchCriteria[filterGroups][0][filters][0][value]": "complete,processing",
                    "searchCriteria[filterGroups][0][filters][0][conditionType]": "in",
                    # Filter group 1: created_at >= since_date
                    "searchCriteria[filterGroups][1][filters][0][field]": "created_at",
                    "searchCriteria[filterGroups][1][filters][0][value]": since_date,
                    "searchCriteria[filterGroups][1][filters][0][conditionType]": "gteq",
                    # Sort by created_at descending
                    "searchCriteria[sortOrders][0][field]": "created_at",
                    "searchCriteria[sortOrders][0][direction]": "DESC",
                }

                async with session.get(
                    f"{self.base_url}/orders",
                    headers=self._get_headers(),
                    params=params,
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Magento API error {response.status}: {error_text}")

                    data = await response.json()
                    orders = data.get("items", [])
                    if not orders:
                        break

                    for order in orders:
                        order_id = str(order["entity_id"])
                        customer_id = str(order.get("customer_id", ""))
                        order_date = order.get("created_at")

                        # Order items are nested under items[].items[]
                        for item in order.get("items", []):
                            # Skip parent items of configurable products (avoid double-counting)
                            if item.get("product_type") == "configurable":
                                continue

                            order_items.append({
                                "order_id": order_id,
                                "product_id": str(item.get("product_id", "")),
                                "quantity": int(item.get("qty_ordered", 0)),
                                "price": float(item.get("price", 0) or 0),
                                "product_title": item.get("name", ""),
                                "sku": item.get("sku", ""),
                                "order_date": order_date,
                                "customer_id": customer_id,
                            })

                    # Check if there are more pages
                    total_count = data.get("total_count", 0)
                    total_pages = math.ceil(total_count / page_size) if page_size > 0 else 1
                    if page >= total_pages:
                        break
                    page += 1

        return order_items[:limit]

    async def get_product_by_id(self, product_id: str) -> Dict[str, Any]:
        """
        Get single product by ID from Magento REST API.
        Note: Magento REST API uses SKU for single product lookup,
        so we search by entity_id filter instead.
        """
        async with aiohttp.ClientSession() as session:
            params = {
                "searchCriteria[filterGroups][0][filters][0][field]": "entity_id",
                "searchCriteria[filterGroups][0][filters][0][value]": product_id,
                "searchCriteria[filterGroups][0][filters][0][conditionType]": "eq",
                "searchCriteria[pageSize]": 1,
            }

            async with session.get(
                f"{self.base_url}/products",
                headers=self._get_headers(),
                params=params,
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    items = data.get("items", [])

                    if items:
                        product = items[0]
                        custom_attrs = {
                            attr["attribute_code"]: attr["value"]
                            for attr in product.get("custom_attributes", [])
                        }
                        stock_item = product.get("extension_attributes", {}).get("stock_item", {})

                        return {
                            "product_id": str(product["id"]),
                            "title": product.get("name", ""),
                            "handle": custom_attrs.get("url_key", ""),
                            "product_type": product.get("type_id", ""),
                            "sku": product.get("sku", ""),
                            "price": float(product.get("price", 0) or 0),
                            "inventory_quantity": int(stock_item.get("qty", 0) or 0),
                            "stock_status": "instock" if stock_item.get("is_in_stock") else "outofstock",
                            "description": custom_attrs.get("description", ""),
                            "short_description": custom_attrs.get("short_description", ""),
                        }
                else:
                    error_text = await response.text()
                    raise Exception(f"Magento API error {response.status}: {error_text}")

        return {}

    async def test_connection(self) -> bool:
        """
        Test if Magento API connection is working.
        Uses GET /rest/default/V1/store/storeConfigs which returns
        store configuration (name, locale, currency, etc.).

        If the response is 401 with "consumer isn't authorized", this
        indicates Magento 2.4.4+ where Bearer token usage is disabled
        by default. The merchant needs to enable:
        Stores > Configuration > Services > OAuth >
        "Allow OAuth Access Tokens to be used as standalone Bearer tokens" > Yes
        """
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/store/storeConfigs",
                headers=self._get_headers(),
            ) as response:
                if response.status == 200:
                    return True

                # Detect Magento 2.4.4+ Bearer token disabled error
                error_text = await response.text()
                if response.status == 401 and "consumer isn't authorized" in error_text.lower():
                    raise Exception(
                        "Magento 2.4.4+ Bearer token auth is disabled. "
                        "Enable in: Stores > Configuration > Services > OAuth > "
                        '"Allow OAuth Access Tokens to be used as standalone Bearer tokens" > Yes'
                    )

                raise Exception(f"Magento API error {response.status}: {error_text}")
