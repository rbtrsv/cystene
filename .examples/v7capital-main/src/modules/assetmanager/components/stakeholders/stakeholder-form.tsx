'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useStakeholders } from '../../hooks/use-stakeholders';
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
import { 
  type Stakeholder, 
  type StakeholderType, 
  stakeholderTypeEnum 
} from '../../schemas/stakeholders.schemas';

interface StakeholderFormProps {
  id?: number;
  initialData?: Stakeholder;
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

export default function StakeholderForm({ id, initialData }: StakeholderFormProps) {
  // ===== ROUTER, STATE, AND HOOKS =====
  const router = useRouter();
  const { 
    selectedStakeholder,
    addStakeholder, 
    editStakeholder, 
    fetchStakeholder,
    isLoading, 
    error, 
    clearError 
  } = useStakeholders();
  
  const isEditMode = !!id;
  
  // ===== EFFECTS =====
  useEffect(() => {
    if (isEditMode && id && !initialData) {
      fetchStakeholder(id);
    }
  }, [isEditMode, id, initialData, fetchStakeholder]);
  
  // ===== EVENT HANDLERS =====
  
  // Create form with TanStack Form
  const form = useForm({
    defaultValues: {
      stakeholderName: initialData?.stakeholderName || selectedStakeholder?.stakeholderName || '',
      type: (initialData?.type || selectedStakeholder?.type || 'Investor') as StakeholderType,
    },
    onSubmit: async ({ value }) => {
      try {
        if (isEditMode && id) {
          const success = await editStakeholder(id, value.stakeholderName, value.type);
          if (success) {
            router.push(`/dashboard/stakeholders/${id}`);
          }
        } else {
          const success = await addStakeholder(value.stakeholderName, value.type);
          if (success) {
            router.push('/dashboard/stakeholders');
          }
        }
      } catch (error) {
        console.error('Error submitting form:', error);
      }
    },
  });
  
  // Reset form when selectedStakeholder changes in edit mode
  useEffect(() => {
    if (selectedStakeholder && isEditMode) {
      form.reset({
        stakeholderName: selectedStakeholder.stakeholderName || '',
        type: selectedStakeholder.type || 'Investor',
      });
    }
  }, [selectedStakeholder, isEditMode, form]);
  
  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading && isEditMode && !initialData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Stakeholder' : 'Create Stakeholder'}</CardTitle>
          <CardDescription>
            {isEditMode ? 'Update stakeholder details' : 'Add a new stakeholder'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Stakeholder' : 'Create Stakeholder'}</CardTitle>
          <CardDescription>Error</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }
  
  // ===== MAIN COMPONENT RENDER =====
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Stakeholder' : 'Create Stakeholder'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Update stakeholder details' : 'Add a new stakeholder'}
        </CardDescription>
      </CardHeader>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <form.Field
                name="stakeholderName"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return 'Stakeholder name is required';
                    if (value.length < 2) return 'Stakeholder name must be at least 2 characters';
                    if (value.length > 100) return 'Stakeholder name is too long';
                    return undefined;
                  }
                }}
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Stakeholder Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter stakeholder name"
                    />
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>
            
            <div className="space-y-2">
              <form.Field
                name="type"
              >
                {(field) => (
                  <div>
                    <Label htmlFor={field.name}>Type</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value: StakeholderType) => field.handleChange(value)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select stakeholder type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fund">Fund</SelectItem>
                        <SelectItem value="Investor">Investor</SelectItem>
                        <SelectItem value="Employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-4 pt-6">          
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isLoading}>
                {isSubmitting || isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> 
                    {isEditMode ? 'Update Stakeholder' : 'Create Stakeholder'}
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
