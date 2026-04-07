'use client';

/**
 * Create Scan Template Page
 *
 * Form for creating a new scan template with scan types, parameters, and credentials.
 * Uses @tanstack/react-form with Zod validation.
 *
 * Backend: POST /cybersecurity/scan-templates/
 */

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useScanTemplates } from '@/modules/cybersecurity/hooks/execution/use-scan-templates';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { CreateScanTemplateSchema } from '@/modules/cybersecurity/schemas/execution/scan-templates.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateScanTemplatePage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { createScanTemplate, error: storeError } = useScanTemplates();

  const form = useForm({
    defaultValues: {
      target_id: 0,
      name: '',
      description: '' as string | null,
      scan_types: '',
      port_range: 'top_100',
      scan_speed: 'normal' as 'slow' | 'normal' | 'fast',
      timeout_seconds: 300,
      max_concurrent: 50,
      follow_redirects: true,
      check_headers: true,
      dns_brute_force: false,
      active_scan_consent: false,
      credential_id: null as number | null,
      engine_params: '' as string | null,
    },
    onSubmit: async ({ value }) => {
      // Validate with Zod
      const validation = CreateScanTemplateSchema.safeParse(value);

      if (!validation.success) {
        return;
      }

      const success = await createScanTemplate(value as Parameters<typeof createScanTemplate>[0]);

      if (success) {
        router.push('/scan-templates');
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
        <Link href="/scan-templates">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scan Templates
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Scan Template</h1>
        <p className="text-muted-foreground mt-2">
          Define a reusable scan configuration for {activeOrganization.name}
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
        {/* Card 1: Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
            <CardDescription>
              Template identity and target association
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Target ID */}
              <form.Field name="target_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Target ID *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                      placeholder="1"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

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
                      placeholder="Full Infrastructure Scan"
                      disabled={form.state.isSubmitting}
                    />
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
                      placeholder="Brief description of this scan template"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Scan Types */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Scan Types</CardTitle>
            <CardDescription>
              Which scanners to run (comma-separated)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Scan Types */}
              <form.Field name="scan_types">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Scan Types *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="port_scan,dns_enum,ssl_check"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Available types: port_scan, dns_enum, ssl_check, web_scan, vuln_scan, api_scan,
                      active_web_scan, password_audit, host_audit, cloud_audit, ad_audit, mobile_scan
                    </p>
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Parameters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
            <CardDescription>
              Scan speed, port range, timeouts, and feature flags
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Port Range */}
                <form.Field name="port_range">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Port Range</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value)}
                        disabled={form.state.isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select port range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top_100">Top 100</SelectItem>
                          <SelectItem value="top_1000">Top 1000</SelectItem>
                          <SelectItem value="full">Full (All Ports)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                {/* Scan Speed */}
                <form.Field name="scan_speed">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Scan Speed</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                        disabled={form.state.isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select scan speed" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slow">Slow (Stealth)</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="fast">Fast (Aggressive)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                {/* Timeout Seconds */}
                <form.Field name="timeout_seconds">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Timeout (seconds)</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        placeholder="300"
                        disabled={form.state.isSubmitting}
                      />
                    </div>
                  )}
                </form.Field>

                {/* Max Concurrent */}
                <form.Field name="max_concurrent">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Max Concurrent</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        placeholder="50"
                        disabled={form.state.isSubmitting}
                      />
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Boolean Flags */}
              <div className="space-y-4 pt-4 border-t">
                {/* Follow Redirects */}
                <form.Field name="follow_redirects">
                  {(field) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                        disabled={form.state.isSubmitting}
                      />
                      <Label htmlFor={field.name} className="cursor-pointer">Follow Redirects</Label>
                    </div>
                  )}
                </form.Field>

                {/* Check Headers */}
                <form.Field name="check_headers">
                  {(field) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                        disabled={form.state.isSubmitting}
                      />
                      <Label htmlFor={field.name} className="cursor-pointer">Check Headers</Label>
                    </div>
                  )}
                </form.Field>

                {/* DNS Brute Force */}
                <form.Field name="dns_brute_force">
                  {(field) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                        disabled={form.state.isSubmitting}
                      />
                      <Label htmlFor={field.name} className="cursor-pointer">DNS Brute Force</Label>
                    </div>
                  )}
                </form.Field>

                {/* Active Scan Consent */}
                <form.Field name="active_scan_consent">
                  {(field) => (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={field.name}
                          checked={field.state.value}
                          onCheckedChange={(checked) => field.handleChange(checked === true)}
                          disabled={form.state.isSubmitting}
                        />
                        <Label htmlFor={field.name} className="cursor-pointer">Active Scan Consent</Label>
                      </div>
                      <p className="text-xs text-destructive ml-6">
                        Warning: Enabling this allows active scanning techniques that may trigger IDS/IPS alerts
                        or affect target availability. Only enable if you have explicit authorization.
                      </p>
                    </div>
                  )}
                </form.Field>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Credential (optional) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Credential</CardTitle>
            <CardDescription>
              Optional credential and engine parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Credential ID */}
              <form.Field name="credential_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Credential ID</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder="Leave empty if no credential needed"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Engine Params */}
              <form.Field name="engine_params">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Engine Parameters</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder='{"key": "value"}'
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">JSON string for custom engine parameters</p>
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
              'Create Scan Template'
            )}
          </Button>
          <Link href="/scan-templates" className="flex-1">
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
