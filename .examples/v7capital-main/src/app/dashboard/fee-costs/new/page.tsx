import { Metadata } from 'next';
import FeeCostsForm from '@/modules/assetmanager/components/fee-costs/fee-costs-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Fee Cost',
  description: 'Add new fee or cost entry',
};

export default async function NewFeeCostPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <FeeCostsForm />;
}