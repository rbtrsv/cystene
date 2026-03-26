import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import InvestmentPortfolioDetail from '@/modules/assetmanager/components/portfolio-investment/portfolio-investment-detail';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Investment Details',
  description: 'View investment details and financial metrics',
};

type InvestmentDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InvestmentDetailPage({ params }: InvestmentDetailPageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <InvestmentPortfolioDetail id={id} />;
}
