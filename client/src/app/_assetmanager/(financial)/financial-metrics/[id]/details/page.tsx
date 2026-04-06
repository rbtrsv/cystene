'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Loader2, TrendingUp, Pencil, Trash2 } from 'lucide-react';

import { useFinancialMetricsList } from '@/modules/assetmanager/hooks/financial/use-financial-metrics';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { SCENARIO_OPTIONS, QUARTER_OPTIONS, SEMESTER_OPTIONS, MONTH_OPTIONS, getScenarioLabel } from '@/modules/assetmanager/schemas/financial/shared-financial.schemas';

export default function FinancialMetricsDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseInt(params.id as string, 10);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const {
    financialMetrics,
    isLoading,
    error,
    fetchFinancialMetrics,
    updateFinancialMetrics,
    deleteFinancialMetrics,
    fetchFinancialMetricsList,
  } = useFinancialMetricsList();

  const { getEntityById } = useEntities();

  const item = financialMetrics.find((row) => row.id === id);

  // Resolve entity name from item's entity_id
  const entityName = item ? (getEntityById(item.entity_id)?.name || `Entity #${item.entity_id}`) : '';

  // ==========================================
  // Settings state — Time Dimensions
  // ==========================================
  const [editYear, setEditYear] = useState('');
  const [editScenario, setEditScenario] = useState('');
  const [editQuarter, setEditQuarter] = useState<string | null>(null);
  const [editSemester, setEditSemester] = useState<string | null>(null);
  const [editMonth, setEditMonth] = useState('');
  const [editFullYear, setEditFullYear] = useState(false);
  const [editPeriodEnd, setEditPeriodEnd] = useState('');

  // ==========================================
  // Settings state — Ratios: Liquidity
  // ==========================================
  const [editCurrentRatio, setEditCurrentRatio] = useState('');
  const [editQuickRatio, setEditQuickRatio] = useState('');
  const [editCashRatio, setEditCashRatio] = useState('');
  const [editOperatingCashFlowRatio, setEditOperatingCashFlowRatio] = useState('');

  // ==========================================
  // Settings state — Ratios: Solvency
  // ==========================================
  const [editDebtToEquityRatio, setEditDebtToEquityRatio] = useState('');
  const [editDebtToAssetsRatio, setEditDebtToAssetsRatio] = useState('');
  const [editInterestCoverageRatio, setEditInterestCoverageRatio] = useState('');
  const [editDebtServiceCoverageRatio, setEditDebtServiceCoverageRatio] = useState('');

  // ==========================================
  // Settings state — Ratios: Profitability
  // ==========================================
  const [editGrossProfitMargin, setEditGrossProfitMargin] = useState('');
  const [editOperatingProfitMargin, setEditOperatingProfitMargin] = useState('');
  const [editNetProfitMargin, setEditNetProfitMargin] = useState('');
  const [editEbitdaMargin, setEditEbitdaMargin] = useState('');
  const [editReturnOnAssets, setEditReturnOnAssets] = useState('');
  const [editReturnOnEquity, setEditReturnOnEquity] = useState('');
  const [editReturnOnInvestedCapital, setEditReturnOnInvestedCapital] = useState('');

  // ==========================================
  // Settings state — Ratios: Efficiency
  // ==========================================
  const [editAssetTurnoverRatio, setEditAssetTurnoverRatio] = useState('');
  const [editInventoryTurnoverRatio, setEditInventoryTurnoverRatio] = useState('');
  const [editReceivablesTurnoverRatio, setEditReceivablesTurnoverRatio] = useState('');
  const [editDaysSalesOutstanding, setEditDaysSalesOutstanding] = useState('');
  const [editDaysInventoryOutstanding, setEditDaysInventoryOutstanding] = useState('');
  const [editDaysPayablesOutstanding, setEditDaysPayablesOutstanding] = useState('');

  // ==========================================
  // Settings state — Ratios: Investment
  // ==========================================
  const [editEarningsPerShare, setEditEarningsPerShare] = useState('');
  const [editPriceEarningsRatio, setEditPriceEarningsRatio] = useState('');
  const [editDividendYield, setEditDividendYield] = useState('');
  const [editDividendPayoutRatio, setEditDividendPayoutRatio] = useState('');
  const [editBookValuePerShare, setEditBookValuePerShare] = useState('');

  // ==========================================
  // Settings state — Revenue Metrics
  // ==========================================
  const [editRecurringRevenue, setEditRecurringRevenue] = useState('');
  const [editNonRecurringRevenue, setEditNonRecurringRevenue] = useState('');
  const [editRevenueGrowthRate, setEditRevenueGrowthRate] = useState('');
  const [editExistCustExistSeatsRev, setEditExistCustExistSeatsRev] = useState('');
  const [editExistCustAddSeatsRev, setEditExistCustAddSeatsRev] = useState('');
  const [editNewCustNewSeatsRev, setEditNewCustNewSeatsRev] = useState('');
  const [editDiscountsAndRefunds, setEditDiscountsAndRefunds] = useState('');
  const [editArr, setEditArr] = useState('');
  const [editMrr, setEditMrr] = useState('');
  const [editAvgRevenuePerCustomer, setEditAvgRevenuePerCustomer] = useState('');
  const [editAvgContractValue, setEditAvgContractValue] = useState('');
  const [editRevenueChurnRate, setEditRevenueChurnRate] = useState('');
  const [editNetRevenueRetention, setEditNetRevenueRetention] = useState('');
  const [editGrossRevenueRetention, setEditGrossRevenueRetention] = useState('');
  const [editGrowthRateCohort1, setEditGrowthRateCohort1] = useState('');
  const [editGrowthRateCohort2, setEditGrowthRateCohort2] = useState('');
  const [editGrowthRateCohort3, setEditGrowthRateCohort3] = useState('');

  // ==========================================
  // Settings state — Customer Metrics
  // ==========================================
  const [editTotalCustomers, setEditTotalCustomers] = useState('');
  const [editNewCustomers, setEditNewCustomers] = useState('');
  const [editChurnedCustomers, setEditChurnedCustomers] = useState('');
  const [editTotalUsers, setEditTotalUsers] = useState('');
  const [editActiveUsers, setEditActiveUsers] = useState('');
  const [editTotalMonthlyActiveClientUsers, setEditTotalMonthlyActiveClientUsers] = useState('');
  const [editExistCustExistSeatsUsers, setEditExistCustExistSeatsUsers] = useState('');
  const [editExistCustAddSeatsUsers, setEditExistCustAddSeatsUsers] = useState('');
  const [editNewCustNewSeatsUsers, setEditNewCustNewSeatsUsers] = useState('');
  const [editUserGrowthRate, setEditUserGrowthRate] = useState('');
  const [editNewCustTotalAddrSeats, setEditNewCustTotalAddrSeats] = useState('');
  const [editNewCustNewSeatsPercentSigned, setEditNewCustNewSeatsPercentSigned] = useState('');
  const [editNewCustTotalAddrSeatsRemaining, setEditNewCustTotalAddrSeatsRemaining] = useState('');
  const [editExistingCustomerCount, setEditExistingCustomerCount] = useState('');
  const [editExistingCustomerExpansionCount, setEditExistingCustomerExpansionCount] = useState('');
  const [editNewCustomerCount, setEditNewCustomerCount] = useState('');
  const [editCustomerGrowthRate, setEditCustomerGrowthRate] = useState('');
  const [editCac, setEditCac] = useState('');
  const [editLtv, setEditLtv] = useState('');
  const [editLtvCacRatio, setEditLtvCacRatio] = useState('');
  const [editPaybackPeriod, setEditPaybackPeriod] = useState('');
  const [editCustomerChurnRate, setEditCustomerChurnRate] = useState('');
  const [editCustomerAcquisitionEfficiency, setEditCustomerAcquisitionEfficiency] = useState('');
  const [editSalesEfficiency, setEditSalesEfficiency] = useState('');

  // ==========================================
  // Settings state — Operational Metrics
  // ==========================================
  const [editBurnRate, setEditBurnRate] = useState('');
  const [editRunwayMonths, setEditRunwayMonths] = useState('');
  const [editRunwayGross, setEditRunwayGross] = useState('');
  const [editRunwayNet, setEditRunwayNet] = useState('');
  const [editBurnMultiple, setEditBurnMultiple] = useState('');
  const [editRuleOf40, setEditRuleOf40] = useState('');
  const [editGrossMargin, setEditGrossMargin] = useState('');
  const [editContributionMargin, setEditContributionMargin] = useState('');
  const [editRevenuePerEmployee, setEditRevenuePerEmployee] = useState('');
  const [editProfitPerEmployee, setEditProfitPerEmployee] = useState('');
  const [editCapitalEfficiency, setEditCapitalEfficiency] = useState('');
  const [editCashConversionCycle, setEditCashConversionCycle] = useState('');
  const [editCapex, setEditCapex] = useState('');
  const [editEbitda, setEditEbitda] = useState('');
  const [editTotalCosts, setEditTotalCosts] = useState('');

  // ==========================================
  // Settings state — Team Metrics
  // ==========================================
  const [editTotalEmployees, setEditTotalEmployees] = useState('');
  const [editFullTimeEmployees, setEditFullTimeEmployees] = useState('');
  const [editPartTimeEmployees, setEditPartTimeEmployees] = useState('');
  const [editContractors, setEditContractors] = useState('');
  const [editManagement, setEditManagement] = useState('');
  const [editSalesMarketingStaff, setEditSalesMarketingStaff] = useState('');
  const [editRdStaff, setEditRdStaff] = useState('');
  const [editCustServiceStaff, setEditCustServiceStaff] = useState('');
  const [editGeneralStaff, setEditGeneralStaff] = useState('');
  const [editEmployeeGrowthRate, setEditEmployeeGrowthRate] = useState('');
  const [editEmployeeTurnoverRate, setEditEmployeeTurnoverRate] = useState('');
  const [editAverageTenureMonths, setEditAverageTenureMonths] = useState('');
  const [editManagementCosts, setEditManagementCosts] = useState('');
  const [editSalesMarketingCosts, setEditSalesMarketingCosts] = useState('');
  const [editRdCosts, setEditRdCosts] = useState('');
  const [editCustServiceCosts, setEditCustServiceCosts] = useState('');
  const [editGeneralStaffCosts, setEditGeneralStaffCosts] = useState('');
  const [editStaffCostsTotal, setEditStaffCostsTotal] = useState('');

  // ==========================================
  // Settings state — Notes
  // ==========================================
  const [editNotes, setEditNotes] = useState('');

  // ==========================================
  // Settings state — Actions
  // ==========================================
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ==========================================
  // Initialize edit form when item loads
  // ==========================================
  useEffect(() => {
    if (item) {
      // Time Dimensions
      setEditYear(item.year.toString());
      setEditScenario(item.scenario);
      setEditQuarter(item.quarter);
      setEditSemester(item.semester);
      setEditMonth(item.month || '');
      setEditFullYear(item.full_year);
      setEditPeriodEnd(item.period_end || '');
      // Ratios: Liquidity
      setEditCurrentRatio(item.current_ratio?.toString() || '');
      setEditQuickRatio(item.quick_ratio?.toString() || '');
      setEditCashRatio(item.cash_ratio?.toString() || '');
      setEditOperatingCashFlowRatio(item.operating_cash_flow_ratio?.toString() || '');
      // Ratios: Solvency
      setEditDebtToEquityRatio(item.debt_to_equity_ratio?.toString() || '');
      setEditDebtToAssetsRatio(item.debt_to_assets_ratio?.toString() || '');
      setEditInterestCoverageRatio(item.interest_coverage_ratio?.toString() || '');
      setEditDebtServiceCoverageRatio(item.debt_service_coverage_ratio?.toString() || '');
      // Ratios: Profitability
      setEditGrossProfitMargin(item.gross_profit_margin?.toString() || '');
      setEditOperatingProfitMargin(item.operating_profit_margin?.toString() || '');
      setEditNetProfitMargin(item.net_profit_margin?.toString() || '');
      setEditEbitdaMargin(item.ebitda_margin?.toString() || '');
      setEditReturnOnAssets(item.return_on_assets?.toString() || '');
      setEditReturnOnEquity(item.return_on_equity?.toString() || '');
      setEditReturnOnInvestedCapital(item.return_on_invested_capital?.toString() || '');
      // Ratios: Efficiency
      setEditAssetTurnoverRatio(item.asset_turnover_ratio?.toString() || '');
      setEditInventoryTurnoverRatio(item.inventory_turnover_ratio?.toString() || '');
      setEditReceivablesTurnoverRatio(item.receivables_turnover_ratio?.toString() || '');
      setEditDaysSalesOutstanding(item.days_sales_outstanding?.toString() || '');
      setEditDaysInventoryOutstanding(item.days_inventory_outstanding?.toString() || '');
      setEditDaysPayablesOutstanding(item.days_payables_outstanding?.toString() || '');
      // Ratios: Investment
      setEditEarningsPerShare(item.earnings_per_share?.toString() || '');
      setEditPriceEarningsRatio(item.price_earnings_ratio?.toString() || '');
      setEditDividendYield(item.dividend_yield?.toString() || '');
      setEditDividendPayoutRatio(item.dividend_payout_ratio?.toString() || '');
      setEditBookValuePerShare(item.book_value_per_share?.toString() || '');
      // Revenue Metrics
      setEditRecurringRevenue(item.recurring_revenue?.toString() || '');
      setEditNonRecurringRevenue(item.non_recurring_revenue?.toString() || '');
      setEditRevenueGrowthRate(item.revenue_growth_rate?.toString() || '');
      setEditExistCustExistSeatsRev(item.existing_customer_existing_seats_revenue?.toString() || '');
      setEditExistCustAddSeatsRev(item.existing_customer_additional_seats_revenue?.toString() || '');
      setEditNewCustNewSeatsRev(item.new_customer_new_seats_revenue?.toString() || '');
      setEditDiscountsAndRefunds(item.discounts_and_refunds?.toString() || '');
      setEditArr(item.arr?.toString() || '');
      setEditMrr(item.mrr?.toString() || '');
      setEditAvgRevenuePerCustomer(item.average_revenue_per_customer?.toString() || '');
      setEditAvgContractValue(item.average_contract_value?.toString() || '');
      setEditRevenueChurnRate(item.revenue_churn_rate?.toString() || '');
      setEditNetRevenueRetention(item.net_revenue_retention?.toString() || '');
      setEditGrossRevenueRetention(item.gross_revenue_retention?.toString() || '');
      setEditGrowthRateCohort1(item.growth_rate_cohort_1?.toString() || '');
      setEditGrowthRateCohort2(item.growth_rate_cohort_2?.toString() || '');
      setEditGrowthRateCohort3(item.growth_rate_cohort_3?.toString() || '');
      // Customer Metrics
      setEditTotalCustomers(item.total_customers?.toString() || '');
      setEditNewCustomers(item.new_customers?.toString() || '');
      setEditChurnedCustomers(item.churned_customers?.toString() || '');
      setEditTotalUsers(item.total_users?.toString() || '');
      setEditActiveUsers(item.active_users?.toString() || '');
      setEditTotalMonthlyActiveClientUsers(item.total_monthly_active_client_users?.toString() || '');
      setEditExistCustExistSeatsUsers(item.existing_customer_existing_seats_users?.toString() || '');
      setEditExistCustAddSeatsUsers(item.existing_customer_additional_seats_users?.toString() || '');
      setEditNewCustNewSeatsUsers(item.new_customer_new_seats_users?.toString() || '');
      setEditUserGrowthRate(item.user_growth_rate?.toString() || '');
      setEditNewCustTotalAddrSeats(item.new_customer_total_addressable_seats?.toString() || '');
      setEditNewCustNewSeatsPercentSigned(item.new_customer_new_seats_percent_signed?.toString() || '');
      setEditNewCustTotalAddrSeatsRemaining(item.new_customer_total_addressable_seats_remaining?.toString() || '');
      setEditExistingCustomerCount(item.existing_customer_count?.toString() || '');
      setEditExistingCustomerExpansionCount(item.existing_customer_expansion_count?.toString() || '');
      setEditNewCustomerCount(item.new_customer_count?.toString() || '');
      setEditCustomerGrowthRate(item.customer_growth_rate?.toString() || '');
      setEditCac(item.cac?.toString() || '');
      setEditLtv(item.ltv?.toString() || '');
      setEditLtvCacRatio(item.ltv_cac_ratio?.toString() || '');
      setEditPaybackPeriod(item.payback_period?.toString() || '');
      setEditCustomerChurnRate(item.customer_churn_rate?.toString() || '');
      setEditCustomerAcquisitionEfficiency(item.customer_acquisition_efficiency?.toString() || '');
      setEditSalesEfficiency(item.sales_efficiency?.toString() || '');
      // Operational Metrics
      setEditBurnRate(item.burn_rate?.toString() || '');
      setEditRunwayMonths(item.runway_months?.toString() || '');
      setEditRunwayGross(item.runway_gross?.toString() || '');
      setEditRunwayNet(item.runway_net?.toString() || '');
      setEditBurnMultiple(item.burn_multiple?.toString() || '');
      setEditRuleOf40(item.rule_of_40?.toString() || '');
      setEditGrossMargin(item.gross_margin?.toString() || '');
      setEditContributionMargin(item.contribution_margin?.toString() || '');
      setEditRevenuePerEmployee(item.revenue_per_employee?.toString() || '');
      setEditProfitPerEmployee(item.profit_per_employee?.toString() || '');
      setEditCapitalEfficiency(item.capital_efficiency?.toString() || '');
      setEditCashConversionCycle(item.cash_conversion_cycle?.toString() || '');
      setEditCapex(item.capex?.toString() || '');
      setEditEbitda(item.ebitda?.toString() || '');
      setEditTotalCosts(item.total_costs?.toString() || '');
      // Team Metrics
      setEditTotalEmployees(item.total_employees?.toString() || '');
      setEditFullTimeEmployees(item.full_time_employees?.toString() || '');
      setEditPartTimeEmployees(item.part_time_employees?.toString() || '');
      setEditContractors(item.contractors?.toString() || '');
      setEditManagement(item.number_of_management?.toString() || '');
      setEditSalesMarketingStaff(item.number_of_sales_marketing_staff?.toString() || '');
      setEditRdStaff(item.number_of_research_development_staff?.toString() || '');
      setEditCustServiceStaff(item.number_of_customer_service_support_staff?.toString() || '');
      setEditGeneralStaff(item.number_of_general_staff?.toString() || '');
      setEditEmployeeGrowthRate(item.employee_growth_rate?.toString() || '');
      setEditEmployeeTurnoverRate(item.employee_turnover_rate?.toString() || '');
      setEditAverageTenureMonths(item.average_tenure_months?.toString() || '');
      setEditManagementCosts(item.management_costs?.toString() || '');
      setEditSalesMarketingCosts(item.sales_marketing_staff_costs?.toString() || '');
      setEditRdCosts(item.research_development_staff_costs?.toString() || '');
      setEditCustServiceCosts(item.customer_service_support_staff_costs?.toString() || '');
      setEditGeneralStaffCosts(item.general_staff_costs?.toString() || '');
      setEditStaffCostsTotal(item.staff_costs_total?.toString() || '');
      // Notes
      setEditNotes(item.notes || '');
    }
  }, [item]);

  useEffect(() => {
    if (id && !item) fetchFinancialMetrics(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Helper to parse optional number fields for the update payload
  const optNum = (val: string): number | null | undefined =>
    val === '' ? null : parseFloat(val) || undefined;

  // Helper to parse optional integer fields for the update payload
  const optInt = (val: string): number | null | undefined =>
    val === '' ? null : parseInt(val, 10) || undefined;

  // ==========================================
  // Render guards
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
        <AlertDescription>Financial Metrics not found</AlertDescription>
      </Alert>
    );
  }

  const deleteConfirmTarget = `${item.year}`;

  // Helper to format nullable numbers for display
  const fmtCurrency = (val: number | null): string =>
    val != null ? `$${val.toLocaleString()}` : '—';

  const fmtNum = (val: number | null): string =>
    val != null ? val.toLocaleString() : '—';

  const fmtPct = (val: number | null): string =>
    val != null ? `${val}%` : '—';

  const fmtRatio = (val: number | null): string =>
    val != null ? val.toFixed(2) : '—';

  // Reusable read-only field component
  const ReadField = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-medium">{value}</p>
    </div>
  );

  // Reusable edit field component
  const EditField = ({ id: fieldId, label, value, onChange, step = '0.01' }: { id: string; label: string; value: string; onChange: (val: string) => void; step?: string }) => (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/financial-metrics">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Financial Metrics
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {entityName} — Financial Metrics
            </h1>
            <p className="text-sm text-muted-foreground">
              {item.year} · {getScenarioLabel(item.scenario)}
              {item.quarter && ` · ${item.quarter}`}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details">
            <TrendingUp className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="ratios">
            Ratios
          </TabsTrigger>
          <TabsTrigger value="revenue-customers">
            Revenue & Customers
          </TabsTrigger>
          <TabsTrigger value="operations-team">
            Operations & Team
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
              <ReadField label="Year" value={item.year.toString()} />
              <ReadField label="Scenario" value={getScenarioLabel(item.scenario)} />
              <ReadField label="Quarter" value={item.quarter || '—'} />
              <ReadField label="Semester" value={item.semester || '—'} />
              <ReadField label="Month" value={item.month || '—'} />
              <ReadField label="Full Year" value={item.full_year ? 'Yes' : 'No'} />
              <ReadField label="Period End" value={item.period_end ? new Date(item.period_end).toLocaleDateString() : '—'} />
            </CardContent>
          </Card>

          {/* Key Highlights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Highlights</CardTitle>
              <CardDescription>Summary of key financial metrics</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <ReadField label="ARR" value={fmtCurrency(item.arr)} />
              <ReadField label="MRR" value={fmtCurrency(item.mrr)} />
              <ReadField label="Revenue Growth Rate" value={fmtPct(item.revenue_growth_rate)} />
              <ReadField label="Net Profit Margin" value={fmtPct(item.net_profit_margin)} />
              <ReadField label="Gross Margin" value={fmtPct(item.gross_margin)} />
              <ReadField label="EBITDA" value={fmtCurrency(item.ebitda)} />
              <ReadField label="Burn Rate" value={fmtCurrency(item.burn_rate)} />
              <ReadField label="Runway (Months)" value={fmtNum(item.runway_months)} />
              <ReadField label="Rule of 40" value={fmtNum(item.rule_of_40)} />
              <ReadField label="Total Customers" value={fmtNum(item.total_customers)} />
              <ReadField label="CAC" value={fmtCurrency(item.cac)} />
              <ReadField label="LTV/CAC Ratio" value={fmtRatio(item.ltv_cac_ratio)} />
              <ReadField label="Total Employees" value={fmtNum(item.total_employees)} />
              <ReadField label="Revenue/Employee" value={fmtCurrency(item.revenue_per_employee)} />
              <ReadField label="Customer Churn Rate" value={fmtPct(item.customer_churn_rate)} />
            </CardContent>
          </Card>

          {/* Record Info */}
          <Card>
            <CardHeader>
              <CardTitle>Record Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReadField label="Created" value={new Date(item.created_at).toLocaleDateString()} />
              <ReadField label="Updated" value={item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== FINANCIAL RATIOS TAB ========== */}
        <TabsContent value="ratios" className="space-y-4">
          {/* Liquidity Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Liquidity Ratios</CardTitle>
              <CardDescription>Short-term solvency and ability to meet current obligations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReadField label="Current Ratio" value={fmtRatio(item.current_ratio)} />
              <ReadField label="Quick Ratio" value={fmtRatio(item.quick_ratio)} />
              <ReadField label="Cash Ratio" value={fmtRatio(item.cash_ratio)} />
              <ReadField label="Operating CF Ratio" value={fmtRatio(item.operating_cash_flow_ratio)} />
            </CardContent>
          </Card>

          {/* Solvency Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Solvency Ratios</CardTitle>
              <CardDescription>Long-term debt capacity and financial leverage</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReadField label="Debt-to-Equity" value={fmtRatio(item.debt_to_equity_ratio)} />
              <ReadField label="Debt-to-Assets" value={fmtRatio(item.debt_to_assets_ratio)} />
              <ReadField label="Interest Coverage" value={fmtRatio(item.interest_coverage_ratio)} />
              <ReadField label="Debt Service Coverage" value={fmtRatio(item.debt_service_coverage_ratio)} />
            </CardContent>
          </Card>

          {/* Profitability Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Profitability Ratios</CardTitle>
              <CardDescription>Margins, returns, and earnings efficiency</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <ReadField label="Gross Profit Margin" value={fmtPct(item.gross_profit_margin)} />
              <ReadField label="Operating Profit Margin" value={fmtPct(item.operating_profit_margin)} />
              <ReadField label="Net Profit Margin" value={fmtPct(item.net_profit_margin)} />
              <ReadField label="EBITDA Margin" value={fmtPct(item.ebitda_margin)} />
              <ReadField label="Return on Assets" value={fmtPct(item.return_on_assets)} />
              <ReadField label="Return on Equity" value={fmtPct(item.return_on_equity)} />
              <ReadField label="ROIC" value={fmtPct(item.return_on_invested_capital)} />
            </CardContent>
          </Card>

          {/* Efficiency Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Ratios</CardTitle>
              <CardDescription>Asset utilization and working capital management</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <ReadField label="Asset Turnover" value={fmtRatio(item.asset_turnover_ratio)} />
              <ReadField label="Inventory Turnover" value={fmtRatio(item.inventory_turnover_ratio)} />
              <ReadField label="Receivables Turnover" value={fmtRatio(item.receivables_turnover_ratio)} />
              <ReadField label="Days Sales Outstanding" value={fmtNum(item.days_sales_outstanding)} />
              <ReadField label="Days Inventory Outstanding" value={fmtNum(item.days_inventory_outstanding)} />
              <ReadField label="Days Payables Outstanding" value={fmtNum(item.days_payables_outstanding)} />
            </CardContent>
          </Card>

          {/* Investment Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Ratios</CardTitle>
              <CardDescription>Per-share metrics and valuation indicators</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <ReadField label="Earnings Per Share" value={fmtRatio(item.earnings_per_share)} />
              <ReadField label="P/E Ratio" value={fmtRatio(item.price_earnings_ratio)} />
              <ReadField label="Dividend Yield" value={fmtPct(item.dividend_yield)} />
              <ReadField label="Dividend Payout Ratio" value={fmtPct(item.dividend_payout_ratio)} />
              <ReadField label="Book Value Per Share" value={fmtRatio(item.book_value_per_share)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== REVENUE & CUSTOMERS TAB ========== */}
        <TabsContent value="revenue-customers" className="space-y-4">
          {/* Revenue Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Metrics</CardTitle>
              <CardDescription>Revenue breakdown, recurring revenue, and growth rates</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <ReadField label="Recurring Revenue" value={fmtCurrency(item.recurring_revenue)} />
              <ReadField label="Non-Recurring Revenue" value={fmtCurrency(item.non_recurring_revenue)} />
              <ReadField label="Revenue Growth Rate" value={fmtPct(item.revenue_growth_rate)} />
              <ReadField label="ARR" value={fmtCurrency(item.arr)} />
              <ReadField label="MRR" value={fmtCurrency(item.mrr)} />
              <ReadField label="Avg Revenue/Customer" value={fmtCurrency(item.average_revenue_per_customer)} />
              <ReadField label="Avg Contract Value" value={fmtCurrency(item.average_contract_value)} />
              <ReadField label="Revenue Churn Rate" value={fmtPct(item.revenue_churn_rate)} />
              <ReadField label="Net Revenue Retention" value={fmtPct(item.net_revenue_retention)} />
              <ReadField label="Gross Revenue Retention" value={fmtPct(item.gross_revenue_retention)} />
              <ReadField label="Discounts & Refunds" value={fmtCurrency(item.discounts_and_refunds)} />
              <ReadField label="Existing Cust. Existing Seats Rev" value={fmtCurrency(item.existing_customer_existing_seats_revenue)} />
              <ReadField label="Existing Cust. Additional Seats Rev" value={fmtCurrency(item.existing_customer_additional_seats_revenue)} />
              <ReadField label="New Cust. New Seats Rev" value={fmtCurrency(item.new_customer_new_seats_revenue)} />
              <ReadField label="Growth Rate Cohort 1" value={fmtPct(item.growth_rate_cohort_1)} />
              <ReadField label="Growth Rate Cohort 2" value={fmtPct(item.growth_rate_cohort_2)} />
              <ReadField label="Growth Rate Cohort 3" value={fmtPct(item.growth_rate_cohort_3)} />
            </CardContent>
          </Card>

          {/* Customer Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Metrics</CardTitle>
              <CardDescription>Customer counts, acquisition, retention, and lifetime value</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <ReadField label="Total Customers" value={fmtNum(item.total_customers)} />
              <ReadField label="New Customers" value={fmtNum(item.new_customers)} />
              <ReadField label="Churned Customers" value={fmtNum(item.churned_customers)} />
              <ReadField label="Total Users" value={fmtNum(item.total_users)} />
              <ReadField label="Active Users" value={fmtNum(item.active_users)} />
              <ReadField label="Monthly Active Users" value={fmtNum(item.total_monthly_active_client_users)} />
              <ReadField label="Existing Cust. Existing Seats" value={fmtNum(item.existing_customer_existing_seats_users)} />
              <ReadField label="Existing Cust. Additional Seats" value={fmtNum(item.existing_customer_additional_seats_users)} />
              <ReadField label="New Cust. New Seats" value={fmtNum(item.new_customer_new_seats_users)} />
              <ReadField label="User Growth Rate" value={fmtPct(item.user_growth_rate)} />
              <ReadField label="New Cust. Addressable Seats" value={fmtNum(item.new_customer_total_addressable_seats)} />
              <ReadField label="New Seats % Signed" value={fmtPct(item.new_customer_new_seats_percent_signed)} />
              <ReadField label="Addressable Seats Remaining" value={fmtNum(item.new_customer_total_addressable_seats_remaining)} />
              <ReadField label="Existing Customer Count" value={fmtNum(item.existing_customer_count)} />
              <ReadField label="Existing Cust. Expansion Count" value={fmtNum(item.existing_customer_expansion_count)} />
              <ReadField label="New Customer Count" value={fmtNum(item.new_customer_count)} />
              <ReadField label="Customer Growth Rate" value={fmtPct(item.customer_growth_rate)} />
              <ReadField label="CAC" value={fmtCurrency(item.cac)} />
              <ReadField label="LTV" value={fmtCurrency(item.ltv)} />
              <ReadField label="LTV/CAC Ratio" value={fmtRatio(item.ltv_cac_ratio)} />
              <ReadField label="Payback Period" value={fmtNum(item.payback_period)} />
              <ReadField label="Customer Churn Rate" value={fmtPct(item.customer_churn_rate)} />
              <ReadField label="Cust. Acquisition Efficiency" value={fmtRatio(item.customer_acquisition_efficiency)} />
              <ReadField label="Sales Efficiency" value={fmtRatio(item.sales_efficiency)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== OPERATIONS & TEAM TAB ========== */}
        <TabsContent value="operations-team" className="space-y-4">
          {/* Operational Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Operational Metrics</CardTitle>
              <CardDescription>Burn rate, runway, margins, and capital efficiency</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <ReadField label="Burn Rate" value={fmtCurrency(item.burn_rate)} />
              <ReadField label="Runway (Months)" value={fmtNum(item.runway_months)} />
              <ReadField label="Runway Gross" value={fmtCurrency(item.runway_gross)} />
              <ReadField label="Runway Net" value={fmtCurrency(item.runway_net)} />
              <ReadField label="Burn Multiple" value={fmtRatio(item.burn_multiple)} />
              <ReadField label="Rule of 40" value={fmtNum(item.rule_of_40)} />
              <ReadField label="Gross Margin" value={fmtPct(item.gross_margin)} />
              <ReadField label="Contribution Margin" value={fmtPct(item.contribution_margin)} />
              <ReadField label="Revenue/Employee" value={fmtCurrency(item.revenue_per_employee)} />
              <ReadField label="Profit/Employee" value={fmtCurrency(item.profit_per_employee)} />
              <ReadField label="Capital Efficiency" value={fmtRatio(item.capital_efficiency)} />
              <ReadField label="Cash Conversion Cycle" value={fmtNum(item.cash_conversion_cycle)} />
              <ReadField label="CapEx" value={fmtCurrency(item.capex)} />
              <ReadField label="EBITDA" value={fmtCurrency(item.ebitda)} />
              <ReadField label="Total Costs" value={fmtCurrency(item.total_costs)} />
            </CardContent>
          </Card>

          {/* Team Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Team Metrics</CardTitle>
              <CardDescription>Headcount, departmental breakdown, and staff costs</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <ReadField label="Total Employees" value={fmtNum(item.total_employees)} />
              <ReadField label="Full-Time Employees" value={fmtNum(item.full_time_employees)} />
              <ReadField label="Part-Time Employees" value={fmtNum(item.part_time_employees)} />
              <ReadField label="Contractors" value={fmtNum(item.contractors)} />
              <ReadField label="Management" value={fmtNum(item.number_of_management)} />
              <ReadField label="Sales & Marketing" value={fmtNum(item.number_of_sales_marketing_staff)} />
              <ReadField label="R&D" value={fmtNum(item.number_of_research_development_staff)} />
              <ReadField label="Customer Service" value={fmtNum(item.number_of_customer_service_support_staff)} />
              <ReadField label="General Staff" value={fmtNum(item.number_of_general_staff)} />
              <ReadField label="Employee Growth Rate" value={fmtPct(item.employee_growth_rate)} />
              <ReadField label="Employee Turnover Rate" value={fmtPct(item.employee_turnover_rate)} />
              <ReadField label="Avg Tenure (Months)" value={fmtNum(item.average_tenure_months)} />
              <ReadField label="Management Costs" value={fmtCurrency(item.management_costs)} />
              <ReadField label="Sales & Marketing Costs" value={fmtCurrency(item.sales_marketing_staff_costs)} />
              <ReadField label="R&D Costs" value={fmtCurrency(item.research_development_staff_costs)} />
              <ReadField label="Customer Service Costs" value={fmtCurrency(item.customer_service_support_staff_costs)} />
              <ReadField label="General Staff Costs" value={fmtCurrency(item.general_staff_costs)} />
              <div className="col-span-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">Staff Costs Total</p>
                <p className="text-xl font-semibold">{fmtCurrency(item.staff_costs_total)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium whitespace-pre-wrap">{item.notes || '—'}</p>
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
                  <Select value={editScenario} onValueChange={(value) => setEditScenario(value)}>
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
              <div className="space-y-2">
                <Label htmlFor="edit-period-end">Period End</Label>
                <Input id="edit-period-end" type="date" value={editPeriodEnd} onChange={(e) => setEditPeriodEnd(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Liquidity Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Liquidity Ratios</CardTitle>
              <CardDescription>Update liquidity ratio fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <EditField id="edit-current-ratio" label="Current Ratio" value={editCurrentRatio} onChange={setEditCurrentRatio} />
                <EditField id="edit-quick-ratio" label="Quick Ratio" value={editQuickRatio} onChange={setEditQuickRatio} />
                <EditField id="edit-cash-ratio" label="Cash Ratio" value={editCashRatio} onChange={setEditCashRatio} />
                <EditField id="edit-operating-cf-ratio" label="Operating CF Ratio" value={editOperatingCashFlowRatio} onChange={setEditOperatingCashFlowRatio} />
              </div>
            </CardContent>
          </Card>

          {/* Solvency Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Solvency Ratios</CardTitle>
              <CardDescription>Update solvency ratio fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <EditField id="edit-debt-to-equity" label="Debt-to-Equity" value={editDebtToEquityRatio} onChange={setEditDebtToEquityRatio} />
                <EditField id="edit-debt-to-assets" label="Debt-to-Assets" value={editDebtToAssetsRatio} onChange={setEditDebtToAssetsRatio} />
                <EditField id="edit-interest-coverage" label="Interest Coverage" value={editInterestCoverageRatio} onChange={setEditInterestCoverageRatio} />
                <EditField id="edit-debt-service-coverage" label="Debt Service Coverage" value={editDebtServiceCoverageRatio} onChange={setEditDebtServiceCoverageRatio} />
              </div>
            </CardContent>
          </Card>

          {/* Profitability Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Profitability Ratios</CardTitle>
              <CardDescription>Update profitability ratio fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <EditField id="edit-gross-profit-margin" label="Gross Profit Margin" value={editGrossProfitMargin} onChange={setEditGrossProfitMargin} />
                <EditField id="edit-operating-profit-margin" label="Operating Profit Margin" value={editOperatingProfitMargin} onChange={setEditOperatingProfitMargin} />
                <EditField id="edit-net-profit-margin" label="Net Profit Margin" value={editNetProfitMargin} onChange={setEditNetProfitMargin} />
                <EditField id="edit-ebitda-margin" label="EBITDA Margin" value={editEbitdaMargin} onChange={setEditEbitdaMargin} />
                <EditField id="edit-return-on-assets" label="Return on Assets" value={editReturnOnAssets} onChange={setEditReturnOnAssets} />
                <EditField id="edit-return-on-equity" label="Return on Equity" value={editReturnOnEquity} onChange={setEditReturnOnEquity} />
                <EditField id="edit-roic" label="ROIC" value={editReturnOnInvestedCapital} onChange={setEditReturnOnInvestedCapital} />
              </div>
            </CardContent>
          </Card>

          {/* Efficiency Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Ratios</CardTitle>
              <CardDescription>Update efficiency ratio fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <EditField id="edit-asset-turnover" label="Asset Turnover" value={editAssetTurnoverRatio} onChange={setEditAssetTurnoverRatio} />
                <EditField id="edit-inventory-turnover" label="Inventory Turnover" value={editInventoryTurnoverRatio} onChange={setEditInventoryTurnoverRatio} />
                <EditField id="edit-receivables-turnover" label="Receivables Turnover" value={editReceivablesTurnoverRatio} onChange={setEditReceivablesTurnoverRatio} />
                <EditField id="edit-days-sales-outstanding" label="Days Sales Outstanding" value={editDaysSalesOutstanding} onChange={setEditDaysSalesOutstanding} />
                <EditField id="edit-days-inventory-outstanding" label="Days Inventory Outstanding" value={editDaysInventoryOutstanding} onChange={setEditDaysInventoryOutstanding} />
                <EditField id="edit-days-payables-outstanding" label="Days Payables Outstanding" value={editDaysPayablesOutstanding} onChange={setEditDaysPayablesOutstanding} />
              </div>
            </CardContent>
          </Card>

          {/* Investment Ratios */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Ratios</CardTitle>
              <CardDescription>Update investment ratio fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <EditField id="edit-earnings-per-share" label="Earnings Per Share" value={editEarningsPerShare} onChange={setEditEarningsPerShare} />
                <EditField id="edit-pe-ratio" label="P/E Ratio" value={editPriceEarningsRatio} onChange={setEditPriceEarningsRatio} />
                <EditField id="edit-dividend-yield" label="Dividend Yield" value={editDividendYield} onChange={setEditDividendYield} />
                <EditField id="edit-dividend-payout-ratio" label="Dividend Payout Ratio" value={editDividendPayoutRatio} onChange={setEditDividendPayoutRatio} />
                <EditField id="edit-book-value-per-share" label="Book Value Per Share" value={editBookValuePerShare} onChange={setEditBookValuePerShare} />
              </div>
            </CardContent>
          </Card>

          {/* Revenue Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Metrics</CardTitle>
              <CardDescription>Update revenue metric fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <EditField id="edit-recurring-revenue" label="Recurring Revenue" value={editRecurringRevenue} onChange={setEditRecurringRevenue} />
                <EditField id="edit-non-recurring-revenue" label="Non-Recurring Revenue" value={editNonRecurringRevenue} onChange={setEditNonRecurringRevenue} />
                <EditField id="edit-revenue-growth-rate" label="Revenue Growth Rate" value={editRevenueGrowthRate} onChange={setEditRevenueGrowthRate} />
                <EditField id="edit-arr" label="ARR" value={editArr} onChange={setEditArr} />
                <EditField id="edit-mrr" label="MRR" value={editMrr} onChange={setEditMrr} />
                <EditField id="edit-avg-revenue-per-customer" label="Avg Revenue/Customer" value={editAvgRevenuePerCustomer} onChange={setEditAvgRevenuePerCustomer} />
                <EditField id="edit-avg-contract-value" label="Avg Contract Value" value={editAvgContractValue} onChange={setEditAvgContractValue} />
                <EditField id="edit-revenue-churn-rate" label="Revenue Churn Rate" value={editRevenueChurnRate} onChange={setEditRevenueChurnRate} />
                <EditField id="edit-net-revenue-retention" label="Net Revenue Retention" value={editNetRevenueRetention} onChange={setEditNetRevenueRetention} />
                <EditField id="edit-gross-revenue-retention" label="Gross Revenue Retention" value={editGrossRevenueRetention} onChange={setEditGrossRevenueRetention} />
                <EditField id="edit-discounts-refunds" label="Discounts & Refunds" value={editDiscountsAndRefunds} onChange={setEditDiscountsAndRefunds} />
                <EditField id="edit-exist-cust-exist-seats-rev" label="Existing Cust. Existing Seats Rev" value={editExistCustExistSeatsRev} onChange={setEditExistCustExistSeatsRev} />
                <EditField id="edit-exist-cust-add-seats-rev" label="Existing Cust. Additional Seats Rev" value={editExistCustAddSeatsRev} onChange={setEditExistCustAddSeatsRev} />
                <EditField id="edit-new-cust-new-seats-rev" label="New Cust. New Seats Rev" value={editNewCustNewSeatsRev} onChange={setEditNewCustNewSeatsRev} />
                <EditField id="edit-growth-rate-cohort-1" label="Growth Rate Cohort 1" value={editGrowthRateCohort1} onChange={setEditGrowthRateCohort1} />
                <EditField id="edit-growth-rate-cohort-2" label="Growth Rate Cohort 2" value={editGrowthRateCohort2} onChange={setEditGrowthRateCohort2} />
                <EditField id="edit-growth-rate-cohort-3" label="Growth Rate Cohort 3" value={editGrowthRateCohort3} onChange={setEditGrowthRateCohort3} />
              </div>
            </CardContent>
          </Card>

          {/* Customer Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Metrics</CardTitle>
              <CardDescription>Update customer metric fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <EditField id="edit-total-customers" label="Total Customers" value={editTotalCustomers} onChange={setEditTotalCustomers} step="1" />
                <EditField id="edit-new-customers" label="New Customers" value={editNewCustomers} onChange={setEditNewCustomers} step="1" />
                <EditField id="edit-churned-customers" label="Churned Customers" value={editChurnedCustomers} onChange={setEditChurnedCustomers} step="1" />
                <EditField id="edit-total-users" label="Total Users" value={editTotalUsers} onChange={setEditTotalUsers} step="1" />
                <EditField id="edit-active-users" label="Active Users" value={editActiveUsers} onChange={setEditActiveUsers} step="1" />
                <EditField id="edit-monthly-active-users" label="Monthly Active Users" value={editTotalMonthlyActiveClientUsers} onChange={setEditTotalMonthlyActiveClientUsers} step="1" />
                <EditField id="edit-exist-cust-exist-seats-users" label="Existing Cust. Existing Seats" value={editExistCustExistSeatsUsers} onChange={setEditExistCustExistSeatsUsers} step="1" />
                <EditField id="edit-exist-cust-add-seats-users" label="Existing Cust. Additional Seats" value={editExistCustAddSeatsUsers} onChange={setEditExistCustAddSeatsUsers} step="1" />
                <EditField id="edit-new-cust-new-seats-users" label="New Cust. New Seats" value={editNewCustNewSeatsUsers} onChange={setEditNewCustNewSeatsUsers} step="1" />
                <EditField id="edit-user-growth-rate" label="User Growth Rate" value={editUserGrowthRate} onChange={setEditUserGrowthRate} />
                <EditField id="edit-new-cust-addr-seats" label="New Cust. Addressable Seats" value={editNewCustTotalAddrSeats} onChange={setEditNewCustTotalAddrSeats} step="1" />
                <EditField id="edit-new-seats-pct-signed" label="New Seats % Signed" value={editNewCustNewSeatsPercentSigned} onChange={setEditNewCustNewSeatsPercentSigned} />
                <EditField id="edit-addr-seats-remaining" label="Addressable Seats Remaining" value={editNewCustTotalAddrSeatsRemaining} onChange={setEditNewCustTotalAddrSeatsRemaining} step="1" />
                <EditField id="edit-existing-customer-count" label="Existing Customer Count" value={editExistingCustomerCount} onChange={setEditExistingCustomerCount} step="1" />
                <EditField id="edit-existing-cust-expansion-count" label="Existing Cust. Expansion Count" value={editExistingCustomerExpansionCount} onChange={setEditExistingCustomerExpansionCount} step="1" />
                <EditField id="edit-new-customer-count" label="New Customer Count" value={editNewCustomerCount} onChange={setEditNewCustomerCount} step="1" />
                <EditField id="edit-customer-growth-rate" label="Customer Growth Rate" value={editCustomerGrowthRate} onChange={setEditCustomerGrowthRate} />
                <EditField id="edit-cac" label="CAC" value={editCac} onChange={setEditCac} />
                <EditField id="edit-ltv" label="LTV" value={editLtv} onChange={setEditLtv} />
                <EditField id="edit-ltv-cac-ratio" label="LTV/CAC Ratio" value={editLtvCacRatio} onChange={setEditLtvCacRatio} />
                <EditField id="edit-payback-period" label="Payback Period" value={editPaybackPeriod} onChange={setEditPaybackPeriod} />
                <EditField id="edit-customer-churn-rate" label="Customer Churn Rate" value={editCustomerChurnRate} onChange={setEditCustomerChurnRate} />
                <EditField id="edit-cust-acquisition-efficiency" label="Cust. Acquisition Efficiency" value={editCustomerAcquisitionEfficiency} onChange={setEditCustomerAcquisitionEfficiency} />
                <EditField id="edit-sales-efficiency" label="Sales Efficiency" value={editSalesEfficiency} onChange={setEditSalesEfficiency} />
              </div>
            </CardContent>
          </Card>

          {/* Operational Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Operational Metrics</CardTitle>
              <CardDescription>Update operational metric fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <EditField id="edit-burn-rate" label="Burn Rate" value={editBurnRate} onChange={setEditBurnRate} />
                <EditField id="edit-runway-months" label="Runway (Months)" value={editRunwayMonths} onChange={setEditRunwayMonths} />
                <EditField id="edit-runway-gross" label="Runway Gross" value={editRunwayGross} onChange={setEditRunwayGross} />
                <EditField id="edit-runway-net" label="Runway Net" value={editRunwayNet} onChange={setEditRunwayNet} />
                <EditField id="edit-burn-multiple" label="Burn Multiple" value={editBurnMultiple} onChange={setEditBurnMultiple} />
                <EditField id="edit-rule-of-40" label="Rule of 40" value={editRuleOf40} onChange={setEditRuleOf40} />
                <EditField id="edit-gross-margin" label="Gross Margin" value={editGrossMargin} onChange={setEditGrossMargin} />
                <EditField id="edit-contribution-margin" label="Contribution Margin" value={editContributionMargin} onChange={setEditContributionMargin} />
                <EditField id="edit-revenue-per-employee" label="Revenue/Employee" value={editRevenuePerEmployee} onChange={setEditRevenuePerEmployee} />
                <EditField id="edit-profit-per-employee" label="Profit/Employee" value={editProfitPerEmployee} onChange={setEditProfitPerEmployee} />
                <EditField id="edit-capital-efficiency" label="Capital Efficiency" value={editCapitalEfficiency} onChange={setEditCapitalEfficiency} />
                <EditField id="edit-cash-conversion-cycle" label="Cash Conversion Cycle" value={editCashConversionCycle} onChange={setEditCashConversionCycle} />
                <EditField id="edit-capex" label="CapEx" value={editCapex} onChange={setEditCapex} />
                <EditField id="edit-ebitda" label="EBITDA" value={editEbitda} onChange={setEditEbitda} />
                <EditField id="edit-total-costs" label="Total Costs" value={editTotalCosts} onChange={setEditTotalCosts} />
              </div>
            </CardContent>
          </Card>

          {/* Team Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Team Metrics</CardTitle>
              <CardDescription>Update team metric fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <EditField id="edit-total-employees" label="Total Employees" value={editTotalEmployees} onChange={setEditTotalEmployees} step="1" />
                <EditField id="edit-full-time-employees" label="Full-Time Employees" value={editFullTimeEmployees} onChange={setEditFullTimeEmployees} step="1" />
                <EditField id="edit-part-time-employees" label="Part-Time Employees" value={editPartTimeEmployees} onChange={setEditPartTimeEmployees} step="1" />
                <EditField id="edit-contractors" label="Contractors" value={editContractors} onChange={setEditContractors} step="1" />
                <EditField id="edit-management" label="Management" value={editManagement} onChange={setEditManagement} step="1" />
                <EditField id="edit-sales-marketing-staff" label="Sales & Marketing" value={editSalesMarketingStaff} onChange={setEditSalesMarketingStaff} step="1" />
                <EditField id="edit-rd-staff" label="R&D" value={editRdStaff} onChange={setEditRdStaff} step="1" />
                <EditField id="edit-cust-service-staff" label="Customer Service" value={editCustServiceStaff} onChange={setEditCustServiceStaff} step="1" />
                <EditField id="edit-general-staff" label="General Staff" value={editGeneralStaff} onChange={setEditGeneralStaff} step="1" />
                <EditField id="edit-employee-growth-rate" label="Employee Growth Rate" value={editEmployeeGrowthRate} onChange={setEditEmployeeGrowthRate} />
                <EditField id="edit-employee-turnover-rate" label="Employee Turnover Rate" value={editEmployeeTurnoverRate} onChange={setEditEmployeeTurnoverRate} />
                <EditField id="edit-avg-tenure-months" label="Avg Tenure (Months)" value={editAverageTenureMonths} onChange={setEditAverageTenureMonths} />
                <EditField id="edit-management-costs" label="Management Costs" value={editManagementCosts} onChange={setEditManagementCosts} />
                <EditField id="edit-sales-marketing-costs" label="Sales & Marketing Costs" value={editSalesMarketingCosts} onChange={setEditSalesMarketingCosts} />
                <EditField id="edit-rd-costs" label="R&D Costs" value={editRdCosts} onChange={setEditRdCosts} />
                <EditField id="edit-cust-service-costs" label="Customer Service Costs" value={editCustServiceCosts} onChange={setEditCustServiceCosts} />
                <EditField id="edit-general-staff-costs" label="General Staff Costs" value={editGeneralStaffCosts} onChange={setEditGeneralStaffCosts} />
                <EditField id="edit-staff-costs-total" label="Staff Costs Total" value={editStaffCostsTotal} onChange={setEditStaffCostsTotal} />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Update notes for this metrics snapshot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={async () => {
              setIsUpdating(true);
              try {
                await updateFinancialMetrics(id, {
                  // Time Dimensions
                  year: editYear ? parseInt(editYear, 10) : undefined,
                  scenario: editScenario || undefined,
                  quarter: editQuarter,
                  semester: editSemester,
                  month: editMonth || null,
                  full_year: editFullYear,
                  period_end: editPeriodEnd || null,
                  // Ratios: Liquidity
                  current_ratio: optNum(editCurrentRatio),
                  quick_ratio: optNum(editQuickRatio),
                  cash_ratio: optNum(editCashRatio),
                  operating_cash_flow_ratio: optNum(editOperatingCashFlowRatio),
                  // Ratios: Solvency
                  debt_to_equity_ratio: optNum(editDebtToEquityRatio),
                  debt_to_assets_ratio: optNum(editDebtToAssetsRatio),
                  interest_coverage_ratio: optNum(editInterestCoverageRatio),
                  debt_service_coverage_ratio: optNum(editDebtServiceCoverageRatio),
                  // Ratios: Profitability
                  gross_profit_margin: optNum(editGrossProfitMargin),
                  operating_profit_margin: optNum(editOperatingProfitMargin),
                  net_profit_margin: optNum(editNetProfitMargin),
                  ebitda_margin: optNum(editEbitdaMargin),
                  return_on_assets: optNum(editReturnOnAssets),
                  return_on_equity: optNum(editReturnOnEquity),
                  return_on_invested_capital: optNum(editReturnOnInvestedCapital),
                  // Ratios: Efficiency
                  asset_turnover_ratio: optNum(editAssetTurnoverRatio),
                  inventory_turnover_ratio: optNum(editInventoryTurnoverRatio),
                  receivables_turnover_ratio: optNum(editReceivablesTurnoverRatio),
                  days_sales_outstanding: optNum(editDaysSalesOutstanding),
                  days_inventory_outstanding: optNum(editDaysInventoryOutstanding),
                  days_payables_outstanding: optNum(editDaysPayablesOutstanding),
                  // Ratios: Investment
                  earnings_per_share: optNum(editEarningsPerShare),
                  price_earnings_ratio: optNum(editPriceEarningsRatio),
                  dividend_yield: optNum(editDividendYield),
                  dividend_payout_ratio: optNum(editDividendPayoutRatio),
                  book_value_per_share: optNum(editBookValuePerShare),
                  // Revenue Metrics
                  recurring_revenue: optNum(editRecurringRevenue),
                  non_recurring_revenue: optNum(editNonRecurringRevenue),
                  revenue_growth_rate: optNum(editRevenueGrowthRate),
                  existing_customer_existing_seats_revenue: optNum(editExistCustExistSeatsRev),
                  existing_customer_additional_seats_revenue: optNum(editExistCustAddSeatsRev),
                  new_customer_new_seats_revenue: optNum(editNewCustNewSeatsRev),
                  discounts_and_refunds: optNum(editDiscountsAndRefunds),
                  arr: optNum(editArr),
                  mrr: optNum(editMrr),
                  average_revenue_per_customer: optNum(editAvgRevenuePerCustomer),
                  average_contract_value: optNum(editAvgContractValue),
                  revenue_churn_rate: optNum(editRevenueChurnRate),
                  net_revenue_retention: optNum(editNetRevenueRetention),
                  gross_revenue_retention: optNum(editGrossRevenueRetention),
                  growth_rate_cohort_1: optNum(editGrowthRateCohort1),
                  growth_rate_cohort_2: optNum(editGrowthRateCohort2),
                  growth_rate_cohort_3: optNum(editGrowthRateCohort3),
                  // Customer Metrics
                  total_customers: optInt(editTotalCustomers),
                  new_customers: optInt(editNewCustomers),
                  churned_customers: optInt(editChurnedCustomers),
                  total_users: optInt(editTotalUsers),
                  active_users: optInt(editActiveUsers),
                  total_monthly_active_client_users: optInt(editTotalMonthlyActiveClientUsers),
                  existing_customer_existing_seats_users: optInt(editExistCustExistSeatsUsers),
                  existing_customer_additional_seats_users: optInt(editExistCustAddSeatsUsers),
                  new_customer_new_seats_users: optInt(editNewCustNewSeatsUsers),
                  user_growth_rate: optNum(editUserGrowthRate),
                  new_customer_total_addressable_seats: optInt(editNewCustTotalAddrSeats),
                  new_customer_new_seats_percent_signed: optNum(editNewCustNewSeatsPercentSigned),
                  new_customer_total_addressable_seats_remaining: optInt(editNewCustTotalAddrSeatsRemaining),
                  existing_customer_count: optInt(editExistingCustomerCount),
                  existing_customer_expansion_count: optInt(editExistingCustomerExpansionCount),
                  new_customer_count: optInt(editNewCustomerCount),
                  customer_growth_rate: optNum(editCustomerGrowthRate),
                  cac: optNum(editCac),
                  ltv: optNum(editLtv),
                  ltv_cac_ratio: optNum(editLtvCacRatio),
                  payback_period: optNum(editPaybackPeriod),
                  customer_churn_rate: optNum(editCustomerChurnRate),
                  customer_acquisition_efficiency: optNum(editCustomerAcquisitionEfficiency),
                  sales_efficiency: optNum(editSalesEfficiency),
                  // Operational Metrics
                  burn_rate: optNum(editBurnRate),
                  runway_months: optNum(editRunwayMonths),
                  runway_gross: optNum(editRunwayGross),
                  runway_net: optNum(editRunwayNet),
                  burn_multiple: optNum(editBurnMultiple),
                  rule_of_40: optNum(editRuleOf40),
                  gross_margin: optNum(editGrossMargin),
                  contribution_margin: optNum(editContributionMargin),
                  revenue_per_employee: optNum(editRevenuePerEmployee),
                  profit_per_employee: optNum(editProfitPerEmployee),
                  capital_efficiency: optNum(editCapitalEfficiency),
                  cash_conversion_cycle: optNum(editCashConversionCycle),
                  capex: optNum(editCapex),
                  ebitda: optNum(editEbitda),
                  total_costs: optNum(editTotalCosts),
                  // Team Metrics
                  total_employees: optInt(editTotalEmployees),
                  full_time_employees: optInt(editFullTimeEmployees),
                  part_time_employees: optInt(editPartTimeEmployees),
                  contractors: optInt(editContractors),
                  number_of_management: optInt(editManagement),
                  number_of_sales_marketing_staff: optInt(editSalesMarketingStaff),
                  number_of_research_development_staff: optInt(editRdStaff),
                  number_of_customer_service_support_staff: optInt(editCustServiceStaff),
                  number_of_general_staff: optInt(editGeneralStaff),
                  employee_growth_rate: optNum(editEmployeeGrowthRate),
                  employee_turnover_rate: optNum(editEmployeeTurnoverRate),
                  average_tenure_months: optNum(editAverageTenureMonths),
                  management_costs: optNum(editManagementCosts),
                  sales_marketing_staff_costs: optNum(editSalesMarketingCosts),
                  research_development_staff_costs: optNum(editRdCosts),
                  customer_service_support_staff_costs: optNum(editCustServiceCosts),
                  general_staff_costs: optNum(editGeneralStaffCosts),
                  staff_costs_total: optNum(editStaffCostsTotal),
                  // Notes
                  notes: editNotes || null,
                });
                // Refresh list data after update to keep store in sync
                await fetchFinancialMetricsList();
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
                  <h4 className="font-medium">Delete this financial metrics record</h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this financial metrics record cannot be recovered.
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
                      await deleteFinancialMetrics(id);
                      router.push('/financial-metrics');
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
                      Delete Financial Metrics
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
