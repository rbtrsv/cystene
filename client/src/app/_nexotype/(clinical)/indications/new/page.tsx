'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useIndications } from '@/modules/nexotype/hooks/clinical/use-indications';
import { CreateIndicationSchema } from '@/modules/nexotype/schemas/clinical/indication.schemas';
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
export default function CreateIndicationPage() {
  const router = useRouter();
  const { createIndication, error: storeError } = useIndications();

  const form = useForm({
    defaultValues: {
      name: '',
      icd_10_code: '',
      meddra_id: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert empty strings to null for optional fields
        const payload = {
          name: value.name,
          icd_10_code: value.icd_10_code || null,
          meddra_id: value.meddra_id || null,
        };

        // Validate with Zod
        const validation = CreateIndicationSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createIndication(payload);

        if (success) {
          router.push('/indications');
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
        <Link href="/indications">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Indications
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Indication</h1>
        <p className="text-muted-foreground mt-2">
          Add a new disease target or pathology
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Indication Details</CardTitle>
          <CardDescription>
            Enter the details for your new indication
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
                      placeholder="e.g., Alzheimer's Disease"
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

              {/* ICD-10 Code — optional */}
              <form.Field name="icd_10_code">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>ICD-10 Code</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., G30.9"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      International Classification of Diseases code
                    </p>
                  </div>
                )}
              </form.Field>

              {/* MedDRA ID — optional */}
              <form.Field name="meddra_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>MedDRA ID</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 10001896"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Medical Dictionary for Regulatory Activities identifier
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
                    'Create Indication'
                  )}
                </Button>
                <Link href="/indications" className="flex-1">
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
