import { Metadata } from 'next';
import OperationalMetricsForm from '@/modules/assetmanager/components/operational-metrics/operational-metrics-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Operational Metrics',
  description: 'Create new operational metrics for a company',
};

export default async function CreateOperationalMetricsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <OperationalMetricsForm />;
}