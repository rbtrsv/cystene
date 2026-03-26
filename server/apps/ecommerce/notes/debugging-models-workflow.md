# Debugging & Updating Models Workflow

## Quick Process for When Connections Fail

### 1. Test Connection
```bash
POST /ecommerce/connections/{id}/test
```

### 2. Check Response for Table Info
Look for table exploration data in the message:
```json
{
  "message": "Connection successful! | HPOS tables: ['wp_wc_orders'] | Legacy tables: ['wp_woocommerce_order_items']"
}
```

### 3. Compare with Adapter Queries
- **WooCommerce**: Check `apps/ecommerce/adapters/woocommerce.py`
- **Magento**: Check `apps/ecommerce/adapters/magento.py` 
- **Shopify**: Uses API (no table issues)

### 4. Update Models if Tables Don't Match
**Example - WooCommerce HPOS Update:**
```sql
-- Old (broken):
FROM woocommerce_order_items oi

-- New (working):  
FROM wp_wc_order_product_lookup opl
```

### 5. Test Again
Re-run connection test to verify fix.

## Table Patterns by Platform

**WooCommerce:**
- Modern: `wp_wc_*` (HPOS tables)
- Legacy: `wp_woocommerce_*`

**Magento:**
- Sales: `sales_*`
- Catalog: `catalog_*`
- Quotes: `quote_*`

**Shopify:**
- Uses API (shows "uses API access" message)

## When Models Need Updates

1. **Missing tables error** → Check if table names changed
2. **SQL syntax error** → Check PostgreSQL vs MySQL syntax
3. **Empty results** → Check table structure/column names
4. **Connection fails** → Check database access/credentials