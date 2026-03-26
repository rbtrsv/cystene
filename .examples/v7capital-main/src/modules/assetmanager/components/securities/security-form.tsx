'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useSecurities } from '../../hooks/use-securities';
import { useRounds } from '../../hooks/use-rounds';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Save } from 'lucide-react';
import { 
  type Security,
  type CreateSecurityInput,
  type UpdateSecurityInput,
  type SecurityType
} from '../../schemas/securities.schemas';
import {
  FieldType,
  type FieldConfig,
  getFieldsForTab,
  getVisibleTabs,
  SECURITY_TYPES,
  CURRENCIES,
  ANTI_DILUTION_TYPES,
  INTEREST_RATE_TYPES,
  CONVERSION_BASES,
  ISSUE_RIGHTS
} from '../../schemas/security-form.schemas';

interface SecurityFormProps {
  id?: number;
  initialData?: Security;
}

// Helper function to render form field errors
function FieldInfo({ field }: { field: any }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
      ) : null}
      {field.state.meta.isValidating ? <p className="text-sm text-muted-foreground mt-1">Validating...</p> : null}
    </>
  );
}

// Dynamic form field component
interface FormFieldProps {
  form: any;
  fieldConfig: FieldConfig;
  formatDateForInput: (date: Date | undefined) => string;
  setSecurityType?: (type: SecurityType) => void;
  rounds?: any[]; // Add rounds prop for roundId dropdown
}

