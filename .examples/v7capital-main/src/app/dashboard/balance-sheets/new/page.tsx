import { Metadata } from 'next';
import BalanceSheetForm from '@/modules/assetmanager/components/balance-sheets/balance-sheet-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Balance Sheet',
  description: 'Create a new balance sheet for a portfolio company',
};

export default async function CreateBalanceSheetPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <BalanceSheetForm />;
}