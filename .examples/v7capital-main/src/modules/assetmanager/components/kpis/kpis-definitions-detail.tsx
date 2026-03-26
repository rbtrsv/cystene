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

interface KpisDefinitionsDetailProps {
  id: number;
}

// Helper component for dynamic field rendering
interface FieldProps {
  label: string;
  value: any;
  condition?: boolean;
  formatter?: (value: any) => string;
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
      <p className="text-base">{displayValue}</p>
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
      <p className="text-base">{value ? 'Yes' : 'No'}</p>
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
      <p className="text-base">{formatDate(value)}</p>
    </div>
  );
}

export default function KpisDefinitionsDetail({ id }: KpisDefinitionsDetailProps) {
  const router = useRouter();
  const { companies, getCompanyName } = useCompanies();
  const {
    selectedKpi,
    isLoading,
    error,
    fetchKpi,
    removeKpi,
    clearError
  } = useKpis();

  useEffect(() => {
    if (id) {
      fetchKpi(id);
    }
  }, [id, fetchKpi]);

  const handleBack = () => {
    router.push('/dashboard/kpis-definitions');
  };

  const handleEdit = () => {
    router.push(`/dashboard/kpis-definitions/${id}/edit`);
  };

  const handleDelete = async () => {
    const success = await removeKpi(id);
    if (success) {
      router.push('/dashboard/kpis-definitions');
    }
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

  const getDataTypeLabel = (dataType: string) => {
    switch (dataType) {
      case 'DECIMAL': return 'Decimal Numbers';
      case 'INTEGER': return 'Whole Numbers';
      case 'STRING': return 'Text/String';
      default: return dataType;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KPI Definition</CardTitle>
          <CardDescription>Loading KPI definition...</CardDescription>
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
          <CardTitle>KPI Definition</CardTitle>
          <CardDescription>Error loading KPI definition</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">{error}</div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!selectedKpi) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KPI Definition</CardTitle>
          <CardDescription>Not found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">No KPI definition found for this ID.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-xl sm:text-2xl">{selectedKpi.name}</CardTitle>
          <CardDescription>
            KPI Definition • {getCompanyName(selectedKpi.companyId)}
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
                  This action cannot be undone. This will permanently delete this KPI definition.
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
            <h3 className="text-lg font-semibold">KPI Information</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Data Type</h4>
                <p className="text-base">{getDataTypeLabel(selectedKpi.dataType)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Is Calculated</h4>
                <p className="text-base">{selectedKpi.isCalculated ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Details</h3>
            
            <div className="space-y-3">
              {selectedKpi.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="text-base">{selectedKpi.description}</p>
                </div>
              )}
              
              {selectedKpi.isCalculated && selectedKpi.formula && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Formula</h4>
                  <p className="text-base font-mono bg-muted p-3 rounded-md">{selectedKpi.formula}</p>
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
              {selectedKpi.createdAt ? new Date(selectedKpi.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {selectedKpi.updatedAt ? new Date(selectedKpi.updatedAt).toLocaleDateString('en-US', {
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