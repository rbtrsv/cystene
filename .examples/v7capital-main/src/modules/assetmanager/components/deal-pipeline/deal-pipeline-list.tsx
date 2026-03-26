'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDealPipeline } from '@/modules/assetmanager/hooks/use-deal-pipeline';
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
import { type DealPipeline, type DealStatus, type DealPriority, type SectorType } from '@/modules/assetmanager/schemas/deal-pipeline.schemas';

export default function DealPipelineList() {
  const router = useRouter();
  const { companies, getCompanyName } = useCompanies();
  const {
    dealPipelines,
    isLoading,
    error,
    fetchDealPipelines,
    removeDealPipeline,
    clearError
  } = useDealPipeline();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [dealToDelete, setDealToDelete] = useState<DealPipeline | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  useEffect(() => {
    fetchDealPipelines();
  }, [fetchDealPipelines]);

  // Filter deal pipeline based on search term, company, status, and priority filter
  const filteredDeals = dealPipelines.filter(deal => {
    const companyName = getCompanyName(deal.companyId);
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = searchTerm === '' || (
      (deal.dealName && deal.dealName.toLowerCase().includes(searchLower)) ||
      (deal.round && deal.round.toLowerCase().includes(searchLower)) ||
      (deal.sector && deal.sector.toLowerCase().includes(searchLower)) ||
      (companyName && companyName.toLowerCase().includes(searchLower))
    );
    
    const matchesCompany = filterCompany === 'ALL' ? true : deal.companyId.toString() === filterCompany;
    const matchesStatus = filterStatus === 'ALL' ? true : deal.status === filterStatus;
    const matchesPriority = filterPriority === 'ALL' ? true : deal.priority === filterPriority;
    
    return matchesSearch && matchesCompany && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    // Sort by updated date if sort order is specified
    if (sortOrder === 'none') return 0;
    
    const dateA = new Date(a.updatedAt).getTime();
    const dateB = new Date(b.updatedAt).getTime();
    
    if (sortOrder === 'asc') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredDeals.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedDeals = filteredDeals.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCompany, filterStatus, filterPriority]);

  const handleDelete = async (deal: DealPipeline) => {
    if (deal.id) {
      const success = await removeDealPipeline(deal.id);
      if (success) {
        setDealToDelete(null);
      }
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/deal-pipeline/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/deal-pipeline/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/dashboard/deal-pipeline/new');
  };

  const getStatusBadge = (status: DealStatus) => {
    const colorMap: Record<DealStatus, string> = {
      'Initial Screening': 'bg-gray-500',
      'First Meeting': 'bg-blue-500',
      'Follow Up': 'bg-yellow-500',
      'Due Diligence': 'bg-orange-500',
      'Negotiation': 'bg-purple-500',
      'Term Sheet': 'bg-indigo-500',
      'Legal Review': 'bg-pink-500',
      'Closing': 'bg-cyan-500',
      'Closed': 'bg-green-500',
      'Rejected': 'bg-red-500',
      'On Hold': 'bg-gray-400',
    };
    
    return (
      <Badge className={`${colorMap[status] || 'bg-gray-500'} text-white`}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: DealPriority) => {
    const colorMap: Record<DealPriority, string> = {
      'P1': 'bg-red-500',
      'P2': 'bg-orange-500',
      'P3': 'bg-yellow-500',
      'P4': 'bg-blue-500',
      'P5': 'bg-gray-500',
    };
    
    return (
      <Badge className={`${colorMap[priority] || 'bg-gray-500'} text-white`}>
        {priority}
      </Badge>
    );
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deal Pipeline</CardTitle>
          <CardDescription>Loading deal pipeline...</CardDescription>
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
          <CardTitle>Deal Pipeline</CardTitle>
          <CardDescription>Error loading deal pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchDealPipelines()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>Deal Pipeline</CardTitle>
            <CardDescription className="mt-1">
              Manage your investment pipeline and deal tracking
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Deal
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="relative flex-1 w-full">
            <Input
              placeholder="Search by deal name, company, round, or sector..."
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
              value={filterStatus}
              onValueChange={(value) => setFilterStatus(value)}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="Initial Screening">Initial Screening</SelectItem>
                <SelectItem value="First Meeting">First Meeting</SelectItem>
                <SelectItem value="Follow Up">Follow Up</SelectItem>
                <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Term Sheet">Term Sheet</SelectItem>
                <SelectItem value="Legal Review">Legal Review</SelectItem>
                <SelectItem value="Closing">Closing</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterPriority}
              onValueChange={(value) => setFilterPriority(value)}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="P1">P1</SelectItem>
                <SelectItem value="P2">P2</SelectItem>
                <SelectItem value="P3">P3</SelectItem>
                <SelectItem value="P4">P4</SelectItem>
                <SelectItem value="P5">P5</SelectItem>
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
              {filteredDeals.length === 0 
                ? 'No deals found' 
                : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredDeals.length)} of ${filteredDeals.length} deals`}
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Deal Name</TableHead>
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Round</TableHead>
                <TableHead className="font-semibold">Sector</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Pre-Money</TableHead>
                <TableHead className="font-semibold text-right">Post-Money</TableHead>
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
                    Updated
                    {sortOrder === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
                    {sortOrder === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
                    {sortOrder === 'none' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                  </Button>
                </TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {paginatedDeals.map((deal) => (
                <TableRow key={deal.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{deal.dealName}</TableCell>
                  <TableCell>
                    {getCompanyName(deal.companyId) || deal.companyId}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{deal.round}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {deal.sector}
                    </Badge>
                  </TableCell>
                  <TableCell>{getPriorityBadge(deal.priority)}</TableCell>
                  <TableCell>{getStatusBadge(deal.status)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {deal.preMoneyValuation ? formatCurrency(Number(deal.preMoneyValuation), 'USD') : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {deal.postMoneyValuation ? formatCurrency(Number(deal.postMoneyValuation), 'USD') : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {formatDate(deal.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deal.id && handleViewDetails(deal.id)}
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
                              onClick={() => deal.id && handleEdit(deal.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog open={dealToDelete?.id === deal.id} onOpenChange={(open) => {
                        if (!open) setDealToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDealToDelete(deal)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this deal? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(deal)}
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
          {paginatedDeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deals found
            </div>
          ) : (
            paginatedDeals.map((deal) => (
              <div key={deal.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with deal name and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {deal.dealName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deal.id && handleViewDetails(deal.id)}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deal.id && handleEdit(deal.id)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={dealToDelete?.id === deal.id} onOpenChange={(open) => {
                      if (!open) setDealToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDealToDelete(deal)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this deal? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(deal)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Company and Round row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">
                    {getCompanyName(deal.companyId) || deal.companyId}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-mono text-xs">{deal.round}</span>
                </div>

                {/* Status and Priority badges */}
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(deal.status)}
                  {getPriorityBadge(deal.priority)}
                  <Badge variant="outline" className="text-xs">
                    {deal.sector}
                  </Badge>
                </div>

                {/* Valuations */}
                {(deal.preMoneyValuation || deal.postMoneyValuation) && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {deal.preMoneyValuation && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        Pre: {formatCurrency(Number(deal.preMoneyValuation), 'USD')}
                      </Badge>
                    )}
                    {deal.postMoneyValuation && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        Post: {formatCurrency(Number(deal.postMoneyValuation), 'USD')}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({filteredDeals.length} total)
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