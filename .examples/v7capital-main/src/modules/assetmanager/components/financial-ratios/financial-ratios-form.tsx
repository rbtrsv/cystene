'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useFinancialRatios } from '@/modules/assetmanager/hooks/use-financial-ratios';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { CreateFinancialRatiosSchema, UpdateFinancialRatiosSchema, type FinancialRatios, type FinancialScenario, type Quarter, type Semester, type Month } from '@/modules/assetmanager/schemas/financial-ratios.schemas';
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

interface FinancialRatiosFormProps {
  id?: number;
  initialData?: FinancialRatios;
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

export default function FinancialRatiosForm({ id, initialData }: FinancialRatiosFormProps) {
  const router = useRouter();
  const { selectedFinancialRatio, addFinancialRatio, editFinancialRatio, fetchFinancialRatio, isLoading, error, clearError } = useFinancialRatios();
  const { companies, fetchCompanies } = useCompanies();
  
  const isEditMode = !!id;
  const currentYear = new Date().getFullYear();
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      companyId: initialData?.companyId || selectedFinancialRatio?.companyId || undefined,
      year: initialData?.year?.toString() || selectedFinancialRatio?.year?.toString() || currentYear.toString(),
      semester: initialData?.semester || selectedFinancialRatio?.semester || '',
      quarter: initialData?.quarter || selectedFinancialRatio?.quarter || '',
      month: initialData?.month || selectedFinancialRatio?.month || '',
      scenario: initialData?.scenario || selectedFinancialRatio?.scenario || 'Actual',
      fullYear: initialData?.fullYear || selectedFinancialRatio?.fullYear || false,
      date: initialData?.date || selectedFinancialRatio?.date || '',
      
      // Liquidity ratios
      currentRatio: initialData?.currentRatio?.toString() || selectedFinancialRatio?.currentRatio?.toString() || '',
      quickRatio: initialData?.quickRatio?.toString() || selectedFinancialRatio?.quickRatio?.toString() || '',
      cashRatio: initialData?.cashRatio?.toString() || selectedFinancialRatio?.cashRatio?.toString() || '',
      operatingCashFlowRatio: initialData?.operatingCashFlowRatio?.toString() || selectedFinancialRatio?.operatingCashFlowRatio?.toString() || '',

      // Solvency ratios
      debtToEquityRatio: initialData?.debtToEquityRatio?.toString() || selectedFinancialRatio?.debtToEquityRatio?.toString() || '',
      debtToAssetsRatio: initialData?.debtToAssetsRatio?.toString() || selectedFinancialRatio?.debtToAssetsRatio?.toString() || '',
      interestCoverageRatio: initialData?.interestCoverageRatio?.toString() || selectedFinancialRatio?.interestCoverageRatio?.toString() || '',
      debtServiceCoverageRatio: initialData?.debtServiceCoverageRatio?.toString() || selectedFinancialRatio?.debtServiceCoverageRatio?.toString() || '',

      // Profitability ratios
      grossProfitMargin: initialData?.grossProfitMargin?.toString() || selectedFinancialRatio?.grossProfitMargin?.toString() || '',
      operatingProfitMargin: initialData?.operatingProfitMargin?.toString() || selectedFinancialRatio?.operatingProfitMargin?.toString() || '',
      netProfitMargin: initialData?.netProfitMargin?.toString() || selectedFinancialRatio?.netProfitMargin?.toString() || '',
      ebitdaMargin: initialData?.ebitdaMargin?.toString() || selectedFinancialRatio?.ebitdaMargin?.toString() || '',
      returnOnAssets: initialData?.returnOnAssets?.toString() || selectedFinancialRatio?.returnOnAssets?.toString() || '',
      returnOnEquity: initialData?.returnOnEquity?.toString() || selectedFinancialRatio?.returnOnEquity?.toString() || '',
      returnOnInvestedCapital: initialData?.returnOnInvestedCapital?.toString() || selectedFinancialRatio?.returnOnInvestedCapital?.toString() || '',

      // Efficiency ratios
      assetTurnoverRatio: initialData?.assetTurnoverRatio?.toString() || selectedFinancialRatio?.assetTurnoverRatio?.toString() || '',
      inventoryTurnoverRatio: initialData?.inventoryTurnoverRatio?.toString() || selectedFinancialRatio?.inventoryTurnoverRatio?.toString() || '',
      receivablesTurnoverRatio: initialData?.receivablesTurnoverRatio?.toString() || selectedFinancialRatio?.receivablesTurnoverRatio?.toString() || '',
      daysSalesOutstanding: initialData?.daysSalesOutstanding?.toString() || selectedFinancialRatio?.daysSalesOutstanding?.toString() || '',
      daysInventoryOutstanding: initialData?.daysInventoryOutstanding?.toString() || selectedFinancialRatio?.daysInventoryOutstanding?.toString() || '',
      daysPayablesOutstanding: initialData?.daysPayablesOutstanding?.toString() || selectedFinancialRatio?.daysPayablesOutstanding?.toString() || '',

      // Investment ratios
      earningsPerShare: initialData?.earningsPerShare?.toString() || selectedFinancialRatio?.earningsPerShare?.toString() || '',
      priceEarningsRatio: initialData?.priceEarningsRatio?.toString() || selectedFinancialRatio?.priceEarningsRatio?.toString() || '',
      dividendYield: initialData?.dividendYield?.toString() || selectedFinancialRatio?.dividendYield?.toString() || '',
      dividendPayoutRatio: initialData?.dividendPayoutRatio?.toString() || selectedFinancialRatio?.dividendPayoutRatio?.toString() || '',
      bookValuePerShare: initialData?.bookValuePerShare?.toString() || selectedFinancialRatio?.bookValuePerShare?.toString() || '',

      notes: initialData?.notes || selectedFinancialRatio?.notes || '',
    },
    
