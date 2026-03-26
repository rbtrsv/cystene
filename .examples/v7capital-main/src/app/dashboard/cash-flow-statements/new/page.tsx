import { Metadata } from 'next';
import CashFlowStatementForm from '@/modules/assetmanager/components/cash-flow-statements/cash-flow-statement-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Cash Flow Statement',
  description: 'Create a new cash flow statement for a portfolio company',
};

export default async function CreateCashFlowStatementPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <CashFlowStatementForm />;
}