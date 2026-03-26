import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DealPipelineForm from '@/modules/assetmanager/components/deal-pipeline/deal-pipeline-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Deal Pipeline',
  description: 'Edit deal pipeline details',
};

type EditDealPipelinePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditDealPipelinePage({ params }: EditDealPipelinePageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <DealPipelineForm id={id} />;
}