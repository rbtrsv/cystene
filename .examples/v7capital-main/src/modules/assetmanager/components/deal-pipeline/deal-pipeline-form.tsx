'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useDealPipeline } from '@/modules/assetmanager/hooks/use-deal-pipeline';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { CreateDealPipelineSchema, UpdateDealPipelineSchema, type DealPipeline, type DealStatus, type DealPriority, type SectorType } from '@/modules/assetmanager/schemas/deal-pipeline.schemas';
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

interface DealPipelineFormProps {
  id?: number;
  initialData?: DealPipeline;
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

export default function DealPipelineForm({ id, initialData }: DealPipelineFormProps) {
  const router = useRouter();
  const { selectedDealPipeline, addDealPipeline, editDealPipeline, fetchDealPipeline, isLoading, error, clearError } = useDealPipeline();
  const { companies } = useCompanies();
  
  const isEditMode = !!id;
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      companyId: initialData?.companyId || selectedDealPipeline?.companyId || undefined,
      dealName: initialData?.dealName || selectedDealPipeline?.dealName || '',
      priority: initialData?.priority || selectedDealPipeline?.priority || 'P3',
      status: initialData?.status || selectedDealPipeline?.status || 'Initial Screening',
      round: initialData?.round || selectedDealPipeline?.round || '',
      sector: initialData?.sector || selectedDealPipeline?.sector || 'Other',
      preMoneyValuation: initialData?.preMoneyValuation?.toString() || selectedDealPipeline?.preMoneyValuation?.toString() || '',
      postMoneyValuation: initialData?.postMoneyValuation?.toString() || selectedDealPipeline?.postMoneyValuation?.toString() || '',
      rejectionReason: initialData?.rejectionReason || selectedDealPipeline?.rejectionReason || '',
      notes: initialData?.notes || selectedDealPipeline?.notes || '',
    },
    
    // Simplified validation - let individual field validators handle most validation
    validators: {
      onChange: ({ value }) => {
        const fieldErrors: Record<string, string> = {};
        
        // Basic required field validation
        if (!value.companyId) {
          fieldErrors.companyId = 'Company is required';
        }
        
        if (!value.dealName || value.dealName.trim().length === 0) {
          fieldErrors.dealName = 'Deal name is required';
        }
        
        if (!value.round || value.round.trim().length === 0) {
          fieldErrors.round = 'Round is required';
        }
        
        return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
      },
    },
    
    onSubmit: async ({ value }) => {
      // Transform form strings to match schema expectations
      const transformedValue = {
        companyId: value.companyId,
        dealName: value.dealName,
        priority: value.priority as DealPriority,
        status: value.status as DealStatus,
        round: value.round,
        sector: value.sector as SectorType,
        preMoneyValuation: value.preMoneyValuation ? Number(value.preMoneyValuation) : undefined,
        postMoneyValuation: value.postMoneyValuation ? Number(value.postMoneyValuation) : undefined,
        rejectionReason: value.rejectionReason || undefined,
        notes: value.notes || undefined,
      };
      
      const schema = isEditMode ? UpdateDealPipelineSchema : CreateDealPipelineSchema;
      const result = schema.parse(transformedValue);
      
      const success = isEditMode 
        ? await editDealPipeline(id!, result)
        : await addDealPipeline(result);
        
      if (success) {
        router.push(isEditMode ? `/dashboard/deal-pipeline/${id}` : '/dashboard/deal-pipeline');
      }
    },
  });
  
  useEffect(() => {
    if (isEditMode && id && !initialData) fetchDealPipeline(id);
  }, [isEditMode, id, initialData, fetchDealPipeline]);
  
  useEffect(() => {
    if (selectedDealPipeline && isEditMode) {
      form.reset({
        companyId: selectedDealPipeline.companyId,
        dealName: selectedDealPipeline.dealName || '',
        priority: selectedDealPipeline.priority || 'P3',
        status: selectedDealPipeline.status || 'Initial Screening',
        round: selectedDealPipeline.round || '',
        sector: selectedDealPipeline.sector || 'Other',
        preMoneyValuation: selectedDealPipeline.preMoneyValuation?.toString() || '',
        postMoneyValuation: selectedDealPipeline.postMoneyValuation?.toString() || '',
        rejectionReason: selectedDealPipeline.rejectionReason || '',
        notes: selectedDealPipeline.notes || '',
      });
    }
  }, [selectedDealPipeline, isEditMode, form]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Deal Pipeline' : 'Create Deal Pipeline'}</CardTitle>
          <CardDescription>Loading deal pipeline information...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit Deal Pipeline' : 'Create Deal Pipeline'}</CardTitle>
          <CardDescription>Error loading deal pipeline</CardDescription>
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
          {isEditMode ? 'Edit Deal Pipeline' : 'Create Deal Pipeline'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update deal pipeline details' : 'Add a new deal to the pipeline'}
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
                    name="dealName"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return 'Deal name is required';
                        if (value.length < 1) return 'Deal name must be at least 1 character';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Deal Name</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter deal name"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="priority">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Priority</Label>
                        <Select 
                          value={field.state.value || 'P3'} 
                          onValueChange={(value) => field.handleChange(value as DealPriority)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="P1">P1 (Highest)</SelectItem>
                            <SelectItem value="P2">P2 (High)</SelectItem>
                            <SelectItem value="P3">P3 (Medium)</SelectItem>
                            <SelectItem value="P4">P4 (Low)</SelectItem>
                            <SelectItem value="P5">P5 (Lowest)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="status">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Status</Label>
                        <Select 
                          value={field.state.value || 'Initial Screening'} 
                          onValueChange={(value) => field.handleChange(value as DealStatus)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Initial Screening">Initial Screening</SelectItem>
                            <SelectItem value="First Meeting">First Meeting</SelectItem>
                            <SelectItem value="Follow Up">Follow Up</SelectItem>
                            <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                            <SelectItem value="Negotiation">Negotiation</SelectItem>
                            <SelectItem value="Term Sheet">Term Sheet</SelectItem>
                            <SelectItem value="Legal Review">Legal Review</SelectItem>
                            <SelectItem value="Closing">Closing</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field
                    name="round"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return 'Round is required';
                        if (value.length < 1) return 'Round must be at least 1 character';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Round</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter round (e.g., Seed, Series A)"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="sector">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Sector</Label>
                        <Select 
                          value={field.state.value || 'Other'} 
                          onValueChange={(value) => field.handleChange(value as SectorType)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select sector" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Fintech">Fintech</SelectItem>
                            <SelectItem value="Healthtech">Healthtech</SelectItem>
                            <SelectItem value="Ecommerce">Ecommerce</SelectItem>
                            <SelectItem value="SaaS">SaaS</SelectItem>
                            <SelectItem value="AI/ML">AI/ML</SelectItem>
                            <SelectItem value="Blockchain">Blockchain</SelectItem>
                            <SelectItem value="Cleantech">Cleantech</SelectItem>
                            <SelectItem value="Edtech">Edtech</SelectItem>
                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                            <SelectItem value="Consumer">Consumer</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
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

          {/* Valuation Information */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Valuation Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="preMoneyValuation">
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
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="0.00"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="postMoneyValuation">
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

          {/* Additional Information */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="space-y-2">
                <form.Field name="rejectionReason">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Rejection Reason (Optional)</Label>
                      <Textarea
                        id={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter rejection reason if applicable..."
                        rows={3}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>

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
                        placeholder="Enter any additional notes about this deal..."
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
                    {isEditMode ? 'Update Deal Pipeline' : 'Create Deal Pipeline'}
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