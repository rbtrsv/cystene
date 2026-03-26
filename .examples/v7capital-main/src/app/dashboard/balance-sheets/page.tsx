import { Metadata } from 'next';
import BalanceSheetList from '@/modules/assetmanager/components/balance-sheets/balance-sheet-list';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Balance Sheets',
  description: 'Manage company balance sheets and financial position analysis',
};

export default async function BalanceSheetsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <BalanceSheetList />;
}