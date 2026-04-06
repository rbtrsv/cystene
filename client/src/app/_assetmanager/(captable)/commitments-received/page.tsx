'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCommitments } from '@/modules/assetmanager/hooks/captable/use-commitments';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import {
  COMMITMENT_STATUS_LABELS,
  COMMITMENT_TYPE_LABELS,
  type CommitmentDetail,
  type CommitmentStatus,
  type CommitmentType,
} from '@/modules/assetmanager/schemas/captable/commitment.schemas';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/shadcnui/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/modules/shadcnui/components/ui/dropdown-menu';
import { Loader2, Check, X, MessageSquare, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Badge variant based on commitment status
 */
const getStatusVariant = (status: CommitmentStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'approved':
      return 'default';
    case 'committed':
      return 'secondary';
    case 'invited':
      return 'outline';
    case 'passed':
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function CommitmentsReceivedPage() {
  const { activeEntity } = useEntities();
  const {
    commitments,
    isLoading,
    error,
    fetchCommitments,
    respondToCommitment,
  } = useCommitments();

  // ==========================================
  // State
  // ==========================================
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Respond Dialog state
  const [respondingCommitment, setRespondingCommitment] = useState<CommitmentDetail | null>(null);
  const [responseType, setResponseType] = useState<CommitmentType | ''>('');
  const [partialAmount, setPartialAmount] = useState<string>('');
  const [respondNotes, setRespondNotes] = useState<string>('');
  const [isRespondSubmitting, setIsRespondSubmitting] = useState(false);

  // ==========================================
  // Data fetching
  // ==========================================

  // Fetch commitments where activeEntity is the stakeholder (source_entity_id)
  // Names come from backend enrichment — no need to fetch funding rounds for all entities
  useEffect(() => {
    if (activeEntity) {
      fetchCommitments({ source_entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // ==========================================
  // Filter commitments
  // ==========================================

  const filteredCommitments = useMemo(() => {
    let filtered = commitments;

    // Search by funding round name (from backend-enriched field)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.funding_round_name.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitments, searchTerm, statusFilter]);

  // ==========================================
  // Action handlers
  // ==========================================

  // Open Respond dialog
  const handleOpenRespond = (commitment: CommitmentDetail) => {
    setRespondingCommitment(commitment);
    setResponseType('');
    setPartialAmount('');
    setRespondNotes('');
  };

  // Submit Respond — Commit or Pass
  const handleSubmitRespond = async (action: 'committed' | 'passed') => {
    if (!respondingCommitment) return;
    setIsRespondSubmitting(true);

    // Build response payload
    const payload: {
      status: 'committed' | 'passed';
      commitment_type?: CommitmentType | null;
      committed_amount?: number | null;
      notes?: string | null;
    } = { status: action };

    if (action === 'committed') {
      if (!responseType) {
        setIsRespondSubmitting(false);
        return;
      }
      payload.commitment_type = responseType;

      // Set committed_amount based on type
      if (responseType === 'full_pro_rata') {
        payload.committed_amount = respondingCommitment.pro_rata_amount;
      } else if (responseType === 'partial' || responseType === 'over_subscription') {
        payload.committed_amount = parseFloat(partialAmount);
      }
    }

    if (respondNotes.trim()) {
      payload.notes = respondNotes.trim();
    }

    const success = await respondToCommitment(respondingCommitment.id, payload);
    setIsRespondSubmitting(false);

    if (success) {
      setRespondingCommitment(null);
      // Refresh stakeholder commitments
      if (activeEntity) {
        fetchCommitments({ source_entity_id: activeEntity.id });
      }
    }
  };

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

  if (!activeEntity) {
    return (
      <Alert>
        <AlertDescription>
          Please select an entity first.{' '}
          <Link href="/entities" className="underline">
            Go to Entities
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commitments Received</h1>
        <p className="text-muted-foreground">
          Commitments received by {activeEntity.name} as a stakeholder in other entities
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by funding round..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(COMMITMENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table or empty state */}
          {filteredCommitments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {commitments.length === 0
                    ? 'No commitments received'
                    : 'No commitments match filters'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {commitments.length === 0
                    ? 'You have not been invited to any funding rounds yet'
                    : 'Try adjusting your search or filter criteria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funding Round</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Pro-Rata %</TableHead>
                    <TableHead className="text-right">Pro-Rata Amount</TableHead>
                    <TableHead className="text-right">Committed Amount</TableHead>
                    <TableHead>Invited At</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommitments.map((commitment) => (
                    <TableRow key={commitment.id}>
                      <TableCell className="font-medium">
                        {commitment.funding_round_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(commitment.status)}>
                          {COMMITMENT_STATUS_LABELS[commitment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {commitment.commitment_type
                          ? COMMITMENT_TYPE_LABELS[commitment.commitment_type as CommitmentType]
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {commitment.pro_rata_percentage.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {commitment.pro_rata_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {commitment.committed_amount !== null
                          ? commitment.committed_amount.toLocaleString()
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {new Date(commitment.invited_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Respond — only for 'invited' status */}
                            {commitment.status === 'invited' ? (
                              <DropdownMenuItem onClick={() => handleOpenRespond(commitment)}>
                                <Check className="mr-2 h-4 w-4" />
                                Respond
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled>
                                No actions available
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredCommitments.length} of {commitments.length} commitments
              </p>
            </>
          )}
        </div>

      {/* ==========================================
          Respond Dialog (Commit / Pass)
          ========================================== */}
      <Dialog open={!!respondingCommitment} onOpenChange={(open) => { if (!open) setRespondingCommitment(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Commitment Invitation</DialogTitle>
            <DialogDescription>
              Choose to commit or pass on this funding round invitation.
            </DialogDescription>
          </DialogHeader>
          {respondingCommitment && (
            <div className="space-y-4">
              {/* Commitment details */}
              <div className="space-y-1 text-sm">
                <div><strong>Funding Round:</strong> {respondingCommitment.funding_round_name}</div>
                <div><strong>Your Pro-Rata Entitlement:</strong> {respondingCommitment.pro_rata_amount.toLocaleString()} ({respondingCommitment.pro_rata_percentage.toFixed(2)}%)</div>
              </div>

              {/* Commitment type selection */}
              <div className="space-y-2">
                <Label>Commitment Type</Label>
                <Select value={responseType} onValueChange={(v) => setResponseType(v as CommitmentType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select commitment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_pro_rata">
                      Full Pro-Rata ({respondingCommitment.pro_rata_amount.toLocaleString()})
                    </SelectItem>
                    <SelectItem value="partial">Partial Amount</SelectItem>
                    <SelectItem value="over_subscription">Over-Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount input — shown for partial and over_subscription */}
              {(responseType === 'partial' || responseType === 'over_subscription') && (
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder={responseType === 'partial'
                      ? `Less than ${respondingCommitment.pro_rata_amount.toLocaleString()}`
                      : `More than ${respondingCommitment.pro_rata_amount.toLocaleString()}`
                    }
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add any notes..."
                  value={respondNotes}
                  onChange={(e) => setRespondNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRespondingCommitment(null)}
              disabled={isRespondSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSubmitRespond('passed')}
              disabled={isRespondSubmitting}
            >
              {isRespondSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Pass
            </Button>
            <Button
              onClick={() => handleSubmitRespond('committed')}
              disabled={
                isRespondSubmitting
                || !responseType
                || ((responseType === 'partial' || responseType === 'over_subscription') && !partialAmount)
              }
            >
              {isRespondSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Commit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
