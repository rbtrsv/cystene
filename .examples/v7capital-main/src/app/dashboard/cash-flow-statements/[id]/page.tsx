import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CashFlowStatementDetail from '@/modules/assetmanager/components/cash-flow-statements/cash-flow-statement-detail';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Cash Flow Statement Details',
  description: 'View cash flow statement details and liquidity metrics',
};

type CashFlowStatementDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CashFlowStatementDetailPage({ params }: CashFlowStatementDetailPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <CashFlowStatementDetail id={id} />;
}