import { Metadata } from 'next';
import IncomeStatementForm from '@/modules/assetmanager/components/income-statements/income-statement-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Income Statement',
  description: 'Create a new income statement for a portfolio company',
};

export default async function CreateIncomeStatementPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <IncomeStatementForm />;
}