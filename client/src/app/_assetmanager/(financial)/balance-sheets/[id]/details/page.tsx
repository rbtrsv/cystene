'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Loader2, Scale, Pencil, Trash2 } from 'lucide-react';

import { useBalanceSheets } from '@/modules/assetmanager/hooks/financial/use-balance-sheets';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { SCENARIO_OPTIONS, QUARTER_OPTIONS, SEMESTER_OPTIONS, MONTH_OPTIONS, getScenarioLabel } from '@/modules/assetmanager/schemas/financial/shared-financial.schemas';

export default function BalanceSheetDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseInt(params.id as string, 10);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const {
    balanceSheets,
    isLoading,
    error,
    fetchBalanceSheet,
    updateBalanceSheet,
    deleteBalanceSheet,
    fetchBalanceSheets,
  } = useBalanceSheets();

  const { getEntityById } = useEntities();

  const item = balanceSheets.find((row) => row.id === id);

  // Resolve entity name from item's entity_id
  const entityName = item ? (getEntityById(item.entity_id)?.name || `Entity #${item.entity_id}`) : '';

  // Settings state — Time Dimensions
  const [editYear, setEditYear] = useState('');
  const [editScenario, setEditScenario] = useState('');
  const [editQuarter, setEditQuarter] = useState<string | null>(null);
  const [editSemester, setEditSemester] = useState<string | null>(null);
  const [editMonth, setEditMonth] = useState('');
  const [editFullYear, setEditFullYear] = useState(false);
  const [editDate, setEditDate] = useState('');
  // Settings state — Current Assets
  const [editCash, setEditCash] = useState('');
  const [editCashEquivalents, setEditCashEquivalents] = useState('');
  const [editCashAndCashEquivalents, setEditCashAndCashEquivalents] = useState('');
  const [editOtherSTInvestments, setEditOtherSTInvestments] = useState('');
  const [editAccountsReceivable, setEditAccountsReceivable] = useState('');
  const [editOtherReceivables, setEditOtherReceivables] = useState('');
  const [editInventory, setEditInventory] = useState('');
  const [editPrepaidAssets, setEditPrepaidAssets] = useState('');
  const [editRestrictedCash, setEditRestrictedCash] = useState('');
  const [editAssetsHeldForSale, setEditAssetsHeldForSale] = useState('');
  const [editHedgingAssets, setEditHedgingAssets] = useState('');
  const [editOtherCurrentAssets, setEditOtherCurrentAssets] = useState('');
  const [editTotalCurrentAssets, setEditTotalCurrentAssets] = useState('');
  // Settings state — Non-current Assets
  const [editProperties, setEditProperties] = useState('');
  const [editLandAndImprovements, setEditLandAndImprovements] = useState('');
  const [editMachineryFurnitureEquipment, setEditMachineryFurnitureEquipment] = useState('');
  const [editConstructionInProgress, setEditConstructionInProgress] = useState('');
  const [editLeases, setEditLeases] = useState('');
  const [editAccumulatedDepreciation, setEditAccumulatedDepreciation] = useState('');
  const [editGoodwill, setEditGoodwill] = useState('');
  const [editInvestmentProperties, setEditInvestmentProperties] = useState('');
  const [editFinancialAssets, setEditFinancialAssets] = useState('');
  const [editIntangibleAssets, setEditIntangibleAssets] = useState('');
  const [editInvestmentsAndAdvances, setEditInvestmentsAndAdvances] = useState('');
  const [editOtherNonCurrentAssets, setEditOtherNonCurrentAssets] = useState('');
  const [editTotalNonCurrentAssets, setEditTotalNonCurrentAssets] = useState('');
  // Settings state — Total Assets
  const [editTotalAssets, setEditTotalAssets] = useState('');
  // Settings state — Current Liabilities
  const [editAccountsPayable, setEditAccountsPayable] = useState('');
  const [editAccruedExpenses, setEditAccruedExpenses] = useState('');
  const [editShortTermDebt, setEditShortTermDebt] = useState('');
  const [editDeferredRevenue, setEditDeferredRevenue] = useState('');
  const [editTaxPayable, setEditTaxPayable] = useState('');
  const [editPensions, setEditPensions] = useState('');
  const [editOtherCurrentLiabilities, setEditOtherCurrentLiabilities] = useState('');
  const [editTotalCurrentLiabilities, setEditTotalCurrentLiabilities] = useState('');
  // Settings state — Non-current Liabilities
  const [editLongTermProvisions, setEditLongTermProvisions] = useState('');
  const [editLongTermDebt, setEditLongTermDebt] = useState('');
  const [editProvisionForRisks, setEditProvisionForRisks] = useState('');
  const [editDeferredLiabilities, setEditDeferredLiabilities] = useState('');
  const [editDerivativeLiabilities, setEditDerivativeLiabilities] = useState('');
  const [editOtherNonCurrentLiabilities, setEditOtherNonCurrentLiabilities] = useState('');
  const [editTotalNonCurrentLiabilities, setEditTotalNonCurrentLiabilities] = useState('');
  // Settings state — Total Liabilities
  const [editTotalLiabilities, setEditTotalLiabilities] = useState('');
  // Settings state — Shareholders Equity
  const [editCommonStock, setEditCommonStock] = useState('');
  const [editRetainedEarnings, setEditRetainedEarnings] = useState('');
  const [editOtherEquity, setEditOtherEquity] = useState('');
  const [editTotalEquity, setEditTotalEquity] = useState('');
  const [editAdditionalPaidIn, setEditAdditionalPaidIn] = useState('');
  const [editTreasuryStock, setEditTreasuryStock] = useState('');
  const [editMinorityInterest, setEditMinorityInterest] = useState('');
  // Settings state — Actions
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Initialize edit form when item loads
  useEffect(() => {
    if (item) {
      // Time Dimensions
      setEditYear(item.year.toString());
      setEditScenario(item.scenario);
      setEditQuarter(item.quarter);
      setEditSemester(item.semester);
      setEditMonth(item.month || '');
      setEditFullYear(item.full_year);
      setEditDate(item.date || '');
      // Current Assets
      setEditCash(item.cash?.toString() || '');
      setEditCashEquivalents(item.cash_equivalents?.toString() || '');
      setEditCashAndCashEquivalents(item.cash_and_cash_equivalents?.toString() || '');
      setEditOtherSTInvestments(item.other_short_term_investments?.toString() || '');
      setEditAccountsReceivable(item.accounts_receivable?.toString() || '');
      setEditOtherReceivables(item.other_receivables?.toString() || '');
      setEditInventory(item.inventory?.toString() || '');
      setEditPrepaidAssets(item.prepaid_assets?.toString() || '');
      setEditRestrictedCash(item.restricted_cash?.toString() || '');
      setEditAssetsHeldForSale(item.assets_held_for_sale?.toString() || '');
      setEditHedgingAssets(item.hedging_assets?.toString() || '');
      setEditOtherCurrentAssets(item.other_current_assets?.toString() || '');
      setEditTotalCurrentAssets(item.total_current_assets?.toString() || '');
      // Non-current Assets
      setEditProperties(item.properties?.toString() || '');
      setEditLandAndImprovements(item.land_and_improvements?.toString() || '');
      setEditMachineryFurnitureEquipment(item.machinery_furniture_equipment?.toString() || '');
      setEditConstructionInProgress(item.construction_in_progress?.toString() || '');
      setEditLeases(item.leases?.toString() || '');
      setEditAccumulatedDepreciation(item.accumulated_depreciation?.toString() || '');
      setEditGoodwill(item.goodwill?.toString() || '');
      setEditInvestmentProperties(item.investment_properties?.toString() || '');
      setEditFinancialAssets(item.financial_assets?.toString() || '');
      setEditIntangibleAssets(item.intangible_assets?.toString() || '');
      setEditInvestmentsAndAdvances(item.investments_and_advances?.toString() || '');
      setEditOtherNonCurrentAssets(item.other_non_current_assets?.toString() || '');
      setEditTotalNonCurrentAssets(item.total_non_current_assets?.toString() || '');
      // Total Assets
      setEditTotalAssets(item.total_assets?.toString() || '');
      // Current Liabilities
      setEditAccountsPayable(item.accounts_payable?.toString() || '');
      setEditAccruedExpenses(item.accrued_expenses?.toString() || '');
      setEditShortTermDebt(item.short_term_debt?.toString() || '');
      setEditDeferredRevenue(item.deferred_revenue?.toString() || '');
      setEditTaxPayable(item.tax_payable?.toString() || '');
      setEditPensions(item.pensions?.toString() || '');
      setEditOtherCurrentLiabilities(item.other_current_liabilities?.toString() || '');
      setEditTotalCurrentLiabilities(item.total_current_liabilities?.toString() || '');
      // Non-current Liabilities
      setEditLongTermProvisions(item.long_term_provisions?.toString() || '');
      setEditLongTermDebt(item.long_term_debt?.toString() || '');
      setEditProvisionForRisks(item.provision_for_risks_and_charges?.toString() || '');
      setEditDeferredLiabilities(item.deferred_liabilities?.toString() || '');
      setEditDerivativeLiabilities(item.derivative_product_liabilities?.toString() || '');
      setEditOtherNonCurrentLiabilities(item.other_non_current_liabilities?.toString() || '');
      setEditTotalNonCurrentLiabilities(item.total_non_current_liabilities?.toString() || '');
      // Total Liabilities
      setEditTotalLiabilities(item.total_liabilities?.toString() || '');
      // Shareholders Equity
      setEditCommonStock(item.common_stock?.toString() || '');
      setEditRetainedEarnings(item.retained_earnings?.toString() || '');
      setEditOtherEquity(item.other_shareholders_equity?.toString() || '');
      setEditTotalEquity(item.total_shareholders_equity?.toString() || '');
      setEditAdditionalPaidIn(item.additional_paid_in_capital?.toString() || '');
      setEditTreasuryStock(item.treasury_stock?.toString() || '');
      setEditMinorityInterest(item.minority_interest?.toString() || '');
    }
  }, [item]);

  useEffect(() => {
    if (id && !item) fetchBalanceSheet(id);
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
        <AlertDescription>Balance Sheet not found</AlertDescription>
      </Alert>
    );
  }

  const deleteConfirmTarget = `${item.year}`;

  // Helper to format nullable numbers for display
  const fmtNum = (val: number | null): string =>
    val != null ? `$${val.toLocaleString()}` : '—';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/balance-sheets">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Balance Sheets
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Scale className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {entityName} — Balance Sheet
            </h1>
            <p className="text-sm text-muted-foreground">
              {item.year} · {getScenarioLabel(item.scenario)}
              {item.quarter && ` · ${item.quarter}`}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <Scale className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        {/* ========== DETAILS TAB ========== */}
        <TabsContent value="details" className="space-y-4">
          {/* Time Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle>Time Dimensions</CardTitle>
              <CardDescription>Reporting period details</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="text-lg font-medium">{item.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scenario</p>
                <p className="text-lg font-medium">{getScenarioLabel(item.scenario)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quarter</p>
                <p className="text-lg font-medium">{item.quarter || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semester</p>
                <p className="text-lg font-medium">{item.semester || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Month</p>
                <p className="text-lg font-medium">{item.month || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Full Year</p>
                <p className="text-lg font-medium">{item.full_year ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reporting Date</p>
                <p className="text-lg font-medium">
                  {item.date ? new Date(item.date).toLocaleDateString() : '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Current Assets</CardTitle>
              <CardDescription>Short-term assets expected to be converted to cash within one year</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cash</p>
                <p className="text-lg font-medium">{fmtNum(item.cash)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash Equivalents</p>
                <p className="text-lg font-medium">{fmtNum(item.cash_equivalents)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash & Cash Equivalents</p>
                <p className="text-lg font-medium">{fmtNum(item.cash_and_cash_equivalents)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other ST Investments</p>
                <p className="text-lg font-medium">{fmtNum(item.other_short_term_investments)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accounts Receivable</p>
                <p className="text-lg font-medium">{fmtNum(item.accounts_receivable)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other Receivables</p>
                <p className="text-lg font-medium">{fmtNum(item.other_receivables)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inventory</p>
                <p className="text-lg font-medium">{fmtNum(item.inventory)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prepaid Assets</p>
                <p className="text-lg font-medium">{fmtNum(item.prepaid_assets)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Restricted Cash</p>
                <p className="text-lg font-medium">{fmtNum(item.restricted_cash)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assets Held for Sale</p>
                <p className="text-lg font-medium">{fmtNum(item.assets_held_for_sale)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hedging Assets</p>
                <p className="text-lg font-medium">{fmtNum(item.hedging_assets)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other Current Assets</p>
                <p className="text-lg font-medium">{fmtNum(item.other_current_assets)}</p>
              </div>
              <div className="col-span-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Total Current Assets</p>
                <p className="text-xl font-semibold">{fmtNum(item.total_current_assets)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Non-current Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Non-current Assets</CardTitle>
              <CardDescription>Long-term assets not expected to be converted to cash within one year</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Properties</p>
                <p className="text-lg font-medium">{fmtNum(item.properties)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Land & Improvements</p>
                <p className="text-lg font-medium">{fmtNum(item.land_and_improvements)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Machinery/Furniture/Equip.</p>
                <p className="text-lg font-medium">{fmtNum(item.machinery_furniture_equipment)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Construction in Progress</p>
                <p className="text-lg font-medium">{fmtNum(item.construction_in_progress)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leases</p>
                <p className="text-lg font-medium">{fmtNum(item.leases)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accum. Depreciation</p>
                <p className="text-lg font-medium">{fmtNum(item.accumulated_depreciation)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Goodwill</p>
                <p className="text-lg font-medium">{fmtNum(item.goodwill)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investment Properties</p>
                <p className="text-lg font-medium">{fmtNum(item.investment_properties)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Financial Assets</p>
                <p className="text-lg font-medium">{fmtNum(item.financial_assets)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Intangible Assets</p>
                <p className="text-lg font-medium">{fmtNum(item.intangible_assets)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investments & Advances</p>
                <p className="text-lg font-medium">{fmtNum(item.investments_and_advances)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other Non-current Assets</p>
                <p className="text-lg font-medium">{fmtNum(item.other_non_current_assets)}</p>
              </div>
              <div className="col-span-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Total Non-current Assets</p>
                <p className="text-xl font-semibold">{fmtNum(item.total_non_current_assets)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Total Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total Assets</p>
              <p className="text-2xl font-bold">{fmtNum(item.total_assets)}</p>
            </CardContent>
          </Card>

          {/* Current Liabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Current Liabilities</CardTitle>
              <CardDescription>Short-term obligations due within one year</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Accounts Payable</p>
                <p className="text-lg font-medium">{fmtNum(item.accounts_payable)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accrued Expenses</p>
                <p className="text-lg font-medium">{fmtNum(item.accrued_expenses)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Short-term Debt</p>
                <p className="text-lg font-medium">{fmtNum(item.short_term_debt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deferred Revenue</p>
                <p className="text-lg font-medium">{fmtNum(item.deferred_revenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tax Payable</p>
                <p className="text-lg font-medium">{fmtNum(item.tax_payable)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pensions</p>
                <p className="text-lg font-medium">{fmtNum(item.pensions)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other Current Liabilities</p>
                <p className="text-lg font-medium">{fmtNum(item.other_current_liabilities)}</p>
              </div>
              <div className="col-span-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Total Current Liabilities</p>
                <p className="text-xl font-semibold">{fmtNum(item.total_current_liabilities)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Non-current Liabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Non-current Liabilities</CardTitle>
              <CardDescription>Long-term obligations due beyond one year</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Long-term Provisions</p>
                <p className="text-lg font-medium">{fmtNum(item.long_term_provisions)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Long-term Debt</p>
                <p className="text-lg font-medium">{fmtNum(item.long_term_debt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Provision for Risks</p>
                <p className="text-lg font-medium">{fmtNum(item.provision_for_risks_and_charges)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deferred Liabilities</p>
                <p className="text-lg font-medium">{fmtNum(item.deferred_liabilities)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Derivative Liabilities</p>
                <p className="text-lg font-medium">{fmtNum(item.derivative_product_liabilities)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other Non-current Liab.</p>
                <p className="text-lg font-medium">{fmtNum(item.other_non_current_liabilities)}</p>
              </div>
              <div className="col-span-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Total Non-current Liabilities</p>
                <p className="text-xl font-semibold">{fmtNum(item.total_non_current_liabilities)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Liabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Total Liabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total Liabilities</p>
              <p className="text-2xl font-bold">{fmtNum(item.total_liabilities)}</p>
            </CardContent>
          </Card>

          {/* Shareholders Equity */}
          <Card>
            <CardHeader>
              <CardTitle>Shareholders Equity</CardTitle>
              <CardDescription>Net worth of the entity</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Common Stock</p>
                <p className="text-lg font-medium">{fmtNum(item.common_stock)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Retained Earnings</p>
                <p className="text-lg font-medium">{fmtNum(item.retained_earnings)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other Equity</p>
                <p className="text-lg font-medium">{fmtNum(item.other_shareholders_equity)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Additional Paid-in Capital</p>
                <p className="text-lg font-medium">{fmtNum(item.additional_paid_in_capital)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Treasury Stock</p>
                <p className="text-lg font-medium">{fmtNum(item.treasury_stock)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Minority Interest</p>
                <p className="text-lg font-medium">{fmtNum(item.minority_interest)}</p>
              </div>
              <div className="col-span-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Total Shareholders Equity</p>
                <p className="text-xl font-semibold">{fmtNum(item.total_shareholders_equity)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
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

        {/* ========== EDIT TAB ========== */}
        <TabsContent value="edit" className="space-y-4">
          {/* Time Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle>Time Dimensions</CardTitle>
              <CardDescription>Update reporting period fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-year">Year *</Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-scenario">Scenario</Label>
                  <Select
                    value={editScenario}
                    onValueChange={(value) => setEditScenario(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENARIO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quarter">Quarter</Label>
                  <Select
                    value={editQuarter || 'none'}
                    onValueChange={(value) => setEditQuarter(value === 'none' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {QUARTER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-semester">Semester</Label>
                  <Select
                    value={editSemester || 'none'}
                    onValueChange={(value) => setEditSemester(value === 'none' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {SEMESTER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-month">Month</Label>
                  <Select
                    value={editMonth || 'none'}
                    onValueChange={(value) => setEditMonth(value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {MONTH_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="edit-full-year"
                  checked={editFullYear}
                  onCheckedChange={(checked) => setEditFullYear(checked === true)}
                />
                <Label htmlFor="edit-full-year">Full Year</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Reporting Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Current Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Current Assets</CardTitle>
              <CardDescription>Update current asset figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-cash">Cash</Label>
                  <Input id="edit-cash" type="number" step="0.01" value={editCash} onChange={(e) => setEditCash(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cash-equivalents">Cash Equivalents</Label>
                  <Input id="edit-cash-equivalents" type="number" step="0.01" value={editCashEquivalents} onChange={(e) => setEditCashEquivalents(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cash-and-cash-equivalents">Cash & Cash Equiv.</Label>
                  <Input id="edit-cash-and-cash-equivalents" type="number" step="0.01" value={editCashAndCashEquivalents} onChange={(e) => setEditCashAndCashEquivalents(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-other-st-investments">Other ST Investments</Label>
                  <Input id="edit-other-st-investments" type="number" step="0.01" value={editOtherSTInvestments} onChange={(e) => setEditOtherSTInvestments(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-accounts-receivable">Accounts Receivable</Label>
                  <Input id="edit-accounts-receivable" type="number" step="0.01" value={editAccountsReceivable} onChange={(e) => setEditAccountsReceivable(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-other-receivables">Other Receivables</Label>
                  <Input id="edit-other-receivables" type="number" step="0.01" value={editOtherReceivables} onChange={(e) => setEditOtherReceivables(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-inventory">Inventory</Label>
                  <Input id="edit-inventory" type="number" step="0.01" value={editInventory} onChange={(e) => setEditInventory(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-prepaid-assets">Prepaid Assets</Label>
                  <Input id="edit-prepaid-assets" type="number" step="0.01" value={editPrepaidAssets} onChange={(e) => setEditPrepaidAssets(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-restricted-cash">Restricted Cash</Label>
                  <Input id="edit-restricted-cash" type="number" step="0.01" value={editRestrictedCash} onChange={(e) => setEditRestrictedCash(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-assets-held-for-sale">Assets Held for Sale</Label>
                  <Input id="edit-assets-held-for-sale" type="number" step="0.01" value={editAssetsHeldForSale} onChange={(e) => setEditAssetsHeldForSale(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-hedging-assets">Hedging Assets</Label>
                  <Input id="edit-hedging-assets" type="number" step="0.01" value={editHedgingAssets} onChange={(e) => setEditHedgingAssets(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-other-current-assets">Other Current Assets</Label>
                  <Input id="edit-other-current-assets" type="number" step="0.01" value={editOtherCurrentAssets} onChange={(e) => setEditOtherCurrentAssets(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-total-current-assets">Total Current Assets</Label>
                <Input id="edit-total-current-assets" type="number" step="0.01" value={editTotalCurrentAssets} onChange={(e) => setEditTotalCurrentAssets(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Non-current Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Non-current Assets</CardTitle>
              <CardDescription>Update non-current asset figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-properties">Properties</Label>
                  <Input id="edit-properties" type="number" step="0.01" value={editProperties} onChange={(e) => setEditProperties(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-land">Land & Improvements</Label>
                  <Input id="edit-land" type="number" step="0.01" value={editLandAndImprovements} onChange={(e) => setEditLandAndImprovements(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-machinery">Machinery/Furniture/Equip.</Label>
                  <Input id="edit-machinery" type="number" step="0.01" value={editMachineryFurnitureEquipment} onChange={(e) => setEditMachineryFurnitureEquipment(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-construction">Construction in Progress</Label>
                  <Input id="edit-construction" type="number" step="0.01" value={editConstructionInProgress} onChange={(e) => setEditConstructionInProgress(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-leases">Leases</Label>
                  <Input id="edit-leases" type="number" step="0.01" value={editLeases} onChange={(e) => setEditLeases(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-depreciation">Accum. Depreciation</Label>
                  <Input id="edit-depreciation" type="number" step="0.01" value={editAccumulatedDepreciation} onChange={(e) => setEditAccumulatedDepreciation(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-goodwill">Goodwill</Label>
                  <Input id="edit-goodwill" type="number" step="0.01" value={editGoodwill} onChange={(e) => setEditGoodwill(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-investment-properties">Investment Properties</Label>
                  <Input id="edit-investment-properties" type="number" step="0.01" value={editInvestmentProperties} onChange={(e) => setEditInvestmentProperties(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-financial-assets">Financial Assets</Label>
                  <Input id="edit-financial-assets" type="number" step="0.01" value={editFinancialAssets} onChange={(e) => setEditFinancialAssets(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-intangible-assets">Intangible Assets</Label>
                  <Input id="edit-intangible-assets" type="number" step="0.01" value={editIntangibleAssets} onChange={(e) => setEditIntangibleAssets(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-investments-advances">Investments & Advances</Label>
                  <Input id="edit-investments-advances" type="number" step="0.01" value={editInvestmentsAndAdvances} onChange={(e) => setEditInvestmentsAndAdvances(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-other-nca">Other Non-current Assets</Label>
                  <Input id="edit-other-nca" type="number" step="0.01" value={editOtherNonCurrentAssets} onChange={(e) => setEditOtherNonCurrentAssets(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-total-nca">Total Non-current Assets</Label>
                <Input id="edit-total-nca" type="number" step="0.01" value={editTotalNonCurrentAssets} onChange={(e) => setEditTotalNonCurrentAssets(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Total Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Total Assets</CardTitle>
              <CardDescription>Update total assets figure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="edit-total-assets">Total Assets</Label>
                <Input id="edit-total-assets" type="number" step="0.01" value={editTotalAssets} onChange={(e) => setEditTotalAssets(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Current Liabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Current Liabilities</CardTitle>
              <CardDescription>Update current liability figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-accounts-payable">Accounts Payable</Label>
                  <Input id="edit-accounts-payable" type="number" step="0.01" value={editAccountsPayable} onChange={(e) => setEditAccountsPayable(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-accrued-expenses">Accrued Expenses</Label>
                  <Input id="edit-accrued-expenses" type="number" step="0.01" value={editAccruedExpenses} onChange={(e) => setEditAccruedExpenses(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-short-term-debt">Short-term Debt</Label>
                  <Input id="edit-short-term-debt" type="number" step="0.01" value={editShortTermDebt} onChange={(e) => setEditShortTermDebt(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-deferred-revenue">Deferred Revenue</Label>
                  <Input id="edit-deferred-revenue" type="number" step="0.01" value={editDeferredRevenue} onChange={(e) => setEditDeferredRevenue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tax-payable">Tax Payable</Label>
                  <Input id="edit-tax-payable" type="number" step="0.01" value={editTaxPayable} onChange={(e) => setEditTaxPayable(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-pensions">Pensions</Label>
                  <Input id="edit-pensions" type="number" step="0.01" value={editPensions} onChange={(e) => setEditPensions(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-other-cl">Other Current Liabilities</Label>
                  <Input id="edit-other-cl" type="number" step="0.01" value={editOtherCurrentLiabilities} onChange={(e) => setEditOtherCurrentLiabilities(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-total-cl">Total Current Liabilities</Label>
                  <Input id="edit-total-cl" type="number" step="0.01" value={editTotalCurrentLiabilities} onChange={(e) => setEditTotalCurrentLiabilities(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Non-current Liabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Non-current Liabilities</CardTitle>
              <CardDescription>Update non-current liability figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-lt-provisions">Long-term Provisions</Label>
                  <Input id="edit-lt-provisions" type="number" step="0.01" value={editLongTermProvisions} onChange={(e) => setEditLongTermProvisions(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lt-debt">Long-term Debt</Label>
                  <Input id="edit-lt-debt" type="number" step="0.01" value={editLongTermDebt} onChange={(e) => setEditLongTermDebt(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-provision-risks">Provision for Risks</Label>
                  <Input id="edit-provision-risks" type="number" step="0.01" value={editProvisionForRisks} onChange={(e) => setEditProvisionForRisks(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-deferred-liabilities">Deferred Liabilities</Label>
                  <Input id="edit-deferred-liabilities" type="number" step="0.01" value={editDeferredLiabilities} onChange={(e) => setEditDeferredLiabilities(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-derivative-liabilities">Derivative Liabilities</Label>
                  <Input id="edit-derivative-liabilities" type="number" step="0.01" value={editDerivativeLiabilities} onChange={(e) => setEditDerivativeLiabilities(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-other-ncl">Other Non-current Liab.</Label>
                  <Input id="edit-other-ncl" type="number" step="0.01" value={editOtherNonCurrentLiabilities} onChange={(e) => setEditOtherNonCurrentLiabilities(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-total-ncl">Total Non-current Liabilities</Label>
                <Input id="edit-total-ncl" type="number" step="0.01" value={editTotalNonCurrentLiabilities} onChange={(e) => setEditTotalNonCurrentLiabilities(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Total Liabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Total Liabilities</CardTitle>
              <CardDescription>Update total liabilities figure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="edit-total-liabilities">Total Liabilities</Label>
                <Input id="edit-total-liabilities" type="number" step="0.01" value={editTotalLiabilities} onChange={(e) => setEditTotalLiabilities(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Shareholders Equity */}
          <Card>
            <CardHeader>
              <CardTitle>Shareholders Equity</CardTitle>
              <CardDescription>Update equity figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-common-stock">Common Stock</Label>
                  <Input id="edit-common-stock" type="number" step="0.01" value={editCommonStock} onChange={(e) => setEditCommonStock(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-retained-earnings">Retained Earnings</Label>
                  <Input id="edit-retained-earnings" type="number" step="0.01" value={editRetainedEarnings} onChange={(e) => setEditRetainedEarnings(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-other-equity">Other Equity</Label>
                  <Input id="edit-other-equity" type="number" step="0.01" value={editOtherEquity} onChange={(e) => setEditOtherEquity(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-additional-paid-in">Additional Paid-in Capital</Label>
                  <Input id="edit-additional-paid-in" type="number" step="0.01" value={editAdditionalPaidIn} onChange={(e) => setEditAdditionalPaidIn(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-treasury-stock">Treasury Stock</Label>
                  <Input id="edit-treasury-stock" type="number" step="0.01" value={editTreasuryStock} onChange={(e) => setEditTreasuryStock(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-minority-interest">Minority Interest</Label>
                  <Input id="edit-minority-interest" type="number" step="0.01" value={editMinorityInterest} onChange={(e) => setEditMinorityInterest(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-total-equity">Total Shareholders Equity</Label>
                <Input id="edit-total-equity" type="number" step="0.01" value={editTotalEquity} onChange={(e) => setEditTotalEquity(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={async () => {
              setIsUpdating(true);
              try {
                await updateBalanceSheet(id, {
                  // Time Dimensions
                  year: editYear ? parseInt(editYear, 10) : undefined,
                  scenario: editScenario || undefined,
                  quarter: editQuarter,
                  semester: editSemester,
                  month: editMonth || null,
                  full_year: editFullYear,
                  date: editDate || null,
                  // Current Assets
                  cash: optNum(editCash),
                  cash_equivalents: optNum(editCashEquivalents),
                  cash_and_cash_equivalents: optNum(editCashAndCashEquivalents),
                  other_short_term_investments: optNum(editOtherSTInvestments),
                  accounts_receivable: optNum(editAccountsReceivable),
                  other_receivables: optNum(editOtherReceivables),
                  inventory: optNum(editInventory),
                  prepaid_assets: optNum(editPrepaidAssets),
                  restricted_cash: optNum(editRestrictedCash),
                  assets_held_for_sale: optNum(editAssetsHeldForSale),
                  hedging_assets: optNum(editHedgingAssets),
                  other_current_assets: optNum(editOtherCurrentAssets),
                  total_current_assets: optNum(editTotalCurrentAssets),
                  // Non-current Assets
                  properties: optNum(editProperties),
                  land_and_improvements: optNum(editLandAndImprovements),
                  machinery_furniture_equipment: optNum(editMachineryFurnitureEquipment),
                  construction_in_progress: optNum(editConstructionInProgress),
                  leases: optNum(editLeases),
                  accumulated_depreciation: optNum(editAccumulatedDepreciation),
                  goodwill: optNum(editGoodwill),
                  investment_properties: optNum(editInvestmentProperties),
                  financial_assets: optNum(editFinancialAssets),
                  intangible_assets: optNum(editIntangibleAssets),
                  investments_and_advances: optNum(editInvestmentsAndAdvances),
                  other_non_current_assets: optNum(editOtherNonCurrentAssets),
                  total_non_current_assets: optNum(editTotalNonCurrentAssets),
                  // Total Assets
                  total_assets: optNum(editTotalAssets),
                  // Current Liabilities
                  accounts_payable: optNum(editAccountsPayable),
                  accrued_expenses: optNum(editAccruedExpenses),
                  short_term_debt: optNum(editShortTermDebt),
                  deferred_revenue: optNum(editDeferredRevenue),
                  tax_payable: optNum(editTaxPayable),
                  pensions: optNum(editPensions),
                  other_current_liabilities: optNum(editOtherCurrentLiabilities),
                  total_current_liabilities: optNum(editTotalCurrentLiabilities),
                  // Non-current Liabilities
                  long_term_provisions: optNum(editLongTermProvisions),
                  long_term_debt: optNum(editLongTermDebt),
                  provision_for_risks_and_charges: optNum(editProvisionForRisks),
                  deferred_liabilities: optNum(editDeferredLiabilities),
                  derivative_product_liabilities: optNum(editDerivativeLiabilities),
                  other_non_current_liabilities: optNum(editOtherNonCurrentLiabilities),
                  total_non_current_liabilities: optNum(editTotalNonCurrentLiabilities),
                  // Total Liabilities
                  total_liabilities: optNum(editTotalLiabilities),
                  // Shareholders Equity
                  common_stock: optNum(editCommonStock),
                  retained_earnings: optNum(editRetainedEarnings),
                  other_shareholders_equity: optNum(editOtherEquity),
                  total_shareholders_equity: optNum(editTotalEquity),
                  additional_paid_in_capital: optNum(editAdditionalPaidIn),
                  treasury_stock: optNum(editTreasuryStock),
                  minority_interest: optNum(editMinorityInterest),
                });
                // Refresh list data after update to keep store in sync
                await fetchBalanceSheets();
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
                  <h4 className="font-medium">Delete this balance sheet</h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this balance sheet record cannot be recovered.
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
                    placeholder="Year"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmText !== deleteConfirmTarget) return;
                    setIsDeleting(true);
                    try {
                      await deleteBalanceSheet(id);
                      router.push('/balance-sheets');
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
                      Delete Balance Sheet
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
