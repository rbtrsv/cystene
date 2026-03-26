import { Metadata } from 'next';
import StakeholderList from '@/modules/assetmanager/components/stakeholders/stakeholder-list';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Stakeholders',
  description: 'Manage your stakeholders and their details',
};

export default async function StakeholdersPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <StakeholderList />;
}