# Ecommerce Recommendation Engine

A comprehensive FastAPI-based recommendation system that connects directly to customers' existing ecommerce databases to generate intelligent product recommendations.

## Overview

This system provides a SaaS solution for ecommerce businesses to generate sophisticated product recommendations without requiring data migration. It connects directly to existing ecommerce platform databases and provides real-time recommendations through a REST API.

### Key Features

- **Direct Database Integration**: Connects to existing Shopify, WooCommerce, and Magento databases
- **Multiple Recommendation Types**: Bestsellers, cross-sell, upsell, and similar products
- **Real-time Processing**: No data migration required - queries live databases
- **Configurable Algorithms**: Customizable recommendation parameters per connection
- **Multi-tenant Architecture**: Supports multiple customers with isolated data
- **Rate Limiting**: Subscription-tier based API limits
- **Secure**: Encrypted database credentials and JWT authentication

## Supported Platforms

### Shopify
- **Database**: PostgreSQL (port 5432)
- **Tables**: `products`, `variants`, `orders`, `line_items`, `customers`
- **Connection**: Uses `postgresql+asyncpg://` driver

### WooCommerce  
- **Database**: MySQL (port 3306)
- **Tables**: `wp_posts`, `wp_postmeta`, `woocommerce_order_items`
- **Connection**: Uses `mysql+aiomysql://` driver

### Magento
- **Database**: MySQL (port 3306) 
- **Tables**: `catalog_product_entity`, `sales_order`, `sales_order_item`
- **Connection**: Uses `mysql+aiomysql://` driver

## Architecture

### Platform Adapter Pattern
```
RecommendationEngine
├── ShopifyAdapter (PostgreSQL)
├── WooCommerceAdapter (MySQL) 
└── MagentoAdapter (MySQL)
```

Each adapter implements platform-specific SQL queries while providing a unified interface to the recommendation engine.

### Database Connection Management
- **Encryption**: Database credentials encrypted at rest
- **Connection Pooling**: Async connection pooling per customer database
- **Health Monitoring**: Connection testing and validation
- **Multi-database**: Supports both PostgreSQL and MySQL connections

## API Endpoints

### Database Connections
- `GET /ecommerce/connections/` - List all connections
- `POST /ecommerce/connections/` - Create new connection
- `GET /ecommerce/connections/{id}` - Get connection details
- `PUT /ecommerce/connections/{id}` - Update connection
- `DELETE /ecommerce/connections/{id}` - Delete connection
- `POST /ecommerce/connections/{id}/test` - Test connection

### Product Recommendations
- `POST /ecommerce/recommendations/bestsellers` - Get bestselling products
- `POST /ecommerce/recommendations/cross-sell` - Get frequently bought together
- `POST /ecommerce/recommendations/upsell` - Get higher-priced alternatives
- `POST /ecommerce/recommendations/similar` - Get similar products

### Data Management
- `POST /ecommerce/data/import/products` - Import product data
- `POST /ecommerce/data/import/orders` - Import order data  
- `POST /ecommerce/data/import/order-items` - Import order items
- `GET /ecommerce/data/stats/{id}` - Get connection statistics
- `POST /ecommerce/data/sync/{id}` - Trigger data sync

### Settings Management  
- `POST /ecommerce/settings/{id}` - Create/update recommendation settings
- `GET /ecommerce/settings/{id}` - Get connection settings
- `GET /ecommerce/settings/` - Get all connection settings
- `DELETE /ecommerce/settings/{id}` - Delete settings
- `POST /ecommerce/settings/{id}/reset` - Reset to defaults

## Recommendation Algorithms

### 1. Bestsellers
**Purpose**: Identify top-performing products based on sales data

**Methods**:
- **Volume**: Ranked by total quantity sold
- **Value**: Ranked by total revenue generated  
- **Balanced**: Weighted combination (70% volume + 30% value)

**Parameters**:
- `limit`: Number of products to return (1-100)
- `method`: Calculation method (volume/value/balanced)
- `lookback_days`: Historical data window (1-365 days)

### 2. Cross-sell (Market Basket Analysis)
**Purpose**: Find products frequently bought together

**Algorithm**: 
- Groups order items by order ID
- Calculates co-occurrence frequency for target product
- Ranks by frequency of joint purchases

**Parameters**:
- `product_id`: Base product for recommendations
- `limit`: Number of recommendations (1-50)
- `lookback_days`: Historical data window

### 3. Upsell
**Purpose**: Suggest higher-priced products in same category

**Algorithm**:
- Filters products in same category/type
- Requires minimum price increase (default 10%)
- Sorts by price (ascending for better conversion)

**Parameters**:
- `product_id`: Base product for comparison
- `limit`: Number of recommendations
- `min_price_increase_percent`: Minimum price increase (0-1000%)

### 4. Similar Products
**Purpose**: Find products with similar attributes

**Algorithm**:
- Calculates similarity scores based on:
  - Product type/category (60% weight)
  - Same vendor/brand (40% weight)
- Ranks by combined similarity score

**Parameters**:
- `product_id`: Base product for similarity
- `limit`: Number of similar products

## Technical Implementation

### Models & Database Schema

