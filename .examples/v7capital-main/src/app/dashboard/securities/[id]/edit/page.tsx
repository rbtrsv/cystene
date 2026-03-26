import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SecurityForm from '@/modules/assetmanager/components/securities/security-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Security',
  description: 'Edit security details and configuration',
};

type EditSecurityPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditSecurityPage({ params }: EditSecurityPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <SecurityForm id={id} />;
}
