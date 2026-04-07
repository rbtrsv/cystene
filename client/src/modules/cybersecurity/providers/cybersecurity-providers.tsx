'use client';

import { ReactNode } from 'react';
import { InfrastructureProvider } from './infrastructure/infrastructure-provider';
import { CredentialProvider } from './infrastructure/credential-provider';
import { ScanTargetProvider } from './infrastructure/scan-target-provider';
import { ScanTemplateProvider } from './execution/scan-template-provider';
import { ScanScheduleProvider } from './execution/scan-schedule-provider';
import { ScanJobProvider } from './execution/scan-job-provider';
import { FindingProvider } from './discovery/finding-provider';
import { AssetProvider } from './discovery/asset-provider';
import { ReportProvider } from './discovery/report-provider';

/**
 * CybersecurityProviders props
 */
interface CybersecurityProvidersProps {
  children: ReactNode;
}

/**
 * Complete cybersecurity providers component
 *
 * Provides all required providers for cybersecurity hooks to work properly.
 * Nested in domain order: Infrastructure → Execution → Discovery.
 *
 * Note: This should be nested inside AccountsProviders since cybersecurity
 * depends on organization context from accounts module.
 */
export function CybersecurityProviders({ children }: CybersecurityProvidersProps) {
  return (
    <InfrastructureProvider initialFetch={false}>
      <CredentialProvider initialFetch={false}>
        <ScanTargetProvider initialFetch={false}>
          <ScanTemplateProvider initialFetch={false}>
            <ScanScheduleProvider initialFetch={false}>
              <ScanJobProvider initialFetch={false}>
                <FindingProvider initialFetch={false}>
                  <AssetProvider initialFetch={false}>
                    <ReportProvider initialFetch={false}>
                      {children}
                    </ReportProvider>
                  </AssetProvider>
                </FindingProvider>
              </ScanJobProvider>
            </ScanScheduleProvider>
          </ScanTemplateProvider>
        </ScanTargetProvider>
      </CredentialProvider>
    </InfrastructureProvider>
  );
}

/**
 * Default export
 */
export default CybersecurityProviders;
