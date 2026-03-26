import { z } from 'zod';

// ==========================================
// Tier Enum
// ==========================================

// Why: strict enum prevents casing/typo bugs — matches TIER_ORDER from backend
export const TierSchema = z.enum(["FREE", "PERSONAL", "PRO", "ENTERPRISE"]);

// ==========================================
// Access Permission Schema
// ==========================================

export const AccessPermissionSchema = z.object({
  can_read: z.boolean(),
  can_write: z.boolean(),
  read_tier: TierSchema,
  write_tier: TierSchema,
});

// ==========================================
// Route Permission Schema
// ==========================================

// Why: per-route access used by PageGate and sidebar hints
export const RoutePermissionSchema = z.object({
  can_read: z.boolean(),
  can_write: z.boolean(),
  read_tier: TierSchema,
  write_tier: TierSchema,
  display_name: z.string(),
});

// ==========================================
// Permissions Data Schema (GET response)
// ==========================================

export const PermissionsDataSchema = z.object({
  tier: TierSchema,
  domains: z.record(z.string(), AccessPermissionSchema),
  entities: z.record(z.string(), AccessPermissionSchema),
  routes: z.record(z.string(), RoutePermissionSchema),
});

// ==========================================
// Types
// ==========================================

export type Tier = z.infer<typeof TierSchema>;
export type AccessPermission = z.infer<typeof AccessPermissionSchema>;
export type RoutePermission = z.infer<typeof RoutePermissionSchema>;
export type PermissionsData = z.infer<typeof PermissionsDataSchema>;

// ==========================================
// Response Types
// ==========================================

export type PermissionsResponse = {
  success: boolean;
  data?: PermissionsData;
  error?: string;
};
