import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import IncomeStatementForm from '@/modules/assetmanager/components/income-statements/income-statement-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Income Statement',
  description: 'Edit income statement details and financial metrics',
};

type EditIncomeStatementPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditIncomeStatementPage({ params }: EditIncomeStatementPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <IncomeStatementForm id={id} />;
}