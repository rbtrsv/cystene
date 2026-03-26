'use client';

import React, { useEffect, useState } from 'react';
import { useFunds } from '../../hooks/use-funds';
import { useRounds } from '../../hooks/use-rounds';
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
import { RefreshCcw, Users } from 'lucide-react';
import { cn } from '@/modules/shadcnui/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';

export default function StakeholdersPerformance() {
  // ===== STATE AND HOOKS =====
  const { funds, fetchFunds, hasFunds } = useFunds();
  const { rounds, fetchRoundsByFund } = useRounds();
  const { 
    stakeholderPerformances,
    isLoading, 
    error, 
    fetchStakeholdersPerformance,
    clearError,
    formatPercentage,
    formatRatio,
    formatCurrency
  } = usePerformance();
  
  const [selectedFund, setSelectedFund] = useState<number | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  
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
      fetchRoundsByFund(selectedFund);
      fetchStakeholdersPerformance(selectedFund, selectedRound || undefined);
    }
  }, [selectedFund, selectedRound, fetchRoundsByFund, fetchStakeholdersPerformance]);
  
  // ===== EVENT HANDLERS =====
  const handleFundChange = (fundId: string) => {
    setSelectedFund(Number(fundId));
    setSelectedRound(null);
  };

  const handleRoundChange = (roundId: string) => {
    if (roundId === 'all') {
      setSelectedRound(null);
    } else {
      setSelectedRound(Number(roundId));
    }
  };

  const handleRefresh = () => {
    clearError();
    if (selectedFund) {
      fetchStakeholdersPerformance(selectedFund, selectedRound || undefined);
    }
  };
  
  // ===== HELPER FUNCTIONS =====
  const getPerformanceColor = (value: number | null) => {
    if (value === null) return 'text-muted-foreground';
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Filter stakeholders by selected fund
  const filteredStakeholders = stakeholderPerformances.filter(s => 
    selectedFund ? s.fundId === selectedFund : true
  );

  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stakeholders Returns</CardTitle>
          <CardDescription>Loading stakeholder returns data...</CardDescription>
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
          <CardTitle>Stakeholders Returns</CardTitle>
          <CardDescription>Error loading returns data</CardDescription>
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
          <CardTitle>Stakeholders Returns</CardTitle>
          <CardDescription>No funds available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">No funds available</p>
            <p className="text-sm">Create a fund to view stakeholder returns.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedFundName = funds.find(f => f.id === selectedFund)?.name;
  const selectedRoundName = selectedRound ? rounds.find(r => r.id === selectedRound)?.roundName : null;

  // ===== MAIN COMPONENT RENDER =====
  return (
    <Card>
      {/* ===== CARD HEADER WITH TITLE AND CONTROLS ===== */}
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <CardTitle className="text-xl md:text-2xl font-bold">Stakeholders Returns</CardTitle>
          <CardDescription>
            Individual stakeholder returns analysis with attribution
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select value={selectedFund?.toString()} onValueChange={handleFundChange}>
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
          
          <Select value={selectedRound?.toString() || 'all'} onValueChange={handleRoundChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Rounds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rounds</SelectItem>
              {rounds.map((round) => (
                <SelectItem key={round.id} value={round.id.toString()}>
                  {round.roundName}
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
      
      {/* ===== CARD CONTENT WITH STAKEHOLDER TABLE ===== */}
      <CardContent>
        {filteredStakeholders.length > 0 ? (
          <div className="space-y-6">
            {/* Performance Summary */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedFundName}
                  {selectedRoundName && ` - Through ${selectedRoundName}`}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {filteredStakeholders.length} stakeholders
                  {selectedRoundName && " (invested up to this round)"}
                </p>
              </div>
            </div>

            {/* Stakeholder Performance Table - Desktop */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Stakeholder</TableHead>
                    <TableHead className="text-center">Ownership</TableHead>
                    <TableHead className="text-center">IRR</TableHead>
                    <TableHead className="text-center">TVPI</TableHead>
                    <TableHead className="text-center">DPI</TableHead>
                    <TableHead className="text-center">RVPI</TableHead>
                    <TableHead className="text-right">Invested</TableHead>
                    <TableHead className="text-right">Returned</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStakeholders.map((stakeholder) => (
                    <TableRow key={`${stakeholder.stakeholderId}-${stakeholder.fundId}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{stakeholder.stakeholderName}</p>
                          <p className="text-xs text-muted-foreground">
                            Since: {new Date(stakeholder.firstInvestmentDate).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {stakeholder.ownershipPercentage.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={getPerformanceColor(stakeholder.irr)}>
                          {formatPercentage(stakeholder.irr)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={stakeholder.tvpi && stakeholder.tvpi >= 1 ? 'text-green-600' : 'text-red-600'}>
                          {formatRatio(stakeholder.tvpi)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={stakeholder.dpi && stakeholder.dpi >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatRatio(stakeholder.dpi)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <span className={stakeholder.rvpi && stakeholder.rvpi >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatRatio(stakeholder.rvpi)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-right font-mono">
                        {formatCurrency(stakeholder.totalInvested)}
                      </TableCell>
                      
                      <TableCell className="text-right font-mono">
                        {formatCurrency(stakeholder.totalReturned)}
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <Badge variant={stakeholder.isValid ? "default" : "destructive"}>
                          {stakeholder.isValid ? "Valid" : "Invalid"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Stakeholder Performance Cards - Mobile */}
            <div className="md:hidden space-y-3">
              {filteredStakeholders.map((stakeholder) => (
                <Card key={`${stakeholder.stakeholderId}-${stakeholder.fundId}`} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{stakeholder.stakeholderName}</h3>
                      <p className="text-xs text-muted-foreground">
                        Since: {new Date(stakeholder.firstInvestmentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {stakeholder.ownershipPercentage.toFixed(2)}%
                      </Badge>
                      <Badge variant={stakeholder.isValid ? "default" : "destructive"} className="text-xs">
                        {stakeholder.isValid ? "Valid" : "Invalid"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IRR:</span>
                      <span className={getPerformanceColor(stakeholder.irr)}>
                        {formatPercentage(stakeholder.irr)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TVPI:</span>
                      <span className={stakeholder.tvpi && stakeholder.tvpi >= 1 ? 'text-green-600' : 'text-red-600'}>
                        {formatRatio(stakeholder.tvpi)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">DPI:</span>
                      <span className={stakeholder.dpi && stakeholder.dpi >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatRatio(stakeholder.dpi)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RVPI:</span>
                      <span className={stakeholder.rvpi && stakeholder.rvpi >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatRatio(stakeholder.rvpi)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm pt-2 border-t">
                    <div>
                      <span className="text-muted-foreground">Invested: </span>
                      <span className="font-mono">{formatCurrency(stakeholder.totalInvested)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Returned: </span>
                      <span className="font-mono">{formatCurrency(stakeholder.totalReturned)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Stakeholders</p>
                <p className="text-lg sm:text-xl font-semibold">{filteredStakeholders.length}</p>
              </div>
              
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Average IRR</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {filteredStakeholders.filter((s: any) => s.isValid && s.irr !== null).length > 0
                    ? formatPercentage(
                        filteredStakeholders
                          .filter((s: any) => s.isValid && s.irr !== null)
                          .reduce((sum: number, s: any) => sum + (s.irr || 0), 0) / 
                        filteredStakeholders.filter((s: any) => s.isValid && s.irr !== null).length
                      )
                    : 'N/A'
                  }
                </p>
              </div>
              
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Invested</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {formatCurrency(filteredStakeholders.reduce((sum: number, s: any) => sum + s.totalInvested, 0))}
                </p>
              </div>
              
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Returned</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {formatCurrency(filteredStakeholders.reduce((sum: number, s: any) => sum + s.totalReturned, 0))}
                </p>
              </div>
            </div>
            
            {/* Performance Metrics Explanation */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
              <p><strong>Performance Metrics Explanation:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>IRR (Internal Rate of Return):</strong> Annualized effective compound return rate</li>
                <li><strong>TVPI (Total Value to Paid-In):</strong> (Stakeholder NAV + Distributions) ÷ Total Invested</li>
                <li><strong>DPI (Distribution to Paid-In):</strong> Total Distributions ÷ Total Invested</li>
                <li><strong>RVPI (Residual Value to Paid-In):</strong> Stakeholder NAV ÷ Total Invested</li>
              </ul>
            </div>

            {/* Data Sources Explanation */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
              <p><strong>Data Sources:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>Invested:</strong> Capital calls from Transactions table (stakeholder&apos;s negative cash flows)</li>
                <li><strong>Returned:</strong> Distributions from Transactions table only (positive cash flows to stakeholder)</li>
                <li><strong>Stakeholder NAV:</strong> Stakeholder&apos;s proportional share of fund NAV (ownership % × total fund NAV from Investment Portfolio table)</li>
              </ul>
            </div>

            {/* Calculation Method */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
              <p><strong>Calculation Method:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>Cash Flows:</strong> Direct stakeholder transactions only (capital calls and distributions from Transactions table)</li>
                <li><strong>Ownership %:</strong> Stakeholder&apos;s units ÷ total fund units as of selected round date</li>
                <li><strong>Round Filtering:</strong> When a round is selected, only includes stakeholders who invested up to that round date</li>
                <li><strong>NAV Attribution:</strong> Current fund NAV allocated proportionally based on ownership percentage</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No stakeholder performance data available</p>
            <p className="text-sm">Performance metrics will appear when stakeholders make investments.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}