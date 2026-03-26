'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { CreateMarketOrganizationSchema } from '@/modules/nexotype/schemas/commercial/market-organization.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateMarketOrganizationPage() {
  const router = useRouter();
  const { createMarketOrganization, error: storeError } = useMarketOrganizations();

  const form = useForm({
    defaultValues: {
      legal_name: '',
      org_type: 'Public' as 'Public' | 'Private' | 'University',
      status: 'Active' as 'Active' | 'Inactive' | 'Acquired' | 'Bankrupt',
      ticker_symbol: '',
      isin: '',
      primary_exchange: '',
      headquarters: '',
      website: '',
      founded: '',
      employee_count: null as number | null,
      revenue_usd: null as number | null,
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert empty strings to null for optional fields
        const payload = {
          legal_name: value.legal_name,
          org_type: value.org_type,
          status: value.status,
          ticker_symbol: value.ticker_symbol || null,
          isin: value.isin || null,
          primary_exchange: value.primary_exchange || null,
          headquarters: value.headquarters || null,
          website: value.website || null,
          founded: value.founded || null,
          employee_count: value.employee_count,
          revenue_usd: value.revenue_usd,
        };

        // Validate with Zod
        const validation = CreateMarketOrganizationSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createMarketOrganization(payload);

        if (success) {
          router.push('/market-organizations');
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
        <Link href="/market-organizations">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Market Organizations
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Market Organization</h1>
        <p className="text-muted-foreground mt-2">
          Add a new company, university, or organization to the market
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Enter the details for your new market organization
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
              {/* Legal Name — required */}
              <form.Field
                name="legal_name"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Legal name is required';
                    }
                    if (value.length > 255) {
                      return 'Legal name must be 255 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Legal Name *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., Apple Inc."
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

              {/* Organization Type — required */}
              <form.Field name="org_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Organization Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as 'Public' | 'Private' | 'University')}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Public">Public</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="University">University</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Status */}
              <form.Field name="status">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Status</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as 'Active' | 'Inactive' | 'Acquired' | 'Bankrupt')}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Acquired">Acquired</SelectItem>
                        <SelectItem value="Bankrupt">Bankrupt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Ticker Symbol */}
              <form.Field name="ticker_symbol">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Ticker Symbol</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., AAPL"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* ISIN */}
              <form.Field name="isin">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>ISIN</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., US0378331005"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Primary Exchange */}
              <form.Field name="primary_exchange">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Primary Exchange</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., NASDAQ"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Headquarters */}
              <form.Field name="headquarters">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Headquarters</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., Cupertino, CA"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Website */}
              <form.Field name="website">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Website</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., https://apple.com"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Founded */}
              <form.Field name="founded">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Founded</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 1976"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Employee Count */}
              <form.Field name="employee_count">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Employee Count</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="e.g., 164000"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Revenue (USD) */}
              <form.Field name="revenue_usd">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Revenue (USD)</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="e.g., 394328000000"
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
                    'Create Organization'
                  )}
                </Button>
                <Link href="/market-organizations" className="flex-1">
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
