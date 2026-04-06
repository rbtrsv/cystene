'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSecurityTransactions } from '@/modules/assetmanager/hooks/captable/use-security-transactions';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { useStakeholders } from '@/modules/assetmanager/hooks/entity/use-stakeholders';
import { useSecurities } from '@/modules/assetmanager/hooks/captable/use-securities';
import { getTransactionTypeLabel, TRANSACTION_TYPE_LABELS } from '@/modules/assetmanager/schemas/captable/security-transaction.schemas';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
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
import { ArrowLeftRight, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the transactions table
 */
type SortField = 'transaction_date' | 'transaction_reference';
type SortDirection = 'asc' | 'desc' | null;

export default function SecurityTransactionsPage() {
  const router = useRouter();
  const { activeEntity, getEntityName } = useEntities();
  const { fundingRounds, fetchFundingRounds, getFundingRoundsByEntity } = useFundingRounds();
  const { stakeholders, fetchStakeholders } = useStakeholders();
  const { securities, fetchSecurities } = useSecurities();
  const { transactions, isLoading, error, fetchSecurityTransactions } = useSecurityTransactions();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');
  const [fundingRoundFilter, setFundingRoundFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch funding rounds when active entity changes
  useEffect(() => {
    if (activeEntity) {
      fetchFundingRounds({ entity_id: activeEntity.id });
      fetchStakeholders({ entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Fetch securities and transactions when funding rounds are loaded
  useEffect(() => {
    if (activeEntity) {
      const entityRounds = getFundingRoundsByEntity(activeEntity.id);
      if (entityRounds.length > 0) {
        fetchSecurities();
        fetchSecurityTransactions();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity, fundingRounds]);

  // Filter transactions for the active entity
  const entityTransactions = transactions.filter(t => t.entity_id === activeEntity?.id);

  // Get entity-scoped funding rounds for filter dropdown
  const entityRounds = activeEntity ? getFundingRoundsByEntity(activeEntity.id) : [];

  // Get stakeholder name by ID for display (derives name from source entity)
  const getStakeholderName = (stakeholderId: number) => {
    const stakeholder = stakeholders.find(s => s.id === stakeholderId);
    return stakeholder ? getEntityName(stakeholder.source_entity_id) : 'Unknown Stakeholder';
  };

  // Get security name by ID for display
  const getSecurityName = (securityId: number | null) => {
    if (securityId === null) return 'Fund-level';
    const security = securities.find(s => s.id === securityId);
    return security ? security.security_name : 'Unknown Security';
  };

  // Get funding round name by ID for display
  const getFundingRoundName = (fundingRoundId: number) => {
    const round = fundingRounds.find(r => r.id === fundingRoundId);
    return round ? round.name : 'Unknown Round';
  };

  // ==========================================
  // Filter and sort transactions
  // ==========================================

  const filteredTransactions = useMemo(() => {
    let filtered = entityTransactions;

    // Search by stakeholder name or transaction reference
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        getStakeholderName(t.stakeholder_id).toLowerCase().includes(term) ||
        t.transaction_reference.toLowerCase().includes(term)
      );
    }

    // Filter by transaction type
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === transactionTypeFilter);
    }

    // Filter by funding round
    if (fundingRoundFilter !== 'all') {
      const roundId = parseInt(fundingRoundFilter);
      filtered = filtered.filter(t => t.funding_round_id === roundId);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'transaction_date':
            comparison = a.transaction_date.localeCompare(b.transaction_date);
            break;
          case 'transaction_reference':
            comparison = a.transaction_reference.localeCompare(b.transaction_reference);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityTransactions, searchTerm, transactionTypeFilter, fundingRoundFilter, sortField, sortDirection]);

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
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage security transactions for {activeEntity.name}
          </p>
        </div>
        <Link href="/security-transactions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Transaction
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by stakeholder or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Transaction Type</Label>
              <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
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
          {filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {entityTransactions.length === 0 ? 'No transactions yet' : 'No transactions match filters'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {entityTransactions.length === 0
                    ? 'Create your first security transaction to get started'
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {entityTransactions.length === 0 && (
                  <Link href="/security-transactions/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Transaction
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
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('transaction_date')}
                      >
                        Date
                        <SortIndicator field="transaction_date" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('transaction_reference')}
                      >
                        Reference
                        <SortIndicator field="transaction_reference" />
                      </Button>
                    </TableHead>
                    <TableHead>Stakeholder</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Security</TableHead>
                    <TableHead className="text-right">Units Dr</TableHead>
                    <TableHead className="text-right">Units Cr</TableHead>
                    <TableHead className="text-right">Amount Dr</TableHead>
                    <TableHead className="text-right">Amount Cr</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((txn) => (
                    <TableRow
                      key={txn.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/security-transactions/${txn.id}/details`)}
                    >
                      <TableCell>{txn.transaction_date}</TableCell>
                      <TableCell className="font-medium">{txn.transaction_reference}</TableCell>
                      <TableCell>{getStakeholderName(txn.stakeholder_id)}</TableCell>
                      <TableCell>{getFundingRoundName(txn.funding_round_id)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getTransactionTypeLabel(txn.transaction_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getSecurityName(txn.security_id)}</TableCell>
                      <TableCell className="text-right">
                        {txn.units_debit > 0 ? txn.units_debit.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {txn.units_credit > 0 ? txn.units_credit.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {txn.amount_debit > 0 ? txn.amount_debit.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {txn.amount_credit > 0 ? txn.amount_credit.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/security-transactions/${txn.id}/details`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/security-transactions/${txn.id}/details?tab=edit`);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
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
                Showing {filteredTransactions.length} of {entityTransactions.length} transactions
              </p>
            </>
          )}
        </div>
    </div>
  );
}
