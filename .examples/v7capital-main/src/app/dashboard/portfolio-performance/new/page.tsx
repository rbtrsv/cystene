import { Metadata } from 'next';
import PortfolioPerformanceForm from '@/modules/assetmanager/components/portfolio-performance/portfolio-performance-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'New Portfolio Performance',
  description: 'Create a new portfolio performance record',
};

export default async function NewPortfolioPerformancePage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <PortfolioPerformanceForm />;
}
