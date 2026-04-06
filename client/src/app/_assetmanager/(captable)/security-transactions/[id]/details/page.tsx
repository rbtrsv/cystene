'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSecurityTransactions } from '@/modules/assetmanager/hooks/captable/use-security-transactions';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { useStakeholders } from '@/modules/assetmanager/hooks/entity/use-stakeholders';
import { useSecurities } from '@/modules/assetmanager/hooks/captable/use-securities';
import {
  getTransactionTypeLabel,
  calculateNetAmount,
  calculateNetUnits,
  TRANSACTION_TYPE_LABELS,
  CreateSecurityTransactionSchema,
} from '@/modules/assetmanager/schemas/captable/security-transaction.schemas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, ArrowLeftRight, Pencil, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SecurityTransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = parseInt(params.id as string);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const { activeEntity, getEntityName } = useEntities();
  const { transactions, isLoading, error, fetchSecurityTransaction, updateSecurityTransaction, deleteSecurityTransaction, fetchSecurityTransactions } = useSecurityTransactions();
  const { fundingRounds, getFundingRoundsByEntity } = useFundingRounds();
  const { stakeholders } = useStakeholders();
  const { securities } = useSecurities();

  const transaction = transactions.find(t => t.id === transactionId);

  // Edit form state
  const [editValues, setEditValues] = useState<Record<string, string | null>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmRef, setDeleteConfirmRef] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize edit form when transaction loads
  useEffect(() => {
    if (transaction) {
      const values: Record<string, string | null> = {};
      Object.entries(transaction).forEach(([key, value]) => {
        if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'entity_id') return;
        if (value === null || value === undefined) {
          values[key] = null;
        } else {
          values[key] = String(value);
        }
      });
      setEditValues(values);
    }
  }, [transaction]);

  // Fetch transaction if not in store
  useEffect(() => {
    if (transactionId && !transaction) {
      fetchSecurityTransaction(transactionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  // Get entity-scoped data for edit selects
  const entityRounds = activeEntity ? getFundingRoundsByEntity(activeEntity.id) : [];
  const entityStakeholders = stakeholders.filter(s => s.entity_id === activeEntity?.id);
  const entityRoundIds = entityRounds.map(r => r.id);
  const entitySecurities = securities.filter(s => entityRoundIds.includes(s.funding_round_id));
  const entityTransactions = transactions.filter(t => t.entity_id === activeEntity?.id && t.id !== transactionId);

  // Get stakeholder name by ID (derives name from source entity)
  const getStakeholderName = (stakeholderId: number) => {
    const stakeholder = stakeholders.find(s => s.id === stakeholderId);
    return stakeholder ? getEntityName(stakeholder.source_entity_id) : 'Unknown Stakeholder';
  };

  // Get security name by ID
  const getSecurityName = (securityId: number | null) => {
    if (securityId === null) return 'Fund-level';
    const security = securities.find(s => s.id === securityId);
    return security ? security.security_name : 'Unknown Security';
  };

  // Get funding round name by ID
  const getFundingRoundName = (fundingRoundId: number) => {
    const round = fundingRounds.find(r => r.id === fundingRoundId);
    return round ? round.name : 'Unknown Round';
  };

  // Get related transaction reference
  const getRelatedTransactionRef = (relatedId: number | null) => {
    if (relatedId === null) return '—';
    const related = transactions.find(t => t.id === relatedId);
    return related ? related.transaction_reference : 'Unknown';
  };

  // Helper to get display value
  const getDisplayValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    return String(value);
  };

  // Update a single edit value
  const setEditValue = (name: string, value: string | null) => {
    setEditValues(prev => ({ ...prev, [name]: value }));
  };

  // Number fields that need parseFloat conversion
  const FLOAT_FIELDS = ['units_debit', 'units_credit', 'amount_debit', 'amount_credit'];

  // Integer fields that need parseInt conversion
  const INT_FIELDS = ['stakeholder_id', 'funding_round_id', 'security_id', 'related_transaction_id'];

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!transaction) return;

    setIsUpdating(true);
    setValidationError(null);

    try {
      // Build update data from editValues, converting types appropriately
      const updateData: Record<string, unknown> = {};
      Object.entries(editValues).forEach(([key, value]) => {
        if (INT_FIELDS.includes(key)) {
          updateData[key] = value !== null && value !== '' ? parseInt(String(value)) : null;
        } else if (FLOAT_FIELDS.includes(key)) {
          updateData[key] = value !== null && value !== '' ? parseFloat(String(value)) : 0;
        } else {
          updateData[key] = value !== null && value !== '' ? value : null;
        }
      });

      await updateSecurityTransaction(transactionId, updateData);
      await fetchSecurityTransactions();
    } catch (err) {
      console.error('Failed to update security transaction:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!transaction) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Transaction not found</AlertDescription>
      </Alert>
    );
  }

  const netAmount = calculateNetAmount(transaction);
  const netUnits = calculateNetUnits(transaction);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/security-transactions">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Transactions
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{transaction.transaction_reference}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {getTransactionTypeLabel(transaction.transaction_type)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {transaction.transaction_date}
                </span>
                <span className="text-sm text-muted-foreground">
                  · {getStakeholderName(transaction.stakeholder_id)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <ArrowLeftRight className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        {/* ==========================================
            Overview Tab
            ========================================== */}
        <TabsContent value="details" className="space-y-4">
          {/* General Details */}
          <Card>
            <CardHeader>
              <CardTitle>General Details</CardTitle>
              <CardDescription>
                Core transaction information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Reference</p>
                  <p className="text-lg font-medium">{transaction.transaction_reference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Type</p>
                  <p className="text-lg font-medium">{getTransactionTypeLabel(transaction.transaction_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stakeholder</p>
                  <p className="text-lg font-medium">{getStakeholderName(transaction.stakeholder_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Funding Round</p>
                  <p className="text-lg font-medium">{getFundingRoundName(transaction.funding_round_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Security</p>
                  <p className="text-lg font-medium">{getSecurityName(transaction.security_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Date</p>
                  <p className="text-lg font-medium">{transaction.transaction_date}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Units & Amounts */}
          <Card>
            <CardHeader>
              <CardTitle>Units & Amounts</CardTitle>
              <CardDescription>
                Debit and credit details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Units Debit</p>
                  <p className="text-lg font-medium">{transaction.units_debit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Units Credit</p>
                  <p className="text-lg font-medium">{transaction.units_credit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Debit</p>
                  <p className="text-lg font-medium">{transaction.amount_debit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Credit</p>
                  <p className="text-lg font-medium">{transaction.amount_credit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Units</p>
                  <p className={`text-lg font-medium ${netUnits > 0 ? 'text-green-600' : netUnits < 0 ? 'text-red-600' : ''}`}>
                    {netUnits > 0 ? '+' : ''}{netUnits.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Amount</p>
                  <p className={`text-lg font-medium ${netAmount > 0 ? 'text-green-600' : netAmount < 0 ? 'text-red-600' : ''}`}>
                    {netAmount > 0 ? '+' : ''}{netAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Related Transaction</p>
                  <p className="text-lg font-medium">{getRelatedTransactionRef(transaction.related_transaction_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-lg font-medium">{getDisplayValue(transaction.notes)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-lg font-medium">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
                {transaction.updated_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-lg font-medium">
                      {new Date(transaction.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==========================================
            Settings Tab
            ========================================== */}
        <TabsContent value="edit" className="space-y-4">
          {(validationError) && (
            <Alert variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Edit Transaction Form */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Transaction</CardTitle>
              <CardDescription>
                Update transaction details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Stakeholder Select */}
                <div className="space-y-2">
                  <Label htmlFor="edit-stakeholder_id">Stakeholder *</Label>
                  <Select
                    value={editValues.stakeholder_id || ''}
                    onValueChange={(v) => setEditValue('stakeholder_id', v)}
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
                  <Label htmlFor="edit-funding_round_id">Funding Round *</Label>
                  <Select
                    value={editValues.funding_round_id || ''}
                    onValueChange={(v) => setEditValue('funding_round_id', v)}
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

                {/* Security Select */}
                <div className="space-y-2">
                  <Label htmlFor="edit-security_id">Security</Label>
                  <Select
                    value={editValues.security_id || 'none'}
                    onValueChange={(v) => setEditValue('security_id', v === 'none' ? null : v)}
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
                  <Label htmlFor="edit-transaction_reference">Transaction Reference *</Label>
                  <Input
                    id="edit-transaction_reference"
                    value={editValues.transaction_reference || ''}
                    onChange={(e) => setEditValue('transaction_reference', e.target.value || null)}
                    placeholder="e.g. TXN-001"
                    maxLength={50}
                  />
                </div>

                {/* Transaction Type Select */}
                <div className="space-y-2">
                  <Label htmlFor="edit-transaction_type">Transaction Type *</Label>
                  <Select
                    value={editValues.transaction_type || 'issuance'}
                    onValueChange={(v) => setEditValue('transaction_type', v)}
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
                  <Label htmlFor="edit-transaction_date">Transaction Date *</Label>
                  <Input
                    id="edit-transaction_date"
                    type="date"
                    value={editValues.transaction_date || ''}
                    onChange={(e) => setEditValue('transaction_date', e.target.value || null)}
                  />
                </div>

                {/* Units Debit & Credit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-units_debit">Units Debit</Label>
                    <Input
                      id="edit-units_debit"
                      type="number"
                      step="0.01"
                      value={editValues.units_debit || '0'}
                      onChange={(e) => setEditValue('units_debit', e.target.value || '0')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-units_credit">Units Credit</Label>
                    <Input
                      id="edit-units_credit"
                      type="number"
                      step="0.01"
                      value={editValues.units_credit || '0'}
                      onChange={(e) => setEditValue('units_credit', e.target.value || '0')}
                    />
                  </div>
                </div>

                {/* Amount Debit & Credit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount_debit">Amount Debit</Label>
                    <Input
                      id="edit-amount_debit"
                      type="number"
                      step="0.01"
                      value={editValues.amount_debit || '0'}
                      onChange={(e) => setEditValue('amount_debit', e.target.value || '0')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount_credit">Amount Credit</Label>
                    <Input
                      id="edit-amount_credit"
                      type="number"
                      step="0.01"
                      value={editValues.amount_credit || '0'}
                      onChange={(e) => setEditValue('amount_credit', e.target.value || '0')}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editValues.notes || ''}
                    onChange={(e) => setEditValue('notes', e.target.value || null)}
                    placeholder="Optional transaction notes..."
                  />
                </div>

                {/* Related Transaction Select */}
                <div className="space-y-2">
                  <Label htmlFor="edit-related_transaction_id">Related Transaction</Label>
                  <Select
                    value={editValues.related_transaction_id || 'none'}
                    onValueChange={(v) => setEditValue('related_transaction_id', v === 'none' ? null : v)}
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

          {/* Save Button */}
          <Button
            onClick={handleSaveChanges}
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this transaction</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete a transaction, there is no going back. This will permanently delete the transaction and all associated data.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-transaction">
                    Type <span className="font-semibold">{transaction.transaction_reference}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-transaction"
                    value={deleteConfirmRef}
                    onChange={(e) => setDeleteConfirmRef(e.target.value)}
                    placeholder="Transaction reference"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmRef !== transaction.transaction_reference) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      await deleteSecurityTransaction(transactionId);
                      router.push('/security-transactions');
                    } catch (err) {
                      console.error('Failed to delete security transaction:', err);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmRef !== transaction.transaction_reference}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Transaction
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
