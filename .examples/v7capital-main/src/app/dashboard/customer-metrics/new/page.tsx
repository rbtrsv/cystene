import { Metadata } from 'next';
import CustomerMetricsForm from '@/modules/assetmanager/components/customer-metrics/customer-metrics-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Customer Metrics',
  description: 'Create new customer metrics for a company',
};

export default async function CreateCustomerMetricsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <CustomerMetricsForm />;
}