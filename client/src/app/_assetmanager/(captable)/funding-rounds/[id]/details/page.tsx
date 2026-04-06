'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { getRoundTypeLabel } from '@/modules/assetmanager/schemas/captable/funding-round.schemas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, CircleDollarSign, Calendar, Target, TrendingUp, Pencil, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { useEffect, useState } from 'react';

export default function FundingRoundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fundingRoundId = parseInt(params.id as string);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const { fundingRounds, isLoading, error, fetchFundingRound, updateFundingRound, deleteFundingRound, fetchFundingRounds } = useFundingRounds();
  const { entities, getEntityName } = useEntities();

  const fundingRound = fundingRounds.find(r => r.id === fundingRoundId);

  // Settings state
  const [editName, setEditName] = useState('');
  const [editRoundType, setEditRoundType] = useState<string>('');
  const [editDate, setEditDate] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState<string>('');
  const [editRaisedAmount, setEditRaisedAmount] = useState<string>('');
  const [editPreMoneyValuation, setEditPreMoneyValuation] = useState<string>('');
  const [editPostMoneyValuation, setEditPostMoneyValuation] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when funding round loads
  useEffect(() => {
    if (fundingRound) {
      setEditName(fundingRound.name);
      setEditRoundType(fundingRound.round_type);
      setEditDate(fundingRound.date);
      setEditTargetAmount(fundingRound.target_amount.toString());
      setEditRaisedAmount(fundingRound.raised_amount.toString());
      setEditPreMoneyValuation(fundingRound.pre_money_valuation?.toString() || '');
      setEditPostMoneyValuation(fundingRound.post_money_valuation?.toString() || '');
    }
  }, [fundingRound]);

  // Fetch funding round if not in store
  useEffect(() => {
    if (fundingRoundId && !fundingRound) {
      fetchFundingRound(fundingRoundId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fundingRoundId]);

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

  if (!fundingRound) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Funding round not found</AlertDescription>
      </Alert>
    );
  }

  // Calculate progress percentage
  const progressPercent = fundingRound.target_amount > 0
    ? Math.min((fundingRound.raised_amount / fundingRound.target_amount) * 100, 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/funding-rounds">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Funding Rounds
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <CircleDollarSign className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{fundingRound.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {getRoundTypeLabel(fundingRound.round_type)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getEntityName(fundingRound.entity_id)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <CircleDollarSign className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funding Round Details</CardTitle>
              <CardDescription>
                Key information about this funding round
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Round Name</p>
                  <p className="text-lg font-medium">{fundingRound.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Round Type</p>
                  <p className="text-lg font-medium">{getRoundTypeLabel(fundingRound.round_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entity</p>
                  <p className="text-lg font-medium">{getEntityName(fundingRound.entity_id)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="text-lg font-medium">
                      {new Date(fundingRound.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Target Amount</p>
                      <p className="text-lg font-medium">
                        ${fundingRound.target_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Raised Amount</p>
                      <p className="text-lg font-medium">
                        ${fundingRound.raised_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {(fundingRound.pre_money_valuation || fundingRound.post_money_valuation) && (
                <div className="pt-4 border-t grid grid-cols-2 gap-4">
                  {fundingRound.pre_money_valuation && (
                    <div>
                      <p className="text-sm text-muted-foreground">Pre-money Valuation</p>
                      <p className="text-lg font-medium">
                        ${fundingRound.pre_money_valuation.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {fundingRound.post_money_valuation && (
                    <div>
                      <p className="text-sm text-muted-foreground">Post-money Valuation</p>
                      <p className="text-lg font-medium">
                        ${fundingRound.post_money_valuation.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(fundingRound.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Funding Round</CardTitle>
              <CardDescription>
                Update funding round details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="round-name">Round Name *</Label>
                  <Input
                    id="round-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Round name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="round-type">Round Type *</Label>
                  <Select
                    value={editRoundType}
                    onValueChange={setEditRoundType}
                  >
                    <SelectTrigger id="round-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="pre_series_a">Pre-Series A</SelectItem>
                      <SelectItem value="series_a">Series A</SelectItem>
                      <SelectItem value="series_b">Series B</SelectItem>
                      <SelectItem value="series_c">Series C</SelectItem>
                      <SelectItem value="series_d">Series D</SelectItem>
                      <SelectItem value="debt">Debt</SelectItem>
                      <SelectItem value="convertible">Convertible</SelectItem>
                      <SelectItem value="safe">SAFE</SelectItem>
                      <SelectItem value="bridge">Bridge</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="round-date">Date *</Label>
                  <Input
                    id="round-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-amount">Target Amount *</Label>
                  <Input
                    id="target-amount"
                    type="number"
                    step="0.01"
                    value={editTargetAmount}
                    onChange={(e) => setEditTargetAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="raised-amount">Raised Amount</Label>
                  <Input
                    id="raised-amount"
                    type="number"
                    step="0.01"
                    value={editRaisedAmount}
                    onChange={(e) => setEditRaisedAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pre-money">Pre-money Valuation</Label>
                  <Input
                    id="pre-money"
                    type="number"
                    step="0.01"
                    value={editPreMoneyValuation}
                    onChange={(e) => setEditPreMoneyValuation(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-money">Post-money Valuation</Label>
                  <Input
                    id="post-money"
                    type="number"
                    step="0.01"
                    value={editPostMoneyValuation}
                    onChange={(e) => setEditPostMoneyValuation(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editName.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    await updateFundingRound(fundingRoundId, {
                      name: editName.trim(),
                      round_type: editRoundType as 'seed' | 'pre_series_a' | 'series_a' | 'series_b' | 'series_c' | 'series_d' | 'debt' | 'convertible' | 'safe' | 'bridge' | 'secondary' | 'other',
                      date: editDate,
                      target_amount: parseFloat(editTargetAmount) || 0,
                      raised_amount: parseFloat(editRaisedAmount) || 0,
                      pre_money_valuation: editPreMoneyValuation ? parseFloat(editPreMoneyValuation) : null,
                      post_money_valuation: editPostMoneyValuation ? parseFloat(editPostMoneyValuation) : null,
                    });
                    await fetchFundingRounds({ entity_id: fundingRound?.entity_id });
                  } catch (error) {
                    console.error('Failed to update funding round:', error);
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
                  <h4 className="font-medium">Delete this funding round</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete a funding round, there is no going back. This will permanently delete the funding round and all associated data.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-round">
                    Type <span className="font-semibold">{fundingRound?.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-round"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Funding round name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== fundingRound?.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      await deleteFundingRound(fundingRoundId);
                      router.push('/funding-rounds');
                    } catch (error) {
                      console.error('Failed to delete funding round:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== fundingRound?.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Funding Round
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
