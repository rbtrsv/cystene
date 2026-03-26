'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/modules/assetmanager/utils/currency.utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
import { Download, RefreshCw, Calendar, Building2 } from 'lucide-react';
import { useCapTable, useCapTableStats } from '@/modules/assetmanager/hooks/use-captable';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { CapTableTable } from './captable-table';

interface CapTableViewProps {
  fundId?: number; // Make fundId optional
}

export function CapTableView({ fundId: propFundId }: CapTableViewProps) {
  // Fund selector state
  const [selectedFundId, setSelectedFundId] = useState<number | null>(propFundId || null);
  
  // Hooks
  const { funds, fetchFunds, isLoading: fundsLoading } = useFunds();
  const {
    loading,
    error,
    availableRounds,
    selectedRoundId,
    isHistoricalView,
    hasData,
    isEmpty,
    goToCurrentRound,
    goToRound,
    exportCSV,
    exportExcel,
    loadCapTable,
    loadFundData,
  } = useCapTable();
  
  const {
    totalStakeholders,
    totalEquityShares,
    totalInvestment,
    fundName,
    asOfRoundName,
    stakeholderTypeBreakdown,
    securityBreakdown,
  } = useCapTableStats();
  
  // Load funds on mount
  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);
  
  // Auto-select first fund if none selected and funds are available
  useEffect(() => {
    if (!selectedFundId && funds.length > 0 && !loading) {
      const firstFundId = funds[0].id!;
      setSelectedFundId(firstFundId);
      loadFundData(firstFundId);
    }
  }, [selectedFundId, funds, loading, loadFundData]);
  
  // Handle fund selection change
  const handleFundChange = (value: string) => {
    const fundId = parseInt(value);
    setSelectedFundId(fundId);
    loadFundData(fundId);
  };
  
  const handleRoundChange = (value: string) => {
    if (value === 'current') {
      goToCurrentRound();
    } else {
      goToRound(parseInt(value));
    }
  };
  
  const handleRefresh = () => {
    if (selectedFundId) {
      loadCapTable(selectedFundId, selectedRoundId || undefined);
    }
  };
  
  // Don't render anything if no fund is selected
  if (!selectedFundId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cap Table</CardTitle>
          <CardDescription>Select a fund to view its cap table</CardDescription>
        </CardHeader>
        <CardContent>
          {fundsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading funds...
            </div>
          ) : funds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No funds available.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Fund</label>
                <Select value={selectedFundId?.toString() || ''} onValueChange={handleFundChange}>
                  <SelectTrigger className="w-full">
                    <Building2 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Choose a fund" />
                  </SelectTrigger>
                  <SelectContent>
                    {funds.map((fund) => (
                      <SelectItem key={fund.id} value={fund.id!.toString()}>
                        {fund.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Cap Table</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cap Table</h1>
            <p className="text-muted-foreground">
              {fundName ? `${fundName} - ` : ''}
              {isHistoricalView ? `As of ${asOfRoundName}` : 'Current ownership structure'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Fund Selector */}
            <Select value={selectedFundId?.toString() || ''} onValueChange={handleFundChange}>
              <SelectTrigger className="w-[200px]">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select fund" />
              </SelectTrigger>
              <SelectContent>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id!.toString()}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Round Selector */}
            <Select value={selectedRoundId?.toString() || 'current'} onValueChange={handleRoundChange}>
              <SelectTrigger className="w-[200px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current (Latest)</SelectItem>
                {availableRounds.map((round) => (
                  <SelectItem key={round.id} value={round.id.toString()}>
                    {round.roundName} ({new Date(round.roundDate).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          
          {/* Export Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedFundId && exportCSV(selectedFundId)}
            disabled={loading || !hasData}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedFundId && exportExcel(selectedFundId)}
            disabled={loading || !hasData}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      {hasData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stakeholders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStakeholders}</div>
              <div className="flex gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Fund: {stakeholderTypeBreakdown['Fund']?.count || 0}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Investor: {stakeholderTypeBreakdown['Investor']?.count || 0}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Employee: {stakeholderTypeBreakdown['Employee']?.count || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Equity Shares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEquityShares.toLocaleString()}</div>
              <div className="flex gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Common: {securityBreakdown.commonShares.toLocaleString()}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Preferred: {securityBreakdown.preferredShares.toLocaleString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalInvestment.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ${totalEquityShares > 0 ? (totalInvestment / totalEquityShares).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}/share avg
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Securities Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(securityBreakdown.commonShares + securityBreakdown.preferredShares + securityBreakdown.options + securityBreakdown.warrants + securityBreakdown.convertibles).toLocaleString()}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {securityBreakdown.commonShares > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Common: {securityBreakdown.commonShares.toLocaleString()}
                  </Badge>
                )}
                {securityBreakdown.preferredShares > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Preferred: {securityBreakdown.preferredShares.toLocaleString()}
                  </Badge>
                )}
                {securityBreakdown.options > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Options: {securityBreakdown.options.toLocaleString()}
                  </Badge>
                )}
                {securityBreakdown.warrants > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Warrants: {securityBreakdown.warrants.toLocaleString()}
                  </Badge>
                )}
                {securityBreakdown.convertibles > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Convertibles: {securityBreakdown.convertibles.toLocaleString()}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Cap Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ownership Structure</CardTitle>
          <CardDescription>
            Detailed breakdown of stakeholder ownership and securities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading cap table...
            </div>
          ) : isEmpty ? (
            <div className="text-center py-8 text-muted-foreground">
              No cap table data available for this fund.
            </div>
          ) : (
            <CapTableTable />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
