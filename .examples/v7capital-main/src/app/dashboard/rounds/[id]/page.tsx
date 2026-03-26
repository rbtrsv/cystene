import { Metadata } from 'next';
import RoundDetail from '@/modules/assetmanager/components/rounds/round-detail';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Round Details',
  description: 'View and manage round details',
};

type RoundDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RoundDetailPage({ params }: RoundDetailPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const roundId = parseInt(id, 10);

  return <RoundDetail id={roundId} />;
}
