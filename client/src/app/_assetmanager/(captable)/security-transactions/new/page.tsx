'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSecurityTransactions } from '@/modules/assetmanager/hooks/captable/use-security-transactions';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { useStakeholders } from '@/modules/assetmanager/hooks/entity/use-stakeholders';
import { useSecurities } from '@/modules/assetmanager/hooks/captable/use-securities';
import { CreateSecurityTransactionSchema, TRANSACTION_TYPE_LABELS } from '@/modules/assetmanager/schemas/captable/security-transaction.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateSecurityTransactionPage() {
  const router = useRouter();
  const { activeEntity, getEntityName } = useEntities();
  const { getFundingRoundsByEntity } = useFundingRounds();
  const { stakeholders } = useStakeholders();
  const { securities } = useSecurities();
  const { transactions, createSecurityTransaction, error: storeError } = useSecurityTransactions();

  // Form state - stores all field values as strings for form inputs
  const [formValues, setFormValues] = useState<Record<string, string | null>>({
    stakeholder_id: '',
    funding_round_id: '',
    security_id: null,
    transaction_reference: '',
    transaction_type: 'issuance',
    units_debit: '0',
    units_credit: '0',
    amount_debit: '0',
    amount_credit: '0',
    transaction_date: '',
    notes: null,
    related_transaction_id: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get funding rounds and stakeholders for the active entity
  const entityRounds = activeEntity ? getFundingRoundsByEntity(activeEntity.id) : [];
  const entityStakeholders = stakeholders.filter(s => s.entity_id === activeEntity?.id);

  // Get securities for the active entity's funding rounds
  const entityRoundIds = entityRounds.map(r => r.id);
  const entitySecurities = securities.filter(s => entityRoundIds.includes(s.funding_round_id));

  // Get existing transactions for related_transaction_id select
  const entityTransactions = transactions.filter(t => t.entity_id === activeEntity?.id);

  // Update a single form value
  const setFormValue = (name: string, value: string | null) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Number fields that need parseFloat conversion
  const FLOAT_FIELDS = ['units_debit', 'units_credit', 'amount_debit', 'amount_credit'];

  // Integer fields that need parseInt conversion
  const INT_FIELDS = ['stakeholder_id', 'funding_round_id', 'security_id', 'related_transaction_id'];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!activeEntity) return;

    // Build typed submit data from form values
    const submitData: Record<string, unknown> = {
      // Auto-set entity_id from active entity
      entity_id: activeEntity.id,
    };

    Object.entries(formValues).forEach(([key, value]) => {
      if (INT_FIELDS.includes(key)) {
        submitData[key] = value !== null && value !== '' ? parseInt(String(value)) : null;
      } else if (FLOAT_FIELDS.includes(key)) {
        submitData[key] = value !== null && value !== '' ? parseFloat(String(value)) : 0;
      } else {
        submitData[key] = value !== null && value !== '' ? value : null;
      }
    });

    // Validate with Zod
    const validation = CreateSecurityTransactionSchema.safeParse(submitData);
    if (!validation.success) {
      setValidationError(validation.error.errors[0]?.message || 'Validation failed');
      return;
    }

    setIsSubmitting(true);
    const success = await createSecurityTransaction(validation.data);
    setIsSubmitting(false);

    if (success) {
      router.push('/security-transactions');
    }
    // Error is handled by store and displayed via storeError
  };

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

  if (entityRounds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            No funding rounds found for this entity. Please create a funding round first.{' '}
            <Link href="/funding-rounds/new" className="underline">
              Create Funding Round
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/security-transactions">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Transaction</h1>
        <p className="text-muted-foreground mt-2">
          Add a new security transaction for {activeEntity.name}
        </p>
      </div>

      {(storeError || validationError) && (
        <Alert variant="destructive">
          <AlertDescription>{storeError || validationError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Enter the details for the new security transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stakeholder Select */}
              <div className="space-y-2">
                <Label htmlFor="stakeholder_id">Stakeholder *</Label>
                <Select
                  value={formValues.stakeholder_id || ''}
                  onValueChange={(v) => setFormValue('stakeholder_id', v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a stakeholder" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityStakeholders.map((stakeholder) => (
                      <SelectItem key={stakeholder.id} value={stakeholder.id.toString()}>
                        {getEntityName(stakeholder.source_entity_id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Funding Round Select */}
              <div className="space-y-2">
                <Label htmlFor="funding_round_id">Funding Round *</Label>
                <Select
                  value={formValues.funding_round_id || ''}
                  onValueChange={(v) => setFormValue('funding_round_id', v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a funding round" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityRounds.map((round) => (
                      <SelectItem key={round.id} value={round.id.toString()}>
                        {round.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Security Select (nullable - fund-level transactions) */}
              <div className="space-y-2">
                <Label htmlFor="security_id">Security</Label>
                <Select
                  value={formValues.security_id || 'none'}
                  onValueChange={(v) => setFormValue('security_id', v === 'none' ? null : v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a security (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Fund-level)</SelectItem>
                    {entitySecurities.map((security) => (
                      <SelectItem key={security.id} value={security.id.toString()}>
                        {security.security_name} ({security.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction Reference */}
              <div className="space-y-2">
                <Label htmlFor="transaction_reference">Transaction Reference *</Label>
                <Input
                  id="transaction_reference"
                  value={formValues.transaction_reference || ''}
                  onChange={(e) => setFormValue('transaction_reference', e.target.value || null)}
                  placeholder="e.g. TXN-001"
                  maxLength={50}
                  disabled={isSubmitting}
                />
              </div>

              {/* Transaction Type Select */}
              <div className="space-y-2">
                <Label htmlFor="transaction_type">Transaction Type *</Label>
                <Select
                  value={formValues.transaction_type || 'issuance'}
                  onValueChange={(v) => setFormValue('transaction_type', v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction Date */}
              <div className="space-y-2">
                <Label htmlFor="transaction_date">Transaction Date *</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formValues.transaction_date || ''}
                  onChange={(e) => setFormValue('transaction_date', e.target.value || null)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Units Debit & Credit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="units_debit">Units Debit</Label>
                  <Input
                    id="units_debit"
                    type="number"
                    step="0.01"
                    value={formValues.units_debit || '0'}
                    onChange={(e) => setFormValue('units_debit', e.target.value || '0')}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="units_credit">Units Credit</Label>
                  <Input
                    id="units_credit"
                    type="number"
                    step="0.01"
                    value={formValues.units_credit || '0'}
                    onChange={(e) => setFormValue('units_credit', e.target.value || '0')}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Amount Debit & Credit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount_debit">Amount Debit</Label>
                  <Input
                    id="amount_debit"
                    type="number"
                    step="0.01"
                    value={formValues.amount_debit || '0'}
                    onChange={(e) => setFormValue('amount_debit', e.target.value || '0')}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount_credit">Amount Credit</Label>
                  <Input
                    id="amount_credit"
                    type="number"
                    step="0.01"
                    value={formValues.amount_credit || '0'}
                    onChange={(e) => setFormValue('amount_credit', e.target.value || '0')}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formValues.notes || ''}
                  onChange={(e) => setFormValue('notes', e.target.value || null)}
                  placeholder="Optional transaction notes..."
                  disabled={isSubmitting}
                />
              </div>

              {/* Related Transaction Select (optional) */}
              <div className="space-y-2">
                <Label htmlFor="related_transaction_id">Related Transaction</Label>
                <Select
                  value={formValues.related_transaction_id || 'none'}
                  onValueChange={(v) => setFormValue('related_transaction_id', v === 'none' ? null : v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select related transaction (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {entityTransactions.map((txn) => (
                      <SelectItem key={txn.id} value={txn.id.toString()}>
                        {txn.transaction_reference} ({txn.transaction_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Transaction'
            )}
          </Button>
          <Link href="/security-transactions" className="flex-1">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
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
