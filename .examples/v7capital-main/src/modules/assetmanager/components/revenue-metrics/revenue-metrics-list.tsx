'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRevenueMetrics } from '@/modules/assetmanager/hooks/use-revenue-metrics';
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
import { type RevenueMetrics, type FinancialScenario } from '@/modules/assetmanager/schemas/revenue-metrics.schemas';

export default function RevenueMetricsList() {
  const router = useRouter();
  const { companies, getCompanyName } = useCompanies();
  const {
    revenueMetrics,
    isLoading,
    error,
    fetchRevenueMetrics,
    removeRevenueMetric,
    clearError,
    formatCurrency,
    formatPercentage,
    getPeriodLabel
  } = useRevenueMetrics();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('ALL');
  const [filterScenario, setFilterScenario] = useState<string>('ALL');
  const [metricToDelete, setMetricToDelete] = useState<RevenueMetrics | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  useEffect(() => {
    fetchRevenueMetrics();
  }, [fetchRevenueMetrics]);

  // Filter revenue metrics based on search term, company, and scenario
  const filteredMetrics = revenueMetrics.filter(metric => {
    const companyName = getCompanyName(metric.companyId);
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = searchTerm === '' || (
      (companyName && companyName.toLowerCase().includes(searchLower)) ||
      metric.year.toString().includes(searchLower) ||
      (metric.quarter && metric.quarter.toLowerCase().includes(searchLower)) ||
      (metric.semester && metric.semester.toLowerCase().includes(searchLower)) ||
      (metric.month && metric.month.toLowerCase().includes(searchLower)) ||
      metric.scenario.toLowerCase().includes(searchLower)
    );
    
    const matchesCompany = filterCompany === 'ALL' ? true : metric.companyId.toString() === filterCompany;
    const matchesScenario = filterScenario === 'ALL' ? true : metric.scenario === filterScenario;
    
    return matchesSearch && matchesCompany && matchesScenario;
  }).sort((a, b) => {
    // Sort by year then quarter/semester/month
    if (sortOrder === 'none') return 0;
    
    const yearDiff = b.year - a.year;
    if (yearDiff !== 0) {
      return sortOrder === 'asc' ? -yearDiff : yearDiff;
    }
    
    // Secondary sort by quarter/semester/month within same year
    if (a.quarter && b.quarter) {
      const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
      const qDiff = qOrder[b.quarter] - qOrder[a.quarter];
      return sortOrder === 'asc' ? -qDiff : qDiff;
    }
    
    return 0;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredMetrics.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMetrics = filteredMetrics.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCompany, filterScenario]);

  const handleDelete = async (metric: RevenueMetrics) => {
    if (metric.id) {
      const success = await removeRevenueMetric(metric.id);
      if (success) {
        setMetricToDelete(null);
      }
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/revenue-metrics/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/revenue-metrics/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/dashboard/revenue-metrics/new');
  };

  const getScenarioBadge = (scenario: FinancialScenario) => {
    const colorMap: Record<FinancialScenario, string> = {
      'Actual': 'bg-green-500',
      'Forecast': 'bg-blue-500',
      'Budget': 'bg-orange-500'
    };
    
    return (
      <Badge className={`${colorMap[scenario] || 'bg-gray-500'} text-white text-xs`}>
        {scenario}
      </Badge>
    );
  };

  const getTotalRevenue = (metric: RevenueMetrics) => {
    return (metric.recurringRevenue || 0) + (metric.nonRecurringRevenue || 0);
  };

  const getRecurringPercentage = (metric: RevenueMetrics) => {
    const total = getTotalRevenue(metric);
    const recurring = metric.recurringRevenue || 0;
    return total > 0 ? (recurring / total) * 100 : 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Metrics</CardTitle>
          <CardDescription>Loading revenue metrics...</CardDescription>
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
          <CardTitle>Revenue Metrics</CardTitle>
          <CardDescription>Error loading revenue metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchRevenueMetrics()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>Revenue Metrics</CardTitle>
            <CardDescription className="mt-1">
              Track revenue performance and growth metrics
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Revenue Metric
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <div className="relative flex-1 w-full">
          <Input
            placeholder="Search by company, year, or scenario..."
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
        <Table className="text-sm min-w-[1800px]">
          <TableCaption className="text-xs text-muted-foreground">
            {filteredMetrics.length === 0 
              ? 'No revenue metrics found' 
              : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredMetrics.length)} of ${filteredMetrics.length} revenue metrics`}
          </TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold">Company</TableHead>
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
                  Period
                  {sortOrder === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
                  {sortOrder === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
                  {sortOrder === 'none' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                </Button>
              </TableHead>
              <TableHead className="font-semibold">Scenario</TableHead>
              <TableHead className="font-semibold text-right">Recurring</TableHead>
              <TableHead className="font-semibold text-right">Non-Recurring</TableHead>
              <TableHead className="font-semibold text-right">Total Revenue</TableHead>
              <TableHead className="font-semibold text-right">ARR</TableHead>
              <TableHead className="font-semibold text-right">MRR</TableHead>
              <TableHead className="font-semibold text-right">Growth Rate</TableHead>
              <TableHead className="font-semibold text-right">Avg Revenue/Customer</TableHead>
              <TableHead className="font-semibold text-right">Revenue Churn</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm">
            {paginatedMetrics.map((metric) => (
              <TableRow key={metric.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  {getCompanyName(metric.companyId) || metric.companyId}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {getPeriodLabel(metric)}
                </TableCell>
                <TableCell>
                  {getScenarioBadge(metric.scenario)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(metric.recurringRevenue)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(metric.nonRecurringRevenue)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatCurrency(getTotalRevenue(metric))}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(metric.arr)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(metric.mrr)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPercentage(metric.revenueGrowthRate)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(metric.averageRevenuePerCustomer)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPercentage(metric.revenueChurnRate)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => metric.id && handleViewDetails(metric.id)}
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
                            onClick={() => metric.id && handleEdit(metric.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <AlertDialog open={metricToDelete?.id === metric.id} onOpenChange={(open) => {
                      if (!open) setMetricToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMetricToDelete(metric)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Revenue Metric</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this revenue metric? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(metric)}
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
        {paginatedMetrics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No revenue metrics found
          </div>
        ) : (
          paginatedMetrics.map((metric) => (
            <div key={metric.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
              {/* Header row with company and actions */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium text-sm truncate">
                    {getCompanyName(metric.companyId) || metric.companyId}
                  </span>
                  {getScenarioBadge(metric.scenario)}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => metric.id && handleViewDetails(metric.id)}
                    className="h-7 w-7"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => metric.id && handleEdit(metric.id)}
                    className="h-7 w-7"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog open={metricToDelete?.id === metric.id} onOpenChange={(open) => {
                    if (!open) setMetricToDelete(null);
                  }}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMetricToDelete(metric)}
                        className="h-7 w-7"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Revenue Metric</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this revenue metric? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(metric)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Period row */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {getPeriodLabel(metric)}
                </span>
              </div>

              {/* Revenue metrics */}
              <div className="space-y-2 mb-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Revenue:</span>
                  <span className="font-mono font-semibold">{formatCurrency(getTotalRevenue(metric))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Recurring:</span>
                  <span className="font-mono">{formatCurrency(metric.recurringRevenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Non-Recurring:</span>
                  <span className="font-mono">{formatCurrency(metric.nonRecurringRevenue)}</span>
                </div>
              </div>

              {/* Key metrics badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="text-xs font-mono">
                  {Math.round(getRecurringPercentage(metric))}% Recurring
                </Badge>
                {metric.arr !== null && (
                  <Badge variant="outline" className="text-xs font-mono">
                    ARR: {formatCurrency(metric.arr)}
                  </Badge>
                )}
                {metric.revenueGrowthRate !== null && (
                  <Badge variant="secondary" className="text-xs font-mono">
                    Growth: {formatPercentage(metric.revenueGrowthRate)}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({filteredMetrics.length} total)
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
        </div>
      )}
      </CardContent>
    </Card>
  );
}