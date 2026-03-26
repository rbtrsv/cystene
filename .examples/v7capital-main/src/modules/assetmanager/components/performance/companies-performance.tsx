'use client';

import React, { useEffect, useState } from 'react';
import { useFunds } from '../../hooks/use-funds';
import { usePerformance } from '../../hooks/use-performance';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { RefreshCcw, Building2 } from 'lucide-react';
import { cn } from '@/modules/shadcnui/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';

export default function CompaniesPerformance() {
  // ===== STATE AND HOOKS =====
  const { funds, fetchFunds, hasFunds } = useFunds();
  const { 
    companyPerformances,
    isLoading, 
    error, 
    fetchCompaniesPerformance,
    clearError,
    formatPercentage,
    formatRatio,
    formatCurrency
  } = usePerformance();
  
  const [selectedFund, setSelectedFund] = useState<number | null>(null);
  
  // ===== EFFECTS =====
  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  useEffect(() => {
    if (hasFunds() && !selectedFund) {
      setSelectedFund(funds[0].id);
    }
  }, [funds, hasFunds, selectedFund]);

  useEffect(() => {
    if (selectedFund) {
      fetchCompaniesPerformance(selectedFund);
    }
  }, [selectedFund, fetchCompaniesPerformance]);
  
  // ===== EVENT HANDLERS =====
  const handleFundChange = (fundId: string) => {
    setSelectedFund(Number(fundId));
  };

  const handleRefresh = () => {
    clearError();
    if (selectedFund) {
      fetchCompaniesPerformance(selectedFund);
    }
  };
  
  // ===== HELPER FUNCTIONS =====
  const getPerformanceColor = (value: number | null) => {
    if (value === null) return 'text-muted-foreground';
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Companies Performance</CardTitle>
          <CardDescription>Loading company performance data...</CardDescription>
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
          <CardTitle>Companies Performance</CardTitle>
          <CardDescription>Error loading performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={handleRefresh} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasFunds()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Companies Performance</CardTitle>
          <CardDescription>No funds available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">No funds available</p>
            <p className="text-sm">Create a fund to view company performance.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedFundName = funds.find(f => f.id === selectedFund)?.name;

  // ===== MAIN COMPONENT RENDER =====
  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <CardTitle className="text-xl md:text-2xl font-bold">Companies Performance</CardTitle>
          <CardDescription>
            Investment performance analysis for portfolio companies
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select value={selectedFund?.toString() || ''} onValueChange={handleFundChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select Fund" />
            </SelectTrigger>
            <SelectContent>
              {funds.map((fund) => (
                <SelectItem key={fund.id} value={fund.id.toString()}>
                  {fund.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="w-full sm:w-auto">
            <RefreshCcw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Performance Results */}
        {companyPerformances.length > 0 ? (
          <div className="space-y-6">
            {/* Performance Header */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold truncate">{selectedFundName}</h3>
                <p className="text-sm text-muted-foreground">
                  {companyPerformances.length} portfolio companies
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {companyPerformances.filter(p => p.isValid).length} / {companyPerformances.length} Valid IRR
                </Badge>
              </div>
            </div>

            {/* Company Performance Table - Desktop */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead className="text-center">IRR</TableHead>
                    <TableHead className="text-center">TVPI</TableHead>
                    <TableHead className="text-center">DPI</TableHead>
                    <TableHead className="text-center">RVPI</TableHead>
                    <TableHead className="text-right">Invested</TableHead>
                    <TableHead className="text-right">Returned</TableHead>
                    <TableHead className="text-right">Current Fair Value</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyPerformances.map((performance) => (
                    <TableRow key={performance.companyId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{performance.companyName}</p>
                          <p className="text-xs text-muted-foreground">
                            {performance.cashFlowCount} cash flows
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={getPerformanceColor(performance.irr)}>
                          {formatPercentage(performance.irr)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={performance.tvpi && performance.tvpi >= 1 ? 'text-green-600' : 'text-red-600'}>
                          {formatRatio(performance.tvpi)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={performance.dpi && performance.dpi >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatRatio(performance.dpi)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={performance.rvpi && performance.rvpi >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatRatio(performance.rvpi)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-right font-mono">
                        {formatCurrency(performance.totalInvested)}
                      </TableCell>
                      
                      <TableCell className="text-right font-mono">
                        {formatCurrency(performance.totalReturned)}
                      </TableCell>
                      
                      <TableCell className="text-right font-mono">
                        {formatCurrency(performance.fairValue)}
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <Badge variant={performance.isValid ? "default" : "destructive"}>
                          {performance.isValid ? "Valid" : "Invalid"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Company Performance Cards - Mobile */}
            <div className="md:hidden space-y-3">
              {companyPerformances.map((performance) => (
                <Card key={performance.companyId} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{performance.companyName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {performance.cashFlowCount} cash flows
                      </p>
                    </div>
                    <Badge variant={performance.isValid ? "default" : "destructive"} className="text-xs">
                      {performance.isValid ? "Valid" : "Invalid"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IRR:</span>
                      <span className={getPerformanceColor(performance.irr)}>
                        {formatPercentage(performance.irr)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TVPI:</span>
                      <span className={performance.tvpi && performance.tvpi >= 1 ? 'text-green-600' : 'text-red-600'}>
                        {formatRatio(performance.tvpi)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DPI:</span>
                      <span className={performance.dpi && performance.dpi >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatRatio(performance.dpi)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RVPI:</span>
                      <span className={performance.rvpi && performance.rvpi >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatRatio(performance.rvpi)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm pt-2 border-t">
                    <div>
                      <span className="text-muted-foreground">Invested: </span>
                      <span className="font-mono">{formatCurrency(performance.totalInvested)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Returned: </span>
                      <span className="font-mono">{formatCurrency(performance.totalReturned)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-center items-center text-sm pt-2 border-t mt-2">
                    <span className="text-muted-foreground">Current Fair Value: </span>
                    <span className="font-mono ml-2">{formatCurrency(performance.fairValue)}</span>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Companies</p>
                <p className="text-lg sm:text-xl font-semibold">{companyPerformances.length}</p>
              </div>
              
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Average IRR</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {companyPerformances.filter(p => p.isValid && p.irr !== null).length > 0
                    ? formatPercentage(
                        companyPerformances
                          .filter(p => p.isValid && p.irr !== null)
                          .reduce((sum, p) => sum + (p.irr || 0), 0) / 
                        companyPerformances.filter(p => p.isValid && p.irr !== null).length
                      )
                    : 'N/A'
                  }
                </p>
              </div>
              
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Invested</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {formatCurrency(companyPerformances.reduce((sum, p) => sum + p.totalInvested, 0))}
                </p>
              </div>
              
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Returned</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {formatCurrency(companyPerformances.reduce((sum, p) => sum + p.totalReturned, 0))}
                </p>
              </div>
            </div>
            
            {/* Performance Metrics Explanation */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
              <p><strong>Performance Metrics Explanation:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>IRR (Internal Rate of Return):</strong> Annualized effective compound return rate</li>
                <li><strong>TVPI (Total Value to Paid-In):</strong> (Current Fair Value + Distributions) ÷ Total Invested</li>
                <li><strong>DPI (Distribution to Paid-In):</strong> Total Distributions ÷ Total Invested</li>
                <li><strong>RVPI (Residual Value to Paid-In):</strong> Current Fair Value ÷ Total Invested</li>
              </ul>
            </div>

            {/* Data Sources Explanation */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
              <p><strong>Data Sources:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>Invested:</strong> Fund&apos;s investments into the company from Portfolio Cash Flows table (negative cash flows)</li>
                <li><strong>Returned:</strong> Distributions received from the company from Portfolio Cash Flows table (positive cash flows)</li>
                <li><strong>Current Fair Value:</strong> Current valuation of the investment from Investment Portfolio table</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No company performance data available</p>
            <p className="text-sm">Performance metrics will appear when companies have portfolio cash flows.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}