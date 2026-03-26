import { z } from 'zod';

/**
 * Message response schema - for simple success/error responses
 */
export const MessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

/**
 * URL response schema - for responses containing URLs
 */
export const UrlResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().optional(),
  error: z.string().optional(),
});
export type UrlResponse = z.infer<typeof UrlResponseSchema>;