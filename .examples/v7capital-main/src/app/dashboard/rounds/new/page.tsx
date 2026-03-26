import { Metadata } from 'next';
import RoundForm from '@/modules/assetmanager/components/rounds/round-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Round',
  description: 'Create a new funding round',
};

export default async function CreateRoundPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col gap-8">
      <RoundForm />
    </div>
  );
}
