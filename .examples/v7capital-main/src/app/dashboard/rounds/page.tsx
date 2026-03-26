import { Metadata } from 'next';
import RoundList from '@/modules/assetmanager/components/rounds/round-list';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Rounds',
  description: 'Manage funding rounds and their details',
};

export default async function RoundsPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <RoundList />;
}
