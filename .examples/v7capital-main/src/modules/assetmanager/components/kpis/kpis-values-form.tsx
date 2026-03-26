'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useKpis } from '@/modules/assetmanager/hooks/use-kpis';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { 
  CreateKpiValueSchema, 
  UpdateKpiValueSchema,
  type KpiValue,
  type FinancialScenario 
} from '@/modules/assetmanager/schemas/kpis.schemas';
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
import { Save } from 'lucide-react';

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

interface KpisValuesFormProps {
  id?: number;
  kpiId?: number;
  initialData?: KpiValue;
}

export default function KpisValuesForm({ id, kpiId, initialData }: KpisValuesFormProps) {
  const router = useRouter();
  const { selectedKpiValue, addKpiValue, editKpiValue, fetchKpiValue, kpis, fetchKpis, isLoading, error, clearError } = useKpis();
  const { getCompanyName } = useCompanies();
  
  const isEditMode = !!id;
  const currentYear = new Date().getFullYear();
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      kpiId: initialData?.kpiId?.toString() || selectedKpiValue?.kpiId?.toString() || kpiId?.toString() || '',
      date: initialData?.date || selectedKpiValue?.date || new Date().toISOString().split('T')[0],
      year: initialData?.year?.toString() || selectedKpiValue?.year?.toString() || currentYear.toString(),
      semester: initialData?.semester || selectedKpiValue?.semester || '',
      quarter: initialData?.quarter || selectedKpiValue?.quarter || '',
      month: initialData?.month || selectedKpiValue?.month || '',
      fullYear: initialData?.fullYear || selectedKpiValue?.fullYear || false,
      scenario: initialData?.scenario || selectedKpiValue?.scenario || 'Actual',
      value: initialData?.value?.toString() || selectedKpiValue?.value?.toString() || '',
    },
    
    // Form-level validation using full schema
    validators: {
      onChange: ({ value }) => {
        // Transform form strings to match schema expectations
        const transformedValue = {
          kpiId: value.kpiId ? Number(value.kpiId) : undefined,
          date: value.date || undefined,
          year: value.year ? Number(value.year) : undefined,
          semester: value.semester || undefined,
          quarter: value.quarter || undefined,
          month: value.month || undefined,
          fullYear: value.fullYear,
          scenario: value.scenario,
          value: value.value ? Number(value.value) : undefined,
        };
        
        const schema = isEditMode ? UpdateKpiValueSchema : CreateKpiValueSchema;
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
        kpiId: value.kpiId ? Number(value.kpiId) : undefined,
        date: value.date || undefined,
        year: value.year ? Number(value.year) : undefined,
        semester: value.semester || undefined,
        quarter: value.quarter || undefined,
        month: value.month || undefined,
        fullYear: value.fullYear,
        scenario: value.scenario as FinancialScenario,
        value: value.value ? Number(value.value) : undefined,
      };
      
      const schema = isEditMode ? UpdateKpiValueSchema : CreateKpiValueSchema;
      const result = schema.parse(transformedValue);
      
      const success = isEditMode 
        ? await editKpiValue(id!, result)
        : await addKpiValue(result);
        
      if (success) {
        router.push(isEditMode ? `/dashboard/kpis-values/${id}` : '/dashboard/kpis-values');
      }
    },
  });

  useEffect(() => {
    fetchKpis();
    if (isEditMode && id && !initialData) fetchKpiValue(id);
  }, [isEditMode, id, initialData, fetchKpiValue, fetchKpis]);
  
  useEffect(() => {
    if (selectedKpiValue && isEditMode) {
      form.reset({
        kpiId: selectedKpiValue.kpiId?.toString() || '',
        date: selectedKpiValue.date || new Date().toISOString().split('T')[0],
        year: selectedKpiValue.year?.toString() || currentYear.toString(),
        semester: selectedKpiValue.semester || '',
        quarter: selectedKpiValue.quarter || '',
        month: selectedKpiValue.month || '',
        fullYear: selectedKpiValue.fullYear || false,
        scenario: selectedKpiValue.scenario || 'Actual',
        value: selectedKpiValue.value?.toString() || '',
      });
    }
  }, [selectedKpiValue, isEditMode, form, currentYear]);

  // Group KPIs by company for better UX
  const kpisByCompany = kpis.reduce((acc, kpi) => {
    const companyName = getCompanyName(kpi.companyId);
    if (!acc[companyName]) {
      acc[companyName] = [];
    }
    acc[companyName].push(kpi);
    return acc;
  }, {} as Record<string, typeof kpis>);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit KPI Value' : 'Create KPI Value'}</CardTitle>
          <CardDescription>Loading KPI value information...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit KPI Value' : 'Create KPI Value'}</CardTitle>
          <CardDescription>Error loading KPI value</CardDescription>
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
          {isEditMode ? 'Edit KPI Value' : 'Create KPI Value'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update KPI value details' : 'Add a new KPI value'}
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
                  <form.Field
                    name="kpiId"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return 'KPI is required';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>KPI</Label>
                        <Select
                          value={field.state.value || ''}
                          onValueChange={(value) => field.handleChange(value)}
                          disabled={!!kpiId}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select KPI" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(kpisByCompany).map(([companyName, companyKpis]) => (
                              <div key={companyName}>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                  {companyName}
                                </div>
                                {companyKpis.map((kpi) => (
                                  <SelectItem key={kpi.id} value={kpi.id!.toString()}>
                                    <div className="flex items-center gap-2">
                                      <span>{kpi.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({kpi.dataType})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </div>
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
            </CardContent>
          </Card>

          {/* Date and Time Period */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Date & Time Period</CardTitle>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
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
                  <form.Field name="value">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Value</Label>
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
                    {isEditMode ? 'Update KPI Value' : 'Create KPI Value'}
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