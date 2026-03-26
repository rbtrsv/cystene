'use client';

/**
 * NAV Chart
 *
 * Bar+line chart showing valuation_value (bars) and nav_per_share (line) over time.
 * Data from: Valuations (point-in-time snapshots).
 *
 * Adapted from v7capital's nav-chart.tsx
 */

import React from 'react';
import { Bar, Line, ComposedChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { Valuation } from '../../schemas/holding/valuation.schemas';
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
  ChartLegend,
  ChartLegendContent,
} from '@/modules/shadcnui/components/ui/chart';
import { BarChart3 } from 'lucide-react';

// ==========================================
// Props
// ==========================================

interface NavChartProps {
  valuations: Valuation[];
  isLoading: boolean;
}

// ==========================================
// Chart Config
// ==========================================

// Blue bars for valuation_value, green line for nav_per_share
const chartConfig = {
  valuation_value: {
    label: 'Valuation / NAV',
    color: '#3b82f6', // blue-500
  },
  nav_per_share: {
    label: 'NAV/Share',
    color: '#22c55e', // green-500
  },
} satisfies ChartConfig;

// ==========================================
// Helper Functions
// ==========================================

/** Format date string for axis ticks */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

/** Format currency for axis ticks */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(value);
};

// ==========================================
// Component
// ==========================================

export default function NavChart({ valuations, isLoading }: NavChartProps) {
  // ===== DATA TRANSFORMATION =====
  // Sort by date and transform for chart
  const chartData = React.useMemo(() => {
    return [...valuations]
      .filter((v) => v.date && v.valuation_value != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((v) => ({
        date: v.date,
        valuation_value: v.valuation_value || 0,
        nav_per_share: v.nav_per_share || 0,
      }));
  }, [valuations]);

  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            NAV History
          </CardTitle>
          <CardDescription>Loading NAV history...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            NAV History
          </CardTitle>
          <CardDescription>No NAV history available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No valuation snapshots available</p>
            <p className="text-sm">Add valuation records to see NAV history.</p>
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
          <BarChart3 className="h-5 w-5" />
          NAV History
        </CardTitle>
        <CardDescription>
          Valuation / NAV (bars) and NAV per Share (line) over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ComposedChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatDate}
            />
            {/* Left Y-axis for valuation_value (bars) */}
            <YAxis
              yAxisId="valuation"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatCurrency}
            />
            {/* Right Y-axis for nav_per_share (line) */}
            <YAxis
              yAxisId="navPerShare"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {/* Valuation/NAV as bars */}
            <Bar
              dataKey="valuation_value"
              yAxisId="valuation"
              fill="var(--color-valuation_value)"
              radius={[4, 4, 0, 0]}
            />
            {/* NAV/Share as line overlay */}
            <Line
              dataKey="nav_per_share"
              yAxisId="navPerShare"
              type="monotone"
              stroke="var(--color-nav_per_share)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-nav_per_share)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
