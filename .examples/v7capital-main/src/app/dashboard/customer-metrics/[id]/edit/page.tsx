import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CustomerMetricsForm from '@/modules/assetmanager/components/customer-metrics/customer-metrics-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Customer Metrics',
  description: 'Edit customer metrics details',
};

type EditCustomerMetricsPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditCustomerMetricsPage({ params }: EditCustomerMetricsPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <CustomerMetricsForm id={id} />;
}