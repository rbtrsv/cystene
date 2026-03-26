'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useIncomeStatements } from '@/modules/assetmanager/hooks/use-income-statements';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { CreateIncomeStatementSchema, UpdateIncomeStatementSchema, type IncomeStatement, type FinancialScenario, type Quarter, type Semester, type Month } from '@/modules/assetmanager/schemas/income-statements.schemas';
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

interface IncomeStatementFormProps {
  id?: number;
  initialData?: IncomeStatement;
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

export default function IncomeStatementForm({ id, initialData }: IncomeStatementFormProps) {
  const router = useRouter();
  const { selectedIncomeStatement, addIncomeStatement, editIncomeStatement, fetchIncomeStatement, isLoading, error, clearError } = useIncomeStatements();
  const { companies } = useCompanies();
  
  const isEditMode = !!id;
  const currentYear = new Date().getFullYear();
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      companyId: initialData?.companyId || selectedIncomeStatement?.companyId || undefined,
      year: initialData?.year?.toString() || selectedIncomeStatement?.year?.toString() || currentYear.toString(),
      semester: initialData?.semester || selectedIncomeStatement?.semester || '',
      quarter: initialData?.quarter || selectedIncomeStatement?.quarter || '',
      month: initialData?.month || selectedIncomeStatement?.month || '',
      periodStart: initialData?.periodStart || selectedIncomeStatement?.periodStart || '',
      periodEnd: initialData?.periodEnd || selectedIncomeStatement?.periodEnd || '',
      scenario: initialData?.scenario || selectedIncomeStatement?.scenario || 'Actual',
      revenue: initialData?.revenue?.toString() || selectedIncomeStatement?.revenue?.toString() || '',
      costOfGoods: initialData?.costOfGoods?.toString() || selectedIncomeStatement?.costOfGoods?.toString() || '',
      grossProfit: initialData?.grossProfit?.toString() || selectedIncomeStatement?.grossProfit?.toString() || '',
      researchAndDevelopment: initialData?.researchAndDevelopment?.toString() || selectedIncomeStatement?.researchAndDevelopment?.toString() || '',
      sellingGeneralAndAdministrative: initialData?.sellingGeneralAndAdministrative?.toString() || selectedIncomeStatement?.sellingGeneralAndAdministrative?.toString() || '',
      otherOperatingExpenses: initialData?.otherOperatingExpenses?.toString() || selectedIncomeStatement?.otherOperatingExpenses?.toString() || '',
      operatingIncome: initialData?.operatingIncome?.toString() || selectedIncomeStatement?.operatingIncome?.toString() || '',
      nonOperatingInterestIncome: initialData?.nonOperatingInterestIncome?.toString() || selectedIncomeStatement?.nonOperatingInterestIncome?.toString() || '',
      nonOperatingInterestExpense: initialData?.nonOperatingInterestExpense?.toString() || selectedIncomeStatement?.nonOperatingInterestExpense?.toString() || '',
      otherIncomeExpense: initialData?.otherIncomeExpense?.toString() || selectedIncomeStatement?.otherIncomeExpense?.toString() || '',
      pretaxIncome: initialData?.pretaxIncome?.toString() || selectedIncomeStatement?.pretaxIncome?.toString() || '',
      incomeTax: initialData?.incomeTax?.toString() || selectedIncomeStatement?.incomeTax?.toString() || '',
      netIncome: initialData?.netIncome?.toString() || selectedIncomeStatement?.netIncome?.toString() || '',
      epsBasic: initialData?.epsBasic?.toString() || selectedIncomeStatement?.epsBasic?.toString() || '',
      epsDiluted: initialData?.epsDiluted?.toString() || selectedIncomeStatement?.epsDiluted?.toString() || '',
      basicSharesOutstanding: initialData?.basicSharesOutstanding?.toString() || selectedIncomeStatement?.basicSharesOutstanding?.toString() || '',
      dilutedSharesOutstanding: initialData?.dilutedSharesOutstanding?.toString() || selectedIncomeStatement?.dilutedSharesOutstanding?.toString() || '',
      ebitda: initialData?.ebitda?.toString() || selectedIncomeStatement?.ebitda?.toString() || '',
      netIncomeContinuousOperations: initialData?.netIncomeContinuousOperations?.toString() || selectedIncomeStatement?.netIncomeContinuousOperations?.toString() || '',
      minorityInterests: initialData?.minorityInterests?.toString() || selectedIncomeStatement?.minorityInterests?.toString() || '',
      preferredStockDividends: initialData?.preferredStockDividends?.toString() || selectedIncomeStatement?.preferredStockDividends?.toString() || '',
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
          revenue: value.revenue ? Number(value.revenue) : undefined,
          costOfGoods: value.costOfGoods ? Number(value.costOfGoods) : undefined,
          grossProfit: value.grossProfit ? Number(value.grossProfit) : undefined,
          researchAndDevelopment: value.researchAndDevelopment ? Number(value.researchAndDevelopment) : undefined,
          sellingGeneralAndAdministrative: value.sellingGeneralAndAdministrative ? Number(value.sellingGeneralAndAdministrative) : undefined,
          otherOperatingExpenses: value.otherOperatingExpenses ? Number(value.otherOperatingExpenses) : undefined,
          operatingIncome: value.operatingIncome ? Number(value.operatingIncome) : undefined,
          nonOperatingInterestIncome: value.nonOperatingInterestIncome ? Number(value.nonOperatingInterestIncome) : undefined,
          nonOperatingInterestExpense: value.nonOperatingInterestExpense ? Number(value.nonOperatingInterestExpense) : undefined,
          otherIncomeExpense: value.otherIncomeExpense ? Number(value.otherIncomeExpense) : undefined,
          pretaxIncome: value.pretaxIncome ? Number(value.pretaxIncome) : undefined,
          incomeTax: value.incomeTax ? Number(value.incomeTax) : undefined,
          netIncome: value.netIncome ? Number(value.netIncome) : undefined,
          epsBasic: value.epsBasic ? Number(value.epsBasic) : undefined,
          epsDiluted: value.epsDiluted ? Number(value.epsDiluted) : undefined,
          basicSharesOutstanding: value.basicSharesOutstanding ? Number(value.basicSharesOutstanding) : undefined,
          dilutedSharesOutstanding: value.dilutedSharesOutstanding ? Number(value.dilutedSharesOutstanding) : undefined,
          ebitda: value.ebitda ? Number(value.ebitda) : undefined,
          netIncomeContinuousOperations: value.netIncomeContinuousOperations ? Number(value.netIncomeContinuousOperations) : undefined,
          minorityInterests: value.minorityInterests ? Number(value.minorityInterests) : undefined,
          preferredStockDividends: value.preferredStockDividends ? Number(value.preferredStockDividends) : undefined,
        };
        
