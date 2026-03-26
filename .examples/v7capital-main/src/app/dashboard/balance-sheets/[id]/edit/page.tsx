import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BalanceSheetForm from '@/modules/assetmanager/components/balance-sheets/balance-sheet-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Balance Sheet',
  description: 'Edit balance sheet details and financial position metrics',
};

type EditBalanceSheetPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditBalanceSheetPage({ params }: EditBalanceSheetPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <BalanceSheetForm id={id} />;
}