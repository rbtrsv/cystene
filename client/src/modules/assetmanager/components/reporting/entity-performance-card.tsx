'use client';

/**
 * Entity Performance Card
 *
 * Displays entity/fund-level performance metrics in a grid.
 * Data from: GET /assetmanager/performance/entity/{entity_id}
 *
 * Adapted from v7capital's fund-performance-card.tsx
 */

import React from 'react';
import type { EntityPerformance } from '../../schemas/holding/performance-computed.schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/modules/shadcnui/components/ui/card';
import { TrendingUp } from 'lucide-react';

// ==========================================
// Props
// ==========================================

interface EntityPerformanceCardProps {
  performance: EntityPerformance | null;
  isLoading: boolean;
}

// ==========================================
// Helper Functions
// ==========================================

/** Format number as currency */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/** Format percentage value (already in %, e.g. 15.2) */
const formatPercentage = (value: number | null): string => {
  if (value === null) return '—';
  return `${value.toFixed(2)}%`;
};

/** Format ratio value (e.g. 1.5x) */
const formatRatio = (value: number | null): string => {
  if (value === null) return '—';
  return `${value.toFixed(2)}x`;
};

/** Get color class based on performance value */
const getPerformanceColor = (value: number | null): string => {
  if (value === null) return 'text-muted-foreground';
  return value >= 0 ? 'text-green-600' : 'text-red-600';
};

/** Get color class for ratio (>= 1 is good) */
const getRatioColor = (value: number | null): string => {
  if (value === null) return 'text-muted-foreground';
  return value >= 1 ? 'text-green-600' : 'text-red-600';
};

// ==========================================
// Component
// ==========================================

export default function EntityPerformanceCard({
  performance,
  isLoading,
}: EntityPerformanceCardProps) {
  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Entity Performance
          </CardTitle>
          <CardDescription>Loading performance metrics...</CardDescription>
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
            Entity Performance
          </CardTitle>
          <CardDescription>No performance data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No performance data available</p>
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
          Entity Performance
        </CardTitle>
        <CardDescription>Overall entity/fund performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        {/* ===== PERFORMANCE METRICS GRID ===== */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {/* Total AUM (Fair Value) */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Total AUM</p>
            <p className="text-xl font-bold">{formatCurrency(performance.fair_value)}</p>
          </div>

          {/* Total Invested */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Invested</p>
            <p className="text-xl font-bold">{formatCurrency(performance.total_invested)}</p>
          </div>

          {/* Total Returns */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Returns</p>
            <p className="text-xl font-bold">{formatCurrency(performance.total_returned)}</p>
          </div>

          {/* IRR */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">IRR</p>
            <p className={`text-xl font-bold ${getPerformanceColor(performance.irr)}`}>
              {formatPercentage(performance.irr)}
            </p>
          </div>

          {/* TVPI */}
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">TVPI</p>
            <p className={`text-xl font-bold ${getRatioColor(performance.tvpi)}`}>
              {formatRatio(performance.tvpi)}
            </p>
          </div>
        </div>

        {/* ===== SECONDARY METRICS ROW ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* DPI */}
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <p className="text-xs text-muted-foreground">DPI</p>
            <p className={`text-lg font-semibold ${getRatioColor(performance.dpi)}`}>
              {formatRatio(performance.dpi)}
            </p>
          </div>

          {/* RVPI */}
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <p className="text-xs text-muted-foreground">RVPI</p>
            <p className={`text-lg font-semibold ${getRatioColor(performance.rvpi)}`}>
              {formatRatio(performance.rvpi)}
            </p>
          </div>

          {/* Total Fees */}
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Fees</p>
            <p className="text-lg font-semibold">{formatCurrency(performance.total_fees)}</p>
          </div>

          {/* Fees Breakdown count */}
          <div className="text-center p-3 bg-muted/20 rounded-lg">
            <p className="text-xs text-muted-foreground">Fee Types</p>
            <p className="text-lg font-semibold">{Object.keys(performance.fees_breakdown).length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
