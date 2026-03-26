'use client';

import React, { useEffect, useState } from 'react';
import { useFunds } from '../../hooks/use-funds';
import { useRounds } from '../../hooks/use-rounds';
import { usePerformance } from '../../hooks/use-performance';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { RefreshCcw, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/modules/shadcnui/lib/utils';
import { getFeeCostTypeLabel, getFrequencyLabel } from '@/modules/assetmanager/schemas/fee-costs.schemas';

export default function FundsPerformance() {
  // ===== STATE AND HOOKS =====
  const { funds, fetchFunds, hasFunds } = useFunds();
  const { rounds, fetchRoundsByFund } = useRounds();
  const { 
    fundPerformance,
    isLoading, 
    error, 
    fetchFundPerformance,
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
      fetchFundPerformance(selectedFund, selectedRound || undefined);
    }
  }, [selectedFund, selectedRound, fetchRoundsByFund, fetchFundPerformance]);
  
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
      fetchFundPerformance(selectedFund, selectedRound || undefined);
    }
  };
  
  // ===== HELPER FUNCTIONS =====
  const getPerformanceColor = (value: number | null) => {
    if (value === null) return 'text-muted-foreground';
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (value: number | null) => {
    if (value === null) return null;
    return value >= 0 ? TrendingUp : TrendingDown;
  };

  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funds Performance</CardTitle>
          <CardDescription>Loading fund performance data...</CardDescription>
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
          <CardTitle>Funds Performance</CardTitle>
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
          <CardTitle>Funds Performance</CardTitle>
          <CardDescription>No funds available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">No funds available</p>
            <p className="text-sm">Create a fund to view performance metrics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPerformance = fundPerformance;
  const performanceTitle = fundPerformance?.fundName;
  const TrendIcon = getTrendIcon(currentPerformance?.irr || null);

  // ===== MAIN COMPONENT RENDER =====
  return (
    <Card>
      {/* ===== CARD HEADER WITH TITLE AND CONTROLS ===== */}
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <CardTitle className="text-xl md:text-2xl font-bold">Funds Performance</CardTitle>
          <CardDescription>
            Investment performance analysis with IRR, TVPI, DPI, and RVPI metrics
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
      
      {/* ===== CARD CONTENT WITH PERFORMANCE DETAILS ===== */}
      <CardContent>
        {currentPerformance ? (
          <div className="space-y-6">
            {/* Performance Header */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold truncate">{performanceTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  Calculated at: {new Date(currentPerformance.calculatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={currentPerformance.isValid ? "default" : "destructive"}>
                  {currentPerformance.isValid ? "Valid" : "Invalid"}
                </Badge>
                {currentPerformance.irr !== null && currentPerformance.irr > 0 && (
                  <Badge variant="secondary">
                    Profitable
                  </Badge>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {TrendIcon && <TrendIcon className={cn("h-3 w-3 sm:h-4 sm:w-4", getPerformanceColor(currentPerformance.irr))} />}
                  <p className="text-xs sm:text-sm text-muted-foreground">IRR</p>
                </div>
                <p className={cn("text-lg sm:text-2xl font-semibold", getPerformanceColor(currentPerformance.irrPercentage))}>
                  {formatPercentage(currentPerformance.irr)}
                </p>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">TVPI</p>
                <p className={cn("text-lg sm:text-2xl font-semibold", currentPerformance.tvpi && currentPerformance.tvpi >= 1 ? 'text-green-600' : 'text-red-600')}>
                  {formatRatio(currentPerformance.tvpi)}
                </p>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">DPI</p>
                <p className={cn("text-lg sm:text-2xl font-semibold", currentPerformance.dpi && currentPerformance.dpi >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatRatio(currentPerformance.dpi)}
                </p>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">RVPI</p>
                <p className={cn("text-lg sm:text-2xl font-semibold", currentPerformance.rvpi && currentPerformance.rvpi >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatRatio(currentPerformance.rvpi)}
                </p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Total Invested</p>
                <p className="text-lg sm:text-2xl font-semibold text-blue-600">
                  {formatCurrency(currentPerformance.totalInvested)}
                </p>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Total Returned</p>
                <p className="text-lg sm:text-2xl font-semibold text-green-600">
                  {formatCurrency(currentPerformance.totalReturned)}
                </p>
              </div>
              
              <div className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Total Fees</p>
                <p className="text-lg sm:text-2xl font-semibold text-orange-600">
                  {formatCurrency(currentPerformance.totalFees || 0)}
                </p>
              </div>
            </div>

            {/* Fair Value */}
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Current Fair Value</p>
              <p className="text-3xl font-semibold text-purple-600">
                {formatCurrency(currentPerformance.fairValue)}
              </p>
            </div>

            {/* Fees Breakdown */}
            {currentPerformance.feesBreakdown && currentPerformance.feesBreakdown.length > 0 && (
              <div className="p-4 bg-muted/20 rounded-lg">
                <h4 className="font-semibold mb-3">Fee Costs Breakdown</h4>
                <div className="space-y-2">
                  {currentPerformance.feesBreakdown.map((fee: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">{fee.name}</span>
                        <span className="text-muted-foreground ml-2">({getFeeCostTypeLabel(fee.type)})</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(fee.amount)}</div>
                        <div className="text-xs text-muted-foreground">{getFrequencyLabel(fee.frequency)} • {new Date(fee.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Fees:</span>
                    <span className="text-orange-600">{formatCurrency(currentPerformance.totalFees || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics Explanation */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
              <p><strong>Performance Metrics Explanation:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>IRR (Internal Rate of Return):</strong> Annualized effective compound return rate</li>
                <li><strong>TVPI (Total Value to Paid-In):</strong> (Fair Value + Distributions) ÷ Total Invested</li>
                <li><strong>DPI (Distribution to Paid-In):</strong> Total Distributions ÷ Total Invested</li>
                <li><strong>RVPI (Residual Value to Paid-In):</strong> Current Fair Value ÷ Total Invested</li>
              </ul>
            </div>

            {/* Data Sources Explanation */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
              <p><strong>Data Sources:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li><strong>Invested:</strong> Fund&apos;s investments from Portfolio Cash Flows table + fees from Fee Costs table (negative cash flows)</li>
                <li><strong>Returned:</strong> Distributions received from Portfolio Cash Flows table (positive cash flows)</li>
                <li><strong>Current Fair Value:</strong> Sum of all current valuations from Investment Portfolio table</li>
                <li><strong>Total Fees:</strong> Management and performance fees from Fee Costs table</li>
              </ul>
            </div>

            {/* Benchmarks */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
              <p><strong>Benchmarks:</strong> Strong funds typically achieve IRR {'>'}15% and TVPI {'>'}2.0x over their lifecycle.</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">No performance data available</p>
            <p className="text-sm">Performance metrics will appear when cash flows are recorded.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}