import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TeamMetricsDetail from '@/modules/assetmanager/components/team-metrics/team-metrics-detail';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Team Metrics Details',
  description: 'View and manage team metrics details',
};

type TeamMetricsDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamMetricsDetailPage({ params }: TeamMetricsDetailPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <TeamMetricsDetail id={id} />;
}