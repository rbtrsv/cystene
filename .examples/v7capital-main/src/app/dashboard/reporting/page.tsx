import { Metadata } from 'next';
import ReportingView from '@/modules/assetmanager/components/reporting/reporting-view';
import { isCurrentUserStakeholder } from '@/modules/assetmanager/permissions/permissions';

export const metadata: Metadata = {
  title: 'Reporting',
  description: 'Stakeholder returns and fund performance reporting',
};

export default async function ReportingPage() {
  const isStakeholder = await isCurrentUserStakeholder();

  return <ReportingView isStakeholder={isStakeholder} />;
}
