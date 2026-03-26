import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TransactionForm from '@/modules/assetmanager/components/transactions/transaction-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Transaction',
  description: 'Edit transaction details',
};

type EditTransactionPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);
  if (isNaN(id)) {
    return notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <TransactionForm id={id} />
    </div>
  );
}
