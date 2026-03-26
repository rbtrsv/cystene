'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSecurities } from '../../hooks/use-securities';
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/modules/shadcnui/components/ui/dropdown-menu';
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
import { Pencil, Trash2, Eye, MoreHorizontal, Plus, Filter } from 'lucide-react';
import { securityTypeEnum, type Security, type SecurityType } from '../../schemas/securities.schemas';

export default function SecurityList() {
  const router = useRouter();
  const { 
    securities, 
    isLoading, 
    error, 
    fetchSecurities, 
    removeSecurity,
    clearError 
  } = useSecurities();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<SecurityType | 'ALL'>('ALL');
  const [securityToDelete, setSecurityToDelete] = useState<Security | null>(null);
  
  useEffect(() => {
    fetchSecurities();
  }, [fetchSecurities]);
  
  // Filter securities based on search term and type filter
  const filteredSecurities = securities.filter(security => {
    const matchesSearch = 
      security.securityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      security.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'ALL' ? true : security.securityType === filterType;
    
    return matchesSearch && matchesType;
  });
  
  const handleDelete = async (security: Security) => {
    if (security.id) {
      const success = await removeSecurity(security.id);
      if (success) {
        setSecurityToDelete(null);
      }
    }
  };
  
  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/securities/${id}`);
  };
  
  const handleEdit = (id: number) => {
    router.push(`/dashboard/securities/${id}/edit`);
  };
  
  const handleCreate = () => {
    router.push('/dashboard/securities/new');
  };
  
  const getSecurityTypeBadge = (type: SecurityType) => {
    const colorMap: Record<SecurityType, string> = {
      'Common Shares': 'bg-blue-500',
      'Preferred Shares': 'bg-purple-500',
      'Convertible': 'bg-green-500',
      'Warrant': 'bg-yellow-500',
      'Option': 'bg-orange-500',
      'Bond': 'bg-red-500',
    };
    
    return (
      <Badge className={`${colorMap[type] || 'bg-gray-500'}`}>
        {type}
      </Badge>
    );
  };
  
  // Helper functions for dynamic table rendering
  interface DynamicColumnConfig {
    key: string;
    label: string;
    securityTypes: SecurityType[];
    render: (security: Security) => React.ReactNode;
  }

  // Dynamic column configurations
  const getDynamicColumns = (): DynamicColumnConfig[] => [
    {
      key: 'name',
      label: 'Name',
      securityTypes: ['Common Shares', 'Preferred Shares', 'Convertible', 'Warrant', 'Option', 'Bond'],
      render: (security) => <span className="font-medium">{security.securityName}</span>
    },
    {
      key: 'code', 
      label: 'Code',
      securityTypes: ['Common Shares', 'Preferred Shares', 'Convertible', 'Warrant', 'Option', 'Bond'],
      render: (security) => <span>{security.code}</span>
    },
    {
      key: 'type',
      label: 'Type', 
      securityTypes: ['Common Shares', 'Preferred Shares', 'Convertible', 'Warrant', 'Option', 'Bond'],
      render: (security) => getSecurityTypeBadge(security.securityType)
    },
    {
      key: 'issuePrice',
      label: 'Issue Price',
      securityTypes: ['Common Shares', 'Preferred Shares', 'Convertible', 'Bond'],
      render: (security) => security.issuePrice 
        ? formatCurrency(security.issuePrice, security.currency || 'USD')
        : '-'
    },
    {
      key: 'strikePrice',
      label: 'Strike Price',
      securityTypes: ['Option', 'Warrant'],
      render: (security) => security.strikePrice 
        ? formatCurrency(security.strikePrice, security.currency || 'USD') 
        : '-'
    },
    {
      key: 'optionType',
      label: 'Option Type',
      securityTypes: ['Option'],
      render: (security) => security.optionType || '-'
    },
    {
      key: 'warrantType',
      label: 'Warrant Type', 
      securityTypes: ['Warrant'],
      render: (security) => security.warrantType || '-'
    },
    {
      key: 'expirationDate',
      label: 'Expiration',
      securityTypes: ['Option', 'Warrant'],
      render: (security) => security.expirationDate 
        ? new Date(security.expirationDate).toLocaleDateString() 
        : '-'
    },
    {
      key: 'maturityDate',
      label: 'Maturity',
      securityTypes: ['Convertible', 'Bond'],
      render: (security) => security.maturityDate 
        ? new Date(security.maturityDate).toLocaleDateString() 
        : '-'
    },
    {
      key: 'liquidationPreference',
      label: 'Liquidation Pref',
      securityTypes: ['Preferred Shares'],
      render: (security) => security.liquidationPreference 
        ? `${security.liquidationPreference}x` 
        : '-'
    },
    {
      key: 'interestRate',
      label: 'Interest Rate',
      securityTypes: ['Convertible', 'Bond'],
      render: (security) => security.interestRate 
        ? `${security.interestRate}%` 
        : '-'
    },
    {
      key: 'principal',
      label: 'Principal',
      securityTypes: ['Bond'],
      render: (security) => security.principal 
        ? `${security.currency || '$'}${security.principal.toLocaleString()}` 
        : '-'
    },
    {
      key: 'roundId',
      label: 'Round',
      securityTypes: ['Common Shares', 'Preferred Shares', 'Convertible', 'Warrant', 'Option', 'Bond'],
      render: (security) => security.roundId ? `Round ${security.roundId}` : '-'
    },
    {
      key: 'vestingMonths',
      label: 'Vesting (Mo)',
      securityTypes: ['Option'],
      render: (security) => security.vestingMonths ? `${security.vestingMonths}` : '-'
    },
    {
      key: 'isActive',
      label: 'Status',
      securityTypes: ['Option'],
      render: (security) => security.isActive ? 
        <Badge className="bg-green-500">Active</Badge> : 
        <Badge className="bg-gray-500">Inactive</Badge>
    },
    {
      key: 'dealContext',
      label: 'Deal Context',
      securityTypes: ['Warrant'],
      render: (security) => security.dealContext || '-'
    },
  ];

  // Helper function to get relevant columns for current filter
  const getVisibleColumns = (filterType: SecurityType | 'ALL'): DynamicColumnConfig[] => {
    const columns = getDynamicColumns();
    
    if (filterType === 'ALL') {
      // Show common columns for all types
      return columns.filter(col => 
        ['name', 'code', 'type', 'issuePrice'].includes(col.key)
      );
    }
    
    // Show relevant columns for specific security type
    return columns.filter(col => 
      col.securityTypes.includes(filterType)
    );
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Securities</CardTitle>
          <CardDescription>Loading securities...</CardDescription>
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
          <CardTitle>Securities</CardTitle>
          <CardDescription>Error loading securities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchSecurities()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Securities</CardTitle>
          <CardDescription>Manage your securities</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Security
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search securities..."
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
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as SecurityType | 'ALL')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {Object.values(securityTypeEnum.enum).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table className="text-sm min-w-[1000px]">
            <TableCaption>
              {filteredSecurities.length === 0 
                ? 'No securities found' 
                : `Showing ${filteredSecurities.length} of ${securities.length} securities`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                {getVisibleColumns(filterType).map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSecurities.map((security) => (
                <TableRow key={security.id}>
                  {getVisibleColumns(filterType).map((column) => (
                    <TableCell key={column.key}>
                      {column.render(security)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => security.id && handleViewDetails(security.id)}
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
                              onClick={() => security.id && handleEdit(security.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog open={securityToDelete?.id === security.id} onOpenChange={(open) => {
                        if (!open) setSecurityToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSecurityToDelete(security)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Security</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the security &quot;{security.securityName}&quot;? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(security)}
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
          {filteredSecurities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No securities found
            </div>
          ) : (
            filteredSecurities.map((security) => (
              <div key={security.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with name and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">
                      {security.securityName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => security.id && handleViewDetails(security.id)}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => security.id && handleEdit(security.id)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={securityToDelete?.id === security.id} onOpenChange={(open) => {
                      if (!open) setSecurityToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSecurityToDelete(security)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Security</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the security &quot;{security.securityName}&quot;? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(security)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Type and code row */}
                <div className="flex items-center gap-2 mb-2">
                  {getSecurityTypeBadge(security.securityType)}
                  {security.code && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {security.code}
                    </span>
                  )}
                </div>

                {/* Price info */}
                <div className="text-xs text-muted-foreground">
                  {security.issuePrice && (
                    <div>
                      Issue Price: <span className="font-mono">{formatCurrency(security.issuePrice, security.currency || 'USD')}</span>
                    </div>
                  )}
                  {security.strikePrice && (
                    <div>
                      Strike Price: <span className="font-mono">{formatCurrency(security.strikePrice, security.currency || 'USD')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
