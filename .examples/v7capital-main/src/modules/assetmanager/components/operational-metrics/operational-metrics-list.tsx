'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOperationalMetrics } from '@/modules/assetmanager/hooks/use-operational-metrics';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
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
import { type OperationalMetrics, type FinancialScenario } from '@/modules/assetmanager/schemas/operational-metrics.schemas';

export default function OperationalMetricsList() {
  const router = useRouter();
  const { companies, getCompanyName } = useCompanies();
  const {
    operationalMetrics,
    isLoading,
    error,
    fetchOperationalMetrics,
    removeOperationalMetric,
    clearError
  } = useOperationalMetrics();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('ALL');
  const [filterScenario, setFilterScenario] = useState<string>('ALL');
  const [metricToDelete, setMetricToDelete] = useState<OperationalMetrics | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  useEffect(() => {
    fetchOperationalMetrics();
  }, [fetchOperationalMetrics]);

  // Filter operational metrics based on search term, company, and scenario filter
  const filteredMetrics = operationalMetrics.filter(metric => {
    const companyName = getCompanyName(metric.companyId);
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = searchTerm === '' || (
      (metric.year && metric.year.toString().includes(searchLower)) ||
      (metric.scenario && metric.scenario.toLowerCase().includes(searchLower)) ||
      (metric.quarter && metric.quarter.toLowerCase().includes(searchLower)) ||
      (metric.semester && metric.semester.toLowerCase().includes(searchLower)) ||
      (metric.month && metric.month.toLowerCase().includes(searchLower)) ||
      (companyName && companyName.toLowerCase().includes(searchLower))
    );
    
    const matchesCompany = filterCompany === 'ALL' ? true : metric.companyId.toString() === filterCompany;
    const matchesScenario = filterScenario === 'ALL' ? true : metric.scenario === filterScenario;
    
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
  const totalPages = Math.ceil(filteredMetrics.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMetrics = filteredMetrics.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCompany, filterScenario]);

  const handleDelete = async (metric: OperationalMetrics) => {
    if (metric.id) {
      const success = await removeOperationalMetric(metric.id);
      if (success) {
        setMetricToDelete(null);
      }
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/operational-metrics/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/operational-metrics/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/dashboard/operational-metrics/new');
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

  const formatPercentage = (value: number | null) => {
    if (value === null) return '-';
    return `${value.toFixed(1)}%`;
  };

  const formatRatio = (value: number | null) => {
    if (value === null) return '-';
    return value.toFixed(2);
  };

  const formatMonths = (value: number | null) => {
    if (value === null) return '-';
    const months = Math.floor(value);
    return `${months} month${months !== 1 ? 's' : ''}`;
  };

  const getPeriodLabel = (metric: OperationalMetrics) => {
    if (metric.fullYear) return 'Full Year';
    if (metric.quarter) return metric.quarter;
    if (metric.semester) return metric.semester;
    if (metric.month) return metric.month;
    return 'Full Year';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Operational Metrics</CardTitle>
          <CardDescription>Loading operational metrics...</CardDescription>
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
          <CardTitle>Operational Metrics</CardTitle>
          <CardDescription>Error loading operational metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchOperationalMetrics()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>Operational Metrics</CardTitle>
            <CardDescription className="mt-1">
              Manage operational efficiency and performance metrics
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Operational Metrics
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
          <Table className="text-sm min-w-[1600px]">
            <TableCaption className="text-xs text-muted-foreground">
              {filteredMetrics.length === 0 
                ? 'No operational metrics found' 
                : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredMetrics.length)} of ${filteredMetrics.length} operational metrics`}
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
                    Year
                    {sortOrder === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
                    {sortOrder === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
                    {sortOrder === 'none' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Period</TableHead>
                <TableHead className="font-semibold">Scenario</TableHead>
                <TableHead className="font-semibold text-right">Burn Rate</TableHead>
                <TableHead className="font-semibold text-right">Runway</TableHead>
                <TableHead className="font-semibold text-right">Rule of 40</TableHead>
                <TableHead className="font-semibold text-right">Gross Margin</TableHead>
                <TableHead className="font-semibold text-right">Rev/Employee</TableHead>
                <TableHead className="font-semibold text-right">Burn Multiple</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {paginatedMetrics.map((metric) => (
                <TableRow key={metric.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {getCompanyName(metric.companyId) || metric.companyId}
                  </TableCell>
                  <TableCell className="font-semibold">{metric.year}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {getPeriodLabel(metric)}
                  </TableCell>
                  <TableCell>{getScenarioBadge(metric.scenario)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {metric.burnRate ? formatCurrency(metric.burnRate, 'USD') : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMonths(metric.runwayMonths)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(metric.ruleOf40)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(metric.grossMargin)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {metric.revenuePerEmployee ? formatCurrency(metric.revenuePerEmployee, 'USD') : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatRatio(metric.burnMultiple)}
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
                            <AlertDialogTitle>Delete Operational Metrics</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this operational metrics entry? 
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
              No operational metrics found
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
                          <AlertDialogTitle>Delete Operational Metrics</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this operational metrics entry? 
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

                {/* Year and Scenario row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-lg">{metric.year}</span>
                  <span className="text-muted-foreground">-</span>
                  {getScenarioBadge(metric.scenario)}
                </div>

                {/* Period */}
                <div className="text-xs text-muted-foreground font-mono mb-2">
                  {getPeriodLabel(metric)}
                </div>

                {/* Key metrics */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {metric.burnRate !== null && (
                    <Badge variant="outline" className="text-xs font-mono">
                      Burn: {formatCurrency(metric.burnRate, 'USD')}
                    </Badge>
                  )}
                  {metric.runwayMonths !== null && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      Runway: {formatMonths(metric.runwayMonths)}
                    </Badge>
                  )}
                  {metric.ruleOf40 !== null && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      Rule of 40: {formatPercentage(metric.ruleOf40)}
                    </Badge>
                  )}
                  {metric.grossMargin !== null && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      GM: {formatPercentage(metric.grossMargin)}
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
        </CardFooter>
      )}
    </Card>
  );
}