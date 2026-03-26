import { Metadata } from 'next';
import { CapTableView } from '@/modules/assetmanager/components/captable/captable-view';

export const metadata: Metadata = {
  title: 'Cap Table',
  description: 'View and manage the capitalization table for your funds',
};

export default function CapTablePage() {
  return <CapTableView />;
}
