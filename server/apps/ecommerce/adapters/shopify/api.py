import logging
from typing import List, Dict, Any, Optional
import aiohttp
from datetime import datetime, timedelta, timezone
from core.config import settings
from ...models import EcommerceConnection

logger = logging.getLogger(__name__)


class ShopifyAdapter:
    """
    Shopify GraphQL Admin API adapter.
    Uses Shopify's GraphQL Admin API to fetch products and orders.
    """

    def __init__(self, connection: EcommerceConnection, access_token: str = None):
        self.connection = connection
        # API credentials:
        # store_url = store domain (e.g., "m0stv8-wr.myshopify.com")
        # access_token = Shopify access token (e.g., "shpat_...")
        # Prefer explicit access_token param (decrypted by factory) over connection field
        self.store_domain = connection.store_url
        self.access_token = access_token or connection.api_secret
        # Config-driven API version (default "2026-01")
        self.api_version = settings.SHOPIFY_API_VERSION

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Shopify GraphQL API requests"""
        return {
            "X-Shopify-Access-Token": self.access_token,
            "Content-Type": "application/json"
        }

    def _get_graphql_url(self) -> str:
        """Get GraphQL endpoint URL for Shopify Admin API"""
        return f"https://{self.store_domain}/admin/api/{self.api_version}/graphql.json"

    @staticmethod
    def _extract_id(gid: Optional[str]) -> str:
        """
        Extract numeric ID from Shopify GID.
        "gid://shopify/Product/12345" → "12345"
        """
        return gid.split("/")[-1] if gid else ""

    async def _graphql_request(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute a single GraphQL POST request against the Shopify Admin API.
        - Checks for "errors" array AND data is None (GraphQL returns 200 even on error)
        - Logs extensions.cost if present (throttling visibility)
        - Returns the "data" dict
        """
        payload: Dict[str, Any] = {"query": query}
        if variables:
            payload["variables"] = variables

        async with aiohttp.ClientSession() as session:
            async with session.post(
                self._get_graphql_url(),
                headers=self._get_headers(),
                json=payload
            ) as response:
                # Non-200 responses may return HTML (e.g., 401 error page)
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Shopify GraphQL HTTP {response.status}: {error_text[:200]}")

                body = await response.json()

                # response.json() may return a string if body isn't valid JSON
                if isinstance(body, str):
                    raise Exception(f"Shopify GraphQL returned non-JSON response: {body[:200]}")

                # Log query cost for throttling visibility
                cost = body.get("extensions", {}).get("cost")
                if cost:
                    logger.debug("Shopify GraphQL cost: %s", cost)

                # GraphQL returns 200 even on error — check both conditions
                errors = body.get("errors")
                data = body.get("data")

                if errors and data is None:
                    # Normalize errors: can be str, dict, or list of dicts
                    if isinstance(errors, str):
                        error_messages = errors
                    elif isinstance(errors, dict):
                        error_messages = errors.get("message", str(errors))
                    elif isinstance(errors, list):
                        error_messages = "; ".join(
                            e.get("message", str(e)) if isinstance(e, dict) else str(e)
                            for e in errors
                        )
                    else:
                        logger.warning("Shopify GraphQL unexpected errors type: %s (%s)", type(errors).__name__, errors)
                        error_messages = str(errors)
                    raise Exception(f"Shopify GraphQL error: {error_messages}")

                if errors:
                    # Partial errors — log but continue with available data
                    logger.warning("Shopify GraphQL partial errors: %s", errors)

                return data or {}

    async def _graphql_paginate(
        self, query: str, resource_key: str, limit: int, variables: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Cursor-based pagination for GraphQL list queries.
        - Loops: sends query with first + after cursor
        - Accumulates nodes from edges[].node
        - Stops when pageInfo.hasNextPage is false or limit reached
        - Reusable for products, orders
        """
        all_nodes: List[Dict[str, Any]] = []
        cursor: Optional[str] = None
        # Shopify GraphQL max page size is 250
        page_size = min(limit, 250)
        vars_base = dict(variables) if variables else {}

        while len(all_nodes) < limit:
            # Build variables for this page
            page_vars = {**vars_base, "first": page_size, "after": cursor}

            data = await self._graphql_request(query, page_vars)
            resource = data.get(resource_key, {})
            edges = resource.get("edges", [])

            for edge in edges:
                all_nodes.append(edge["node"])
                if len(all_nodes) >= limit:
                    break

            # Check pagination
            page_info = resource.get("pageInfo", {})
            if not page_info.get("hasNextPage"):
                break

            cursor = page_info.get("endCursor")

        return all_nodes[:limit]

    # ------------------------------------------------------------------
    # Public API — same method signatures and return types as before
    # ------------------------------------------------------------------

    async def test_connection(self) -> bool:
        """Test if Shopify API connection is working via GraphQL shop query"""
        data = await self._graphql_request("{ shop { name } }")
        if data.get("shop"):
            return True
        raise Exception("Shopify GraphQL error: could not retrieve shop info")

    async def get_product_count(self) -> int:
        """Get total product count via GraphQL productsCount"""
        query = """
        {
            productsCount(limit: null) {
                count
            }
        }
        """
        data = await self._graphql_request(query)
        return data.get("productsCount", {}).get("count", 0)

    async def get_order_count(self, lookback_days: int = 365) -> int:
        """Get total order count via GraphQL ordersCount with date filter"""
        since_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
        query = """
        query($query: String) {
            ordersCount(limit: null, query: $query) {
                count
            }
        }
        """
        variables = {
            "query": f"financial_status:paid created_at:>{since_date}"
        }
        data = await self._graphql_request(query, variables)
        return data.get("ordersCount", {}).get("count", 0)

    async def get_products(self, limit: int = 250) -> List[Dict[str, Any]]:
        """Get products from Shopify GraphQL Admin API with cursor pagination"""
        query = """
        query($first: Int!, $after: String) {
            products(first: $first, query: "status:active", after: $after) {
                edges {
                    node {
                        id
                        title
                        handle
                        productType
                        vendor
                        status
                        images(first: 1) {
                            nodes { url }
                        }
                        variants(first: 1) {
                            nodes { id price sku inventoryQuantity }
                        }
                        createdAt
                        updatedAt
                    }
                    cursor
                }
                pageInfo { hasNextPage endCursor }
            }
        }
        """
        nodes = await self._graphql_paginate(query, "products", limit)

        products = []
        for node in nodes:
            # Get the first variant for pricing
            variant = (node.get("variants", {}).get("nodes") or [{}])[0]
            # Get the first image URL for widget HTML
            images = node.get("images", {}).get("nodes") or []
            image_url = images[0].get("url", "") if images else ""

            products.append({
                "product_id": self._extract_id(node.get("id")),
                "title": node.get("title", ""),
                "handle": node.get("handle", ""),
                "product_type": node.get("productType", ""),
                "vendor": node.get("vendor", ""),
                "status": (node.get("status") or "").lower(),
                "variant_id": self._extract_id(variant.get("id")),
                "price": float(variant.get("price", 0)),
                "sku": variant.get("sku", ""),
                # inventoryQuantity may be None if scope/permissions don't cover inventory
                "inventory_quantity": variant.get("inventoryQuantity") or 0,
                "image_url": image_url,
                "created_at": node.get("createdAt"),
                "updated_at": node.get("updatedAt")
            })

        return products

    async def get_orders(self, lookback_days: int = 30, limit: int = 250) -> List[Dict[str, Any]]:
        """Get orders from Shopify GraphQL Admin API with cursor pagination"""
        # Calculate date filter
        since_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d")

        query = """
        query($first: Int!, $after: String, $query: String!) {
            orders(first: $first, query: $query, after: $after) {
                edges {
                    node {
                        id
                        createdAt
                        displayFinancialStatus
                        totalPriceSet { shopMoney { amount } }
                        # Future: add 'customer { id }' here + read_customers scope for personalization
                    }
                    cursor
                }
                pageInfo { hasNextPage endCursor }
            }
        }
        """
        variables = {
            "query": f"financial_status:paid created_at:>{since_date}"
        }
        nodes = await self._graphql_paginate(query, "orders", limit, variables)

        orders = []
        for node in nodes:
            total_price_set = node.get("totalPriceSet") or {}
            shop_money = total_price_set.get("shopMoney") or {}

            orders.append({
                "order_id": self._extract_id(node.get("id")),
                "total_price": float(shop_money.get("amount", 0)),
                "financial_status": (node.get("displayFinancialStatus") or "").lower(),
                "order_date": node.get("createdAt")
            })

        return orders

    async def get_order_items(self, lookback_days: int = 30, limit: int = 10000) -> List[Dict[str, Any]]:
        """
        Get order line items from Shopify GraphQL Admin API.
        Line items are fetched inline with orders — eliminates the N+1 problem.
        Note: lineItems(first: 50) caps at 50 items per order. Orders with 50+
        distinct line items are extremely rare in ecommerce (<0.1% of orders).
        """
        # Calculate date filter
        since_date = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d")

        query = """
        query($first: Int!, $after: String, $query: String!) {
            orders(first: $first, query: $query, after: $after) {
                edges {
                    node {
                        id
                        createdAt
                        # Future: add 'customer { id }' here + read_customers scope for personalization
                        lineItems(first: 50) {
                            edges {
                                node {
                                    product { id }
                                    variant { id }
                                    quantity
                                    originalUnitPriceSet { shopMoney { amount } }
                                    title
                                }
                            }
                        }
                    }
                    cursor
                }
                pageInfo { hasNextPage endCursor }
            }
        }
        """
        variables = {
            "query": f"financial_status:paid created_at:>{since_date}"
        }
        # Paginate orders, then extract line items from each order
        # Estimate ~5 items per order to determine how many orders to fetch
        order_limit = max(limit // 5, 250)
        order_nodes = await self._graphql_paginate(query, "orders", order_limit, variables)

        order_items: List[Dict[str, Any]] = []
        for order_node in order_nodes:
            order_id = self._extract_id(order_node.get("id"))
            order_date = order_node.get("createdAt")

            line_items_edges = (order_node.get("lineItems") or {}).get("edges", [])
            for edge in line_items_edges:
                li = edge.get("node", {})
                price_set = li.get("originalUnitPriceSet") or {}
                shop_money = price_set.get("shopMoney") or {}

                order_items.append({
                    "order_id": order_id,
                    "product_id": self._extract_id((li.get("product") or {}).get("id")),
                    "variant_id": self._extract_id((li.get("variant") or {}).get("id")),
                    "quantity": int(li.get("quantity", 0)),
                    "price": float(shop_money.get("amount", 0)),
                    "product_title": li.get("title", ""),
                    "order_date": order_date,
                })

                # Stop if we've reached the limit
                if len(order_items) >= limit:
                    return order_items[:limit]

        return order_items[:limit]

    async def get_product_by_id(self, product_id: str) -> Dict[str, Any]:
        """Get single product by ID from Shopify GraphQL Admin API"""
        query = """
        query($id: ID!) {
            product(id: $id) {
                id
                title
                handle
                productType
                vendor
                status
                images(first: 1) {
                    nodes { url }
                }
                variants(first: 1) {
                    nodes { id price sku inventoryQuantity }
                }
            }
        }
        """
        # Prepend GID prefix for GraphQL
        gid = f"gid://shopify/Product/{product_id}"
        data = await self._graphql_request(query, {"id": gid})
        product = data.get("product")

        if product:
            # Get the first variant for pricing
            variant = (product.get("variants", {}).get("nodes") or [{}])[0]
            # Get the first image URL
            images = product.get("images", {}).get("nodes") or []
            image_url = images[0].get("url", "") if images else ""

            return {
                "product_id": self._extract_id(product.get("id")),
                "title": product.get("title", ""),
                "handle": product.get("handle", ""),
                "product_type": product.get("productType", ""),
                "vendor": product.get("vendor", ""),
                "variant_id": self._extract_id(variant.get("id")),
                "price": float(variant.get("price", 0)),
                "sku": variant.get("sku", ""),
                # inventoryQuantity may be None if scope/permissions don't cover inventory
                "inventory_quantity": variant.get("inventoryQuantity") or 0,
                "image_url": image_url
            }

        return {}