    // Form-level validation using full schema
    validators: {
      onChange: ({ value }) => {
        // Transform strings to proper types for schema validation
        const transformedValue = {
          companyId: value.companyId,
          year: value.year ? Number(value.year) : undefined,
          semester: value.semester || undefined,
          quarter: value.quarter || undefined,
          month: value.month || undefined,
          scenario: value.scenario as FinancialScenario,
          fullYear: value.fullYear || false,
          date: value.date || undefined,
          
          // Transform all number fields
          currentRatio: value.currentRatio ? Number(value.currentRatio) : undefined,
          quickRatio: value.quickRatio ? Number(value.quickRatio) : undefined,
          cashRatio: value.cashRatio ? Number(value.cashRatio) : undefined,
          operatingCashFlowRatio: value.operatingCashFlowRatio ? Number(value.operatingCashFlowRatio) : undefined,
          
          debtToEquityRatio: value.debtToEquityRatio ? Number(value.debtToEquityRatio) : undefined,
          debtToAssetsRatio: value.debtToAssetsRatio ? Number(value.debtToAssetsRatio) : undefined,
          interestCoverageRatio: value.interestCoverageRatio ? Number(value.interestCoverageRatio) : undefined,
          debtServiceCoverageRatio: value.debtServiceCoverageRatio ? Number(value.debtServiceCoverageRatio) : undefined,
          
          grossProfitMargin: value.grossProfitMargin ? Number(value.grossProfitMargin) : undefined,
          operatingProfitMargin: value.operatingProfitMargin ? Number(value.operatingProfitMargin) : undefined,
          netProfitMargin: value.netProfitMargin ? Number(value.netProfitMargin) : undefined,
          ebitdaMargin: value.ebitdaMargin ? Number(value.ebitdaMargin) : undefined,
          returnOnAssets: value.returnOnAssets ? Number(value.returnOnAssets) : undefined,
          returnOnEquity: value.returnOnEquity ? Number(value.returnOnEquity) : undefined,
          returnOnInvestedCapital: value.returnOnInvestedCapital ? Number(value.returnOnInvestedCapital) : undefined,
          
          assetTurnoverRatio: value.assetTurnoverRatio ? Number(value.assetTurnoverRatio) : undefined,
          inventoryTurnoverRatio: value.inventoryTurnoverRatio ? Number(value.inventoryTurnoverRatio) : undefined,
          receivablesTurnoverRatio: value.receivablesTurnoverRatio ? Number(value.receivablesTurnoverRatio) : undefined,
          daysSalesOutstanding: value.daysSalesOutstanding ? Number(value.daysSalesOutstanding) : undefined,
          daysInventoryOutstanding: value.daysInventoryOutstanding ? Number(value.daysInventoryOutstanding) : undefined,
          daysPayablesOutstanding: value.daysPayablesOutstanding ? Number(value.daysPayablesOutstanding) : undefined,
          
          earningsPerShare: value.earningsPerShare ? Number(value.earningsPerShare) : undefined,
          priceEarningsRatio: value.priceEarningsRatio ? Number(value.priceEarningsRatio) : undefined,
          dividendYield: value.dividendYield ? Number(value.dividendYield) : undefined,
          dividendPayoutRatio: value.dividendPayoutRatio ? Number(value.dividendPayoutRatio) : undefined,
          bookValuePerShare: value.bookValuePerShare ? Number(value.bookValuePerShare) : undefined,
          
          notes: value.notes || undefined,
        };
        
        const schema = isEditMode ? UpdateFinancialRatiosSchema : CreateFinancialRatiosSchema;
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
      const transformedValue = {
        companyId: value.companyId!,
        year: Number(value.year),
        semester: value.semester || undefined,
        quarter: value.quarter || undefined,
        month: value.month || undefined,
        scenario: value.scenario as FinancialScenario,
        fullYear: value.fullYear || false,
        date: value.date || undefined,
        
        currentRatio: value.currentRatio ? Number(value.currentRatio) : undefined,
        quickRatio: value.quickRatio ? Number(value.quickRatio) : undefined,
        cashRatio: value.cashRatio ? Number(value.cashRatio) : undefined,
        operatingCashFlowRatio: value.operatingCashFlowRatio ? Number(value.operatingCashFlowRatio) : undefined,
        
        debtToEquityRatio: value.debtToEquityRatio ? Number(value.debtToEquityRatio) : undefined,
        debtToAssetsRatio: value.debtToAssetsRatio ? Number(value.debtToAssetsRatio) : undefined,
        interestCoverageRatio: value.interestCoverageRatio ? Number(value.interestCoverageRatio) : undefined,
        debtServiceCoverageRatio: value.debtServiceCoverageRatio ? Number(value.debtServiceCoverageRatio) : undefined,
        
        grossProfitMargin: value.grossProfitMargin ? Number(value.grossProfitMargin) : undefined,
        operatingProfitMargin: value.operatingProfitMargin ? Number(value.operatingProfitMargin) : undefined,
        netProfitMargin: value.netProfitMargin ? Number(value.netProfitMargin) : undefined,
        ebitdaMargin: value.ebitdaMargin ? Number(value.ebitdaMargin) : undefined,
        returnOnAssets: value.returnOnAssets ? Number(value.returnOnAssets) : undefined,
        returnOnEquity: value.returnOnEquity ? Number(value.returnOnEquity) : undefined,
        returnOnInvestedCapital: value.returnOnInvestedCapital ? Number(value.returnOnInvestedCapital) : undefined,
        
        assetTurnoverRatio: value.assetTurnoverRatio ? Number(value.assetTurnoverRatio) : undefined,
        inventoryTurnoverRatio: value.inventoryTurnoverRatio ? Number(value.inventoryTurnoverRatio) : undefined,
        receivablesTurnoverRatio: value.receivablesTurnoverRatio ? Number(value.receivablesTurnoverRatio) : undefined,
        daysSalesOutstanding: value.daysSalesOutstanding ? Number(value.daysSalesOutstanding) : undefined,
        daysInventoryOutstanding: value.daysInventoryOutstanding ? Number(value.daysInventoryOutstanding) : undefined,
        daysPayablesOutstanding: value.daysPayablesOutstanding ? Number(value.daysPayablesOutstanding) : undefined,
        
        earningsPerShare: value.earningsPerShare ? Number(value.earningsPerShare) : undefined,
        priceEarningsRatio: value.priceEarningsRatio ? Number(value.priceEarningsRatio) : undefined,
        dividendYield: value.dividendYield ? Number(value.dividendYield) : undefined,
        dividendPayoutRatio: value.dividendPayoutRatio ? Number(value.dividendPayoutRatio) : undefined,
        bookValuePerShare: value.bookValuePerShare ? Number(value.bookValuePerShare) : undefined,
        
        notes: value.notes || undefined,
      };
      
      const schema = isEditMode ? UpdateFinancialRatiosSchema : CreateFinancialRatiosSchema;
      const result = schema.parse(transformedValue);
      
      const success = isEditMode 
        ? await editFinancialRatio(id!, result)
        : await addFinancialRatio(result);
        
      if (success) {
        router.push(isEditMode ? `/dashboard/financial-ratios/${id}` : '/dashboard/financial-ratios');
      }
    },
  });
  
  useEffect(() => {
    fetchCompanies();
    if (isEditMode && id && !initialData) {
      fetchFinancialRatio(id);
    }
  }, [isEditMode, id, initialData, fetchFinancialRatio, fetchCompanies]);
  
  useEffect(() => {
    if (selectedFinancialRatio && isEditMode) {
      form.reset({
        companyId: selectedFinancialRatio.companyId || undefined,
        year: selectedFinancialRatio.year?.toString() || currentYear.toString(),
        semester: selectedFinancialRatio.semester || '',
        quarter: selectedFinancialRatio.quarter || '',
        month: selectedFinancialRatio.month || '',
        scenario: selectedFinancialRatio.scenario || 'Actual',
        fullYear: selectedFinancialRatio.fullYear || false,
        date: selectedFinancialRatio.date || '',
        
        currentRatio: selectedFinancialRatio.currentRatio?.toString() || '',
        quickRatio: selectedFinancialRatio.quickRatio?.toString() || '',
        cashRatio: selectedFinancialRatio.cashRatio?.toString() || '',
        operatingCashFlowRatio: selectedFinancialRatio.operatingCashFlowRatio?.toString() || '',
        
        debtToEquityRatio: selectedFinancialRatio.debtToEquityRatio?.toString() || '',
        debtToAssetsRatio: selectedFinancialRatio.debtToAssetsRatio?.toString() || '',
        interestCoverageRatio: selectedFinancialRatio.interestCoverageRatio?.toString() || '',
        debtServiceCoverageRatio: selectedFinancialRatio.debtServiceCoverageRatio?.toString() || '',
        
        grossProfitMargin: selectedFinancialRatio.grossProfitMargin?.toString() || '',
        operatingProfitMargin: selectedFinancialRatio.operatingProfitMargin?.toString() || '',
        netProfitMargin: selectedFinancialRatio.netProfitMargin?.toString() || '',
        ebitdaMargin: selectedFinancialRatio.ebitdaMargin?.toString() || '',
        returnOnAssets: selectedFinancialRatio.returnOnAssets?.toString() || '',
        returnOnEquity: selectedFinancialRatio.returnOnEquity?.toString() || '',
        returnOnInvestedCapital: selectedFinancialRatio.returnOnInvestedCapital?.toString() || '',
        
        assetTurnoverRatio: selectedFinancialRatio.assetTurnoverRatio?.toString() || '',
        inventoryTurnoverRatio: selectedFinancialRatio.inventoryTurnoverRatio?.toString() || '',
        receivablesTurnoverRatio: selectedFinancialRatio.receivablesTurnoverRatio?.toString() || '',
        daysSalesOutstanding: selectedFinancialRatio.daysSalesOutstanding?.toString() || '',
        daysInventoryOutstanding: selectedFinancialRatio.daysInventoryOutstanding?.toString() || '',
        daysPayablesOutstanding: selectedFinancialRatio.daysPayablesOutstanding?.toString() || '',
        
        earningsPerShare: selectedFinancialRatio.earningsPerShare?.toString() || '',
        priceEarningsRatio: selectedFinancialRatio.priceEarningsRatio?.toString() || '',
        dividendYield: selectedFinancialRatio.dividendYield?.toString() || '',
        dividendPayoutRatio: selectedFinancialRatio.dividendPayoutRatio?.toString() || '',
        bookValuePerShare: selectedFinancialRatio.bookValuePerShare?.toString() || '',
        
        notes: selectedFinancialRatio.notes || '',
      });
    }
  }, [selectedFinancialRatio, isEditMode, form, currentYear]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Financial Ratios' : 'Create Financial Ratios'}</CardTitle>
          <CardDescription>Loading financial ratios information...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit Financial Ratios' : 'Create Financial Ratios'}</CardTitle>
          <CardDescription>Error loading form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </>
    );
  }

  return (
    <Card className="max-w-5xl mx-auto max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Financial Ratios' : 'Create Financial Ratios'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update financial ratios details' : 'Add new financial ratios'}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                
                <div className="space-y-2">
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
                        <Label htmlFor={field.name}>Company</Label>
                        <Select
                          value={field.state.value?.toString() || ''}
                          onValueChange={(value) => field.handleChange(parseInt(value, 10))}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select company" />
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
                </div>

                <div className="space-y-2">
                  <form.Field
                    name="year"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return 'Year is required';
                        const numValue = Number(value);
                        if (isNaN(numValue)) return 'Year must be a number';
                        const currentYear = new Date().getFullYear();
                        if (numValue < 1900 || numValue > currentYear + 10) return 'Invalid year';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Year</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter year"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="scenario">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Scenario</Label>
                        <Select
                          value={field.state.value || 'Actual'}
                          onValueChange={(value) => field.handleChange(value as FinancialScenario)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select scenario" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Actual">Actual</SelectItem>
                            <SelectItem value="Forecast">Forecast</SelectItem>
                            <SelectItem value="Budget">Budget</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="semester">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Semester (Optional)</Label>
                        <Select 
                          value={field.state.value || 'none'} 
                          onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="H1">H1 (First Half)</SelectItem>
                            <SelectItem value="H2">H2 (Second Half)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="quarter">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Quarter (Optional)</Label>
                        <Select 
                          value={field.state.value || 'none'} 
                          onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select quarter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="Q1">Q1 (First Quarter)</SelectItem>
                            <SelectItem value="Q2">Q2 (Second Quarter)</SelectItem>
                            <SelectItem value="Q3">Q3 (Third Quarter)</SelectItem>
                            <SelectItem value="Q4">Q4 (Fourth Quarter)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="month">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Month (Optional)</Label>
                        <Select 
                          value={field.state.value || 'none'} 
                          onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="January">January</SelectItem>
                            <SelectItem value="February">February</SelectItem>
                            <SelectItem value="March">March</SelectItem>
                            <SelectItem value="April">April</SelectItem>
                            <SelectItem value="May">May</SelectItem>
                            <SelectItem value="June">June</SelectItem>
                            <SelectItem value="July">July</SelectItem>
                            <SelectItem value="August">August</SelectItem>
                            <SelectItem value="September">September</SelectItem>
                            <SelectItem value="October">October</SelectItem>
                            <SelectItem value="November">November</SelectItem>
                            <SelectItem value="December">December</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="date">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Date (Optional)</Label>
                        <Input
                          id={field.name}
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
              </div>
            </CardContent>
          </Card>

          {/* Liquidity Ratios */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Liquidity Ratios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="currentRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Current Ratio</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="quickRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Quick Ratio</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="cashRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Cash Ratio</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="operatingCashFlowRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Operating Cash Flow Ratio</Label>
                        <Input
                          id={field.name}
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

          {/* Solvency Ratios */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Solvency Ratios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="debtToEquityRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Debt-to-Equity Ratio</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="debtToAssetsRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Debt-to-Assets Ratio</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="interestCoverageRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Interest Coverage Ratio</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="debtServiceCoverageRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Debt Service Coverage Ratio</Label>
                        <Input
                          id={field.name}
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

          {/* Profitability Ratios */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Profitability Ratios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="grossProfitMargin">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Gross Profit Margin (%)</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="operatingProfitMargin">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Operating Profit Margin (%)</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="netProfitMargin">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Net Profit Margin (%)</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="ebitdaMargin">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>EBITDA Margin (%)</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="returnOnAssets">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Return on Assets (%)</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="returnOnEquity">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Return on Equity (%)</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="returnOnInvestedCapital">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Return on Invested Capital (%)</Label>
                        <Input
                          id={field.name}
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

          {/* Efficiency & Investment Ratios */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Efficiency & Investment Ratios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="assetTurnoverRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Asset Turnover Ratio</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="inventoryTurnoverRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Inventory Turnover Ratio</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="receivablesTurnoverRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Receivables Turnover Ratio</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="daysSalesOutstanding">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Days Sales Outstanding</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="daysInventoryOutstanding">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Days Inventory Outstanding</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="daysPayablesOutstanding">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Days Payables Outstanding</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="earningsPerShare">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Earnings Per Share</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="priceEarningsRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Price-to-Earnings Ratio</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="dividendYield">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Dividend Yield (%)</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="dividendPayoutRatio">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Dividend Payout Ratio (%)</Label>
                        <Input
                          id={field.name}
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

                <div className="space-y-2">
                  <form.Field name="bookValuePerShare">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Book Value Per Share</Label>
                        <Input
                          id={field.name}
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

          {/* Notes */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="space-y-2">
                <form.Field name="notes">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Additional Notes (Optional)</Label>
                      <Textarea
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter any additional notes about these financial ratios..."
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
                    {isEditMode ? 'Update Financial Ratios' : 'Create Financial Ratios'}
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