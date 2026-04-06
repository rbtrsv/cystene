'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCommitments } from '@/modules/assetmanager/hooks/captable/use-commitments';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { useSecurities } from '@/modules/assetmanager/hooks/captable/use-securities';
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
import { UserCheck, Plus, Loader2, ChevronUp, ChevronDown, Trash2, Check, X, Receipt, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { getNextTransactionReference } from '@/modules/assetmanager/service/captable/security-transaction.service';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the commitments table
 */
type SortField = 'invited_at' | 'pro_rata_amount';
type SortDirection = 'asc' | 'desc' | null;

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

export default function CommitmentsSentPage() {
  const { activeEntity } = useEntities();
  const { fetchFundingRounds, getFundingRoundsByEntity } = useFundingRounds();
  const { securities, fetchSecurities } = useSecurities();
  const {
    commitments,
    isLoading,
    error,
    fetchCommitments,
    reviewCommitment,
    generateTransaction,
    deleteCommitment,
  } = useCommitments();

  // ==========================================
  // Filter state
  // ==========================================
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fundingRoundFilter, setFundingRoundFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Review Dialog state (Approve/Reject)
  const [reviewingCommitment, setReviewingCommitment] = useState<CommitmentDetail | null>(null);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  // Generate Transaction Dialog state
  const [generatingCommitment, setGeneratingCommitment] = useState<CommitmentDetail | null>(null);
  const [txReference, setTxReference] = useState<string>('');
  const [isGenerateSubmitting, setIsGenerateSubmitting] = useState(false);

  // ==========================================
  // Data fetching
  // ==========================================

  // Fetch shared data when active entity changes (funding rounds for filter dropdown, securities for generate-tx dialog)
  useEffect(() => {
    if (activeEntity) {
      fetchFundingRounds({ entity_id: activeEntity.id });
      fetchSecurities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Fetch admin commitments
  useEffect(() => {
    if (activeEntity) {
      fetchCommitments({ entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // ==========================================
  // Derived data
  // ==========================================

  // Filter commitments for the active entity (admin view)
  const entityCommitments = commitments.filter(c => c.entity_id === activeEntity?.id);

  // Get entity-scoped funding rounds for filter dropdown
  const entityRounds = activeEntity ? getFundingRoundsByEntity(activeEntity.id) : [];

  // ==========================================
  // Filter and sort commitments
  // ==========================================

  const filteredCommitments = useMemo(() => {
    let filtered = entityCommitments;

    // Search by stakeholder name (from backend-enriched field)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.stakeholder_name.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Filter by funding round
    if (fundingRoundFilter !== 'all') {
      const roundId = parseInt(fundingRoundFilter);
      filtered = filtered.filter(c => c.funding_round_id === roundId);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'invited_at':
            comparison = a.invited_at.localeCompare(b.invited_at);
            break;
          case 'pro_rata_amount':
            comparison = a.pro_rata_amount - b.pro_rata_amount;
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityCommitments, searchTerm, statusFilter, fundingRoundFilter, sortField, sortDirection]);

  // ==========================================
  // Sort handler
  // ==========================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle: asc → desc → none
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="inline h-4 w-4 ml-1" />
    );
  };

  // ==========================================
  // Action handlers
  // ==========================================

  // Revoke invitation (soft delete)
  const handleRevoke = async (commitmentId: number) => {
    await deleteCommitment(commitmentId);
    if (activeEntity) {
      fetchCommitments({ entity_id: activeEntity.id });
    }
  };

  // Review — Approve or Reject
  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewingCommitment) return;
    setIsReviewSubmitting(true);
    const success = await reviewCommitment(reviewingCommitment.id, { status });
    setIsReviewSubmitting(false);
    if (success) {
      setReviewingCommitment(null);
      if (activeEntity) {
        fetchCommitments({ entity_id: activeEntity.id });
      }
    }
  };

  // Open Generate Transaction dialog — pre-populate reference
  const handleOpenGenerateTransaction = async (commitment: CommitmentDetail) => {
    setGeneratingCommitment(commitment);
    const ref = await getNextTransactionReference('issuance');
    setTxReference(ref);
  };

  // Confirm Generate Transaction — security_id is already on the commitment
  const handleConfirmGenerateTransaction = async () => {
    if (!generatingCommitment || !txReference.trim()) return;
    setIsGenerateSubmitting(true);
    const success = await generateTransaction(generatingCommitment.id, {
      transaction_reference: txReference.trim(),
    });
    setIsGenerateSubmitting(false);
    if (success) {
      setGeneratingCommitment(null);
      if (activeEntity) {
        fetchCommitments({ entity_id: activeEntity.id });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commitments Sent</h1>
          <p className="text-muted-foreground">
            Manage pro-rata commitments for {activeEntity.name}
          </p>
        </div>
        <Link href="/commitments-sent/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite Stakeholders
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by stakeholder name..."
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
            <div className="space-y-2">
              <Label htmlFor="funding-round">Funding Round</Label>
              <Select value={fundingRoundFilter} onValueChange={setFundingRoundFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Rounds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rounds</SelectItem>
                  {entityRounds.map((round) => (
                    <SelectItem key={round.id} value={round.id.toString()}>
                      {round.name}
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
                <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {entityCommitments.length === 0 ? 'No commitments yet' : 'No commitments match filters'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {entityCommitments.length === 0
                    ? 'Invite stakeholders to participate in a funding round'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {entityCommitments.length === 0 && (
                  <Link href="/commitments-sent/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Invite Stakeholders
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stakeholder</TableHead>
                    <TableHead>Funding Round</TableHead>
                    <TableHead>Security</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Pro-Rata %</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('pro_rata_amount')}
                      >
                        Pro-Rata Amount
                        <SortIndicator field="pro_rata_amount" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Committed Amount</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('invited_at')}
                      >
                        Invited At
                        <SortIndicator field="invited_at" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommitments.map((commitment) => (
                    <TableRow key={commitment.id}>
                      <TableCell className="font-medium">
                        {commitment.stakeholder_name}
                      </TableCell>
                      <TableCell>{commitment.funding_round_name}</TableCell>
                      <TableCell>{commitment.security_name}</TableCell>
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
                            {/* Review — only for 'committed' status */}
                            {commitment.status === 'committed' && (
                              <DropdownMenuItem onClick={() => setReviewingCommitment(commitment)}>
                                <Check className="mr-2 h-4 w-4" />
                                Review Commitment
                              </DropdownMenuItem>
                            )}
                            {/* Generate Transaction — only for 'approved' without linked transaction */}
                            {commitment.status === 'approved' && !commitment.transaction_id && (
                              <DropdownMenuItem onClick={() => handleOpenGenerateTransaction(commitment)}>
                                <Receipt className="mr-2 h-4 w-4" />
                                Generate Transaction
                              </DropdownMenuItem>
                            )}
                            {/* Delete — admin can delete any commitment regardless of status */}
                            <DropdownMenuItem onClick={() => handleRevoke(commitment.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Commitment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredCommitments.length} of {entityCommitments.length} commitments
              </p>
            </>
          )}
        </div>

      {/* ==========================================
          Review Dialog (Approve / Reject)
          ========================================== */}
      <Dialog open={!!reviewingCommitment} onOpenChange={(open) => { if (!open) setReviewingCommitment(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Commitment</DialogTitle>
            <DialogDescription>
              Review and approve or reject this commitment.
            </DialogDescription>
          </DialogHeader>
          {reviewingCommitment && (
            <div className="space-y-2 text-sm">
              <div><strong>Stakeholder:</strong> {reviewingCommitment.stakeholder_name}</div>
              <div><strong>Funding Round:</strong> {reviewingCommitment.funding_round_name}</div>
              <div><strong>Type:</strong> {reviewingCommitment.commitment_type ? COMMITMENT_TYPE_LABELS[reviewingCommitment.commitment_type as CommitmentType] : '—'}</div>
              <div><strong>Pro-Rata Amount:</strong> {reviewingCommitment.pro_rata_amount.toLocaleString()}</div>
              <div><strong>Committed Amount:</strong> {reviewingCommitment.committed_amount !== null ? reviewingCommitment.committed_amount.toLocaleString() : '—'}</div>
              {reviewingCommitment.notes && <div><strong>Notes:</strong> {reviewingCommitment.notes}</div>}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewingCommitment(null)}
              disabled={isReviewSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReview('rejected')}
              disabled={isReviewSubmitting}
            >
              {isReviewSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Reject
            </Button>
            <Button
              onClick={() => handleReview('approved')}
              disabled={isReviewSubmitting}
            >
              {isReviewSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==========================================
          Generate Transaction Dialog
          ========================================== */}
      <Dialog open={!!generatingCommitment} onOpenChange={(open) => { if (!open) setGeneratingCommitment(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate ISSUANCE Transaction</DialogTitle>
            <DialogDescription>
              Create a security transaction from this approved commitment.
            </DialogDescription>
          </DialogHeader>
          {generatingCommitment && (
            <div className="space-y-4">
              {/* Commitment details — security is already on the commitment */}
              <div className="space-y-1 text-sm">
                <div><strong>Stakeholder:</strong> {generatingCommitment.stakeholder_name}</div>
                <div><strong>Security:</strong> {generatingCommitment.security_name}</div>
                <div><strong>Committed Amount:</strong> {generatingCommitment.committed_amount !== null ? generatingCommitment.committed_amount.toLocaleString() : '—'}</div>
              </div>

              {/* Units preview */}
              {(() => {
                const sec = securities.find(s => s.id === generatingCommitment.security_id);
                const issuePrice = sec?.issue_price;
                const committedAmount = generatingCommitment.committed_amount || 0;
                const units = issuePrice && issuePrice > 0 ? Math.floor(committedAmount / issuePrice) : 0;
                return (
                  <div className="text-sm bg-muted/50 p-3 rounded-md">
                    <strong>Units to issue:</strong> {units.toLocaleString()}
                  </div>
                );
              })()}

              {/* Transaction reference */}
              <div className="space-y-2">
                <Label>Transaction Reference</Label>
                <Input
                  value={txReference}
                  onChange={(e) => setTxReference(e.target.value)}
                  placeholder="e.g. TXN-20260329-001"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGeneratingCommitment(null)}
              disabled={isGenerateSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmGenerateTransaction}
              disabled={!txReference.trim() || isGenerateSubmitting}
            >
              {isGenerateSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
