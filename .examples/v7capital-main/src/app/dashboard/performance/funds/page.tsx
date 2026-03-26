import { Metadata } from 'next';
import FundsPerformance from '@/modules/assetmanager/components/performance/funds-performance';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Funds Performance',
  description: 'Fund performance analysis with IRR, TVPI, DPI, and RVPI metrics',
};

export default async function FundsPerformancePage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <FundsPerformance />;
}