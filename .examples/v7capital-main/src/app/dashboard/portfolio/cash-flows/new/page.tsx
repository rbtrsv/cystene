import { Metadata } from 'next';
import PortfolioCashFlowForm from '@/modules/assetmanager/components/portfolio-cash-flow/portfolio-cash-flow-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Cash Flow',
  description: 'Create a new portfolio cash flow entry',
};

export default async function CreatePortfolioCashFlowPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <PortfolioCashFlowForm />;
}
