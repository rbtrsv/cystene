import { Metadata } from 'next';
import StakeholderUsersForm from '@/modules/assetmanager/components/stakeholders/stakeholder-users-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Manage Stakeholder Users',
  description: 'Add, edit or remove users for this stakeholder',
};

type StakeholderUsersPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StakeholderUsersPage({ params }: StakeholderUsersPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const stakeholderId = parseInt(id, 10);

  return <StakeholderUsersForm stakeholderId={stakeholderId} />;
}
