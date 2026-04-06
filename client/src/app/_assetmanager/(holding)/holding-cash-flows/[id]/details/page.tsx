'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowDownUp, AlertTriangle, Loader2, Pencil, Trash2 } from 'lucide-react';

import { useHoldingCashFlows } from '@/modules/assetmanager/hooks/holding/use-holding-cash-flows';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useHoldings } from '@/modules/assetmanager/hooks/holding/use-holdings';
import type { UpdateHoldingCashFlow } from '@/modules/assetmanager/schemas/holding/holding-cash-flow.schemas';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';

// ==========================================
// Enum dropdown options
// ==========================================

const CASH_FLOW_TYPE_OPTIONS = [
  { value: 'investment', label: 'Investment' },
  { value: 'distribution', label: 'Distribution' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'fee', label: 'Fee' },
  { value: 'other', label: 'Other' },
] as const;

const CASH_FLOW_CATEGORY_OPTIONS = [
  { value: 'actual', label: 'Actual' },
  { value: 'projected', label: 'Projected' },
] as const;

const CASH_FLOW_SCENARIO_OPTIONS = [
  { value: 'actual', label: 'Actual' },
  { value: 'budget', label: 'Budget' },
  { value: 'forecast', label: 'Forecast' },
] as const;

// ==========================================
// Helper: parse optional number from string
// ==========================================

const optNum = (val: string): number | null => {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
};

