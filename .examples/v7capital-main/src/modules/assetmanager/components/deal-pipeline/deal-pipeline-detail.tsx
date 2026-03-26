'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDealPipeline } from '@/modules/assetmanager/hooks/use-deal-pipeline';
import { useCompanies } from '@/modules/assetmanager/hooks/use-companies';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { type DealPipeline, type DealStatus, type DealPriority } from '@/modules/assetmanager/schemas/deal-pipeline.schemas';

interface DealPipelineDetailProps {
  id: number;
}

export default function DealPipelineDetail({ id }: DealPipelineDetailProps) {
  // ===== ROUTER, STATE, AND HOOKS =====
  const router = useRouter();
  const { 
    selectedDealPipeline,
    isLoading, 
    error, 
    fetchDealPipeline,
    removeDealPipeline,
    clearError 
  } = useDealPipeline();
  
  const { 
    getCompanyName 
  } = useCompanies();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // ===== EFFECTS =====
  useEffect(() => {
    fetchDealPipeline(id);
  }, [id, fetchDealPipeline]);
  
  // ===== EVENT HANDLERS =====
  const handleDelete = async () => {
    if (selectedDealPipeline?.id) {
      const success = await removeDealPipeline(selectedDealPipeline.id);
      if (success) {
        router.push('/dashboard/deal-pipeline');
      }
    }
  };
  
  const handleEdit = () => {
    router.push(`/dashboard/deal-pipeline/${id}/edit`);
  };

  const handleViewCompany = (companyId: number) => {
    router.push(`/dashboard/companies/${companyId}`);
  };
  
  // ===== HELPER FUNCTIONS =====
  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: DealStatus) => {
    const colorMap: Record<DealStatus, string> = {
      'Initial Screening': 'bg-gray-500',
      'First Meeting': 'bg-blue-500',
      'Follow Up': 'bg-indigo-500',
      'Due Diligence': 'bg-purple-500',
      'Negotiation': 'bg-orange-500',
      'Term Sheet': 'bg-yellow-500',
      'Legal Review': 'bg-cyan-500',
      'Closing': 'bg-green-500',
      'Closed': 'bg-green-600',
      'Rejected': 'bg-red-500',
      'On Hold': 'bg-gray-400',
    };
    
    return (
      <Badge className={`${colorMap[status] || 'bg-gray-500'} text-white border-0`}>
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: DealPriority) => {
    const colorMap: Record<DealPriority, string> = {
      'P1': 'bg-red-500',
      'P2': 'bg-orange-500',
      'P3': 'bg-yellow-500',
      'P4': 'bg-blue-500',
      'P5': 'bg-gray-500',
    };
    
    const labelMap: Record<DealPriority, string> = {
      'P1': 'High Priority',
      'P2': 'Medium-High Priority',
      'P3': 'Medium Priority',
      'P4': 'Medium-Low Priority',
      'P5': 'Low Priority',
    };
    
    return (
      <Badge className={`${colorMap[priority] || 'bg-gray-500'} text-white border-0`}>
        {labelMap[priority]}
      </Badge>
    );
  };
  
  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deal Details</CardTitle>
          <CardDescription>Loading deal information...</CardDescription>
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
          <CardTitle>Deal Details</CardTitle>
          <CardDescription>Error loading deal</CardDescription>
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
  
  if (!selectedDealPipeline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deal Details</CardTitle>
          <CardDescription>Deal not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The requested deal could not be found.</p>
        </CardContent>
      </Card>
    );
  }
  
  // ===== MAIN COMPONENT RENDER =====
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl sm:text-2xl">{selectedDealPipeline.dealName}</CardTitle>
            {getStatusBadge(selectedDealPipeline.status)}
            {getPriorityBadge(selectedDealPipeline.priority)}
          </div>
          <CardDescription>
            Deal pipeline details and progress tracking
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
                <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the deal &quot;{selectedDealPipeline.dealName}&quot;? 
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
            <h3 className="text-lg font-semibold">Deal Information</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Company</h4>
                <div className="flex items-center gap-2">
                  <p className="text-base">{getCompanyName(selectedDealPipeline.companyId)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewCompany(selectedDealPipeline.companyId)}
                    className="h-6 w-6 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Deal Status</h4>
                <p className="text-base">{selectedDealPipeline.status}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Priority</h4>
                <p className="text-base">{selectedDealPipeline.priority}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Round</h4>
                <p className="text-base">{selectedDealPipeline.round}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Sector</h4>
                <p className="text-base">{selectedDealPipeline.sector}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Pre-Money Valuation</h4>
                <p className="text-base font-semibold">{formatCurrency(selectedDealPipeline.preMoneyValuation)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Post-Money Valuation</h4>
                <p className="text-base font-semibold">{formatCurrency(selectedDealPipeline.postMoneyValuation)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {selectedDealPipeline.notes && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="whitespace-pre-wrap">{selectedDealPipeline.notes}</p>
            </div>
          </div>
        )}

        {/* Rejection Reason Section */}
        {selectedDealPipeline.rejectionReason && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Rejection Reason</h3>
            <div className="bg-destructive/10 p-4 rounded-md">
              <p className="whitespace-pre-wrap text-destructive">{selectedDealPipeline.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Metadata</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {selectedDealPipeline.createdAt ? new Date(selectedDealPipeline.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {selectedDealPipeline.updatedAt ? new Date(selectedDealPipeline.updatedAt).toLocaleDateString('en-US', {
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