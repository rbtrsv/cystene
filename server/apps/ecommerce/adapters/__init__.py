from .shopify import ShopifyAdapter
from .woocommerce import WooCommerceDatabaseAdapter, WooCommerceApiAdapter
from .magento import MagentoDatabaseAdapter, MagentoApiAdapter
from .ingest import IngestAdapter
from .factory import get_adapter

__all__ = [
    "ShopifyAdapter",
    "WooCommerceDatabaseAdapter",
    "WooCommerceApiAdapter",
    "MagentoDatabaseAdapter",
    "MagentoApiAdapter",
    "IngestAdapter",
    "get_adapter",
]
