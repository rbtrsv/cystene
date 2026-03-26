'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useFeeCosts } from '@/modules/assetmanager/hooks/use-fee-costs';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
import { CreateFeeCostSchema, UpdateFeeCostSchema, type FeeCost, type FeeCostType, type Frequency } from '@/modules/assetmanager/schemas/fee-costs.schemas';
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
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/modules/shadcnui/components/ui/select';
import { Save } from 'lucide-react';

interface FeeCostsFormProps {
  id?: number;
  initialData?: FeeCost;
}

// Standard FieldInfo component for displaying validation errors
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

export default function FeeCostsForm({ id, initialData }: FeeCostsFormProps) {
  const router = useRouter();
  const { selectedFeeCost, addFeeCost, editFeeCost, fetchFeeCost, isLoading, error, clearError } = useFeeCosts();
  const { funds } = useFunds();
  const { rounds, fetchRoundsByFund } = useRounds();
  
  const isEditMode = !!id;
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      feeCostType: initialData?.feeCostType || selectedFeeCost?.feeCostType || 'MANAGEMENT',
      fundId: initialData?.fundId || selectedFeeCost?.fundId || undefined,
      roundId: initialData?.roundId || selectedFeeCost?.roundId || undefined,
      feeCostName: initialData?.feeCostName || selectedFeeCost?.feeCostName || '',
      frequency: initialData?.frequency || selectedFeeCost?.frequency || 'QUARTERLY',
      amount: initialData?.amount?.toString() || selectedFeeCost?.amount?.toString() || '',
      description: initialData?.description || selectedFeeCost?.description || '',
      date: initialData?.date ? (initialData.date instanceof Date ? initialData.date.toISOString().split('T')[0] : initialData.date) : selectedFeeCost?.date ? (selectedFeeCost.date instanceof Date ? selectedFeeCost.date.toISOString().split('T')[0] : selectedFeeCost.date) : '',
      transactionReference: initialData?.transactionReference || selectedFeeCost?.transactionReference || '',
    },
    
    // Simplified validation - let individual field validators handle most validation
    validators: {
      onChange: ({ value }) => {
        const fieldErrors: Record<string, string> = {};
        
        // Basic required field validation
        if (!value.fundId) {
          fieldErrors.fundId = 'Fund is required';
        }
        
        if (!value.amount || Number(value.amount) <= 0) {
          fieldErrors.amount = 'Amount must be positive';
        }
        
        if (!value.date) {
          fieldErrors.date = 'Date is required';
        }
        
        return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
      },
    },
    
    onSubmit: async ({ value }) => {
      // Transform form strings to match schema expectations
      const transformedValue = {
        feeCostType: value.feeCostType as FeeCostType,
        fundId: value.fundId,
        roundId: value.roundId || undefined,
        feeCostName: value.feeCostName || undefined,
        frequency: value.frequency as Frequency,
        amount: Number(value.amount),
        description: value.description || undefined,
        date: value.date,
        transactionReference: value.transactionReference || undefined,
      };
      
      const schema = isEditMode ? UpdateFeeCostSchema : CreateFeeCostSchema;
      const result = schema.parse(transformedValue);
      
      const success = isEditMode 
        ? await editFeeCost(id!, result)
        : await addFeeCost(result);
        
      if (success) {
        router.push(isEditMode ? `/dashboard/fee-costs/${id}` : '/dashboard/fee-costs');
      }
    },
  });
  
  useEffect(() => {
    if (isEditMode && id && !initialData) fetchFeeCost(id);
  }, [isEditMode, id, initialData, fetchFeeCost]);
  
  useEffect(() => {
    if (selectedFeeCost && isEditMode) {
      form.reset({
        feeCostType: selectedFeeCost.feeCostType || 'MANAGEMENT',
        fundId: selectedFeeCost.fundId,
        roundId: selectedFeeCost.roundId || undefined,
        feeCostName: selectedFeeCost.feeCostName || '',
        frequency: selectedFeeCost.frequency || 'QUARTERLY',
        amount: selectedFeeCost.amount?.toString() || '',
        description: selectedFeeCost.description || '',
        date: selectedFeeCost.date ? (selectedFeeCost.date instanceof Date ? selectedFeeCost.date.toISOString().split('T')[0] : selectedFeeCost.date) : '',
        transactionReference: selectedFeeCost.transactionReference || '',
      });
    }
  }, [selectedFeeCost, isEditMode, form]);

  // Watch fundId changes to load rounds
  const [fundId, setFundId] = useState<number | undefined>(initialData?.fundId);
  useEffect(() => {
    if (fundId) {
      fetchRoundsByFund(fundId);
    }
  }, [fundId, fetchRoundsByFund]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Fee Cost' : 'Create Fee Cost'}</CardTitle>
          <CardDescription>Loading fee cost information...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit Fee Cost' : 'Create Fee Cost'}</CardTitle>
          <CardDescription>Error loading fee cost</CardDescription>
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
    <Card className="max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Fee Cost' : 'Create Fee Cost'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update fee cost details' : 'Add a new fee or cost entry'}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}>
        <CardContent className="space-y-4 p-3 md:p-4">
          
          {/* Basic Information */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="feeCostType">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Fee/Cost Type</Label>
                        <Select 
                          value={field.state.value || 'MANAGEMENT'} 
                          onValueChange={(value) => field.handleChange(value as FeeCostType)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select fee/cost type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANAGEMENT">Management</SelectItem>
                            <SelectItem value="PERFORMANCE">Performance</SelectItem>
                            <SelectItem value="SETUP">Setup</SelectItem>
                            <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                            <SelectItem value="LEGAL">Legal</SelectItem>
                            <SelectItem value="AUDIT">Audit</SelectItem>
                            <SelectItem value="CUSTODIAN">Custodian</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field
                    name="fundId"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value || value === 0) return 'Fund is required';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Fund</Label>
                        <Select
                          value={field.state.value?.toString() || ''}
                          onValueChange={(value) => {
                            const numValue = parseInt(value, 10);
                            field.handleChange(numValue);
                            setFundId(numValue);
                          }}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select fund" />
                          </SelectTrigger>
                          <SelectContent>
                            {funds.map((fund) => (
                              <SelectItem key={fund.id} value={fund.id!.toString()}>
                                {fund.name}
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
                  <form.Field name="roundId">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Round (Optional)</Label>
                        <Select 
                          value={field.state.value?.toString() || 'none'} 
                          onValueChange={(value) => field.handleChange(value === 'none' ? null : parseInt(value, 10))}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select round" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {rounds.map((round) => (
                              <SelectItem key={round.id} value={round.id!.toString()}>
                                {round.roundName}
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
                  <form.Field name="feeCostName">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Fee/Cost Name (Optional)</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter fee/cost name"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="frequency">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Frequency</Label>
                        <Select 
                          value={field.state.value || 'QUARTERLY'} 
                          onValueChange={(value) => field.handleChange(value as Frequency)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONE_TIME">One Time</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                            <SelectItem value="ANNUAL">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field
                    name="amount"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return 'Amount is required';
                        const numValue = Number(value);
                        if (isNaN(numValue)) return 'Amount must be a number';
                        if (numValue <= 0) return 'Amount must be positive';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Amount</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.01"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.00"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date and Reference Information */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Date and Reference Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field
                    name="date"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return 'Date is required';
                        if (isNaN(new Date(value).getTime())) return 'Invalid date';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Date</Label>
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
                </div>

                <div className="space-y-2">
                  <form.Field name="transactionReference">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Transaction Reference (Optional)</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter transaction reference"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="space-y-2">
                <form.Field name="description">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Description (Optional)</Label>
                      <Textarea
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter description of this fee/cost..."
                        rows={3}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
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
                    {isEditMode ? 'Update Fee Cost' : 'Create Fee Cost'}
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