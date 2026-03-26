import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FinancialRatiosForm from '@/modules/assetmanager/components/financial-ratios/financial-ratios-form';
import { canAccessCompanyPages } from '@/modules/assetmanager/permissions/permissions';
import { AccessDenied } from '@/modules/assetmanager/components/shared/access-denied';

export const metadata: Metadata = {
  title: 'Edit Financial Ratios',
  description: 'Edit financial ratios details',
};

type EditFinancialRatiosPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditFinancialRatiosPage({ params }: EditFinancialRatiosPageProps) {
  const hasAccess = await canAccessCompanyPages();

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const { id: idString } = await params;
  const id = parseInt(idString, 10);

  if (isNaN(id)) {
    return notFound();
  }

  return <FinancialRatiosForm id={id} />;
}