import { Metadata } from 'next';
import FundForm from '@/modules/assetmanager/components/funds/fund-form';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Fund',
  description: 'Edit fund details',
};

type EditFundPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditFundPage({ params }: EditFundPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id } = await params;
  const fundId = parseInt(id, 10);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="p-0">
          <FundForm id={fundId} />
        </CardContent>
      </Card>
    </div>
  );
}
