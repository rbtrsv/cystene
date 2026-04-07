/**
 * API endpoints for Cybersecurity module
 *
 * All endpoints under /cybersecurity prefix.
 * Matches backend: server/apps/cybersecurity/router.py
 *
 * 9 entities organized in 3 domains:
 * - Infrastructure: Infrastructure, Credential, ScanTarget
 * - Execution: ScanTemplate, ScanSchedule, ScanJob
 * - Discovery: Finding, Asset, Report
 */

/**
 * Base API URL — Cystene server on port 8003
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://127.0.0.1:8003';

// ==========================================
// INFRASTRUCTURE DOMAIN
// ==========================================

/**
 * API endpoints for infrastructure
 * Backend: server/apps/cybersecurity/subrouters/infrastructure_subrouters/infrastructure_subrouter.py
 */
export const INFRASTRUCTURE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/cybersecurity/infrastructure/`,
  DETAIL: (id: number) => `${API_BASE_URL}/cybersecurity/infrastructure/${id}`,
  CREATE: `${API_BASE_URL}/cybersecurity/infrastructure/`,
  UPDATE: (id: number) => `${API_BASE_URL}/cybersecurity/infrastructure/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/cybersecurity/infrastructure/${id}`,
};

/**
 * API endpoints for credentials
 * Backend: server/apps/cybersecurity/subrouters/infrastructure_subrouters/credential_subrouter.py
 */
export const CREDENTIAL_ENDPOINTS = {
  LIST: `${API_BASE_URL}/cybersecurity/credentials/`,
  DETAIL: (id: number) => `${API_BASE_URL}/cybersecurity/credentials/${id}`,
  CREATE: `${API_BASE_URL}/cybersecurity/credentials/`,
  UPDATE: (id: number) => `${API_BASE_URL}/cybersecurity/credentials/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/cybersecurity/credentials/${id}`,
};

/**
 * API endpoints for scan targets
 * Backend: server/apps/cybersecurity/subrouters/infrastructure_subrouters/scan_target_subrouter.py
 */
export const SCAN_TARGET_ENDPOINTS = {
  LIST: `${API_BASE_URL}/cybersecurity/scan-targets/`,
  DETAIL: (id: number) => `${API_BASE_URL}/cybersecurity/scan-targets/${id}`,
  CREATE: `${API_BASE_URL}/cybersecurity/scan-targets/`,
  UPDATE: (id: number) => `${API_BASE_URL}/cybersecurity/scan-targets/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/cybersecurity/scan-targets/${id}`,
  VERIFY: (id: number) => `${API_BASE_URL}/cybersecurity/scan-targets/${id}/verify`,
};

// ==========================================
// EXECUTION DOMAIN
// ==========================================

/**
 * API endpoints for scan templates
 * Backend: server/apps/cybersecurity/subrouters/execution_subrouters/scan_template_subrouter.py
 */
export const SCAN_TEMPLATE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/cybersecurity/scan-templates/`,
  DETAIL: (id: number) => `${API_BASE_URL}/cybersecurity/scan-templates/${id}`,
  CREATE: `${API_BASE_URL}/cybersecurity/scan-templates/`,
  UPDATE: (id: number) => `${API_BASE_URL}/cybersecurity/scan-templates/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/cybersecurity/scan-templates/${id}`,
};

/**
 * API endpoints for scan schedules
 * Backend: server/apps/cybersecurity/subrouters/execution_subrouters/scan_schedule_subrouter.py
 */
export const SCAN_SCHEDULE_ENDPOINTS = {
  LIST: `${API_BASE_URL}/cybersecurity/scan-schedules/`,
  DETAIL: (id: number) => `${API_BASE_URL}/cybersecurity/scan-schedules/${id}`,
  CREATE: `${API_BASE_URL}/cybersecurity/scan-schedules/`,
  UPDATE: (id: number) => `${API_BASE_URL}/cybersecurity/scan-schedules/${id}`,
  DELETE: (id: number) => `${API_BASE_URL}/cybersecurity/scan-schedules/${id}`,
  ACTIVATE: (id: number) => `${API_BASE_URL}/cybersecurity/scan-schedules/${id}/activate`,
  DEACTIVATE: (id: number) => `${API_BASE_URL}/cybersecurity/scan-schedules/${id}/deactivate`,
};

/**
 * API endpoints for scan jobs
 * Backend: server/apps/cybersecurity/subrouters/execution_subrouters/scan_job_subrouter.py
 * No CREATE/UPDATE — jobs are created via START and are immutable once started.
 */
export const SCAN_JOB_ENDPOINTS = {
  LIST: `${API_BASE_URL}/cybersecurity/scan-jobs/`,
  DETAIL: (id: number) => `${API_BASE_URL}/cybersecurity/scan-jobs/${id}`,
  START: `${API_BASE_URL}/cybersecurity/scan-jobs/start`,
  CANCEL: (id: number) => `${API_BASE_URL}/cybersecurity/scan-jobs/${id}/cancel`,
};

// ==========================================
// DISCOVERY DOMAIN
// ==========================================

/**
 * API endpoints for findings
 * Backend: server/apps/cybersecurity/subrouters/discovery_subrouters/finding_subrouter.py
 * No CREATE/DELETE — scanner writes findings. User only updates triage status via PATCH.
 */
export const FINDING_ENDPOINTS = {
  LIST: `${API_BASE_URL}/cybersecurity/findings/`,
  DETAIL: (id: number) => `${API_BASE_URL}/cybersecurity/findings/${id}`,
  UPDATE_STATUS: (id: number) => `${API_BASE_URL}/cybersecurity/findings/${id}/status`,
};

/**
 * API endpoints for assets
 * Backend: server/apps/cybersecurity/subrouters/discovery_subrouters/asset_subrouter.py
 * Read-only — scanner discovers assets, user views them.
 */
export const ASSET_ENDPOINTS = {
  LIST: `${API_BASE_URL}/cybersecurity/assets/`,
  DETAIL: (id: number) => `${API_BASE_URL}/cybersecurity/assets/${id}`,
};

/**
 * API endpoints for reports
 * Backend: server/apps/cybersecurity/subrouters/discovery_subrouters/report_subrouter.py
 */
export const REPORT_ENDPOINTS = {
  LIST: `${API_BASE_URL}/cybersecurity/reports/`,
  DETAIL: (id: number) => `${API_BASE_URL}/cybersecurity/reports/${id}`,
  GENERATE: `${API_BASE_URL}/cybersecurity/reports/generate`,
  DELETE: (id: number) => `${API_BASE_URL}/cybersecurity/reports/${id}`,
};
