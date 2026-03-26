import { Metadata } from 'next';
import KpisValuesForm from '@/modules/assetmanager/components/kpis/kpis-values-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Add KPI Value',
  description: 'Add a new KPI value for a defined metric',
};

export default async function NewKpiValuePage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <KpisValuesForm />;
}