import { Metadata } from 'next';
import CashFlowStatementList from '@/modules/assetmanager/components/cash-flow-statements/cash-flow-statement-list';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Cash Flow Statements',
  description: 'Manage company cash flow statements and liquidity analysis',
};

export default async function CashFlowStatementsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <CashFlowStatementList />;
}