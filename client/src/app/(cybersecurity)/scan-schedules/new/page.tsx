'use client';

/**
 * Create Scan Schedule Page
 *
 * Form for creating a new scan schedule (recurring automated scans).
 * Uses @tanstack/react-form with Zod validation.
 *
 * Backend: POST /cybersecurity/scan-schedules/
 */

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useScanSchedules } from '@/modules/cybersecurity/hooks/execution/use-scan-schedules';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { CreateScanScheduleSchema } from '@/modules/cybersecurity/schemas/execution/scan-schedules.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateScanSchedulePage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { createScanSchedule, error: storeError } = useScanSchedules();

  const form = useForm({
    defaultValues: {
      target_id: 0,
      template_id: 0,
      name: '',
      frequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
      cron_expression: '' as string | null,
      is_active: true,
    },
    onSubmit: async ({ value }) => {
      // Build payload — convert empty cron_expression to null
      const payload = {
        ...value,
        cron_expression: value.cron_expression || null,
      };

      // Validate with Zod
      const validation = CreateScanScheduleSchema.safeParse(payload);

      if (!validation.success) {
        return;
      }

      const success = await createScanSchedule(payload as Parameters<typeof createScanSchedule>[0]);

      if (success) {
        router.push('/scan-schedules');
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
        <Link href="/scan-schedules">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scan Schedules
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Scan Schedule</h1>
        <p className="text-muted-foreground mt-2">
          Schedule recurring automated scans for {activeOrganization.name}
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
        {/* Schedule Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Schedule Info</CardTitle>
            <CardDescription>
              Name and target configuration for this schedule
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
                      placeholder="Weekly API Scan"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Target ID */}
              <form.Field name="target_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Target ID *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                      placeholder="1"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Template ID */}
              <form.Field name="template_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Template ID *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                      placeholder="1"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Frequency Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Frequency Settings</CardTitle>
            <CardDescription>
              How often this schedule should run
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Frequency */}
              <form.Field name="frequency">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Frequency *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Cron Expression */}
              <form.Field name="cron_expression">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Cron Expression</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="0 2 * * 1"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">Optional — overrides frequency with a custom cron expression</p>
                  </div>
                )}
              </form.Field>

              {/* Is Active */}
              <form.Field name="is_active">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Status</Label>
                    <Select
                      value={field.state.value ? 'true' : 'false'}
                      onValueChange={(value) => field.handleChange(value === 'true')}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
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
              'Create Schedule'
            )}
          </Button>
          <Link href="/scan-schedules" className="flex-1">
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
