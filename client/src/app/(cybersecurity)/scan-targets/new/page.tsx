'use client';

/**
 * Create Scan Target Page
 *
 * Form for creating a new scan target (domain, IP, IP range, URL).
 * Uses @tanstack/react-form with Zod validation.
 *
 * Backend: POST /cybersecurity/scan-targets/
 */

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useScanTargets } from '@/modules/cybersecurity/hooks/infrastructure/use-scan-targets';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { CreateScanTargetSchema } from '@/modules/cybersecurity/schemas/infrastructure/scan-targets.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/** Placeholder text mapped to each target type */
const TARGET_VALUE_PLACEHOLDERS: Record<string, string> = {
  domain: 'example.com',
  ip: '192.168.1.100',
  ip_range: '192.168.1.0/24',
  url: 'https://app.example.com',
};

export default function CreateScanTargetPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { createScanTarget, error: storeError } = useScanTargets();

  const form = useForm({
    defaultValues: {
      name: '',
      target_type: 'domain' as 'domain' | 'ip' | 'ip_range' | 'url',
      target_value: '',
      infrastructure_id: null as number | null,
      notes: '' as string | null,
      tags: '' as string | null,
    },
    onSubmit: async ({ value }) => {
      // Validate with Zod
      const validation = CreateScanTargetSchema.safeParse(value);

      if (!validation.success) {
        return;
      }

      const success = await createScanTarget(value as Parameters<typeof createScanTarget>[0]);

      if (success) {
        router.push('/scan-targets');
      }
      // Error is handled by store and displayed via storeError
    },
  });

  if (!activeOrganization) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            Please select an organization first.{' '}
            <Link href="/organizations" className="underline">
              Go to Organizations
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/scan-targets">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scan Targets
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Scan Target</h1>
        <p className="text-muted-foreground mt-2">
          Add a new domain, IP, IP range, or URL target for {activeOrganization.name}
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        {/* Target Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Target Info</CardTitle>
            <CardDescription>
              What do you want to scan?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Name */}
              <form.Field name="name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Name *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Production API Domain"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Target Type */}
              <form.Field name="target_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Target Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="domain">Domain</SelectItem>
                        <SelectItem value="ip">IP Address</SelectItem>
                        <SelectItem value="ip_range">IP Range</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Target Value — placeholder depends on selected target_type */}
              <form.Field name="target_value">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Target Value *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={TARGET_VALUE_PLACEHOLDERS[form.state.values.target_type] || 'Enter target value'}
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>
              Optional context and metadata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Infrastructure ID */}
              <form.Field name="infrastructure_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Infrastructure ID</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Link to an infrastructure item (optional)"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">ID of the related infrastructure item</p>
                  </div>
                )}
              </form.Field>

              {/* Tags */}
              <form.Field name="tags">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Tags</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="external, production, web"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated tags</p>
                  </div>
                )}
              </form.Field>

              {/* Notes */}
              <form.Field name="notes">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Notes</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="Additional notes about this scan target"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-3">
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
              'Add Scan Target'
            )}
          </Button>
          <Link href="/scan-targets" className="flex-1">
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
      </form>
    </div>
  );
}
