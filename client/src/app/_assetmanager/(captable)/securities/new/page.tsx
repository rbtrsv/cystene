'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSecurities } from '@/modules/assetmanager/hooks/captable/use-securities';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { CreateSecuritySchema, type SecurityType, getSecurityTypeLabel } from '@/modules/assetmanager/schemas/captable/security.schemas';
import {
  FieldType,
  type FieldConfig,
  getFieldsForTab,
  getVisibleTabs,
  SECURITY_TYPES,
  CURRENCIES,
  ANTI_DILUTION_TYPES,
  INTEREST_RATE_TYPES,
} from '@/modules/assetmanager/schemas/captable/security-form.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateSecurityPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { getFundingRoundsByEntity } = useFundingRounds();
  const { createSecurity, error: storeError } = useSecurities();

  // Form state - stores all field values as strings/booleans for form inputs
  const [formValues, setFormValues] = useState<Record<string, string | boolean | null>>({
    // Core Fields
    funding_round_id: '',
    security_name: '',
    code: '',
    security_type: 'common',
    currency: 'USD',
    issue_price: null,
    special_terms: null,
    // All optional fields default to null
    is_preferred: null,
    has_voting_rights: null,
    voting_ratio: null,
    has_dividend_rights: null,
    dividend_rate: null,
    is_dividend_cumulative: null,
    liquidation_preference: null,
    has_participation: null,
    participation_cap: null,
    seniority: null,
    anti_dilution: null,
    has_conversion_rights: null,
    conversion_ratio: null,
    has_redemption_rights: null,
    redemption_term: null,
    interest_rate: null,
    interest_rate_type: null,
    interest_period: null,
    maturity_date: null,
    valuation_cap: null,
    conversion_discount: null,
    conversion_basis: null,
    option_type: null,
    vesting_start: null,
    vesting_months: null,
    cliff_months: null,
    vesting_schedule_type: null,
    exercise_window_days: null,
    strike_price: null,
    expiration_date: null,
    termination_date: null,
    pool_name: null,
    pool_size: null,
    pool_available: null,
    is_active: null,
    warrant_type: null,
    is_detachable: false,
    deal_context: null,
    is_transferable: false,
    total_shares: null,
    issue_rights: null,
    convert_to: null,
    principal: null,
    coupon_rate: null,
    coupon_frequency: null,
    principal_frequency: null,
    tenure_months: null,
    moratorium_period: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get funding rounds for the active entity
  const entityRounds = activeEntity ? getFundingRoundsByEntity(activeEntity.id) : [];

  // Current security type for dynamic form rendering
  const selectedSecurityType = (formValues.security_type || 'common') as SecurityType;

  // Update a single form value
  const setFormValue = (name: string, value: string | boolean | null) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Number fields that need parseFloat conversion
  const FLOAT_FIELDS = [
    'issue_price', 'voting_ratio', 'dividend_rate', 'liquidation_preference',
    'participation_cap', 'conversion_ratio', 'interest_rate', 'valuation_cap',
    'conversion_discount', 'strike_price', 'pool_size', 'pool_available',
    'total_shares', 'principal', 'coupon_rate',
  ];

  // Integer fields that need parseInt conversion
  const INT_FIELDS = [
    'funding_round_id', 'seniority', 'redemption_term', 'vesting_months',
    'cliff_months', 'exercise_window_days', 'tenure_months', 'moratorium_period',
  ];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Build typed submit data from form values
    const submitData: Record<string, unknown> = {};
    Object.entries(formValues).forEach(([key, value]) => {
      if (INT_FIELDS.includes(key)) {
        submitData[key] = value !== null && value !== '' ? parseInt(String(value)) : null;
      } else if (FLOAT_FIELDS.includes(key)) {
        submitData[key] = value !== null && value !== '' ? parseFloat(String(value)) : null;
      } else if (typeof value === 'boolean') {
        submitData[key] = value;
      } else {
        submitData[key] = value !== null && value !== '' ? value : null;
      }
    });

    // Validate with Zod
    const validation = CreateSecuritySchema.safeParse(submitData);
    if (!validation.success) {
      setValidationError(validation.error.errors[0]?.message || 'Validation failed');
      return;
    }

    setIsSubmitting(true);
    const success = await createSecurity(validation.data);
    setIsSubmitting(false);

    if (success) {
      router.push('/securities');
    }
    // Error is handled by store and displayed via storeError
  };

  // Get select options for a field by name
  const getOptionsForField = (fieldName: string): Record<string, string> => {
    switch (fieldName) {
      case 'security_type':
        return SECURITY_TYPES;
      case 'currency':
        return CURRENCIES;
      case 'anti_dilution':
        return ANTI_DILUTION_TYPES;
      case 'interest_rate_type':
        return INTEREST_RATE_TYPES;
      default:
        return {};
    }
  };

  // Render a single form field based on FieldConfig
  const renderField = (fieldConfig: FieldConfig) => {
    const { name, label, type, placeholder, step, options, required } = fieldConfig;
    const value = formValues[name];

    // Special handling for funding_round_id - render as select with entity funding rounds
    if (name === 'funding_round_id') {
      return (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>
            {label}{required && ' *'}
          </Label>
          <Select
            value={value ? String(value) : ''}
            onValueChange={(v) => setFormValue(name, v)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a funding round" />
            </SelectTrigger>
            <SelectContent>
              {entityRounds.map((round) => (
                <SelectItem key={round.id} value={round.id.toString()}>
                  {round.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Special handling for security_type - also updates dynamic form rendering
    if (name === 'security_type') {
      return (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>
            {label}{required && ' *'}
          </Label>
          <Select
            value={value ? String(value) : 'common'}
            onValueChange={(v) => setFormValue(name, v)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select security type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SECURITY_TYPES).map(([key, val]) => (
                <SelectItem key={key} value={val}>
                  {getSecurityTypeLabel(val)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Generic field rendering based on FieldType
    switch (type) {
      case FieldType.TEXT:
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label}{required && ' *'}
            </Label>
            <Input
              id={name}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => setFormValue(name, e.target.value || null)}
              placeholder={placeholder}
              disabled={isSubmitting}
            />
          </div>
        );

      case FieldType.NUMBER:
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label}{required && ' *'}
            </Label>
            <Input
              id={name}
              type="number"
              step={step || '1'}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => setFormValue(name, e.target.value || null)}
              placeholder={placeholder}
              disabled={isSubmitting}
            />
          </div>
        );

      case FieldType.CHECKBOX:
        return (
          <div key={name} className="flex items-center space-x-2">
            <Checkbox
              id={name}
              checked={!!value}
              onCheckedChange={(checked) => setFormValue(name, !!checked)}
              disabled={isSubmitting}
            />
            <Label htmlFor={name} className="cursor-pointer">
              {label}
            </Label>
          </div>
        );

      case FieldType.SELECT: {
        const selectOptions = options || getOptionsForField(name);
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label}{required && ' *'}
            </Label>
            <Select
              value={value !== null && value !== undefined ? String(value) : ''}
              onValueChange={(v) => setFormValue(name, v)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(selectOptions).map(([key, val]) => (
                  <SelectItem key={key} value={val}>
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }

      case FieldType.TEXTAREA:
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label}{required && ' *'}
            </Label>
            <Textarea
              id={name}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => setFormValue(name, e.target.value || null)}
              placeholder={placeholder}
              disabled={isSubmitting}
            />
          </div>
        );

      case FieldType.DATE:
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label}{required && ' *'}
            </Label>
            <Input
              id={name}
              type="date"
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => setFormValue(name, e.target.value || null)}
              disabled={isSubmitting}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!activeEntity) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            Please select an entity first.{' '}
            <Link href="/entities" className="underline">
              Go to Entities
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (entityRounds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            No funding rounds found for this entity. Please create a funding round first.{' '}
            <Link href="/funding-rounds/new" className="underline">
              Create Funding Round
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get visible tabs for the selected security type
  const visibleTabs = getVisibleTabs(selectedSecurityType);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/securities">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Securities
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Security</h1>
        <p className="text-muted-foreground mt-2">
          Add a new security for {activeEntity.name}
        </p>
      </div>

      {(storeError || validationError) && (
        <Alert variant="destructive">
          <AlertDescription>{storeError || validationError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Render each visible tab as a card section */}
        {visibleTabs.map((tab) => {
          const tabFields = getFieldsForTab(tab.id, selectedSecurityType);

          if (tabFields.length === 0) return null;

          return (
            <Card key={tab.id} className="mb-6">
              <CardHeader>
                <CardTitle>{tab.label}</CardTitle>
                <CardDescription>
                  {tab.id === 'general'
                    ? 'Enter the core details for your new security'
                    : `Configure ${tab.label.toLowerCase()} specific to ${getSecurityTypeLabel(selectedSecurityType)}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tabFields.map((fieldConfig) => renderField(fieldConfig))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Security'
            )}
          </Button>
          <Link href="/securities" className="flex-1">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              className="w-full"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
