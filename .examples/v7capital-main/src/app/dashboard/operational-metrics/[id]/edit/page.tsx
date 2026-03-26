import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import OperationalMetricsForm from '@/modules/assetmanager/components/operational-metrics/operational-metrics-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Operational Metrics',
  description: 'Edit operational metrics details',
};

type EditOperationalMetricsPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditOperationalMetricsPage({ params }: EditOperationalMetricsPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <OperationalMetricsForm id={id} />;
}