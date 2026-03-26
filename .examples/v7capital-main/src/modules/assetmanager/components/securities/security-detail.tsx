'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSecurities } from '../../hooks/use-securities';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/modules/shadcnui/components/ui/alert-dialog';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { 
  type SecurityType,
  isStockSecurity, 
  isConvertibleSecurity, 
  isOptionSecurity, 
  isWarrantSecurity, 
  isBondSecurity 
} from '../../schemas/securities.schemas';

interface SecurityDetailProps {
  id: number;
}

// Helper component for dynamic field rendering
interface FieldProps {
  label: string;
  value: any;
  condition?: boolean;
  formatter?: (value: any) => React.ReactNode;
}

function DynamicField({ label, value, condition = true, formatter }: FieldProps) {
  if (!condition || value === null || value === undefined || value === '') {
    return null;
  }

  const displayValue = formatter ? formatter(value) : value;

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      <p className="text-base">{displayValue}</p>
    </div>
  );
}

function BooleanField({ label, value, condition = true }: Omit<FieldProps, 'formatter'>) {
  if (!condition || value === null || value === undefined) {
    return null;
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      <p className="text-base">{value ? 'Yes' : 'No'}</p>
    </div>
  );
}

function DateField({ label, value, condition = true }: Omit<FieldProps, 'formatter'>) {
  if (!condition || !value) {
    return null;
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      <p className="text-base">{formatDate(value)}</p>
    </div>
  );
}

