'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, AlertTriangle, Loader2, Pencil, Trash2, ChevronsUpDown, Check } from 'lucide-react';

import { useValuations } from '@/modules/assetmanager/hooks/holding/use-valuations';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import type { UpdateValuation } from '@/modules/assetmanager/schemas/holding/valuation.schemas';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// ==========================================
// Helper: parse optional number from string
// ==========================================

const optNum = (val: string): number | null => {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
};

export default function ValuationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseInt(params.id as string, 10);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';

  const { valuations, isLoading, error, fetchValuation, updateValuation, deleteValuation, fetchValuations } = useValuations();
  const { getEntityName } = useEntities();
  const { fundingRounds, fetchFundingRounds, getFundingRoundName, getFundingRoundsByEntity } = useFundingRounds();

  const item = valuations.find((row) => row.id === id);

  // Edit state for settings
  const [editFundingRoundId, setEditFundingRoundId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editValuationValue, setEditValuationValue] = useState('');
  const [editTotalFundUnits, setEditTotalFundUnits] = useState('');
  const [editNavPerShare, setEditNavPerShare] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // UI state
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [fundingRoundPopoverOpen, setFundingRoundPopoverOpen] = useState(false);

  // Fetch funding rounds on mount
  useEffect(() => {
    fetchFundingRounds({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the specific valuation if not in store
  useEffect(() => {
    if (id && !item) fetchValuation(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sync edit state when item loads
  useEffect(() => {
    if (item) {
      setEditFundingRoundId(item.funding_round_id);
      setEditDate(item.date || '');
      setEditValuationValue(String(item.valuation_value));
      setEditTotalFundUnits(item.total_fund_units != null ? String(item.total_fund_units) : '');
      setEditNavPerShare(item.nav_per_share != null ? String(item.nav_per_share) : '');
      setEditNotes(item.notes || '');
    }
  }, [item]);

  // Available funding rounds for this valuation's entity
  const availableFundingRounds = useMemo(() => {
    if (!item) return [];
    return getFundingRoundsByEntity(item.entity_id);
  }, [item, getFundingRoundsByEntity, fundingRounds]);

  // ==========================================
  // Save handler
  // ==========================================

  const handleSave = async () => {
    if (!item) return;
    setIsUpdating(true);
    try {
      const payload: UpdateValuation = {
        funding_round_id: editFundingRoundId,
        date: editDate || null,
        valuation_value: optNum(editValuationValue),
        total_fund_units: optNum(editTotalFundUnits),
        nav_per_share: optNum(editNavPerShare),
        notes: editNotes || null,
      };
      await updateValuation(id, payload);
      await fetchValuations({});
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
      await deleteValuation(id);
      router.push('/valuations');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to format currency
  const fmtCurrency = (val: number): string => `$${val.toLocaleString()}`;
  const fmtDecimal = (val: number | null): string =>
    val != null ? val.toLocaleString() : '—';
  const fmtDecimal4 = (val: number | null): string =>
    val != null ? val.toFixed(4) : '—';

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
        <AlertDescription>Valuation not found.</AlertDescription>
      </Alert>
    );
  }

  const deleteConfirmTarget = item.date || String(item.id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/valuations">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Valuations
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {getEntityName(item.entity_id)}
            </h1>
            <p className="text-muted-foreground">
              Valuation — {item.date || 'No date'}
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
          {/* Valuation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Valuation Details</CardTitle>
              <CardDescription>Core valuation information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Entity</p>
                <p className="text-lg font-medium">{getEntityName(item.entity_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funding Round</p>
                <p className="text-lg font-medium">
                  {item.funding_round_id ? getFundingRoundName(item.funding_round_id) : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-lg font-medium">{item.date || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valuation Value</p>
                <p className="text-lg font-medium">{fmtCurrency(item.valuation_value)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fund Units</p>
                <p className="text-lg font-medium">{fmtDecimal(item.total_fund_units)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NAV/Share</p>
                <p className="text-lg font-medium">{fmtDecimal4(item.nav_per_share)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-lg font-medium">{item.notes || '—'}</p>
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
          {/* Editable Valuation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Valuation Details</CardTitle>
              <CardDescription>Update valuation information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Funding Round */}
              <div className="space-y-2">
                <Label>Funding Round</Label>
                <Popover open={fundingRoundPopoverOpen} onOpenChange={setFundingRoundPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={fundingRoundPopoverOpen}
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {editFundingRoundId
                          ? availableFundingRounds.find((r) => r.id === editFundingRoundId)?.name || 'None'
                          : 'None'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search funding round..." />
                      <CommandList>
                        <CommandEmpty>No funding rounds found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="None"
                            onSelect={() => {
                              setEditFundingRoundId(null);
                              setFundingRoundPopoverOpen(false);
                            }}
                          >
                            None
                            {editFundingRoundId === null && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
                          </CommandItem>
                          {availableFundingRounds.map((round) => (
                            <CommandItem
                              key={round.id}
                              value={round.name}
                              onSelect={() => {
                                setEditFundingRoundId(round.id);
                                setFundingRoundPopoverOpen(false);
                              }}
                            >
                              {round.name}
                              {editFundingRoundId === round.id && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>

              {/* Valuation Value */}
              <div className="space-y-2">
                <Label htmlFor="edit-valuation-value">Valuation Value *</Label>
                <Input
                  id="edit-valuation-value"
                  type="number"
                  step="0.01"
                  value={editValuationValue}
                  onChange={(e) => setEditValuationValue(e.target.value)}
                />
              </div>

              {/* Fund-specific fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-total-fund-units">Total Fund Units</Label>
                  <Input
                    id="edit-total-fund-units"
                    type="number"
                    step="0.01"
                    placeholder="Funds only"
                    value={editTotalFundUnits}
                    onChange={(e) => setEditTotalFundUnits(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-nav-per-share">NAV/Share</Label>
                  <Input
                    id="edit-nav-per-share"
                    type="number"
                    step="0.0001"
                    placeholder="Funds only"
                    value={editNavPerShare}
                    onChange={(e) => setEditNavPerShare(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Optional notes..."
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
                  <h4 className="font-medium">Delete this valuation</h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this valuation record cannot be recovered.
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
                      Delete Valuation
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
