import { Metadata } from 'next';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import FundRoundsForm from '@/modules/assetmanager/components/funds/fund-rounds-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Add Round',
  description: 'Add a new round to this fund',
};

type AddRoundPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AddRoundPage({ params }: AddRoundPageProps) {
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
          <FundRoundsForm fundId={fundId} />
        </CardContent>
      </Card>
    </div>
  );
}