export default function SecurityDetail({ id }: SecurityDetailProps) {
  const router = useRouter();
  const { 
    selectedSecurity, 
    isLoading, 
    error, 
    fetchSecurity, 
    removeSecurity,
    clearError 
  } = useSecurities();
  
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  
  useEffect(() => {
    fetchSecurity(id);
  }, [id, fetchSecurity]);
  
  const handleDelete = async () => {
    if (selectedSecurity?.id) {
      const success = await removeSecurity(selectedSecurity.id);
      if (success) {
        router.push('/dashboard/securities');
      }
    }
  };
  
  const handleEdit = () => {
    router.push(`/dashboard/securities/${id}/edit`);
  };
  
  // Helper functions to check if sections have actual data
  const hasStockDetails = (security: any) => {
    return !!(
      security.isPreferred ||
      security.hasVotingRights ||
      security.votingRatio ||
      security.hasDividendRights ||
      security.dividendRate ||
      security.isDividendCumulative ||
      security.liquidationPreference ||
      security.hasParticipation ||
      security.participationCap ||
      security.seniority ||
      security.antiDilution ||
      security.hasConversionRights ||
      security.conversionRatio ||
      security.hasRedemptionRights ||
      security.redemptionTerm
    );
  };

  const hasConvertibleDetails = (security: any) => {
    return !!(
      security.interestRate ||
      security.interestRateType ||
      security.interestPeriod ||
      security.maturityDate ||
      security.valuationCap ||
      security.conversionDiscount ||
      security.conversionBasis
    );
  };

  const hasOptionDetails = (security: any) => {
    return !!(
      security.optionType ||
      security.vestingStart ||
      security.vestingMonths ||
      security.cliffMonths ||
      security.vestingScheduleType ||
      security.poolName ||
      security.poolSize ||
      security.poolAvailable ||
      security.exerciseWindowDays ||
      security.strikePrice ||
      security.expirationDate ||
      security.terminationDate ||
      security.isActive ||
      security.totalShares
    );
  };

  const hasWarrantDetails = (security: any) => {
    return !!(
      security.warrantType ||
      security.dealContext ||
      security.isDetachable ||
      security.isTransferable ||
      security.exerciseWindowDays ||
      security.strikePrice ||
      security.expirationDate ||
      security.totalShares ||
      security.issueRights ||
      security.convertTo
    );
  };

  const hasBondDetails = (security: any) => {
    return !!(
      security.principal ||
      security.couponRate ||
      security.couponFrequency ||
      security.maturityDate ||
      security.principalFrequency ||
      security.tenureMonths ||
      security.moratoriumPeriod
    );
  };
  
  const getSecurityTypeBadge = (type: SecurityType) => {
    const colorMap: Record<SecurityType, string> = {
      'Common Shares': 'bg-blue-500',
      'Preferred Shares': 'bg-purple-500',
      'Convertible': 'bg-green-500',
      'Warrant': 'bg-yellow-500',
      'Option': 'bg-orange-500',
      'Bond': 'bg-red-500',
    };
    
    return (
      <Badge className={`${colorMap[type] || 'bg-gray-500'}`}>
        {type}
      </Badge>
    );
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Details</CardTitle>
          <CardDescription>Loading security information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Details</CardTitle>
          <CardDescription>Error loading security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }
  
  if (!selectedSecurity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Details</CardTitle>
          <CardDescription>Security not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The requested security could not be found.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-xl sm:text-2xl">
            {selectedSecurity.securityName}
          </CardTitle>
          <CardDescription>
            {selectedSecurity.code} • {selectedSecurity.currency || 'USD'}
          </CardDescription>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleEdit} className="justify-start sm:justify-center">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="justify-start sm:justify-center">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Security</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the security &quot;{selectedSecurity.securityName}&quot;? 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Key Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Security Information</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Security Code</h4>
                <p className="text-base">{selectedSecurity.code}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Security Type</h4>
                <div className="flex items-center gap-2 mt-1">
                  {getSecurityTypeBadge(selectedSecurity.securityType)}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Round ID</h4>
                <p className="text-base">{selectedSecurity.roundId}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Currency</h4>
                <p className="text-base">{selectedSecurity.currency || 'USD'}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Details</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Issue Price</h4>
                <p className="text-base">
                  {selectedSecurity.issuePrice ? `$${selectedSecurity.issuePrice.toLocaleString()}` : 'N/A'}
                </p>
              </div>
              
              {selectedSecurity.specialTerms && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Special Terms</h4>
                  <p className="text-base">{selectedSecurity.specialTerms}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Lockup Period</h4>
                <p className="text-base">
                  {selectedSecurity.lockupMonths
                    ? `${selectedSecurity.lockupMonths} months`
                    : 'No lockup'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Type-Specific Details */}
        {isStockSecurity(selectedSecurity) && hasStockDetails(selectedSecurity) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Stock Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <BooleanField label="Preferred Stock" value={selectedSecurity.isPreferred} />
              <BooleanField label="Has Voting Rights" value={selectedSecurity.hasVotingRights} />
              <DynamicField label="Voting Ratio" value={selectedSecurity.votingRatio} />
              <BooleanField label="Has Dividend Rights" value={selectedSecurity.hasDividendRights} />
              <DynamicField 
                label="Dividend Rate" 
                value={selectedSecurity.dividendRate}
                formatter={(val) => val ? `${val}%` : 'N/A'}
              />
              <DynamicField 
                label="Liquidation Preference" 
                value={selectedSecurity.liquidationPreference}
                formatter={(val) => val ? `${val}x` : 'N/A'}
              />
              <BooleanField label="Has Participation Rights" value={selectedSecurity.hasParticipation} />
              <DynamicField 
                label="Participation Cap" 
                value={selectedSecurity.participationCap}
                formatter={(val) => val ? `${val}x` : 'N/A'}
              />
              <DynamicField label="Anti-Dilution Protection" value={selectedSecurity.antiDilution} />
              <BooleanField label="Has Conversion Rights" value={selectedSecurity.hasConversionRights} />
              <DynamicField label="Conversion Ratio" value={selectedSecurity.conversionRatio} />
            </div>
          </div>
        )}

        {/* Convertible Details */}
        {isConvertibleSecurity(selectedSecurity) && hasConvertibleDetails(selectedSecurity) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Convertible Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DynamicField 
                label="Interest Rate" 
                value={selectedSecurity.interestRate}
                formatter={(val) => val ? `${val}%` : 'N/A'}
              />
              <DynamicField label="Interest Rate Type" value={selectedSecurity.interestRateType} />
              <DateField label="Maturity Date" value={selectedSecurity.maturityDate} />
              <DynamicField 
                label="Valuation Cap" 
                value={selectedSecurity.valuationCap}
                formatter={(val) => val ? `$${val.toLocaleString()}` : 'N/A'}
              />
              <DynamicField 
                label="Conversion Discount" 
                value={selectedSecurity.conversionDiscount}
                formatter={(val) => val ? `${val}%` : 'N/A'}
              />
              <DynamicField label="Conversion Basis" value={selectedSecurity.conversionBasis} />
            </div>
          </div>
        )}

        {/* Option Details */}
        {isOptionSecurity(selectedSecurity) && hasOptionDetails(selectedSecurity) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Option Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DynamicField label="Option Type" value={selectedSecurity.optionType} />
              <DateField label="Vesting Start" value={selectedSecurity.vestingStart} />
              <DynamicField 
                label="Vesting Period" 
                value={selectedSecurity.vestingMonths}
                formatter={(val) => val ? `${val} months` : 'N/A'}
              />
              <DynamicField 
                label="Strike Price" 
                value={selectedSecurity.strikePrice}
                formatter={(val) => val ? `$${val.toLocaleString()}` : 'N/A'}
              />
              <DateField label="Expiration Date" value={selectedSecurity.expirationDate} />
              <DynamicField 
                label="Total Shares" 
                value={selectedSecurity.totalShares}
                formatter={(val) => val ? val.toLocaleString() : 'N/A'}
              />
            </div>
          </div>
        )}

        {/* Warrant Details */}
        {isWarrantSecurity(selectedSecurity) && hasWarrantDetails(selectedSecurity) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Warrant Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DynamicField label="Warrant Type" value={selectedSecurity.warrantType} />
              <DynamicField label="Deal Context" value={selectedSecurity.dealContext} />
              <DynamicField 
                label="Strike Price" 
                value={selectedSecurity.strikePrice}
                formatter={(val) => val ? `$${val.toLocaleString()}` : 'N/A'}
              />
              <DateField label="Expiration Date" value={selectedSecurity.expirationDate} />
              <DynamicField 
                label="Total Shares" 
                value={selectedSecurity.totalShares}
                formatter={(val) => val ? val.toLocaleString() : 'N/A'}
              />
            </div>
          </div>
        )}

        {/* Bond Details */}
        {isBondSecurity(selectedSecurity) && hasBondDetails(selectedSecurity) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Bond Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DynamicField 
                label="Principal Amount" 
                value={selectedSecurity.principal}
                formatter={(val) => val ? `$${val.toLocaleString()}` : 'N/A'}
              />
              <DynamicField 
                label="Coupon Rate" 
                value={selectedSecurity.couponRate}
                formatter={(val) => val ? `${val}%` : 'N/A'}
              />
              <DateField label="Maturity Date" value={selectedSecurity.maturityDate} />
              <DynamicField 
                label="Tenure" 
                value={selectedSecurity.tenureMonths}
                formatter={(val) => val ? `${val} months` : 'N/A'}
              />
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {selectedSecurity.createdAt ? new Date(selectedSecurity.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {selectedSecurity.updatedAt ? new Date(selectedSecurity.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

