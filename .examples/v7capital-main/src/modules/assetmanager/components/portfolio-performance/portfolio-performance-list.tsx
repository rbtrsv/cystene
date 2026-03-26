'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortfolioPerformance } from '@/modules/assetmanager/hooks/use-portfolio-performance';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
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
import { type PortfolioPerformance } from '@/modules/assetmanager/schemas/portfolio-performance.schemas';

export default function PortfolioPerformanceList() {
  const router = useRouter();
  const { funds, getFundName } = useFunds();
  const { getRoundName } = useRounds();
  const {
    portfolioPerformances,
    isLoading,
    error,
    fetchPortfolioPerformances,
    removePortfolioPerformance,
    clearError
  } = usePortfolioPerformance();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFund, setFilterFund] = useState<string>('ALL');
  const [performanceToDelete, setPerformanceToDelete] = useState<PortfolioPerformance | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  useEffect(() => {
    fetchPortfolioPerformances();
  }, [fetchPortfolioPerformances]);

  // Filter portfolio performances based on search term and fund filter
  const filteredPerformances = portfolioPerformances.filter(performance => {
    const fundName = getFundName(performance.fundId);
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = searchTerm === '' || (
      (performance.reportDate && performance.reportDate.includes(searchLower)) ||
      (fundName && fundName.toLowerCase().includes(searchLower))
    );
    
    const matchesFund = filterFund === 'ALL' ? true : performance.fundId.toString() === filterFund;
    
    return matchesSearch && matchesFund;
  }).sort((a, b) => {
    // Sort by report date if sort order is specified
    if (sortOrder === 'none') return 0;
    
    const dateA = new Date(a.reportDate).getTime();
    const dateB = new Date(b.reportDate).getTime();
    
    if (sortOrder === 'asc') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredPerformances.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPerformances = filteredPerformances.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterFund]);

  const handleDelete = async (performance: PortfolioPerformance) => {
    if (performance.id) {
      const success = await removePortfolioPerformance(performance.id);
      if (success) {
        setPerformanceToDelete(null);
      }
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/portfolio-performance/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/portfolio-performance/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/dashboard/portfolio-performance/new');
  };

  const formatMultiple = (value: number | null) => {
    if (value === null) return '-';
    return `${value.toFixed(2)}x`;
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return '-';
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalValue = (performance: PortfolioPerformance) => {
    const fairValue = performance.fairValue ?? 0;
    const cashRealized = performance.cashRealized ?? 0;
    return fairValue + cashRealized;
  };

  const getReturnBadge = (performance: PortfolioPerformance) => {
    const totalValue = getTotalValue(performance);
    const totalInvested = performance.totalInvestedAmount ?? 0;
    const gain = totalValue - totalInvested;
    const isPositive = gain > 0;

    return (
      <Badge className={`${isPositive ? 'bg-green-500' : 'bg-red-500'} text-white`}>
        {isPositive ? '+' : ''}{formatCurrency(gain, 'EUR')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Loading portfolio performance...</CardDescription>
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
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Error loading portfolio performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchPortfolioPerformances()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription className="mt-1">
              Monitor portfolio returns and performance metrics
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Performance Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="relative flex-1 w-full">
            <Input
              placeholder="Search by fund or report date..."
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
              value={filterFund}
              onValueChange={(value) => setFilterFund(value)}
            >
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
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table className="text-sm min-w-[1800px]">
            <TableCaption className="text-xs text-muted-foreground">
              {filteredPerformances.length === 0
                ? 'No portfolio performance records found'
                : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredPerformances.length)} of ${filteredPerformances.length} performance records`}
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Fund</TableHead>
                <TableHead className="font-semibold">Round</TableHead>
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
                    Report Date
                    {sortOrder === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
                    {sortOrder === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
                    {sortOrder === 'none' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-right">Invested</TableHead>
                <TableHead className="font-semibold text-right">Fair Value</TableHead>
                <TableHead className="font-semibold text-right">Cash Realized</TableHead>
                <TableHead className="font-semibold text-right">Total Value</TableHead>
                <TableHead className="font-semibold text-right">Gain/Loss</TableHead>
                <TableHead className="font-semibold text-right">NAV</TableHead>
                <TableHead className="font-semibold text-right">Fund Units</TableHead>
                <TableHead className="font-semibold text-right">NAV/Share</TableHead>
                <TableHead className="font-semibold text-right">TVPI</TableHead>
                <TableHead className="font-semibold text-right">DPI</TableHead>
                <TableHead className="font-semibold text-right">RVPI</TableHead>
                <TableHead className="font-semibold text-right">IRR</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {paginatedPerformances.map((performance) => (
                <TableRow key={performance.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {getFundName(performance.fundId) || performance.fundId}
                  </TableCell>
                  <TableCell className="text-sm">
                    {performance.roundId ? getRoundName(performance.roundId) : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {formatDate(performance.reportDate)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(performance.totalInvestedAmount, 'EUR')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(performance.fairValue, 'EUR')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(performance.cashRealized, 'EUR')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(getTotalValue(performance), 'EUR')}
                  </TableCell>
                  <TableCell className="text-right">
                    {getReturnBadge(performance)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {performance.nav ? formatCurrency(performance.nav, 'EUR') : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {performance.totalFundUnits ? formatCurrency(performance.totalFundUnits) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMultiple(performance.navPerShare)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMultiple(performance.tvpi)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMultiple(performance.dpi)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMultiple(performance.rvpi)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(performance.irr)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => performance.id && handleViewDetails(performance.id)}
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
                              onClick={() => performance.id && handleEdit(performance.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog open={performanceToDelete?.id === performance.id} onOpenChange={(open) => {
                        if (!open) setPerformanceToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPerformanceToDelete(performance)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Portfolio Performance</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this portfolio performance record? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(performance)}
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
          {paginatedPerformances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No portfolio performance records found
            </div>
          ) : (
            paginatedPerformances.map((performance) => (
              <div key={performance.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with fund and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {getFundName(performance.fundId) || performance.fundId}
                    </span>
                    {performance.roundId && (
                      <span className="text-xs text-muted-foreground">
                        {getRoundName(performance.roundId)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => performance.id && handleViewDetails(performance.id)}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => performance.id && handleEdit(performance.id)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={performanceToDelete?.id === performance.id} onOpenChange={(open) => {
                      if (!open) setPerformanceToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPerformanceToDelete(performance)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Portfolio Performance</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this portfolio performance record? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(performance)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Report date row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDate(performance.reportDate)}
                  </span>
                </div>

                {/* Performance metrics */}
                <div className="space-y-2 mb-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Invested:</span>
                    <span className="font-mono">{formatCurrency(performance.totalInvestedAmount, 'EUR')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Value:</span>
                    <span className="font-mono font-semibold">{formatCurrency(getTotalValue(performance), 'EUR')}</span>
                  </div>
                  {performance.nav !== null && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">NAV:</span>
                      <span className="font-mono">{formatCurrency(performance.nav, 'EUR')}</span>
                    </div>
                  )}
                  {performance.navPerShare !== null && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">NAV/Share:</span>
                      <span className="font-mono">{formatMultiple(performance.navPerShare)}</span>
                    </div>
                  )}
                </div>

                {/* Key metrics badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {getReturnBadge(performance)}
                  {performance.tvpi !== null && (
                    <Badge variant="outline" className="text-xs font-mono">
                      TVPI: {formatMultiple(performance.tvpi)}
                    </Badge>
                  )}
                  {performance.rvpi !== null && (
                    <Badge variant="outline" className="text-xs font-mono">
                      RVPI: {formatMultiple(performance.rvpi)}
                    </Badge>
                  )}
                  {performance.irr !== null && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      IRR: {formatPercentage(performance.irr)}
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
            Page {currentPage} of {totalPages} ({filteredPerformances.length} total)
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