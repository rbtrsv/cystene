'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFunds } from '../../hooks/use-funds';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/modules/shadcnui/components/ui/tooltip';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Pencil, Trash2, Eye, Plus, BarChart3 } from 'lucide-react';
import { type Fund, type FundStatus } from '../../schemas/funds.schemas';

export default function FundList() {
  const router = useRouter();
  const { 
    funds, 
    isLoading, 
    error, 
    fetchFunds, 
    removeFund,
    clearError 
  } = useFunds();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [fundToDelete, setFundToDelete] = useState<Fund | null>(null);
  
  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);
  
  // Filter funds based on search term
  const filteredFunds = funds.filter(fund => {
    return (
      fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fund.description && fund.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  const handleDelete = async (fund: Fund) => {
    if (fund.id) {
      const success = await removeFund(fund.id);
      if (success) {
        setFundToDelete(null);
      }
    }
  };
  
  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/funds/${id}`);
  };
  
  const handleEdit = (id: number) => {
    router.push(`/dashboard/funds/${id}/edit`);
  };
  
  const handleManageRounds = (id: number) => {
    router.push(`/dashboard/funds/${id}/rounds`);
  };
  
  const handleCreate = () => {
    router.push('/dashboard/funds/new');
  };
  
  // Helper function to format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Status badge color mapping
  const getStatusBadge = (status: FundStatus) => {
    const colorMap: Record<FundStatus, string> = {
      'Active': 'bg-green-500',
      'Fundraising': 'bg-blue-500',
      'Closed': 'bg-gray-500',
      'Liquidating': 'bg-red-500',
    };
    
    return (
      <Badge className={`${colorMap[status] || 'bg-gray-500'}`}>
        {status}
      </Badge>
    );
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funds</CardTitle>
          <CardDescription>Loading funds...</CardDescription>
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
          <CardTitle>Funds</CardTitle>
          <CardDescription>Error loading funds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchFunds()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Funds</CardTitle>
          <CardDescription>Manage your investment funds</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Fund
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search funds..."
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
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table className="text-sm min-w-[1000px]">
            <TableCaption className="text-xs text-muted-foreground">
              {filteredFunds.length === 0 
                ? 'No funds found' 
                : `Showing ${filteredFunds.length} of ${funds.length} funds`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Vintage</TableHead>
                <TableHead>Target Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFunds.map((fund) => (
                <TableRow key={fund.id}>
                  <TableCell className="font-medium">{fund.name}</TableCell>
                  <TableCell>{fund.vintage || 'N/A'}</TableCell>
                  <TableCell>
                    {fund.targetSize ? formatCurrency(fund.targetSize) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(fund.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex justify-end space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => fund.id && handleViewDetails(fund.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => fund.id && handleManageRounds(fund.id)}
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Manage Rounds</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => fund.id && handleEdit(fund.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <AlertDialog open={fundToDelete?.id === fund.id} onOpenChange={(open) => {
                          if (!open) setFundToDelete(null);
                        }}>
                          <AlertDialogTrigger asChild>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setFundToDelete(fund)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete</p>
                              </TooltipContent>
                            </Tooltip>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Fund</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the fund &quot;{fund.name}&quot;? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(fund)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile List View */}
        <div className="md:hidden space-y-2">
          {filteredFunds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No funds found
            </div>
          ) : (
            filteredFunds.map((fund) => (
              <div key={fund.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with name and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">
                      {fund.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fund.id && handleViewDetails(fund.id)}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fund.id && handleEdit(fund.id)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={fundToDelete?.id === fund.id} onOpenChange={(open) => {
                      if (!open) setFundToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setFundToDelete(fund)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Fund</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the fund &quot;{fund.name}&quot;? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(fund)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Status and vintage row */}
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(fund.status)}
                  {fund.vintage && (
                    <span className="text-xs text-muted-foreground">
                      Vintage: {fund.vintage}
                    </span>
                  )}
                </div>

                {/* Target size row */}
                {fund.targetSize && (
                  <div className="text-xs text-muted-foreground">
                    <span>Target Size: </span>
                    <span className="font-mono">{formatCurrency(fund.targetSize)}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
