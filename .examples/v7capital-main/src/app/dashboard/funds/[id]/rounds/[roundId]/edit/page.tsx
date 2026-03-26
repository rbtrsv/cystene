import { Metadata } from 'next';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import FundRoundsForm from '@/modules/assetmanager/components/funds/fund-rounds-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Round',
  description: 'Edit an existing round for this fund',
};

type EditRoundPageProps = {
  params: Promise<{ id: string; roundId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditRoundPage({ params }: EditRoundPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id, roundId } = await params;
  const fundId = parseInt(id, 10);
  const roundIdNumber = parseInt(roundId, 10);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="p-0">
          <FundRoundsForm
            fundId={fundId}
            roundId={roundIdNumber}
          />
        </CardContent>
      </Card>
    </div>
  );
}
