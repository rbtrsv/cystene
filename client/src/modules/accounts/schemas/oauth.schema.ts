import { z } from 'zod';

// ==========================================
// Entity Schemas
// ==========================================

/**
 * OAuth User schema - user data from OAuth provider
 */
export const OAuthUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  email_verified: z.boolean(),
});

/**
 * Google Callback response schema - matches backend POST /oauth/google/callback  
 */
export const GoogleCallbackSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().default('bearer'),
  user: OAuthUserSchema,
});

// ==========================================
// Type Exports
// ==========================================
export type OAuthUser = z.infer<typeof OAuthUserSchema>;
export type GoogleCallback = z.infer<typeof GoogleCallbackSchema>;