'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { CreateCompanySchema, UpdateCompanySchema, type Company } from '@/modules/assetmanager/schemas/companies.schemas';
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
import { Save } from 'lucide-react';

interface CompanyFormProps {
  id?: number;
  initialData?: Company;
}

// Helper function to render form field errors
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

export default function CompanyForm({ id, initialData }: CompanyFormProps) {
  const router = useRouter();
  const { 
    selectedCompany,
    addCompany, 
    editCompany, 
    fetchCompany,
    isLoading, 
    error, 
    clearError 
  } = useCompanies();
  
  const isEditMode = !!id;
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      name: initialData?.name || selectedCompany?.name || '',
      website: initialData?.website || selectedCompany?.website || '',
      country: initialData?.country || selectedCompany?.country || '',
    },
    
    // Form-level validation using schema
    validators: {
      onChange: ({ value }) => {
        const schema = isEditMode ? UpdateCompanySchema : CreateCompanySchema;
        const result = schema.safeParse(value);
        
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
      const schema = isEditMode ? UpdateCompanySchema : CreateCompanySchema;
      const result = schema.parse(value);
      
      if (isEditMode && id) {
        const success = await editCompany(id, result.name, result.website, result.country);
        if (success) {
          router.push(`/dashboard/companies/${id}`);
        }
      } else {
        const success = await addCompany(result.name!, result.website, result.country);
        if (success) {
          router.push('/dashboard/companies');
        }
      }
    },
  });
  
  useEffect(() => {
    if (isEditMode && id && !initialData) {
      fetchCompany(id);
    }
  }, [isEditMode, id, initialData, fetchCompany]);
  
  // Reset form values when selectedCompany changes
  useEffect(() => {
    if (selectedCompany && isEditMode) {
      form.reset({
        name: selectedCompany.name || '',
        website: selectedCompany.website || '',
        country: selectedCompany.country || '',
      });
    }
  }, [selectedCompany, isEditMode, form]);
  

  // Loading state
  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Company' : 'Create Company'}</CardTitle>
          <CardDescription>Loading company information...</CardDescription>
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
          <CardTitle>{isEditMode ? 'Edit Company' : 'Create Company'}</CardTitle>
          <CardDescription>Error loading company</CardDescription>
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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Company' : 'Create Company'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update company details' : 'Add a new company to your portfolio'}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}>
        <CardContent className="space-y-6">
          
          {/* Company Information Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              
              {/* Company Name */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || typeof value !== 'string') return 'Company name is required';
                    if (value.trim().length < 1) return 'Company name is required';
                    if (value.length > 100) return 'Company name is too long';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Company Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter company name"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              
              {/* Website */}
              <form.Field
                name="website"
                validators={{
                  onChange: ({ value }) => {
                    if (value && typeof value === 'string') {
                      if (!/^https?:\/\/.*/.test(value)) {
                        return 'Website must be a valid URL starting with http:// or https://';
                      }
                    }
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Website</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="url"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://example.com"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              
              {/* Country */}
              <form.Field
                name="country"
                validators={{
                  onChange: ({ value }) => {
                    if (value && typeof value === 'string') {
                      if (value.length === 2 && !/^[A-Z]{2}$/.test(value)) {
                        return 'Country code must be 2 uppercase letters (e.g., US, GB, FR)';
                      }
                      if (value.length > 2) {
                        return 'Use 2-letter country code (e.g., US, GB, FR)';
                      }
                    }
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Country Code</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                      placeholder="US, GB, FR..."
                      maxLength={2}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter 2-letter country code (ISO 3166-1 alpha-2)
                    </p>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
              
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
                    {isEditMode ? 'Update Company' : 'Create Company'}
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
