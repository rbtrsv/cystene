/**
 * Display formatting utilities for the ecommerce module
 *
 * Maps backend enum values (snake_case) to human-readable labels.
 * Decouples database identifiers from UI presentation.
 *
 * Backend source: /server/apps/ecommerce/schemas/ecommerce_connection_schemas.py
 */

import type { PlatformType, ConnectionMethod } from '../schemas/ecommerce-connections.schemas';

// ==========================================
// Platform Labels
// ==========================================

/** Human-readable labels for PlatformType enum values */
const PLATFORM_LABELS: Record<PlatformType, string> = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  magento: 'Magento',
  custom_integration: 'Custom Integration',
};

/**
 * Returns a human-readable label for a platform type.
 * Prevents raw snake_case values from leaking into the UI.
 */
export function getPlatformLabel(platform: PlatformType): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

// ==========================================
// Connection Method Labels
// ==========================================

/** Human-readable labels for ConnectionMethod enum values */
const CONNECTION_METHOD_LABELS: Record<ConnectionMethod, string> = {
  api: 'API',
  database: 'Database',
  ingest: 'Ingest',
};

/**
 * Returns a human-readable label for a connection method.
 * Prevents raw enum values from leaking into the UI.
 */
export function getConnectionMethodLabel(method: ConnectionMethod): string {
  return CONNECTION_METHOD_LABELS[method] ?? method;
}
