import { Metadata } from 'next';
import TransactionList from '@/modules/assetmanager/components/transactions/transaction-list';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Transactions',
  description: 'Manage your transactions and their details',
};

export default async function TransactionsPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <TransactionList />;
}
