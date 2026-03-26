import { Metadata } from 'next';
import DealPipelineForm from '@/modules/assetmanager/components/deal-pipeline/deal-pipeline-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Deal Pipeline',
  description: 'Add new deal to the pipeline',
};

export default async function NewDealPipelinePage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <DealPipelineForm />;
}