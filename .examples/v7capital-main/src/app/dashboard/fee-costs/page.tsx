import { Metadata } from 'next';
import FeeCostsList from '@/modules/assetmanager/components/fee-costs/fee-costs-list';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Fee Costs',
  description: 'Manage fund administration fees and costs',
};

export default async function FeeCostsPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <FeeCostsList />;
}