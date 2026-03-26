'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useInvestmentPortfolio } from '@/modules/assetmanager/hooks/use-portfolio-investment';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
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
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
import { Save } from 'lucide-react';
import {
  CreateInvestmentPortfolioSchema,
  UpdateInvestmentPortfolioSchema,
  type InvestmentPortfolio,
  type CreateInvestmentPortfolioInput,
  type UpdateInvestmentPortfolioInput,
  portfolioStatusEnum,
  investmentTypeEnum,
  sectorTypeEnum,
  companyTypeEnum
} from '@/modules/assetmanager/schemas/portfolio-investment.schemas';

interface InvestmentPortfolioFormProps {
  id?: number;
  initialData?: InvestmentPortfolio;
}

// Helper function to render form field errors
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

export default function InvestmentPortfolioForm({ id, initialData }: InvestmentPortfolioFormProps) {
  const router = useRouter();
  const { 
    selectedPortfolio,
    addPortfolio, 
    editPortfolio, 
    fetchPortfolio,
    setSelectedPortfolio,
    isLoading: portfolioLoading, 
    error: portfolioError, 
    clearError: clearPortfolioError 
  } = useInvestmentPortfolio();

  const { companies, fetchCompanies } = useCompanies();
  const { funds, fetchFunds } = useFunds();
  const { rounds, fetchRounds } = useRounds();
  
  const isEditMode = !!id;
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      companyId: isEditMode ? (initialData || selectedPortfolio)?.companyId || undefined : undefined,
      fundId: isEditMode ? (initialData || selectedPortfolio)?.fundId || undefined : undefined,
      roundId: isEditMode ? (initialData || selectedPortfolio)?.roundId || undefined : undefined,
      portfolioStatus: isEditMode ? (initialData || selectedPortfolio)?.portfolioStatus || 'Active' : 'Active',
      investmentType: isEditMode ? (initialData || selectedPortfolio)?.investmentType || 'Equity' : 'Equity',
      sector: isEditMode ? (initialData || selectedPortfolio)?.sector || 'Technology' : 'Technology',
      investmentAmount: isEditMode ? (initialData || selectedPortfolio)?.investmentAmount || undefined : undefined,
      ownershipPercentage: isEditMode ? (initialData || selectedPortfolio)?.ownershipPercentage || undefined : undefined,
      currentFairValue: isEditMode ? (initialData || selectedPortfolio)?.currentFairValue || undefined : undefined,
      companyType: isEditMode ? (initialData || selectedPortfolio)?.companyType || 'Private' : 'Private',
      numberOfShares: isEditMode ? (initialData || selectedPortfolio)?.numberOfShares || undefined : undefined,
      sharePrice: isEditMode ? (initialData || selectedPortfolio)?.sharePrice || undefined : undefined,
      irr: isEditMode ? (initialData || selectedPortfolio)?.irr || undefined : undefined,
      notes: isEditMode ? (initialData || selectedPortfolio)?.notes || '' : '',
    },
    
    // Form-level validation using schema
    validators: {
      onChange: ({ value }) => {
        const schema = isEditMode ? UpdateInvestmentPortfolioSchema : CreateInvestmentPortfolioSchema;
        const result = schema.safeParse(value);
        
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
        ...value,
        investmentAmount: value.investmentAmount || null,
        ownershipPercentage: value.ownershipPercentage || null,
        currentFairValue: value.currentFairValue || null,
        numberOfShares: value.numberOfShares || null,
        sharePrice: value.sharePrice || null,
        irr: value.irr || null,
      };
      
      const schema = isEditMode ? UpdateInvestmentPortfolioSchema : CreateInvestmentPortfolioSchema;
      const result = schema.parse(transformedValue);

      if (isEditMode && id) {
        const success = await editPortfolio(id, result as UpdateInvestmentPortfolioInput);
        if (success) {
          router.push(`/dashboard/portfolio/investments/${id}`);
        }
      } else {
        const success = await addPortfolio(result as CreateInvestmentPortfolioInput);
        if (success) {
          router.push('/dashboard/portfolio/investments');
        }
      }
    },
  });
  
  useEffect(() => {
    // Fetch related data
    fetchCompanies();
    fetchFunds();
    fetchRounds();
    
    if (isEditMode && id && !initialData) {
      fetchPortfolio(id);
    } else if (!isEditMode) {
      // Clear selected portfolio when creating a new investment
      setSelectedPortfolio(null);
    }
  }, [isEditMode, id, initialData, fetchPortfolio, fetchCompanies, fetchFunds, fetchRounds, setSelectedPortfolio]);
  
  // Reset form values when selectedPortfolio changes
  useEffect(() => {
    if (selectedPortfolio && isEditMode) {
      form.reset({
        companyId: selectedPortfolio.companyId,
        fundId: selectedPortfolio.fundId,
        roundId: selectedPortfolio.roundId,
        portfolioStatus: selectedPortfolio.portfolioStatus,
        investmentType: selectedPortfolio.investmentType,
        sector: selectedPortfolio.sector,
        investmentAmount: selectedPortfolio.investmentAmount || undefined,
        ownershipPercentage: selectedPortfolio.ownershipPercentage || undefined,
        currentFairValue: selectedPortfolio.currentFairValue || undefined,
        companyType: selectedPortfolio.companyType || 'Private',
        numberOfShares: selectedPortfolio.numberOfShares || undefined,
        sharePrice: selectedPortfolio.sharePrice || undefined,
        irr: selectedPortfolio.irr || undefined,
        notes: selectedPortfolio.notes || '',
      });
    }
  }, [selectedPortfolio, isEditMode, form]);


  if (portfolioLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Investment' : 'Add Investment'}</CardTitle>
          <CardDescription>Loading investment information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </>
    );
  }
  
  if (portfolioError) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Investment' : 'Add Investment'}</CardTitle>
          <CardDescription>Error loading investment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {portfolioError}
          </div>
          <Button onClick={clearPortfolioError} className="mt-4">Try Again</Button>
        </CardContent>
      </>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Investment' : 'Add Investment'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update investment details' : 'Add a new portfolio investment'}
        </CardDescription>
      </CardHeader>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <CardContent className="space-y-6">
          <div className="space-y-6">
            {/* Investment Details Section */}
            <Card className="shadow-none border-muted bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Investment Details</CardTitle>
                <CardDescription>Company, fund, round and investment type information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Company Selection */}
                <div className="space-y-2">
                  <form.Field name="companyId">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Company *</Label>
                        <Select
                          value={field.state.value?.toString() || ''}
                          onValueChange={(value) => field.handleChange(parseInt(value, 10))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a company" />
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

                {/* Fund Selection */}
                <div className="space-y-2">
                  <form.Field name="fundId">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Fund *</Label>
                        <Select
                          value={field.state.value?.toString() || ''}
                          onValueChange={(value) => field.handleChange(parseInt(value, 10))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a fund" />
                          </SelectTrigger>
                          <SelectContent>
                            {funds.map((fund) => (
                              <SelectItem key={fund.id} value={fund.id!.toString()}>
                                {fund.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Round Selection */}
                <div className="space-y-2">
                  <form.Field name="roundId">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Round *</Label>
                        <Select
                          value={field.state.value?.toString() || ''}
                          onValueChange={(value) => field.handleChange(parseInt(value, 10))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a round" />
                          </SelectTrigger>
                          <SelectContent>
                            {rounds.map((round) => (
                              <SelectItem key={round.id} value={round.id!.toString()}>
                                {round.roundName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </CardContent>
            </Card>

            {/* Investment Type & Status */}
            <Card className="shadow-none border-muted bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Investment Classification</CardTitle>
                <CardDescription>Portfolio status, investment type and sector information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Portfolio Status */}
                <div className="space-y-2">
                  <form.Field name="portfolioStatus">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Portfolio Status</Label>
                        <Select
                          value={field.state.value || ''}
                          onValueChange={(value) => field.handleChange(value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {portfolioStatusEnum.options.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Investment Type */}
                <div className="space-y-2">
                  <form.Field name="investmentType">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Investment Type</Label>
                        <Select
                          value={field.state.value || ''}
                          onValueChange={(value) => field.handleChange(value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select investment type" />
                          </SelectTrigger>
                          <SelectContent>
                            {investmentTypeEnum.options.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Sector */}
                <div className="space-y-2">
                  <form.Field name="sector">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Sector</Label>
                        <Select
                          value={field.state.value || ''}
                          onValueChange={(value) => field.handleChange(value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select sector" />
                          </SelectTrigger>
                          <SelectContent>
                            {sectorTypeEnum.options.map((sector) => (
                              <SelectItem key={sector} value={sector}>
                                {sector}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information Section */}
            <Card className="shadow-none border-muted bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Financial Information</CardTitle>
                <CardDescription>Investment amounts, valuation and performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Investment Amount */}
                <div className="space-y-2">
                  <form.Field name="investmentAmount">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Investment Amount</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.state.value?.toString() || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Enter investment amount..."
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Ownership Percentage */}
                <div className="space-y-2">
                  <form.Field name="ownershipPercentage">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Ownership Percentage (%)</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={field.state.value?.toString() || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Enter ownership percentage..."
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Company Type */}
                <div className="space-y-2">
                  <form.Field name="companyType">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Company Type</Label>
                        <Select
                          value={field.state.value || ''}
                          onValueChange={(value) => field.handleChange(value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select company type" />
                          </SelectTrigger>
                          <SelectContent>
                            {companyTypeEnum.options.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Number of Shares */}
                <div className="space-y-2">
                  <form.Field name="numberOfShares">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Number of Shares</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.state.value?.toString() || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Enter number of shares..."
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Share Price */}
                <div className="space-y-2">
                  <form.Field name="sharePrice">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Share Price</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.state.value?.toString() || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Enter share price..."
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Current Fair Value */}
                <div className="space-y-2">
                  <form.Field name="currentFairValue">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Current Fair Value</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.state.value?.toString() || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Enter current fair value..."
                        />
                        <FieldInfo field={field} />
                        <p className="text-xs text-muted-foreground">
                          MOIC (Multiple on Invested Capital) will be calculated automatically based on current fair value and investment amount.
                        </p>
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* IRR */}
                <div className="space-y-2">
                  <form.Field name="irr">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Internal Rate of Return (IRR) %</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="number"
                          step="0.01"
                          value={field.state.value?.toString() || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Enter IRR percentage..."
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card className="shadow-none border-muted bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
                <CardDescription>Optional notes and comments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <form.Field name="notes">
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Notes</Label>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter any additional notes..."
                          rows={4}
                          maxLength={1000}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </CardContent>
            </Card>
            
          </div>
        </CardContent>
        
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
                    {isEditMode ? 'Update Investment' : 'Create Investment'}
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
