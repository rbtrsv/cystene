import { Metadata } from 'next';
import DealPipelineDetail from '@/modules/assetmanager/components/deal-pipeline/deal-pipeline-detail';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Deal Details',
  description: 'View and manage deal pipeline details',
};

type DealDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const dealId = parseInt(id, 10);

  return <DealPipelineDetail id={dealId} />;
}