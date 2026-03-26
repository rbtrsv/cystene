'use client';

import React from 'react';
import { usePerformance } from '../../hooks/use-performance';
import type { StakeholderPerformance } from '../../schemas/performance.schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/modules/shadcnui/components/ui/card';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Users } from 'lucide-react';

interface StakeholderReturnsCardProps {
  performances: StakeholderPerformance[];
  isLoading: boolean;
}

export default function StakeholderReturnsCard({
  performances,
  isLoading
}: StakeholderReturnsCardProps) {
  // ===== HOOKS =====
  const { formatPercentage, formatRatio, formatCurrency, formatDate } = usePerformance();

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

  if (performances.length === 0) {
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
        <CardDescription>
          Individual stakeholder performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performances.map((stakeholder) => (
            <Card key={`${stakeholder.stakeholderId}-${stakeholder.fundId}`} className="p-4">
              {/* ===== STAKEHOLDER HEADER ===== */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-base">{stakeholder.stakeholderName}</h3>
                  <p className="text-xs text-muted-foreground">
                    Since: {formatDate(stakeholder.firstInvestmentDate)}
                  </p>
                </div>
                <Badge variant={stakeholder.isValid ? "default" : "destructive"}>
                  {stakeholder.isValid ? "Valid" : "Invalid"}
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
                  <p className={`text-lg font-semibold ${stakeholder.tvpi && stakeholder.tvpi >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatRatio(stakeholder.tvpi)}
                  </p>
                </div>

                {/* DPI */}
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">DPI</p>
                  <p className={`text-lg font-semibold ${stakeholder.dpi && stakeholder.dpi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatRatio(stakeholder.dpi)}
                  </p>
                </div>

                {/* RVPI */}
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">RVPI</p>
                  <p className={`text-lg font-semibold ${stakeholder.rvpi && stakeholder.rvpi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatRatio(stakeholder.rvpi)}
                  </p>
                </div>

                {/* Ownership */}
                <div className="text-center p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Ownership</p>
                  <p className="text-lg font-semibold">
                    {stakeholder.ownershipPercentage.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* ===== FINANCIAL SUMMARY ===== */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pt-3 border-t">
                <div className="flex gap-6">
                  <div>
                    <span className="text-sm text-muted-foreground">Invested: </span>
                    <span className="font-mono font-medium">{formatCurrency(stakeholder.totalInvested)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Current Value: </span>
                    <span className="font-mono font-medium">{formatCurrency(stakeholder.fairValue)}</span>
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
