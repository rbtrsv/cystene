import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FinancialRatiosDetail from '@/modules/assetmanager/components/financial-ratios/financial-ratios-detail';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Financial Ratios Details',
  description: 'View and manage financial ratios details',
};

type FinancialRatiosDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FinancialRatiosDetailPage({ params }: FinancialRatiosDetailPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <FinancialRatiosDetail id={id} />;
}