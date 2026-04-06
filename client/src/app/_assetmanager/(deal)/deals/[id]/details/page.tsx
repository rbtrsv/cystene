'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Handshake, Loader2, Play, Pencil, Trash2 } from 'lucide-react';

import { useDeals } from '@/modules/assetmanager/hooks/deal/use-deals';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { getDealTypeLabel, getDealStatusLabel, type DealStatus, type DealExecuteInput } from '@/modules/assetmanager/schemas/deal/deal.schemas';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

// Status → allowed manual transitions (mirrors backend ALLOWED_TRANSITIONS)
const ALLOWED_TRANSITIONS: Record<string, DealStatus[]> = {
  draft: ['active'],
  active: ['closed', 'cancelled'],
  closed: ['active', 'cancelled'],
};

// Status badge color mapping
const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  active: 'default',
  closed: 'secondary',
  executed: 'default',
  cancelled: 'destructive',
};

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = parseInt(params.id as string, 10);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';

  const { deals, isLoading, error, fetchDeal, updateDeal, deleteDeal, fetchDeals, updateDealStatus, executeDeal } = useDeals();
  const { getEntityName } = useEntities();

  const deal = deals.find((item) => item.id === dealId);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('fundraising');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editMinInvestment, setEditMinInvestment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Status transition state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Execute form state
  const [showExecuteForm, setShowExecuteForm] = useState(false);
  const [executeRoundType, setExecuteRoundType] = useState('seed');
  const [executeSecurityName, setExecuteSecurityName] = useState('');
  const [executeSecurityCode, setExecuteSecurityCode] = useState('');
  const [executeSecurityType, setExecuteSecurityType] = useState('preferred');
  const [executeStakeholderType, setExecuteStakeholderType] = useState('limited_partner');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (deal) {
      setEditName(deal.name);
      setEditType(deal.deal_type);
      setEditStartDate(deal.start_date || '');
      setEditEndDate(deal.end_date || '');
      setEditTargetAmount(deal.target_amount?.toString() || '');
      setEditMinInvestment(deal.minimum_investment?.toString() || '');
    }
  }, [deal]);

  useEffect(() => {
    if (dealId && !deal) {
      fetchDeal(dealId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

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

  if (!deal) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Deal not found</AlertDescription>
      </Alert>
    );
  }

  const deleteConfirmTarget = deal.name;

  // Status transition helpers
  const allowedTransitions = ALLOWED_TRANSITIONS[deal.status] || [];
  const canExecute = (deal.status === 'active' || deal.status === 'closed') && deal.deal_type === 'fundraising';

  const handleStatusChange = async (newStatus: DealStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateDealStatus(dealId, newStatus);
      await fetchDeals({ entity_id: deal.entity_id });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setExecuteResult(null);
    try {
      const data: DealExecuteInput = {
        round_type: executeRoundType,
        security_name: executeSecurityName,
        security_code: executeSecurityCode,
        security_type: executeSecurityType,
        stakeholder_type: executeStakeholderType,
      };
      const result = await executeDeal(dealId, data);
      if (result) {
        setExecuteResult({ success: true, message: result.message });
        setShowExecuteForm(false);
        await fetchDeals({ entity_id: deal.entity_id });
      } else {
        setExecuteResult({ success: false, message: 'Execution failed. Check error details above.' });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/deals">
            <Button variant="ghost" size="sm" className="mb-2">← Back to Deals</Button>
          </Link>
          <div className="flex items-center gap-3">
            <Handshake className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{deal.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{getDealTypeLabel(deal.deal_type)}</Badge>
                <Badge variant={STATUS_BADGE_VARIANT[deal.status] || 'outline'}>{getDealStatusLabel(deal.status)}</Badge>
                <span className="text-sm text-muted-foreground">{getEntityName(deal.entity_id)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deal Details</CardTitle>
              <CardDescription>Summary of core deal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="text-lg font-medium">{getDealTypeLabel(deal.deal_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Amount</p>
                  <p className="text-lg font-medium">{deal.target_amount ? `$${deal.target_amount.toLocaleString()}` : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Minimum Investment</p>
                  <p className="text-lg font-medium">{deal.minimum_investment ? `$${deal.minimum_investment.toLocaleString()}` : '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Window</p>
                  <p className="text-lg font-medium">{deal.start_date} - {deal.end_date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Soft Commitments</p>
                  <p className="text-lg font-medium">${deal.soft_commitments.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Firm Commitments</p>
                  <p className="text-lg font-medium">${deal.firm_commitments.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Transition Card */}
          {allowedTransitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status Transition</CardTitle>
                <CardDescription>Change the deal lifecycle status. Current: {getDealStatusLabel(deal.status)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {allowedTransitions.map((status) => (
                    <Button
                      key={status}
                      variant={status === 'cancelled' ? 'destructive' : 'outline'}
                      onClick={() => handleStatusChange(status)}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {getDealStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Execute Deal Card — only for fundraising deals in active/closed status */}
          {canExecute && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Execute Deal
                </CardTitle>
                <CardDescription>
                  Create FundingRound, Security, Stakeholders, and SecurityTransactions from firm commitments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showExecuteForm ? (
                  <Button onClick={() => setShowExecuteForm(true)}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Execution
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="exec-round-type">Round Type</Label>
                        <Select value={executeRoundType} onValueChange={setExecuteRoundType}>
                          <SelectTrigger id="exec-round-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                            <SelectItem value="seed">Seed</SelectItem>
                            <SelectItem value="series_a">Series A</SelectItem>
                            <SelectItem value="series_b">Series B</SelectItem>
                            <SelectItem value="series_c">Series C</SelectItem>
                            <SelectItem value="bridge">Bridge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exec-security-type">Security Type</Label>
                        <Select value={executeSecurityType} onValueChange={setExecuteSecurityType}>
                          <SelectTrigger id="exec-security-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="common">Common</SelectItem>
                            <SelectItem value="preferred">Preferred</SelectItem>
                            <SelectItem value="convertible">Convertible</SelectItem>
                            <SelectItem value="safe">SAFE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exec-security-name">Security Name</Label>
                        <Input
                          id="exec-security-name"
                          placeholder="e.g. Series A Preferred"
                          value={executeSecurityName}
                          onChange={(e) => setExecuteSecurityName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exec-security-code">Security Code</Label>
                        <Input
                          id="exec-security-code"
                          placeholder="e.g. SER-A"
                          value={executeSecurityCode}
                          onChange={(e) => setExecuteSecurityCode(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exec-stakeholder-type">Default Stakeholder Type</Label>
                        <Select value={executeStakeholderType} onValueChange={setExecuteStakeholderType}>
                          <SelectTrigger id="exec-stakeholder-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="limited_partner">Limited Partner</SelectItem>
                            <SelectItem value="general_partner">General Partner</SelectItem>
                            <SelectItem value="investor">Investor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleExecute}
                        disabled={isExecuting || !executeSecurityName || !executeSecurityCode}
                      >
                        {isExecuting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Execute Deal
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setShowExecuteForm(false)} disabled={isExecuting}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Execution Result Alert */}
          {executeResult && (
            <Alert variant={executeResult.success ? 'default' : 'destructive'}>
              {executeResult.success && <CheckCircle className="h-4 w-4" />}
              <AlertDescription>{executeResult.message}</AlertDescription>
            </Alert>
          )}

          {/* Executed state — show linked FundingRound */}
          {deal.status === 'executed' && deal.funding_round_id && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This deal has been executed. Linked FundingRound ID: {deal.funding_round_id}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Deal</CardTitle>
              <CardDescription>Update core settings for this deal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deal-name">Name *</Label>
                  <Input id="deal-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-type">Deal Type</Label>
                  <Select value={editType} onValueChange={setEditType}>
                    <SelectTrigger id="deal-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fundraising">Fundraising</SelectItem>
                      <SelectItem value="acquisition">Acquisition</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="debt">Debt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-start-date">Start Date *</Label>
                  <Input id="deal-start-date" type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-end-date">End Date *</Label>
                  <Input id="deal-end-date" type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-target-amount">Target Amount</Label>
                  <Input
                    id="deal-target-amount"
                    type="number"
                    step="0.01"
                    value={editTargetAmount}
                    onChange={(e) => setEditTargetAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-min-investment">Minimum Investment</Label>
                  <Input
                    id="deal-min-investment"
                    type="number"
                    step="0.01"
                    value={editMinInvestment}
                    onChange={(e) => setEditMinInvestment(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  setIsUpdating(true);
                  try {
                    await updateDeal(dealId, {
                      name: editName,
                      deal_type: editType as 'fundraising' | 'acquisition' | 'secondary' | 'debt',
                      start_date: editStartDate,
                      end_date: editEndDate,
                      target_amount: editTargetAmount ? parseFloat(editTargetAmount) : null,
                      minimum_investment: editMinInvestment ? parseFloat(editMinInvestment) : null,
                    });
                    await fetchDeals({ entity_id: deal.entity_id });
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
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible and destructive actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this deal</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete a deal, there is no going back.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-deal">
                    Type <span className="font-semibold">{deleteConfirmTarget}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-deal"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Deal name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmText !== deleteConfirmTarget) return;
                    setIsDeleting(true);
                    try {
                      await deleteDeal(dealId);
                      router.push('/deals');
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
                      Delete Deal
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
