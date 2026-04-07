'use client';

/**
 * Create Infrastructure Page
 *
 * Form for creating a new infrastructure item (server, application, database, cloud account).
 * Uses @tanstack/react-form with Zod validation.
 *
 * Backend: POST /cybersecurity/infrastructure/
 */

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useInfrastructures } from '@/modules/cybersecurity/hooks/infrastructure/use-infrastructure';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { CreateInfrastructureSchema } from '@/modules/cybersecurity/schemas/infrastructure/infrastructure.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateInfrastructurePage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { createInfrastructure, error: storeError } = useInfrastructures();

  const form = useForm({
    defaultValues: {
      name: '',
      infra_type: 'server' as 'server' | 'application' | 'database' | 'network_device' | 'cloud_service' | 'cloud_account',
      description: '' as string | null,
      environment: 'production' as 'production' | 'staging' | 'development' | 'testing',
      criticality: 'medium' as 'critical' | 'high' | 'medium' | 'low',
      owner: '' as string | null,
      ip_address: '' as string | null,
      hostname: '' as string | null,
      url: '' as string | null,
      cloud_provider: '' as string | null,
      region: '' as string | null,
      tags: '' as string | null,
      notes: '' as string | null,
    },
    onSubmit: async ({ value }) => {
      // Validate with Zod
      const validation = CreateInfrastructureSchema.safeParse(value);

      if (!validation.success) {
        return;
      }

      const success = await createInfrastructure(value as Parameters<typeof createInfrastructure>[0]);

      if (success) {
        router.push('/infrastructure');
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
        <Link href="/infrastructure">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Infrastructure
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Infrastructure</h1>
        <p className="text-muted-foreground mt-2">
          Add a new server, application, database, or cloud account for {activeOrganization.name}
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
        {/* Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
            <CardDescription>
              What is this infrastructure item?
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
                      placeholder="Production API Server"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Infrastructure Type */}
              <form.Field name="infra_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="application">Application</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="network_device">Network Device</SelectItem>
                        <SelectItem value="cloud_service">Cloud Service</SelectItem>
                        <SelectItem value="cloud_account">Cloud Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Description */}
              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Description</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="Brief description of this infrastructure item"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Business Context */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Business Context</CardTitle>
            <CardDescription>
              Environment, criticality, and ownership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Environment */}
              <form.Field name="environment">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Environment</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="testing">Testing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Criticality */}
              <form.Field name="criticality">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Criticality</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select criticality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Owner */}
              <form.Field name="owner">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Owner</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="Backend Team, DevOps, etc."
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
            <CardDescription>
              Network and cloud identifiers (all optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* IP Address */}
              <form.Field name="ip_address">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>IP Address</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="192.168.1.100"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Hostname */}
              <form.Field name="hostname">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Hostname</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="api.example.com"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* URL */}
              <form.Field name="url">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>URL</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="https://app.example.com"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Cloud Provider */}
              <form.Field name="cloud_provider">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Cloud Provider</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="aws, hetzner, gcp, azure"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Region */}
              <form.Field name="region">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Region</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="eu-central-1, fsn1"
                      disabled={form.state.isSubmitting}
                    />
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
                      placeholder="backend, api, production"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated tags</p>
                  </div>
                )}
              </form.Field>
            </div>

            {/* Notes */}
            <div className="mt-4">
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
                      placeholder="Additional notes about this infrastructure"
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
              'Add Infrastructure'
            )}
          </Button>
          <Link href="/infrastructure" className="flex-1">
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
