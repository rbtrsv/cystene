'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Banknote, Loader2, Pencil, Trash2 } from 'lucide-react';

import { useCashFlowStatements } from '@/modules/assetmanager/hooks/financial/use-cash-flow-statements';
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

export default function CashFlowStatementDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseInt(params.id as string, 10);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const {
    cashFlowStatements,
    isLoading,
    error,
    fetchCashFlowStatement,
    updateCashFlowStatement,
    deleteCashFlowStatement,
    fetchCashFlowStatements,
  } = useCashFlowStatements();

  const { getEntityById } = useEntities();

  const item = cashFlowStatements.find((row) => row.id === id);

  // Resolve entity name from item's entity_id
  const entityName = item ? (getEntityById(item.entity_id)?.name || `Entity #${item.entity_id}`) : '';

  // Settings state — Time Dimensions
  const [editYear, setEditYear] = useState('');
  const [editScenario, setEditScenario] = useState('');
  const [editQuarter, setEditQuarter] = useState<string | null>(null);
  const [editSemester, setEditSemester] = useState<string | null>(null);
  const [editMonth, setEditMonth] = useState('');
  const [editFullYear, setEditFullYear] = useState(false);
  const [editPeriodStart, setEditPeriodStart] = useState('');
  const [editPeriodEnd, setEditPeriodEnd] = useState('');
  // Settings state — Operating Activities
  const [editNetIncome, setEditNetIncome] = useState('');
  const [editDepreciation, setEditDepreciation] = useState('');
  const [editDeferredTaxes, setEditDeferredTaxes] = useState('');
  const [editStockBasedComp, setEditStockBasedComp] = useState('');
  const [editOtherNonCash, setEditOtherNonCash] = useState('');
  const [editAccountsReceivable, setEditAccountsReceivable] = useState('');
  const [editAccountsPayable, setEditAccountsPayable] = useState('');
  const [editOtherAssetsLiabilities, setEditOtherAssetsLiabilities] = useState('');
  const [editOperatingCF, setEditOperatingCF] = useState('');
  // Settings state — Investing Activities
  const [editCapEx, setEditCapEx] = useState('');
  const [editNetIntangibles, setEditNetIntangibles] = useState('');
  const [editNetAcquisitions, setEditNetAcquisitions] = useState('');
  const [editPurchaseInvestments, setEditPurchaseInvestments] = useState('');
  const [editSaleInvestments, setEditSaleInvestments] = useState('');
  const [editOtherInvesting, setEditOtherInvesting] = useState('');
  const [editInvestingCF, setEditInvestingCF] = useState('');
  // Settings state — Financing Activities
  const [editLTDebtIssuance, setEditLTDebtIssuance] = useState('');
  const [editLTDebtPayments, setEditLTDebtPayments] = useState('');
  const [editSTDebtIssuance, setEditSTDebtIssuance] = useState('');
  const [editStockIssuance, setEditStockIssuance] = useState('');
  const [editStockRepurchase, setEditStockRepurchase] = useState('');
  const [editCommonDividends, setEditCommonDividends] = useState('');
  const [editOtherFinancing, setEditOtherFinancing] = useState('');
  const [editFinancingCF, setEditFinancingCF] = useState('');
  // Settings state — Summary
  const [editEndCashPosition, setEditEndCashPosition] = useState('');
  const [editIncomeTaxPaid, setEditIncomeTaxPaid] = useState('');
  const [editInterestPaid, setEditInterestPaid] = useState('');
  const [editFreeCashFlow, setEditFreeCashFlow] = useState('');
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
      setEditPeriodStart(item.period_start || '');
      setEditPeriodEnd(item.period_end || '');
      // Operating Activities
      setEditNetIncome(item.net_income?.toString() || '');
      setEditDepreciation(item.depreciation?.toString() || '');
      setEditDeferredTaxes(item.deferred_taxes?.toString() || '');
      setEditStockBasedComp(item.stock_based_compensation?.toString() || '');
      setEditOtherNonCash(item.other_non_cash_items?.toString() || '');
      setEditAccountsReceivable(item.accounts_receivable?.toString() || '');
      setEditAccountsPayable(item.accounts_payable?.toString() || '');
      setEditOtherAssetsLiabilities(item.other_assets_liabilities?.toString() || '');
      setEditOperatingCF(item.operating_cash_flow?.toString() || '');
      // Investing Activities
      setEditCapEx(item.capital_expenditures?.toString() || '');
      setEditNetIntangibles(item.net_intangibles?.toString() || '');
      setEditNetAcquisitions(item.net_acquisitions?.toString() || '');
      setEditPurchaseInvestments(item.purchase_of_investments?.toString() || '');
      setEditSaleInvestments(item.sale_of_investments?.toString() || '');
      setEditOtherInvesting(item.other_investing_activity?.toString() || '');
      setEditInvestingCF(item.investing_cash_flow?.toString() || '');
      // Financing Activities
      setEditLTDebtIssuance(item.long_term_debt_issuance?.toString() || '');
      setEditLTDebtPayments(item.long_term_debt_payments?.toString() || '');
      setEditSTDebtIssuance(item.short_term_debt_issuance?.toString() || '');
      setEditStockIssuance(item.common_stock_issuance?.toString() || '');
      setEditStockRepurchase(item.common_stock_repurchase?.toString() || '');
      setEditCommonDividends(item.common_dividends?.toString() || '');
      setEditOtherFinancing(item.other_financing_charges?.toString() || '');
      setEditFinancingCF(item.financing_cash_flow?.toString() || '');
      // Summary
      setEditEndCashPosition(item.end_cash_position?.toString() || '');
      setEditIncomeTaxPaid(item.income_tax_paid?.toString() || '');
      setEditInterestPaid(item.interest_paid?.toString() || '');
      setEditFreeCashFlow(item.free_cash_flow?.toString() || '');
    }
  }, [item]);

  useEffect(() => {
    if (id && !item) fetchCashFlowStatement(id);
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
        <AlertDescription>Cash Flow Statement not found</AlertDescription>
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
        <Link href="/cash-flow-statements">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Cash Flow Statements
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Banknote className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {entityName} — Cash Flow Statement
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
            <Banknote className="h-4 w-4" />
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
                <p className="text-sm text-muted-foreground">Period Start</p>
                <p className="text-lg font-medium">
                  {item.period_start ? new Date(item.period_start).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Period End</p>
                <p className="text-lg font-medium">
                  {item.period_end ? new Date(item.period_end).toLocaleDateString() : '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Operating Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Activities</CardTitle>
              <CardDescription>Cash generated from core business operations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className="text-lg font-medium">{fmtNum(item.net_income)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Depreciation</p>
                <p className="text-lg font-medium">{fmtNum(item.depreciation)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deferred Taxes</p>
                <p className="text-lg font-medium">{fmtNum(item.deferred_taxes)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock-based Comp.</p>
                <p className="text-lg font-medium">{fmtNum(item.stock_based_compensation)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other Non-cash Items</p>
                <p className="text-lg font-medium">{fmtNum(item.other_non_cash_items)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accounts Receivable</p>
                <p className="text-lg font-medium">{fmtNum(item.accounts_receivable)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accounts Payable</p>
                <p className="text-lg font-medium">{fmtNum(item.accounts_payable)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other Assets/Liabilities</p>
                <p className="text-lg font-medium">{fmtNum(item.other_assets_liabilities)}</p>
              </div>
              <div className="col-span-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Operating Cash Flow</p>
                <p className="text-xl font-semibold">{fmtNum(item.operating_cash_flow)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Investing Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Investing Activities</CardTitle>
              <CardDescription>Cash used for investments in long-term assets</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Capital Expenditures</p>
                <p className="text-lg font-medium">{fmtNum(item.capital_expenditures)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Intangibles</p>
                <p className="text-lg font-medium">{fmtNum(item.net_intangibles)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Acquisitions</p>
                <p className="text-lg font-medium">{fmtNum(item.net_acquisitions)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchase of Investments</p>
                <p className="text-lg font-medium">{fmtNum(item.purchase_of_investments)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sale of Investments</p>
                <p className="text-lg font-medium">{fmtNum(item.sale_of_investments)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other Investing Activity</p>
                <p className="text-lg font-medium">{fmtNum(item.other_investing_activity)}</p>
              </div>
              <div className="col-span-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Investing Cash Flow</p>
                <p className="text-xl font-semibold">{fmtNum(item.investing_cash_flow)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financing Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Financing Activities</CardTitle>
              <CardDescription>Cash from debt, equity, and dividend transactions</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">LT Debt Issuance</p>
                <p className="text-lg font-medium">{fmtNum(item.long_term_debt_issuance)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">LT Debt Payments</p>
                <p className="text-lg font-medium">{fmtNum(item.long_term_debt_payments)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ST Debt Issuance</p>
                <p className="text-lg font-medium">{fmtNum(item.short_term_debt_issuance)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Issuance</p>
                <p className="text-lg font-medium">{fmtNum(item.common_stock_issuance)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Repurchase</p>
                <p className="text-lg font-medium">{fmtNum(item.common_stock_repurchase)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Common Dividends</p>
                <p className="text-lg font-medium">{fmtNum(item.common_dividends)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other Financing Charges</p>
                <p className="text-lg font-medium">{fmtNum(item.other_financing_charges)}</p>
              </div>
              <div className="col-span-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Financing Cash Flow</p>
                <p className="text-xl font-semibold">{fmtNum(item.financing_cash_flow)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>End cash position and free cash flow</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">End Cash Position</p>
                <p className="text-lg font-medium">{fmtNum(item.end_cash_position)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Income Tax Paid</p>
                <p className="text-lg font-medium">{fmtNum(item.income_tax_paid)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interest Paid</p>
                <p className="text-lg font-medium">{fmtNum(item.interest_paid)}</p>
              </div>
              <div className="col-span-2 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Free Cash Flow</p>
                <p className="text-2xl font-bold">{fmtNum(item.free_cash_flow)}</p>
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
                  <Input id="edit-year" type="number" value={editYear} onChange={(e) => setEditYear(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-scenario">Scenario</Label>
                  <Select value={editScenario} onValueChange={(value) => setEditScenario(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SCENARIO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quarter">Quarter</Label>
                  <Select value={editQuarter || 'none'} onValueChange={(value) => setEditQuarter(value === 'none' ? null : value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {QUARTER_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-semester">Semester</Label>
                  <Select value={editSemester || 'none'} onValueChange={(value) => setEditSemester(value === 'none' ? null : value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {SEMESTER_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-month">Month</Label>
                  <Select value={editMonth || 'none'} onValueChange={(value) => setEditMonth(value === 'none' ? '' : value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {MONTH_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="edit-full-year" checked={editFullYear} onCheckedChange={(checked) => setEditFullYear(checked === true)} />
                <Label htmlFor="edit-full-year">Full Year</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-period-start">Period Start</Label>
                  <Input id="edit-period-start" type="date" value={editPeriodStart} onChange={(e) => setEditPeriodStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-period-end">Period End</Label>
                  <Input id="edit-period-end" type="date" value={editPeriodEnd} onChange={(e) => setEditPeriodEnd(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operating Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Activities</CardTitle>
              <CardDescription>Update operating activity figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-net-income">Net Income</Label>
                  <Input id="edit-net-income" type="number" step="0.01" value={editNetIncome} onChange={(e) => setEditNetIncome(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-depreciation">Depreciation</Label>
                  <Input id="edit-depreciation" type="number" step="0.01" value={editDepreciation} onChange={(e) => setEditDepreciation(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-deferred-taxes">Deferred Taxes</Label>
                  <Input id="edit-deferred-taxes" type="number" step="0.01" value={editDeferredTaxes} onChange={(e) => setEditDeferredTaxes(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-stock-comp">Stock-based Comp.</Label>
                  <Input id="edit-stock-comp" type="number" step="0.01" value={editStockBasedComp} onChange={(e) => setEditStockBasedComp(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-other-noncash">Other Non-cash Items</Label>
                  <Input id="edit-other-noncash" type="number" step="0.01" value={editOtherNonCash} onChange={(e) => setEditOtherNonCash(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ar">Accounts Receivable</Label>
                  <Input id="edit-ar" type="number" step="0.01" value={editAccountsReceivable} onChange={(e) => setEditAccountsReceivable(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-ap">Accounts Payable</Label>
                  <Input id="edit-ap" type="number" step="0.01" value={editAccountsPayable} onChange={(e) => setEditAccountsPayable(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-other-al">Other Assets/Liabilities</Label>
                  <Input id="edit-other-al" type="number" step="0.01" value={editOtherAssetsLiabilities} onChange={(e) => setEditOtherAssetsLiabilities(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-operating-cf">Operating Cash Flow</Label>
                <Input id="edit-operating-cf" type="number" step="0.01" value={editOperatingCF} onChange={(e) => setEditOperatingCF(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Investing Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Investing Activities</CardTitle>
              <CardDescription>Update investing activity figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-capex">Capital Expenditures</Label>
                  <Input id="edit-capex" type="number" step="0.01" value={editCapEx} onChange={(e) => setEditCapEx(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-net-intangibles">Net Intangibles</Label>
                  <Input id="edit-net-intangibles" type="number" step="0.01" value={editNetIntangibles} onChange={(e) => setEditNetIntangibles(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-net-acquisitions">Net Acquisitions</Label>
                  <Input id="edit-net-acquisitions" type="number" step="0.01" value={editNetAcquisitions} onChange={(e) => setEditNetAcquisitions(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-purchase-inv">Purchase of Investments</Label>
                  <Input id="edit-purchase-inv" type="number" step="0.01" value={editPurchaseInvestments} onChange={(e) => setEditPurchaseInvestments(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sale-inv">Sale of Investments</Label>
                  <Input id="edit-sale-inv" type="number" step="0.01" value={editSaleInvestments} onChange={(e) => setEditSaleInvestments(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-other-investing">Other Investing Activity</Label>
                  <Input id="edit-other-investing" type="number" step="0.01" value={editOtherInvesting} onChange={(e) => setEditOtherInvesting(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-investing-cf">Investing Cash Flow</Label>
                <Input id="edit-investing-cf" type="number" step="0.01" value={editInvestingCF} onChange={(e) => setEditInvestingCF(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Financing Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Financing Activities</CardTitle>
              <CardDescription>Update financing activity figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-lt-debt-issuance">LT Debt Issuance</Label>
                  <Input id="edit-lt-debt-issuance" type="number" step="0.01" value={editLTDebtIssuance} onChange={(e) => setEditLTDebtIssuance(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lt-debt-payments">LT Debt Payments</Label>
                  <Input id="edit-lt-debt-payments" type="number" step="0.01" value={editLTDebtPayments} onChange={(e) => setEditLTDebtPayments(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-st-debt-issuance">ST Debt Issuance</Label>
                  <Input id="edit-st-debt-issuance" type="number" step="0.01" value={editSTDebtIssuance} onChange={(e) => setEditSTDebtIssuance(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-stock-issuance">Stock Issuance</Label>
                  <Input id="edit-stock-issuance" type="number" step="0.01" value={editStockIssuance} onChange={(e) => setEditStockIssuance(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stock-repurchase">Stock Repurchase</Label>
                  <Input id="edit-stock-repurchase" type="number" step="0.01" value={editStockRepurchase} onChange={(e) => setEditStockRepurchase(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-common-dividends">Common Dividends</Label>
                  <Input id="edit-common-dividends" type="number" step="0.01" value={editCommonDividends} onChange={(e) => setEditCommonDividends(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-other-financing">Other Financing Charges</Label>
                <Input id="edit-other-financing" type="number" step="0.01" value={editOtherFinancing} onChange={(e) => setEditOtherFinancing(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-financing-cf">Financing Cash Flow</Label>
                <Input id="edit-financing-cf" type="number" step="0.01" value={editFinancingCF} onChange={(e) => setEditFinancingCF(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Update summary figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-end-cash">End Cash Position</Label>
                  <Input id="edit-end-cash" type="number" step="0.01" value={editEndCashPosition} onChange={(e) => setEditEndCashPosition(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-fcf">Free Cash Flow</Label>
                  <Input id="edit-fcf" type="number" step="0.01" value={editFreeCashFlow} onChange={(e) => setEditFreeCashFlow(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tax-paid">Income Tax Paid</Label>
                  <Input id="edit-tax-paid" type="number" step="0.01" value={editIncomeTaxPaid} onChange={(e) => setEditIncomeTaxPaid(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-interest-paid">Interest Paid</Label>
                  <Input id="edit-interest-paid" type="number" step="0.01" value={editInterestPaid} onChange={(e) => setEditInterestPaid(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={async () => {
              setIsUpdating(true);
              try {
                await updateCashFlowStatement(id, {
                  // Time Dimensions
                  year: editYear ? parseInt(editYear, 10) : undefined,
                  scenario: editScenario || undefined,
                  quarter: editQuarter,
                  semester: editSemester,
                  month: editMonth || null,
                  full_year: editFullYear,
                  period_start: editPeriodStart || null,
                  period_end: editPeriodEnd || null,
                  // Operating Activities
                  net_income: optNum(editNetIncome),
                  depreciation: optNum(editDepreciation),
                  deferred_taxes: optNum(editDeferredTaxes),
                  stock_based_compensation: optNum(editStockBasedComp),
                  other_non_cash_items: optNum(editOtherNonCash),
                  accounts_receivable: optNum(editAccountsReceivable),
                  accounts_payable: optNum(editAccountsPayable),
                  other_assets_liabilities: optNum(editOtherAssetsLiabilities),
                  operating_cash_flow: optNum(editOperatingCF),
                  // Investing Activities
                  capital_expenditures: optNum(editCapEx),
                  net_intangibles: optNum(editNetIntangibles),
                  net_acquisitions: optNum(editNetAcquisitions),
                  purchase_of_investments: optNum(editPurchaseInvestments),
                  sale_of_investments: optNum(editSaleInvestments),
                  other_investing_activity: optNum(editOtherInvesting),
                  investing_cash_flow: optNum(editInvestingCF),
                  // Financing Activities
                  long_term_debt_issuance: optNum(editLTDebtIssuance),
                  long_term_debt_payments: optNum(editLTDebtPayments),
                  short_term_debt_issuance: optNum(editSTDebtIssuance),
                  common_stock_issuance: optNum(editStockIssuance),
                  common_stock_repurchase: optNum(editStockRepurchase),
                  common_dividends: optNum(editCommonDividends),
                  other_financing_charges: optNum(editOtherFinancing),
                  financing_cash_flow: optNum(editFinancingCF),
                  // Summary
                  end_cash_position: optNum(editEndCashPosition),
                  income_tax_paid: optNum(editIncomeTaxPaid),
                  interest_paid: optNum(editInterestPaid),
                  free_cash_flow: optNum(editFreeCashFlow),
                });
                // Refresh list data after update to keep store in sync
                await fetchCashFlowStatements();
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
                  <h4 className="font-medium">Delete this cash flow statement</h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this cash flow statement record cannot be recovered.
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
                      await deleteCashFlowStatement(id);
                      router.push('/cash-flow-statements');
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
                      Delete Cash Flow Statement
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
