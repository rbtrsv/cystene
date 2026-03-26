'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useCashFlowStatements } from '@/modules/assetmanager/hooks/use-cash-flow-statements';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { CreateCashFlowStatementSchema, UpdateCashFlowStatementSchema, type CashFlowStatement, type FinancialScenario, type Quarter, type Semester, type Month } from '@/modules/assetmanager/schemas/cash-flow-statements.schemas';
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

interface CashFlowStatementFormProps {
  id?: number;
  initialData?: CashFlowStatement;
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

export default function CashFlowStatementForm({ id, initialData }: CashFlowStatementFormProps) {
  const router = useRouter();
  const { selectedCashFlowStatement, addCashFlowStatement, editCashFlowStatement, fetchCashFlowStatement, isLoading, error, clearError } = useCashFlowStatements();
  const { companies } = useCompanies();
  
  const isEditMode = !!id;
  const currentYear = new Date().getFullYear();
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      companyId: initialData?.companyId || selectedCashFlowStatement?.companyId || undefined,
      year: initialData?.year?.toString() || selectedCashFlowStatement?.year?.toString() || currentYear.toString(),
      semester: initialData?.semester || selectedCashFlowStatement?.semester || '',
      quarter: initialData?.quarter || selectedCashFlowStatement?.quarter || '',
      month: initialData?.month || selectedCashFlowStatement?.month || '',
      periodStart: initialData?.periodStart || selectedCashFlowStatement?.periodStart || '',
      periodEnd: initialData?.periodEnd || selectedCashFlowStatement?.periodEnd || '',
      scenario: initialData?.scenario || selectedCashFlowStatement?.scenario || 'Actual',
      // Operating Activities
      netIncome: initialData?.netIncome?.toString() || selectedCashFlowStatement?.netIncome?.toString() || '',
      depreciation: initialData?.depreciation?.toString() || selectedCashFlowStatement?.depreciation?.toString() || '',
      stockBasedCompensation: initialData?.stockBasedCompensation?.toString() || selectedCashFlowStatement?.stockBasedCompensation?.toString() || '',
      otherNonCashItems: initialData?.otherNonCashItems?.toString() || selectedCashFlowStatement?.otherNonCashItems?.toString() || '',
      accountsReceivable: initialData?.accountsReceivable?.toString() || selectedCashFlowStatement?.accountsReceivable?.toString() || '',
      accountsPayable: initialData?.accountsPayable?.toString() || selectedCashFlowStatement?.accountsPayable?.toString() || '',
      deferredTaxes: initialData?.deferredTaxes?.toString() || selectedCashFlowStatement?.deferredTaxes?.toString() || '',
      otherAssetsLiabilities: initialData?.otherAssetsLiabilities?.toString() || selectedCashFlowStatement?.otherAssetsLiabilities?.toString() || '',
      operatingCashFlow: initialData?.operatingCashFlow?.toString() || selectedCashFlowStatement?.operatingCashFlow?.toString() || '',
      // Investing Activities
      capitalExpenditures: initialData?.capitalExpenditures?.toString() || selectedCashFlowStatement?.capitalExpenditures?.toString() || '',
      netIntangibles: initialData?.netIntangibles?.toString() || selectedCashFlowStatement?.netIntangibles?.toString() || '',
      netAcquisitions: initialData?.netAcquisitions?.toString() || selectedCashFlowStatement?.netAcquisitions?.toString() || '',
      purchaseOfInvestments: initialData?.purchaseOfInvestments?.toString() || selectedCashFlowStatement?.purchaseOfInvestments?.toString() || '',
      saleOfInvestments: initialData?.saleOfInvestments?.toString() || selectedCashFlowStatement?.saleOfInvestments?.toString() || '',
      otherInvestingActivity: initialData?.otherInvestingActivity?.toString() || selectedCashFlowStatement?.otherInvestingActivity?.toString() || '',
      investingCashFlow: initialData?.investingCashFlow?.toString() || selectedCashFlowStatement?.investingCashFlow?.toString() || '',
      // Financing Activities
      longTermDebtIssuance: initialData?.longTermDebtIssuance?.toString() || selectedCashFlowStatement?.longTermDebtIssuance?.toString() || '',
      longTermDebtPayments: initialData?.longTermDebtPayments?.toString() || selectedCashFlowStatement?.longTermDebtPayments?.toString() || '',
      shortTermDebtIssuance: initialData?.shortTermDebtIssuance?.toString() || selectedCashFlowStatement?.shortTermDebtIssuance?.toString() || '',
      commonStockIssuance: initialData?.commonStockIssuance?.toString() || selectedCashFlowStatement?.commonStockIssuance?.toString() || '',
      commonStockRepurchase: initialData?.commonStockRepurchase?.toString() || selectedCashFlowStatement?.commonStockRepurchase?.toString() || '',
      commonDividends: initialData?.commonDividends?.toString() || selectedCashFlowStatement?.commonDividends?.toString() || '',
      otherFinancingCharges: initialData?.otherFinancingCharges?.toString() || selectedCashFlowStatement?.otherFinancingCharges?.toString() || '',
      financingCashFlow: initialData?.financingCashFlow?.toString() || selectedCashFlowStatement?.financingCashFlow?.toString() || '',
      // Summary
      endCashPosition: initialData?.endCashPosition?.toString() || selectedCashFlowStatement?.endCashPosition?.toString() || '',
      freeCashFlow: initialData?.freeCashFlow?.toString() || selectedCashFlowStatement?.freeCashFlow?.toString() || '',
      // Supplemental
      interestPaid: initialData?.interestPaid?.toString() || selectedCashFlowStatement?.interestPaid?.toString() || '',
      incomeTaxPaid: initialData?.incomeTaxPaid?.toString() || selectedCashFlowStatement?.incomeTaxPaid?.toString() || '',
    },
    
