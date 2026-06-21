'use client';

/**
 * Feedback Service
 *
 * List / detail / create / admin-update / delete for in-app feedback.
 * Non-admins only ever see their own; admins see all (enforced server-side).
 *
 * Backend: /server/apps/cybersecurity/subrouters/feedback_subrouter.py
 */

import {
  FeedbackResponse,
  FeedbacksResponse,
  FeedbackMessageResponse,
  CreateFeedback,
  UpdateFeedbackContent,
  UpdateFeedback,
  CreateFeedbackSchema,
  UpdateFeedbackContentSchema,
  UpdateFeedbackSchema,
  FeedbackStatus,
} from '../../schemas/shared/feedback.schemas';
import { FEEDBACK_ENDPOINTS } from '../../utils/api.endpoints';
import { fetchClient } from '../../../accounts/utils/fetch.client';

// Type for errors thrown by fetchClient
interface FetchError extends Error {
  status?: number;
}

/**
 * Query parameters for listing feedback
 */
export interface ListFeedbackParams {
  status?: FeedbackStatus;
}

/**
 * Fetch feedback the user can see (own for members, all for admins)
 * @param params Optional status filter
 * @returns Promise with feedback list response
 */
export const getFeedbackList = async (params?: ListFeedbackParams): Promise<FeedbacksResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);

    const url = `${FEEDBACK_ENDPOINTS.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // FastAPI returns full response wrapper {success, data, count, error}
    const response = await fetchClient<FeedbacksResponse>(url, {
      method: 'GET',
    });

    return response;
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch feedback',
      data: [],
    };
  }
};

/**
 * Fetch a single feedback item by ID (owner or admin only, enforced server-side)
 * @param id Feedback ID
 * @returns Promise with feedback response
 */
export const getFeedback = async (id: number): Promise<FeedbackResponse> => {
  try {
    const response = await fetchClient<FeedbackResponse>(FEEDBACK_ENDPOINTS.DETAIL(id), {
      method: 'GET',
    });

    return response;
  } catch (error) {
    if ((error as FetchError)?.status === 401) {
      const { clearAuthCookies } = await import('../../../accounts/utils/token.client.utils');
      clearAuthCookies();
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to fetch feedback ${id}`,
    };
  }
};

/**
 * Submit new feedback (any authenticated user)
 * @param data Feedback create payload
 * @returns Promise with feedback response
 */
export const createFeedback = async (data: CreateFeedback): Promise<FeedbackResponse> => {
  try {
    // Validate against the Zod schema before sending (parity with the backend Pydantic schema)
    CreateFeedbackSchema.parse(data);

    const response = await fetchClient<FeedbackResponse>(FEEDBACK_ENDPOINTS.CREATE, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit feedback',
    };
  }
};

/**
 * Edit feedback CONTENT (category/title/description) — submitter or admin (enforced server-side)
 * @param id Feedback ID
 * @param data Content update payload
 * @returns Promise with feedback response
 */
export const updateFeedback = async (id: number, data: UpdateFeedbackContent): Promise<FeedbackResponse> => {
  try {
    UpdateFeedbackContentSchema.parse(data);

    const response = await fetchClient<FeedbackResponse>(FEEDBACK_ENDPOINTS.UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to update feedback ${id}`,
    };
  }
};

/**
 * Admin triage update — status + admin_notes only (admin enforced server-side via /admin route)
 * @param id Feedback ID
 * @param data Triage update payload
 * @returns Promise with feedback response
 */
export const adminUpdateFeedback = async (id: number, data: UpdateFeedback): Promise<FeedbackResponse> => {
  try {
    UpdateFeedbackSchema.parse(data);

    const response = await fetchClient<FeedbackResponse>(FEEDBACK_ENDPOINTS.ADMIN_UPDATE(id), {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to triage feedback ${id}`,
    };
  }
};

/**
 * Delete feedback (soft delete; admin any, owner only while status='open')
 * @param id Feedback ID
 * @returns Promise with message response
 */
export const deleteFeedback = async (id: number): Promise<FeedbackMessageResponse> => {
  try {
    const response = await fetchClient<FeedbackMessageResponse>(FEEDBACK_ENDPOINTS.DELETE(id), {
      method: 'DELETE',
    });

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to delete feedback ${id}`,
    };
  }
};