function FormField({ form, fieldConfig, formatDateForInput, setSecurityType, rounds }: FormFieldProps) {
  const { name, label, type, placeholder, options, step, required, validators } = fieldConfig;
  
  // Create validators based on field config
  const fieldValidators = {
    onChange: ({ value }: { value: any }) => {
      if (required && !value) return `${label} is required`;
      if (validators?.minLength && typeof value === 'string' && value.length < validators.minLength) {
        return `${label} must be at least ${validators.minLength} characters`;
      }
      if (validators?.min && typeof value === 'number' && value < validators.min) {
        return `${label} must be at least ${validators.min}`;
      }
      if (validators?.max && typeof value === 'number' && value > validators.max) {
        return `${label} must be at most ${validators.max}`;
      }
      if (validators?.pattern && typeof value === 'string' && !validators.pattern.test(value)) {
        return `${label} has an invalid format`;
      }
      return undefined;
    }
  };
  
  return (
    <form.Field
      name={name}
      validators={fieldValidators}
    >
      {(field) => {
        switch (type) {
          case FieldType.TEXT:
            return (
              <div className="space-y-1">
                <div className="flex items-center space-x-4">
                  <Label htmlFor={field.name} className="min-w-fit">{label}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1"
                  />
                </div>
                <FieldInfo field={field} />
              </div>
            );
            
          case FieldType.NUMBER:
            return (
              <div className="space-y-1">
                <div className="flex items-center space-x-4">
                  <Label htmlFor={field.name} className="min-w-fit">{label}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step={step}
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value ? e.target.valueAsNumber : undefined)}
                    placeholder={placeholder}
                    className="flex-1"
                  />
                </div>
                <FieldInfo field={field} />
              </div>
            );
            
          case FieldType.CHECKBOX:
            return (
              <div className="flex items-center space-x-3 py-2">
                <Label htmlFor={field.name}>{label}</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value || false}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                  />
                  <FieldInfo field={field} />
                </div>
              </div>
            );
            
          case FieldType.SELECT:
            return (
              <div className="space-y-1">
                <div className="flex items-center space-x-4">
                  <Label htmlFor={field.name} className="min-w-fit">{label}</Label>
                  <Select
                    value={field.state.value != null ? field.state.value.toString() : ''}
                    onValueChange={(value) => {
                      // Handle different field types
                      if (name === 'roundId') {
                        field.handleChange(parseInt(value));
                      } else {
                        field.handleChange(value);
                      }
                      if (setSecurityType) {
                        setSecurityType(value as SecurityType);
                      }
                    }}
                  >
                    <SelectTrigger id={field.name} className="flex-1">
                      <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Special handling for roundId field */}
                      {name === 'roundId' && rounds ? (
                        rounds.map((round) => (
                          <SelectItem key={round.id} value={round.id.toString()}>
                            {round.roundName} ({round.roundType})
                          </SelectItem>
                        ))
                      ) : (
                        options && Object.entries(options).map(([key, value]) => (
                          <SelectItem key={key} value={value}>
                            {value}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <FieldInfo field={field} />
              </div>
            );
            
          case FieldType.TEXTAREA:
            return (
              <div className="space-y-2">
                <div className="flex items-start space-x-4">
                  <Label htmlFor={field.name} className="min-w-fit pt-2">{label}</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className="flex-1 resize-none"
                  />
                </div>
                <FieldInfo field={field} />
              </div>
            );
            
          case FieldType.DATE:
            return (
              <div className="space-y-1">
                <div className="flex items-center space-x-4">
                  <Label htmlFor={field.name} className="min-w-fit">{label}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
                    value={typeof field.state.value === 'string' ? field.state.value : formatDateForInput(field.state.value as Date)}
                    onBlur={field.handleBlur}
                    onChange={(e) => (field.handleChange as any)(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1"
                  />
                </div>
                <FieldInfo field={field} />
              </div>
            );
            
          default:
            return null;
        }
      }}
    </form.Field>
  );
}

export default function SecurityForm({ id, initialData }: SecurityFormProps) {
  const router = useRouter();
  const { 
    selectedSecurity,
    addSecurity, 
    editSecurity, 
    fetchSecurity,
    isLoading, 
    error, 
    clearError 
  } = useSecurities();
  
  const { 
    rounds, 
    fetchRounds,
    isLoading: roundsLoading 
  } = useRounds();
  
  const [securityType, setSecurityType] = useState<SecurityType>(
    initialData?.securityType || SECURITY_TYPES['Common Shares']
  );
  
  const isEditMode = !!id;
  
  useEffect(() => {
    if (isEditMode && id && !initialData) {
      fetchSecurity(id);
    }
  }, [isEditMode, id, initialData, fetchSecurity]);
  
  // Fetch rounds for dropdown
  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);
  
  // Create form with TanStack Form
  const form = useForm({
    defaultValues: initialData || selectedSecurity || {
      securityName: '',
      code: '',
      roundId: undefined as unknown as number,
      securityType: SECURITY_TYPES['Common Shares'],
      currency: CURRENCIES['USD'],
    },
    onSubmit: async ({ value }) => {
      if (isEditMode && id) {
        const success = await editSecurity(id, value as UpdateSecurityInput);
        if (success) {
          router.push(`/dashboard/securities/${id}`);
        }
      } else {
        const success = await addSecurity(value as CreateSecurityInput);
        if (success) {
          router.push('/dashboard/securities');
        }
      }
    },
  });
  
  // Reset form when selectedSecurity changes in edit mode
  useEffect(() => {
    if (selectedSecurity && isEditMode) {
      form.reset(selectedSecurity);
    }
  }, [selectedSecurity, isEditMode, form]);
  
  // Helper function to format date for input fields
  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Security' : 'Create Security'}</CardTitle>
          <CardDescription>Loading security information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Security' : 'Create Security'}</CardTitle>
          <CardDescription>Error loading security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Security' : 'Create Security'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Update security details' : 'Add a new security'}
        </CardDescription>
      </CardHeader>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <CardContent className="space-y-6">
          {/* General Information Section - Always Visible */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 items-start">
                {getFieldsForTab('general', securityType).map((fieldConfig) => (
                  <div 
                    key={fieldConfig.name} 
                    className={fieldConfig.type === FieldType.TEXTAREA ? "md:col-span-2" : ""}
                  >
                    <FormField
                      form={form}
                      fieldConfig={fieldConfig}
                      formatDateForInput={formatDateForInput}
                      setSecurityType={fieldConfig.name === 'securityType' ? setSecurityType : undefined}
                      rounds={rounds}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Sections Based on Security Type */}
          {getVisibleTabs(securityType).filter(tab => tab.id !== 'general').map((tab) => (
            <Card key={tab.id} className="shadow-none border-muted bg-muted/30">
              <CardHeader>
                <CardTitle>{tab.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 items-start">
                    {getFieldsForTab(tab.id, securityType).map((fieldConfig) => (
                      <div 
                        key={fieldConfig.name} 
                        className={fieldConfig.type === FieldType.TEXTAREA ? "md:col-span-2" : ""}
                      >
                        <FormField
                          form={form}
                          fieldConfig={fieldConfig}
                          formatDateForInput={formatDateForInput}
                          rounds={rounds}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> 
                    {isEditMode ? 'Update Security' : 'Create Security'}
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
