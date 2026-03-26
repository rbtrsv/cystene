import { Metadata } from 'next';
import SecurityList from '@/modules/assetmanager/components/securities/security-list';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Securities',
  description: 'Manage your securities and their details',
};

export default async function SecuritiesPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <SecurityList />;
}
