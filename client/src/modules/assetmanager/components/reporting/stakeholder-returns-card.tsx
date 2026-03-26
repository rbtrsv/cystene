'use client';

/**
 * Stakeholder Returns Card
 *
 * Displays per-stakeholder performance metrics cards.
 * Data from: GET /assetmanager/performance/stakeholders/{entity_id}
 *
 * Adapted from v7capital's stakeholder-returns-card.tsx
 */

import React from 'react';
import type { StakeholderReturn } from '../../schemas/holding/performance-computed.schemas';
import { getStakeholderTypeLabel } from '../../schemas/entity/stakeholder.schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/modules/shadcnui/components/ui/card';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Users } from 'lucide-react';

// ==========================================
// Props
// ==========================================

interface StakeholderReturnsCardProps {
  stakeholderReturns: StakeholderReturn[];
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

export default function StakeholderReturnsCard({
  stakeholderReturns,
  isLoading,
}: StakeholderReturnsCardProps) {
  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Stakeholder Returns
          </CardTitle>
          <CardDescription>Loading stakeholder returns...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (stakeholderReturns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Stakeholder Returns
          </CardTitle>
          <CardDescription>No stakeholder returns available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No stakeholder performance data available</p>
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
          <Users className="h-5 w-5" />
          Stakeholder Returns
        </CardTitle>
        <CardDescription>Individual stakeholder performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stakeholderReturns.map((stakeholder) => (
            <Card key={stakeholder.stakeholder_id} className="p-4">
              {/* ===== STAKEHOLDER HEADER ===== */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-base">{stakeholder.stakeholder_name || 'Unknown'}</h3>
                </div>
                <Badge variant="secondary">
                  {getStakeholderTypeLabel(stakeholder.stakeholder_type || 'N/A')}
                </Badge>
              </div>

              {/* ===== PERFORMANCE METRICS GRID ===== */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {/* IRR */}
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">IRR</p>
                  <p className={`text-lg font-semibold ${getPerformanceColor(stakeholder.irr)}`}>
                    {formatPercentage(stakeholder.irr)}
                  </p>
                </div>

                {/* TVPI */}
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">TVPI</p>
                  <p className={`text-lg font-semibold ${getRatioColor(stakeholder.tvpi)}`}>
                    {formatRatio(stakeholder.tvpi)}
                  </p>
                </div>

                {/* DPI */}
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">DPI</p>
                  <p className={`text-lg font-semibold ${getRatioColor(stakeholder.dpi)}`}>
                    {formatRatio(stakeholder.dpi)}
                  </p>
                </div>

                {/* RVPI */}
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">RVPI</p>
                  <p className={`text-lg font-semibold ${getRatioColor(stakeholder.rvpi)}`}>
                    {formatRatio(stakeholder.rvpi)}
                  </p>
                </div>

                {/* Ownership */}
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Ownership</p>
                  <p className="text-lg font-semibold">
                    {stakeholder.ownership_percentage.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* ===== FINANCIAL SUMMARY ===== */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pt-3 border-t">
                <div className="flex gap-6">
                  <div>
                    <span className="text-sm text-muted-foreground">Invested: </span>
                    <span className="font-mono font-medium">{formatCurrency(stakeholder.total_invested)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Current Value: </span>
                    <span className="font-mono font-medium">{formatCurrency(stakeholder.fair_value)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
