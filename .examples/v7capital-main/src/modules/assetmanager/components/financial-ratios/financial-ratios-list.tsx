'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinancialRatios } from '@/modules/assetmanager/hooks/use-financial-ratios';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
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
import { type FinancialRatios, type FinancialScenario } from '@/modules/assetmanager/schemas/financial-ratios.schemas';

export default function FinancialRatiosList() {
  const router = useRouter();
  const { companies, getCompanyName } = useCompanies();
  const {
    financialRatios,
    isLoading,
    error,
    fetchFinancialRatios,
    removeFinancialRatio,
    clearError
  } = useFinancialRatios();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('ALL');
  const [filterScenario, setFilterScenario] = useState<string>('ALL');
  const [ratioToDelete, setRatioToDelete] = useState<FinancialRatios | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  useEffect(() => {
    fetchFinancialRatios();
  }, [fetchFinancialRatios]);

  // Filter financial ratios based on search term, company, and scenario filter
  const filteredRatios = financialRatios.filter(ratio => {
    const companyName = getCompanyName(ratio.companyId);
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = searchTerm === '' || (
      (ratio.year && ratio.year.toString().includes(searchLower)) ||
      (ratio.scenario && ratio.scenario.toLowerCase().includes(searchLower)) ||
      (ratio.quarter && ratio.quarter.toLowerCase().includes(searchLower)) ||
      (ratio.semester && ratio.semester.toLowerCase().includes(searchLower)) ||
      (ratio.month && ratio.month.toLowerCase().includes(searchLower)) ||
      (companyName && companyName.toLowerCase().includes(searchLower))
    );
    
    const matchesCompany = filterCompany === 'ALL' ? true : ratio.companyId.toString() === filterCompany;
    const matchesScenario = filterScenario === 'ALL' ? true : ratio.scenario === filterScenario;
    
    return matchesSearch && matchesCompany && matchesScenario;
  }).sort((a, b) => {
    // Sort by year if sort order is specified
    if (sortOrder === 'none') return 0;
    
    const yearA = a.year || 0;
    const yearB = b.year || 0;
    
    if (sortOrder === 'asc') {
      return yearA - yearB;
    } else {
      return yearB - yearA;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredRatios.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRatios = filteredRatios.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCompany, filterScenario]);

  const handleDelete = async (ratio: FinancialRatios) => {
    if (ratio.id) {
      const success = await removeFinancialRatio(ratio.id);
      if (success) {
        setRatioToDelete(null);
      }
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/financial-ratios/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/financial-ratios/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/dashboard/financial-ratios/new');
  };

  const getScenarioBadge = (scenario: FinancialScenario) => {
    const colorMap: Record<FinancialScenario, string> = {
      'Actual': 'bg-green-500',
      'Forecast': 'bg-blue-500',
      'Budget': 'bg-orange-500',
    };
    
    return (
      <Badge className={`${colorMap[scenario] || 'bg-gray-500'} text-white`}>
        {scenario}
      </Badge>
    );
  };

  const formatRatio = (value: number | null) => {
    if (value === null) return '-';
    return value.toFixed(2);
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return '-';
    return `${value.toFixed(2)}%`;
  };

  const getPeriodLabel = (ratio: FinancialRatios) => {
    if (ratio.fullYear) return 'Full Year';
    if (ratio.quarter) return ratio.quarter;
    if (ratio.semester) return ratio.semester;
    if (ratio.month) return ratio.month;
    return 'Full Year';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Ratios</CardTitle>
          <CardDescription>Loading financial ratios...</CardDescription>
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
          <CardTitle>Financial Ratios</CardTitle>
          <CardDescription>Error loading financial ratios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchFinancialRatios()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>Financial Ratios</CardTitle>
            <CardDescription className="mt-1">
              Manage financial ratios and analytical metrics
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Financial Ratios
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="relative flex-1 w-full">
            <Input
              placeholder="Search by company, year, period, or scenario..."
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
              value={filterCompany}
              onValueChange={(value) => setFilterCompany(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Companies</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id!.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterScenario}
              onValueChange={(value) => setFilterScenario(value)}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Filter by scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Scenarios</SelectItem>
                <SelectItem value="Actual">Actual</SelectItem>
                <SelectItem value="Forecast">Forecast</SelectItem>
                <SelectItem value="Budget">Budget</SelectItem>
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
          <Table className="text-sm min-w-[1000px]">
            <TableCaption className="text-xs text-muted-foreground">
              {filteredRatios.length === 0 
                ? 'No financial ratios found' 
                : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredRatios.length)} of ${filteredRatios.length} financial ratios`}
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold w-[200px]">Company</TableHead>
                <TableHead className="font-semibold w-[80px]">
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
                    Year
                    {sortOrder === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
                    {sortOrder === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
                    {sortOrder === 'none' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold w-[80px]">Period</TableHead>
                <TableHead className="font-semibold w-[100px]">Scenario</TableHead>
                <TableHead className="font-semibold text-right w-[100px]">Current Ratio</TableHead>
                <TableHead className="font-semibold text-right w-[100px]">Debt/Equity</TableHead>
                <TableHead className="font-semibold text-right w-[100px]">Net Profit %</TableHead>
                <TableHead className="font-semibold text-right w-[80px]">ROE %</TableHead>
                <TableHead className="font-semibold text-right w-[80px]">ROA %</TableHead>
                <TableHead className="font-semibold text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {paginatedRatios.map((ratio) => (
                <TableRow key={ratio.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {getCompanyName(ratio.companyId) || ratio.companyId}
                  </TableCell>
                  <TableCell className="font-semibold">{ratio.year}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {getPeriodLabel(ratio)}
                  </TableCell>
                  <TableCell>{getScenarioBadge(ratio.scenario)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatRatio(ratio.currentRatio)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatRatio(ratio.debtToEquityRatio)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(ratio.netProfitMargin)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(ratio.returnOnEquity)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(ratio.returnOnAssets)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => ratio.id && handleViewDetails(ratio.id)}
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
                              onClick={() => ratio.id && handleEdit(ratio.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog open={ratioToDelete?.id === ratio.id} onOpenChange={(open) => {
                        if (!open) setRatioToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRatioToDelete(ratio)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Financial Ratios</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this financial ratios entry? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(ratio)}
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
          {paginatedRatios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No financial ratios found
            </div>
          ) : (
            paginatedRatios.map((ratio) => (
              <div key={ratio.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with company and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {getCompanyName(ratio.companyId) || ratio.companyId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => ratio.id && handleViewDetails(ratio.id)}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => ratio.id && handleEdit(ratio.id)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={ratioToDelete?.id === ratio.id} onOpenChange={(open) => {
                      if (!open) setRatioToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRatioToDelete(ratio)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Financial Ratios</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this financial ratios entry? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(ratio)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Year and Scenario row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-lg">{ratio.year}</span>
                  <span className="text-muted-foreground">-</span>
                  {getScenarioBadge(ratio.scenario)}
                </div>

                {/* Period */}
                <div className="text-xs text-muted-foreground font-mono mb-2">
                  {getPeriodLabel(ratio)}
                </div>

                {/* Key ratios */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {ratio.currentRatio !== null && (
                    <Badge variant="outline" className="text-xs font-mono">
                      Current: {formatRatio(ratio.currentRatio)}
                    </Badge>
                  )}
                  {ratio.netProfitMargin !== null && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      Profit: {formatPercentage(ratio.netProfitMargin)}
                    </Badge>
                  )}
                  {ratio.returnOnEquity !== null && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      ROE: {formatPercentage(ratio.returnOnEquity)}
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
            Page {currentPage} of {totalPages} ({filteredRatios.length} total)
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