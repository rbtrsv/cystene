'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRounds } from '../../hooks/use-rounds';
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
import { type RoundType } from '../../schemas/rounds.schemas';

interface RoundDetailProps {
  id: number;
}

export default function RoundDetail({ id }: RoundDetailProps) {
  const router = useRouter();
  const { 
    selectedRound, 
    isLoading, 
    error, 
    fetchRound, 
    removeRound,
    clearError 
  } = useRounds();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  useEffect(() => {
    fetchRound(id);
  }, [id, fetchRound]);
  
  const handleDelete = async () => {
    if (selectedRound?.id) {
      const success = await removeRound(selectedRound.id);
      if (success) {
        router.push('/dashboard/rounds');
      }
    }
  };
  
  const handleEdit = () => {
    router.push(`/dashboard/rounds/${id}/edit`);
  };
  
  // Helper function to format currency
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Helper function to get round type badge
  const getRoundTypeBadge = (type: RoundType) => {
    const colorMap: Record<RoundType, string> = {
      'Seed': 'bg-green-500',
      'Pre Series A': 'bg-blue-500',
      'Series A': 'bg-purple-500',
      'Series B': 'bg-indigo-500',
      'Series C': 'bg-pink-500',
      'Debt': 'bg-red-500',
      'Convertible': 'bg-orange-500',
      'SAFE': 'bg-yellow-500',
      'Bridge': 'bg-teal-500',
      'Secondary': 'bg-gray-500',
      'Other': 'bg-slate-500',
    };
    
    return (
      <Badge className={`${colorMap[type] || 'bg-gray-500'}`}>
        {type}
      </Badge>
    );
  };
  
  // Calculate percentage raised
  const getPercentageRaised = () => {
    if (!selectedRound?.targetAmount || !selectedRound?.raisedAmount) return 0;
    return Math.round((selectedRound.raisedAmount / selectedRound.targetAmount) * 100);
  };
  
  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>Round Details</CardTitle>
          <CardDescription>Loading round...</CardDescription>
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
          <CardTitle>Round Details</CardTitle>
          <CardDescription>Error loading round</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </>
    );
  }
  
  if (!selectedRound) {
    return (
      <>
        <CardHeader>
          <CardTitle>Round Details</CardTitle>
          <CardDescription>Round not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The requested round could not be found.</p>
        </CardContent>
      </>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            {selectedRound.roundName}
            {getRoundTypeBadge(selectedRound.roundType)}
          </CardTitle>
          <CardDescription>
            Fund ID: {selectedRound.fundId} • {selectedRound.roundDate ? new Date(selectedRound.roundDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'N/A'}
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
                <AlertDialogTitle>Delete Round</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the round &quot;{selectedRound.roundName}&quot;? 
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
            <h3 className="text-lg font-semibold">Financial Information</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Target Amount</h4>
                <p className="text-base">{formatCurrency(selectedRound.targetAmount)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Raised Amount</h4>
                <p className="text-base">{formatCurrency(selectedRound.raisedAmount)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Percentage Raised</h4>
                <p className="text-base">{getPercentageRaised()}%</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Pre-Money Valuation</h4>
                <p className="text-base">{formatCurrency(selectedRound.preMoneyValuation)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Post-Money Valuation</h4>
                <p className="text-base">{formatCurrency(selectedRound.postMoneyValuation)}</p>
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
              {selectedRound.createdAt ? new Date(selectedRound.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {selectedRound.updatedAt ? new Date(selectedRound.updatedAt).toLocaleDateString('en-US', {
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
