'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, AlertTriangle, Loader2, Pencil, Trash2, ChevronsUpDown, Check } from 'lucide-react';

import { useHoldingPerformances } from '@/modules/assetmanager/hooks/holding/use-holding-performances';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import type { UpdateHoldingPerformance } from '@/modules/assetmanager/schemas/holding/holding-performance.schemas';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
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

export default function HoldingPerformanceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseInt(params.id as string, 10);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';

  const { holdingPerformances, isLoading, error, fetchHoldingPerformance, updateHoldingPerformance, deleteHoldingPerformance, fetchHoldingPerformances } = useHoldingPerformances();
  const { getEntityName } = useEntities();
  const { fundingRounds, fetchFundingRounds, getFundingRoundName, getFundingRoundsByEntity } = useFundingRounds();

  const item = holdingPerformances.find((row) => row.id === id);

  // ==========================================
  // Edit state — all fields
  // ==========================================

  const [editFundingRoundId, setEditFundingRoundId] = useState<number | null>(null);
  const [editReportDate, setEditReportDate] = useState('');
  const [editTotalInvestedAmount, setEditTotalInvestedAmount] = useState('');
  const [editFairValue, setEditFairValue] = useState('');
  const [editCashRealized, setEditCashRealized] = useState('');
  const [editTvpi, setEditTvpi] = useState('');
  const [editDpi, setEditDpi] = useState('');
  const [editRvpi, setEditRvpi] = useState('');
  const [editIrr, setEditIrr] = useState('');
  const [editMultipleToCost, setEditMultipleToCost] = useState('');

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

  // Fetch the specific holding performance if not in store
  useEffect(() => {
    if (id && !item) fetchHoldingPerformance(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sync edit state when item loads
  useEffect(() => {
    if (item) {
      setEditFundingRoundId(item.funding_round_id);
      setEditReportDate(item.report_date || '');
      setEditTotalInvestedAmount(item.total_invested_amount != null ? String(item.total_invested_amount) : '');
      setEditFairValue(item.fair_value != null ? String(item.fair_value) : '');
      setEditCashRealized(item.cash_realized != null ? String(item.cash_realized) : '');
      setEditTvpi(item.tvpi != null ? String(item.tvpi) : '');
      setEditDpi(item.dpi != null ? String(item.dpi) : '');
      setEditRvpi(item.rvpi != null ? String(item.rvpi) : '');
      setEditIrr(item.irr != null ? String(item.irr) : '');
      setEditMultipleToCost(item.multiple_to_cost != null ? String(item.multiple_to_cost) : '');
    }
  }, [item]);

  // Available funding rounds for this entity
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
      const payload: UpdateHoldingPerformance = {
        funding_round_id: editFundingRoundId,
        report_date: editReportDate || null,
        total_invested_amount: optNum(editTotalInvestedAmount),
        fair_value: optNum(editFairValue),
        cash_realized: optNum(editCashRealized),
        tvpi: optNum(editTvpi),
        dpi: optNum(editDpi),
        rvpi: optNum(editRvpi),
        irr: optNum(editIrr),
        multiple_to_cost: optNum(editMultipleToCost),
      };
      await updateHoldingPerformance(id, payload);
      await fetchHoldingPerformances({});
    } finally {
      setIsUpdating(false);
    }
  };

  // ==========================================
  // Delete handler
  // ==========================================

  const handleDelete = async () => {
    if (!item) return;
    if (deleteConfirmText !== item.report_date) return;
    setIsDeleting(true);
    try {
      await deleteHoldingPerformance(id);
      router.push('/holding-performance');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format helpers
  const fmtCurrency = (val: number | null): string =>
    val != null ? `$${val.toLocaleString()}` : '—';
  const fmtDecimal = (val: number | null): string =>
    val != null ? val.toFixed(2) : '—';
  const fmtPercent = (val: number | null): string =>
    val != null ? `${val.toFixed(2)}%` : '—';

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
        <AlertDescription>Holding performance record not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/holding-performance">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Holding Performance
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {getEntityName(item.entity_id)}
            </h1>
            <p className="text-muted-foreground">
              Performance — {item.report_date}
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
          {/* Report Info */}
          <Card>
            <CardHeader>
              <CardTitle>Report Info</CardTitle>
              <CardDescription>Entity and report details</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Entity</p>
                <p className="text-lg font-medium">{getEntityName(item.entity_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Report Date</p>
                <p className="text-lg font-medium">{item.report_date}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funding Round</p>
                <p className="text-lg font-medium">
                  {item.funding_round_id ? getFundingRoundName(item.funding_round_id) : '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Investment return metrics</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested Amount</p>
                <p className="text-lg font-medium">{fmtCurrency(item.total_invested_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fair Value</p>
                <p className="text-lg font-medium">{fmtCurrency(item.fair_value)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash Realized</p>
                <p className="text-lg font-medium">{fmtCurrency(item.cash_realized)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Multiple to Cost</p>
                <p className="text-lg font-medium">{fmtDecimal(item.multiple_to_cost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TVPI</p>
                <p className="text-lg font-medium">{fmtDecimal(item.tvpi)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">DPI</p>
                <p className="text-lg font-medium">{fmtDecimal(item.dpi)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RVPI</p>
                <p className="text-lg font-medium">{fmtDecimal(item.rvpi)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IRR</p>
                <p className="text-lg font-medium">{fmtPercent(item.irr)}</p>
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
          {/* Report Info */}
          <Card>
            <CardHeader>
              <CardTitle>Report Info</CardTitle>
              <CardDescription>Update report details</CardDescription>
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

              {/* Report Date */}
              <div className="space-y-2">
                <Label htmlFor="edit-report-date">Report Date</Label>
                <Input
                  id="edit-report-date"
                  type="date"
                  value={editReportDate}
                  onChange={(e) => setEditReportDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Update investment return metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-total-invested">Total Invested Amount</Label>
                  <Input
                    id="edit-total-invested"
                    type="number"
                    step="0.01"
                    value={editTotalInvestedAmount}
                    onChange={(e) => setEditTotalInvestedAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-fair-value">Fair Value</Label>
                  <Input
                    id="edit-fair-value"
                    type="number"
                    step="0.01"
                    value={editFairValue}
                    onChange={(e) => setEditFairValue(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-cash-realized">Cash Realized</Label>
                  <Input
                    id="edit-cash-realized"
                    type="number"
                    step="0.01"
                    value={editCashRealized}
                    onChange={(e) => setEditCashRealized(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-multiple-to-cost">Multiple to Cost</Label>
                  <Input
                    id="edit-multiple-to-cost"
                    type="number"
                    step="0.01"
                    value={editMultipleToCost}
                    onChange={(e) => setEditMultipleToCost(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tvpi">TVPI</Label>
                  <Input
                    id="edit-tvpi"
                    type="number"
                    step="0.01"
                    value={editTvpi}
                    onChange={(e) => setEditTvpi(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dpi">DPI</Label>
                  <Input
                    id="edit-dpi"
                    type="number"
                    step="0.01"
                    value={editDpi}
                    onChange={(e) => setEditDpi(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-rvpi">RVPI</Label>
                  <Input
                    id="edit-rvpi"
                    type="number"
                    step="0.01"
                    value={editRvpi}
                    onChange={(e) => setEditRvpi(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-irr">IRR (%)</Label>
                  <Input
                    id="edit-irr"
                    type="number"
                    step="0.01"
                    value={editIrr}
                    onChange={(e) => setEditIrr(e.target.value)}
                  />
                </div>
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
                  <h4 className="font-medium">Delete this performance record</h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this performance record cannot be recovered.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete">
                    Type <span className="font-semibold">{item.report_date}</span> to confirm
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
                  disabled={isDeleting || deleteConfirmText !== item.report_date}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Performance
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
