import { Metadata } from 'next';
import RoundForm from '@/modules/assetmanager/components/rounds/round-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Round',
  description: 'Edit round details',
};

type EditRoundPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditRoundPage({ params }: EditRoundPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const roundId = parseInt(id, 10);

  return (
    <div className="flex flex-col gap-8">
      <RoundForm id={roundId} />
    </div>
  );
}
