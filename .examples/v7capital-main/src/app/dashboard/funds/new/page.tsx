import { Metadata } from 'next';
import FundForm from '@/modules/assetmanager/components/funds/fund-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/modules/shadcnui/components/ui/card';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Create Fund',
  description: 'Create a new fund',
};

export default async function CreateFundPage() {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="p-0">
          <FundForm />
        </CardContent>
      </Card>
    </div>
  );
}
