import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PortfolioCashFlowDetail from '@/modules/assetmanager/components/portfolio-cash-flow/portfolio-cash-flow-detail';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Cash Flow Details',
  description: 'View portfolio cash flow details and financial metrics',
};

type PortfolioCashFlowDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PortfolioCashFlowDetailPage({ params }: PortfolioCashFlowDetailPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <PortfolioCashFlowDetail id={id} />;
}
