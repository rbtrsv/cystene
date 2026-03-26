'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFeeCosts } from '@/modules/assetmanager/hooks/use-fee-costs';
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
import { type FeeCost, type FeeCostType, type Frequency, getFeeCostTypeLabel, getFrequencyLabel } from '@/modules/assetmanager/schemas/fee-costs.schemas';

export default function FeeCostsList() {
  const router = useRouter();
  const { funds, getFundName } = useFunds();
  const {
    feeCosts,
    isLoading,
    error,
    fetchFeeCosts,
    removeFeeCost,
    clearError
  } = useFeeCosts();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFund, setFilterFund] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterFrequency, setFilterFrequency] = useState<string>('ALL');
  const [feeCostToDelete, setFeeCostToDelete] = useState<FeeCost | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);

  useEffect(() => {
    fetchFeeCosts();
  }, [fetchFeeCosts]);

  // Filter fee costs based on search term, fund, type, and frequency filter
  const filteredFeeCosts = feeCosts.filter(feeCost => {
    const fundName = getFundName(feeCost.fundId);
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = searchTerm === '' || (
      (feeCost.feeCostName && feeCost.feeCostName.toLowerCase().includes(searchLower)) ||
      (feeCost.description && feeCost.description.toLowerCase().includes(searchLower)) ||
      (feeCost.feeCostType && feeCost.feeCostType.toLowerCase().includes(searchLower)) ||
      (fundName && fundName.toLowerCase().includes(searchLower))
    );
    
    const matchesFund = filterFund === 'ALL' ? true : feeCost.fundId.toString() === filterFund;
    const matchesType = filterType === 'ALL' ? true : feeCost.feeCostType === filterType;
    const matchesFrequency = filterFrequency === 'ALL' ? true : feeCost.frequency === filterFrequency;
    
    return matchesSearch && matchesFund && matchesType && matchesFrequency;
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
  const totalPages = Math.ceil(filteredFeeCosts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFeeCosts = filteredFeeCosts.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterFund, filterType, filterFrequency]);

  const handleDelete = async (feeCost: FeeCost) => {
    if (feeCost.id) {
      const success = await removeFeeCost(feeCost.id);
      if (success) {
        setFeeCostToDelete(null);
      }
    }
  };

  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/fee-costs/${id}`);
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/fee-costs/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/dashboard/fee-costs/new');
  };

  const getTypeBadge = (type: FeeCostType) => {
    const colorMap: Record<FeeCostType, string> = {
      'MANAGEMENT': 'bg-blue-500',
      'PERFORMANCE': 'bg-green-500',
      'SETUP': 'bg-yellow-500',
      'ADMINISTRATIVE': 'bg-purple-500',
      'LEGAL': 'bg-red-500',
      'AUDIT': 'bg-orange-500',
      'CUSTODIAN': 'bg-cyan-500',
      'OTHER': 'bg-gray-500',
    };
    
    return (
      <Badge className={`${colorMap[type] || 'bg-gray-500'} text-white`}>
        {getFeeCostTypeLabel(type)}
      </Badge>
    );
  };

  const getFrequencyBadge = (frequency: Frequency) => {
    const colorMap: Record<Frequency, string> = {
      'ONE_TIME': 'bg-gray-500',
      'MONTHLY': 'bg-blue-500',
      'QUARTERLY': 'bg-orange-500',
      'ANNUAL': 'bg-green-500',
    };
    
    return (
      <Badge className={`${colorMap[frequency] || 'bg-gray-500'} text-white`}>
        {getFrequencyLabel(frequency)}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    if (!date) return '-';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fee Costs</CardTitle>
          <CardDescription>Loading fee costs...</CardDescription>
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
          <CardTitle>Fee Costs</CardTitle>
          <CardDescription>Error loading fee costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchFeeCosts()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
      <CardHeader>
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle>Fee Costs</CardTitle>
            <CardDescription className="mt-1">
              Manage fund administration fees and costs
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Fee Cost
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="relative flex-1 w-full">
            <Input
              placeholder="Search by name, fund, type, or description..."
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
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value)}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="MANAGEMENT">Management</SelectItem>
                <SelectItem value="PERFORMANCE">Performance</SelectItem>
                <SelectItem value="SETUP">Setup</SelectItem>
                <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                <SelectItem value="LEGAL">Legal</SelectItem>
                <SelectItem value="AUDIT">Audit</SelectItem>
                <SelectItem value="CUSTODIAN">Custodian</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterFrequency}
              onValueChange={(value) => setFilterFrequency(value)}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Frequencies</SelectItem>
                <SelectItem value="ONE_TIME">One-time</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="ANNUAL">Annual</SelectItem>
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
              {filteredFeeCosts.length === 0 
                ? 'No fee costs found' 
                : `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredFeeCosts.length)} of ${filteredFeeCosts.length} fee costs`}
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Fund</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Frequency</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
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
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm">
              {paginatedFeeCosts.map((feeCost) => (
                <TableRow key={feeCost.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {feeCost.feeCostName || `${feeCost.feeCostType} Fee`}
                  </TableCell>
                  <TableCell>
                    {getFundName(feeCost.fundId) || feeCost.fundId}
                  </TableCell>
                  <TableCell>{getTypeBadge(feeCost.feeCostType)}</TableCell>
                  <TableCell>{getFrequencyBadge(feeCost.frequency)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(feeCost.amount, 'USD')}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {formatDate(feeCost.date)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {feeCost.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => feeCost.id && handleViewDetails(feeCost.id)}
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
                              onClick={() => feeCost.id && handleEdit(feeCost.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog open={feeCostToDelete?.id === feeCost.id} onOpenChange={(open) => {
                        if (!open) setFeeCostToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFeeCostToDelete(feeCost)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Fee Cost</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this fee cost? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(feeCost)}
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
          {paginatedFeeCosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fee costs found
            </div>
          ) : (
            paginatedFeeCosts.map((feeCost) => (
              <div key={feeCost.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with name and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {feeCost.feeCostName || `${feeCost.feeCostType} Fee`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => feeCost.id && handleViewDetails(feeCost.id)}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => feeCost.id && handleEdit(feeCost.id)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={feeCostToDelete?.id === feeCost.id} onOpenChange={(open) => {
                      if (!open) setFeeCostToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setFeeCostToDelete(feeCost)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Fee Cost</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this fee cost? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(feeCost)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Fund and Date row */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">
                    {getFundName(feeCost.fundId) || feeCost.fundId}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-mono text-xs">{formatDate(feeCost.date)}</span>
                </div>

                {/* Type and Frequency badges */}
                <div className="flex items-center gap-2 mb-2">
                  {getTypeBadge(feeCost.feeCostType)}
                  {getFrequencyBadge(feeCost.frequency)}
                </div>

                {/* Amount and Description */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-xs font-mono">
                    {formatCurrency(feeCost.amount, 'USD')}
                  </Badge>
                  {feeCost.description && (
                    <span className="text-muted-foreground truncate">
                      {feeCost.description}
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
            Page {currentPage} of {totalPages} ({filteredFeeCosts.length} total)
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
    </div>
  );
}