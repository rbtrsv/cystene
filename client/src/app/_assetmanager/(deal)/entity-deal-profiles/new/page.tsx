'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useEntityDealProfiles } from '@/modules/assetmanager/hooks/deal/use-entity-deal-profiles';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateEntityDealProfileSchema } from '@/modules/assetmanager/schemas/deal/entity-deal-profile.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateEntityDealProfilePage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { createEntityDealProfile, error: storeError } = useEntityDealProfiles();

  const form = useForm({
    defaultValues: {
      entity_id: activeEntity?.id || 0,
      entity_type: 'company' as 'company' | 'fund' | 'target' | 'individual',

      // Basic Info (required)
      industry: '',
      location: '',
      website: null as string | null,
      year_founded: null as number | null,

      // Financial Overview
      current_valuation: null as number | null,
      latest_raise_amount: null as number | null,
      total_raised: null as number | null,

      // Company-specific fields (required)
      stage: null as string | null,
      short_description: '',
      problem_description: '',
      solution_description: '',
      how_it_works: '',
      market_size: null as number | null,
      competitors: null as string | null,
      competitive_advantage: null as string | null,
      growth_metrics: null as string | null,

      // Fund-specific fields
      investment_strategy: null as string | null,
      fund_size: null as number | null,
      fund_terms: null as string | null,
      track_record: null as string | null,
      fund_type: null as string | null,
      investment_focus: null as string | null,
      fund_lifecycle: null as string | null,
      vintage_year: null as number | null,

      // M&A-specific fields
      synergy_potential: null as string | null,
      key_assets: null as string | null,
      market_position: null as string | null,
      integration_plan: null as string | null,
      acquisition_rationale: null as string | null,
      financial_metrics: null as string | null,
      risk_factors: null as string | null,
      deal_readiness: null as string | null,

      // Team & Relationships (JSON)
      team_members: null as unknown,
      relationships: null as unknown,
    },
    onSubmit: async ({ value }) => {
      if (!value.entity_id) {
        return;
      }

      // Validate with Zod
      const validation = CreateEntityDealProfileSchema.safeParse(value);

      if (!validation.success) {
        return;
      }

      const success = await createEntityDealProfile(validation.data);

      if (success) {
        router.push('/entity-deal-profiles');
      }
      // Error is handled by store and displayed via storeError
    },
  });

  if (!activeEntity) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            Please select an entity first.{' '}
            <Link href="/entities" className="underline">
              Go to Entities
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/entity-deal-profiles">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Entity Deal Profiles
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Entity Deal Profile</h1>
        <p className="text-muted-foreground mt-2">
          Add a new deal profile for {activeEntity.name}
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Core details for the deal profile
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
              {/* Entity Type */}
              <form.Field name="entity_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Entity Type</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="fund">Fund</SelectItem>
                        <SelectItem value="target">Target</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Industry */}
              <form.Field
                name="industry"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) return 'Industry is required';
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Industry *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., Technology, Healthcare"
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

              {/* Location */}
              <form.Field
                name="location"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) return 'Location is required';
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Location *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., San Francisco, CA"
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

              {/* Website */}
              <form.Field name="website">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Website</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="https://example.com"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Year Founded */}
              <form.Field name="year_founded">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Year Founded</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="e.g., 2020"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Stage */}
              <form.Field name="stage">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Stage</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="e.g., Series A, Growth"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Short Description */}
              <form.Field
                name="short_description"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) return 'Short description is required';
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Short Description *</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Brief description of the entity..."
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

              {/* Problem Description */}
              <form.Field
                name="problem_description"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) return 'Problem description is required';
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Problem Description *</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="What problem does this solve?"
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

              {/* Solution Description */}
              <form.Field
                name="solution_description"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) return 'Solution description is required';
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Solution Description *</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="How does the solution work?"
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

              {/* How It Works */}
              <form.Field
                name="how_it_works"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) return 'How it works is required';
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>How It Works *</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Explain how it works..."
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

              {/* Financial Overview */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Financial Overview</h3>
              </div>

              {/* Current Valuation */}
              <form.Field name="current_valuation">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Current Valuation</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Latest Raise Amount */}
              <form.Field name="latest_raise_amount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Latest Raise Amount</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Total Raised */}
              <form.Field name="total_raised">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Total Raised</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Market Size */}
              <form.Field name="market_size">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Market Size</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Competitors */}
              <form.Field name="competitors">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Competitors</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="List competitors..."
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Competitive Advantage */}
              <form.Field name="competitive_advantage">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Competitive Advantage</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="What sets this apart?"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Growth Metrics */}
              <form.Field name="growth_metrics">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Growth Metrics</Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="Key growth metrics..."
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              <div className="flex gap-3 pt-4">
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
                    'Create Profile'
                  )}
                </Button>
                <Link href="/entity-deal-profiles" className="flex-1">
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
