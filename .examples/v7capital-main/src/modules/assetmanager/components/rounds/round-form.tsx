'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { CreateRoundSchema, UpdateRoundSchema, type Round, roundTypeEnum, type RoundType } from '@/modules/assetmanager/schemas/rounds.schemas';
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
  SelectValue 
} from '@/modules/shadcnui/components/ui/select';
import { Save } from 'lucide-react';

interface RoundFormProps {
  id?: number;
  initialData?: Round;
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

export default function RoundForm({ id, initialData }: RoundFormProps) {
  const router = useRouter();
  const { 
    selectedRound,
    addRound, 
    editRound, 
    fetchRound,
    isLoading: roundsLoading, 
    error: roundsError, 
    clearError: clearRoundsError 
  } = useRounds();
  
  const {
    funds,
    fetchFunds,
    isLoading: fundsLoading,
    error: fundsError
  } = useFunds();

  const isEditMode = !!id;
  const currentDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      fundId: initialData?.fundId || selectedRound?.fundId || undefined,
      roundName: initialData?.roundName || selectedRound?.roundName || '',
      roundType: (initialData?.roundType || selectedRound?.roundType || 'Seed') as RoundType,
      roundDate: initialData?.roundDate ? new Date(initialData.roundDate).toISOString().split('T')[0] : 
                 selectedRound?.roundDate ? new Date(selectedRound.roundDate).toISOString().split('T')[0] : 
                 currentDate,
      targetAmount: initialData?.targetAmount?.toString() || selectedRound?.targetAmount?.toString() || '',
      raisedAmount: initialData?.raisedAmount?.toString() || selectedRound?.raisedAmount?.toString() || '',
      preMoneyValuation: initialData?.preMoneyValuation?.toString() || selectedRound?.preMoneyValuation?.toString() || '',
      postMoneyValuation: initialData?.postMoneyValuation?.toString() || selectedRound?.postMoneyValuation?.toString() || '',
    },
    
    // Form-level validation using schema
    validators: {
      onChange: ({ value }) => {
        // Transform form strings to match schema expectations
        const baseTransform = {
          roundName: value.roundName,
          roundType: value.roundType,
          roundDate: value.roundDate,
          targetAmount: value.targetAmount ? Number(value.targetAmount) : undefined,
          raisedAmount: value.raisedAmount ? Number(value.raisedAmount) : undefined,
          preMoneyValuation: value.preMoneyValuation ? Number(value.preMoneyValuation) : undefined,
          postMoneyValuation: value.postMoneyValuation ? Number(value.postMoneyValuation) : undefined,
        };
        
        // Add fundId only for create mode
        const transformedValue = isEditMode 
          ? baseTransform 
          : { ...baseTransform, fundId: value.fundId };
        
        const schema = isEditMode ? UpdateRoundSchema : CreateRoundSchema;
        const result = schema.safeParse(transformedValue);
        
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path.length > 0) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          return fieldErrors;
        }
        
