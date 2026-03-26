'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useOperationalMetrics } from '@/modules/assetmanager/hooks/use-operational-metrics';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { CreateOperationalMetricsSchema, UpdateOperationalMetricsSchema, type OperationalMetrics, type FinancialScenario, type Quarter, type Semester, type Month } from '@/modules/assetmanager/schemas/operational-metrics.schemas';
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
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/modules/shadcnui/components/ui/select';
import { Save } from 'lucide-react';

interface OperationalMetricsFormProps {
  id?: number;
  initialData?: OperationalMetrics;
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

export default function OperationalMetricsForm({ id, initialData }: OperationalMetricsFormProps) {
  const router = useRouter();
  const { selectedOperationalMetric, addOperationalMetric, editOperationalMetric, fetchOperationalMetric, isLoading, error, clearError } = useOperationalMetrics();
  const { companies } = useCompanies();
  
  const isEditMode = !!id;
  const currentYear = new Date().getFullYear();
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      companyId: initialData?.companyId || selectedOperationalMetric?.companyId || undefined,
      year: initialData?.year?.toString() || currentYear.toString(),
      semester: initialData?.semester || '',
      quarter: initialData?.quarter || '',
      month: initialData?.month || '',
      scenario: initialData?.scenario || 'Actual',
      fullYear: initialData?.fullYear || false,
      date: initialData?.date || '',
      
      // Cash metrics
      burnRate: initialData?.burnRate?.toString() || '',
      runwayMonths: initialData?.runwayMonths?.toString() || '',
      runwayGross: initialData?.runwayGross?.toString() || '',
      runwayNet: initialData?.runwayNet?.toString() || '',
      
      // Efficiency metrics
      burnMultiple: initialData?.burnMultiple?.toString() || '',
      ruleOf40: initialData?.ruleOf40?.toString() || '',
      
      // Unit economics
      grossMargin: initialData?.grossMargin?.toString() || '',
      contributionMargin: initialData?.contributionMargin?.toString() || '',
      
      // Productivity metrics
      revenuePerEmployee: initialData?.revenuePerEmployee?.toString() || '',
      profitPerEmployee: initialData?.profitPerEmployee?.toString() || '',
      
      // Investment metrics
      capitalEfficiency: initialData?.capitalEfficiency?.toString() || '',
      cashConversionCycle: initialData?.cashConversionCycle?.toString() || '',
      
      // Operating metrics
      capex: initialData?.capex?.toString() || '',
      ebitda: initialData?.ebitda?.toString() || '',
      totalCosts: initialData?.totalCosts?.toString() || '',
      
      notes: initialData?.notes || '',
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
          scenario: value.scenario,
          fullYear: value.fullYear,
          date: value.date || undefined,
          
          // Cash metrics
          burnRate: value.burnRate ? Number(value.burnRate) : undefined,
          runwayMonths: value.runwayMonths ? Number(value.runwayMonths) : undefined,
          runwayGross: value.runwayGross ? Number(value.runwayGross) : undefined,
          runwayNet: value.runwayNet ? Number(value.runwayNet) : undefined,
          
          // Efficiency metrics
          burnMultiple: value.burnMultiple ? Number(value.burnMultiple) : undefined,
          ruleOf40: value.ruleOf40 ? Number(value.ruleOf40) : undefined,
          
          // Unit economics
          grossMargin: value.grossMargin ? Number(value.grossMargin) : undefined,
          contributionMargin: value.contributionMargin ? Number(value.contributionMargin) : undefined,
          
          // Productivity metrics
          revenuePerEmployee: value.revenuePerEmployee ? Number(value.revenuePerEmployee) : undefined,
          profitPerEmployee: value.profitPerEmployee ? Number(value.profitPerEmployee) : undefined,
          
          // Investment metrics
          capitalEfficiency: value.capitalEfficiency ? Number(value.capitalEfficiency) : undefined,
          cashConversionCycle: value.cashConversionCycle ? Number(value.cashConversionCycle) : undefined,
          
          // Operating metrics
          capex: value.capex ? Number(value.capex) : undefined,
          ebitda: value.ebitda ? Number(value.ebitda) : undefined,
          totalCosts: value.totalCosts ? Number(value.totalCosts) : undefined,
          
          notes: value.notes || undefined,
        };
        
        const schema = isEditMode ? UpdateOperationalMetricsSchema : CreateOperationalMetricsSchema;
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
        scenario: value.scenario as FinancialScenario,
        fullYear: value.fullYear,
        date: value.date || undefined,
        
        // Cash metrics
        burnRate: value.burnRate ? Number(value.burnRate) : undefined,
        runwayMonths: value.runwayMonths ? Number(value.runwayMonths) : undefined,
        runwayGross: value.runwayGross ? Number(value.runwayGross) : undefined,
        runwayNet: value.runwayNet ? Number(value.runwayNet) : undefined,
        
        // Efficiency metrics
        burnMultiple: value.burnMultiple ? Number(value.burnMultiple) : undefined,
        ruleOf40: value.ruleOf40 ? Number(value.ruleOf40) : undefined,
        
        // Unit economics
        grossMargin: value.grossMargin ? Number(value.grossMargin) : undefined,
        contributionMargin: value.contributionMargin ? Number(value.contributionMargin) : undefined,
        
        // Productivity metrics
        revenuePerEmployee: value.revenuePerEmployee ? Number(value.revenuePerEmployee) : undefined,
        profitPerEmployee: value.profitPerEmployee ? Number(value.profitPerEmployee) : undefined,
        
