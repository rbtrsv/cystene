import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KpisValuesDetail from '@/modules/assetmanager/components/kpis/kpis-values-detail';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'KPI Value Details',
  description: 'View KPI value details and associated metrics',
};

type KpisValueDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function KpisValueDetailPage({ params }: KpisValueDetailPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <KpisValuesDetail id={id} />;
}