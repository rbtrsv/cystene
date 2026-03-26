'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { usePortfolioPerformance } from '@/modules/assetmanager/hooks/use-portfolio-performance';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
import { 
  CreatePortfolioPerformanceSchema,
  UpdatePortfolioPerformanceSchema,
  type CreatePortfolioPerformanceInput,
  type UpdatePortfolioPerformanceInput,
  type PortfolioPerformance
} from '@/modules/assetmanager/schemas/portfolio-performance.schemas';
import { 
  Card,
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
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
import { Save, Calculator } from 'lucide-react';

// Helper function for field errors
function FieldInfo({ field }: { field: any }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
      ) : null}
      {field.state.meta.isValidating ? (
        <p className="text-sm text-muted-foreground mt-1">Validating...</p>
      ) : null}
    </>
  );
}

interface PortfolioPerformanceFormProps {
  id?: number;
  fundId?: number;
  roundId?: number;
  initialData?: PortfolioPerformance;
}

export default function PortfolioPerformanceForm({ 
  id, 
  fundId, 
  roundId,
  initialData 
}: PortfolioPerformanceFormProps) {
  const router = useRouter();
  const { 
    selectedPortfolioPerformance,
    addPortfolioPerformance, 
    editPortfolioPerformance, 
    fetchPortfolioPerformance, 
    isLoading, 
    error, 
    clearError 
  } = usePortfolioPerformance();
  
  const { 
    funds, 
    fetchFunds,
    getFundName 
  } = useFunds();
  
  const { 
    rounds, 
    fetchRounds,
    fetchRoundsByFund,
    getRoundName 
  } = useRounds();
  
  const isEditMode = !!id;
  
  // Setup TanStack Form
  const form = useForm({
    defaultValues: {
      fundId: fundId || initialData?.fundId || selectedPortfolioPerformance?.fundId || undefined,
      roundId: roundId || initialData?.roundId || selectedPortfolioPerformance?.roundId || undefined,
      reportDate: initialData?.reportDate || selectedPortfolioPerformance?.reportDate || new Date().toISOString().split('T')[0],
      totalInvestedAmount: initialData?.totalInvestedAmount?.toString() || selectedPortfolioPerformance?.totalInvestedAmount?.toString() || '',
      fairValue: initialData?.fairValue?.toString() || selectedPortfolioPerformance?.fairValue?.toString() || '',
      cashRealized: initialData?.cashRealized?.toString() || selectedPortfolioPerformance?.cashRealized?.toString() || '',
      nav: initialData?.nav?.toString() || selectedPortfolioPerformance?.nav?.toString() || '',
      totalFundUnits: initialData?.totalFundUnits?.toString() || selectedPortfolioPerformance?.totalFundUnits?.toString() || '',
      navPerShare: initialData?.navPerShare?.toString() || selectedPortfolioPerformance?.navPerShare?.toString() || '',
      tvpi: initialData?.tvpi?.toString() || selectedPortfolioPerformance?.tvpi?.toString() || '',
      dpi: initialData?.dpi?.toString() || selectedPortfolioPerformance?.dpi?.toString() || '',
      rvpi: initialData?.rvpi?.toString() || selectedPortfolioPerformance?.rvpi?.toString() || '',
      irr: initialData?.irr?.toString() || selectedPortfolioPerformance?.irr?.toString() || '',
      notes: initialData?.notes || selectedPortfolioPerformance?.notes || '',
    },
    
    validators: {
      onChange: ({ value }) => {
        const fieldErrors: Record<string, string> = {};
        
        // Basic required field validation
        if (!value.fundId) {
          fieldErrors.fundId = 'Fund is required';
        }
        
        if (!value.roundId) {
          fieldErrors.roundId = 'Round is required';
        }
        
        if (!value.reportDate) {
          fieldErrors.reportDate = 'Report date is required';
        }
        
        if (!value.totalInvestedAmount || Number(value.totalInvestedAmount) < 0) {
          fieldErrors.totalInvestedAmount = 'Total invested amount must be positive';
        }
        
        if (!value.fairValue || Number(value.fairValue) < 0) {
          fieldErrors.fairValue = 'Fair value must be positive';
        }
        
        if (!value.cashRealized || Number(value.cashRealized) < 0) {
          fieldErrors.cashRealized = 'Cash realized must be positive';
        }
        
        return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
      },
    },
    
    onSubmit: async ({ value }) => {
      try {
        // Transform form strings to match schema expectations
        const transformedValue = {
          fundId: value.fundId!,
          roundId: value.roundId || null,
          reportDate: value.reportDate,
          totalInvestedAmount: value.totalInvestedAmount ? Number(value.totalInvestedAmount) : null,
          fairValue: value.fairValue ? Number(value.fairValue) : null,
          cashRealized: value.cashRealized ? Number(value.cashRealized) : null,
          nav: value.nav ? Number(value.nav) : null,
          totalFundUnits: value.totalFundUnits ? Number(value.totalFundUnits) : null,
          navPerShare: value.navPerShare ? Number(value.navPerShare) : null,
          tvpi: value.tvpi ? Number(value.tvpi) : null,
          dpi: value.dpi ? Number(value.dpi) : null,
          rvpi: value.rvpi ? Number(value.rvpi) : null,
          irr: value.irr ? Number(value.irr) : null,
          notes: value.notes || undefined,
        };
        
        const schema = isEditMode ? UpdatePortfolioPerformanceSchema : CreatePortfolioPerformanceSchema;
        const result = schema.parse(transformedValue);
        
        const success = isEditMode && id
          ? await editPortfolioPerformance(id, result)
          : await addPortfolioPerformance(result);
          
        if (success) {
          router.push(isEditMode ? `/dashboard/portfolio-performance/${id}` : '/dashboard/portfolio-performance');
        }
      } catch (err) {
        console.error('Error submitting form:', err);
      }
    },
  });
  
  // Fetch data on mount
  useEffect(() => {
    fetchFunds();
    fetchRounds();
    
    if (isEditMode && id && !initialData) {
      fetchPortfolioPerformance(id);
    }
  }, [id, isEditMode, initialData, fetchPortfolioPerformance, fetchFunds, fetchRounds]);
  
  // Reset form when selectedPortfolioPerformance changes
  useEffect(() => {
    if (selectedPortfolioPerformance && isEditMode) {
      form.reset({
        fundId: selectedPortfolioPerformance.fundId,
        roundId: selectedPortfolioPerformance.roundId,
        reportDate: selectedPortfolioPerformance.reportDate,
        totalInvestedAmount: selectedPortfolioPerformance.totalInvestedAmount?.toString() || '',
        fairValue: selectedPortfolioPerformance.fairValue?.toString() || '',
        cashRealized: selectedPortfolioPerformance.cashRealized?.toString() || '',
        nav: selectedPortfolioPerformance.nav?.toString() || '',
        totalFundUnits: selectedPortfolioPerformance.totalFundUnits?.toString() || '',
        navPerShare: selectedPortfolioPerformance.navPerShare?.toString() || '',
        tvpi: selectedPortfolioPerformance.tvpi?.toString() || '',
        dpi: selectedPortfolioPerformance.dpi?.toString() || '',
        rvpi: selectedPortfolioPerformance.rvpi?.toString() || '',
        irr: selectedPortfolioPerformance.irr?.toString() || '',
        notes: selectedPortfolioPerformance.notes || '',
      });
    }
  }, [selectedPortfolioPerformance, isEditMode, form]);

  // Watch fundId changes to load rounds
  const [selectedFundId, setSelectedFundId] = useState<number | undefined>(fundId || initialData?.fundId);
  useEffect(() => {
    if (selectedFundId) {
      fetchRoundsByFund(selectedFundId);
    }
  }, [selectedFundId, fetchRoundsByFund]);

  const handleBack = () => {
    if (isEditMode && id) {
      router.push(`/dashboard/portfolio-performance/${id}`);
    } else {
      router.push('/dashboard/portfolio-performance');
    }
  };

  // Auto-calculate helper functions
  const calculateTVPI = (totalValue: number, totalInvested: number): number | null => {
    if (totalInvested <= 0) return null;
    return totalValue / totalInvested;
  };

  const calculateDPI = (cashRealized: number, totalInvested: number): number | null => {
    if (totalInvested <= 0) return null;
    return cashRealized / totalInvested;
  };

  const calculateRVPI = (fairValue: number, totalInvested: number): number | null => {
    if (totalInvested <= 0) return null;
    return fairValue / totalInvested;
  };

  if (isLoading && isEditMode) {
    return (
      <>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Loading portfolio performance details...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit Portfolio Performance' : 'Create Portfolio Performance'}</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={clearError} variant="outline">
              Try Again
            </Button>
            <Button onClick={handleBack} variant="outline">
              Cancel
            </Button>
          </div>
        </CardContent>
      </>
    );
  }

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">
          {isEditMode ? 'Edit Portfolio Performance' : 'Create Portfolio Performance'}
        </CardTitle>
        <CardDescription>
          {isEditMode 
            ? 'Update the portfolio performance metrics below' 
            : 'Add a new portfolio performance record with key metrics'
          }
        </CardDescription>
      </CardHeader>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <CardContent className="space-y-8">
          {/* Basic Information */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <Label htmlFor={field.name}>Fund *</Label>
                      <Select
                        value={field.state.value?.toString() || ''}
                        onValueChange={(value) => {
                          const numValue = parseInt(value, 10);
                          field.handleChange(numValue);
                          setSelectedFundId(numValue);
                        }}
                        disabled={!!fundId} // Disable if pre-selected
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fund..." />
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

                <form.Field
                  name="roundId"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value || value === 0) return 'Round is required';
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Round *</Label>
                      <Select
                        value={field.state.value?.toString() || ''}
                        onValueChange={(value) => field.handleChange(value ? parseInt(value, 10) : undefined)}
                        disabled={!!roundId} // Disable if pre-selected
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select round..." />
                        </SelectTrigger>
                        <SelectContent>
                          {rounds
                            .filter(round => !selectedFundId || round.fundId === selectedFundId)
                            .map((round) => (
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

                <form.Field
                  name="reportDate"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return 'Report date is required';
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Report Date *</Label>
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
            </CardContent>
          </Card>

          {/* Financial Metrics */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Financial Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <form.Field
                  name="totalInvestedAmount"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value || Number(value) < 0) return 'Total invested amount must be positive';
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Total Invested Amount ($) *</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0.00"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="fairValue"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value || Number(value) < 0) return 'Fair value must be positive';
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Fair Value ($) *</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0.00"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="cashRealized"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value || Number(value) < 0) return 'Cash realized must be positive';
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Cash Realized ($) *</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        min="0"
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
            </CardContent>
          </Card>

          {/* Performance Ratios */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Performance Ratios</CardTitle>
              <CardDescription className="text-sm">
                Optional metrics - these can be calculated automatically or entered manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <form.Field name="tvpi">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>TVPI (Total Value to Paid-In)</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g., 2.50"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="dpi">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>DPI (Distributions to Paid-In)</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g., 1.25"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="rvpi">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>RVPI (Residual Value to Paid-In)</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g., 1.25"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="irr">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>IRR (%) (Internal Rate of Return)</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g., 15.5"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="nav">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>NAV (Net Asset Value)</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0.00"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="totalFundUnits">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Total Fund Units</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0.00"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field name="navPerShare">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>NAV per Share</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.0001"
                        min="0"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="0.0000"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <form.Field name="notes">
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Additional Notes</Label>
                    <textarea
                      id={field.name}
                      name={field.name}
                      rows={4}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Add any additional notes or context for this performance snapshot..."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button 
                  type="submit" 
                  disabled={!canSubmit}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditMode ? 'Update' : 'Create'}
                    </>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
