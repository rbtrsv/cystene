import { Metadata } from 'next';
import StakeholderUsersForm from '@/modules/assetmanager/components/stakeholders/stakeholder-users-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit User Role',
  description: 'Update user role for this stakeholder',
};

type EditUserRolePageProps = {
  params: Promise<{ id: string; userId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditUserRolePage({ params }: EditUserRolePageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id, userId } = await params;
  const stakeholderId = parseInt(id, 10);
  const userProfileId = parseInt(userId, 10);

  return <StakeholderUsersForm
    stakeholderId={stakeholderId}
    userProfileId={userProfileId}
  />;
}
