'use client';

import React, { useEffect, useState } from 'react';
import { useFunds } from '../../hooks/use-funds';
import { usePerformance } from '../../hooks/use-performance';
import { usePortfolioPerformance } from '../../hooks/use-portfolio-performance';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/modules/shadcnui/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import StakeholderReturnsCard from './stakeholder-returns-card';
import StakeholderTransactionsCard from './stakeholder-transactions-card';
import FundPerformanceCard from './fund-performance-card';
import NavChart from './nav-chart';
import NavCompositionChart from './nav-composition-chart';
import { useInvestmentPortfolio } from '../../hooks/use-portfolio-investment';

interface ReportingViewProps {
  isStakeholder: boolean;
}

export default function ReportingView({ isStakeholder }: ReportingViewProps) {
  // ===== STATE AND HOOKS =====
  const { funds, fetchFunds, hasFunds } = useFunds();
  const {
    fundPerformance,
    stakeholderPerformances,
    isLoading: perfLoading,
    error: perfError,
    fetchFundPerformance,
    fetchStakeholdersPerformance,
  } = usePerformance();
  const {
    portfolioPerformances,
    isLoading: portfolioLoading,
    fetchPortfolioPerformances,
  } = usePortfolioPerformance();
  const {
    portfoliosWithRelations,
    isLoading: investmentLoading,
    fetchPortfoliosWithRelations,
  } = useInvestmentPortfolio();

  const [selectedFund, setSelectedFund] = useState<number | null>(null);

  // ===== DERIVED STATE =====
  // Note: Stakeholder filtering is handled server-side in getStakeholdersPerformance()
  // using getStakeholderIds(profile) - no client-side filtering needed

  // Filter portfolio performances for selected fund
  const fundPortfolioPerformances = React.useMemo(() => {
    if (!selectedFund) return portfolioPerformances;
    return portfolioPerformances.filter(pp => pp.fundId === selectedFund);
  }, [portfolioPerformances, selectedFund]);

  // Filter investment portfolios for selected fund (for NAV composition chart)
  const fundInvestmentPortfolios = React.useMemo(() => {
    if (!selectedFund) return portfoliosWithRelations;
    return portfoliosWithRelations.filter(p => p.fundId === selectedFund);
  }, [portfoliosWithRelations, selectedFund]);

  const isLoading = perfLoading || portfolioLoading || investmentLoading;

  // ===== EFFECTS =====
  useEffect(() => {
    fetchFunds();
    fetchPortfolioPerformances();
    fetchPortfoliosWithRelations();
  }, [fetchFunds, fetchPortfolioPerformances, fetchPortfoliosWithRelations]);

  useEffect(() => {
    if (hasFunds() && !selectedFund) {
      setSelectedFund(funds[0].id);
    }
  }, [funds, hasFunds, selectedFund]);

  useEffect(() => {
    if (selectedFund) {
      fetchFundPerformance(selectedFund);
      fetchStakeholdersPerformance(selectedFund);
    }
  }, [selectedFund, fetchFundPerformance, fetchStakeholdersPerformance]);


  // ===== EVENT HANDLERS =====
  const handleFundChange = (fundId: string) => {
    setSelectedFund(Number(fundId));
  };

  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading && !fundPerformance && stakeholderPerformances.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reporting</CardTitle>
            <CardDescription>Loading reporting data...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (perfError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reporting</CardTitle>
            <CardDescription>Error loading reporting data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-destructive/10 p-4 rounded-md text-destructive">
              {perfError}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasFunds()) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reporting</CardTitle>
            <CardDescription>No funds available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg">No funds available</p>
              <p className="text-sm">Create a fund to view reporting data.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== MAIN COMPONENT RENDER =====
  return (
    <div className="space-y-6">
      {/* ===== PAGE HEADER WITH FUND SELECTOR ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reporting</h1>
          <p className="text-muted-foreground">
            Stakeholder returns and fund performance
          </p>
        </div>
        <Select value={selectedFund?.toString()} onValueChange={handleFundChange}>
          <SelectTrigger className="w-full md:w-48">
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
      </div>

      {/* ===== STAKEHOLDER-ONLY SECTIONS ===== */}
      {isStakeholder && (
        <>
          <StakeholderTransactionsCard />
          <StakeholderReturnsCard
            performances={stakeholderPerformances}
            isLoading={perfLoading}
          />
        </>
      )}

      {/* ===== FUND PERFORMANCE SECTION (ALL USERS) ===== */}
      <FundPerformanceCard
        performance={fundPerformance}
        isLoading={perfLoading}
      />

      {/* ===== NAV CHART SECTION ===== */}
      <NavChart
        portfolioPerformances={fundPortfolioPerformances}
        isLoading={portfolioLoading}
      />

      {/* ===== NAV COMPOSITION CHART SECTION ===== */}
      <NavCompositionChart
        portfolios={fundInvestmentPortfolios}
        isLoading={investmentLoading}
      />
    </div>
  );
}
