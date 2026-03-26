'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useBalanceSheets } from '@/modules/assetmanager/hooks/use-balance-sheets';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { CreateBalanceSheetSchema, UpdateBalanceSheetSchema, type BalanceSheet, type FinancialScenario, type Quarter, type Semester, type Month } from '@/modules/assetmanager/schemas/balance-sheets.schemas';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/modules/shadcnui/components/ui/select';
import { Save } from 'lucide-react';

interface BalanceSheetFormProps {
  id?: number;
  initialData?: BalanceSheet;
}

// Standard FieldInfo component for displaying validation errors
function FieldInfo({ field }: { field: any }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
      ) : null}
      {field.state.meta.isValidating ? <p className="text-sm text-muted-foreground mt-1">Validating...</p> : null}
    </>
  );
}

export default function BalanceSheetForm({ id, initialData }: BalanceSheetFormProps) {
  const router = useRouter();
  const { selectedBalanceSheet, addBalanceSheet, editBalanceSheet, fetchBalanceSheet, isLoading, error, clearError } = useBalanceSheets();
  const { companies, fetchCompanies } = useCompanies();
  
  const isEditMode = !!id;
  const currentYear = new Date().getFullYear();
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      companyId: initialData?.companyId || selectedBalanceSheet?.companyId || undefined,
      year: initialData?.year?.toString() || selectedBalanceSheet?.year?.toString() || currentYear.toString(),
      semester: initialData?.semester || selectedBalanceSheet?.semester || '',
      quarter: initialData?.quarter || selectedBalanceSheet?.quarter || '',
      month: initialData?.month || selectedBalanceSheet?.month || '',
      date: initialData?.date || selectedBalanceSheet?.date || '',
      scenario: initialData?.scenario || selectedBalanceSheet?.scenario || 'Actual',
      // Current Assets
      cash: initialData?.cash?.toString() || selectedBalanceSheet?.cash?.toString() || '',
      cashEquivalents: initialData?.cashEquivalents?.toString() || selectedBalanceSheet?.cashEquivalents?.toString() || '',
      cashAndCashEquivalents: initialData?.cashAndCashEquivalents?.toString() || selectedBalanceSheet?.cashAndCashEquivalents?.toString() || '',
      otherShortTermInvestments: initialData?.otherShortTermInvestments?.toString() || selectedBalanceSheet?.otherShortTermInvestments?.toString() || '',
      accountsReceivable: initialData?.accountsReceivable?.toString() || selectedBalanceSheet?.accountsReceivable?.toString() || '',
      otherReceivables: initialData?.otherReceivables?.toString() || selectedBalanceSheet?.otherReceivables?.toString() || '',
      inventory: initialData?.inventory?.toString() || selectedBalanceSheet?.inventory?.toString() || '',
      prepaidAssets: initialData?.prepaidAssets?.toString() || selectedBalanceSheet?.prepaidAssets?.toString() || '',
      restrictedCash: initialData?.restrictedCash?.toString() || selectedBalanceSheet?.restrictedCash?.toString() || '',
      assetsHeldForSale: initialData?.assetsHeldForSale?.toString() || selectedBalanceSheet?.assetsHeldForSale?.toString() || '',
      hedgingAssets: initialData?.hedgingAssets?.toString() || selectedBalanceSheet?.hedgingAssets?.toString() || '',
      otherCurrentAssets: initialData?.otherCurrentAssets?.toString() || selectedBalanceSheet?.otherCurrentAssets?.toString() || '',
      totalCurrentAssets: initialData?.totalCurrentAssets?.toString() || selectedBalanceSheet?.totalCurrentAssets?.toString() || '',
      // Non-Current Assets
      properties: initialData?.properties?.toString() || selectedBalanceSheet?.properties?.toString() || '',
      landAndImprovements: initialData?.landAndImprovements?.toString() || selectedBalanceSheet?.landAndImprovements?.toString() || '',
      machineryFurnitureEquipment: initialData?.machineryFurnitureEquipment?.toString() || selectedBalanceSheet?.machineryFurnitureEquipment?.toString() || '',
      constructionInProgress: initialData?.constructionInProgress?.toString() || selectedBalanceSheet?.constructionInProgress?.toString() || '',
      leases: initialData?.leases?.toString() || selectedBalanceSheet?.leases?.toString() || '',
      accumulatedDepreciation: initialData?.accumulatedDepreciation?.toString() || selectedBalanceSheet?.accumulatedDepreciation?.toString() || '',
      goodwill: initialData?.goodwill?.toString() || selectedBalanceSheet?.goodwill?.toString() || '',
      investmentProperties: initialData?.investmentProperties?.toString() || selectedBalanceSheet?.investmentProperties?.toString() || '',
      financialAssets: initialData?.financialAssets?.toString() || selectedBalanceSheet?.financialAssets?.toString() || '',
      intangibleAssets: initialData?.intangibleAssets?.toString() || selectedBalanceSheet?.intangibleAssets?.toString() || '',
      investmentsAndAdvances: initialData?.investmentsAndAdvances?.toString() || selectedBalanceSheet?.investmentsAndAdvances?.toString() || '',
      otherNonCurrentAssets: initialData?.otherNonCurrentAssets?.toString() || selectedBalanceSheet?.otherNonCurrentAssets?.toString() || '',
      totalNonCurrentAssets: initialData?.totalNonCurrentAssets?.toString() || selectedBalanceSheet?.totalNonCurrentAssets?.toString() || '',
      // Total Assets
      totalAssets: initialData?.totalAssets?.toString() || selectedBalanceSheet?.totalAssets?.toString() || '',
      // Current Liabilities
      accountsPayable: initialData?.accountsPayable?.toString() || selectedBalanceSheet?.accountsPayable?.toString() || '',
      accruedExpenses: initialData?.accruedExpenses?.toString() || selectedBalanceSheet?.accruedExpenses?.toString() || '',
      shortTermDebt: initialData?.shortTermDebt?.toString() || selectedBalanceSheet?.shortTermDebt?.toString() || '',
      deferredRevenue: initialData?.deferredRevenue?.toString() || selectedBalanceSheet?.deferredRevenue?.toString() || '',
      taxPayable: initialData?.taxPayable?.toString() || selectedBalanceSheet?.taxPayable?.toString() || '',
      pensions: initialData?.pensions?.toString() || selectedBalanceSheet?.pensions?.toString() || '',
      otherCurrentLiabilities: initialData?.otherCurrentLiabilities?.toString() || selectedBalanceSheet?.otherCurrentLiabilities?.toString() || '',
      totalCurrentLiabilities: initialData?.totalCurrentLiabilities?.toString() || selectedBalanceSheet?.totalCurrentLiabilities?.toString() || '',
      // Non-Current Liabilities
      longTermProvisions: initialData?.longTermProvisions?.toString() || selectedBalanceSheet?.longTermProvisions?.toString() || '',
      longTermDebt: initialData?.longTermDebt?.toString() || selectedBalanceSheet?.longTermDebt?.toString() || '',
      provisionForRisksAndCharges: initialData?.provisionForRisksAndCharges?.toString() || selectedBalanceSheet?.provisionForRisksAndCharges?.toString() || '',
      deferredLiabilities: initialData?.deferredLiabilities?.toString() || selectedBalanceSheet?.deferredLiabilities?.toString() || '',
      derivativeProductLiabilities: initialData?.derivativeProductLiabilities?.toString() || selectedBalanceSheet?.derivativeProductLiabilities?.toString() || '',
      otherNonCurrentLiabilities: initialData?.otherNonCurrentLiabilities?.toString() || selectedBalanceSheet?.otherNonCurrentLiabilities?.toString() || '',
      totalNonCurrentLiabilities: initialData?.totalNonCurrentLiabilities?.toString() || selectedBalanceSheet?.totalNonCurrentLiabilities?.toString() || '',
      // Total Liabilities
      totalLiabilities: initialData?.totalLiabilities?.toString() || selectedBalanceSheet?.totalLiabilities?.toString() || '',
      // Shareholders' Equity
      commonStock: initialData?.commonStock?.toString() || selectedBalanceSheet?.commonStock?.toString() || '',
      retainedEarnings: initialData?.retainedEarnings?.toString() || selectedBalanceSheet?.retainedEarnings?.toString() || '',
      otherStakeholdersEquity: initialData?.otherStakeholdersEquity?.toString() || selectedBalanceSheet?.otherStakeholdersEquity?.toString() || '',
      additionalPaidInCapital: initialData?.additionalPaidInCapital?.toString() || selectedBalanceSheet?.additionalPaidInCapital?.toString() || '',
      treasuryStock: initialData?.treasuryStock?.toString() || selectedBalanceSheet?.treasuryStock?.toString() || '',
      minorityInterest: initialData?.minorityInterest?.toString() || selectedBalanceSheet?.minorityInterest?.toString() || '',
      totalStakeholdersEquity: initialData?.totalStakeholdersEquity?.toString() || selectedBalanceSheet?.totalStakeholdersEquity?.toString() || '',
    },
    validators: {
      onChange: ({ value }) => {
        // Transform strings to proper types for schema validation
        const transformedValue = {
          companyId: value.companyId,
          year: value.year ? Number(value.year) : undefined,
          semester: value.semester || undefined,
          quarter: value.quarter || undefined,
          month: value.month || undefined,
          date: value.date || undefined,
          scenario: value.scenario as FinancialScenario,
          // Transform all number fields
          cash: value.cash ? Number(value.cash) : undefined,
          cashEquivalents: value.cashEquivalents ? Number(value.cashEquivalents) : undefined,
          cashAndCashEquivalents: value.cashAndCashEquivalents ? Number(value.cashAndCashEquivalents) : undefined,
          otherShortTermInvestments: value.otherShortTermInvestments ? Number(value.otherShortTermInvestments) : undefined,
          accountsReceivable: value.accountsReceivable ? Number(value.accountsReceivable) : undefined,
          otherReceivables: value.otherReceivables ? Number(value.otherReceivables) : undefined,
          inventory: value.inventory ? Number(value.inventory) : undefined,
          prepaidAssets: value.prepaidAssets ? Number(value.prepaidAssets) : undefined,
          restrictedCash: value.restrictedCash ? Number(value.restrictedCash) : undefined,
          assetsHeldForSale: value.assetsHeldForSale ? Number(value.assetsHeldForSale) : undefined,
          hedgingAssets: value.hedgingAssets ? Number(value.hedgingAssets) : undefined,
          otherCurrentAssets: value.otherCurrentAssets ? Number(value.otherCurrentAssets) : undefined,
          totalCurrentAssets: value.totalCurrentAssets ? Number(value.totalCurrentAssets) : undefined,
          properties: value.properties ? Number(value.properties) : undefined,
          landAndImprovements: value.landAndImprovements ? Number(value.landAndImprovements) : undefined,
          machineryFurnitureEquipment: value.machineryFurnitureEquipment ? Number(value.machineryFurnitureEquipment) : undefined,
          constructionInProgress: value.constructionInProgress ? Number(value.constructionInProgress) : undefined,
          leases: value.leases ? Number(value.leases) : undefined,
          accumulatedDepreciation: value.accumulatedDepreciation ? Number(value.accumulatedDepreciation) : undefined,
          goodwill: value.goodwill ? Number(value.goodwill) : undefined,
          investmentProperties: value.investmentProperties ? Number(value.investmentProperties) : undefined,
          financialAssets: value.financialAssets ? Number(value.financialAssets) : undefined,
          intangibleAssets: value.intangibleAssets ? Number(value.intangibleAssets) : undefined,
          investmentsAndAdvances: value.investmentsAndAdvances ? Number(value.investmentsAndAdvances) : undefined,
          otherNonCurrentAssets: value.otherNonCurrentAssets ? Number(value.otherNonCurrentAssets) : undefined,
          totalNonCurrentAssets: value.totalNonCurrentAssets ? Number(value.totalNonCurrentAssets) : undefined,
          totalAssets: value.totalAssets ? Number(value.totalAssets) : undefined,
          accountsPayable: value.accountsPayable ? Number(value.accountsPayable) : undefined,
          accruedExpenses: value.accruedExpenses ? Number(value.accruedExpenses) : undefined,
          shortTermDebt: value.shortTermDebt ? Number(value.shortTermDebt) : undefined,
          deferredRevenue: value.deferredRevenue ? Number(value.deferredRevenue) : undefined,
          taxPayable: value.taxPayable ? Number(value.taxPayable) : undefined,
          pensions: value.pensions ? Number(value.pensions) : undefined,
          otherCurrentLiabilities: value.otherCurrentLiabilities ? Number(value.otherCurrentLiabilities) : undefined,
          totalCurrentLiabilities: value.totalCurrentLiabilities ? Number(value.totalCurrentLiabilities) : undefined,
          longTermProvisions: value.longTermProvisions ? Number(value.longTermProvisions) : undefined,
          longTermDebt: value.longTermDebt ? Number(value.longTermDebt) : undefined,
          provisionForRisksAndCharges: value.provisionForRisksAndCharges ? Number(value.provisionForRisksAndCharges) : undefined,
          deferredLiabilities: value.deferredLiabilities ? Number(value.deferredLiabilities) : undefined,
          derivativeProductLiabilities: value.derivativeProductLiabilities ? Number(value.derivativeProductLiabilities) : undefined,
          otherNonCurrentLiabilities: value.otherNonCurrentLiabilities ? Number(value.otherNonCurrentLiabilities) : undefined,
          totalNonCurrentLiabilities: value.totalNonCurrentLiabilities ? Number(value.totalNonCurrentLiabilities) : undefined,
          totalLiabilities: value.totalLiabilities ? Number(value.totalLiabilities) : undefined,
          commonStock: value.commonStock ? Number(value.commonStock) : undefined,
          retainedEarnings: value.retainedEarnings ? Number(value.retainedEarnings) : undefined,
          otherStakeholdersEquity: value.otherStakeholdersEquity ? Number(value.otherStakeholdersEquity) : undefined,
          additionalPaidInCapital: value.additionalPaidInCapital ? Number(value.additionalPaidInCapital) : undefined,
          treasuryStock: value.treasuryStock ? Number(value.treasuryStock) : undefined,
          minorityInterest: value.minorityInterest ? Number(value.minorityInterest) : undefined,
          totalStakeholdersEquity: value.totalStakeholdersEquity ? Number(value.totalStakeholdersEquity) : undefined,
        };
        
        const schema = isEditMode ? UpdateBalanceSheetSchema : CreateBalanceSheetSchema;
        const result = schema.safeParse(transformedValue);
        
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path.length > 0) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          return fieldErrors;
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      // Transform and validate at submission
      const transformedValue = {
        companyId: value.companyId!,
        year: Number(value.year),
        semester: value.semester || undefined,
        quarter: value.quarter || undefined,
        month: value.month || undefined,
        date: value.date || undefined,
        scenario: value.scenario as FinancialScenario,
        cash: value.cash ? Number(value.cash) : undefined,
        cashEquivalents: value.cashEquivalents ? Number(value.cashEquivalents) : undefined,
        cashAndCashEquivalents: value.cashAndCashEquivalents ? Number(value.cashAndCashEquivalents) : undefined,
        otherShortTermInvestments: value.otherShortTermInvestments ? Number(value.otherShortTermInvestments) : undefined,
        accountsReceivable: value.accountsReceivable ? Number(value.accountsReceivable) : undefined,
        otherReceivables: value.otherReceivables ? Number(value.otherReceivables) : undefined,
        inventory: value.inventory ? Number(value.inventory) : undefined,
        prepaidAssets: value.prepaidAssets ? Number(value.prepaidAssets) : undefined,
        restrictedCash: value.restrictedCash ? Number(value.restrictedCash) : undefined,
        assetsHeldForSale: value.assetsHeldForSale ? Number(value.assetsHeldForSale) : undefined,
        hedgingAssets: value.hedgingAssets ? Number(value.hedgingAssets) : undefined,
        otherCurrentAssets: value.otherCurrentAssets ? Number(value.otherCurrentAssets) : undefined,
        totalCurrentAssets: value.totalCurrentAssets ? Number(value.totalCurrentAssets) : undefined,
        properties: value.properties ? Number(value.properties) : undefined,
        landAndImprovements: value.landAndImprovements ? Number(value.landAndImprovements) : undefined,
        machineryFurnitureEquipment: value.machineryFurnitureEquipment ? Number(value.machineryFurnitureEquipment) : undefined,
        constructionInProgress: value.constructionInProgress ? Number(value.constructionInProgress) : undefined,
        leases: value.leases ? Number(value.leases) : undefined,
        accumulatedDepreciation: value.accumulatedDepreciation ? Number(value.accumulatedDepreciation) : undefined,
        goodwill: value.goodwill ? Number(value.goodwill) : undefined,
        investmentProperties: value.investmentProperties ? Number(value.investmentProperties) : undefined,
        financialAssets: value.financialAssets ? Number(value.financialAssets) : undefined,
        intangibleAssets: value.intangibleAssets ? Number(value.intangibleAssets) : undefined,
        investmentsAndAdvances: value.investmentsAndAdvances ? Number(value.investmentsAndAdvances) : undefined,
        otherNonCurrentAssets: value.otherNonCurrentAssets ? Number(value.otherNonCurrentAssets) : undefined,
        totalNonCurrentAssets: value.totalNonCurrentAssets ? Number(value.totalNonCurrentAssets) : undefined,
        totalAssets: value.totalAssets ? Number(value.totalAssets) : undefined,
        accountsPayable: value.accountsPayable ? Number(value.accountsPayable) : undefined,
        accruedExpenses: value.accruedExpenses ? Number(value.accruedExpenses) : undefined,
        shortTermDebt: value.shortTermDebt ? Number(value.shortTermDebt) : undefined,
        deferredRevenue: value.deferredRevenue ? Number(value.deferredRevenue) : undefined,
        taxPayable: value.taxPayable ? Number(value.taxPayable) : undefined,
        pensions: value.pensions ? Number(value.pensions) : undefined,
        otherCurrentLiabilities: value.otherCurrentLiabilities ? Number(value.otherCurrentLiabilities) : undefined,
        totalCurrentLiabilities: value.totalCurrentLiabilities ? Number(value.totalCurrentLiabilities) : undefined,
        longTermProvisions: value.longTermProvisions ? Number(value.longTermProvisions) : undefined,
        longTermDebt: value.longTermDebt ? Number(value.longTermDebt) : undefined,
        provisionForRisksAndCharges: value.provisionForRisksAndCharges ? Number(value.provisionForRisksAndCharges) : undefined,
        deferredLiabilities: value.deferredLiabilities ? Number(value.deferredLiabilities) : undefined,
        derivativeProductLiabilities: value.derivativeProductLiabilities ? Number(value.derivativeProductLiabilities) : undefined,
        otherNonCurrentLiabilities: value.otherNonCurrentLiabilities ? Number(value.otherNonCurrentLiabilities) : undefined,
        totalNonCurrentLiabilities: value.totalNonCurrentLiabilities ? Number(value.totalNonCurrentLiabilities) : undefined,
        totalLiabilities: value.totalLiabilities ? Number(value.totalLiabilities) : undefined,
        commonStock: value.commonStock ? Number(value.commonStock) : undefined,
        retainedEarnings: value.retainedEarnings ? Number(value.retainedEarnings) : undefined,
        otherStakeholdersEquity: value.otherStakeholdersEquity ? Number(value.otherStakeholdersEquity) : undefined,
        additionalPaidInCapital: value.additionalPaidInCapital ? Number(value.additionalPaidInCapital) : undefined,
        treasuryStock: value.treasuryStock ? Number(value.treasuryStock) : undefined,
        minorityInterest: value.minorityInterest ? Number(value.minorityInterest) : undefined,
        totalStakeholdersEquity: value.totalStakeholdersEquity ? Number(value.totalStakeholdersEquity) : undefined,
      };
      
      const schema = isEditMode ? UpdateBalanceSheetSchema : CreateBalanceSheetSchema;
      const result = schema.parse(transformedValue);
      
      const success = isEditMode 
        ? await editBalanceSheet(id!, result)
        : await addBalanceSheet(result);
        
      if (success) {
        router.push(isEditMode ? `/dashboard/balance-sheets/${id}` : '/dashboard/balance-sheets');
      }
    },
  });
  
  useEffect(() => {
    fetchCompanies();
    if (isEditMode && id && !initialData) {
      fetchBalanceSheet(id);
    }
  }, [isEditMode, id, initialData, fetchBalanceSheet, fetchCompanies]);
  
  useEffect(() => {
    if (selectedBalanceSheet && isEditMode) {
      form.reset({
        companyId: selectedBalanceSheet.companyId || undefined,
        year: selectedBalanceSheet.year?.toString() || currentYear.toString(),
        semester: selectedBalanceSheet.semester || '',
        quarter: selectedBalanceSheet.quarter || '',
        month: selectedBalanceSheet.month || '',
        date: selectedBalanceSheet.date || '',
        scenario: selectedBalanceSheet.scenario || 'Actual',
        cash: selectedBalanceSheet.cash?.toString() || '',
        cashEquivalents: selectedBalanceSheet.cashEquivalents?.toString() || '',
        cashAndCashEquivalents: selectedBalanceSheet.cashAndCashEquivalents?.toString() || '',
        otherShortTermInvestments: selectedBalanceSheet.otherShortTermInvestments?.toString() || '',
        accountsReceivable: selectedBalanceSheet.accountsReceivable?.toString() || '',
        otherReceivables: selectedBalanceSheet.otherReceivables?.toString() || '',
        inventory: selectedBalanceSheet.inventory?.toString() || '',
        prepaidAssets: selectedBalanceSheet.prepaidAssets?.toString() || '',
        restrictedCash: selectedBalanceSheet.restrictedCash?.toString() || '',
        assetsHeldForSale: selectedBalanceSheet.assetsHeldForSale?.toString() || '',
        hedgingAssets: selectedBalanceSheet.hedgingAssets?.toString() || '',
        otherCurrentAssets: selectedBalanceSheet.otherCurrentAssets?.toString() || '',
        totalCurrentAssets: selectedBalanceSheet.totalCurrentAssets?.toString() || '',
        properties: selectedBalanceSheet.properties?.toString() || '',
        landAndImprovements: selectedBalanceSheet.landAndImprovements?.toString() || '',
        machineryFurnitureEquipment: selectedBalanceSheet.machineryFurnitureEquipment?.toString() || '',
        constructionInProgress: selectedBalanceSheet.constructionInProgress?.toString() || '',
        leases: selectedBalanceSheet.leases?.toString() || '',
        accumulatedDepreciation: selectedBalanceSheet.accumulatedDepreciation?.toString() || '',
        goodwill: selectedBalanceSheet.goodwill?.toString() || '',
        investmentProperties: selectedBalanceSheet.investmentProperties?.toString() || '',
        financialAssets: selectedBalanceSheet.financialAssets?.toString() || '',
        intangibleAssets: selectedBalanceSheet.intangibleAssets?.toString() || '',
        investmentsAndAdvances: selectedBalanceSheet.investmentsAndAdvances?.toString() || '',
        otherNonCurrentAssets: selectedBalanceSheet.otherNonCurrentAssets?.toString() || '',
        totalNonCurrentAssets: selectedBalanceSheet.totalNonCurrentAssets?.toString() || '',
        totalAssets: selectedBalanceSheet.totalAssets?.toString() || '',
        accountsPayable: selectedBalanceSheet.accountsPayable?.toString() || '',
        accruedExpenses: selectedBalanceSheet.accruedExpenses?.toString() || '',
        shortTermDebt: selectedBalanceSheet.shortTermDebt?.toString() || '',
        deferredRevenue: selectedBalanceSheet.deferredRevenue?.toString() || '',
        taxPayable: selectedBalanceSheet.taxPayable?.toString() || '',
        pensions: selectedBalanceSheet.pensions?.toString() || '',
        otherCurrentLiabilities: selectedBalanceSheet.otherCurrentLiabilities?.toString() || '',
        totalCurrentLiabilities: selectedBalanceSheet.totalCurrentLiabilities?.toString() || '',
        longTermProvisions: selectedBalanceSheet.longTermProvisions?.toString() || '',
        longTermDebt: selectedBalanceSheet.longTermDebt?.toString() || '',
        provisionForRisksAndCharges: selectedBalanceSheet.provisionForRisksAndCharges?.toString() || '',
        deferredLiabilities: selectedBalanceSheet.deferredLiabilities?.toString() || '',
        derivativeProductLiabilities: selectedBalanceSheet.derivativeProductLiabilities?.toString() || '',
        otherNonCurrentLiabilities: selectedBalanceSheet.otherNonCurrentLiabilities?.toString() || '',
        totalNonCurrentLiabilities: selectedBalanceSheet.totalNonCurrentLiabilities?.toString() || '',
        totalLiabilities: selectedBalanceSheet.totalLiabilities?.toString() || '',
        commonStock: selectedBalanceSheet.commonStock?.toString() || '',
        retainedEarnings: selectedBalanceSheet.retainedEarnings?.toString() || '',
        otherStakeholdersEquity: selectedBalanceSheet.otherStakeholdersEquity?.toString() || '',
        additionalPaidInCapital: selectedBalanceSheet.additionalPaidInCapital?.toString() || '',
        treasuryStock: selectedBalanceSheet.treasuryStock?.toString() || '',
        minorityInterest: selectedBalanceSheet.minorityInterest?.toString() || '',
        totalStakeholdersEquity: selectedBalanceSheet.totalStakeholdersEquity?.toString() || '',
      });
    }
  }, [selectedBalanceSheet, isEditMode, form, currentYear]);

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit' : 'Create'} Balance Sheet</CardTitle>
          <CardDescription>Loading balance sheet information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit' : 'Create'} Balance Sheet</CardTitle>
          <CardDescription>Error loading form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </>
    );
  }

  return (
    <Card className="max-w-5xl mx-auto max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Balance Sheet' : 'Create Balance Sheet'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update balance sheet details' : 'Add a new balance sheet'}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}>
        <CardContent className="space-y-4 p-3 md:p-4">
          
          {/* Basic Information */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field
                    name="companyId"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value || value === 0) return 'Company is required';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Company</Label>
                        <Select
                          value={field.state.value?.toString() || ''}
                          onValueChange={(value) => field.handleChange(parseInt(value, 10))}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id!.toString()}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field
                    name="year"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return 'Year is required';
                        const numValue = Number(value);
                        if (isNaN(numValue)) return 'Year must be a number';
                        const currentYear = new Date().getFullYear();
                        if (numValue < 1900 || numValue > currentYear + 10) return 'Invalid year';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Year</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="1"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter year"
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="scenario">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Scenario</Label>
                        <Select
                          value={field.state.value || 'Actual'}
                          onValueChange={(value) => field.handleChange(value as FinancialScenario)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select scenario" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Actual">Actual</SelectItem>
                            <SelectItem value="Forecast">Forecast</SelectItem>
                            <SelectItem value="Budget">Budget</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="date">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Date (Optional)</Label>
                        <Input
                          id={field.name}
                          type="date"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="space-y-2">
                  <form.Field name="semester">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Semester (Optional)</Label>
                        <Select 
                          value={field.state.value || 'none'} 
                          onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="H1">H1 (First Half)</SelectItem>
                            <SelectItem value="H2">H2 (Second Half)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="quarter">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Quarter (Optional)</Label>
                        <Select 
                          value={field.state.value || 'none'} 
                          onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select quarter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="Q1">Q1 (First Quarter)</SelectItem>
                            <SelectItem value="Q2">Q2 (Second Quarter)</SelectItem>
                            <SelectItem value="Q3">Q3 (Third Quarter)</SelectItem>
                            <SelectItem value="Q4">Q4 (Fourth Quarter)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="month">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Month (Optional)</Label>
                        <Select 
                          value={field.state.value || 'none'} 
                          onValueChange={(value) => field.handleChange(value === 'none' ? null : value)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="January">January</SelectItem>
                            <SelectItem value="February">February</SelectItem>
                            <SelectItem value="March">March</SelectItem>
                            <SelectItem value="April">April</SelectItem>
                            <SelectItem value="May">May</SelectItem>
                            <SelectItem value="June">June</SelectItem>
                            <SelectItem value="July">July</SelectItem>
                            <SelectItem value="August">August</SelectItem>
                            <SelectItem value="September">September</SelectItem>
                            <SelectItem value="October">October</SelectItem>
                            <SelectItem value="November">November</SelectItem>
                            <SelectItem value="December">December</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Current Assets */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Current Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="cash">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Cash</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="cashEquivalents">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Cash Equivalents</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="cashAndCashEquivalents">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Cash and Cash Equivalents</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="otherShortTermInvestments">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Other Short-Term Investments</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="accountsReceivable">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Accounts Receivable</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="prepaidAssets">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Prepaid Assets</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

              </div>
              
              <div>
                <div className="space-y-2">
                  <form.Field name="totalCurrentAssets">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Total Current Assets</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Non-Current Assets */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Non-Current Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="properties">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Properties</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="investmentsAndAdvances">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Investments and Advances</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

              </div>
              
              <div>
                <div className="space-y-2">
                  <form.Field name="totalNonCurrentAssets">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Total Non-Current Assets</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Liabilities */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Current Liabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="accountsPayable">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Accounts Payable</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="deferredLiabilities">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Deferred Liabilities</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

              </div>
              
              <div>
                <div className="space-y-2">
                  <form.Field name="totalCurrentLiabilities">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Total Current Liabilities</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shareholders' Equity Section */}
          <Card className="shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Shareholders&apos; Equity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                <div className="space-y-2">
                  <form.Field name="commonStock">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Common Stock</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="retainedEarnings">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Retained Earnings</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="treasuryStock">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Treasury Stock</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="additionalPaidInCapital">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Additional Paid-In Capital</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="minorityInterest">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Minority Interest</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

              </div>
              
              <div>
                <div className="space-y-2">
                  <form.Field name="totalStakeholdersEquity">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Total Shareholders&apos; Equity</Label>
                        <Input
                          id={field.name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>

        </CardContent>
        
        {/* Submit Button */}
        <CardFooter className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditMode ? 'Update' : 'Create'} Balance Sheet
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}