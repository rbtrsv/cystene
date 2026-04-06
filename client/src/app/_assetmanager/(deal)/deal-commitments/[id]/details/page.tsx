'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, HandCoins, Loader2, Pencil, Trash2 } from 'lucide-react';

import { useDealCommitments } from '@/modules/assetmanager/hooks/deal/use-deal-commitments';
import { useDeals } from '@/modules/assetmanager/hooks/deal/use-deals';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';

export default function DealCommitmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const commitmentId = parseInt(params.id as string, 10);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';

  const {
    dealCommitments,
    isLoading,
    error,
    fetchDealCommitment,
    updateDealCommitment,
    deleteDealCommitment,
    fetchDealCommitments,
  } = useDealCommitments();
  const { getDealById } = useDeals();

  const commitment = dealCommitments.find((item) => item.id === commitmentId);
  const deal = commitment ? getDealById(commitment.deal_id) : null;

  const [editType, setEditType] = useState<'soft' | 'firm'>('soft');
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (commitment) {
      setEditType(commitment.commitment_type);
      setEditAmount(commitment.amount.toString());
      setEditNotes(commitment.notes || '');
    }
  }, [commitment]);

  useEffect(() => {
    if (commitmentId && !commitment) {
      fetchDealCommitment(commitmentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitmentId]);

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

  if (!commitment) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Deal commitment not found</AlertDescription>
      </Alert>
    );
  }

  const deleteConfirmTarget = `${commitment.amount}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/deal-commitments">
            <Button variant="ghost" size="sm" className="mb-2">← Back to Deal Commitments</Button>
          </Link>
          <div className="flex items-center gap-3">
            <HandCoins className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{deal?.name || `Deal #${commitment.deal_id}`}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={commitment.commitment_type === 'firm' ? 'default' : 'secondary'}>
                  {commitment.commitment_type.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">${commitment.amount.toLocaleString()}</span>
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
              <CardTitle>Commitment Details</CardTitle>
              <CardDescription>Summary of this commitment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Deal</p>
                  <p className="text-lg font-medium">{deal?.name || commitment.deal_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-lg font-medium">${commitment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="text-lg font-medium">{commitment.commitment_type.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entity ID</p>
                  <p className="text-lg font-medium">{commitment.entity_id}</p>
                </div>
              </div>
              {commitment.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-lg font-medium">{commitment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Commitment</CardTitle>
              <CardDescription>Update this commitment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commitment-type">Commitment Type</Label>
                  <Select value={editType} onValueChange={(value) => setEditType(value as 'soft' | 'firm')}>
                    <SelectTrigger id="commitment-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft">Soft</SelectItem>
                      <SelectItem value="firm">Firm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commitment-amount">Amount *</Label>
                  <Input
                    id="commitment-amount"
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commitment-notes">Notes</Label>
                <Textarea id="commitment-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
              </div>
              <Button
                onClick={async () => {
                  setIsUpdating(true);
                  try {
                    await updateDealCommitment(commitmentId, {
                      commitment_type: editType,
                      amount: editAmount ? parseFloat(editAmount) : undefined,
                      notes: editNotes || null,
                    });
                    await fetchDealCommitments({ deal_id: commitment.deal_id });
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
                  <h4 className="font-medium">Delete this commitment</h4>
                  <p className="text-sm text-muted-foreground">Once deleted, this commitment cannot be recovered.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-commitment">
                    Type <span className="font-semibold">{deleteConfirmTarget}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-commitment"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Commitment amount"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmText !== deleteConfirmTarget) return;
                    setIsDeleting(true);
                    try {
                      await deleteDealCommitment(commitmentId);
                      router.push('/deal-commitments');
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
                      Delete Commitment
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
