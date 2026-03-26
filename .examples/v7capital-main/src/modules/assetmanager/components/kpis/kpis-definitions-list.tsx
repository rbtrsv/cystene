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
import { Pencil, Trash2, Eye, Plus, ArrowUpDown, ArrowUp, ArrowDown, Settings2 } from 'lucide-react';
import { type Kpi, type KpiDataType } from '@/modules/assetmanager/schemas/kpis.schemas';

export default function KpisDefinitionsList() {
  const router = useRouter();
  const { companies, getCompanyName } = useCompanies();
  const {
    kpis,
    isLoading,
    error,
    fetchKpis,
    removeKpi,
    clearError,
    getKpiTypeLabel
  } = useKpis();

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedDataType, setSelectedDataType] = useState<KpiDataType | 'all'>('all');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [kpiToDelete, setKpiToDelete] = useState<Kpi | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  // Fetch data on component mount
  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  // Get unique values for filters
  const uniqueCompanies = [...new Set(kpis.map(kpi => kpi.companyId))];
  const uniqueDataTypes: KpiDataType[] = [...new Set(kpis.map(kpi => kpi.dataType))] as KpiDataType[];

  // Filter and sort KPIs
  const filteredAndSortedKpis = kpis
    .filter(kpi => {
      const matchesSearch = searchTerm === '' || 
        kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kpi.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCompanyName(kpi.companyId).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCompany = selectedCompany === 'all' || 
        kpi.companyId === parseInt(selectedCompany);
      
      const matchesDataType = selectedDataType === 'all' || 
        kpi.dataType === selectedDataType;

      return matchesSearch && matchesCompany && matchesDataType;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      // Handle nested properties
      if (sortField === 'company') {
        aValue = getCompanyName(a.companyId);
        bValue = getCompanyName(b.companyId);
      }

      if (aValue === bValue) return 0;
      
      const result = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? result : -result;
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedKpis.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedKpis = filteredAndSortedKpis.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCompany, selectedDataType]);

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

  const handleDelete = async (kpi: Kpi) => {
    if (kpi.id) {
      const success = await removeKpi(kpi.id);
      if (success) {
        setKpiToDelete(null);
      }
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/kpis-definitions/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/kpis-definitions/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/dashboard/kpis-definitions/new');
  };

  const getDataTypeBadgeVariant = (dataType: KpiDataType) => {
    switch (dataType) {
      case 'DECIMAL': return 'default';
      case 'INTEGER': return 'secondary';
      case 'STRING': return 'outline';
      default: return 'default';
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KPI Definitions</CardTitle>
          <CardDescription>Error loading KPI definitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchKpis()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>KPI Definitions</CardTitle>
            <CardDescription className="mt-1">
              Define key performance indicators that can be tracked over time
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add KPI Definition
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="relative flex-1 w-full">
            <Input
              placeholder="Search KPI names, descriptions, companies..."
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
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by company" />
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

            <Select value={selectedDataType} onValueChange={(value) => setSelectedDataType(value as KpiDataType | 'all')}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DECIMAL">Decimal</SelectItem>
                <SelectItem value="INTEGER">Integer</SelectItem>
                <SelectItem value="STRING">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <Table className="text-sm">
            <TableCaption className="text-xs text-muted-foreground">
              {filteredAndSortedKpis.length === 0 
                ? 'No KPI definitions found' 
                : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredAndSortedKpis.length)} of ${filteredAndSortedKpis.length} KPI definitions`}
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('company')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Company
                    {getSortIcon('company')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    KPI Name
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('dataType')}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Data Type
                    {getSortIcon('dataType')}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold">Formula</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {paginatedKpis.map((kpi) => (
                <TableRow key={kpi.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {getCompanyName(kpi.companyId) || kpi.companyId}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{kpi.name}</span>
                      {kpi.isCalculated && (
                        <Badge variant="outline" className="text-xs">
                          Calculated
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-muted-foreground">
                      {kpi.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getDataTypeBadgeVariant(kpi.dataType)}>
                      {getKpiTypeLabel(kpi.dataType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate font-mono text-xs">
                      {kpi.formula || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => kpi.id && handleViewDetails(kpi.id)}
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
                              onClick={() => kpi.id && handleEdit(kpi.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog open={kpiToDelete?.id === kpi.id} onOpenChange={(open) => {
                        if (!open) setKpiToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setKpiToDelete(kpi)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete KPI Definition</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this KPI definition? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(kpi)}
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
          {paginatedKpis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No KPI definitions found
            </div>
          ) : (
            paginatedKpis.map((kpi) => (
              <div key={kpi.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with company and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {getCompanyName(kpi.companyId) || kpi.companyId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => kpi.id && handleViewDetails(kpi.id)}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => kpi.id && handleEdit(kpi.id)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={kpiToDelete?.id === kpi.id} onOpenChange={(open) => {
                      if (!open) setKpiToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setKpiToDelete(kpi)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete KPI Definition</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this KPI definition? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(kpi)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* KPI Name and badges */}
                <div className="font-medium text-base mb-2">
                  {kpi.name}
                  {kpi.isCalculated && (
                    <Badge variant="outline" className="text-xs ml-2">
                      Calculated
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {kpi.description && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {kpi.description}
                  </div>
                )}

                {/* Data type and formula */}
                <div className="flex items-center justify-between">
                  <Badge variant={getDataTypeBadgeVariant(kpi.dataType)}>
                    {getKpiTypeLabel(kpi.dataType)}
                  </Badge>
                  {kpi.formula && (
                    <span className="font-mono text-xs text-muted-foreground truncate ml-2">
                      {kpi.formula}
                    </span>
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
            Page {currentPage} of {totalPages} ({filteredAndSortedKpis.length} total)
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