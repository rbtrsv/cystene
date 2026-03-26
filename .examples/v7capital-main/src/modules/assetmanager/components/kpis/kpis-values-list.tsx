'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKpis } from '@/modules/assetmanager/hooks/use-kpis';
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
import { Pencil, Trash2, Eye, Plus, ArrowUpDown, ArrowUp, ArrowDown, Settings, BarChart3 } from 'lucide-react';
import { type KpiValue, type FinancialScenario } from '@/modules/assetmanager/schemas/kpis.schemas';

export default function KpisValuesList() {
  const router = useRouter();
  const { companies, getCompanyName } = useCompanies();
  const {
    kpiValues,
    isLoading,
    error,
    fetchAllKpiValues,
    removeKpiValue,
    clearError
  } = useKpis();

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedScenario, setSelectedScenario] = useState<FinancialScenario | 'all'>('all');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [kpiValueToDelete, setKpiValueToDelete] = useState<KpiValue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  // Fetch data on component mount
  useEffect(() => {
    fetchAllKpiValues();
  }, [fetchAllKpiValues]);

  // Get unique values for filters
  const uniqueCompanies = [...new Set(kpiValues.map(kv => kv.kpi?.companyId).filter(Boolean))];

  // Filter and sort KPI values
  const filteredAndSortedKpiValues = kpiValues
    .filter(kpiValue => {
      const matchesSearch = searchTerm === '' || 
        kpiValue.kpi?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCompanyName(kpiValue.kpi?.companyId || 0).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCompany = selectedCompany === 'all' || 
        kpiValue.kpi?.companyId === parseInt(selectedCompany);
      
      const matchesScenario = selectedScenario === 'all' || 
        kpiValue.scenario === selectedScenario;

      return matchesSearch && matchesCompany && matchesScenario;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      // Handle nested properties
      if (sortField === 'companyName') {
        aValue = getCompanyName(a.kpi?.companyId || 0);
        bValue = getCompanyName(b.kpi?.companyId || 0);
      } else if (sortField === 'kpiName') {
        aValue = a.kpi?.name || '';
        bValue = b.kpi?.name || '';
      }

      if (aValue === bValue) return 0;
      
      const result = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? result : -result;
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedKpiValues.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedKpiValues = filteredAndSortedKpiValues.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCompany, selectedScenario]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handleDelete = async (kpiValue: KpiValue) => {
    if (kpiValue.id) {
      const success = await removeKpiValue(kpiValue.id);
      if (success) {
        setKpiValueToDelete(null);
      }
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/kpis-values/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/kpis-values/${id}/edit`);
  };

  const formatKpiValue = (value: number | null, dataType: string = 'DECIMAL') => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (dataType) {
      case 'INTEGER':
        return Math.round(value).toLocaleString();
      case 'DECIMAL':
        return value.toLocaleString(undefined, { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 2 
        });
      case 'STRING':
        return String(value);
      default:
        return value.toString();
    }
  };

  const getScenarioBadge = (scenario: FinancialScenario) => {
    const colorMap: Record<FinancialScenario, string> = {
      'Actual': 'bg-green-500',
      'Forecast': 'bg-blue-500',
      'Budget': 'bg-orange-500',
    };
    
    return (
      <Badge className={`${colorMap[scenario] || 'bg-gray-500'}`}>
        {scenario}
      </Badge>
    );
  };

  const getPeriodDisplay = (kpiValue: KpiValue) => {
    if (kpiValue.fullYear) return 'Full Year';
    if (kpiValue.semester) return kpiValue.semester;
    if (kpiValue.quarter) return kpiValue.quarter;
    if (kpiValue.month) return kpiValue.month;
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KPI Values</CardTitle>
          <CardDescription>Loading KPI values...</CardDescription>
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
          <CardTitle>KPI Values</CardTitle>
          <CardDescription>Error loading KPI values</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchAllKpiValues()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>KPI Values</CardTitle>
            <CardDescription className="mt-1">
              Track and manage key performance indicator values over time
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Button onClick={() => router.push('/dashboard/kpis-values/new')} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add KPI Value
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="relative flex-1 w-full">
            <Input
              placeholder="Search KPI names, companies..."
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
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {uniqueCompanies.map(companyId => (
                  <SelectItem key={companyId} value={companyId.toString()}>
                    {getCompanyName(companyId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedScenario} onValueChange={value => setSelectedScenario(value as FinancialScenario | 'all')}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="All Scenarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scenarios</SelectItem>
                <SelectItem value="Actual">Actual</SelectItem>
                <SelectItem value="Forecast">Forecast</SelectItem>
                <SelectItem value="Budget">Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <Table className="text-sm">
            <TableCaption className="text-xs text-muted-foreground">
              {filteredAndSortedKpiValues.length === 0 
                ? 'No KPI values found' 
                : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredAndSortedKpiValues.length)} of ${filteredAndSortedKpiValues.length} KPI values`}
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('companyName')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Company
                    {getSortIcon('companyName')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('kpiName')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    KPI
                    {getSortIcon('kpiName')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('date')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Date
                    {getSortIcon('date')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Period</TableHead>
                <TableHead className="font-semibold">Scenario</TableHead>
                <TableHead className="font-semibold text-right">Value</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {paginatedKpiValues.map((kpiValue) => (
                <TableRow key={kpiValue.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {getCompanyName(kpiValue.kpi?.companyId || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{kpiValue.kpi?.name}</span>
                      {kpiValue.kpi?.isCalculated && (
                        <Badge variant="outline" className="text-xs">
                          Calculated
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {new Date(kpiValue.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {getPeriodDisplay(kpiValue) && (
                      <Badge variant="secondary" className="text-xs">
                        {getPeriodDisplay(kpiValue)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {getScenarioBadge(kpiValue.scenario)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatKpiValue(kpiValue.value, kpiValue.kpi?.dataType)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => kpiValue.id && handleViewDetails(kpiValue.id)}
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
                              onClick={() => kpiValue.id && handleEdit(kpiValue.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog open={kpiValueToDelete?.id === kpiValue.id} onOpenChange={(open) => {
                        if (!open) setKpiValueToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setKpiValueToDelete(kpiValue)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete KPI Value</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this KPI value? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(kpiValue)}
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
          {paginatedKpiValues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No KPI values found
            </div>
          ) : (
            paginatedKpiValues.map((kpiValue) => (
              <div key={kpiValue.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with company and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {getCompanyName(kpiValue.kpi?.companyId || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => kpiValue.id && handleViewDetails(kpiValue.id)}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => kpiValue.id && handleEdit(kpiValue.id)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={kpiValueToDelete?.id === kpiValue.id} onOpenChange={(open) => {
                      if (!open) setKpiValueToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setKpiValueToDelete(kpiValue)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete KPI Value</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this KPI value? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(kpiValue)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* KPI Name */}
                <div className="font-medium text-base mb-2">
                  {kpiValue.kpi?.name || 'Unknown KPI'}
                  {kpiValue.kpi?.isCalculated && (
                    <Badge variant="outline" className="text-xs ml-2">
                      Calculated
                    </Badge>
                  )}
                </div>

                {/* Date and Period */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="font-mono">{new Date(kpiValue.date).toLocaleDateString()}</span>
                  {getPeriodDisplay(kpiValue) && (
                    <Badge variant="secondary" className="text-xs">
                      {getPeriodDisplay(kpiValue)}
                    </Badge>
                  )}
                </div>

                {/* Scenario and Value */}
                <div className="flex items-center justify-between">
                  {getScenarioBadge(kpiValue.scenario)}
                  <span className="font-semibold text-lg">
                    {formatKpiValue(kpiValue.value, kpiValue.kpi?.dataType)}
                  </span>
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
            Page {currentPage} of {totalPages} ({filteredAndSortedKpiValues.length} total)
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