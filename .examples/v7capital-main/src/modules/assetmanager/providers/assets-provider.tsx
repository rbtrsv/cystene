'use client';

import { ReactNode } from 'react';
import { CompaniesProvider } from './companies-provider';
import { StakeholdersProvider } from './stakeholders-provider';
import { TransactionsProvider } from './transactions-provider';
import { SecuritiesProvider } from './securities-provider';
import { FundsProvider } from './funds-provider';
import { RoundsProvider } from './rounds-provider';
import { CapTableProvider } from './captable-provider';
import { InvestmentPortfolioProvider } from './portfolio-investment-provider';
import { PortfolioCashFlowProvider } from './portfolio-cash-flow-provider';
import { IncomeStatementsProvider } from './income-statements-provider';
import { CashFlowStatementsProvider } from './cash-flow-statements-provider';
import { BalanceSheetsProvider } from './balance-sheets-provider';
import { DealPipelineProvider } from './deal-pipeline-provider';
import { PortfolioPerformanceProvider } from './portfolio-performance-provider';
import { FeeCostsProvider } from './fee-costs-provider';
import { FinancialRatiosProvider } from './financial-ratios-provider';
import { RevenueMetricsProvider } from './revenue-metrics-provider';
import { CustomerMetricsProvider } from './customer-metrics-provider';
import { OperationalMetricsProvider } from './operational-metrics-provider';
import { TeamMetricsProvider } from './team-metrics-provider';
import { KpisProvider } from './kpis-provider';
import { PerformanceProvider } from './performance-provider';

/**
 * Centralized provider for all asset management related providers
 * This provider combines all the individual providers to simplify the provider tree
 * and ensure all asset data is available throughout the application
 * 
 * This replaces the need for the MembershipProvider by using the dedicated
 * providers for companies and stakeholders directly.
 */
export default function AssetsProvider({ 
  children,
  initialFetch = true 
}: { 
  children: ReactNode;
  initialFetch?: boolean;
}) {
  return (
    <CompaniesProvider initialFetch={initialFetch}>
      <StakeholdersProvider initialFetch={initialFetch}>
        <TransactionsProvider initialFetch={initialFetch}>
          <SecuritiesProvider initialFetch={initialFetch}>
            <FundsProvider initialFetch={initialFetch}>
              <RoundsProvider initialFetch={initialFetch}>
                <IncomeStatementsProvider initialFetch={initialFetch}>
                    <CashFlowStatementsProvider initialFetch={initialFetch}>
                      <BalanceSheetsProvider initialFetch={initialFetch}>
                        <FinancialRatiosProvider initialFetch={initialFetch}>
                          <RevenueMetricsProvider initialFetch={initialFetch}>
                            <CustomerMetricsProvider initialFetch={initialFetch}>
                              <OperationalMetricsProvider initialFetch={initialFetch}>
                                <TeamMetricsProvider initialFetch={initialFetch}>
                                  <KpisProvider initialFetch={initialFetch}>
                                    <DealPipelineProvider initialFetch={initialFetch}>
                                      <PortfolioPerformanceProvider initialFetch={initialFetch}>
                                        <PerformanceProvider initialFetch={false}>
                                          <FeeCostsProvider initialFetch={initialFetch}>
                                          <PortfolioCashFlowProvider initialFetch={initialFetch}>
                                            <InvestmentPortfolioProvider initialFetch={initialFetch}>
                                              <CapTableProvider autoLoad={false}>
                                                {children}
                                              </CapTableProvider>
                                            </InvestmentPortfolioProvider>
                                          </PortfolioCashFlowProvider>
                                          </FeeCostsProvider>
                                        </PerformanceProvider>
                                      </PortfolioPerformanceProvider>
                                    </DealPipelineProvider>
                                  </KpisProvider>
                                </TeamMetricsProvider>
                              </OperationalMetricsProvider>
                            </CustomerMetricsProvider>
                          </RevenueMetricsProvider>
                        </FinancialRatiosProvider>
                      </BalanceSheetsProvider>
                    </CashFlowStatementsProvider>
                </IncomeStatementsProvider>
              </RoundsProvider>
            </FundsProvider>
          </SecuritiesProvider>
        </TransactionsProvider>
      </StakeholdersProvider>
    </CompaniesProvider>
  );
}
