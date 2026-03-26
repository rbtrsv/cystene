/**
 * API utilities for making requests to the backend
 */

/**
 * Base API URL
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://127.0.0.1:8002';

/**
 * API endpoints for authentication
 */
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/accounts/auth/login`,
  REGISTER: `${API_BASE_URL}/accounts/auth/register`,
  LOGOUT: `${API_BASE_URL}/accounts/auth/logout`,
  ME: `${API_BASE_URL}/accounts/auth/me`,
  REFRESH_TOKEN: `${API_BASE_URL}/accounts/auth/refresh-token`,
  FORGOT_PASSWORD: `${API_BASE_URL}/accounts/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/accounts/auth/reset-password`,
  TEST: `${API_BASE_URL}/accounts/auth/test`,
};

/**
 * API endpoints for OAuth
 */
export const OAUTH_ENDPOINTS = {
  GOOGLE_CALLBACK: `${API_BASE_URL}/accounts/oauth/google/callback`,
};

/**
 * API endpoints for organizations
 */
export const ORGANIZATION_ENDPOINTS = {
  LIST: `${API_BASE_URL}/accounts/organizations/`,
  DETAIL: (id: number) => `${API_BASE_URL}/accounts/organizations/${id}`,
  CREATE: `${API_BASE_URL}/accounts/organizations/`,
  UPDATE: (id: number) => `${API_BASE_URL}/accounts/organizations/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/accounts/organizations/${id}`,
  ROLE: (id: number) => `${API_BASE_URL}/accounts/organizations/${id}/role`,
};

/**
 * API endpoints for organization members
 */
export const MEMBER_ENDPOINTS = {
  LIST: (orgId: number) => `${API_BASE_URL}/accounts/organizations/${orgId}/members`,
  DETAIL: (orgId: number, memberId: number) => `${API_BASE_URL}/accounts/organizations/${orgId}/members/${memberId}`,
  ADD: (orgId: number) => `${API_BASE_URL}/accounts/organizations/${orgId}/members`,
  UPDATE: (orgId: number, memberId: number) => `${API_BASE_URL}/accounts/organizations/${orgId}/members/${memberId}`,
  REMOVE: (orgId: number, memberId: number) => `${API_BASE_URL}/accounts/organizations/${orgId}/members/${memberId}`,
};

/**
 * API endpoints for invitations
 */
export const INVITATION_ENDPOINTS = {
  CREATE: `${API_BASE_URL}/accounts/invitations/`,
  LIST_BY_ORGANIZATION: (orgId: number) => `${API_BASE_URL}/accounts/invitations/organization/${orgId}`,
  LIST_MY_INVITATIONS: `${API_BASE_URL}/accounts/invitations/my-invitations`,
  ACCEPT: (id: number) => `${API_BASE_URL}/accounts/invitations/${id}/accept`,
  REJECT: (id: number) => `${API_BASE_URL}/accounts/invitations/${id}/reject`,
  CANCEL: (id: number) => `${API_BASE_URL}/accounts/invitations/${id}`,
};

/**
 * API endpoints for subscriptions
 */
export const SUBSCRIPTION_ENDPOINTS = {
  PLANS: `${API_BASE_URL}/accounts/subscriptions/plans`,
  CURRENT: (orgId: number) => `${API_BASE_URL}/accounts/subscriptions/organizations/${orgId}`,
  CHECKOUT: `${API_BASE_URL}/accounts/subscriptions/checkout`,
  PORTAL: `${API_BASE_URL}/accounts/subscriptions/portal`,
  CREATE_CUSTOMER: `${API_BASE_URL}/accounts/subscriptions/create-customer`,
};
