import { Metadata } from 'next';
import StakeholderForm from '@/modules/assetmanager/components/stakeholders/stakeholder-form';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Stakeholder',
  description: 'Edit stakeholder details',
};

type EditStakeholderPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditStakeholderPage({ params }: EditStakeholderPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const stakeholderId = parseInt(id, 10);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="p-0">
          <StakeholderForm id={stakeholderId} />
        </CardContent>
      </Card>
    </div>
  );
}