        // Investment metrics
        capitalEfficiency: value.capitalEfficiency ? Number(value.capitalEfficiency) : undefined,
        cashConversionCycle: value.cashConversionCycle ? Number(value.cashConversionCycle) : undefined,
        
        // Operating metrics
        capex: value.capex ? Number(value.capex) : undefined,
        ebitda: value.ebitda ? Number(value.ebitda) : undefined,
        totalCosts: value.totalCosts ? Number(value.totalCosts) : undefined,
        
        notes: value.notes || undefined,
      };
      
      const schema = isEditMode ? UpdateOperationalMetricsSchema : CreateOperationalMetricsSchema;
      const result = schema.parse(transformedValue);
      
      const success = isEditMode 
        ? await editOperationalMetric(id!, result)
        : await addOperationalMetric(result);
        
      if (success) {
        router.push(isEditMode ? `/dashboard/operational-metrics/${id}` : '/dashboard/operational-metrics');
      }
    },
  });
  
  useEffect(() => {
    if (isEditMode && id && !initialData) fetchOperationalMetric(id);
  }, [isEditMode, id, initialData, fetchOperationalMetric]);
  
  useEffect(() => {
    if (selectedOperationalMetric && isEditMode) {
      form.reset({
        companyId: selectedOperationalMetric.companyId,
        year: selectedOperationalMetric.year?.toString() || currentYear.toString(),
        semester: selectedOperationalMetric.semester || '',
        quarter: selectedOperationalMetric.quarter || '',
        month: selectedOperationalMetric.month || '',
        scenario: selectedOperationalMetric.scenario || 'Actual',
        fullYear: selectedOperationalMetric.fullYear || false,
        date: selectedOperationalMetric.date || '',
        
        // Cash metrics
        burnRate: selectedOperationalMetric.burnRate?.toString() || '',
        runwayMonths: selectedOperationalMetric.runwayMonths?.toString() || '',
        runwayGross: selectedOperationalMetric.runwayGross?.toString() || '',
        runwayNet: selectedOperationalMetric.runwayNet?.toString() || '',
        
        // Efficiency metrics
        burnMultiple: selectedOperationalMetric.burnMultiple?.toString() || '',
        ruleOf40: selectedOperationalMetric.ruleOf40?.toString() || '',
        
        // Unit economics
        grossMargin: selectedOperationalMetric.grossMargin?.toString() || '',
        contributionMargin: selectedOperationalMetric.contributionMargin?.toString() || '',
        
        // Productivity metrics
        revenuePerEmployee: selectedOperationalMetric.revenuePerEmployee?.toString() || '',
        profitPerEmployee: selectedOperationalMetric.profitPerEmployee?.toString() || '',
        
        // Investment metrics
        capitalEfficiency: selectedOperationalMetric.capitalEfficiency?.toString() || '',
        cashConversionCycle: selectedOperationalMetric.cashConversionCycle?.toString() || '',
        
        // Operating metrics
        capex: selectedOperationalMetric.capex?.toString() || '',
        ebitda: selectedOperationalMetric.ebitda?.toString() || '',
        totalCosts: selectedOperationalMetric.totalCosts?.toString() || '',
        
        notes: selectedOperationalMetric.notes || '',
      });
    }
  }, [selectedOperationalMetric, isEditMode, form, currentYear]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Operational Metrics' : 'Create Operational Metrics'}</CardTitle>
          <CardDescription>Loading operational metrics information...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit Operational Metrics' : 'Create Operational Metrics'}</CardTitle>
          <CardDescription>Error loading operational metrics</CardDescription>
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
          {isEditMode ? 'Edit Operational Metrics' : 'Create Operational Metrics'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update operational metrics details' : 'Add new operational metrics'}
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
                  <form.Field name="date">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Date (Optional)</Label>
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
                  <form.Field name="fullYear">
                    {(field) => (
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id={field.name}
                          checked={field.state.value || false}
                          onCheckedChange={(checked) => field.handleChange(!!checked)}
                        />
                        <Label htmlFor={field.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Full Year
                        </Label>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cash Metrics Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cash Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="burnRate">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Monthly Burn Rate</Label>
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
                  <form.Field name="runwayMonths">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Runway (Months)</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="runwayGross">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Gross Runway</Label>
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
                  <form.Field name="runwayNet">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Net Runway</Label>
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

          {/* Efficiency Metrics Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Efficiency Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="burnMultiple">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Burn Multiple</Label>
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
                  <form.Field name="ruleOf40">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Rule of 40 (%)</Label>
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

          {/* Unit Economics Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Unit Economics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="grossMargin">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Gross Margin (%)</Label>
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
                  <form.Field name="contributionMargin">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Contribution Margin (%)</Label>
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

          {/* Productivity Metrics Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Productivity Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="revenuePerEmployee">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Revenue per Employee</Label>
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
                  <form.Field name="profitPerEmployee">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Profit per Employee</Label>
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

          {/* Investment Metrics Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Investment Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="capitalEfficiency">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Capital Efficiency</Label>
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
                  <form.Field name="cashConversionCycle">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Cash Conversion Cycle (days)</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.0"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operating Metrics Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Operating Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="capex">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Capital Expenditures (CAPEX)</Label>
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
                  <form.Field name="totalCosts">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Total Costs</Label>
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

          {/* Notes Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="space-y-2">
                <form.Field name="notes">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Notes (Optional)</Label>
                      <Textarea
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter any additional notes about these operational metrics..."
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
                    {isEditMode ? 'Update Operational Metrics' : 'Create Operational Metrics'}
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