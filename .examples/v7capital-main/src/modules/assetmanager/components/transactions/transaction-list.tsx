'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTransactions } from '@/modules/assetmanager/hooks/use-transactions';
import { useStakeholders } from '@/modules/assetmanager/hooks/use-stakeholders';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
import { useSecurities } from '@/modules/assetmanager/hooks/use-securities';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { formatCurrency } from '@/modules/assetmanager/utils/currency.utils';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/modules/shadcnui/components/ui/table';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/modules/shadcnui/components/ui/alert-dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/modules/shadcnui/components/ui/tooltip';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Pencil, Trash2, Eye, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { z } from 'zod';
import { type Transaction, transactionTypeEnum } from '@/modules/assetmanager/schemas/transactions.schemas';

type TransactionType = z.infer<typeof transactionTypeEnum>;

interface TransactionListProps {
  stakeholderId?: number;
  securityId?: number;
}

export default function TransactionList({ stakeholderId, securityId }: TransactionListProps) {
  const router = useRouter();
  const { 
    transactions, 
    isLoading, 
    error, 
    fetchTransactions,
    fetchTransactionsByStakeholder,
    fetchTransactionsBySecurity,
    deleteTransaction,
    clearError,
    getTransactionTypeLabel,
    formatUnits,
    formatDate,
    getTransactionDirection
  } = useTransactions();
  
  const { 
    stakeholders, 
    fetchStakeholders,
    getStakeholderName 
  } = useStakeholders();
  
  const { 
    rounds, 
    fetchRounds,
    getRoundName 
  } = useRounds();
  
  const {
    securities,
    fetchSecurities,
    getSecurityById
  } = useSecurities();

  const { funds, fetchFunds } = useFunds();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [filterFund, setFilterFund] = useState<string>('ALL');
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  
  useEffect(() => {
    const loadTransactions = async () => {
      if (stakeholderId) {
        await fetchTransactionsByStakeholder(stakeholderId);
      } else if (securityId) {
        await fetchTransactionsBySecurity(securityId);
      } else {
        await fetchTransactions();
      }
    };
    
    loadTransactions();
  }, [fetchTransactions, fetchTransactionsByStakeholder, fetchTransactionsBySecurity, stakeholderId, securityId]);

  // Fetch stakeholders for name mapping
  useEffect(() => {
    fetchStakeholders();
  }, [fetchStakeholders]);

  // Fetch rounds for name mapping
  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  // Fetch securities for currency information
  useEffect(() => {
    fetchSecurities();
  }, [fetchSecurities]);

  // Fetch funds for filtering
  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);
  
  // Helper function to get security's currency for a transaction
  const getTransactionCurrency = (transaction: Transaction): string => {
    const security = getSecurityById(transaction.securityId);
    return security?.currency || 'USD';
  };
  
  // Filter transactions based on search term and type filter
  const filteredTransactions = transactions.filter(transaction => {
    const stakeholderName = getStakeholderName(transaction.stakeholderId);
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = searchTerm === '' || (
      (transaction.transactionReference &&
       transaction.transactionReference.toLowerCase().includes(searchLower)) ||
      (stakeholderName &&
       stakeholderName.toLowerCase().includes(searchLower))
    );

    const matchesType = filterType === 'ALL' ? true : transaction.transactionType === filterType;
    const matchesFund = filterFund === 'ALL' ? true : transaction.fundId.toString() === filterFund;

    return matchesSearch && matchesType && matchesFund;
  }).sort((a, b) => {
    // Sort by date if sort order is specified
    if (sortOrder === 'none') return 0;
    
    const dateA = new Date(a.transactionDate).getTime();
    const dateB = new Date(b.transactionDate).getTime();
    
    if (sortOrder === 'asc') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  
  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterFund]);
  
  const handleDelete = async (transaction: Transaction) => {
    if (transaction.id) {
      const success = await deleteTransaction(transaction.id);
      if (success) {
        setTransactionToDelete(null);
      }
    }
  };
  
  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/transactions/${id}`);
  };
  
  const handleEdit = (id: number) => {
    router.push(`/dashboard/transactions/${id}/edit`);
  };
  
  const handleCreate = () => {
    router.push('/dashboard/transactions/new');
  };
  
  const getTransactionTypeBadge = (type: TransactionType) => {
    const colorMap: Partial<Record<TransactionType, string>> = {
      // Entity Perspective: Primary transaction types
      'ISSUANCE': 'bg-blue-500',
      'DISTRIBUTION': 'bg-teal-500',
      'REDEMPTION': 'bg-purple-500',
      // Transfer transactions
      'TRANSFER_IN': 'bg-emerald-500',
      'TRANSFER_OUT': 'bg-amber-500',
      // Legacy/Other cash transactions
      'CASH_IN': 'bg-lime-500',
      'CASH_OUT': 'bg-red-500',
      'COUPON_IN': 'bg-green-500',
      'COUPON_OUT': 'bg-orange-500',
      // Share related transactions
      'CONVERSION_IN': 'bg-emerald-500',
      'CONVERSION_OUT': 'bg-amber-500',
      'SPLIT': 'bg-indigo-500',
      'CONSOLIDATION': 'bg-cyan-500',
      // Option related transactions
      'GRANT': 'bg-pink-500',
      'VEST': 'bg-rose-500',
      'EXERCISE': 'bg-violet-500',
      'EXPIRE': 'bg-red-500',
      'FORFEIT': 'bg-orange-500',
      'CANCEL': 'bg-orange-500',
      // Financial transactions
      'DIVIDEND': 'bg-indigo-500',
      'INTEREST': 'bg-cyan-500',
      'ADJUSTMENT': 'bg-yellow-500'
    };
    
    return (
      <Badge className={`${colorMap[type] || 'bg-gray-500'}`}>
        {getTransactionTypeLabel(type)}
      </Badge>
    );
  };
  
  const getDirectionIcon = (transaction: Transaction) => {
    const direction = getTransactionDirection(transaction);
    
    if (direction === 'in') {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    } else if (direction === 'out') {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    } else {
      return <ArrowUpDown className="h-4 w-4 text-gray-500" />;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Loading transactions...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Error loading transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchTransactions()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>Transactions</CardTitle>
            <CardDescription className="mt-1">
              {stakeholderId 
                ? 'Transactions for this stakeholder' 
                : securityId 
                  ? 'Transactions for this security' 
                  : 'Manage your transactions'}
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="relative flex-1 w-full">
            <Input
              placeholder="Search by reference or stakeholder name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-2.5 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as TransactionType | 'ALL')}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {/* Entity Perspective: Primary transaction types */}
                <SelectItem value="ISSUANCE">Issuance</SelectItem>
                <SelectItem value="DISTRIBUTION">Distribution</SelectItem>
                <SelectItem value="REDEMPTION">Redemption</SelectItem>
                {/* Transfer transactions */}
                <SelectItem value="TRANSFER_IN">Transfer In</SelectItem>
                <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>
                {/* Legacy/Other cash transactions */}
                <SelectItem value="CASH_IN">Cash In</SelectItem>
                <SelectItem value="CASH_OUT">Cash Out</SelectItem>
                <SelectItem value="COUPON_IN">Coupon In</SelectItem>
                <SelectItem value="COUPON_OUT">Coupon Out</SelectItem>
                {/* Share related transactions */}
                <SelectItem value="CONVERSION_IN">Conversion In</SelectItem>
                <SelectItem value="CONVERSION_OUT">Conversion Out</SelectItem>
                <SelectItem value="SPLIT">Split</SelectItem>
                <SelectItem value="CONSOLIDATION">Consolidation</SelectItem>
                {/* Option related transactions */}
                <SelectItem value="GRANT">Grant</SelectItem>
                <SelectItem value="VEST">Vest</SelectItem>
                <SelectItem value="EXERCISE">Exercise</SelectItem>
                <SelectItem value="EXPIRE">Expire</SelectItem>
                <SelectItem value="FORFEIT">Forfeit</SelectItem>
                <SelectItem value="CANCEL">Cancel</SelectItem>
                {/* Financial transactions */}
                <SelectItem value="DIVIDEND">Dividend</SelectItem>
                <SelectItem value="INTEREST">Interest</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterFund} onValueChange={setFilterFund}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Funds</SelectItem>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id!.toString()}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="md:hidden">
              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as 'asc' | 'desc' | 'none')}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default</SelectItem>
                  <SelectItem value="desc">Newest</SelectItem>
                  <SelectItem value="asc">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <Table className="text-sm">
            <TableCaption className="text-xs text-muted-foreground">
              {filteredTransactions.length === 0 
                ? 'No transactions found' 
                : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredTransactions.length)} of ${filteredTransactions.length} transactions`}
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (sortOrder === 'asc') {
                        setSortOrder('desc');
                      } else if (sortOrder === 'desc') {
                        setSortOrder('none');
                      } else {
                        setSortOrder('asc');
                      }
                    }}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Date
                    {sortOrder === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
                    {sortOrder === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
                    {sortOrder === 'none' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Stakeholder</TableHead>
                <TableHead className="font-semibold">Round</TableHead>
                <TableHead className="font-semibold">Reference</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold text-center">Direction</TableHead>
                <TableHead className="font-semibold text-right">Amount Dr</TableHead>
                <TableHead className="font-semibold text-right">Amount Cr</TableHead>
                <TableHead className="font-semibold text-right">Units Dr</TableHead>
                <TableHead className="font-semibold text-right">Units Cr</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{formatDate(transaction.transactionDate)}</TableCell>
                  <TableCell className="font-medium">
                    {getStakeholderName(transaction.stakeholderId)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {getRoundName(transaction.roundId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{transaction.transactionReference || '-'}</TableCell>
                  <TableCell>{getTransactionTypeBadge(transaction.transactionType)}</TableCell>
                  <TableCell className="text-center">{getDirectionIcon(transaction)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {transaction.amountDebit > 0 ? formatCurrency(transaction.amountDebit, getTransactionCurrency(transaction)) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {transaction.amountCredit > 0 ? formatCurrency(transaction.amountCredit, getTransactionCurrency(transaction)) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {transaction.unitsDebit > 0 ? formatUnits(transaction.unitsDebit) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {transaction.unitsCredit > 0 ? formatUnits(transaction.unitsCredit) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => transaction.id && handleViewDetails(transaction.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => transaction.id && handleEdit(transaction.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog open={transactionToDelete?.id === transaction.id} onOpenChange={(open) => {
                        if (!open) setTransactionToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTransactionToDelete(transaction)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this transaction? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(transaction)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile List View */}
        <div className="md:hidden space-y-2">
          {paginatedTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            paginatedTransactions.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with stakeholder, date, and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {getStakeholderName(transaction.stakeholderId)}
                    </span>
                    {getDirectionIcon(transaction)}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => transaction.id && handleViewDetails(transaction.id)}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => transaction.id && handleEdit(transaction.id)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={transactionToDelete?.id === transaction.id} onOpenChange={(open) => {
                      if (!open) setTransactionToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setTransactionToDelete(transaction)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this transaction? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(transaction)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Type and round row */}
                <div className="flex items-center gap-2 mb-2">
                  {getTransactionTypeBadge(transaction.transactionType)}
                  <Badge variant="secondary" className="text-xs">
                    {getRoundName(transaction.roundId)}
                  </Badge>
                </div>

                {/* Date row */}
                <div className="text-xs text-muted-foreground font-mono mb-2">
                  {formatDate(transaction.transactionDate)}
                </div>

                {/* Reference */}
                {transaction.transactionReference && (
                  <div className="text-xs text-muted-foreground font-mono mb-2">
                    Ref: {transaction.transactionReference}
                  </div>
                )}

                {/* Amounts and Units - only show if non-zero */}
                <div className="flex items-center gap-2 text-xs">
                  {transaction.amountDebit > 0 && (
                    <Badge variant="outline" className="text-xs font-mono">
                      Dr: {formatCurrency(transaction.amountDebit, getTransactionCurrency(transaction))}
                    </Badge>
                  )}
                  {transaction.amountCredit > 0 && (
                    <Badge variant="outline" className="text-xs font-mono">
                      Cr: {formatCurrency(transaction.amountCredit, getTransactionCurrency(transaction))}
                    </Badge>
                  )}
                  {transaction.unitsDebit > 0 && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      Dr: {formatUnits(transaction.unitsDebit)}
                    </Badge>
                  )}
                  {transaction.unitsCredit > 0 && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      Cr: {formatUnits(transaction.unitsCredit)}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({filteredTransactions.length} total)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {/* Show page numbers only on larger screens */}
            <div className="hidden sm:flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
