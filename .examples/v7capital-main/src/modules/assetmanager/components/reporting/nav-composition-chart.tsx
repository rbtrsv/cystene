'use client';

import React from 'react';
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';
import type { InvestmentPortfolioWithRelations } from '../../schemas/portfolio-investment.schemas';
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
} from '@/modules/shadcnui/components/ui/chart';
import { PieChart as PieChartIcon } from 'lucide-react';

interface NavCompositionChartProps {
  portfolios: InvestmentPortfolioWithRelations[];
  isLoading: boolean;
}

// ===== CATEGORY COLORS =====
// Colors for the inner ring (categories)
const CATEGORY_COLORS: Record<string, string> = {
  'Venture Capital': '#8b5cf6',  // violet-500
  'Private Equity': '#f97316',   // orange-500
  'Public': '#3b82f6',           // blue-500
  'Cash': '#22c55e',             // green-500
};

// ===== COMPANY COLORS =====
// Palette for the outer ring (individual companies)
const COMPANY_COLORS = [
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

export default function NavCompositionChart({
  portfolios,
  isLoading
}: NavCompositionChartProps) {
  // ===== DATA TRANSFORMATION =====
  // Calculate total NAV and prepare chart data
  const { companyData, categoryData, totalNav, chartConfig } = React.useMemo(() => {
    // Filter only active portfolios with fair value
    const activePortfolios = portfolios.filter(
      p => p.portfolioStatus === 'Active' && p.currentFairValue && p.currentFairValue > 0
    );

    // Calculate total NAV
    const total = activePortfolios.reduce((sum, p) => sum + (p.currentFairValue || 0), 0);

    // Group by company for outer ring
    const companyMap = new Map<string, { value: number; companyType: string }>();
    activePortfolios.forEach(p => {
      const companyName = p.company?.name || 'Unknown';
      const existing = companyMap.get(companyName);
      if (existing) {
        existing.value += p.currentFairValue || 0;
      } else {
        companyMap.set(companyName, {
          value: p.currentFairValue || 0,
          companyType: p.companyType || 'Private'
        });
      }
    });

    // Convert to array, sort by value descending, then assign colors
    const companies = Array.from(companyMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.value,
        companyType: data.companyType,
        percentage: total > 0 ? (data.value / total) * 100 : 0,
        fill: '' // assigned after sorting
      }))
      .sort((a, b) => b.value - a.value)
      .map((company, index) => ({
        ...company,
        fill: COMPANY_COLORS[index % COMPANY_COLORS.length]
      }));

    // Group by category for inner ring
    const categoryMap = new Map<string, number>();
    activePortfolios.forEach(p => {
      const category = p.companyType || 'Private';
      const existing = categoryMap.get(category) || 0;
      categoryMap.set(category, existing + (p.currentFairValue || 0));
    });

    // Convert to array
    const categories = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        fill: CATEGORY_COLORS[name] || '#6b7280'
      }))
      .sort((a, b) => b.value - a.value);

    // Build chart config for legend
    const config: ChartConfig = {};
    categories.forEach(cat => {
      config[cat.name] = {
        label: cat.name === 'Cash' ? 'Cash & Loans' : cat.name,
        color: cat.fill
      };
    });

    return {
      companyData: companies,
      categoryData: categories,
      totalNav: total,
      chartConfig: config
    };
  }, [portfolios]);

  // ===== HELPER FUNCTIONS =====
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

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

  if (companyData.length === 0) {
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
            <p>No active portfolio investments found</p>
            <p className="text-sm">Add investments to see NAV composition.</p>
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
          Portfolio allocation by company (outer) and asset type (inner)
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
              {/* Inner ring - Categories */}
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`category-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              {/* Outer ring - Companies */}
              <Pie
                data={companyData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={100}
                outerRadius={140}
                paddingAngle={1}
                label={({ name, percentage }) => percentage > 5 ? `${name}` : ''}
                labelLine={false}
              >
                {companyData.map((entry, index) => (
                  <Cell key={`company-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* ===== LEGEND ===== */}
          <div className="flex flex-col gap-6 lg:w-1/3">
            {/* Category Legend */}
            <div>
              <h4 className="text-sm font-medium mb-3">Asset Types</h4>
              <div className="space-y-2">
                {categoryData.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.fill }}
                      />
                      <span className="text-sm">
                        {category.name === 'Cash' ? 'Cash & Loans' : category.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPercentage(category.percentage)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Company Legend (top 8) */}
            <div>
              <h4 className="text-sm font-medium mb-3">Top Holdings</h4>
              <div className="space-y-2">
                {companyData.slice(0, 8).map((company, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: company.fill }}
                      />
                      <span className="text-sm truncate max-w-[150px]">{company.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPercentage(company.percentage)}
                    </span>
                  </div>
                ))}
                {companyData.length > 8 && (
                  <div className="text-sm text-muted-foreground">
                    +{companyData.length - 8} more holdings
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