        const schema = isEditMode ? UpdateIncomeStatementSchema : CreateIncomeStatementSchema;
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
        revenue: value.revenue ? Number(value.revenue) : undefined,
        costOfGoods: value.costOfGoods ? Number(value.costOfGoods) : undefined,
        grossProfit: value.grossProfit ? Number(value.grossProfit) : undefined,
        researchAndDevelopment: value.researchAndDevelopment ? Number(value.researchAndDevelopment) : undefined,
        sellingGeneralAndAdministrative: value.sellingGeneralAndAdministrative ? Number(value.sellingGeneralAndAdministrative) : undefined,
        otherOperatingExpenses: value.otherOperatingExpenses ? Number(value.otherOperatingExpenses) : undefined,
        operatingIncome: value.operatingIncome ? Number(value.operatingIncome) : undefined,
        nonOperatingInterestIncome: value.nonOperatingInterestIncome ? Number(value.nonOperatingInterestIncome) : undefined,
        nonOperatingInterestExpense: value.nonOperatingInterestExpense ? Number(value.nonOperatingInterestExpense) : undefined,
        otherIncomeExpense: value.otherIncomeExpense ? Number(value.otherIncomeExpense) : undefined,
        pretaxIncome: value.pretaxIncome ? Number(value.pretaxIncome) : undefined,
        incomeTax: value.incomeTax ? Number(value.incomeTax) : undefined,
        netIncome: value.netIncome ? Number(value.netIncome) : undefined,
        epsBasic: value.epsBasic ? Number(value.epsBasic) : undefined,
        epsDiluted: value.epsDiluted ? Number(value.epsDiluted) : undefined,
        basicSharesOutstanding: value.basicSharesOutstanding ? Number(value.basicSharesOutstanding) : undefined,
        dilutedSharesOutstanding: value.dilutedSharesOutstanding ? Number(value.dilutedSharesOutstanding) : undefined,
        ebitda: value.ebitda ? Number(value.ebitda) : undefined,
        netIncomeContinuousOperations: value.netIncomeContinuousOperations ? Number(value.netIncomeContinuousOperations) : undefined,
        minorityInterests: value.minorityInterests ? Number(value.minorityInterests) : undefined,
        preferredStockDividends: value.preferredStockDividends ? Number(value.preferredStockDividends) : undefined,
      };
      
      const schema = isEditMode ? UpdateIncomeStatementSchema : CreateIncomeStatementSchema;
      const result = schema.parse(transformedValue);
      
      const success = isEditMode 
        ? await editIncomeStatement(id!, result)
        : await addIncomeStatement(result);
        
      if (success) {
        router.push(isEditMode ? `/dashboard/income-statements/${id}` : '/dashboard/income-statements');
      }
    },
  });
  
  useEffect(() => {
    if (isEditMode && id && !initialData) fetchIncomeStatement(id);
  }, [isEditMode, id, initialData, fetchIncomeStatement]);
  
  useEffect(() => {
    if (selectedIncomeStatement && isEditMode) {
      form.reset({
        companyId: selectedIncomeStatement.companyId,
        year: selectedIncomeStatement.year?.toString() || currentYear.toString(),
        semester: selectedIncomeStatement.semester || '',
        quarter: selectedIncomeStatement.quarter || '',
        month: selectedIncomeStatement.month || '',
        periodStart: selectedIncomeStatement.periodStart || '',
        periodEnd: selectedIncomeStatement.periodEnd || '',
        scenario: selectedIncomeStatement.scenario || 'Actual',
        revenue: selectedIncomeStatement.revenue?.toString() || '',
        costOfGoods: selectedIncomeStatement.costOfGoods?.toString() || '',
        grossProfit: selectedIncomeStatement.grossProfit?.toString() || '',
        researchAndDevelopment: selectedIncomeStatement.researchAndDevelopment?.toString() || '',
        sellingGeneralAndAdministrative: selectedIncomeStatement.sellingGeneralAndAdministrative?.toString() || '',
        otherOperatingExpenses: selectedIncomeStatement.otherOperatingExpenses?.toString() || '',
        operatingIncome: selectedIncomeStatement.operatingIncome?.toString() || '',
        nonOperatingInterestIncome: selectedIncomeStatement.nonOperatingInterestIncome?.toString() || '',
        nonOperatingInterestExpense: selectedIncomeStatement.nonOperatingInterestExpense?.toString() || '',
        otherIncomeExpense: selectedIncomeStatement.otherIncomeExpense?.toString() || '',
        pretaxIncome: selectedIncomeStatement.pretaxIncome?.toString() || '',
        incomeTax: selectedIncomeStatement.incomeTax?.toString() || '',
        netIncome: selectedIncomeStatement.netIncome?.toString() || '',
        epsBasic: selectedIncomeStatement.epsBasic?.toString() || '',
        epsDiluted: selectedIncomeStatement.epsDiluted?.toString() || '',
        basicSharesOutstanding: selectedIncomeStatement.basicSharesOutstanding?.toString() || '',
        dilutedSharesOutstanding: selectedIncomeStatement.dilutedSharesOutstanding?.toString() || '',
        ebitda: selectedIncomeStatement.ebitda?.toString() || '',
        netIncomeContinuousOperations: selectedIncomeStatement.netIncomeContinuousOperations?.toString() || '',
        minorityInterests: selectedIncomeStatement.minorityInterests?.toString() || '',
        preferredStockDividends: selectedIncomeStatement.preferredStockDividends?.toString() || '',
      });
    }
  }, [selectedIncomeStatement, isEditMode, form, currentYear]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Income Statement' : 'Create Income Statement'}</CardTitle>
          <CardDescription>Loading income statement information...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit Income Statement' : 'Create Income Statement'}</CardTitle>
          <CardDescription>Error loading income statement</CardDescription>
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
          {isEditMode ? 'Edit Income Statement' : 'Create Income Statement'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update income statement details' : 'Add a new income statement'}
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

          {/* Revenue Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Revenue & Cost of Goods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="revenue">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Revenue</Label>
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
                  <form.Field name="costOfGoods">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Cost of Goods</Label>
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
                  <form.Field name="grossProfit">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Gross Profit</Label>
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

          {/* Operating Expenses Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Operating Expenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="researchAndDevelopment">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Research & Development</Label>
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
                  <form.Field name="sellingGeneralAndAdministrative">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>SG&A</Label>
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
                  <form.Field name="otherOperatingExpenses">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Other Operating Expenses</Label>
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
                  <form.Field name="operatingIncome">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Operating Income</Label>
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

          {/* Non-Operating Items */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Non-Operating Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="nonOperatingInterestIncome">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Interest Income</Label>
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
                  <form.Field name="nonOperatingInterestExpense">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Interest Expense</Label>
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
                  <form.Field name="otherIncomeExpense">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Other Income/Expense</Label>
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

          {/* Income Summary */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Income Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="pretaxIncome">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Pretax Income</Label>
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
                  <form.Field name="incomeTax">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Income Tax</Label>
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
                  <form.Field name="ebitda">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>EBITDA</Label>
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
                  <form.Field name="netIncomeContinuousOperations">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Net Income (Continuous Operations)</Label>
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

          {/* Per Share Metrics */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Per Share Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="epsBasic">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>EPS (Basic)</Label>
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
                  <form.Field name="epsDiluted">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>EPS (Diluted)</Label>
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
                  <form.Field name="basicSharesOutstanding">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Basic Shares Outstanding</Label>
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
                  <form.Field name="dilutedSharesOutstanding">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Diluted Shares Outstanding</Label>
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
                  <form.Field name="minorityInterests">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Minority Interests</Label>
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
                  <form.Field name="preferredStockDividends">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Preferred Stock Dividends</Label>
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
                    {isEditMode ? 'Update Income Statement' : 'Create Income Statement'}
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