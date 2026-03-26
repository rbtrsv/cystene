import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KpisDefinitionsDetail from '@/modules/assetmanager/components/kpis/kpis-definitions-detail';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'KPI Definition Details',
  description: 'View KPI definition details and configuration',
};

type KpiDefinitionDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function KpiDefinitionDetailPage({ params }: KpiDefinitionDetailPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <KpisDefinitionsDetail id={id} />;
}