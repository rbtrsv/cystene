import { Metadata } from 'next';
import StakeholderForm from '@/modules/assetmanager/components/stakeholders/stakeholder-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/modules/shadcnui/components/ui/card';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Stakeholder',
  description: 'Create a new stakeholder',
};

export default async function CreateStakeholderPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="p-0">
          <StakeholderForm />
        </CardContent>
      </Card>
    </div>
  );
}