import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FeeCostsForm from '@/modules/assetmanager/components/fee-costs/fee-costs-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Fee Cost',
  description: 'Edit fee cost details',
};

type EditFeeCostPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditFeeCostPage({ params }: EditFeeCostPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <FeeCostsForm id={id} />;
}