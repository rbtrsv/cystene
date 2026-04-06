'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Briefcase, Loader2, Pencil, Trash2 } from 'lucide-react';

import { useHoldings } from '@/modules/assetmanager/hooks/holding/use-holdings';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { type UpdateHolding } from '@/modules/assetmanager/schemas/holding/holding.schemas';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';

// ==========================================
// Dropdown Options
// ==========================================

const INVESTMENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'exited', label: 'Exited' },
  { value: 'written_off', label: 'Written Off' },
] as const;

const LISTING_STATUS_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'public', label: 'Public' },
] as const;

export default function HoldingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const id = parseInt(params.id as string, 10);
  const {
    holdings,
    isLoading,
    error,
    fetchHolding,
    updateHolding,
    deleteHolding,
    fetchHoldings,
  } = useHoldings();

  const { getEntityById } = useEntities();

  const item = holdings.find((row) => row.id === id);

  // Resolve entity name from item's entity_id
  const entityName = item ? (getEntityById(item.entity_id)?.name || `Entity #${item.entity_id}`) : '';

  // Settings state — Investment Details
  const [editInvestmentName, setEditInvestmentName] = useState('');
  const [editEntityType, setEditEntityType] = useState('');
  const [editInvestmentType, setEditInvestmentType] = useState('');
  const [editInvestmentRound, setEditInvestmentRound] = useState('');
  const [editInvestmentStatus, setEditInvestmentStatus] = useState('');
  const [editSector, setEditSector] = useState('');
  const [editListingStatus, setEditListingStatus] = useState('');
  const [editOriginalInvestmentDate, setEditOriginalInvestmentDate] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  // Settings state — Financial Details
  const [editTotalInvestmentAmount, setEditTotalInvestmentAmount] = useState('');
  const [editOwnershipPercentage, setEditOwnershipPercentage] = useState('');
  const [editInvestedAsPercentCapital, setEditInvestedAsPercentCapital] = useState('');
  // Settings state — Share Details
  const [editNumberOfShares, setEditNumberOfShares] = useState('');
  const [editAvgCostPerShare, setEditAvgCostPerShare] = useState('');
  const [editCurrentSharePrice, setEditCurrentSharePrice] = useState('');
  // Settings state — Exchange Details
  const [editStockTicker, setEditStockTicker] = useState('');
  const [editExchange, setEditExchange] = useState('');
  // Settings state — Valuation & Performance
  const [editCurrentFairValue, setEditCurrentFairValue] = useState('');
  const [editMoic, setEditMoic] = useState('');
  const [editIrr, setEditIrr] = useState('');
  // Settings state — Export
  const [editExportFunctionality, setEditExportFunctionality] = useState(false);
  // Settings state — Actions
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Initialize edit form when item loads
  useEffect(() => {
    if (item) {
      // Investment Details
      setEditInvestmentName(item.investment_name);
      setEditEntityType(item.entity_type);
      setEditInvestmentType(item.investment_type);
      setEditInvestmentRound(item.investment_round || '');
      setEditInvestmentStatus(item.investment_status);
      setEditSector(item.sector || '');
      setEditListingStatus(item.listing_status);
      setEditOriginalInvestmentDate(item.original_investment_date || '');
      setEditCompanyName(item.company_name || '');
      // Financial Details
      setEditTotalInvestmentAmount(item.total_investment_amount?.toString() || '');
      setEditOwnershipPercentage(item.ownership_percentage?.toString() || '');
      setEditInvestedAsPercentCapital(item.invested_as_percent_capital?.toString() || '');
      // Share Details
      setEditNumberOfShares(item.number_of_shares?.toString() || '');
      setEditAvgCostPerShare(item.average_cost_per_share?.toString() || '');
      setEditCurrentSharePrice(item.current_share_price?.toString() || '');
      // Exchange Details
      setEditStockTicker(item.stock_ticker || '');
      setEditExchange(item.exchange || '');
      // Valuation & Performance
      setEditCurrentFairValue(item.current_fair_value?.toString() || '');
      setEditMoic(item.moic?.toString() || '');
      setEditIrr(item.irr?.toString() || '');
      // Export
      setEditExportFunctionality(item.export_functionality);
    }
  }, [item]);

  useEffect(() => {
    if (id && !item) fetchHolding(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Helper to parse optional number fields for the update payload
  const optNum = (val: string): number | null | undefined =>
    val === '' ? null : parseFloat(val) || undefined;

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
        <AlertDescription>Holding not found</AlertDescription>
      </Alert>
    );
  }

  // Delete confirmation uses investment name
  const deleteConfirmTarget = item.investment_name;

  // Helper to format nullable numbers
  const fmtCurrency = (val: number | null): string =>
    val != null ? `$${val.toLocaleString()}` : '—';

  const fmtPlain = (val: number | null): string =>
    val != null ? val.toLocaleString() : '—';

  const fmtPercent = (val: number | null): string =>
    val != null ? `${val}%` : '—';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/holdings">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Holdings
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {entityName} — {item.investment_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {item.investment_status.replace('_', ' ')} · {item.sector} · {item.listing_status}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <Briefcase className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        {/* ========== OVERVIEW TAB ========== */}
        <TabsContent value="details" className="space-y-4">
          {/* Investment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Details</CardTitle>
              <CardDescription>Core investment information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Investment Name</p>
                <p className="text-lg font-medium">{item.investment_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="text-lg font-medium">{item.company_name || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entity Type</p>
                <p className="text-lg font-medium">{item.entity_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investment Type</p>
                <p className="text-lg font-medium">{item.investment_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investment Round</p>
                <p className="text-lg font-medium">{item.investment_round || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investment Status</p>
                <p className="text-lg font-medium capitalize">{item.investment_status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sector</p>
                <p className="text-lg font-medium">{item.sector}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Listing Status</p>
                <p className="text-lg font-medium capitalize">{item.listing_status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Original Investment Date</p>
                <p className="text-lg font-medium">
                  {item.original_investment_date ? new Date(item.original_investment_date).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Export Functionality</p>
                <p className="text-lg font-medium">{item.export_functionality ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
              <CardDescription>Investment amounts and ownership</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Investment Amount</p>
                <p className="text-lg font-medium">{fmtCurrency(item.total_investment_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ownership %</p>
                <p className="text-lg font-medium">{fmtPercent(item.ownership_percentage)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">% of Capital</p>
                <p className="text-lg font-medium">{fmtPercent(item.invested_as_percent_capital)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Share Details */}
          <Card>
            <CardHeader>
              <CardTitle>Share Details</CardTitle>
              <CardDescription>Share count and pricing</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Number of Shares</p>
                <p className="text-lg font-medium">{fmtPlain(item.number_of_shares)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Cost/Share</p>
                <p className="text-lg font-medium">{fmtCurrency(item.average_cost_per_share)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-lg font-medium">{fmtCurrency(item.current_share_price)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Exchange Details */}
          <Card>
            <CardHeader>
              <CardTitle>Exchange Details</CardTitle>
              <CardDescription>Stock ticker and exchange</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Stock Ticker</p>
                <p className="text-lg font-medium">{item.stock_ticker || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exchange</p>
                <p className="text-lg font-medium">{item.exchange || '—'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Valuation & Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Valuation & Performance</CardTitle>
              <CardDescription>Fair value and return metrics</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Fair Value</p>
                <p className="text-lg font-medium">{fmtCurrency(item.current_fair_value)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MOIC</p>
                <p className="text-lg font-medium">{fmtPlain(item.moic)}</p>
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
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="text-lg font-medium">
                  {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== SETTINGS TAB ========== */}
        <TabsContent value="edit" className="space-y-4">
          {/* Investment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Details</CardTitle>
              <CardDescription>Update core investment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-investment-name">Investment Name *</Label>
                  <Input id="edit-investment-name" value={editInvestmentName} onChange={(e) => setEditInvestmentName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company-name">Company Name</Label>
                  <Input id="edit-company-name" value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-entity-type">Company Type *</Label>
                  <Input id="edit-entity-type" value={editEntityType} onChange={(e) => setEditEntityType(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-investment-type">Investment Type *</Label>
                  <Input id="edit-investment-type" value={editInvestmentType} onChange={(e) => setEditInvestmentType(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-investment-status">Investment Status</Label>
                  <Select value={editInvestmentStatus} onValueChange={(value) => setEditInvestmentStatus(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-listing-status">Listing Status</Label>
                  <Select value={editListingStatus} onValueChange={(value) => setEditListingStatus(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LISTING_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sector">Sector</Label>
                  <Input id="edit-sector" value={editSector} onChange={(e) => setEditSector(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-investment-round">Investment Round</Label>
                  <Input id="edit-investment-round" value={editInvestmentRound} onChange={(e) => setEditInvestmentRound(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-original-investment-date">Original Investment Date</Label>
                <Input id="edit-original-investment-date" type="date" value={editOriginalInvestmentDate} onChange={(e) => setEditOriginalInvestmentDate(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="edit-export" checked={editExportFunctionality} onCheckedChange={(checked) => setEditExportFunctionality(checked === true)} />
                <Label htmlFor="edit-export">Export Functionality</Label>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
              <CardDescription>Update investment amounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-total-amount">Total Investment Amount</Label>
                  <Input id="edit-total-amount" type="number" step="0.01" value={editTotalInvestmentAmount} onChange={(e) => setEditTotalInvestmentAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ownership">Ownership %</Label>
                  <Input id="edit-ownership" type="number" step="0.01" value={editOwnershipPercentage} onChange={(e) => setEditOwnershipPercentage(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-percent-capital">% of Capital</Label>
                  <Input id="edit-percent-capital" type="number" step="0.01" value={editInvestedAsPercentCapital} onChange={(e) => setEditInvestedAsPercentCapital(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Details */}
          <Card>
            <CardHeader>
              <CardTitle>Share Details</CardTitle>
              <CardDescription>Update share information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-shares">Number of Shares</Label>
                  <Input id="edit-shares" type="number" step="0.01" value={editNumberOfShares} onChange={(e) => setEditNumberOfShares(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-avg-cost">Avg Cost/Share</Label>
                  <Input id="edit-avg-cost" type="number" step="0.01" value={editAvgCostPerShare} onChange={(e) => setEditAvgCostPerShare(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-current-price">Current Price</Label>
                  <Input id="edit-current-price" type="number" step="0.01" value={editCurrentSharePrice} onChange={(e) => setEditCurrentSharePrice(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exchange Details */}
          <Card>
            <CardHeader>
              <CardTitle>Exchange Details</CardTitle>
              <CardDescription>Update exchange information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-ticker">Stock Ticker</Label>
                  <Input id="edit-ticker" value={editStockTicker} onChange={(e) => setEditStockTicker(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-exchange">Exchange</Label>
                  <Input id="edit-exchange" value={editExchange} onChange={(e) => setEditExchange(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valuation & Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Valuation & Performance</CardTitle>
              <CardDescription>Update valuation and return metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-fair-value">Current Fair Value</Label>
                  <Input id="edit-fair-value" type="number" step="0.01" value={editCurrentFairValue} onChange={(e) => setEditCurrentFairValue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-moic">MOIC</Label>
                  <Input id="edit-moic" type="number" step="0.01" value={editMoic} onChange={(e) => setEditMoic(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-irr">IRR</Label>
                  <Input id="edit-irr" type="number" step="0.01" value={editIrr} onChange={(e) => setEditIrr(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={async () => {
              setIsUpdating(true);
              try {
                await updateHolding(id, {
                  // Investment Details
                  investment_name: editInvestmentName || undefined,
                  entity_type: editEntityType || undefined,
                  investment_type: editInvestmentType || undefined,
                  investment_round: editInvestmentRound || null,
                  investment_status: editInvestmentStatus || undefined,
                  sector: editSector || undefined,
                  listing_status: editListingStatus || undefined,
                  original_investment_date: editOriginalInvestmentDate || null,
                  company_name: editCompanyName || null,
                  export_functionality: editExportFunctionality,
                  // Financial Details
                  total_investment_amount: optNum(editTotalInvestmentAmount),
                  ownership_percentage: optNum(editOwnershipPercentage),
                  invested_as_percent_capital: optNum(editInvestedAsPercentCapital),
                  // Share Details
                  number_of_shares: optNum(editNumberOfShares),
                  average_cost_per_share: optNum(editAvgCostPerShare),
                  current_share_price: optNum(editCurrentSharePrice),
                  // Exchange Details
                  stock_ticker: editStockTicker || null,
                  exchange: editExchange || null,
                  // Valuation & Performance
                  current_fair_value: optNum(editCurrentFairValue),
                  moic: optNum(editMoic),
                  irr: optNum(editIrr),
                } as UpdateHolding);
                await fetchHoldings();
              } finally {
                setIsUpdating(false);
              }
            }}
            disabled={isUpdating}
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
                  <h4 className="font-medium">Delete this holding</h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this holding record cannot be recovered.
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
                    placeholder="Investment name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmText !== deleteConfirmTarget) return;
                    setIsDeleting(true);
                    try {
                      await deleteHolding(id);
                      router.push('/holdings');
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
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
                      Delete Holding
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
