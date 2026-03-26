import { Metadata } from 'next';
import TeamMetricsList from '@/modules/assetmanager/components/team-metrics/team-metrics-list';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Team Metrics',
  description: 'Track team size, composition, and performance',
};

export default async function TeamMetricsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <TeamMetricsList />;
}