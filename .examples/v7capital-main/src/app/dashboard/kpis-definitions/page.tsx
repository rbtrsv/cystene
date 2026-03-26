import { Metadata } from 'next';
import KpisDefinitionsList from '@/modules/assetmanager/components/kpis/kpis-definitions-list';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'KPI Definitions',
  description: 'Define and manage key performance indicators for companies',
};

export default async function KpiDefinitionsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <KpisDefinitionsList />;
}