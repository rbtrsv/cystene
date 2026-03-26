import { Metadata } from 'next';
import CustomerMetricsList from '@/modules/assetmanager/components/customer-metrics/customer-metrics-list';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Customer Metrics',
  description: 'Manage customer acquisition, retention, and growth metrics',
};

export default async function CustomerMetricsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <CustomerMetricsList />;
}