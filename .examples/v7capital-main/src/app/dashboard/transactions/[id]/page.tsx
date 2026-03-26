import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TransactionDetail from '@/modules/assetmanager/components/transactions/transaction-detail';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Transaction Details',
  description: 'View transaction details',
};

type TransactionDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);
  if (isNaN(id)) {
    return notFound();
  }

  return <TransactionDetail id={id} />;
}
