'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/modules/assetmanager/utils/currency.utils';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useCapTable } from '@/modules/assetmanager/hooks/use-captable';
import type { CapTableRow } from '@/modules/assetmanager/schemas/captable.schemas';

type SortField = 'stakeholderName' | 'stakeholderType' | 'totalEquityShares' | 'equityOwnershipPercentage' | 'totalInvestment';
type SortDirection = 'asc' | 'desc';

export function CapTableTable() {
  const { 
    filteredCapTable, 
    filters,
    setFilters,
    filterByStakeholderType,
    filterBySecurityType,
    clearFilters,
  } = useCapTable();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('equityOwnershipPercentage');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filter data by search term (local filtering for responsiveness)
  const searchFilteredData = filteredCapTable.filter(row =>
    row.stakeholderName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort data
  const sortedData = [...searchFilteredData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? 
        <ChevronUp className="w-4 h-4 ml-1" /> : 
        <ChevronDown className="w-4 h-4 ml-1" />
      )}
    </Button>
  );
  
  const formatCurrencyWithCode = (amount: number, currency: string) => {
    return formatCurrency(amount, currency);
  };
  
  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };
  
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  const getStakeholderTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'Fund': return 'default';
      case 'Investor': return 'secondary';
      case 'Employee': return 'outline';
      default: return 'secondary';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search stakeholders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select 
          value={filters.stakeholderTypes?.[0] || 'all'} 
          onValueChange={(value) => filterByStakeholderType(value === 'all' ? [] : [value])}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Stakeholder Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Fund">Fund</SelectItem>
            <SelectItem value="Investor">Investor</SelectItem>
            <SelectItem value="Employee">Employee</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          value={filters.securityTypes?.[0] || 'all'} 
          onValueChange={(value) => filterBySecurityType(value === 'all' ? [] : [value])}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Security Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Securities</SelectItem>
            <SelectItem value="COMMON_STOCK">Common Stock</SelectItem>
            <SelectItem value="PREFERRED_STOCK">Preferred Stock</SelectItem>
            <SelectItem value="STOCK_OPTION">Stock Options</SelectItem>
            <SelectItem value="WARRANT">Warrants</SelectItem>
            <SelectItem value="CONVERTIBLE_NOTE">Convertible Notes</SelectItem>
          </SelectContent>
        </Select>
        
        {(filters.stakeholderTypes?.length || filters.securityTypes?.length || searchTerm) && (
          <Button 
            variant="outline" 
            onClick={() => {
              clearFilters();
              setSearchTerm('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>
      
      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedData.length} of {filteredCapTable.length} stakeholders
      </div>
      
      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton field="stakeholderName">Stakeholder</SortButton>
              </TableHead>
              <TableHead>
                <SortButton field="stakeholderType">Type</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="totalEquityShares">Equity Shares</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton field="equityOwnershipPercentage">Ownership %</SortButton>
              </TableHead>
              <TableHead className="text-right">Securities Breakdown</TableHead>
              <TableHead className="text-right">
                <SortButton field="totalInvestment">Investment</SortButton>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm || filters.stakeholderTypes?.length || filters.securityTypes?.length 
                    ? 'No stakeholders match the current filters'
                    : 'No stakeholders found'
                  }
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row) => (
                <TableRow key={row.stakeholderId} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="font-medium">{row.stakeholderName}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStakeholderTypeBadgeVariant(row.stakeholderType)}>
                      {row.stakeholderType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(row.totalEquityShares)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="font-medium">{formatPercentage(row.equityOwnershipPercentage)}</div>
                    {row.fullyDilutedOwnershipPercentage !== row.equityOwnershipPercentage && (
                      <div className="text-xs text-muted-foreground">
                        {formatPercentage(row.fullyDilutedOwnershipPercentage)} fully diluted
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      {row.commonShares > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Common: {formatNumber(row.commonShares)}
                        </Badge>
                      )}
                      {row.preferredShares > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Preferred: {formatNumber(row.preferredShares)}
                        </Badge>
                      )}
                      {row.options > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Options: {formatNumber(row.options)}
                        </Badge>
                      )}
                      {row.warrants > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Warrants: {formatNumber(row.warrants)}
                        </Badge>
                      )}
                      {row.convertibles > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Convertibles: {formatNumber(row.convertibles)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrencyWithCode(row.totalInvestment, row.currency)}
                    {row.totalEquityShares > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrencyWithCode(row.averagePricePerShare, row.currency)}/share avg
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
