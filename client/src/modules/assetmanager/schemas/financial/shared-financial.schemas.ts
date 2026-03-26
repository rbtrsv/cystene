/**
 * Shared Financial Schemas
 *
 * Reusable enums and dropdown options shared across all financial models.
 * Scenario values match backend: String(20), default="actual" — 'actual', 'forecast', 'budget'
 *
 * Backend sources:
 * - Model: /server/apps/assetmanager/models/financial_models.py
 */

import { z } from 'zod';

// ==========================================
// Enums
// ==========================================

/**
 * Scenario enum — matches backend String(20) with known values
 * Backend: scenario: Mapped[str] = mapped_column(String(20), default="actual", nullable=False)
 */
export const ScenarioEnum = z.enum(['actual', 'forecast', 'budget']);

/** Inferred type for scenario */
export type ScenarioType = z.infer<typeof ScenarioEnum>;

// ==========================================
// Label Helpers
// ==========================================

/** Human-readable labels for scenarios */
export const SCENARIO_LABELS: Record<ScenarioType, string> = {
  actual: 'Actual',
  forecast: 'Forecast',
  budget: 'Budget',
};

/**
 * Get human-readable label for a scenario
 * @param scenario Scenario enum value
 * @returns Display label string
 */
export const getScenarioLabel = (scenario: string): string => {
  return SCENARIO_LABELS[scenario as ScenarioType] || scenario;
};

// ==========================================
// Dropdown Options
// ==========================================

/**
 * Scenario dropdown options
 * Labels are capitalized for display, values are lowercase matching backend
 */
export const SCENARIO_OPTIONS = [
  { value: 'actual', label: 'Actual' },
  { value: 'forecast', label: 'Forecast' },
  { value: 'budget', label: 'Budget' },
] as const;

/**
 * Quarter dropdown options
 */
export const QUARTER_OPTIONS = [
  { value: 'Q1', label: 'Q1' },
  { value: 'Q2', label: 'Q2' },
  { value: 'Q3', label: 'Q3' },
  { value: 'Q4', label: 'Q4' },
] as const;

/**
 * Semester dropdown options
 */
export const SEMESTER_OPTIONS = [
  { value: 'H1', label: 'H1' },
  { value: 'H2', label: 'H2' },
] as const;

/**
 * Month dropdown options
 */
export const MONTH_OPTIONS = [
  { value: 'January', label: 'January' },
  { value: 'February', label: 'February' },
  { value: 'March', label: 'March' },
  { value: 'April', label: 'April' },
  { value: 'May', label: 'May' },
  { value: 'June', label: 'June' },
  { value: 'July', label: 'July' },
  { value: 'August', label: 'August' },
  { value: 'September', label: 'September' },
  { value: 'October', label: 'October' },
  { value: 'November', label: 'November' },
  { value: 'December', label: 'December' },
] as const;
