import { Metadata } from 'next';
import TransactionForm from '@/modules/assetmanager/components/transactions/transaction-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Issuance Transaction',
  description: 'Issue new shares or units for a fund',
};

export default async function IssuanceTransactionPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <TransactionForm />;
}
