import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PortfolioCashFlowForm from '@/modules/assetmanager/components/portfolio-cash-flow/portfolio-cash-flow-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Cash Flow',
  description: 'Edit portfolio cash flow details and configuration',
};

type EditPortfolioCashFlowPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditPortfolioCashFlowPage({ params }: EditPortfolioCashFlowPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <PortfolioCashFlowForm id={id} />;
}
