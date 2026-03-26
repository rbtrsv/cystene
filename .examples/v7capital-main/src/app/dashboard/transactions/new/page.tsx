import { Metadata } from 'next';
import TransactionForm from '@/modules/assetmanager/components/transactions/transaction-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Transaction',
  description: 'Create a new transaction',
};

export default async function CreateTransactionPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col gap-8">
      <TransactionForm />
    </div>
  );
}
