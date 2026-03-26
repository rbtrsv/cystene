'use client';

import { ReactNode } from 'react';
import { EntityProvider } from './entity/entity-provider';
import { EntityOrganizationMembersProvider } from './entity/entity-organization-members-provider';
import { EntityOrganizationInvitationsProvider } from './entity/entity-organization-invitations-provider';
import { FundingRoundProvider } from './captable/funding-round-provider';
import { SecurityProvider } from './captable/security-provider';
import { SecurityTransactionProvider } from './captable/security-transaction-provider';
import { StakeholderProvider } from './entity/stakeholder-provider';
import { SyndicateProvider } from './entity/syndicate-provider';
import { SyndicateMembersProvider } from './entity/syndicate-member-provider';
import { SyndicateTransactionsProvider } from './entity/syndicate-transaction-provider';
import { FeeProvider } from './captable/fee-provider';
import { EntityDealProfileProvider } from './deal/entity-deal-profile-provider';
import { DealProvider } from './deal/deal-provider';
import { DealCommitmentProvider } from './deal/deal-commitment-provider';
import { IncomeStatementProvider } from './financial/income-statement-provider';
import { CashFlowStatementProvider } from './financial/cash-flow-statement-provider';
import { BalanceSheetProvider } from './financial/balance-sheet-provider';
import { FinancialMetricsProvider } from './financial/financial-metrics-provider';
import { KPIProvider } from './financial/kpi-provider';
import { KPIValueProvider } from './financial/kpi-value-provider';
import { DealPipelineProvider } from './holding/deal-pipeline-provider';
import { HoldingProvider } from './holding/holding-provider';
import { HoldingCashFlowProvider } from './holding/holding-cash-flow-provider';
import { HoldingPerformanceProvider } from './holding/holding-performance-provider';
import { ValuationProvider } from './holding/valuation-provider';
import { PerformanceComputedProvider } from './holding/performance-computed-provider';

/**
 * AssetManagerProviders props
 */
interface AssetManagerProvidersProps {
  children: ReactNode;
}

/**
 * Complete assetmanager providers component
 *
 * Provides all required providers for assetmanager hooks to work properly.
 *
 * Note: This should be nested inside AccountsProviders since assetmanager
 * depends on organization context from accounts module.
 */
export function AssetManagerProviders({ children }: AssetManagerProvidersProps) {
  return (
    <EntityProvider initialFetch={false}>
      <EntityOrganizationMembersProvider initialFetch={false}>
        <EntityOrganizationInvitationsProvider initialFetch={false}>
          <StakeholderProvider initialFetch={false}>
            <SyndicateProvider initialFetch={false}>
              <SyndicateMembersProvider initialFetch={false}>
                <SyndicateTransactionsProvider initialFetch={false}>
                  <FundingRoundProvider initialFetch={false}>
                  <SecurityProvider initialFetch={false}>
                    <SecurityTransactionProvider initialFetch={false}>
                      <FeeProvider initialFetch={false}>
                        <EntityDealProfileProvider initialFetch={false}>
                          <DealProvider initialFetch={false}>
                            <DealCommitmentProvider initialFetch={false}>
                              <IncomeStatementProvider initialFetch={false}>
                                <CashFlowStatementProvider initialFetch={false}>
                                  <BalanceSheetProvider initialFetch={false}>
                                    <FinancialMetricsProvider initialFetch={false}>
                                      <KPIProvider initialFetch={false}>
                                        <KPIValueProvider initialFetch={false}>
                                          <DealPipelineProvider initialFetch={false}>
                                            <HoldingProvider initialFetch={false}>
                                              <HoldingCashFlowProvider initialFetch={false}>
                                                <HoldingPerformanceProvider initialFetch={false}>
                                                  <ValuationProvider initialFetch={false}>
                                                    <PerformanceComputedProvider>
                                                      {children}
                                                    </PerformanceComputedProvider>
                                                  </ValuationProvider>
                                                </HoldingPerformanceProvider>
                                              </HoldingCashFlowProvider>
                                            </HoldingProvider>
                                          </DealPipelineProvider>
                                        </KPIValueProvider>
                                      </KPIProvider>
                                    </FinancialMetricsProvider>
                                  </BalanceSheetProvider>
                                </CashFlowStatementProvider>
                              </IncomeStatementProvider>
                            </DealCommitmentProvider>
                          </DealProvider>
                        </EntityDealProfileProvider>
                      </FeeProvider>
                    </SecurityTransactionProvider>
                  </SecurityProvider>
                </FundingRoundProvider>
                </SyndicateTransactionsProvider>
              </SyndicateMembersProvider>
            </SyndicateProvider>
          </StakeholderProvider>
        </EntityOrganizationInvitationsProvider>
      </EntityOrganizationMembersProvider>
    </EntityProvider>
  );
}

/**
 * Default export
 */
export default AssetManagerProviders;
