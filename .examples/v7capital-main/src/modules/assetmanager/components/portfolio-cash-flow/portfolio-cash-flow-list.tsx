'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortfolioCashFlow } from '@/modules/assetmanager/hooks/use-portfolio-cash-flow';
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
import {
  type PortfolioCashFlow,
  type PortfolioCashFlowWithRelations,
  type CashFlowType,
  type CashFlowScenario,
  cashFlowTypeEnum,
  cashFlowScenarioEnum
} from '@/modules/assetmanager/schemas/portfolio-cash-flow.schemas';

// Helper function to calculate net amount (debit - credit from fund perspective)
function getNetAmount(cashFlow: PortfolioCashFlow | PortfolioCashFlowWithRelations): number {
  const debit = cashFlow.amountDebit || 0;
  const credit = cashFlow.amountCredit || 0;
  return debit - credit;
}

type CashFlowTypeFilter = z.infer<typeof cashFlowTypeEnum>;
type CashFlowScenarioFilter = z.infer<typeof cashFlowScenarioEnum>;

interface PortfolioCashFlowListProps {
  companyId?: number;
  fundId?: number;
  roundId?: number;
}

export default function PortfolioCashFlowList({
  companyId,
  fundId,
  roundId
}: PortfolioCashFlowListProps) {
  const router = useRouter();
  const {
    cashFlowsWithRelations,
    isLoading,
    error,
    fetchCashFlowsWithRelations,
    removeCashFlow,
    clearError
  } = usePortfolioCashFlow();

  const { funds } = useFunds();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<CashFlowTypeFilter | 'ALL'>('ALL');
  const [filterScenario, setFilterScenario] = useState<CashFlowScenarioFilter | 'ALL'>('ALL');
  const [filterFund, setFilterFund] = useState<string>('ALL');
  const [cashFlowToDelete, setCashFlowToDelete] = useState<PortfolioCashFlowWithRelations | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  useEffect(() => {
    fetchCashFlowsWithRelations();
  }, [fetchCashFlowsWithRelations]);

  // Filter cash flows based on search term and filters
  const filteredCashFlows = cashFlowsWithRelations.filter(cashFlow => {
    const companyName = cashFlow.company?.name || 'Unknown Company';
    const fundName = cashFlow.fund?.name || null;
    const roundName = cashFlow.round?.name || null;
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = searchTerm === '' || (
      (companyName && companyName.toLowerCase().includes(searchLower)) ||
      (fundName && fundName.toLowerCase().includes(searchLower)) ||
      (roundName && roundName.toLowerCase().includes(searchLower)) ||
      (cashFlow.description && cashFlow.description.toLowerCase().includes(searchLower))
    );

    // Apply company/fund/round filters if provided
    const matchesCompany = companyId ? cashFlow.companyId === companyId : true;
    const matchesFund = fundId ? cashFlow.fundId === fundId : (filterFund === 'ALL' ? true : cashFlow.fundId.toString() === filterFund);
    const matchesRound = roundId ? cashFlow.roundId === roundId : true;

    const matchesType = filterType === 'ALL' ? true : cashFlow.cashFlowType === filterType;
    const matchesScenario = filterScenario === 'ALL' ? true : cashFlow.scenario === filterScenario;

    return matchesSearch && matchesCompany && matchesFund && matchesRound && matchesType && matchesScenario;
  }).sort((a, b) => {
    // Sort by date if sort order is specified
    if (sortOrder === 'none') return 0;

    const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
    const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();

    if (sortOrder === 'asc') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCashFlows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCashFlows = filteredCashFlows.slice(startIndex, endIndex);

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterScenario, filterFund]);

  const handleDelete = async (cashFlow: PortfolioCashFlowWithRelations) => {
    if (cashFlow.id) {
      const success = await removeCashFlow(cashFlow.id);
      if (success) {
        setCashFlowToDelete(null);
      }
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/portfolio/cash-flows/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/portfolio/cash-flows/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/dashboard/portfolio/cash-flows/new');
  };

  const getCashFlowTypeBadge = (type: CashFlowType) => {
    const colorMap: Partial<Record<CashFlowType, string>> = {
      'Investment': 'bg-blue-500',
      'Follow-on': 'bg-indigo-500',
      'Dividend': 'bg-green-500',
      'Interest': 'bg-emerald-500',
      'Sale Proceeds': 'bg-purple-500',
      'Exit Proceeds': 'bg-violet-500',
      'Distribution': 'bg-cyan-500',
      'Management Fee': 'bg-orange-500',
      'Performance Fee': 'bg-amber-500',
    };
    return colorMap[type] || 'bg-gray-500';
  };

  const getCashFlowDirection = (type: CashFlowType) => {
    const outflows = ['Investment', 'Follow-on', 'Management Fee', 'Performance Fee'];
    return outflows.includes(type) ? 'OUT' : 'IN';
  };

  const formatDate = (date: Date | string): string => {
    if (!date) return '-';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return '-';
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading cash flows...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => fetchCashFlowsWithRelations()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>Portfolio Cash Flows</CardTitle>
            <CardDescription className="mt-1">
              {companyId
                ? 'Cash flows for this company'
                : fundId
                  ? 'Cash flows for this fund'
                  : roundId
                    ? 'Cash flows for this round'
                    : 'Manage your portfolio cash flows'}
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Cash Flow
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="relative flex-1 w-full">
            <Input
              placeholder="Search cash flows..."
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
            <Select value={filterType} onValueChange={(value: CashFlowTypeFilter | 'ALL') => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="Investment">Investment</SelectItem>
                <SelectItem value="Follow-on">Follow-on</SelectItem>
                <SelectItem value="Dividend">Dividend</SelectItem>
                <SelectItem value="Interest">Interest</SelectItem>
                <SelectItem value="Sale Proceeds">Sale Proceeds</SelectItem>
                <SelectItem value="Exit Proceeds">Exit Proceeds</SelectItem>
                <SelectItem value="Distribution">Distribution</SelectItem>
                <SelectItem value="Management Fee">Management Fee</SelectItem>
                <SelectItem value="Performance Fee">Performance Fee</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterScenario} onValueChange={(value: CashFlowScenarioFilter | 'ALL') => setFilterScenario(value)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Scenarios</SelectItem>
                <SelectItem value="Actual">Actual</SelectItem>
                <SelectItem value="Forecast">Forecast</SelectItem>
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
          <Table>
            <TableCaption className="text-xs text-muted-foreground">
              {filteredCashFlows.length === 0
                ? 'No cash flows found'
                : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredCashFlows.length)} of ${filteredCashFlows.length} cash flows`}
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (sortOrder === 'none') setSortOrder('desc');
                      else if (sortOrder === 'desc') setSortOrder('asc');
                      else setSortOrder('none');
                    }}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Date
                    {sortOrder === 'none' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                    {sortOrder === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
                    {sortOrder === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Fund</TableHead>
                <TableHead className="font-semibold">Round</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Scenario</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {paginatedCashFlows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {filteredCashFlows.length === 0 && searchTerm === '' && filterType === 'ALL' && filterScenario === 'ALL'
                      ? "No cash flows found. Click 'Add Cash Flow' to create your first one."
                      : "No cash flows match your current filters."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCashFlows.map((cashFlow) => {
                  const netAmount = getNetAmount(cashFlow);
                  return (
                  <TableRow key={cashFlow.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {formatDate(cashFlow.date)}
                    </TableCell>
                    <TableCell>
                      {cashFlow.company?.name || 'Unknown Company'}
                    </TableCell>
                    <TableCell>
                      {cashFlow.fund?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {cashFlow.round?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getCashFlowTypeBadge(cashFlow.cashFlowType)} text-white border-0`}
                      >
                        {cashFlow.cashFlowType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          cashFlow.scenario === 'Actual'
                            ? 'bg-green-500 text-white'
                            : cashFlow.scenario === 'Forecast'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-500 text-white'
                        }
                      >
                        {cashFlow.scenario}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={netAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {netAmount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netAmount), cashFlow.currency || 'EUR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={cashFlow.description || ''}>
                        {cashFlow.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right w-[120px]">
                      <div className="flex gap-1 justify-end">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(cashFlow.id!)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(cashFlow.id!)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCashFlowToDelete(cashFlow)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
            </Table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-2">
          {paginatedCashFlows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filteredCashFlows.length === 0 && searchTerm === '' && filterType === 'ALL' && filterScenario === 'ALL'
                ? "No cash flows found. Click 'Add Cash Flow' to create your first one."
                : "No cash flows match your current filters."
              }
            </div>
          ) : (
            paginatedCashFlows.map((cashFlow) => {
              const netAmount = getNetAmount(cashFlow);
              return (
              <div key={cashFlow.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with company, date, and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {cashFlow.company?.name || 'Unknown Company'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(cashFlow.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetails(cashFlow.id!)}
                      className="h-7 w-7"
                      aria-label="View cash flow details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(cashFlow.id!)}
                      className="h-7 w-7"
                      aria-label="Edit cash flow"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCashFlowToDelete(cashFlow)}
                      className="h-7 w-7"
                      aria-label="Delete cash flow"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Type and Amount row */}
                <div className="flex items-center justify-between mb-1">
                  <Badge
                    className={`${getCashFlowTypeBadge(cashFlow.cashFlowType)} text-white border-0 text-xs`}
                  >
                    {cashFlow.cashFlowType}
                  </Badge>
                  <span className={`font-medium text-sm ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netAmount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netAmount), cashFlow.currency || 'EUR')}
                  </span>
                </div>

                {/* Additional details */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    className={
                      cashFlow.scenario === 'Actual'
                        ? 'bg-green-500 text-white'
                        : cashFlow.scenario === 'Forecast'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-500 text-white'
                    }
                  >
                    {cashFlow.scenario}
                  </Badge>
                  {cashFlow.fund?.name && (
                    <span>• {cashFlow.fund.name}</span>
                  )}
                  {cashFlow.round?.name && (
                    <span>• {cashFlow.round.name}</span>
                  )}
                </div>

                {/* Description if available */}
                {cashFlow.description && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {cashFlow.description}
                  </div>
                )}
              </div>
              );
            })
          )}
        </div>
      </CardContent>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({filteredCashFlows.length} total)
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!cashFlowToDelete}
        onOpenChange={(open) => !open && setCashFlowToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cash Flow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cash flow? This action cannot be undone.
              {cashFlowToDelete && (
                <>
                  {' '}This will permanently delete the {cashFlowToDelete.cashFlowType} cash flow for{' '}
                  {cashFlowToDelete.company?.name || 'Unknown Company'}
                  ({formatCurrency(Math.abs(getNetAmount(cashFlowToDelete)), cashFlowToDelete.currency || 'EUR')}).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cashFlowToDelete && handleDelete(cashFlowToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
