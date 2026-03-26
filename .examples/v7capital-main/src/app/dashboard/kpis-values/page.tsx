import { Metadata } from 'next';
import KpisValuesList from '@/modules/assetmanager/components/kpis/kpis-values-list';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'KPI Values',
  description: 'Manage KPI values and track performance metrics over time',
};

export default async function KpisValuesPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <KpisValuesList />;
}