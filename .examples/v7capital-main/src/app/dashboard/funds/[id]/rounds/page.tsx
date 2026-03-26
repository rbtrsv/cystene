import { Metadata } from 'next';
import FundRoundsList from '@/modules/assetmanager/components/funds/fund-rounds-list';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Fund Rounds',
  description: 'Manage rounds for this fund',
};

type FundRoundsPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FundRoundsPage({ params }: FundRoundsPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const fundId = parseInt(id, 10);

  return <FundRoundsList fundId={fundId} />;
}
