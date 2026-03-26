import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CashFlowStatementForm from '@/modules/assetmanager/components/cash-flow-statements/cash-flow-statement-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Cash Flow Statement',
  description: 'Edit cash flow statement details and liquidity metrics',
};

type EditCashFlowStatementPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditCashFlowStatementPage({ params }: EditCashFlowStatementPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <CashFlowStatementForm id={id} />;
}