import { Metadata } from 'next';
import TeamMetricsForm from '@/modules/assetmanager/components/team-metrics/team-metrics-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Team Metrics',
  description: 'Create new team metrics for a company',
};

export default async function CreateTeamMetricsPage() {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <TeamMetricsForm />;
}