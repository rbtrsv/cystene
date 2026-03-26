import { Metadata } from 'next';
import FundDetail from '@/modules/assetmanager/components/funds/fund-detail';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Fund Details',
  description: 'View and manage fund details',
};

type FundDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FundDetailPage({ params }: FundDetailPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const fundId = parseInt(id, 10);

  return <FundDetail id={fundId} />;
}
