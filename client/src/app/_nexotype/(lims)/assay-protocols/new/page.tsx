'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAssayProtocols } from '@/modules/nexotype/hooks/lims/use-assay-protocols';
import { CreateAssayProtocolSchema } from '@/modules/nexotype/schemas/lims/assay-protocol.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/** Create form for AssayProtocol with local Zod guard before API call. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateAssayProtocolPage() {
  const router = useRouter();
  const { createAssayProtocol, error: storeError } = useAssayProtocols();

  const form = useForm({
    defaultValues: {
      name: '',
      version: '',
      method_description: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          name: value.name.trim(),
          version: value.version.trim(),
          method_description: value.method_description.trim() || undefined,
        };

        const parsed = CreateAssayProtocolSchema.safeParse(payload);
        if (!parsed.success) return;

        const success = await createAssayProtocol(payload);
        if (success) router.push('/assay-protocols');
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

    // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/assay-protocols">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assay Protocols
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Assay Protocol</h1>
        <p className="text-muted-foreground mt-2">Add a protocol definition for downstream assay runs</p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assay Protocol Details</CardTitle>
          <CardDescription>Enter required protocol metadata</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Name *</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., ELISA cytokine panel"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="version">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Version *</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., v2.1"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="method_description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Method Description</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional summary of assay steps"
                  />
                </div>
              )}
            </form.Field>

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
              <Button type="submit" className="flex-1" disabled={form.state.isSubmitting}>
                {form.state.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Assay Protocol'
                )}
              </Button>
              <Link href="/assay-protocols" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
