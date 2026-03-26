import { Metadata } from 'next';
import FundList from '@/modules/assetmanager/components/funds/fund-list';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Funds',
  description: 'Manage your investment funds',
};

export default async function FundsPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <FundList />;
}