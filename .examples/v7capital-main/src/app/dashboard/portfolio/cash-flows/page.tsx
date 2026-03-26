import { Metadata } from 'next';
import PortfolioCashFlowList from '@/modules/assetmanager/components/portfolio-cash-flow/portfolio-cash-flow-list';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Portfolio Cash Flows',
  description: 'Track and manage investment cash flows across your portfolio',
};

export default async function PortfolioCashFlowsPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <PortfolioCashFlowList />;
}
