'use client';

/**
 * Create Credential Page
 *
 * Form for creating a new credential (SSH key, SSH password, API key, domain credentials, service account).
 * Uses @tanstack/react-form with Zod validation.
 *
 * SECURITY: encrypted_value is sent as plaintext — the server encrypts it before storage.
 *
 * Backend: POST /cybersecurity/credentials/
 */

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useCredentials } from '@/modules/cybersecurity/hooks/infrastructure/use-credentials';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { CreateCredentialSchema } from '@/modules/cybersecurity/schemas/infrastructure/credentials.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateCredentialPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { createCredential, error: storeError } = useCredentials();

  const form = useForm({
    defaultValues: {
      name: '',
      cred_type: 'ssh_key' as 'ssh_key' | 'ssh_password' | 'api_key' | 'domain_credentials' | 'service_account',
      encrypted_value: '',
      username: '' as string | null,
      extra_metadata: '' as string | null,
      infrastructure_id: null as number | null,
    },
    onSubmit: async ({ value }) => {
      // Validate with Zod
      const validation = CreateCredentialSchema.safeParse(value);

      if (!validation.success) {
        return;
      }

      const success = await createCredential(value as Parameters<typeof createCredential>[0]);

      if (success) {
        router.push('/credentials');
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
        <Link href="/credentials">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Credentials
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add Credential</h1>
        <p className="text-muted-foreground mt-2">
          Add a new credential for {activeOrganization.name}
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
              Name and type of the credential
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
                      placeholder="Production API Key"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Credential Type */}
              <form.Field name="cred_type">
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
                        <SelectItem value="ssh_key">SSH Key</SelectItem>
                        <SelectItem value="ssh_password">SSH Password</SelectItem>
                        <SelectItem value="api_key">API Key</SelectItem>
                        <SelectItem value="domain_credentials">Domain Credentials</SelectItem>
                        <SelectItem value="service_account">Service Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Username */}
              <form.Field name="username">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Username</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="root, admin, service-user"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </CardContent>
        </Card>

        {/* Secret Value */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Secret Value</CardTitle>
            <CardDescription>
              The password, key, or token. Will be encrypted server-side before storage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Encrypted Value — the raw secret */}
              <form.Field name="encrypted_value">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Secret Value *</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Paste your password, SSH key, or API token here"
                      disabled={form.state.isSubmitting}
                      className="font-mono"
                      style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                    />
                    <p className="text-xs text-muted-foreground">
                      This value will be encrypted server-side. It will never be shown again after creation.
                    </p>
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
              Optional metadata and infrastructure association
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Extra Metadata */}
              <form.Field name="extra_metadata">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Extra Metadata (JSON)</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder='{"port": 22, "key_type": "ed25519"}'
                      disabled={form.state.isSubmitting}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">Optional JSON object with extra context</p>
                  </div>
                )}
              </form.Field>

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
                      placeholder="Optional — link to an infrastructure item"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">Associate this credential with a specific infrastructure item</p>
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
              'Add Credential'
            )}
          </Button>
          <Link href="/credentials" className="flex-1">
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
