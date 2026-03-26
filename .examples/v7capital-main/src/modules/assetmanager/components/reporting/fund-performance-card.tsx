'use client';

import React from 'react';
import { usePerformance } from '../../hooks/use-performance';
import type { FundPerformance } from '../../schemas/performance.schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/modules/shadcnui/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface FundPerformanceCardProps {
  performance: FundPerformance | null;
  isLoading: boolean;
}

export default function FundPerformanceCard({
  performance,
  isLoading
}: FundPerformanceCardProps) {
  // ===== HOOKS =====
  const { formatPercentage, formatRatio, formatCurrency } = usePerformance();

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
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fund Performance
          </CardTitle>
          <CardDescription>Loading fund performance...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!performance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fund Performance
          </CardTitle>
          <CardDescription>No fund performance available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No fund performance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ===== MAIN COMPONENT RENDER =====
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Fund Performance
        </CardTitle>
        <CardDescription>
          {performance.fundName} - Overall fund metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* ===== FUND METRICS GRID ===== */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total AUM (Fair Value) */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Total AUM</p>
            <p className="text-xl font-bold">
              {formatCurrency(performance.fairValue)}
            </p>
          </div>

          {/* Total Invested */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Invested</p>
            <p className="text-xl font-bold">
              {formatCurrency(performance.totalInvested)}
            </p>
          </div>

          {/* Total Returns */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Returns</p>
            <p className="text-xl font-bold">
              {formatCurrency(performance.totalReturned)}
            </p>
          </div>

          {/* Fund IRR */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">IRR</p>
            <p className={`text-xl font-bold ${getPerformanceColor(performance.irr)}`}>
              {formatPercentage(performance.irr)}
            </p>
          </div>

          {/* Fund TVPI */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">TVPI</p>
            <p className={`text-xl font-bold ${performance.tvpi && performance.tvpi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
              {formatRatio(performance.tvpi)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
