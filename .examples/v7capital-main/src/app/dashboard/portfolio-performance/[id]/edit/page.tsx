import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PortfolioPerformanceForm from '@/modules/assetmanager/components/portfolio-performance/portfolio-performance-form';
import { canAccessAdminPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Portfolio Performance',
  description: 'Edit portfolio performance details and metrics',
};

type EditPortfolioPerformancePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditPortfolioPerformancePage({ params }: EditPortfolioPerformancePageProps) {
  const hasAccess = await canAccessAdminPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);
  if (isNaN(id)) {
    return notFound();
  }

  return <PortfolioPerformanceForm id={id} />;
}
