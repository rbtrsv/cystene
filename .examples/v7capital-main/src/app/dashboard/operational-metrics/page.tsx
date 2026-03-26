import { Metadata } from 'next';
import OperationalMetricsList from '@/modules/assetmanager/components/operational-metrics/operational-metrics-list';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Operational Metrics',
  description: 'Manage operational efficiency and performance metrics',
};

export default async function OperationalMetricsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <OperationalMetricsList />;
}