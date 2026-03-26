'use client';

/**
 * NAV Composition Chart
 *
 * Pie chart showing portfolio allocation by holding (current_fair_value).
 * Data from: Holdings for the selected entity.
 *
 * Adapted from v7capital's nav-composition-chart.tsx
 */

import React from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import type { Holding } from '../../schemas/holding/holding.schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/modules/shadcnui/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/modules/shadcnui/components/ui/chart';
import { PieChart as PieChartIcon } from 'lucide-react';

// ==========================================
// Props
// ==========================================

interface NavCompositionChartProps {
  holdings: Holding[];
  isLoading: boolean;
}

// ==========================================
// Color Palette
// ==========================================

// Sector/category colors for inner ring
const SECTOR_COLORS: Record<string, string> = {
  technology: '#8b5cf6',     // violet-500
  healthcare: '#f97316',     // orange-500
  fintech: '#3b82f6',        // blue-500
  saas: '#22c55e',           // green-500
  ai: '#ec4899',             // pink-500
  biotech: '#14b8a6',        // teal-500
  real_estate: '#eab308',    // yellow-500
  energy: '#ef4444',         // red-500
};

// Company colors for outer ring
const HOLDING_COLORS = [
  '#f97316',  // orange-500
  '#ef4444',  // red-500
  '#ec4899',  // pink-500
  '#a855f7',  // purple-500
  '#6366f1',  // indigo-500
  '#0ea5e9',  // sky-500
  '#14b8a6',  // teal-500
  '#84cc16',  // lime-500
  '#eab308',  // yellow-500
  '#f59e0b',  // amber-500
  '#10b981',  // emerald-500
  '#06b6d4',  // cyan-500
];

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

/** Format percentage */
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// ==========================================
// Component
// ==========================================

export default function NavCompositionChart({
  holdings,
  isLoading,
}: NavCompositionChartProps) {
  // ===== DATA TRANSFORMATION =====
  const { holdingData, sectorData, totalNav, chartConfig } = React.useMemo(() => {
    // Filter only holdings with fair value > 0
    const activeHoldings = holdings.filter(
      (h) => h.current_fair_value && h.current_fair_value > 0
    );

    // Calculate total NAV
    const total = activeHoldings.reduce((sum, h) => sum + (h.current_fair_value || 0), 0);

    // Build holding data for outer ring
    const holdingItems = activeHoldings
      .map((h) => ({
        name: h.investment_name || 'Unknown',
        value: h.current_fair_value || 0,
        sector: h.sector || 'other',
        percentage: total > 0 ? ((h.current_fair_value || 0) / total) * 100 : 0,
        fill: '', // assigned after sorting
      }))
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({
        ...item,
        fill: HOLDING_COLORS[index % HOLDING_COLORS.length],
      }));

    // Group by sector for inner ring
    const sectorMap = new Map<string, number>();
    activeHoldings.forEach((h) => {
      const sector = h.sector || 'other';
      const existing = sectorMap.get(sector) || 0;
      sectorMap.set(sector, existing + (h.current_fair_value || 0));
    });

    const sectors = Array.from(sectorMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        fill: SECTOR_COLORS[name.toLowerCase()] || '#6b7280',
      }))
      .sort((a, b) => b.value - a.value);

    // Build chart config for legend
    const config: ChartConfig = {};
    sectors.forEach((s) => {
      config[s.name] = {
        label: s.name,
        color: s.fill,
      };
    });

    return {
      holdingData: holdingItems,
      sectorData: sectors,
      totalNav: total,
      chartConfig: config,
    };
  }, [holdings]);

  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            NAV Composition
          </CardTitle>
          <CardDescription>Loading composition data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (holdingData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            NAV Composition
          </CardTitle>
          <CardDescription>No composition data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active holdings with fair value found</p>
            <p className="text-sm">Add holdings with fair value to see NAV composition.</p>
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
          <PieChartIcon className="h-5 w-5" />
          NAV Composition
        </CardTitle>
        <CardDescription>
          Portfolio allocation by holding (outer) and sector (inner)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ===== PIE CHART ===== */}
          <ChartContainer config={chartConfig} className="min-h-[350px] w-full lg:w-2/3">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const payload = item.payload;
                      return (
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{payload.name}</span>
                          <span>{formatCurrency(payload.value)}</span>
                          <span className="text-muted-foreground">{formatPercentage(payload.percentage)}</span>
                        </div>
                      );
                    }}
                  />
                }
              />
              {/* Inner ring - Sectors */}
              <Pie
                data={sectorData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {sectorData.map((entry, index) => (
                  <Cell key={`sector-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              {/* Outer ring - Holdings */}
              <Pie
                data={holdingData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={100}
                outerRadius={140}
                paddingAngle={1}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={(props: any) => (props.percentage > 5 ? `${props.name}` : '')}
                labelLine={false}
              >
                {holdingData.map((entry, index) => (
                  <Cell key={`holding-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* ===== LEGEND ===== */}
          <div className="flex flex-col gap-6 lg:w-1/3">
            {/* Sector Legend */}
            <div>
              <h4 className="text-sm font-medium mb-3">Sectors</h4>
              <div className="space-y-2">
                {sectorData.map((sector, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sector.fill }}
                      />
                      <span className="text-sm capitalize">{sector.name}</span>
                    </div>
                    <span className="text-sm font-medium">{formatPercentage(sector.percentage)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Holdings Legend */}
            <div>
              <h4 className="text-sm font-medium mb-3">Top Holdings</h4>
              <div className="space-y-2">
                {holdingData.slice(0, 8).map((holding, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: holding.fill }}
                      />
                      <span className="text-sm truncate max-w-[150px]">{holding.name}</span>
                    </div>
                    <span className="text-sm font-medium">{formatPercentage(holding.percentage)}</span>
                  </div>
                ))}
                {holdingData.length > 8 && (
                  <div className="text-sm text-muted-foreground">
                    +{holdingData.length - 8} more holdings
                  </div>
                )}
              </div>
            </div>

            {/* Total NAV */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total NAV</span>
                <span className="text-lg font-semibold">{formatCurrency(totalNav)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
