"""Abstract base class with shared database engine logic for direct-connection adapters."""

from abc import ABC, abstractmethod
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy import text
from ..models import EcommerceConnection


class PlatformAdapter(ABC):
    """
    Abstract base class for ecommerce platform database adapters.
    Each platform (Shopify, WooCommerce, Magento) implements this interface.
    """
    
    def __init__(self, connection: EcommerceConnection, db_password: str = None):
        self.connection = connection
        # Prefer explicit db_password (decrypted by factory) over connection field
        self._db_password = db_password or connection.db_password
        self.engine = self._create_engine()

    def _create_engine(self) -> AsyncEngine:
        """Create async database engine for customer's ecommerce database"""
        # Different platforms use different databases:
        # - Shopify: PostgreSQL
        # - WooCommerce: MySQL (WordPress)
        # - Magento: MySQL

        if self.connection.platform == "shopify":
            # Shopify uses PostgreSQL
            db_url = f"postgresql+asyncpg://{self.connection.db_user}:{self._db_password}@{self.connection.db_host}:{self.connection.db_port}/{self.connection.db_name}"
        else:
            # WooCommerce and Magento typically use MySQL
            db_url = f"mysql+aiomysql://{self.connection.db_user}:{self._db_password}@{self.connection.db_host}:{self.connection.db_port}/{self.connection.db_name}"

        return create_async_engine(db_url, echo=False, future=True)
    
    @abstractmethod
    async def get_products(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get products from ecommerce database"""
        pass
    
    @abstractmethod
    async def get_orders(self, lookback_days: int = 30, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get orders from ecommerce database"""
        pass
    
    @abstractmethod
    async def get_order_items(self, lookback_days: int = 30, limit: int = 10000) -> List[Dict[str, Any]]:
        """Get order line items from ecommerce database"""
        pass
    
    @abstractmethod
    async def get_product_by_id(self, product_id: str) -> Dict[str, Any]:
        """Get single product by ID"""
        pass
    
    async def test_connection(self) -> bool:
        """Test if database connection is working"""
        try:
            async with self.engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            return True
        except Exception:
            return False
    
    async def close(self):
        """Close database connection"""
        await self.engine.dispose()