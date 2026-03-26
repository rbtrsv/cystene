import { 
  securityTypeEnum,
  currencyEnum,
  antiDilutionTypeEnum,
  interestRateTypeEnum,
  conversionBaseEnum,
  issueRightEnum,
  optionTypeEnum,
  warrantTypeEnum,
  type SecurityType
} from './securities.schemas';

/**
 * Convert Zod enum to a Record for form options
 */
function enumToRecord<T extends string>(enumObj: { enum: Record<string, T> }): Record<T, T> {
  return Object.values(enumObj.enum).reduce((acc, value) => {
    acc[value] = value;
    return acc;
  }, {} as Record<T, T>);
}

// Create constants from the Zod enums
export const SECURITY_TYPES = enumToRecord(securityTypeEnum);
export const CURRENCIES = enumToRecord(currencyEnum);
export const ANTI_DILUTION_TYPES = enumToRecord(antiDilutionTypeEnum);
export const INTEREST_RATE_TYPES = enumToRecord(interestRateTypeEnum);
export const CONVERSION_BASES = enumToRecord(conversionBaseEnum);
export const ISSUE_RIGHTS = enumToRecord(issueRightEnum);
export const OPTION_TYPES = enumToRecord(optionTypeEnum);
export const WARRANT_TYPES = enumToRecord(warrantTypeEnum);

/**
 * Field types for form rendering
 */
export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  CHECKBOX = 'checkbox',
  SELECT = 'select',
  TEXTAREA = 'textarea',
  DATE = 'date'
}

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
  validators?: {
    min?: number;
    max?: number;
    minLength?: number;
    pattern?: RegExp;
  };
}

/**
 * Tab configuration
 */
export interface TabConfig {
  id: string;
  label: string;
  securityTypes: SecurityType[];
}

/**
 * Tabs configuration
 */
export const SECURITY_FORM_TABS: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    securityTypes: Object.values(SECURITY_TYPES) as SecurityType[]
  },
  {
    id: 'stock',
    label: 'Stock Details',
    securityTypes: ['Common Shares', 'Preferred Shares'] as SecurityType[]
  },
  {
    id: 'convertible',
    label: 'Convertible Details',
    securityTypes: ['Convertible'] as SecurityType[]
  },
  {
    id: 'option',
    label: 'Option Details',
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    id: 'warrant',
    label: 'Warrant Details',
    securityTypes: ['Warrant'] as SecurityType[]
  },
  {
    id: 'bond',
    label: 'Bond Details',
    securityTypes: ['Bond'] as SecurityType[]
  }
];

/**
 * Field configurations for the security form
 */
