import { Metadata } from 'next';
import RevenueMetricsForm from '@/modules/assetmanager/components/revenue-metrics/revenue-metrics-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Revenue Metrics',
  description: 'Create new revenue metrics for a company',
};

export default async function CreateRevenueMetricsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <RevenueMetricsForm />;
}