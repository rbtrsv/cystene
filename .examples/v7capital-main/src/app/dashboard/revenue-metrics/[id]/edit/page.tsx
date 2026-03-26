import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RevenueMetricsForm from '@/modules/assetmanager/components/revenue-metrics/revenue-metrics-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Revenue Metrics',
  description: 'Edit revenue metrics details',
};

type EditRevenueMetricsPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditRevenueMetricsPage({ params }: EditRevenueMetricsPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <RevenueMetricsForm id={id} />;
}