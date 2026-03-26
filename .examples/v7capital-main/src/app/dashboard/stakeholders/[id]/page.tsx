import { Metadata } from 'next';
import StakeholderDetail from '@/modules/assetmanager/components/stakeholders/stakeholder-detail';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Stakeholder Details',
  description: 'View and manage stakeholder details',
};

type StakeholderDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StakeholderDetailPage({ params }: StakeholderDetailPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const stakeholderId = parseInt(id, 10);

  return <StakeholderDetail id={stakeholderId} />;
}