        return undefined;
      },
    },
    
    onSubmit: async ({ value }) => {
      // Transform and validate at submission
      const baseTransform = {
        roundName: value.roundName,
        roundType: value.roundType,
        roundDate: value.roundDate,
        targetAmount: value.targetAmount ? Number(value.targetAmount) : undefined,
        raisedAmount: value.raisedAmount ? Number(value.raisedAmount) : undefined,
        preMoneyValuation: value.preMoneyValuation ? Number(value.preMoneyValuation) : undefined,
        postMoneyValuation: value.postMoneyValuation ? Number(value.postMoneyValuation) : undefined,
      };
      
      // Add fundId only for create mode
      const transformedValue = isEditMode 
        ? baseTransform 
        : { ...baseTransform, fundId: value.fundId };
      
      const schema = isEditMode ? UpdateRoundSchema : CreateRoundSchema;
      const result = schema.parse(transformedValue);
      
      if (isEditMode && id) {
        const success = await editRound(
          id,
          result.roundName!,
          result.roundType!,
          result.roundDate!,
          result.targetAmount!,
          result.raisedAmount!,
          result.preMoneyValuation,
          result.postMoneyValuation
        );
        if (success) {
          router.push(`/dashboard/rounds/${id}`);
        }
      } else {
        const createResult = result as typeof result & { fundId: number };
        const success = await addRound(
          createResult.fundId,
          createResult.roundName!,
          createResult.roundType!,
          createResult.roundDate!,
          createResult.targetAmount!,
          createResult.raisedAmount!,
          createResult.preMoneyValuation,
          createResult.postMoneyValuation
        );
        if (success) {
          router.push('/dashboard/rounds');
        }
      }
    },
  });

  useEffect(() => {
    if (isEditMode && id && !initialData) {
      fetchRound(id);
    }
  }, [isEditMode, id, initialData, fetchRound]);

  // Fetch funds for the dropdown
  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  // Reset form values when selectedRound changes
  useEffect(() => {
    if (selectedRound && isEditMode) {
      form.reset({
        fundId: selectedRound.fundId || undefined,
        roundName: selectedRound.roundName || '',
        roundType: (selectedRound.roundType || 'Seed') as RoundType,
        roundDate: selectedRound.roundDate ? new Date(selectedRound.roundDate).toISOString().split('T')[0] : currentDate,
        targetAmount: selectedRound.targetAmount?.toString() || '',
        raisedAmount: selectedRound.raisedAmount?.toString() || '',
        preMoneyValuation: selectedRound.preMoneyValuation?.toString() || '',
        postMoneyValuation: selectedRound.postMoneyValuation?.toString() || '',
      });
    }
  }, [selectedRound, isEditMode, form, currentDate]);

  // Combine loading and error states
  const isLoading = roundsLoading || fundsLoading;
  const error = roundsError || fundsError;
  
  const clearError = () => {
    clearRoundsError();
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Round' : 'Create Round'}</CardTitle>
          <CardDescription>Loading round information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Round' : 'Create Round'}</CardTitle>
          <CardDescription>Error loading round</CardDescription>
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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Round' : 'Create Round'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update round details' : 'Add a new funding round'}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}>
        <CardContent className="space-y-6">
          
          {/* Basic Information Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Fund Selection */}
              <form.Field
                name="fundId"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value === 0) return 'Fund selection is required';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Fund</Label>
                    <Select
                      value={field.state.value != null ? String(field.state.value) : ''}
                      onValueChange={(value) => field.handleChange(Number(value))}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select a fund" />
                      </SelectTrigger>
                      <SelectContent>
                        {funds.map(fund => (
                          <SelectItem key={fund.id} value={String(fund.id)}>
                            {fund.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Round Name */}
              <form.Field
                name="roundName"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || typeof value !== 'string') return 'Round name is required';
                    if (value.trim().length < 1) return 'Round name is required';
                    if (value.length > 100) return 'Round name is too long';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Round Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter round name"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Round Type */}
              <form.Field
                name="roundType"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return 'Round type is required';
                    if (!roundTypeEnum.options.includes(value)) return 'Invalid round type';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Round Type</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as RoundType)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select round type" />
                      </SelectTrigger>
                      <SelectContent>
                        {roundTypeEnum.options.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Round Date */}
              <form.Field
                name="roundDate"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return 'Round date is required';
                    if (isNaN(new Date(value).getTime())) return 'Invalid date';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Round Date</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              
            </CardContent>
          </Card>

          {/* Financial Information Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">

              {/* Target Amount */}
              <form.Field
                name="targetAmount"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return 'Target amount is required';
                    const numValue = Number(value);
                    if (isNaN(numValue)) return 'Target amount must be a number';
                    if (numValue <= 0) return 'Target amount must be positive';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Target Amount</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter target amount"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Raised Amount */}
              <form.Field
                name="raisedAmount"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return 'Raised amount is required';
                    const numValue = Number(value);
                    if (isNaN(numValue)) return 'Raised amount must be a number';
                    if (numValue < 0) return 'Raised amount cannot be negative';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Raised Amount</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter raised amount"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Pre-Money Valuation (Optional) */}
              <form.Field
                name="preMoneyValuation"
                validators={{
                  onChange: ({ value }) => {
                    if (value && value !== '') {
                      const numValue = Number(value);
                      if (isNaN(numValue)) return 'Pre-money valuation must be a number';
                      if (numValue < 0) return 'Pre-money valuation cannot be negative';
                    }
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Pre-Money Valuation (Optional)</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter pre-money valuation (optional)"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              {/* Post-Money Valuation (Optional) */}
              <form.Field
                name="postMoneyValuation"
                validators={{
                  onChange: ({ value }) => {
                    if (value && value !== '') {
                      const numValue = Number(value);
                      if (isNaN(numValue)) return 'Post-money valuation must be a number';
                      if (numValue < 0) return 'Post-money valuation cannot be negative';
                    }
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Post-Money Valuation (Optional)</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter post-money valuation (optional)"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              
            </CardContent>
          </Card>

        </CardContent>
        
        {/* Submit Button */}
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
                    {isEditMode ? 'Update Round' : 'Create Round'}
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
