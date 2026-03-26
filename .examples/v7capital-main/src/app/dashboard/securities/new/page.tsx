import { Metadata } from 'next';
import SecurityForm from '@/modules/assetmanager/components/securities/security-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Security',
  description: 'Create a new security for a portfolio company',
};

export default async function CreateSecurityPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <SecurityForm />;
}
