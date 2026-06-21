import { z } from 'zod';

// ==========================================
// Enums (mirror backend feedback_schemas.py)
// ==========================================

// Why strict enums: prevent casing/typo bugs and keep parity with the Pydantic enums.
export const FeedbackCategorySchema = z.enum(['bug', 'improvement', 'feature', 'question', 'other']);
export const FeedbackStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed']);

// ==========================================
// Full Schema (GET responses)
// ==========================================

// Matches backend FeedbackDetail. user_email/user_name are enriched server-side from
// accounts.User on created_by (so the admin sees who submitted without a second request).
export const FeedbackSchema = z.object({
  id: z.number(),
  category: FeedbackCategorySchema,
  status: FeedbackStatusSchema,
  title: z.string(),
  description: z.string(),
  page_url: z.string().nullable(),
  admin_notes: z.string().nullable(),
  organization_id: z.number().nullable(),
  created_by: z.number().nullable(),
  user_email: z.string().nullable(),
  user_name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

// ==========================================
// Input Schemas (POST/PUT)
// ==========================================

// Submit feedback (any authenticated user). page_url is auto-captured by the page.
export const CreateFeedbackSchema = z.object({
  category: FeedbackCategorySchema,
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  page_url: z.string().nullable().optional(),
});

// Owner/admin content edit — category/title/description (mirrors backend FeedbackContentUpdate).
export const UpdateFeedbackContentSchema = z.object({
  category: FeedbackCategorySchema.optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
});

// Admin triage only — status + internal notes (mirrors backend FeedbackUpdate).
export const UpdateFeedbackSchema = z.object({
  status: FeedbackStatusSchema.optional(),
  admin_notes: z.string().nullable().optional(),
});

// ==========================================
// Types
// ==========================================

export type FeedbackCategory = z.infer<typeof FeedbackCategorySchema>;
export type FeedbackStatus = z.infer<typeof FeedbackStatusSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type CreateFeedback = z.infer<typeof CreateFeedbackSchema>;
export type UpdateFeedbackContent = z.infer<typeof UpdateFeedbackContentSchema>;
export type UpdateFeedback = z.infer<typeof UpdateFeedbackSchema>;

// ==========================================
// Labels (UI display)
// ==========================================

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  improvement: 'Improvement',
  feature: 'Feature Request',
  question: 'Question',
  other: 'Other',
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const getFeedbackCategoryLabel = (category: string): string =>
  FEEDBACK_CATEGORY_LABELS[category as FeedbackCategory] || category;

export const getFeedbackStatusLabel = (status: string): string =>
  FEEDBACK_STATUS_LABELS[status as FeedbackStatus] || status;

// ==========================================
// Response Types (FastAPI wrapper { success, data, count, error })
// ==========================================

export type FeedbackResponse = {
  success: boolean;
  data?: Feedback;
  error?: string;
};

export type FeedbacksResponse = {
  success: boolean;
  data?: Feedback[];
  count?: number;
  error?: string;
};

export type FeedbackMessageResponse = {
  success: boolean;
  message?: string;
  error?: string;
};
