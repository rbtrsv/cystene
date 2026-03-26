import { Metadata } from 'next';
import DealPipelineList from '@/modules/assetmanager/components/deal-pipeline/deal-pipeline-list';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Deal Pipeline',
  description: 'Manage your investment pipeline and deal tracking',
};

export default async function DealPipelinePage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <DealPipelineList />;
}