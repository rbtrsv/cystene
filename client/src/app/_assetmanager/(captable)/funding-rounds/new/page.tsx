'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateFundingRoundSchema } from '@/modules/assetmanager/schemas/captable/funding-round.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateFundingRoundPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { createFundingRound, error: storeError } = useFundingRounds();

  const form = useForm({
    defaultValues: {
      entity_id: activeEntity?.id || 0,
      name: '',
      round_type: 'seed' as 'seed' | 'pre_series_a' | 'series_a' | 'series_b' | 'series_c' | 'series_d' | 'debt' | 'convertible' | 'safe' | 'bridge' | 'secondary' | 'other',
      date: '',
      target_amount: 0,
      raised_amount: 0,
      pre_money_valuation: null as number | null,
      post_money_valuation: null as number | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.entity_id) {
        return;
      }

      // Validate with Zod
      const validation = CreateFundingRoundSchema.safeParse(value);

      if (!validation.success) {
        return;
      }

      const success = await createFundingRound(value);

      if (success) {
        router.push('/funding-rounds');
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
        <Link href="/funding-rounds">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Funding Rounds
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Funding Round</h1>
        <p className="text-muted-foreground mt-2">
          Add a new funding round for {activeEntity.name}
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Funding Round Details</CardTitle>
          <CardDescription>
            Enter the details for your new funding round
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
              {/* Name */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    const result = CreateFundingRoundSchema.shape.name.safeParse(value);
                    if (!result.success) {
                      return result.error.errors[0]?.message || 'Invalid name';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Round Name *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., Seed Round 2025"
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

              {/* Round Type */}
              <form.Field name="round_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Round Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select round type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seed">Seed</SelectItem>
                        <SelectItem value="pre_series_a">Pre-Series A</SelectItem>
                        <SelectItem value="series_a">Series A</SelectItem>
                        <SelectItem value="series_b">Series B</SelectItem>
                        <SelectItem value="series_c">Series C</SelectItem>
                        <SelectItem value="series_d">Series D</SelectItem>
                        <SelectItem value="debt">Debt</SelectItem>
                        <SelectItem value="convertible">Convertible</SelectItem>
                        <SelectItem value="safe">SAFE</SelectItem>
                        <SelectItem value="bridge">Bridge</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Date */}
              <form.Field
                name="date"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return 'Date is required';
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Date *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
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

              {/* Target Amount */}
              <form.Field name="target_amount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Target Amount *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Raised Amount */}
              <form.Field name="raised_amount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Raised Amount</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Pre-money Valuation */}
              <form.Field name="pre_money_valuation">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Pre-money Valuation</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Post-money Valuation */}
              <form.Field name="post_money_valuation">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Post-money Valuation</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
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
                    'Create Funding Round'
                  )}
                </Button>
                <Link href="/funding-rounds" className="flex-1">
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
