import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BalanceSheetDetail from '@/modules/assetmanager/components/balance-sheets/balance-sheet-detail';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Balance Sheet Details',
  description: 'View balance sheet details and financial position metrics',
};

type BalanceSheetDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BalanceSheetDetailPage({ params }: BalanceSheetDetailPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <BalanceSheetDetail id={id} />;
}