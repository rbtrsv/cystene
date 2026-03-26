'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKpis } from '@/modules/assetmanager/hooks/use-kpis';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/modules/shadcnui/components/ui/alert-dialog';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { type FinancialScenario } from '@/modules/assetmanager/schemas/kpis.schemas';

// Helper component for dynamic field rendering
interface FieldProps {
  label: string;
  value: any;
  condition?: boolean;
  formatter?: (value: any) => React.ReactNode;
}

function DynamicField({ label, value, condition = true, formatter }: FieldProps) {
  // Don't render if condition is false or if value is null/undefined/empty
  if (!condition || value === null || value === undefined || value === '') {
    return null;
  }

  const displayValue = formatter ? formatter(value) : value;

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="text-base">{displayValue}</div>
    </div>
  );
}

// Helper for boolean fields
function BooleanField({ label, value, condition = true }: Omit<FieldProps, 'formatter'>) {
  if (!condition || value === null || value === undefined) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="text-base">{value ? 'Yes' : 'No'}</div>
    </div>
  );
}

// Helper for date fields
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
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <div className="text-base">{formatDate(value)}</div>
    </div>
  );
}

interface KpisValuesDetailProps {
  id: number;
}

export default function KpisValuesDetail({ id }: KpisValuesDetailProps) {
  const router = useRouter();
  const { getCompanyName } = useCompanies();
  const {
    selectedKpiValue,
    isLoading,
    error,
    fetchKpiValue,
    removeKpiValue,
    clearError,
    getKpiTypeLabel
  } = useKpis();

  useEffect(() => {
    if (id) {
      fetchKpiValue(id);
    }
  }, [id, fetchKpiValue]);

  const handleEdit = () => {
    router.push(`/dashboard/kpis-values/${id}/edit`);
  };

  const handleDelete = async () => {
    const success = await removeKpiValue(id);
    if (success) {
      router.push('/dashboard/kpis-values');
    }
  };

  const handleBack = () => {
    router.push('/dashboard/kpis-values');
  };

  const formatValue = (value: number | null, dataType: string = 'DECIMAL') => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (dataType) {
      case 'INTEGER':
        return Math.round(value).toLocaleString();
      case 'DECIMAL':
        return value.toLocaleString(undefined, { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 2 
        });
      case 'STRING':
        return String(value);
      default:
        return value.toString();
    }
  };

  const getScenarioBadge = (scenario: FinancialScenario) => {
    const colorMap: Record<FinancialScenario, string> = {
      'Actual': 'bg-green-500',
      'Forecast': 'bg-blue-500',
      'Budget': 'bg-orange-500',
    };
    
    return (
      <Badge className={`${colorMap[scenario] || 'bg-gray-500'} text-white`}>
        {scenario}
      </Badge>
    );
  };

  const getDataTypeBadge = (dataType: string) => {
    const colorMap: Record<string, string> = {
      'DECIMAL': 'bg-blue-500',
      'INTEGER': 'bg-green-500',
      'STRING': 'bg-purple-500',
    };
    return (
      <Badge className={`${colorMap[dataType] || 'bg-gray-500'} text-white`}>
        {dataType}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KPI Value</CardTitle>
          <CardDescription>Loading KPI value details...</CardDescription>
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
          <CardTitle>KPI Value</CardTitle>
          <CardDescription>Error loading KPI value</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!selectedKpiValue) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KPI Value</CardTitle>
          <CardDescription>Not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No KPI value found for this ID.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-xl sm:text-2xl">{selectedKpiValue.kpi?.name}</CardTitle>
          <CardDescription>
            KPI Value • {new Date(selectedKpiValue.date).toLocaleDateString()} • {selectedKpiValue.scenario}
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleEdit} className="justify-start sm:justify-center">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="justify-start sm:justify-center">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this KPI value.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Key Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">KPI Details</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">KPI Value</h4>
                <p className="text-2xl font-bold">
                  {formatValue(selectedKpiValue.value, selectedKpiValue.kpi?.dataType)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getKpiTypeLabel(selectedKpiValue.kpi?.dataType || 'DECIMAL')}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Scenario</h4>
                <div className="flex items-center gap-2 mt-1">
                  {getScenarioBadge(selectedKpiValue.scenario)}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                <p className="text-base">{new Date(selectedKpiValue.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Year</h4>
                <p className="text-base">{selectedKpiValue.year}</p>
              </div>

              {!selectedKpiValue.fullYear && (
                <>
                  {selectedKpiValue.semester && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Semester</h4>
                      <p className="text-base">{selectedKpiValue.semester}</p>
                    </div>
                  )}
                  {selectedKpiValue.quarter && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Quarter</h4>
                      <p className="text-base">{selectedKpiValue.quarter}</p>
                    </div>
                  )}
                  {selectedKpiValue.month && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Month</h4>
                      <p className="text-base">{selectedKpiValue.month}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">KPI Information</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">KPI Name</h4>
                <p className="text-base">{selectedKpiValue.kpi?.name}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Company</h4>
                <p className="text-base">{getCompanyName(selectedKpiValue.kpi?.companyId || 0)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Data Type</h4>
                <p className="text-base">{getKpiTypeLabel(selectedKpiValue.kpi?.dataType || 'DECIMAL')}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Is Calculated</h4>
                <p className="text-base">{selectedKpiValue.kpi?.isCalculated ? 'Yes' : 'No'}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Full Year</h4>
                <p className="text-base">{selectedKpiValue.fullYear ? 'Yes' : 'No'}</p>
              </div>

              {selectedKpiValue.kpi?.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="text-base">{selectedKpiValue.kpi.description}</p>
                </div>
              )}

              {selectedKpiValue.kpi?.isCalculated && selectedKpiValue.kpi?.formula && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Formula</h4>
                  <p className="text-base font-mono bg-muted p-3 rounded-md">{selectedKpiValue.kpi.formula}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {selectedKpiValue.createdAt ? new Date(selectedKpiValue.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {selectedKpiValue.updatedAt ? new Date(selectedKpiValue.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
            {selectedKpiValue.calculatedAt && (
              <div>
                <span className="font-medium">Calculated:</span>{' '}
                {new Date(selectedKpiValue.calculatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}