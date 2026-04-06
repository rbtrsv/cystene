'use client';

import { useState, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { CreateEntitySchema } from '@/modules/assetmanager/schemas/entity/entity.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/modules/shadcnui/components/ui/dialog';
import { useSubscriptions } from '@/modules/accounts/hooks/use-subscriptions';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateEntityPage() {
  const router = useRouter();
  const { activeOrganization, organizations } = useOrganizations();
  const { createEntity, error: storeError, entities } = useEntities();
  const { plans, fetchPlans } = useSubscriptions();

  // Confirmation dialog state (Option C — confirm cost before creating)
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [pendingValues, setPendingValues] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FREE_ENTITY_LIMIT = 1 (matching backend subscription_utils.py)
  const entityCount = entities.length;
  const billableEntities = Math.max(0, entityCount - 1);
  const pricePerEntity = plans?.prices?.[0]?.amount ?? 0;
  const newBillableCount = billableEntities + 1;
  const newMonthlyTotal = newBillableCount * pricePerEntity;

  // Submit entity creation (called directly or after dialog confirmation)
  const submitCreate = async (value: any) => {
    const success = await createEntity(value);
    if (success) {
      router.push('/entities');
    }
  };

  const form = useForm({
    defaultValues: {
      name: '',
      entity_type: 'company' as 'fund' | 'company' | 'individual' | 'syndicate',
      organization_id: activeOrganization?.id || 0,
      parent_id: null as number | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.organization_id) {
        return;
      }

      // Validate with Zod
      const validation = CreateEntitySchema.safeParse(value);

      if (!validation.success) {
        return;
      }

      // If entity count is at or over free tier, show cost confirmation dialog
      // First entity is free — only show dialog for billable entities
      if (entityCount >= 1 && pricePerEntity > 0) {
        setPendingValues(value);
        setShowCostDialog(true);
        return;
      }

      // Within free tier — create directly without confirmation
      await submitCreate(value);
      // Error is handled by store and displayed via storeError
    },
  });

  if (organizations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            You need to create an organization first.{' '}
            <Link href="/organizations/new" className="underline">
              Create Organization
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/entities">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Entities
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Entity</h1>
        <p className="text-muted-foreground mt-2">
          Add a new fund, company, individual, or syndicate to your organization
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Entity Details</CardTitle>
          <CardDescription>
            Enter the details for your new entity
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
              <form.Field name="organization_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Organization</Label>
                    <Select
                      value={field.state.value?.toString()}
                      onValueChange={(value) => field.handleChange(parseInt(value))}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id.toString()}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The organization this entity belongs to
                    </p>
                  </div>
                )}
              </form.Field>

              <form.Field
                name="name"
                validators={{
                  onChange: ({ value, fieldApi }) => {
                    const orgId = fieldApi.form.getFieldValue('organization_id');
                    if (!orgId) return 'Please select an organization first';

                    const result = CreateEntitySchema.safeParse({
                      name: value,
                      entity_type: 'company',
                      organization_id: orgId,
                    });
                    if (!result.success) {
                      return result.error.errors.find((e) => e.path[0] === 'name')?.message || 'Invalid name';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Entity Name *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., Acme Portfolio Company"
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

              <form.Field name="entity_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Entity Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as 'fund' | 'company' | 'individual' | 'syndicate')}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fund">Fund</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="syndicate">Syndicate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="parent_id">
                {(field) => {
                  const selectedOrgId = field.form.getFieldValue('organization_id');
                  const potentialParents = entities.filter(
                    (e) => e.entity_type === 'fund' && e.organization_id === selectedOrgId
                  );

                  return (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Parent Entity</Label>
                      <Select
                        value={field.state.value?.toString() || 'none'}
                        onValueChange={(value) => field.handleChange(value === 'none' ? null : parseInt(value))}
                        disabled={form.state.isSubmitting || !selectedOrgId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent entity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Parent</SelectItem>
                          {potentialParents.map((parent) => (
                            <SelectItem key={parent.id} value={parent.id.toString()}>
                              {parent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Only funds from the selected organization can be parent entities
                      </p>
                    </div>
                  );
                }}
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
                    'Create Entity'
                  )}
                </Button>
                <Link href="/entities" className="flex-1">
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

      {/* Cost confirmation dialog (Option C) — shown when creating a billable entity */}
      <Dialog open={showCostDialog} onOpenChange={setShowCostDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Confirm subscription change</DialogTitle>
            <DialogDescription>
              Creating this entity will update your monthly billing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price per entity</span>
              <span>${pricePerEntity.toFixed(2)}/mo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Billable entities after creation</span>
              <span>{newBillableCount}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>New monthly total</span>
              <span>${newMonthlyTotal.toFixed(2)}/mo</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCostDialog(false);
                setPendingValues(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setShowCostDialog(false);
                if (pendingValues) {
                  await submitCreate(pendingValues);
                  setPendingValues(null);
                }
              }}
            >
              Confirm & Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
