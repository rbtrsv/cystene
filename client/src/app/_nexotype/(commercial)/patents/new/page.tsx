'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { CreatePatentSchema, JURISDICTION_OPTIONS, PATENT_STATUS_OPTIONS } from '@/modules/nexotype/schemas/commercial/patent.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function CreatePatentPage() {
  const router = useRouter();
  const { createPatent, error: storeError } = usePatents();

  const form = useForm({
    defaultValues: {
      jurisdiction: 'US',
      patent_number: '',
      title: '',
      status: 'Pending',
      filing_date: '',
      expiry_date: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert empty strings to null for optional fields
        const payload = {
          jurisdiction: value.jurisdiction,
          patent_number: value.patent_number,
          title: value.title || null,
          status: value.status as 'Pending' | 'Granted' | 'Expired' | 'Abandoned',
          filing_date: value.filing_date || null,
          expiry_date: value.expiry_date || null,
        };

        // Validate with Zod
        const validation = CreatePatentSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createPatent(validation.data);

        if (success) {
          router.push('/patents');
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
        <Link href="/patents">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patents
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Patent</h1>
        <p className="text-muted-foreground mt-2">
          Register a new patent filing
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Patent Details</CardTitle>
          <CardDescription>
            Enter the details for your new patent
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
              {/* Jurisdiction — required */}
              <form.Field name="jurisdiction">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Jurisdiction *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select jurisdiction" />
                      </SelectTrigger>
                      <SelectContent>
                        {JURISDICTION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Patent Number — required */}
              <form.Field
                name="patent_number"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Patent number is required';
                    }
                    if (value.length > 50) {
                      return 'Patent number must be 50 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Patent Number *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 11,234,567"
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

              {/* Title — optional */}
              <form.Field name="title">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Title</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., Methods for treating neurological disorders"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Status — optional, defaults to Pending */}
              <form.Field name="status">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Status</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {PATENT_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Filing Date — optional */}
              <form.Field name="filing_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Filing Date</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Expiry Date — optional */}
              <form.Field name="expiry_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Expiry Date</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={form.state.isSubmitting}
                    />
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
                    'Create Patent'
                  )}
                </Button>
                <Link href="/patents" className="flex-1">
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
