import { Metadata } from 'next';
import RevenueMetricsList from '@/modules/assetmanager/components/revenue-metrics/revenue-metrics-list';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Revenue Metrics',
  description: 'Track revenue performance and growth metrics',
};

export default async function RevenueMetricsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <RevenueMetricsList />;
}