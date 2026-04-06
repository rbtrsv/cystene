'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GitPullRequest, AlertTriangle, Loader2, Pencil, Trash2 } from 'lucide-react';

import { useDealPipelines } from '@/modules/assetmanager/hooks/holding/use-deal-pipelines';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import type { UpdateDealPipeline } from '@/modules/assetmanager/schemas/holding/deal-pipeline.schemas';
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

const PIPELINE_PRIORITY_OPTIONS = [
  { value: 'p1', label: 'P1 — Highest' },
  { value: 'p2', label: 'P2 — High' },
  { value: 'p3', label: 'P3 — Medium' },
  { value: 'p4', label: 'P4 — Low' },
  { value: 'p5', label: 'P5 — Lowest' },
] as const;

const PIPELINE_STATUS_OPTIONS = [
  { value: 'initial_screening', label: 'Initial Screening' },
  { value: 'due_diligence', label: 'Due Diligence' },
  { value: 'term_sheet', label: 'Term Sheet' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closing', label: 'Closing' },
  { value: 'closed', label: 'Closed' },
  { value: 'passed', label: 'Passed' },
  { value: 'rejected', label: 'Rejected' },
] as const;

// ==========================================
// Helper: parse optional number from string
// ==========================================

const optNum = (val: string): number | null => {
  if (!val || val.trim() === '') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
};

export default function DealPipelineDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseInt(params.id as string, 10);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';

  const { dealPipelines, isLoading, error, fetchDealPipeline, updateDealPipeline, deleteDealPipeline, fetchDealPipelines } = useDealPipelines();
  const { getEntityName } = useEntities();

  const item = dealPipelines.find((row) => row.id === id);

  // ==========================================
  // Edit state — all fields
  // ==========================================

  // Core
  const [editDealName, setEditDealName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editPriority, setEditPriority] = useState('p3');
  const [editStatus, setEditStatus] = useState('initial_screening');
  const [editRoundType, setEditRoundType] = useState('');
  const [editSector, setEditSector] = useState('');

  // Financial Details
  const [editTargetRaise, setEditTargetRaise] = useState('');
  const [editPreMoneyValuation, setEditPreMoneyValuation] = useState('');
  const [editPostMoneyValuation, setEditPostMoneyValuation] = useState('');
  const [editExpectedOwnership, setEditExpectedOwnership] = useState('');
  const [editInvestmentAmount, setEditInvestmentAmount] = useState('');
  const [editIsLeadInvestor, setEditIsLeadInvestor] = useState(false);
  const [editOtherInvestors, setEditOtherInvestors] = useState('');

  // Dates
  const [editFirstContactDate, setEditFirstContactDate] = useState('');
  const [editLastInteractionDate, setEditLastInteractionDate] = useState('');
  const [editNextMeetingDate, setEditNextMeetingDate] = useState('');
  const [editExpectedCloseDate, setEditExpectedCloseDate] = useState('');

  // Notes & Analysis
  const [editInvestmentThesis, setEditInvestmentThesis] = useState('');
  const [editKeyRisks, setEditKeyRisks] = useState('');
  const [editDueDiligenceNotes, setEditDueDiligenceNotes] = useState('');
  const [editNextSteps, setEditNextSteps] = useState('');
  const [editRejectionReason, setEditRejectionReason] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // UI state
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Fetch the specific deal pipeline entry if not in store
  useEffect(() => {
    if (id && !item) fetchDealPipeline(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sync edit state when item loads
  useEffect(() => {
    if (item) {
      setEditDealName(item.deal_name);
      setEditCompanyName(item.company_name || '');
      setEditPriority(item.priority);
      setEditStatus(item.status);
      setEditRoundType(item.round_type);
      setEditSector(item.sector);
      setEditTargetRaise(item.target_raise != null ? String(item.target_raise) : '');
      setEditPreMoneyValuation(item.pre_money_valuation != null ? String(item.pre_money_valuation) : '');
      setEditPostMoneyValuation(item.post_money_valuation != null ? String(item.post_money_valuation) : '');
      setEditExpectedOwnership(item.expected_ownership != null ? String(item.expected_ownership) : '');
      setEditInvestmentAmount(item.investment_amount != null ? String(item.investment_amount) : '');
      setEditIsLeadInvestor(item.is_lead_investor);
      setEditOtherInvestors(item.other_investors || '');
      setEditFirstContactDate(item.first_contact_date || '');
      setEditLastInteractionDate(item.last_interaction_date || '');
      setEditNextMeetingDate(item.next_meeting_date || '');
      setEditExpectedCloseDate(item.expected_close_date || '');
      setEditInvestmentThesis(item.investment_thesis || '');
      setEditKeyRisks(item.key_risks || '');
      setEditDueDiligenceNotes(item.due_diligence_notes || '');
      setEditNextSteps(item.next_steps || '');
      setEditRejectionReason(item.rejection_reason || '');
      setEditNotes(item.notes || '');
    }
  }, [item]);

  // ==========================================
  // Save handler
  // ==========================================

  const handleSave = async () => {
    if (!item) return;
    setIsUpdating(true);
    try {
      const payload: UpdateDealPipeline = {
        deal_name: editDealName || null,
        company_name: editCompanyName || null,
        priority: editPriority || null,
        status: editStatus || null,
        round_type: editRoundType || null,
        sector: editSector || null,
        target_raise: optNum(editTargetRaise),
        pre_money_valuation: optNum(editPreMoneyValuation),
        post_money_valuation: optNum(editPostMoneyValuation),
        expected_ownership: optNum(editExpectedOwnership),
        investment_amount: optNum(editInvestmentAmount),
        is_lead_investor: editIsLeadInvestor,
        other_investors: editOtherInvestors || null,
        first_contact_date: editFirstContactDate || null,
        last_interaction_date: editLastInteractionDate || null,
        next_meeting_date: editNextMeetingDate || null,
        expected_close_date: editExpectedCloseDate || null,
        investment_thesis: editInvestmentThesis || null,
        key_risks: editKeyRisks || null,
        due_diligence_notes: editDueDiligenceNotes || null,
        next_steps: editNextSteps || null,
        rejection_reason: editRejectionReason || null,
        notes: editNotes || null,
      } as UpdateDealPipeline;
      await updateDealPipeline(id, payload);
      await fetchDealPipelines({});
    } finally {
      setIsUpdating(false);
    }
  };

  // ==========================================
  // Delete handler
  // ==========================================

  const handleDelete = async () => {
    if (!item) return;
    if (deleteConfirmText !== item.deal_name) return;
    setIsDeleting(true);
    try {
      await deleteDealPipeline(id);
      router.push('/deal-pipeline');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format helpers
  const fmtCurrency = (val: number | null): string =>
    val != null ? `$${val.toLocaleString()}` : '—';
  const fmtPercent = (val: number | null): string =>
    val != null ? `${val}%` : '—';
  const fmtPlain = (val: string | null): string => val || '—';
  const fmtStatus = (val: string): string =>
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
        <AlertDescription>Deal pipeline entry not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/deal-pipeline">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Deal Pipeline
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <GitPullRequest className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {item.deal_name}
            </h1>
            <p className="text-muted-foreground">
              {getEntityName(item.entity_id)} — {fmtStatus(item.status)}
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
          {/* Core Details */}
          <Card>
            <CardHeader>
              <CardTitle>Core Details</CardTitle>
              <CardDescription>Basic deal information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Entity</p>
                <p className="text-lg font-medium">{getEntityName(item.entity_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deal Name</p>
                <p className="text-lg font-medium">{item.deal_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company Name</p>
                <p className="text-lg font-medium">{fmtPlain(item.company_name)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <p className="text-lg font-medium uppercase">{item.priority}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-medium">{fmtStatus(item.status)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Round Type</p>
                <p className="text-lg font-medium">{item.round_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sector</p>
                <p className="text-lg font-medium">{item.sector}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
              <CardDescription>Investment and valuation figures</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Target Raise</p>
                <p className="text-lg font-medium">{fmtCurrency(item.target_raise)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investment Amount</p>
                <p className="text-lg font-medium">{fmtCurrency(item.investment_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pre-Money Valuation</p>
                <p className="text-lg font-medium">{fmtCurrency(item.pre_money_valuation)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Post-Money Valuation</p>
                <p className="text-lg font-medium">{fmtCurrency(item.post_money_valuation)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Ownership</p>
                <p className="text-lg font-medium">{fmtPercent(item.expected_ownership)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lead Investor</p>
                <p className="text-lg font-medium">{item.is_lead_investor ? 'Yes' : 'No'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Other Investors</p>
                <p className="text-lg font-medium">{fmtPlain(item.other_investors)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
              <CardDescription>Key timeline dates</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">First Contact Date</p>
                <p className="text-lg font-medium">{fmtPlain(item.first_contact_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Interaction Date</p>
                <p className="text-lg font-medium">{fmtPlain(item.last_interaction_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Meeting Date</p>
                <p className="text-lg font-medium">{fmtPlain(item.next_meeting_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected Close Date</p>
                <p className="text-lg font-medium">{fmtPlain(item.expected_close_date)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Notes & Analysis</CardTitle>
              <CardDescription>Investment analysis and notes</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Investment Thesis</p>
                <p className="text-lg font-medium whitespace-pre-wrap">{fmtPlain(item.investment_thesis)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Key Risks</p>
                <p className="text-lg font-medium whitespace-pre-wrap">{fmtPlain(item.key_risks)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Diligence Notes</p>
                <p className="text-lg font-medium whitespace-pre-wrap">{fmtPlain(item.due_diligence_notes)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Steps</p>
                <p className="text-lg font-medium whitespace-pre-wrap">{fmtPlain(item.next_steps)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejection Reason</p>
                <p className="text-lg font-medium whitespace-pre-wrap">{fmtPlain(item.rejection_reason)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-lg font-medium whitespace-pre-wrap">{fmtPlain(item.notes)}</p>
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
          {/* Core Details */}
          <Card>
            <CardHeader>
              <CardTitle>Core Details</CardTitle>
              <CardDescription>Update basic deal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-deal-name">Deal Name</Label>
                  <Input
                    id="edit-deal-name"
                    value={editDealName}
                    onChange={(e) => setEditDealName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company-name">Company Name</Label>
                  <Input
                    id="edit-company-name"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={editPriority} onValueChange={setEditPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STATUS_OPTIONS.map((opt) => (
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
                  <Label htmlFor="edit-round-type">Round Type</Label>
                  <Input
                    id="edit-round-type"
                    value={editRoundType}
                    onChange={(e) => setEditRoundType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sector">Sector</Label>
                  <Input
                    id="edit-sector"
                    value={editSector}
                    onChange={(e) => setEditSector(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
              <CardDescription>Update investment and valuation figures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-target-raise">Target Raise</Label>
                  <Input
                    id="edit-target-raise"
                    type="number"
                    step="0.01"
                    value={editTargetRaise}
                    onChange={(e) => setEditTargetRaise(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-investment-amount">Investment Amount</Label>
                  <Input
                    id="edit-investment-amount"
                    type="number"
                    step="0.01"
                    value={editInvestmentAmount}
                    onChange={(e) => setEditInvestmentAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-pre-money">Pre-Money Valuation</Label>
                  <Input
                    id="edit-pre-money"
                    type="number"
                    step="0.01"
                    value={editPreMoneyValuation}
                    onChange={(e) => setEditPreMoneyValuation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-post-money">Post-Money Valuation</Label>
                  <Input
                    id="edit-post-money"
                    type="number"
                    step="0.01"
                    value={editPostMoneyValuation}
                    onChange={(e) => setEditPostMoneyValuation(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-expected-ownership">Expected Ownership (%)</Label>
                  <Input
                    id="edit-expected-ownership"
                    type="number"
                    step="0.01"
                    value={editExpectedOwnership}
                    onChange={(e) => setEditExpectedOwnership(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-other-investors">Other Investors</Label>
                  <Input
                    id="edit-other-investors"
                    value={editOtherInvestors}
                    onChange={(e) => setEditOtherInvestors(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-is-lead-investor"
                  checked={editIsLeadInvestor}
                  onCheckedChange={(checked) => setEditIsLeadInvestor(checked === true)}
                />
                <Label htmlFor="edit-is-lead-investor">Lead Investor</Label>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
              <CardDescription>Update key timeline dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-first-contact">First Contact Date</Label>
                  <Input
                    id="edit-first-contact"
                    type="date"
                    value={editFirstContactDate}
                    onChange={(e) => setEditFirstContactDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-last-interaction">Last Interaction Date</Label>
                  <Input
                    id="edit-last-interaction"
                    type="date"
                    value={editLastInteractionDate}
                    onChange={(e) => setEditLastInteractionDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-next-meeting">Next Meeting Date</Label>
                  <Input
                    id="edit-next-meeting"
                    type="date"
                    value={editNextMeetingDate}
                    onChange={(e) => setEditNextMeetingDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expected-close">Expected Close Date</Label>
                  <Input
                    id="edit-expected-close"
                    type="date"
                    value={editExpectedCloseDate}
                    onChange={(e) => setEditExpectedCloseDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Notes & Analysis</CardTitle>
              <CardDescription>Update investment analysis and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-investment-thesis">Investment Thesis</Label>
                <Textarea
                  id="edit-investment-thesis"
                  rows={3}
                  value={editInvestmentThesis}
                  onChange={(e) => setEditInvestmentThesis(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-key-risks">Key Risks</Label>
                <Textarea
                  id="edit-key-risks"
                  rows={3}
                  value={editKeyRisks}
                  onChange={(e) => setEditKeyRisks(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dd-notes">Due Diligence Notes</Label>
                <Textarea
                  id="edit-dd-notes"
                  rows={3}
                  value={editDueDiligenceNotes}
                  onChange={(e) => setEditDueDiligenceNotes(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-next-steps">Next Steps</Label>
                <Textarea
                  id="edit-next-steps"
                  rows={2}
                  value={editNextSteps}
                  onChange={(e) => setEditNextSteps(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="edit-rejection-reason"
                  rows={2}
                  value={editRejectionReason}
                  onChange={(e) => setEditRejectionReason(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
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
                  <h4 className="font-medium">Delete this deal pipeline entry</h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this deal pipeline record cannot be recovered.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete">
                    Type <span className="font-semibold">{item.deal_name}</span> to confirm
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
                  disabled={isDeleting || deleteConfirmText !== item.deal_name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Deal Pipeline
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
