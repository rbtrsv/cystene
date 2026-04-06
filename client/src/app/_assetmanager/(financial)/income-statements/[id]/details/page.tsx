'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Loader2, Receipt, Pencil, Trash2 } from 'lucide-react';

import { useIncomeStatements } from '@/modules/assetmanager/hooks/financial/use-income-statements';
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

export default function IncomeStatementDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseInt(params.id as string, 10);

  // Support ?tab= URL param so "Edit" from list dropdown lands on Edit tab
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const {
    incomeStatements,
    isLoading,
    error,
    fetchIncomeStatement,
    updateIncomeStatement,
    deleteIncomeStatement,
    fetchIncomeStatements,
  } = useIncomeStatements();

  const { getEntityById } = useEntities();

  const item = incomeStatements.find((row) => row.id === id);

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
  // Settings state — Revenue
  const [editRevenue, setEditRevenue] = useState('');
  const [editCostOfGoods, setEditCostOfGoods] = useState('');
  const [editGrossProfit, setEditGrossProfit] = useState('');
  // Settings state — Operating Expenses
  const [editRnD, setEditRnD] = useState('');
  const [editSGA, setEditSGA] = useState('');
  const [editOtherOpEx, setEditOtherOpEx] = useState('');
  // Settings state — Results
  const [editOperatingIncome, setEditOperatingIncome] = useState('');
  const [editNonOpInterestIncome, setEditNonOpInterestIncome] = useState('');
  const [editNonOpInterestExpense, setEditNonOpInterestExpense] = useState('');
  const [editOtherIncomeExpense, setEditOtherIncomeExpense] = useState('');
  const [editPretaxIncome, setEditPretaxIncome] = useState('');
  const [editIncomeTax, setEditIncomeTax] = useState('');
  const [editNetIncome, setEditNetIncome] = useState('');
  // Settings state — Additional
  const [editEpsBasic, setEditEpsBasic] = useState('');
  const [editEpsDiluted, setEditEpsDiluted] = useState('');
  const [editBasicShares, setEditBasicShares] = useState('');
  const [editDilutedShares, setEditDilutedShares] = useState('');
  const [editEbitda, setEditEbitda] = useState('');
  const [editNetIncomeContinuous, setEditNetIncomeContinuous] = useState('');
  const [editMinorityInterests, setEditMinorityInterests] = useState('');
  const [editPreferredDividends, setEditPreferredDividends] = useState('');
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
      // Revenue
      setEditRevenue(item.revenue?.toString() || '');
      setEditCostOfGoods(item.cost_of_goods?.toString() || '');
      setEditGrossProfit(item.gross_profit?.toString() || '');
      // Operating Expenses
      setEditRnD(item.research_and_development?.toString() || '');
      setEditSGA(item.selling_general_and_administrative?.toString() || '');
      setEditOtherOpEx(item.other_operating_expenses?.toString() || '');
      // Results
      setEditOperatingIncome(item.operating_income?.toString() || '');
      setEditNonOpInterestIncome(item.non_operating_interest_income?.toString() || '');
      setEditNonOpInterestExpense(item.non_operating_interest_expense?.toString() || '');
      setEditOtherIncomeExpense(item.other_income_expense?.toString() || '');
      setEditPretaxIncome(item.pretax_income?.toString() || '');
      setEditIncomeTax(item.income_tax?.toString() || '');
      setEditNetIncome(item.net_income?.toString() || '');
      // Additional
      setEditEpsBasic(item.eps_basic?.toString() || '');
      setEditEpsDiluted(item.eps_diluted?.toString() || '');
      setEditBasicShares(item.basic_shares_outstanding?.toString() || '');
      setEditDilutedShares(item.diluted_shares_outstanding?.toString() || '');
      setEditEbitda(item.ebitda?.toString() || '');
      setEditNetIncomeContinuous(item.net_income_continuous_operations?.toString() || '');
      setEditMinorityInterests(item.minority_interests?.toString() || '');
      setEditPreferredDividends(item.preferred_stock_dividends?.toString() || '');
    }
  }, [item]);

  useEffect(() => {
    if (id && !item) fetchIncomeStatement(id);
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
        <AlertDescription>Income Statement not found</AlertDescription>
      </Alert>
    );
  }

  const deleteConfirmTarget = `${item.year}`;

  // Helper to format nullable numbers for display
  const fmtNum = (val: number | null): string =>
    val != null ? `$${val.toLocaleString()}` : '—';

  const fmtPlain = (val: number | null): string =>
    val != null ? val.toLocaleString() : '—';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/income-statements">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Income Statements
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Receipt className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {entityName} — Income Statement
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
            <Receipt className="h-4 w-4" />
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

          {/* Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Top-line revenue and cost of goods</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-lg font-medium">{fmtNum(item.revenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost of Goods</p>
                <p className="text-lg font-medium">{fmtNum(item.cost_of_goods)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gross Profit</p>
                <p className="text-lg font-medium">{fmtNum(item.gross_profit)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Operating Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Expenses</CardTitle>
              <CardDescription>Research, selling, and other operating costs</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">R&D</p>
                <p className="text-lg font-medium">{fmtNum(item.research_and_development)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SG&A</p>
                <p className="text-lg font-medium">{fmtNum(item.selling_general_and_administrative)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other OpEx</p>
                <p className="text-lg font-medium">{fmtNum(item.other_operating_expenses)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Operating income through net income</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Operating Income</p>
                <p className="text-lg font-medium">{fmtNum(item.operating_income)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Non-Op Interest Income</p>
                <p className="text-lg font-medium">{fmtNum(item.non_operating_interest_income)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Non-Op Interest Expense</p>
                <p className="text-lg font-medium">{fmtNum(item.non_operating_interest_expense)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Other Income/Expense</p>
                <p className="text-lg font-medium">{fmtNum(item.other_income_expense)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pretax Income</p>
                <p className="text-lg font-medium">{fmtNum(item.pretax_income)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Income Tax</p>
                <p className="text-lg font-medium">{fmtNum(item.income_tax)}</p>
              </div>
              <div className="col-span-2 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Net Income</p>
                <p className="text-xl font-semibold">{fmtNum(item.net_income)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Additional */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Metrics</CardTitle>
              <CardDescription>EPS, shares outstanding, EBITDA, and other line items</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">EPS Basic</p>
                <p className="text-lg font-medium">{fmtPlain(item.eps_basic)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">EPS Diluted</p>
                <p className="text-lg font-medium">{fmtPlain(item.eps_diluted)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Basic Shares Outstanding</p>
                <p className="text-lg font-medium">{fmtPlain(item.basic_shares_outstanding)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Diluted Shares Outstanding</p>
                <p className="text-lg font-medium">{fmtPlain(item.diluted_shares_outstanding)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">EBITDA</p>
                <p className="text-lg font-medium">{fmtNum(item.ebitda)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Income (Cont. Ops)</p>
                <p className="text-lg font-medium">{fmtNum(item.net_income_continuous_operations)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Minority Interests</p>
                <p className="text-lg font-medium">{fmtNum(item.minority_interests)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pref. Stock Dividends</p>
                <p className="text-lg font-medium">{fmtNum(item.preferred_stock_dividends)}</p>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-period-start">Period Start</Label>
                  <Input
                    id="edit-period-start"
                    type="date"
                    value={editPeriodStart}
                    onChange={(e) => setEditPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-period-end">Period End</Label>
                  <Input
                    id="edit-period-end"
                    type="date"
                    value={editPeriodEnd}
                    onChange={(e) => setEditPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Update revenue figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-revenue">Revenue</Label>
                  <Input
                    id="edit-revenue"
                    type="number"
                    step="0.01"
                    value={editRevenue}
                    onChange={(e) => setEditRevenue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cost-of-goods">Cost of Goods</Label>
                  <Input
                    id="edit-cost-of-goods"
                    type="number"
                    step="0.01"
                    value={editCostOfGoods}
                    onChange={(e) => setEditCostOfGoods(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gross-profit">Gross Profit</Label>
                  <Input
                    id="edit-gross-profit"
                    type="number"
                    step="0.01"
                    value={editGrossProfit}
                    onChange={(e) => setEditGrossProfit(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operating Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Expenses</CardTitle>
              <CardDescription>Update operating expense figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-rnd">R&D</Label>
                  <Input
                    id="edit-rnd"
                    type="number"
                    step="0.01"
                    value={editRnD}
                    onChange={(e) => setEditRnD(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sga">SG&A</Label>
                  <Input
                    id="edit-sga"
                    type="number"
                    step="0.01"
                    value={editSGA}
                    onChange={(e) => setEditSGA(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-other-opex">Other OpEx</Label>
                  <Input
                    id="edit-other-opex"
                    type="number"
                    step="0.01"
                    value={editOtherOpEx}
                    onChange={(e) => setEditOtherOpEx(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Update income and tax figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-operating-income">Operating Income</Label>
                  <Input
                    id="edit-operating-income"
                    type="number"
                    step="0.01"
                    value={editOperatingIncome}
                    onChange={(e) => setEditOperatingIncome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-non-op-interest-income">Non-Op Interest Income</Label>
                  <Input
                    id="edit-non-op-interest-income"
                    type="number"
                    step="0.01"
                    value={editNonOpInterestIncome}
                    onChange={(e) => setEditNonOpInterestIncome(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-non-op-interest-expense">Non-Op Interest Expense</Label>
                  <Input
                    id="edit-non-op-interest-expense"
                    type="number"
                    step="0.01"
                    value={editNonOpInterestExpense}
                    onChange={(e) => setEditNonOpInterestExpense(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-other-income-expense">Other Income/Expense</Label>
                  <Input
                    id="edit-other-income-expense"
                    type="number"
                    step="0.01"
                    value={editOtherIncomeExpense}
                    onChange={(e) => setEditOtherIncomeExpense(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-pretax-income">Pretax Income</Label>
                  <Input
                    id="edit-pretax-income"
                    type="number"
                    step="0.01"
                    value={editPretaxIncome}
                    onChange={(e) => setEditPretaxIncome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-income-tax">Income Tax</Label>
                  <Input
                    id="edit-income-tax"
                    type="number"
                    step="0.01"
                    value={editIncomeTax}
                    onChange={(e) => setEditIncomeTax(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-net-income">Net Income</Label>
                  <Input
                    id="edit-net-income"
                    type="number"
                    step="0.01"
                    value={editNetIncome}
                    onChange={(e) => setEditNetIncome(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Metrics</CardTitle>
              <CardDescription>Update EPS, shares, EBITDA, and other metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-eps-basic">EPS Basic</Label>
                  <Input
                    id="edit-eps-basic"
                    type="number"
                    step="0.01"
                    value={editEpsBasic}
                    onChange={(e) => setEditEpsBasic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-eps-diluted">EPS Diluted</Label>
                  <Input
                    id="edit-eps-diluted"
                    type="number"
                    step="0.01"
                    value={editEpsDiluted}
                    onChange={(e) => setEditEpsDiluted(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-basic-shares">Basic Shares Outstanding</Label>
                  <Input
                    id="edit-basic-shares"
                    type="number"
                    step="0.01"
                    value={editBasicShares}
                    onChange={(e) => setEditBasicShares(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-diluted-shares">Diluted Shares Outstanding</Label>
                  <Input
                    id="edit-diluted-shares"
                    type="number"
                    step="0.01"
                    value={editDilutedShares}
                    onChange={(e) => setEditDilutedShares(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ebitda">EBITDA</Label>
                <Input
                  id="edit-ebitda"
                  type="number"
                  step="0.01"
                  value={editEbitda}
                  onChange={(e) => setEditEbitda(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-net-income-continuous">Net Income (Cont. Ops)</Label>
                  <Input
                    id="edit-net-income-continuous"
                    type="number"
                    step="0.01"
                    value={editNetIncomeContinuous}
                    onChange={(e) => setEditNetIncomeContinuous(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-minority-interests">Minority Interests</Label>
                  <Input
                    id="edit-minority-interests"
                    type="number"
                    step="0.01"
                    value={editMinorityInterests}
                    onChange={(e) => setEditMinorityInterests(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-preferred-dividends">Pref. Stock Dividends</Label>
                  <Input
                    id="edit-preferred-dividends"
                    type="number"
                    step="0.01"
                    value={editPreferredDividends}
                    onChange={(e) => setEditPreferredDividends(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={async () => {
              setIsUpdating(true);
              try {
                await updateIncomeStatement(id, {
                  // Time Dimensions
                  year: editYear ? parseInt(editYear, 10) : undefined,
                  scenario: editScenario || undefined,
                  quarter: editQuarter,
                  semester: editSemester,
                  month: editMonth || null,
                  full_year: editFullYear,
                  period_start: editPeriodStart || null,
                  period_end: editPeriodEnd || null,
                  // Revenue
                  revenue: optNum(editRevenue),
                  cost_of_goods: optNum(editCostOfGoods),
                  gross_profit: optNum(editGrossProfit),
                  // Operating Expenses
                  research_and_development: optNum(editRnD),
                  selling_general_and_administrative: optNum(editSGA),
                  other_operating_expenses: optNum(editOtherOpEx),
                  // Results
                  operating_income: optNum(editOperatingIncome),
                  non_operating_interest_income: optNum(editNonOpInterestIncome),
                  non_operating_interest_expense: optNum(editNonOpInterestExpense),
                  other_income_expense: optNum(editOtherIncomeExpense),
                  pretax_income: optNum(editPretaxIncome),
                  income_tax: optNum(editIncomeTax),
                  net_income: optNum(editNetIncome),
                  // Additional
                  eps_basic: optNum(editEpsBasic),
                  eps_diluted: optNum(editEpsDiluted),
                  basic_shares_outstanding: optNum(editBasicShares),
                  diluted_shares_outstanding: optNum(editDilutedShares),
                  ebitda: optNum(editEbitda),
                  net_income_continuous_operations: optNum(editNetIncomeContinuous),
                  minority_interests: optNum(editMinorityInterests),
                  preferred_stock_dividends: optNum(editPreferredDividends),
                });
                // Refresh list data after update to keep store in sync
                await fetchIncomeStatements();
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
                  <h4 className="font-medium">Delete this income statement</h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this income statement record cannot be recovered.
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
                      await deleteIncomeStatement(id);
                      router.push('/income-statements');
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
                      Delete Income Statement
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
