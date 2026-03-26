import { z } from 'zod';

// ==========================================
// Enums & Types
// ==========================================
export const subscriptionStatusEnum = z.enum(['ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'TRIALING']);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;

// ==========================================
// Entity Schemas
// ==========================================
export const PriceSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  interval: z.string().nullable(),
  interval_count: z.number().nullable(),
  trial_period_days: z.number().nullable(),
  features: z.array(z.string()).nullable(),
  tier: z.string().optional(),
  tier_order: z.number().optional(),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  features: z.array(z.string()),
  defaultPriceId: z.string().nullable(),
  metadata: z.record(z.any()),
});

export const SubscriptionSchema = z.object({
  id: z.string(),
  stripe_customer_id: z.string().nullable(),
  stripe_subscription_id: z.string().nullable(),
  stripe_product_id: z.string().nullable(),
  plan_name: z.string().nullable(),
  subscription_status: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
});

// ==========================================
// Input Schemas
// ==========================================
export const CreateCheckoutSessionSchema = z.object({
  price_id: z.string().min(1, 'Price ID is required'),
});

export const CreateCustomerSchema = z.object({
  email: z.string().email('Valid email is required').optional(),
});

// ==========================================
// Type Exports
// ==========================================
export type Price = z.infer<typeof PriceSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

// ==========================================
// Response Types
// ==========================================
export type SubscriptionPlansResponse = {
  success: boolean;
  data?: { prices: Price[]; products: Product[] };
  error?: string;
};

export type SubscriptionInfoResponse = {
  success: boolean;
  data?: Subscription;
  error?: string;
};

export type UrlResponse = {
  success: boolean;
  url?: string;
  error?: string;
};

export type MessageResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

// ==========================================
// Context Type
// ==========================================
export interface SubscriptionContextType {
  plans: { prices: Price[]; products: Product[] } | null;
  currentSubscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  initialize: () => Promise<void>;
  fetchPlans: () => Promise<boolean>;
  fetchCurrentSubscription: (organizationId: number) => Promise<boolean>;
  createCheckoutSession: (priceId: string, organizationId?: number) => Promise<string | null>;
  createCustomerPortalSession: () => Promise<string | null>;
  createCustomer: (email?: string) => Promise<boolean>;
  clearError: () => void;
}