    // Form-level validation using full schema
    validators: {
      onChange: ({ value }) => {
        // Transform form strings to match schema expectations
        const transformedValue = {
          companyId: value.companyId,
          year: value.year ? Number(value.year) : undefined,
          semester: value.semester || undefined,
          quarter: value.quarter || undefined,
          month: value.month || undefined,
          periodStart: value.periodStart || undefined,
          periodEnd: value.periodEnd || undefined,
          scenario: value.scenario,
          netIncome: value.netIncome ? Number(value.netIncome) : undefined,
          depreciation: value.depreciation ? Number(value.depreciation) : undefined,
          stockBasedCompensation: value.stockBasedCompensation ? Number(value.stockBasedCompensation) : undefined,
          otherNonCashItems: value.otherNonCashItems ? Number(value.otherNonCashItems) : undefined,
          accountsReceivable: value.accountsReceivable ? Number(value.accountsReceivable) : undefined,
          accountsPayable: value.accountsPayable ? Number(value.accountsPayable) : undefined,
          deferredTaxes: value.deferredTaxes ? Number(value.deferredTaxes) : undefined,
          otherAssetsLiabilities: value.otherAssetsLiabilities ? Number(value.otherAssetsLiabilities) : undefined,
          operatingCashFlow: value.operatingCashFlow ? Number(value.operatingCashFlow) : undefined,
          capitalExpenditures: value.capitalExpenditures ? Number(value.capitalExpenditures) : undefined,
          netIntangibles: value.netIntangibles ? Number(value.netIntangibles) : undefined,
          netAcquisitions: value.netAcquisitions ? Number(value.netAcquisitions) : undefined,
          purchaseOfInvestments: value.purchaseOfInvestments ? Number(value.purchaseOfInvestments) : undefined,
          saleOfInvestments: value.saleOfInvestments ? Number(value.saleOfInvestments) : undefined,
          otherInvestingActivity: value.otherInvestingActivity ? Number(value.otherInvestingActivity) : undefined,
          investingCashFlow: value.investingCashFlow ? Number(value.investingCashFlow) : undefined,
          longTermDebtIssuance: value.longTermDebtIssuance ? Number(value.longTermDebtIssuance) : undefined,
          longTermDebtPayments: value.longTermDebtPayments ? Number(value.longTermDebtPayments) : undefined,
          shortTermDebtIssuance: value.shortTermDebtIssuance ? Number(value.shortTermDebtIssuance) : undefined,
          commonStockIssuance: value.commonStockIssuance ? Number(value.commonStockIssuance) : undefined,
          commonStockRepurchase: value.commonStockRepurchase ? Number(value.commonStockRepurchase) : undefined,
          commonDividends: value.commonDividends ? Number(value.commonDividends) : undefined,
          otherFinancingCharges: value.otherFinancingCharges ? Number(value.otherFinancingCharges) : undefined,
          financingCashFlow: value.financingCashFlow ? Number(value.financingCashFlow) : undefined,
          freeCashFlow: value.freeCashFlow ? Number(value.freeCashFlow) : undefined,
          endCashPosition: value.endCashPosition ? Number(value.endCashPosition) : undefined,
          interestPaid: value.interestPaid ? Number(value.interestPaid) : undefined,
          incomeTaxPaid: value.incomeTaxPaid ? Number(value.incomeTaxPaid) : undefined,
        };
        
        const schema = isEditMode ? UpdateCashFlowStatementSchema : CreateCashFlowStatementSchema;
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
      // Transform form strings to match schema expectations
      const transformedValue = {
        companyId: value.companyId,
        year: value.year ? Number(value.year) : undefined,
        semester: value.semester || undefined,
        quarter: value.quarter || undefined,
        month: value.month || undefined,
        periodStart: value.periodStart || undefined,
        periodEnd: value.periodEnd || undefined,
        scenario: value.scenario as FinancialScenario,
        netIncome: value.netIncome ? Number(value.netIncome) : undefined,
        depreciation: value.depreciation ? Number(value.depreciation) : undefined,
        stockBasedCompensation: value.stockBasedCompensation ? Number(value.stockBasedCompensation) : undefined,
        otherNonCashItems: value.otherNonCashItems ? Number(value.otherNonCashItems) : undefined,
        accountsReceivable: value.accountsReceivable ? Number(value.accountsReceivable) : undefined,
        accountsPayable: value.accountsPayable ? Number(value.accountsPayable) : undefined,
        deferredTaxes: value.deferredTaxes ? Number(value.deferredTaxes) : undefined,
        otherAssetsLiabilities: value.otherAssetsLiabilities ? Number(value.otherAssetsLiabilities) : undefined,
        operatingCashFlow: value.operatingCashFlow ? Number(value.operatingCashFlow) : undefined,
        capitalExpenditures: value.capitalExpenditures ? Number(value.capitalExpenditures) : undefined,
        netIntangibles: value.netIntangibles ? Number(value.netIntangibles) : undefined,
        netAcquisitions: value.netAcquisitions ? Number(value.netAcquisitions) : undefined,
        purchaseOfInvestments: value.purchaseOfInvestments ? Number(value.purchaseOfInvestments) : undefined,
        saleOfInvestments: value.saleOfInvestments ? Number(value.saleOfInvestments) : undefined,
        otherInvestingActivity: value.otherInvestingActivity ? Number(value.otherInvestingActivity) : undefined,
        investingCashFlow: value.investingCashFlow ? Number(value.investingCashFlow) : undefined,
        longTermDebtIssuance: value.longTermDebtIssuance ? Number(value.longTermDebtIssuance) : undefined,
        longTermDebtPayments: value.longTermDebtPayments ? Number(value.longTermDebtPayments) : undefined,
        shortTermDebtIssuance: value.shortTermDebtIssuance ? Number(value.shortTermDebtIssuance) : undefined,
        commonStockIssuance: value.commonStockIssuance ? Number(value.commonStockIssuance) : undefined,
        commonStockRepurchase: value.commonStockRepurchase ? Number(value.commonStockRepurchase) : undefined,
        commonDividends: value.commonDividends ? Number(value.commonDividends) : undefined,
        otherFinancingCharges: value.otherFinancingCharges ? Number(value.otherFinancingCharges) : undefined,
        financingCashFlow: value.financingCashFlow ? Number(value.financingCashFlow) : undefined,
        freeCashFlow: value.freeCashFlow ? Number(value.freeCashFlow) : undefined,
        endCashPosition: value.endCashPosition ? Number(value.endCashPosition) : undefined,
        interestPaid: value.interestPaid ? Number(value.interestPaid) : undefined,
        incomeTaxPaid: value.incomeTaxPaid ? Number(value.incomeTaxPaid) : undefined,
      };
      
      const schema = isEditMode ? UpdateCashFlowStatementSchema : CreateCashFlowStatementSchema;
      const result = schema.parse(transformedValue);
      
      const success = isEditMode 
        ? await editCashFlowStatement(id!, result)
        : await addCashFlowStatement(result);
        
      if (success) {
        router.push(isEditMode ? `/dashboard/cash-flow-statements/${id}` : '/dashboard/cash-flow-statements');
      }
    },
  });
  
  useEffect(() => {
    if (isEditMode && id && !initialData) fetchCashFlowStatement(id);
  }, [isEditMode, id, initialData, fetchCashFlowStatement]);
  
  useEffect(() => {
    if (selectedCashFlowStatement && isEditMode) {
      form.reset({
        companyId: selectedCashFlowStatement.companyId,
        year: selectedCashFlowStatement.year?.toString() || currentYear.toString(),
        semester: selectedCashFlowStatement.semester || '',
        quarter: selectedCashFlowStatement.quarter || '',
        month: selectedCashFlowStatement.month || '',
        periodStart: selectedCashFlowStatement.periodStart || '',
        periodEnd: selectedCashFlowStatement.periodEnd || '',
        scenario: selectedCashFlowStatement.scenario || 'Actual',
        netIncome: selectedCashFlowStatement.netIncome?.toString() || '',
        depreciation: selectedCashFlowStatement.depreciation?.toString() || '',
        stockBasedCompensation: selectedCashFlowStatement.stockBasedCompensation?.toString() || '',
        otherNonCashItems: selectedCashFlowStatement.otherNonCashItems?.toString() || '',
        accountsReceivable: selectedCashFlowStatement.accountsReceivable?.toString() || '',
        accountsPayable: selectedCashFlowStatement.accountsPayable?.toString() || '',
        deferredTaxes: selectedCashFlowStatement.deferredTaxes?.toString() || '',
        otherAssetsLiabilities: selectedCashFlowStatement.otherAssetsLiabilities?.toString() || '',
        operatingCashFlow: selectedCashFlowStatement.operatingCashFlow?.toString() || '',
        capitalExpenditures: selectedCashFlowStatement.capitalExpenditures?.toString() || '',
        netIntangibles: selectedCashFlowStatement.netIntangibles?.toString() || '',
        netAcquisitions: selectedCashFlowStatement.netAcquisitions?.toString() || '',
        purchaseOfInvestments: selectedCashFlowStatement.purchaseOfInvestments?.toString() || '',
        saleOfInvestments: selectedCashFlowStatement.saleOfInvestments?.toString() || '',
        otherInvestingActivity: selectedCashFlowStatement.otherInvestingActivity?.toString() || '',
        investingCashFlow: selectedCashFlowStatement.investingCashFlow?.toString() || '',
        longTermDebtIssuance: selectedCashFlowStatement.longTermDebtIssuance?.toString() || '',
        longTermDebtPayments: selectedCashFlowStatement.longTermDebtPayments?.toString() || '',
        shortTermDebtIssuance: selectedCashFlowStatement.shortTermDebtIssuance?.toString() || '',
        commonStockIssuance: selectedCashFlowStatement.commonStockIssuance?.toString() || '',
        commonStockRepurchase: selectedCashFlowStatement.commonStockRepurchase?.toString() || '',
        commonDividends: selectedCashFlowStatement.commonDividends?.toString() || '',
        otherFinancingCharges: selectedCashFlowStatement.otherFinancingCharges?.toString() || '',
        financingCashFlow: selectedCashFlowStatement.financingCashFlow?.toString() || '',
        freeCashFlow: selectedCashFlowStatement.freeCashFlow?.toString() || '',
        endCashPosition: selectedCashFlowStatement.endCashPosition?.toString() || '',
        interestPaid: selectedCashFlowStatement.interestPaid?.toString() || '',
        incomeTaxPaid: selectedCashFlowStatement.incomeTaxPaid?.toString() || '',
      });
    }
  }, [selectedCashFlowStatement, isEditMode, form, currentYear]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Cash Flow Statement' : 'Create Cash Flow Statement'}</CardTitle>
          <CardDescription>Loading cash flow statement information...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit Cash Flow Statement' : 'Create Cash Flow Statement'}</CardTitle>
          <CardDescription>Error loading cash flow statement</CardDescription>
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
    <Card className="max-w-5xl mx-auto max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Cash Flow Statement' : 'Create Cash Flow Statement'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update cash flow statement details' : 'Add a new cash flow statement'}
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
                          name={field.name}
                          type="number"
                          step="1"
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
                  <form.Field name="scenario">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Scenario</Label>
                        <Select 
                          value={field.state.value} 
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
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
                  <form.Field name="periodStart">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Period Start (Optional)</Label>
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
                  <form.Field name="periodEnd">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Period End (Optional)</Label>
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
              </div>
            </CardContent>
          </Card>

          {/* Operating Activities */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Operating Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="netIncome">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Net Income</Label>
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

                <div className="space-y-2">
                  <form.Field name="depreciation">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Depreciation</Label>
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

                <div className="space-y-2">
                  <form.Field name="stockBasedCompensation">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Stock-Based Compensation</Label>
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

                <div className="space-y-2">
                  <form.Field name="otherNonCashItems">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Other Non-Cash Items</Label>
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

                <div className="space-y-2">
                  <form.Field name="accountsReceivable">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Accounts Receivable</Label>
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

                <div className="space-y-2">
                  <form.Field name="accountsPayable">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Accounts Payable</Label>
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

                <div className="space-y-2">
                  <form.Field name="deferredTaxes">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Deferred Taxes</Label>
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

                <div className="space-y-2">
                  <form.Field name="otherAssetsLiabilities">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Other Assets & Liabilities</Label>
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

                <div className="space-y-2">
                  <form.Field name="operatingCashFlow">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Operating Cash Flow</Label>
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

          {/* Investing Activities */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Investing Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="capitalExpenditures">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Capital Expenditures</Label>
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

                <div className="space-y-2">
                  <form.Field name="netIntangibles">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Net Intangibles</Label>
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

                <div className="space-y-2">
                  <form.Field name="netAcquisitions">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Net Acquisitions</Label>
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

                <div className="space-y-2">
                  <form.Field name="purchaseOfInvestments">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Purchase of Investments</Label>
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

                <div className="space-y-2">
                  <form.Field name="saleOfInvestments">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Sale of Investments</Label>
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

                <div className="space-y-2">
                  <form.Field name="otherInvestingActivity">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Other Investing Activity</Label>
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

                <div className="space-y-2">
                  <form.Field name="investingCashFlow">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Investing Cash Flow</Label>
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

          {/* Financing Activities */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Financing Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="longTermDebtIssuance">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Long-Term Debt Issuance</Label>
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

                <div className="space-y-2">
                  <form.Field name="longTermDebtPayments">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Long-Term Debt Payments</Label>
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

                <div className="space-y-2">
                  <form.Field name="shortTermDebtIssuance">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Short-Term Debt Issuance</Label>
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

                <div className="space-y-2">
                  <form.Field name="commonStockIssuance">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Common Stock Issuance</Label>
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

                <div className="space-y-2">
                  <form.Field name="commonStockRepurchase">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Common Stock Repurchase</Label>
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

                <div className="space-y-2">
                  <form.Field name="commonDividends">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Common Dividends</Label>
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

                <div className="space-y-2">
                  <form.Field name="otherFinancingCharges">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Other Financing Charges</Label>
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

                <div className="space-y-2">
                  <form.Field name="financingCashFlow">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Financing Cash Flow</Label>
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

          {/* Cash Flow Summary */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cash Flow Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="freeCashFlow">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Free Cash Flow</Label>
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

                <div className="space-y-2">
                  <form.Field name="endCashPosition">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>End Cash Position</Label>
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

          {/* Additional Details */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="interestPaid">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Interest Paid</Label>
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

                <div className="space-y-2">
                  <form.Field name="incomeTaxPaid">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Income Tax Paid</Label>
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
                    {isEditMode ? 'Update Cash Flow Statement' : 'Create Cash Flow Statement'}
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