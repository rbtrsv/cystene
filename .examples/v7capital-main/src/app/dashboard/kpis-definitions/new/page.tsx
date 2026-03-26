import { Metadata } from 'next';
import KpisDefinitionsForm from '@/modules/assetmanager/components/kpis/kpis-definitions-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create KPI Definition',
  description: 'Define a new key performance indicator',
};

export default async function NewKpiDefinitionPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <KpisDefinitionsForm />;
}