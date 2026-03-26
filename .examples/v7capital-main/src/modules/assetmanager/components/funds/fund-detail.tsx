'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFunds } from '../../hooks/use-funds';
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
import { Pencil, Trash2, BarChart3 } from 'lucide-react';

interface FundDetailProps {
  id: number;
}

export default function FundDetail({ id }: FundDetailProps) {
  // ===== ROUTER, STATE, AND HOOKS =====
  const router = useRouter();
  const { 
    selectedFund, 
    isLoading, 
    error, 
    fetchFund,
    removeFund,
    clearError 
  } = useFunds();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // ===== EFFECTS =====
  useEffect(() => {
    fetchFund(id);
  }, [id, fetchFund]);
  
  // ===== EVENT HANDLERS =====
  const handleDelete = async () => {
    if (selectedFund?.id) {
      const success = await removeFund(selectedFund.id);
      if (success) {
        router.push('/dashboard/funds');
      }
    }
  };
  
  const handleEdit = () => {
    router.push(`/dashboard/funds/${id}/edit`);
  };

  const handleManageRounds = () => {
    router.push(`/dashboard/funds/${id}/rounds`);
  };
  
  // ===== HELPER FUNCTIONS =====
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      'Active': 'bg-green-500',
      'Fundraising': 'bg-blue-500',
      'Closed': 'bg-gray-500',
      'Liquidating': 'bg-red-500',
    };
    
    return (
      <Badge className={`${colorMap[status] || 'bg-gray-500'}`}>
        {status}
      </Badge>
    );
  };
  
  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fund Details</CardTitle>
          <CardDescription>Loading fund information...</CardDescription>
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
          <CardTitle>Fund Details</CardTitle>
          <CardDescription>Error loading fund</CardDescription>
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
  
  if (!selectedFund) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fund Details</CardTitle>
          <CardDescription>Fund not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The requested fund could not be found.</p>
        </CardContent>
      </Card>
    );
  }
  
  // ===== MAIN COMPONENT RENDER =====
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            {selectedFund.name}
            {selectedFund.status && getStatusBadge(selectedFund.status)}
          </CardTitle>
          <CardDescription>
            Fund profile and management
          </CardDescription>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleManageRounds} className="justify-start sm:justify-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            Manage Rounds
          </Button>
          
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
                  <AlertDialogTitle>Delete Fund</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the fund &quot;{selectedFund.name}&quot;? 
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
            <h3 className="text-lg font-semibold">Fund Information</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <p className="text-base">{selectedFund.description || 'No description provided'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Vintage</h4>
                <p className="text-base">{selectedFund.vintage || 'Not specified'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Target Size</h4>
                <p className="text-base">{selectedFund.targetSize ? formatCurrency(selectedFund.targetSize) : 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {selectedFund.createdAt ? new Date(selectedFund.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {selectedFund.updatedAt ? new Date(selectedFund.updatedAt).toLocaleDateString('en-US', {
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