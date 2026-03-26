import { Metadata } from 'next';
import PortfolioPerformanceList from '@/modules/assetmanager/components/portfolio-performance/portfolio-performance-list';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Portfolio Performance',
  description: 'Monitor portfolio returns and performance metrics',
};

export default async function PortfolioPerformancePage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <PortfolioPerformanceList />;
}