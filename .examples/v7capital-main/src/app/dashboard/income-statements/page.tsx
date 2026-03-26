import { Metadata } from 'next';
import IncomeStatementList from '@/modules/assetmanager/components/income-statements/income-statement-list';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Income Statements',
  description: 'Manage company income statements and financial performance data',
};

export default async function IncomeStatementsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <IncomeStatementList />;
}