'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { useDeals } from '@/modules/assetmanager/hooks/deal/use-deals';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateDealSchema } from '@/modules/assetmanager/schemas/deal/deal.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';

export default function CreateDealPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { createDeal, error: storeError } = useDeals();

  const form = useForm({
    defaultValues: {
      entity_id: activeEntity?.id || 0,
      name: '',
      deal_type: 'fundraising' as 'fundraising' | 'acquisition' | 'secondary' | 'debt',
      start_date: '',
      end_date: '',
      target_amount: null as number | null,
      minimum_investment: null as number | null,
      pre_money_valuation: null as number | null,
      post_money_valuation: null as number | null,
      expected_close_date: null as string | null,
      pro_rata_rights: false,
      board_seats: 0,
      soft_commitments: 0,
      firm_commitments: 0,
      profile_views: 0,
    },
    onSubmit: async ({ value }) => {
      if (!value.entity_id) return;

      const validation = CreateDealSchema.safeParse(value);
      if (!validation.success) return;

      const success = await createDeal(validation.data);
      if (success) router.push('/deals');
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
        <Link href="/deals">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deals
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Deal</h1>
        <p className="text-muted-foreground mt-2">Add a new deal for {activeEntity.name}</p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Deal Details</CardTitle>
          <CardDescription>Enter the key details for the new deal.</CardDescription>
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
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Series A"
                    disabled={form.state.isSubmitting}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="deal_type">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Deal Type</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as typeof field.state.value)}
                    disabled={form.state.isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select deal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fundraising">Fundraising</SelectItem>
                      <SelectItem value="acquisition">Acquisition</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="debt">Debt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="start_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Start Date *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="end_date">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>End Date *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="target_amount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Target Amount</Label>
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

              <form.Field name="minimum_investment">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Minimum Investment</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="pre_money_valuation">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Pre-money Valuation</Label>
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

              <form.Field name="post_money_valuation">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Post-money Valuation</Label>
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
            </div>

            <form.Field name="expected_close_date">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Expected Close Date</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
                    value={field.state.value ?? ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value || null)}
                    disabled={form.state.isSubmitting}
                  />
                </div>
              )}
            </form.Field>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={form.state.isSubmitting}>
                {form.state.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Deal'
                )}
              </Button>
              <Link href="/deals" className="flex-1">
                <Button type="button" variant="outline" className="w-full" disabled={form.state.isSubmitting}>
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
