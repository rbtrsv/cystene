import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import InvestmentPortfolioForm from '@/modules/assetmanager/components/portfolio-investment/portfolio-investment-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Investment',
  description: 'Edit investment details and configuration',
};

type EditInvestmentPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditInvestmentPage({ params }: EditInvestmentPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <InvestmentPortfolioForm id={id} />;
}
