'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useFunds } from '../../hooks/use-funds';
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
  SelectValue 
} from '@/modules/shadcnui/components/ui/select';
import { Save } from 'lucide-react';
import { type Round, roundTypeEnum, type RoundType } from '../../schemas/rounds.schemas';

interface FundRoundsFormProps {
  fundId: number;
  roundId?: number;
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

export default function FundRoundsForm({ fundId, roundId, initialData }: FundRoundsFormProps) {
  const router = useRouter();
  const { getFundById } = useFunds();
  const { 
    selectedRound,
    addRound, 
    editRound, 
    fetchRound,
    isLoading, 
    error, 
    clearError 
  } = useRounds();
  
  const isEditMode = !!roundId;
  const currentDate = useMemo(() => new Date(), []);
  
  // Create form with TanStack Form
  const form = useForm({
    defaultValues: {
      roundName: initialData?.roundName || selectedRound?.roundName || '',
      roundType: (initialData?.roundType || selectedRound?.roundType || 'Seed') as RoundType,
      roundDate: initialData?.roundDate || selectedRound?.roundDate || currentDate,
      targetAmount: initialData?.targetAmount || selectedRound?.targetAmount || 0,
      raisedAmount: initialData?.raisedAmount || selectedRound?.raisedAmount || 0,
      preMoneyValuation: initialData?.preMoneyValuation || selectedRound?.preMoneyValuation || undefined,
      postMoneyValuation: initialData?.postMoneyValuation || selectedRound?.postMoneyValuation || undefined,
      fundId: fundId
    },
    onSubmit: async ({ value }) => {
      if (isEditMode && roundId) {
        const success = await editRound(
          roundId, 
          value.roundName, 
          value.roundType as RoundType,
          typeof value.roundDate === 'string' ? new Date(value.roundDate) : value.roundDate,
          typeof value.targetAmount === 'string' ? parseFloat(value.targetAmount) : value.targetAmount,
          typeof value.raisedAmount === 'string' ? parseFloat(value.raisedAmount) : value.raisedAmount,
          typeof value.preMoneyValuation === 'string' ? parseFloat(value.preMoneyValuation) : value.preMoneyValuation,
          typeof value.postMoneyValuation === 'string' ? parseFloat(value.postMoneyValuation) : value.postMoneyValuation
        );
        if (success) {
          router.push(`/dashboard/funds/${fundId}/rounds`);
        }
      } else {
        const success = await addRound(
          fundId,
          value.roundName, 
          value.roundType as RoundType,
          typeof value.roundDate === 'string' ? new Date(value.roundDate) : value.roundDate,
          typeof value.targetAmount === 'string' ? parseFloat(value.targetAmount) : value.targetAmount,
          typeof value.raisedAmount === 'string' ? parseFloat(value.raisedAmount) : value.raisedAmount,
          typeof value.preMoneyValuation === 'string' ? parseFloat(value.preMoneyValuation) : value.preMoneyValuation,
          typeof value.postMoneyValuation === 'string' ? parseFloat(value.postMoneyValuation) : value.postMoneyValuation
        );
        if (success) {
          router.push(`/dashboard/funds/${fundId}/rounds`);
        }
      }
    },
  });
  
  useEffect(() => {
    if (isEditMode && roundId && !initialData) {
      fetchRound(roundId);
    }
  }, [isEditMode, roundId, initialData, fetchRound]);
  
  // Reset form values when selectedRound changes
  useEffect(() => {
    if (selectedRound && isEditMode) {
      form.reset({
        roundName: selectedRound.roundName || "",
        roundType: (selectedRound.roundType || "Seed") as RoundType,
        roundDate: selectedRound.roundDate || currentDate,
        targetAmount: selectedRound.targetAmount || 0,
        raisedAmount: selectedRound.raisedAmount || 0,
        preMoneyValuation: selectedRound.preMoneyValuation || undefined,
        postMoneyValuation: selectedRound.postMoneyValuation || undefined,
        fundId: fundId
      });
    }
  }, [selectedRound, isEditMode, form, fundId, currentDate]);

  // Get fund name for display
  const fund = getFundById(fundId);
  const fundName = fund ? fund.name : 'Fund';
  
  if (isLoading) {
    return (
      <>
        <CardHeader>
          <div>
            <CardTitle>{isEditMode ? 'Edit Round' : 'Add Round'}</CardTitle>
            <CardDescription>Loading round information...</CardDescription>
          </div>
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
          <div>
            <CardTitle>{isEditMode ? 'Edit Round' : 'Add Round'}</CardTitle>
            <CardDescription>Error loading round</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
        </CardContent>
      </>
    );
  }
  
  return (
    <>
      <CardHeader>
        <div>
          <CardTitle>{isEditMode ? 'Edit Round' : 'Add Round'}</CardTitle>
          <CardDescription>
            {isEditMode ? `Update round for ${fundName}` : `Add a new round to ${fundName}`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <form.Field
                  name="roundName"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value || typeof value !== 'string') return 'Round name is required';
                      if (value.trim().length < 2) return 'Round name must be at least 2 characters';
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
              </div>
              
              <div className="space-y-2">
                <form.Field
                  name="roundType"
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
              </div>
              
              <div className="space-y-2">
                <form.Field
                  name="roundDate"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return 'Round date is required';
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
                        value={field.state.value instanceof Date 
                          ? field.state.value.toISOString().split('T')[0] 
                          : field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value ? new Date(e.target.value) : null)}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
              
              <div className="space-y-2">
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
                        onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                        placeholder="Enter target amount"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
              
              <div className="space-y-2">
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
                        onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                        placeholder="Enter raised amount"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
              
              <div className="space-y-2">
                <form.Field
                  name="preMoneyValuation"
                  validators={{
                    onChange: ({ value }) => {
                      if (value !== undefined && value !== null) {
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
                      <Label htmlFor={field.name}>Pre-Money Valuation</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value ? e.target.valueAsNumber : undefined)}
                        placeholder="Enter pre-money valuation (optional)"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
              
              <div className="space-y-2">
                <form.Field
                  name="postMoneyValuation"
                  validators={{
                    onChange: ({ value }) => {
                      if (value !== undefined && value !== null) {
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
                      <Label htmlFor={field.name}>Post-Money Valuation</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value ? e.target.valueAsNumber : undefined)}
                        placeholder="Enter post-money valuation (optional)"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit}>
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
            </div>
          </div>
        </form>
      </CardContent>
    </>
  );
}
