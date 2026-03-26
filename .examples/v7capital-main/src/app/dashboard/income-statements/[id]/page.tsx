import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import IncomeStatementDetail from '@/modules/assetmanager/components/income-statements/income-statement-detail';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Income Statement Details',
  description: 'View income statement details and financial metrics',
};

type IncomeStatementDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function IncomeStatementDetailPage({ params }: IncomeStatementDetailPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <IncomeStatementDetail id={id} />;
}