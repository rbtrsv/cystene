'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useFees } from '@/modules/assetmanager/hooks/captable/use-fees';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateFeeSchema } from '@/modules/assetmanager/schemas/captable/fee.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateFeePage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { createFee, error: storeError } = useFees();

  const form = useForm({
    defaultValues: {
      entity_id: activeEntity?.id || 0,
      funding_round_id: null as number | null,
      year: new Date().getFullYear(),
      quarter: null as string | null,
      semester: null as string | null,
      month: null as string | null,
      full_year: false,
      scenario: 'actual' as 'actual' | 'forecast' | 'budget',
      date: null as string | null,
      fee_type: 'management' as 'management' | 'performance' | 'setup' | 'administrative' | 'other',
      fee_cost_name: null as string | null,
      frequency: 'one_time' as 'one_time' | 'monthly' | 'quarterly' | 'annual',
      amount: null as number | null,
      percentage: null as number | null,
      description: null as string | null,
      transaction_reference: null as string | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.entity_id) {
        return;
      }

      // Validate with Zod
      const validation = CreateFeeSchema.safeParse(value);

      if (!validation.success) {
        return;
      }

      const success = await createFee(validation.data);

      if (success) {
        router.push('/fees');
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
        <Link href="/fees">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Fees
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Fee</h1>
        <p className="text-muted-foreground mt-2">
          Add a new fee for {activeEntity.name}
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fee Details</CardTitle>
          <CardDescription>
            Enter the details for your new fee
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
              {/* Fee Type */}
              <form.Field name="fee_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Fee Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="setup">Setup</SelectItem>
                        <SelectItem value="administrative">Administrative</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Fee Cost Name */}
              <form.Field name="fee_cost_name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Fee Cost Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="e.g., Annual Management Fee"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Frequency */}
              <form.Field name="frequency">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Frequency</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_time">One-time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Amount */}
              <form.Field name="amount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Amount</Label>
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

              {/* Percentage */}
              <form.Field name="percentage">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Percentage</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Year */}
              <form.Field
                name="year"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value < 1900) return 'Year must be valid';
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Year *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
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

              {/* Quarter */}
              <form.Field name="quarter">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Quarter</Label>
                    <Select
                      value={field.state.value || 'none'}
                      onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select quarter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Q1">Q1</SelectItem>
                        <SelectItem value="Q2">Q2</SelectItem>
                        <SelectItem value="Q3">Q3</SelectItem>
                        <SelectItem value="Q4">Q4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Scenario */}
              <form.Field name="scenario">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Scenario</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select scenario" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="actual">Actual</SelectItem>
                        <SelectItem value="forecast">Forecast</SelectItem>
                        <SelectItem value="budget">Budget</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Date */}
              <form.Field name="date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Date</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
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
                      placeholder="Fee description..."
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              {/* Transaction Reference */}
              <form.Field name="transaction_reference">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Transaction Reference</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="e.g., INV-2025-001"
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
                    'Create Fee'
                  )}
                </Button>
                <Link href="/fees" className="flex-1">
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
