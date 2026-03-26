/**
 * Security Form Schemas
 *
 * Dynamic form configuration for security create/edit forms.
 * Defines tabs, fields, and visibility rules based on security type.
 * All field names use snake_case matching our backend API.
 *
 * Adapted from v7capital security-form.schemas.ts pattern.
 *
 * Backend source:
 * - Schema: /server/apps/assetmanager/schemas/captable_schemas/security_schemas.py
 */

import {
  SecurityTypeEnum,
  CurrencyEnum,
  AntiDilutionTypeEnum,
  InterestRateTypeEnum,
  type SecurityType,
} from './security.schemas';

// ==========================================
// Enum-to-Record Helpers
// ==========================================

/**
 * Convert Zod enum to a Record for form select options
 */
function enumToRecord<T extends string>(enumObj: { enum: Record<string, T> }): Record<T, T> {
  return Object.values(enumObj.enum).reduce((acc, value) => {
    acc[value] = value;
    return acc;
  }, {} as Record<T, T>);
}

// Create constants from the Zod enums for form select options
export const SECURITY_TYPES = enumToRecord(SecurityTypeEnum);
export const CURRENCIES = enumToRecord(CurrencyEnum);
export const ANTI_DILUTION_TYPES = enumToRecord(AntiDilutionTypeEnum);
export const INTEREST_RATE_TYPES = enumToRecord(InterestRateTypeEnum);

// ==========================================
// Field Types
// ==========================================

/**
 * Field types for form rendering
 */
export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  CHECKBOX = 'checkbox',
  SELECT = 'select',
  TEXTAREA = 'textarea',
  DATE = 'date',
}

// ==========================================
// Configuration Interfaces
// ==========================================

/**
 * Field configuration interface
 */
export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: Record<string, string>;
  step?: string;
  securityTypes: SecurityType[];
  required?: boolean;
}

/**
 * Tab configuration interface
 */
export interface TabConfig {
  id: string;
  label: string;
  securityTypes: SecurityType[];
}

// ==========================================
// All security types shorthand
// ==========================================

const ALL_TYPES: SecurityType[] = Object.values(SECURITY_TYPES) as SecurityType[];

// ==========================================
// Tabs Configuration
// ==========================================

/**
 * Tabs configuration - defines which tabs are visible for each security type
 */
export const SECURITY_FORM_TABS: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    securityTypes: ALL_TYPES,
  },
  {
    id: 'stock',
    label: 'Stock Details',
    securityTypes: ['common', 'preferred'] as SecurityType[],
  },
  {
    id: 'convertible',
    label: 'Convertible Details',
    securityTypes: ['convertible', 'safe'] as SecurityType[],
  },
  {
    id: 'option',
    label: 'Option Details',
    securityTypes: ['option'] as SecurityType[],
  },
  {
    id: 'warrant',
    label: 'Warrant Details',
    securityTypes: ['warrant'] as SecurityType[],
  },
  {
    id: 'bond',
    label: 'Bond Details',
    securityTypes: ['bond'] as SecurityType[],
  },
];

// ==========================================
// General Tab Field Names
// ==========================================

/**
 * Field names that belong to the general tab (always visible)
 */
const GENERAL_FIELD_NAMES = [
  'security_name',
  'code',
  'funding_round_id',
  'security_type',
  'currency',
  'issue_price',
  'special_terms',
];

// ==========================================
// Field Configurations
// ==========================================

/**
 * Field configurations for the security form
 * Each field specifies which security types it applies to
 */
