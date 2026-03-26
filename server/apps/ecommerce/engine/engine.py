"""
Recommendation Engine

Core recommendation algorithms that use platform adapters to generate
product recommendations from order and catalog data.

Algorithms:
    - get_bestsellers: sales-based ranking (volume, value, or balanced)
    - get_cross_sell: market basket analysis (co-occurrence in orders)
    - get_upsell: higher-priced alternatives in same category
    - get_similar: attribute-based similarity (product_type + vendor scoring)

Debug — Inspecting Shopify Store Data:
    Shopify has no direct DB access. Use the GraphQL Admin API with the
    access token (ecommerce_connections.api_secret) from the nudgio DB.
    Query products and orders directly to verify catalog/order data matches
    what the engine sees via the adapter.

    Caution: get_adapter() in adapters/factory.py decrypts api_secret
    in-place on the connection object. If the SQLAlchemy object is reused
    across requests the token can get double-processed. Ensure adapter
    creation uses a fresh or expunged object.
"""

from typing import List, Dict, Any
from ..adapters.base import PlatformAdapter
from ..schemas.recommendation_schemas import BestsellerMethod
import logging

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Main recommendation engine that uses platform adapters to generate recommendations.
    Implements various recommendation algorithms.
    """
    
    def __init__(self, adapter: PlatformAdapter):
        self.adapter = adapter
    
    async def get_bestsellers(
        self, 
        limit: int = 10, 
        method: BestsellerMethod = BestsellerMethod.VOLUME,
        lookback_days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get bestselling products based on sales data.
        
        Args:
            limit: Number of products to return
            method: Calculation method (volume/value/balanced)
            lookback_days: Days to look back for sales data
        """
        try:
            # Get sales data
            order_items = await self.adapter.get_order_items(lookback_days)
            products = await self.adapter.get_products()
            
            # Create products lookup
            products_dict = {str(p['product_id']): p for p in products}
            
            # Calculate sales metrics per product
            product_metrics = {}
            for item in order_items:
                product_id = str(item.get('product_id', ''))
                if not product_id:
                    continue
                
                quantity = int(item.get('quantity', 0))
                price = float(item.get('price', 0))
                
                if product_id not in product_metrics:
                    product_metrics[product_id] = {
                        'volume': 0,
                        'value': 0.0,
                        'orders': 0
                    }
                
                product_metrics[product_id]['volume'] += quantity
                product_metrics[product_id]['value'] += quantity * price
                product_metrics[product_id]['orders'] += 1
            
            # Sort by chosen method
            if method == BestsellerMethod.VOLUME:
                sorted_products = sorted(
                    product_metrics.items(), 
                    key=lambda x: x[1]['volume'], 
                    reverse=True
                )
            elif method == BestsellerMethod.VALUE:
                sorted_products = sorted(
                    product_metrics.items(), 
                    key=lambda x: x[1]['value'], 
                    reverse=True
                )
            else:  # balanced
                sorted_products = sorted(
                    product_metrics.items(),
                    key=lambda x: (x[1]['volume'] * 0.7) + (x[1]['value'] * 0.3),
                    reverse=True
                )
            
            # Build recommendation list
            recommendations = []
            for i, (product_id, metrics) in enumerate(sorted_products[:limit]):
                if product_id in products_dict:
                    product = products_dict[product_id]
                    # Shopify adapter returns 'image_url' (string),
                    # WooCommerce/Magento return 'images' (list) — handle both
                    images = product.get('images', [])
                    image_url = product.get('image_url', '') or (images[0] if images else '')
                    recommendations.append({
                        'product_id': product_id,
                        'title': product.get('title', ''),
                        'price': float(product.get('price', 0)),
                        'handle': product.get('handle', ''),
                        'vendor': product.get('vendor', ''),
                        'sku': product.get('sku', ''),
                        'image_url': image_url,
                        'position': i + 1,
                        'metrics': metrics
                    })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating bestsellers: {e}", exc_info=True)
            return []
    
    async def get_cross_sell(
        self, 
        product_id: str, 
        limit: int = 5, 
        lookback_days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get frequently bought together products using market basket analysis.
        
        Args:
            product_id: Base product ID
            limit: Number of recommendations to return
            lookback_days: Days to look back for sales data
        """
        try:
            order_items = await self.adapter.get_order_items(lookback_days)
            products = await self.adapter.get_products()
            products_dict = {str(p['product_id']): p for p in products}

            logger.info(
                "Cross-sell: product_id=%s, order_items=%d, products=%d, product_in_catalog=%s",
                product_id, len(order_items), len(products), str(product_id) in products_dict
            )

            # Group items by order
            orders = {}
            for item in order_items:
                order_id = item.get('order_id')
                if order_id not in orders:
                    orders[order_id] = []
                orders[order_id].append(str(item.get('product_id', '')))

            # Find co-occurrences with target product
            target_product_id = str(product_id)
            co_occurrences = {}

            for order_id, product_ids in orders.items():
                if target_product_id in product_ids:
                    for pid in product_ids:
                        if pid != target_product_id and pid:
                            co_occurrences[pid] = co_occurrences.get(pid, 0) + 1

            logger.info(
                "Cross-sell: orders=%d, target_in_orders=%s, co_occurrences=%d",
                len(orders), any(target_product_id in pids for pids in orders.values()), len(co_occurrences)
            )

            # Sort by frequency
            sorted_cooccur = sorted(co_occurrences.items(), key=lambda x: x[1], reverse=True)

            # Build recommendations
            recommendations = []
            for i, (pid, count) in enumerate(sorted_cooccur[:limit]):
                if pid in products_dict:
                    product = products_dict[pid]
                    # Shopify adapter returns 'image_url' (string),
                    # WooCommerce/Magento return 'images' (list) — handle both
                    images = product.get('images', [])
                    image_url = product.get('image_url', '') or (images[0] if images else '')
                    recommendations.append({
                        'product_id': pid,
                        'title': product.get('title', ''),
                        'price': float(product.get('price', 0)),
                        'handle': product.get('handle', ''),
                        'vendor': product.get('vendor', ''),
                        'sku': product.get('sku', ''),
                        'image_url': image_url,
                        'position': i + 1,
                        'co_occurrence_count': count
                    })

            return recommendations

        except Exception as e:
            logger.error(f"Error generating cross-sell recommendations: {e}", exc_info=True)
            return []
    
    async def get_upsell(
        self, 
        product_id: str, 
        limit: int = 5,
        min_price_increase_percent: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get upsell products (higher-priced alternatives in same category).
        
        Args:
            product_id: Base product ID
            limit: Number of recommendations to return
            min_price_increase_percent: Minimum price increase percentage
        """
        try:
            products = await self.adapter.get_products()
            products_dict = {str(p['product_id']): p for p in products}

            if str(product_id) not in products_dict:
                logger.warning("Upsell: product_id=%s NOT FOUND in catalog (%d products)", product_id, len(products))
                return []

            base_product = products_dict[str(product_id)]
            base_price = float(base_product.get('price', 0))
            min_upsell_price = base_price * (1 + min_price_increase_percent / 100)

            logger.info(
                "Upsell: product_id=%s, base_price=%.2f, min_upsell_price=%.2f, "
                "base_product_type='%s', products=%d",
                product_id, base_price, min_upsell_price,
                base_product.get('product_type', ''), len(products)
            )

            # Filter upsell candidates
            upsell_candidates = []
            for product in products:
                current_price = float(product.get('price', 0))
                if (str(product['product_id']) != str(product_id) and
                    current_price >= min_upsell_price and
                    product.get('product_type') == base_product.get('product_type')):

                    price_increase = ((current_price - base_price) / base_price) * 100
                    # Shopify adapter returns 'image_url' (string),
                    # WooCommerce/Magento return 'images' (list) — handle both
                    images = product.get('images', [])
                    image_url = product.get('image_url', '') or (images[0] if images else '')
                    upsell_candidates.append({
                        'product_id': str(product['product_id']),
                        'title': product.get('title', ''),
                        'price': current_price,
                        'handle': product.get('handle', ''),
                        'vendor': product.get('vendor', ''),
                        'sku': product.get('sku', ''),
                        'image_url': image_url,
                        'price_increase_percent': round(price_increase, 2)
                    })

            logger.info("Upsell: found %d candidates", len(upsell_candidates))

            # Sort by price (ascending for better upsells)
            upsell_candidates.sort(key=lambda x: x['price'])

            # Add position
            for i, product in enumerate(upsell_candidates[:limit]):
                product['position'] = i + 1

            return upsell_candidates[:limit]

        except Exception as e:
            logger.error(f"Error generating upsell recommendations: {e}", exc_info=True)
            return []
    
    async def get_similar(
        self, 
        product_id: str, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get similar products based on category, vendor, and attributes.
        
        Args:
            product_id: Base product ID
            limit: Number of recommendations to return
        """
        try:
            products = await self.adapter.get_products()
            products_dict = {str(p['product_id']): p for p in products}

            if str(product_id) not in products_dict:
                logger.warning("Similar: product_id=%s NOT FOUND in catalog (%d products)", product_id, len(products))
                return []

            base_product = products_dict[str(product_id)]

            logger.info(
                "Similar: product_id=%s, base_product_type='%s', base_vendor='%s', products=%d",
                product_id, base_product.get('product_type', ''), base_product.get('vendor', ''), len(products)
            )

            # Find similar products
            similar_products = []
            for product in products:
                if str(product['product_id']) != str(product_id):
                    similarity_score = 0

                    # Same product type/category
                    if product.get('product_type') == base_product.get('product_type'):
                        similarity_score += 0.6

                    # Same vendor
                    if product.get('vendor') == base_product.get('vendor'):
                        similarity_score += 0.4

                    if similarity_score > 0:
                        # Shopify adapter returns 'image_url' (string),
                        # WooCommerce/Magento return 'images' (list) — handle both
                        images = product.get('images', [])
                        image_url = product.get('image_url', '') or (images[0] if images else '')
                        similar_products.append({
                            'product_id': str(product['product_id']),
                            'title': product.get('title', ''),
                            'price': float(product.get('price', 0)),
                            'handle': product.get('handle', ''),
                            'vendor': product.get('vendor', ''),
                            'sku': product.get('sku', ''),
                            'image_url': image_url,
                            'similarity_score': similarity_score
                        })

            logger.info("Similar: found %d candidates", len(similar_products))

            # Sort by similarity score
            similar_products.sort(key=lambda x: x['similarity_score'], reverse=True)

            # Add position
            for i, product in enumerate(similar_products[:limit]):
                product['position'] = i + 1

            return similar_products[:limit]

        except Exception as e:
            logger.error(f"Error generating similar product recommendations: {e}", exc_info=True)
            return []