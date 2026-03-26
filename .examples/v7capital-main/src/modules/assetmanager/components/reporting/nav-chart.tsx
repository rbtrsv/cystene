'use client';

import React from 'react';
import { Bar, Line, ComposedChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { PortfolioPerformance } from '../../schemas/portfolio-performance.schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
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

interface NavChartProps {
  portfolioPerformances: PortfolioPerformance[];
  isLoading: boolean;
}

// Chart configuration for colors and labels
// Blue bars, green line - consistent in both light and dark mode
const chartConfig = {
  nav: {
    label: 'NAV',
    color: '#3b82f6',  // blue-500 - same in both modes
  },
  navPerShare: {
    label: 'NAV/Share',
    color: '#22c55e',  // green-500 - same in both modes
  },
} satisfies ChartConfig;

export default function NavChart({
  portfolioPerformances,
  isLoading
}: NavChartProps) {
  // ===== DATA TRANSFORMATION =====
  // Sort by date and transform for chart
  const chartData = React.useMemo(() => {
    return [...portfolioPerformances]
      .sort((a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime())
      .map(pp => ({
        date: pp.reportDate,
        nav: pp.nav || 0,
        navPerShare: pp.navPerShare || 0,
      }));
  }, [portfolioPerformances]);

  // ===== HELPER FUNCTIONS =====
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
    }).format(value);
  };

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
            <p>No portfolio performance data available</p>
            <p className="text-sm">Add portfolio performance snapshots to see NAV history.</p>
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
          Net Asset Value (bars) and NAV per Share (line) over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ComposedChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatDate}
            />
            {/* Left Y-axis for NAV (bars) */}
            <YAxis
              yAxisId="nav"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatCurrency}
            />
            {/* Right Y-axis for NAV/Share (line) */}
            <YAxis
              yAxisId="navPerShare"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `€${value.toFixed(2)}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {/* NAV as bars */}
            <Bar
              dataKey="nav"
              yAxisId="nav"
              fill="var(--color-nav)"
              radius={[4, 4, 0, 0]}
            />
            {/* NAV/Share as line overlay */}
            <Line
              dataKey="navPerShare"
              yAxisId="navPerShare"
              type="monotone"
              stroke="var(--color-navPerShare)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-navPerShare)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
