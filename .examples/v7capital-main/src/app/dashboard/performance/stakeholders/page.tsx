import { Metadata } from 'next';
import StakeholdersPerformance from '@/modules/assetmanager/components/performance/stakeholders-performance';

export const metadata: Metadata = {
  title: 'Stakeholders Returns',
  description: 'Individual stakeholder returns analysis with attribution',
};

export default function StakeholdersPerformancePage() {
  return <StakeholdersPerformance />;
}