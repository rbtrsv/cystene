import { Metadata } from 'next';
import FeeCostsDetail from '@/modules/assetmanager/components/fee-costs/fee-costs-detail';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Fee Cost Details',
  description: 'View and manage fee cost details',
};

type FeeCostDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FeeCostDetailPage({ params }: FeeCostDetailPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const feeCostId = parseInt(id, 10);

  return <FeeCostsDetail id={feeCostId} />;
}