```python
# Core Models
class EcommerceConnection(Base):
    user_id: ForeignKey -> accounts.User
    organization_id: ForeignKey -> accounts.Organization  
    platform: Enum(SHOPIFY, WOOCOMMERCE, MAGENTO)
    connection_name: str
    db_host: str
    db_name: str
    db_user: str
    db_password: str (encrypted)
    db_port: int
    is_active: bool

class RecommendationSettings(Base):
    connection_id: ForeignKey -> EcommerceConnection
    default_limit: int
    default_lookback_days: int
    bestseller_method: Enum(VOLUME, VALUE, BALANCED)
    cross_sell_enabled: bool
    upsell_enabled: bool
    similar_products_enabled: bool
    cache_recommendations: bool
    cache_duration_minutes: int
```

### Security Features

**Authentication**:
- JWT Bearer tokens via existing accounts system
- Per-user connection isolation
- Organization-level access controls

**Database Security**:
- Encrypted credential storage using Fernet encryption
- Parameterized queries prevent SQL injection
- Connection validation before storage

**Rate Limiting**:
```python
# Subscription-based limits
RATE_LIMITS = {
    "free": {"requests_per_minute": 10, "requests_per_hour": 100},
    "starter": {"requests_per_minute": 50, "requests_per_hour": 1000}, 
    "pro": {"requests_per_minute": 200, "requests_per_hour": 5000},
    "enterprise": {"requests_per_minute": 1000, "requests_per_hour": 20000}
}
```

### Performance Optimizations

**Caching**:
- In-memory recommendation caching
- Configurable TTL per connection
- Cache key generation based on parameters

**Database Connections**:
- Async connection pooling
- Connection reuse across requests
- Automatic connection cleanup

**Query Optimization**:
- Platform-specific optimized SQL queries
- Indexed database queries where possible
- Configurable result limits

## Usage Examples

### 1. Create Database Connection
```json
POST /ecommerce/connections/
{
  "connection_name": "My Shopify Store",
  "platform": "SHOPIFY", 
  "db_host": "shopify-db.example.com",
  "db_name": "shopify_production",
  "db_user": "readonly_user",
  "db_password": "secure_password",
  "db_port": 5432
}
```

### 2. Get Bestseller Recommendations  
```json
POST /ecommerce/recommendations/bestsellers
{
  "connection_id": 1,
  "limit": 10,
  "method": "VOLUME",
  "lookback_days": 30
}

Response:
{
  "recommendations": [
    {
      "product_id": "123",
      "title": "Wireless Headphones",
      "price": 99.99,
      "handle": "wireless-headphones",
      "vendor": "TechCorp",
      "sku": "WH-001",
      "position": 1,
      "metrics": {
        "volume": 145,
        "value": 14495.5,
        "orders": 89
      }
    }
  ],
  "total": 10,
  "method": "volume",
  "lookback_days": 30,
  "generated_at": "2024-01-15T10:30:00Z"
}
```

### 3. Configure Recommendation Settings
```json
POST /ecommerce/settings/1
{
  "default_limit": 20,
  "default_lookback_days": 45,
  "bestseller_method": "BALANCED",
  "cross_sell_enabled": true,
  "upsell_enabled": true,
  "similar_products_enabled": true,
  "min_upsell_price_increase": 15,
  "cache_recommendations": true,
  "cache_duration_minutes": 30
}
```

## Error Handling

### Connection Errors
- Invalid database credentials
- Network connectivity issues  
- Unsupported platform schemas
- Database permission errors

### Recommendation Errors
- No data available for time period
- Invalid product IDs
- Insufficient sales data
- Platform-specific schema mismatches

### Rate Limiting
- HTTP 429 responses with retry headers
- Subscription upgrade suggestions
- Usage quota information

## Integration Patterns

### Direct API Integration
```javascript
const response = await fetch('/ecommerce/recommendations/cross-sell', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwt_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    connection_id: 1,
    product_id: '123',
    limit: 5,
    lookback_days: 30
  })
});

const recommendations = await response.json();
```

### Webhook Integration (Future)
- Real-time recommendation updates
- Cache invalidation triggers  
- Performance analytics callbacks

## Future Enhancements

### Phase 4: HTML Components
- Pre-built recommendation widgets
- Customizable styling and layouts
- Embedded tracking and analytics
- Mobile-responsive designs

### Advanced Analytics
- Click-through rate tracking
- Conversion rate optimization
- A/B testing for recommendation algorithms
- Revenue attribution reporting

### Additional Platforms
- BigCommerce support
- Custom database connectors
- API-based platform integrations
- Multi-platform consolidation

## Development Notes

### Dependencies
- FastAPI for API framework
- SQLAlchemy for database ORM
- asyncpg for PostgreSQL async connections
- aiomysql for MySQL async connections
- Pydantic for data validation
- cryptography for credential encryption

### Testing
- Unit tests for all recommendation algorithms
- Integration tests for database connections
- Mock database testing for each platform
- Performance benchmarking

### Deployment
- Docker containerization
- Environment-based configuration
- Health check endpoints
- Monitoring and logging integration

---

*This documentation describes the complete ecommerce recommendation engine implementation as part of the FinPy API SaaS platform.*