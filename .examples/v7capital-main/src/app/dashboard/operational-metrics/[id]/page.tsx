import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import OperationalMetricsDetail from '@/modules/assetmanager/components/operational-metrics/operational-metrics-detail';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Operational Metrics Details',
  description: 'View and manage operational metrics details',
};

type OperationalMetricsDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OperationalMetricsDetailPage({ params }: OperationalMetricsDetailPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <OperationalMetricsDetail id={id} />;
}