export default function HoldingCashFlowDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseInt(params.id as string, 10);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';

  const { holdingCashFlows, isLoading, error, fetchHoldingCashFlow, updateHoldingCashFlow, deleteHoldingCashFlow, fetchHoldingCashFlows } = useHoldingCashFlows();
  const { getEntityName } = useEntities();
  const { holdings, fetchHoldings } = useHoldings();

  const item = holdingCashFlows.find((row) => row.id === id);

  // Helper to resolve holding name
  const getHoldingName = (holdingId: number): string => {
    const holding = holdings.find((h) => h.id === holdingId);
    return holding ? holding.investment_name : `Holding #${holdingId}`;
  };

  // ==========================================
  // Edit state — all fields
  // ==========================================

  const [editDate, setEditDate] = useState('');
  const [editAmountDebit, setEditAmountDebit] = useState('');
  const [editAmountCredit, setEditAmountCredit] = useState('');
  const [editCurrency, setEditCurrency] = useState('');
  const [editCashFlowType, setEditCashFlowType] = useState('investment');
  const [editCategory, setEditCategory] = useState('actual');
  const [editScenario, setEditScenario] = useState('actual');
  const [editIncludeInIrr, setEditIncludeInIrr] = useState(true);
  const [editTransactionReference, setEditTransactionReference] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // UI state
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Fetch holdings on mount
  useEffect(() => {
    fetchHoldings({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the specific holding cash flow if not in store
  useEffect(() => {
    if (id && !item) fetchHoldingCashFlow(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sync edit state when item loads
  useEffect(() => {
    if (item) {
      setEditDate(item.date || '');
      setEditAmountDebit(String(item.amount_debit));
      setEditAmountCredit(String(item.amount_credit));
      setEditCurrency(item.currency);
      setEditCashFlowType(item.cash_flow_type);
      setEditCategory(item.category);
      setEditScenario(item.scenario);
      setEditIncludeInIrr(item.include_in_irr);
      setEditTransactionReference(item.transaction_reference || '');
      setEditDescription(item.description || '');
    }
  }, [item]);

  // ==========================================
  // Save handler
  // ==========================================

  const handleSave = async () => {
    if (!item) return;
    setIsUpdating(true);
    try {
      const payload: UpdateHoldingCashFlow = {
        date: editDate || null,
        amount_debit: optNum(editAmountDebit),
        amount_credit: optNum(editAmountCredit),
        currency: editCurrency || null,
        cash_flow_type: editCashFlowType || null,
        category: editCategory || null,
        scenario: editScenario || null,
        include_in_irr: editIncludeInIrr,
        transaction_reference: editTransactionReference || null,
        description: editDescription || null,
      } as UpdateHoldingCashFlow;
      await updateHoldingCashFlow(id, payload);
      await fetchHoldingCashFlows({});
    } finally {
      setIsUpdating(false);
    }
  };

  // ==========================================
  // Delete handler
  // ==========================================

  const handleDelete = async () => {
    if (!item) return;
    const confirmTarget = item.date || String(item.id);
    if (deleteConfirmText !== confirmTarget) return;
    setIsDeleting(true);
    try {
      await deleteHoldingCashFlow(id);
      router.push('/holding-cash-flows');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format helpers
  const fmtCurrency = (val: number, currency: string): string =>
    `${currency} ${val.toLocaleString()}`;
  const fmtPlain = (val: string | null): string => val || '—';
  const fmtEnum = (val: string): string =>
    val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // ==========================================
  // Render
  // ==========================================

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

  if (!item) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Holding cash flow not found.</AlertDescription>
      </Alert>
    );
  }

  const deleteConfirmTarget = item.date || String(item.id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/holding-cash-flows">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Holding Cash Flows
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <ArrowDownUp className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {getEntityName(item.entity_id)}
            </h1>
            <p className="text-muted-foreground">
              {getHoldingName(item.holding_id)} — {fmtEnum(item.cash_flow_type)} — {item.date}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        {/* ==========================================
            Details Tab
            ========================================== */}
        <TabsContent value="details" className="space-y-4">
          {/* Entity & Holding */}
          <Card>
            <CardHeader>
              <CardTitle>Entity & Holding</CardTitle>
              <CardDescription>Associated entity and holding</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Entity</p>
                <p className="text-lg font-medium">{getEntityName(item.entity_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Holding</p>
                <p className="text-lg font-medium">{getHoldingName(item.holding_id)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Details */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Details</CardTitle>
              <CardDescription>Core cash flow information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-lg font-medium">{item.date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="text-lg font-medium">{item.currency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash Flow Type</p>
                <p className="text-lg font-medium">{fmtEnum(item.cash_flow_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-lg font-medium">{fmtEnum(item.category)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scenario</p>
                <p className="text-lg font-medium">{fmtEnum(item.scenario)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Include in IRR</p>
                <p className="text-lg font-medium">{item.include_in_irr ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Debit</p>
                <p className="text-lg font-medium">{fmtCurrency(item.amount_debit, item.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Credit</p>
                <p className="text-lg font-medium">{fmtCurrency(item.amount_credit, item.currency)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Info</CardTitle>
              <CardDescription>Reference and description</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Transaction Reference</p>
                <p className="text-lg font-medium">{fmtPlain(item.transaction_reference)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-lg font-medium whitespace-pre-wrap">{fmtPlain(item.description)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Record Info */}
          <Card>
            <CardHeader>
              <CardTitle>Record Info</CardTitle>
              <CardDescription>System timestamps</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="text-lg font-medium">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated At</p>
                <p className="text-lg font-medium">
                  {item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==========================================
            Edit Tab
            ========================================== */}
        <TabsContent value="edit" className="space-y-4">
          {/* Cash Flow Details */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Details</CardTitle>
              <CardDescription>Update cash flow information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Currency</Label>
                  <Input
                    id="edit-currency"
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cash Flow Type</Label>
                  <Select value={editCashFlowType} onValueChange={setEditCashFlowType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CASH_FLOW_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CASH_FLOW_CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scenario</Label>
                  <Select value={editScenario} onValueChange={setEditScenario}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CASH_FLOW_SCENARIO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount-debit">Amount Debit</Label>
                  <Input
                    id="edit-amount-debit"
                    type="number"
                    step="0.01"
                    value={editAmountDebit}
                    onChange={(e) => setEditAmountDebit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-amount-credit">Amount Credit</Label>
                  <Input
                    id="edit-amount-credit"
                    type="number"
                    step="0.01"
                    value={editAmountCredit}
                    onChange={(e) => setEditAmountCredit(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-include-in-irr"
                  checked={editIncludeInIrr}
                  onCheckedChange={(checked) => setEditIncludeInIrr(checked === true)}
                />
                <Label htmlFor="edit-include-in-irr">Include in IRR Calculation</Label>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Info</CardTitle>
              <CardDescription>Update reference and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-transaction-reference">Transaction Reference</Label>
                <Input
                  id="edit-transaction-reference"
                  value={editTransactionReference}
                  onChange={(e) => setEditTransactionReference(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isUpdating}>
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
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this holding cash flow</h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this cash flow record cannot be recovered.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete">
                    Type <span className="font-semibold">{deleteConfirmTarget}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Confirmation"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting || deleteConfirmText !== deleteConfirmTarget}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Cash Flow
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