export const SECURITY_FORM_FIELDS: FieldConfig[] = [
  // ---- General Tab Fields ----
  {
    name: 'security_name',
    label: 'Security Name',
    type: FieldType.TEXT,
    placeholder: 'Enter security name',
    securityTypes: ALL_TYPES,
    required: true,
  },
  {
    name: 'code',
    label: 'Code',
    type: FieldType.TEXT,
    placeholder: 'Enter security code',
    securityTypes: ALL_TYPES,
    required: true,
  },
  {
    name: 'funding_round_id',
    label: 'Funding Round',
    type: FieldType.SELECT,
    placeholder: 'Select a funding round',
    securityTypes: ALL_TYPES,
    required: true,
  },
  {
    name: 'security_type',
    label: 'Security Type',
    type: FieldType.SELECT,
    options: SECURITY_TYPES,
    securityTypes: ALL_TYPES,
    required: true,
  },
  {
    name: 'currency',
    label: 'Currency',
    type: FieldType.SELECT,
    options: CURRENCIES,
    securityTypes: ALL_TYPES,
  },
  {
    name: 'issue_price',
    label: 'Issue Price',
    type: FieldType.NUMBER,
    placeholder: 'Enter issue price',
    step: '0.01',
    securityTypes: ALL_TYPES,
  },
  {
    name: 'special_terms',
    label: 'Special Terms',
    type: FieldType.TEXTAREA,
    placeholder: 'Enter any special terms',
    securityTypes: ALL_TYPES,
  },

  // ---- Stock Tab Fields (Common Shares) ----
  {
    name: 'has_voting_rights',
    label: 'Has Voting Rights',
    type: FieldType.CHECKBOX,
    securityTypes: ['common', 'preferred'] as SecurityType[],
  },
  {
    name: 'voting_ratio',
    label: 'Voting Ratio',
    type: FieldType.NUMBER,
    placeholder: 'Enter voting ratio',
    step: '0.01',
    securityTypes: ['common', 'preferred'] as SecurityType[],
  },

  // ---- Stock Tab Fields (Preferred Shares) ----
  {
    name: 'is_preferred',
    label: 'Is Preferred',
    type: FieldType.CHECKBOX,
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'has_dividend_rights',
    label: 'Has Dividend Rights',
    type: FieldType.CHECKBOX,
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'dividend_rate',
    label: 'Dividend Rate',
    type: FieldType.NUMBER,
    placeholder: 'Enter dividend rate',
    step: '0.01',
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'is_dividend_cumulative',
    label: 'Is Dividend Cumulative',
    type: FieldType.CHECKBOX,
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'liquidation_preference',
    label: 'Liquidation Preference',
    type: FieldType.NUMBER,
    placeholder: 'Enter liquidation preference',
    step: '0.01',
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'has_participation',
    label: 'Has Participation',
    type: FieldType.CHECKBOX,
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'participation_cap',
    label: 'Participation Cap',
    type: FieldType.NUMBER,
    placeholder: 'Enter participation cap',
    step: '0.01',
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'seniority',
    label: 'Seniority',
    type: FieldType.NUMBER,
    placeholder: 'Enter seniority level',
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'anti_dilution',
    label: 'Anti-Dilution',
    type: FieldType.SELECT,
    options: ANTI_DILUTION_TYPES,
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'has_conversion_rights',
    label: 'Has Conversion Rights',
    type: FieldType.CHECKBOX,
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'conversion_ratio',
    label: 'Conversion Ratio',
    type: FieldType.NUMBER,
    placeholder: 'Enter conversion ratio',
    step: '0.0001',
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'has_redemption_rights',
    label: 'Has Redemption Rights',
    type: FieldType.CHECKBOX,
    securityTypes: ['preferred'] as SecurityType[],
  },
  {
    name: 'redemption_term',
    label: 'Redemption Term (months)',
    type: FieldType.NUMBER,
    placeholder: 'Enter redemption term in months',
    securityTypes: ['preferred'] as SecurityType[],
  },

  // ---- Convertible Tab Fields ----
  {
    name: 'interest_rate',
    label: 'Interest Rate',
    type: FieldType.NUMBER,
    placeholder: 'Enter interest rate',
    step: '0.01',
    securityTypes: ['convertible'] as SecurityType[],
  },
  {
    name: 'interest_rate_type',
    label: 'Interest Rate Type',
    type: FieldType.SELECT,
    options: INTEREST_RATE_TYPES,
    securityTypes: ['convertible'] as SecurityType[],
  },
  {
    name: 'interest_period',
    label: 'Interest Period',
    type: FieldType.TEXT,
    placeholder: 'e.g., Monthly, Quarterly',
    securityTypes: ['convertible'] as SecurityType[],
  },
  {
    name: 'maturity_date',
    label: 'Maturity Date',
    type: FieldType.DATE,
    securityTypes: ['convertible', 'bond'] as SecurityType[],
  },
  {
    name: 'valuation_cap',
    label: 'Valuation Cap',
    type: FieldType.NUMBER,
    placeholder: 'Enter valuation cap',
    step: '0.01',
    securityTypes: ['convertible', 'safe'] as SecurityType[],
  },
  {
    name: 'conversion_discount',
    label: 'Conversion Discount',
    type: FieldType.NUMBER,
    placeholder: 'Enter conversion discount',
    step: '0.01',
    securityTypes: ['convertible', 'safe'] as SecurityType[],
  },
  {
    name: 'conversion_basis',
    label: 'Conversion Basis',
    type: FieldType.TEXT,
    placeholder: 'Enter conversion basis',
    securityTypes: ['convertible', 'safe'] as SecurityType[],
  },

  // ---- Option Tab Fields ----
  {
    name: 'option_type',
    label: 'Option Type',
    type: FieldType.TEXT,
    placeholder: 'e.g., esop, vsop, sar',
    securityTypes: ['option'] as SecurityType[],
    required: true,
  },
  {
    name: 'vesting_start',
    label: 'Vesting Start Date',
    type: FieldType.DATE,
    securityTypes: ['option'] as SecurityType[],
  },
  {
    name: 'vesting_months',
    label: 'Vesting Months',
    type: FieldType.NUMBER,
    placeholder: 'Enter vesting period in months',
    securityTypes: ['option'] as SecurityType[],
  },
  {
    name: 'cliff_months',
    label: 'Cliff Months',
    type: FieldType.NUMBER,
    placeholder: 'Enter cliff period in months',
    securityTypes: ['option'] as SecurityType[],
  },
  {
    name: 'vesting_schedule_type',
    label: 'Vesting Schedule Type',
    type: FieldType.TEXT,
    placeholder: 'Enter vesting schedule type',
    securityTypes: ['option'] as SecurityType[],
  },
  {
    name: 'exercise_window_days',
    label: 'Exercise Window (Days)',
    type: FieldType.NUMBER,
    placeholder: 'Enter exercise window in days',
    securityTypes: ['option', 'warrant'] as SecurityType[],
  },
  {
    name: 'strike_price',
    label: 'Strike Price',
    type: FieldType.NUMBER,
    placeholder: 'Enter strike price',
    step: '0.01',
    securityTypes: ['option', 'warrant'] as SecurityType[],
  },
  {
    name: 'expiration_date',
    label: 'Expiration Date',
    type: FieldType.DATE,
    securityTypes: ['option', 'warrant'] as SecurityType[],
  },
  {
    name: 'termination_date',
    label: 'Termination Date',
    type: FieldType.DATE,
    securityTypes: ['option'] as SecurityType[],
  },
  {
    name: 'pool_name',
    label: 'Pool Name',
    type: FieldType.TEXT,
    placeholder: 'Enter pool name',
    securityTypes: ['option'] as SecurityType[],
  },
  {
    name: 'pool_size',
    label: 'Pool Size',
    type: FieldType.NUMBER,
    placeholder: 'Enter pool size',
    step: '0.01',
    securityTypes: ['option'] as SecurityType[],
  },
  {
    name: 'pool_available',
    label: 'Pool Available',
    type: FieldType.NUMBER,
    placeholder: 'Enter available pool',
    step: '0.01',
    securityTypes: ['option'] as SecurityType[],
  },
  {
    name: 'is_active',
    label: 'Is Active',
    type: FieldType.CHECKBOX,
    securityTypes: ['option'] as SecurityType[],
  },

  // ---- Warrant Tab Fields ----
  {
    name: 'warrant_type',
    label: 'Warrant Type',
    type: FieldType.TEXT,
    placeholder: 'Enter warrant type',
    securityTypes: ['warrant'] as SecurityType[],
    required: true,
  },
  {
    name: 'is_detachable',
    label: 'Is Detachable',
    type: FieldType.CHECKBOX,
    securityTypes: ['warrant'] as SecurityType[],
  },
  {
    name: 'deal_context',
    label: 'Deal Context',
    type: FieldType.TEXT,
    placeholder: 'e.g., Series A warrant, Bridge warrant',
    securityTypes: ['warrant'] as SecurityType[],
  },
  {
    name: 'is_transferable',
    label: 'Is Transferable',
    type: FieldType.CHECKBOX,
    securityTypes: ['warrant'] as SecurityType[],
  },

  // ---- Shared Option/Warrant Fields ----
  {
    name: 'total_shares',
    label: 'Total Shares',
    type: FieldType.NUMBER,
    placeholder: 'Enter total shares',
    step: '0.01',
    securityTypes: ['option', 'warrant'] as SecurityType[],
  },
  {
    name: 'issue_rights',
    label: 'Issue Rights',
    type: FieldType.TEXT,
    placeholder: 'Enter issue rights',
    securityTypes: ['option', 'warrant'] as SecurityType[],
  },
  {
    name: 'convert_to',
    label: 'Convert To',
    type: FieldType.TEXT,
    placeholder: 'Enter security to convert to',
    securityTypes: ['option', 'warrant'] as SecurityType[],
  },

  // ---- Bond Tab Fields ----
  {
    name: 'principal',
    label: 'Principal',
    type: FieldType.NUMBER,
    placeholder: 'Enter principal amount',
    step: '0.01',
    securityTypes: ['bond'] as SecurityType[],
  },
  {
    name: 'coupon_rate',
    label: 'Coupon Rate',
    type: FieldType.NUMBER,
    placeholder: 'Enter coupon rate',
    step: '0.01',
    securityTypes: ['bond'] as SecurityType[],
  },
  {
    name: 'coupon_frequency',
    label: 'Coupon Frequency',
    type: FieldType.TEXT,
    placeholder: 'Enter coupon frequency',
    securityTypes: ['bond'] as SecurityType[],
  },
  {
    name: 'principal_frequency',
    label: 'Principal Frequency',
    type: FieldType.TEXT,
    placeholder: 'Enter principal frequency',
    securityTypes: ['bond'] as SecurityType[],
  },
  {
    name: 'tenure_months',
    label: 'Tenure (Months)',
    type: FieldType.NUMBER,
    placeholder: 'Enter tenure in months',
    securityTypes: ['bond'] as SecurityType[],
  },
  {
    name: 'moratorium_period',
    label: 'Moratorium Period',
    type: FieldType.NUMBER,
    placeholder: 'Enter moratorium period',
    securityTypes: ['bond'] as SecurityType[],
  },
];

