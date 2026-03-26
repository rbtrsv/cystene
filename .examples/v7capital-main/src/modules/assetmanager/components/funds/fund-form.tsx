'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { CreateFundSchema, UpdateFundSchema, fundStatusEnum, type Fund, type FundStatus } from '@/modules/assetmanager/schemas/funds.schemas';
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';

interface FundFormProps {
  id?: number;
  initialData?: Fund;
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

export default function FundForm({ id, initialData }: FundFormProps) {
  const router = useRouter();
  const { selectedFund, addFund, editFund, fetchFund, isLoading, error, clearError } = useFunds();
  
  const isEditMode = !!id;
  const currentYear = new Date().getFullYear();
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      name: initialData?.name || selectedFund?.name || '',
      description: initialData?.description || selectedFund?.description || '',
      targetSize: initialData?.targetSize?.toString() || selectedFund?.targetSize?.toString() || '',
      vintage: initialData?.vintage?.toString() || selectedFund?.vintage?.toString() || currentYear.toString(),
      status: initialData?.status || selectedFund?.status || 'Active',
    },
    
    // Form-level validation using full schema
    validators: {
      onChange: ({ value }) => {
        // Transform form strings to match schema expectations
        const transformedValue = {
          name: value.name,
          description: value.description || undefined,
          targetSize: value.targetSize ? Number(value.targetSize) : undefined,
          vintage: value.vintage ? Number(value.vintage) : undefined,
          status: value.status,
        };
        
        const schema = isEditMode ? UpdateFundSchema : CreateFundSchema;
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
        name: value.name,
        description: value.description || undefined,
        targetSize: value.targetSize ? Number(value.targetSize) : undefined,
        vintage: value.vintage ? Number(value.vintage) : undefined,
        status: value.status,
      };
      
      const schema = isEditMode ? UpdateFundSchema : CreateFundSchema;
      const result = schema.parse(transformedValue);
      
      if (isEditMode && id) {
        const success = await editFund(id, result.name, result.description, result.targetSize, result.vintage, result.status);
        if (success) router.push(`/dashboard/funds/${id}`);
      } else {
        const success = await addFund(result.name, result.description, result.targetSize, result.vintage, result.status);
        if (success) router.push('/dashboard/funds');
      }
    },
  });
  
  // Fetch fund data for edit mode
  useEffect(() => {
    if (isEditMode && id && !initialData) fetchFund(id);
  }, [isEditMode, id, initialData, fetchFund]);
  
  // Reset form when selectedFund changes
  useEffect(() => {
    if (selectedFund && isEditMode) {
      form.reset({
        name: selectedFund.name || '',
        description: selectedFund.description || '',
        targetSize: selectedFund.targetSize?.toString() || '',
        vintage: selectedFund.vintage?.toString() || currentYear.toString(),
        status: selectedFund.status || 'Active',
      });
    }
  }, [selectedFund, isEditMode, form, currentYear]);

  // Loading state
  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Fund' : 'Create Fund'}</CardTitle>
          <CardDescription>Loading fund information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </>
    );
  }
  
  // Error state
  if (error) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Fund' : 'Create Fund'}</CardTitle>
          <CardDescription>Error loading fund</CardDescription>
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
    <>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Fund' : 'Create Fund'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Update fund details' : 'Add a new fund to your portfolio'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          e.stopPropagation(); 
          form.handleSubmit(); 
        }}>
          <div className="space-y-6">
            <div className="space-y-4">
              
              {/* Fund Name Field */}
              <div className="space-y-2">
                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value || typeof value !== 'string') return 'Fund name is required';
                      if (value.trim().length < 2) return 'Fund name must be at least 2 characters';
                      if (value.length > 100) return 'Fund name is too long';
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Fund Name</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter fund name"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <form.Field
                  name="description"
                  validators={{
                    onChange: ({ value }) => {
                      if (value && value.length > 500) return 'Description is too long';
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
                        placeholder="Enter description"
                        rows={3}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Target Size Field */}
              <div className="space-y-2">
                <form.Field
                  name="targetSize"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return 'Target size is required';
                      const numValue = Number(value);
                      if (isNaN(numValue)) return 'Target size must be a number';
                      if (numValue <= 0) return 'Target size must be positive';
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Target Size</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter target size"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Vintage Year Field */}
              <div className="space-y-2">
                <form.Field
                  name="vintage"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return 'Vintage year is required';
                      const numValue = Number(value);
                      if (isNaN(numValue)) return 'Vintage year must be a number';
                      if (numValue < 1900 || numValue > currentYear + 10) return 'Invalid vintage year';
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Vintage Year</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter vintage year"
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Status Field */}
              <div className="space-y-2">
                <form.Field
                  name="status"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return 'Status is required';
                      if (!fundStatusEnum.options.includes(value as FundStatus)) return 'Invalid status';
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Status</Label>
                      <Select 
                        value={field.state.value} 
                        onValueChange={(value) => field.handleChange(value as FundStatus)}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {fundStatusEnum.options.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>

            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
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
                        {isEditMode ? 'Update Fund' : 'Create Fund'}
                      </>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </div>
            
          </div>
        </form>
      </CardContent>
    </>
  );
}
