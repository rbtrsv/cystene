'use client';

import { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { useDealCommitments } from '@/modules/assetmanager/hooks/deal/use-deal-commitments';
import { useDeals } from '@/modules/assetmanager/hooks/deal/use-deals';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateDealCommitmentSchema } from '@/modules/assetmanager/schemas/deal/deal-commitment.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';

export default function CreateDealCommitmentPage() {
  const router = useRouter();
  const { activeEntity } = useEntities();
  const { deals, fetchDeals } = useDeals();
  const { createDealCommitment, error: storeError } = useDealCommitments();

  useEffect(() => {
    if (activeEntity) {
      fetchDeals({ entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  const entityDeals = activeEntity ? deals.filter((deal) => deal.entity_id === activeEntity.id) : [];

  const form = useForm({
    defaultValues: {
      deal_id: entityDeals[0]?.id || 0,
      entity_id: activeEntity?.id || 0,
      commitment_type: 'soft' as 'soft' | 'firm',
      amount: 0,
      notes: null as string | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.deal_id || !value.entity_id || !value.amount) return;

      const validation = CreateDealCommitmentSchema.safeParse(value);
      if (!validation.success) return;

      const success = await createDealCommitment(validation.data);
      if (success) router.push('/deal-commitments');
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

  if (entityDeals.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            No deals available for this entity. Create a deal first in{' '}
            <Link href="/deals/new" className="underline">
              Deals
            </Link>
            .
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/deal-commitments">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deal Commitments
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Deal Commitment</h1>
        <p className="text-muted-foreground mt-2">Add a commitment for {activeEntity.name}</p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Commitment Details</CardTitle>
          <CardDescription>Enter commitment information.</CardDescription>
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
            <form.Field name="deal_id">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Deal *</Label>
                  <Select
                    value={field.state.value ? field.state.value.toString() : ''}
                    onValueChange={(value) => field.handleChange(parseInt(value, 10))}
                    disabled={form.state.isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select deal" />
                    </SelectTrigger>
                    <SelectContent>
                      {entityDeals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id.toString()}>
                          {deal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              <form.Field name="commitment_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Commitment Type</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as 'soft' | 'firm')}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select commitment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soft">Soft</SelectItem>
                        <SelectItem value="firm">Firm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="amount">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Amount *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      disabled={form.state.isSubmitting}
                    />
                  </div>
                )}
              </form.Field>
            </div>

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
                    placeholder="Optional notes"
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
                  'Create Commitment'
                )}
              </Button>
              <Link href="/deal-commitments" className="flex-1">
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