export const SECURITY_FORM_FIELDS: FieldConfig[] = [
  // General Tab Fields
  {
    name: 'securityName',
    label: 'Security Name',
    type: FieldType.TEXT,
    placeholder: 'Enter security name',
    securityTypes: Object.values(SECURITY_TYPES) as SecurityType[],
    required: true,
    validators: {
      minLength: 2
    }
  },
  {
    name: 'code',
    label: 'Code',
    type: FieldType.TEXT,
    placeholder: 'Enter security code',
    securityTypes: Object.values(SECURITY_TYPES) as SecurityType[],
    required: true
  },
  {
    name: 'roundId',
    label: 'Round',
    type: FieldType.SELECT,
    placeholder: 'Select a round',
    securityTypes: Object.values(SECURITY_TYPES) as SecurityType[],
    required: true
  },
  {
    name: 'securityType',
    label: 'Security Type',
    type: FieldType.SELECT,
    options: SECURITY_TYPES,
    securityTypes: Object.values(SECURITY_TYPES) as SecurityType[],
    required: true
  },
  {
    name: 'currency',
    label: 'Currency',
    type: FieldType.SELECT,
    options: CURRENCIES,
    securityTypes: Object.values(SECURITY_TYPES) as SecurityType[]
  },
  {
    name: 'issuePrice',
    label: 'Issue Price',
    type: FieldType.NUMBER,
    placeholder: 'Enter issue price',
    step: '0.01',
    securityTypes: Object.values(SECURITY_TYPES) as SecurityType[]
  },
  {
    name: 'specialTerms',
    label: 'Special Terms',
    type: FieldType.TEXTAREA,
    placeholder: 'Enter any special terms',
    securityTypes: Object.values(SECURITY_TYPES) as SecurityType[]
  },
  {
    name: 'lockupMonths',
    label: 'Lockup Period (months)',
    type: FieldType.NUMBER,
    placeholder: 'Leave empty for no lockup',
    securityTypes: Object.values(SECURITY_TYPES) as SecurityType[],
    validators: { min: 1 }
  },

  // Common Shares Fields
  {
    name: 'hasVotingRights',
    label: 'Has Voting Rights',
    type: FieldType.CHECKBOX,
    securityTypes: ['Common Shares'] as SecurityType[]
  },
  {
    name: 'votingRatio',
    label: 'Voting Ratio',
    type: FieldType.NUMBER,
    placeholder: 'Enter voting ratio',
    step: '0.01',
    securityTypes: ['Common Shares'] as SecurityType[]
  },
  
  // Preferred Shares Fields
  {
    name: 'hasVotingRights',
    label: 'Has Voting Rights',
    type: FieldType.CHECKBOX,
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'votingRatio',
    label: 'Voting Ratio',
    type: FieldType.NUMBER,
    placeholder: 'Enter voting ratio',
    step: '0.01',
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'hasDividendRights',
    label: 'Has Dividend Rights',
    type: FieldType.CHECKBOX,
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'dividendRate',
    label: 'Dividend Rate',
    type: FieldType.NUMBER,
    placeholder: 'Enter dividend rate',
    step: '0.01',
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  
  // Preferred Shares Only Fields
  {
    name: 'liquidationPreference',
    label: 'Liquidation Preference',
    type: FieldType.NUMBER,
    placeholder: 'Enter liquidation preference',
    step: '0.01',
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'hasParticipation',
    label: 'Has Participation',
    type: FieldType.CHECKBOX,
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'participationCap',
    label: 'Participation Cap',
    type: FieldType.NUMBER,
    placeholder: 'Enter participation cap',
    step: '0.01',
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'seniority',
    label: 'Seniority',
    type: FieldType.NUMBER,
    placeholder: 'Enter seniority',
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'antiDilution',
    label: 'Anti-Dilution',
    type: FieldType.SELECT,
    options: ANTI_DILUTION_TYPES,
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'isDividendCumulative',
    label: 'Is Dividend Cumulative',
    type: FieldType.CHECKBOX,
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'hasConversionRights',
    label: 'Has Conversion Rights',
    type: FieldType.CHECKBOX,
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'conversionRatio',
    label: 'Conversion Ratio',
    type: FieldType.NUMBER,
    placeholder: 'Enter conversion ratio',
    step: '0.0001',
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'hasRedemptionRights',
    label: 'Has Redemption Rights',
    type: FieldType.CHECKBOX,
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },
  {
    name: 'redemptionTerm',
    label: 'Redemption Term (months)',
    type: FieldType.NUMBER,
    placeholder: 'Enter redemption term',
    securityTypes: ['Preferred Shares'] as SecurityType[]
  },

  // Convertible Tab Fields
  {
    name: 'interestRate',
    label: 'Interest Rate',
    type: FieldType.NUMBER,
    placeholder: 'Enter interest rate',
    step: '0.01',
    securityTypes: ['Convertible'] as SecurityType[]
  },
  {
    name: 'interestRateType',
    label: 'Interest Rate Type',
    type: FieldType.SELECT,
    options: INTEREST_RATE_TYPES,
    securityTypes: ['Convertible'] as SecurityType[]
  },
  {
    name: 'interestPeriod',
    label: 'Interest Period',
    type: FieldType.TEXT,
    placeholder: 'Enter interest period (e.g., Monthly, Quarterly)',
    securityTypes: ['Convertible'] as SecurityType[]
  },
  {
    name: 'maturityDate',
    label: 'Maturity Date',
    type: FieldType.DATE,
    securityTypes: ['Convertible', 'Bond'] as SecurityType[]
  },
  {
    name: 'valuationCap',
    label: 'Valuation Cap',
    type: FieldType.NUMBER,
    placeholder: 'Enter valuation cap',
    step: '0.01',
    securityTypes: ['Convertible'] as SecurityType[]
  },
  {
    name: 'conversionDiscount',
    label: 'Conversion Discount',
    type: FieldType.NUMBER,
    placeholder: 'Enter conversion discount',
    step: '0.01',
    securityTypes: ['Convertible'] as SecurityType[]
  },
  {
    name: 'conversionBasis',
    label: 'Conversion Basis',
    type: FieldType.SELECT,
    options: CONVERSION_BASES,
    securityTypes: ['Convertible'] as SecurityType[]
  },

  // Option-Specific Fields
  {
    name: 'optionType',
    label: 'Option Type',
    type: FieldType.SELECT,
    options: OPTION_TYPES,
    securityTypes: ['Option'] as SecurityType[],
    required: true
  },
  {
    name: 'vestingStart',
    label: 'Vesting Start Date',
    type: FieldType.DATE,
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    name: 'vestingMonths',
    label: 'Vesting Months',
    type: FieldType.NUMBER,
    placeholder: 'Enter vesting period in months',
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    name: 'cliffMonths',
    label: 'Cliff Months',
    type: FieldType.NUMBER,
    placeholder: 'Enter cliff period in months',
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    name: 'vestingScheduleType',
    label: 'Vesting Schedule Type',
    type: FieldType.TEXT,
    placeholder: 'Enter vesting schedule type',
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    name: 'exerciseWindowDays',
    label: 'Exercise Window (Days)',
    type: FieldType.NUMBER,
    placeholder: 'Enter exercise window in days',
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    name: 'strikePrice',
    label: 'Strike Price',
    type: FieldType.NUMBER,
    placeholder: 'Enter strike price',
    step: '0.01',
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    name: 'expirationDate',
    label: 'Expiration Date',
    type: FieldType.DATE,
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    name: 'terminationDate',
    label: 'Termination Date',
    type: FieldType.DATE,
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    name: 'poolName',
    label: 'Pool Name',
    type: FieldType.TEXT,
    placeholder: 'Enter pool name',
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    name: 'poolSize',
    label: 'Pool Size',
    type: FieldType.NUMBER,
    placeholder: 'Enter pool size',
    step: '0.01',
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    name: 'poolAvailable',
    label: 'Pool Available',
    type: FieldType.NUMBER,
    placeholder: 'Enter available pool',
    step: '0.01',
    securityTypes: ['Option'] as SecurityType[]
  },
  {
    name: 'isActive',
    label: 'Is Active',
    type: FieldType.CHECKBOX,
    securityTypes: ['Option'] as SecurityType[]
  },

  // Warrant-Specific Fields
  {
    name: 'warrantType',
    label: 'Warrant Type',
    type: FieldType.SELECT,
    options: WARRANT_TYPES,
    securityTypes: ['Warrant'] as SecurityType[],
    required: true
  },
  {
    name: 'isDetachable',
    label: 'Is Detachable',
    type: FieldType.CHECKBOX,
    securityTypes: ['Warrant'] as SecurityType[]
  },
  {
    name: 'dealContext',
    label: 'Deal Context',
    type: FieldType.TEXT,
    placeholder: 'e.g., Series A warrant, Bridge warrant',
    securityTypes: ['Warrant'] as SecurityType[]
  },
  {
    name: 'isTransferable',
    label: 'Is Transferable',
    type: FieldType.CHECKBOX,
    securityTypes: ['Warrant'] as SecurityType[]
  },
  {
    name: 'expirationDate',
    label: 'Expiration Date',
    type: FieldType.DATE,
    securityTypes: ['Warrant'] as SecurityType[]
  },
  {
    name: 'strikePrice',
    label: 'Strike Price',
    type: FieldType.NUMBER,
    placeholder: 'Enter strike price',
    step: '0.01',
    securityTypes: ['Warrant'] as SecurityType[]
  },
  {
    name: 'exerciseWindowDays',
    label: 'Exercise Window (Days)',
    type: FieldType.NUMBER,
    placeholder: 'Enter exercise window in days',
    securityTypes: ['Warrant'] as SecurityType[]
  },

  // Shared Option/Warrant Fields
  {
    name: 'totalShares',
    label: 'Total Shares',
    type: FieldType.NUMBER,
    placeholder: 'Enter total shares',
    step: '0.01',
    securityTypes: ['Option', 'Warrant'] as SecurityType[]
  },
  {
    name: 'issueRights',
    label: 'Issue Rights',
    type: FieldType.SELECT,
    options: ISSUE_RIGHTS,
    securityTypes: ['Option', 'Warrant'] as SecurityType[]
  },
  {
    name: 'convertTo',
    label: 'Convert To',
    type: FieldType.TEXT,
    placeholder: 'Enter security to convert to',
    securityTypes: ['Option', 'Warrant'] as SecurityType[]
  },

  // Bond Tab Fields
  {
    name: 'principal',
    label: 'Principal',
    type: FieldType.NUMBER,
    placeholder: 'Enter principal amount',
    step: '0.01',
    securityTypes: ['Bond'] as SecurityType[]
  },
  {
    name: 'couponRate',
    label: 'Coupon Rate',
    type: FieldType.NUMBER,
    placeholder: 'Enter coupon rate',
    step: '0.01',
    securityTypes: ['Bond'] as SecurityType[]
  },
  {
    name: 'couponFrequency',
    label: 'Coupon Frequency',
    type: FieldType.TEXT,
    placeholder: 'Enter coupon frequency',
    securityTypes: ['Bond'] as SecurityType[]
  },
  {
    name: 'principalFrequency',
    label: 'Principal Frequency',
    type: FieldType.TEXT,
    placeholder: 'Enter principal frequency',
    securityTypes: ['Bond'] as SecurityType[]
  },
  {
    name: 'tenureMonths',
    label: 'Tenure (Months)',
    type: FieldType.NUMBER,
    placeholder: 'Enter tenure in months',
    securityTypes: ['Bond'] as SecurityType[]
  },
  {
    name: 'moratoriumPeriod',
    label: 'Moratorium Period',
    type: FieldType.NUMBER,
    placeholder: 'Enter moratorium period',
    securityTypes: ['Bond'] as SecurityType[]
  }
];

/**
 * Get fields for a specific tab and security type
 * @param tabId Tab ID
 * @param securityType Security type
 * @returns Array of field configurations
 */
export function getFieldsForTab(tabId: string, securityType: SecurityType): FieldConfig[] {
  return SECURITY_FORM_FIELDS.filter(field => {
    // For general tab, include all fields that should be in the general tab
    if (tabId === 'general') {
      return field.securityTypes.includes(securityType) &&
             ['securityName', 'code', 'roundId', 'securityType', 'currency', 'issuePrice', 'specialTerms', 'lockupMonths'].includes(field.name);
    }

    // For other tabs, include fields that match the security type and are not in the general tab
    return field.securityTypes.includes(securityType) &&
           !['securityName', 'code', 'roundId', 'securityType', 'currency', 'issuePrice', 'specialTerms', 'lockupMonths'].includes(field.name) &&
           getTabForField(field, securityType) === tabId;
  });
}

/**
 * Get the tab ID for a field based on its security type
 * @param field Field configuration
 * @param securityType Security type
 * @returns Tab ID
 */
function getTabForField(field: FieldConfig, securityType: SecurityType): string {
  if (['securityName', 'code', 'roundId', 'securityType', 'currency', 'issuePrice', 'specialTerms', 'lockupMonths'].includes(field.name)) {
    return 'general';
  }
  
  const stockTypes: SecurityType[] = ['Common Shares', 'Preferred Shares'];
  
  if (stockTypes.includes(securityType) && 
      field.securityTypes.some(type => stockTypes.includes(type))) {
    return 'stock';
  }
  
  if (securityType === 'Convertible' && field.securityTypes.includes('Convertible')) {
    return 'convertible';
  }
  
  if (securityType === 'Option' && field.securityTypes.includes('Option')) {
    return 'option';
  }
  
  if (securityType === 'Warrant' && field.securityTypes.includes('Warrant')) {
    return 'warrant';
  }
  
  if (securityType === 'Bond' && field.securityTypes.includes('Bond')) {
    return 'bond';
  }
  
  return '';
}

/**
 * Get visible tabs for a security type
 * @param securityType Security type
 * @returns Array of tab configurations
 */
export function getVisibleTabs(securityType: SecurityType): TabConfig[] {
  return SECURITY_FORM_TABS.filter(tab => tab.securityTypes.includes(securityType));
}
