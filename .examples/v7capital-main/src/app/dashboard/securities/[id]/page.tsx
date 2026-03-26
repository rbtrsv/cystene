import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SecurityDetail from '@/modules/assetmanager/components/securities/security-detail';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Security Details',
  description: 'View security details and financial metrics',
};

type SecurityDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SecurityDetailPage({ params }: SecurityDetailPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <SecurityDetail id={id} />;
}
