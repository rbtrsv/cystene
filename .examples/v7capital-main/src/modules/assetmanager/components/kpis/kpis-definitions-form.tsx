'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useKpis } from '@/modules/assetmanager/hooks/use-kpis';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { 
  Card,
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
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
import { ArrowLeft, Save } from 'lucide-react';
import { 
  type CreateKpiInput,
  type UpdateKpiInput,
  type KpiDataType,
  kpiDataTypeEnum
} from '@/modules/assetmanager/schemas/kpis.schemas';

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

interface KpisDefinitionsFormProps {
  id?: number;
  companyId?: number;
}

export default function KpisDefinitionsForm({ 
  id, 
  companyId 
}: KpisDefinitionsFormProps) {
  const router = useRouter();
  const { 
    selectedKpi,
    addKpi, 
    editKpi, 
    fetchKpi, 
    isLoading, 
    error, 
    clearError 
  } = useKpis();
  
  const { 
    companies, 
    fetchCompanies,
    getCompanyName 
  } = useCompanies();
  
  const isEditMode = !!id;
  
  // Setup TanStack Form
  const form = useForm({
    defaultValues: {
      companyId: companyId || selectedKpi?.companyId || undefined,
      name: selectedKpi?.name || '',
      description: selectedKpi?.description || '',
      dataType: (selectedKpi?.dataType as KpiDataType) || 'DECIMAL',
      isCalculated: selectedKpi?.isCalculated || false,
      formula: selectedKpi?.formula || '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate required fields
        if (!value.companyId || value.companyId === 0) {
          console.error('Company ID is required');
          return;
        }
        if (!value.name || value.name.trim() === '') {
          console.error('KPI name is required');
          return;
        }

        // Convert form data to the correct format
        const formData: CreateKpiInput | UpdateKpiInput = {
          companyId: Number(value.companyId),
          name: value.name.trim(),
          description: value.description?.trim() || null,
          dataType: value.dataType,
          isCalculated: value.isCalculated,
          formula: value.formula?.trim() || null,
        };

        let success = false;
        if (isEditMode && id) {
          success = await editKpi(id, formData as UpdateKpiInput);
        } else {
          success = await addKpi(formData as CreateKpiInput);
        }

        if (success) {
          router.push('/dashboard/kpis-definitions');
        }
      } catch (err) {
        console.error('Error submitting form:', err);
      }
    },
  });

  // Fetch data on mount
  useEffect(() => {
    fetchCompanies();
    
    if (isEditMode && id) {
      fetchKpi(id);
    }
  }, [id, isEditMode, fetchKpi, fetchCompanies]);

  // Reset form when selectedKpi changes
  useEffect(() => {
    if (isEditMode && selectedKpi) {
      form.reset({
        companyId: selectedKpi.companyId,
        name: selectedKpi.name,
        description: selectedKpi.description || '',
        dataType: selectedKpi.dataType,
        isCalculated: selectedKpi.isCalculated,
        formula: selectedKpi.formula || '',
      });
    }
  }, [selectedKpi, isEditMode, form]);

  const handleBack = () => {
    router.push('/dashboard/kpis-definitions');
  };

  if (isLoading && isEditMode) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Loading KPI definition...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit KPI Definition' : 'Create KPI Definition'}</CardTitle>
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
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit KPI Definition' : 'Create KPI Definition'}</CardTitle>
        <CardDescription>
          {isEditMode 
            ? 'Update the KPI definition details below' 
            : 'Define a new key performance indicator that can be tracked over time'
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
        <CardContent>
          <div className="space-y-6">
            {/* Company Selection */}
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

            {/* KPI Name */}
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim() === '') return 'KPI name is required';
                  if (value.length > 100) return 'KPI name is too long';
                  return undefined;
                }
              }}
            >
              {(field) => (
                <div>
                  <Label htmlFor={field.name}>KPI Name *</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Monthly Recurring Revenue, Customer Acquisition Cost"
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
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Describe what this KPI measures and how it should be interpreted..."
                    rows={3}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            {/* Data Type */}
            <form.Field
              name="dataType"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return 'Data type is required';
                  return undefined;
                }
              }}
            >
              {(field) => (
                <div>
                  <Label htmlFor={field.name}>Data Type *</Label>
                  <Select 
                    value={field.state.value} 
                    onValueChange={(value) => field.handleChange(value as KpiDataType)}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      {kpiDataTypeEnum.options.map((dataType) => (
                        <SelectItem key={dataType} value={dataType}>
                          {dataType === 'DECIMAL' ? 'Decimal Numbers (e.g., 1.23)' :
                           dataType === 'INTEGER' ? 'Whole Numbers (e.g., 42)' :
                           'Text/String (e.g., "High", "Low")'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            {/* Is Calculated */}
            <form.Field name="isCalculated">
              {(field) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(!!checked)}
                  />
                  <Label htmlFor={field.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    This KPI is calculated from other metrics
                  </Label>
                </div>
              )}
            </form.Field>

            {/* Formula (only show if isCalculated is true) */}
            <form.Subscribe selector={(state) => state.values.isCalculated}>
              {(isCalculated) => (
                isCalculated ? (
                  <form.Field 
                    name="formula"
                    validators={{
                      onChange: ({ value }) => {
                        if (value && typeof value === 'string') {
                          if (value.length > 500) return 'Formula is too long';
                        }
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Formula</Label>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Describe how this KPI is calculated, e.g. 'Revenue / Number of Customers'"
                          rows={2}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Describe the calculation method for this KPI
                        </p>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                ) : null
              )}
            </form.Subscribe>

          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          
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
                    {isEditMode ? 'Update KPI Definition' : 'Create KPI Definition'}
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