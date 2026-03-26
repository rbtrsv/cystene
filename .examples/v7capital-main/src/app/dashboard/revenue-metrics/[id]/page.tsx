import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RevenueMetricsDetail from '@/modules/assetmanager/components/revenue-metrics/revenue-metrics-detail';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Revenue Metrics Details',
  description: 'View revenue metrics details and performance data',
};

type RevenueMetricsDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RevenueMetricsDetailPage({ params }: RevenueMetricsDetailPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <RevenueMetricsDetail id={id} />;
}