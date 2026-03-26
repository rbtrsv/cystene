import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KpisValuesForm from '@/modules/assetmanager/components/kpis/kpis-values-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit KPI Value',
  description: 'Edit KPI value details and metrics',
};

type EditKpiValuePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditKpiValuePage({ params }: EditKpiValuePageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <KpisValuesForm id={id} />;
}