// ==========================================
// Helper Functions
// ==========================================

/**
 * Get the tab ID for a field based on its security type
 * @param field Field configuration
 * @param securityType Current security type
 * @returns Tab ID string
 */
function getTabForField(field: FieldConfig, securityType: SecurityType): string {
  // General tab fields
  if (GENERAL_FIELD_NAMES.includes(field.name)) {
    return 'general';
  }

  // Stock types
  const stockTypes: SecurityType[] = ['common', 'preferred'];
  if (stockTypes.includes(securityType) && field.securityTypes.some(type => stockTypes.includes(type))) {
    return 'stock';
  }

  // Convertible/SAFE types
  const convertibleTypes: SecurityType[] = ['convertible', 'safe'];
  if (convertibleTypes.includes(securityType) && field.securityTypes.some(type => convertibleTypes.includes(type))) {
    return 'convertible';
  }

  // Option type
  if (securityType === 'option' && field.securityTypes.includes('option')) {
    return 'option';
  }

  // Warrant type
  if (securityType === 'warrant' && field.securityTypes.includes('warrant')) {
    return 'warrant';
  }

  // Bond type
  if (securityType === 'bond' && field.securityTypes.includes('bond')) {
    return 'bond';
  }

  return '';
}

/**
 * Get fields for a specific tab and security type
 * @param tabId Tab ID to get fields for
 * @param securityType Current security type
 * @returns Array of field configurations for the tab
 */
export function getFieldsForTab(tabId: string, securityType: SecurityType): FieldConfig[] {
  return SECURITY_FORM_FIELDS.filter(field => {
    // For general tab, include only general field names
    if (tabId === 'general') {
      return field.securityTypes.includes(securityType) &&
             GENERAL_FIELD_NAMES.includes(field.name);
    }

    // For other tabs, include fields that match the security type and belong to this tab
    return field.securityTypes.includes(securityType) &&
           !GENERAL_FIELD_NAMES.includes(field.name) &&
           getTabForField(field, securityType) === tabId;
  });
}

/**
 * Get visible tabs for a security type
 * @param securityType Current security type
 * @returns Array of tab configurations visible for this type
 */
export function getVisibleTabs(securityType: SecurityType): TabConfig[] {
  return SECURITY_FORM_TABS.filter(tab => tab.securityTypes.includes(securityType));
}
