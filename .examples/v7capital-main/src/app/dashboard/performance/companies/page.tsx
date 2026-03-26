import { Metadata } from 'next';
import CompaniesPerformance from '@/modules/assetmanager/components/performance/companies-performance';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Companies Performance',
  description: 'Investment performance analysis for portfolio companies',
};

export default async function CompaniesPerformancePage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <CompaniesPerformance />;
}