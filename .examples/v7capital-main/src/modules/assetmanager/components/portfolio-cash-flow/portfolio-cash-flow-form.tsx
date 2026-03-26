'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { usePortfolioCashFlow } from '@/modules/assetmanager/hooks/use-portfolio-cash-flow';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
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
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Save } from 'lucide-react';
import { 
  type CreatePortfolioCashFlowInput,
  type UpdatePortfolioCashFlowInput,
  type CashFlowType,
  type CashFlowScenario,
  type Currency,
  cashFlowTypeEnum,
  cashFlowScenarioEnum,
  currencyEnum
} from '@/modules/assetmanager/schemas/portfolio-cash-flow.schemas';

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

interface PortfolioCashFlowFormProps {
  id?: number;
  companyId?: number;
  fundId?: number;
  roundId?: number;
}

export default function PortfolioCashFlowForm({ 
  id, 
  companyId, 
  fundId, 
  roundId 
}: PortfolioCashFlowFormProps) {
  const router = useRouter();
  const { 
    selectedCashFlow,
    addCashFlow, 
    editCashFlow, 
    fetchCashFlow, 
    isLoading, 
    error, 
    clearError 
  } = usePortfolioCashFlow();
  
  const {
    companies,
    fetchCompanies
  } = useCompanies();

  const {
    funds,
    fetchFunds
  } = useFunds();

  const {
    rounds,
    fetchRounds
  } = useRounds();
  
  const isEditMode = !!id;
  
  // Setup TanStack Form
  const form = useForm({
    defaultValues: {
      companyId: companyId || selectedCashFlow?.companyId || undefined,
      fundId: fundId || selectedCashFlow?.fundId || undefined,
      roundId: roundId || selectedCashFlow?.roundId || undefined,
      date: selectedCashFlow?.date ? (selectedCashFlow.date instanceof Date ? selectedCashFlow.date.toISOString().split('T')[0] : selectedCashFlow.date) : new Date().toISOString().split('T')[0],
      amountDebit: selectedCashFlow?.amountDebit || undefined,
      amountCredit: selectedCashFlow?.amountCredit || undefined,
      currency: (selectedCashFlow?.currency as Currency) || 'EUR',
      cashFlowType: (selectedCashFlow?.cashFlowType as CashFlowType) || 'Investment',
      scenario: (selectedCashFlow?.scenario as CashFlowScenario) || 'Actual',
      transactionReference: selectedCashFlow?.transactionReference || '',
      description: selectedCashFlow?.description || '',
      includeInIrr: selectedCashFlow?.includeInIrr ?? true,
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate required fields
        if (!value.companyId || value.companyId === 0) {
          console.error('Company ID is required');
          return;
        }
        if (!value.fundId || value.fundId === 0) {
          console.error('Fund ID is required');
          return;
        }
        if (!value.roundId || value.roundId === 0) {
          console.error('Round ID is required');
          return;
        }

        // Convert form data to the correct format with proper type conversion
        const formData: CreatePortfolioCashFlowInput | UpdatePortfolioCashFlowInput = {
          companyId: Number(value.companyId),
          fundId: Number(value.fundId),
          roundId: Number(value.roundId),
          date: typeof value.date === 'string' ? new Date(value.date) : value.date,
          amountDebit: value.amountDebit ? Number(value.amountDebit) : undefined,
          amountCredit: value.amountCredit ? Number(value.amountCredit) : undefined,
          currency: value.currency,
          cashFlowType: value.cashFlowType,
          scenario: value.scenario,
          transactionReference: value.transactionReference || null,
          description: value.description || null,
          includeInIrr: value.includeInIrr,
        };

        let success = false;
        if (isEditMode && id) {
          success = await editCashFlow(id, formData as UpdatePortfolioCashFlowInput);
        } else {
          success = await addCashFlow(formData as CreatePortfolioCashFlowInput);
        }

        if (success) {
          router.push('/dashboard/portfolio/cash-flows');
        }
      } catch (err) {
        console.error('Error submitting form:', err);
      }
    },
  });

  // Fetch data on mount
  useEffect(() => {
    fetchCompanies();
    fetchFunds();
    fetchRounds();
    
    if (isEditMode && id) {
      fetchCashFlow(id);
    }
  }, [id, isEditMode, fetchCashFlow, fetchCompanies, fetchFunds, fetchRounds]);

  // Reset form when selectedCashFlow changes
  useEffect(() => {
    if (isEditMode && selectedCashFlow) {
      form.reset({
        companyId: selectedCashFlow.companyId,
        fundId: selectedCashFlow.fundId,
        roundId: selectedCashFlow.roundId,
        date: selectedCashFlow.date instanceof Date ? selectedCashFlow.date.toISOString().split('T')[0] : selectedCashFlow.date,
        amountDebit: selectedCashFlow.amountDebit || undefined,
        amountCredit: selectedCashFlow.amountCredit || undefined,
        currency: (selectedCashFlow.currency as Currency) || 'EUR',
        cashFlowType: selectedCashFlow.cashFlowType as CashFlowType,
        scenario: selectedCashFlow.scenario as CashFlowScenario,
        transactionReference: selectedCashFlow.transactionReference || '',
        description: selectedCashFlow.description || '',
        includeInIrr: selectedCashFlow.includeInIrr,
      });
    }
  }, [selectedCashFlow, isEditMode, form]);


  if (isLoading && isEditMode) {
    return (
      <>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Loading cash flow details...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit Cash Flow' : 'Create Cash Flow'}</CardTitle>
          <CardDescription>Error loading data</CardDescription>
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
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Cash Flow' : 'Create Cash Flow'}
        </CardTitle>
        <CardDescription>
          {isEditMode 
            ? 'Update the cash flow details below' 
            : 'Add a new cash flow entry to your portfolio'
          }
        </CardDescription>
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
            {/* Entity Selection Section */}
            <Card className="shadow-none border-muted bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Entity Selection</CardTitle>
                <CardDescription>Select the company, fund, and round for this cash flow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 pb-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <form.Field
                name="companyId"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value === 0) return 'Company is required';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Company *</Label>
                    <Select
                      value={field.state.value?.toString() || ''}
                      onValueChange={(value) => field.handleChange(value ? parseInt(value, 10) : undefined)}
                      disabled={!!companyId} // Disable if pre-selected
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company..." />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id!.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

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
                      onValueChange={(value) => field.handleChange(value ? parseInt(value, 10) : undefined)}
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
              </CardContent>
            </Card>

            {/* Basic Information Section */}
            <Card className="shadow-none border-muted bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Date and currency for this cash flow transaction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 pb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor={field.name}>Date *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>

              <form.Field
                name="currency"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return 'Currency is required';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Currency *</Label>
                    <Select 
                      value={field.state.value} 
                      onValueChange={(value) => field.handleChange(value as Currency)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyEnum.options.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
                </div>
              </CardContent>
            </Card>

            {/* Amount Details Section */}
            <Card className="shadow-none border-muted bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Amount Details</CardTitle>
                <CardDescription>
                  Fund perspective: <strong>Debit</strong> = money coming INTO the fund (exits, dividends), 
                  <strong>Credit</strong> = money going OUT of the fund (investments, fees) - only one should be set
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 pb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field
                  name="amountDebit"
                  validators={{
                    onChange: ({ value }) => {
                      if (value !== undefined && value !== null) {
                        const numValue = Number(value);
                        if (isNaN(numValue)) return 'Amount must be a valid number';
                        if (numValue < 0) return 'Amount cannot be negative';
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Debit Amount (Fund Inflow)</Label>
                      <p className="text-xs text-muted-foreground mb-1">Exits, dividends, distributions</p>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                        placeholder="0.00"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="amountCredit"
                  validators={{
                    onChange: ({ value }) => {
                      if (value !== undefined && value !== null) {
                        const numValue = Number(value);
                        if (isNaN(numValue)) return 'Amount must be a valid number';
                        if (numValue < 0) return 'Amount cannot be negative';
                      }
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Credit Amount (Fund Outflow)</Label>
                      <p className="text-xs text-muted-foreground mb-1">Investments, follow-ons, fees</p>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        min="0"
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                        placeholder="0.00"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
                </div>
              </CardContent>
            </Card>

            {/* Classification Section */}
            <Card className="shadow-none border-muted bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Classification</CardTitle>
                <CardDescription>Cash flow type and scenario classification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 pb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <form.Field
                name="cashFlowType"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return 'Cash flow type is required';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Cash Flow Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as CashFlowType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cashFlowTypeEnum.options.map((type) => (
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

              <form.Field
                name="scenario"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return 'Scenario is required';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Scenario *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as CashFlowScenario)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select scenario..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cashFlowScenarioEnum.options.map((scenario) => (
                          <SelectItem key={scenario} value={scenario}>
                            {scenario}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information Section */}
            <Card className="shadow-none border-muted bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Additional Information</CardTitle>
                <CardDescription>Optional transaction reference, description, and IRR settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 pb-3">
                {/* Transaction Reference */}
                <form.Field 
              name="transactionReference"
              validators={{
                onChange: ({ value }) => {
                  if (value && typeof value === 'string') {
                    if (value.length > 100) return 'Transaction reference is too long';
                  }
                  return undefined;
                }
              }}
            >
              {(field) => (
                <div>
                  <Label htmlFor={field.name}>Transaction Reference</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional transaction reference..."
                  />
                  <FieldInfo field={field} />
                </div>
              )}
                </form.Field>

                {/* Description */}
                <form.Field 
              name="description"
              validators={{
                onChange: ({ value }) => {
                  if (value && typeof value === 'string') {
                    if (value.length > 1000) return 'Description is too long';
                  }
                  return undefined;
                }
              }}
            >
              {(field) => (
                <div>
                  <Label htmlFor={field.name}>Description</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
                </form.Field>

                {/* Include in IRR */}
                <form.Field name="includeInIrr">
                  {(field) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(!!checked)}
                      />
                      <Label htmlFor={field.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Include in IRR calculation
                      </Label>
                    </div>
                  )}
                </form.Field>
              </CardContent>
            </Card>

          </div>

          <div className="flex justify-between mt-6">
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
                      {isEditMode ? 'Update Cash Flow' : 'Create Cash Flow'}
                    </>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
