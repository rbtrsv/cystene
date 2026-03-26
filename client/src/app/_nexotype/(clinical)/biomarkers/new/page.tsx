'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useBiomarkers } from '@/modules/nexotype/hooks/clinical/use-biomarkers';
import { CreateBiomarkerSchema } from '@/modules/nexotype/schemas/clinical/biomarker.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateBiomarkerPage() {
  const router = useRouter();
  const { createBiomarker, error: storeError } = useBiomarkers();

  const form = useForm({
    defaultValues: {
      name: '',
      loinc_code: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert empty strings to null for optional fields
        const payload = {
          name: value.name,
          loinc_code: value.loinc_code || null,
        };

        // Validate with Zod
        const validation = CreateBiomarkerSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createBiomarker(payload);

        if (success) {
          router.push('/biomarkers');
        }
        // Error is handled by store and displayed via storeError
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/biomarkers">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Biomarkers
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Biomarker</h1>
        <p className="text-muted-foreground mt-2">
          Add a new surrogate endpoint or health indicator
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Biomarker Details</CardTitle>
          <CardDescription>
            Enter the details for your new biomarker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="space-y-4">
              {/* Name — required */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Name is required';
                    }
                    if (value.length > 255) {
                      return 'Name must be 255 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Name *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., NAD+ Levels"
                      disabled={form.state.isSubmitting}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* LOINC Code — optional */}
              <form.Field name="loinc_code">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>LOINC Code</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 50123-4"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Logical Observation Identifiers Names and Codes identifier
                    </p>
                  </div>
                )}
              </form.Field>

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
                <Button
                  type="submit"
                  disabled={form.state.isSubmitting}
                  className="flex-1"
                >
                  {form.state.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Biomarker'
                  )}
                </Button>
                <Link href="/biomarkers" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={form.state.isSubmitting}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
