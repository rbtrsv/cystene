import { Metadata } from 'next';
import KpisDefinitionsForm from '@/modules/assetmanager/components/kpis/kpis-definitions-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit KPI Definition',
  description: 'Edit key performance indicator definition',
};

interface EditKpiDefinitionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditKpiDefinitionPage({ params }: EditKpiDefinitionPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  return <KpisDefinitionsForm id={parseInt(id, 10)} />;
}