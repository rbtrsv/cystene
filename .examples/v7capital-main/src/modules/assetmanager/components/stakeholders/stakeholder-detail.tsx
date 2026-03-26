'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStakeholders } from '../../hooks/use-stakeholders';
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
import { Users, Pencil, Trash2 } from 'lucide-react';
import { type StakeholderType } from '../../schemas/stakeholders.schemas';

interface StakeholderDetailProps {
  id: number;
}

export default function StakeholderDetail({ id }: StakeholderDetailProps) {
  // ===== ROUTER, STATE, AND HOOKS =====
  const router = useRouter();
  const { 
    selectedStakeholder, 
    isLoading, 
    error, 
    fetchStakeholder, 
    removeStakeholder,
    clearError 
  } = useStakeholders();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // ===== EFFECTS =====
  useEffect(() => {
    fetchStakeholder(id);
  }, [id, fetchStakeholder]);
  
  // ===== EVENT HANDLERS =====
  const handleDelete = async () => {
    if (selectedStakeholder?.id) {
      const success = await removeStakeholder(selectedStakeholder.id);
      if (success) {
        router.push('/dashboard/stakeholders');
      }
    }
  };
  
  const handleEdit = () => {
    router.push(`/dashboard/stakeholders/${id}/edit`);
  };
  
  const handleManageUsers = () => {
    router.push(`/dashboard/stakeholders/${id}/users`);
  };
  
  // ===== HELPER FUNCTIONS =====
  const getStakeholderTypeBadge = (type: StakeholderType) => {
    const colorMap: Record<StakeholderType, string> = {
      'Fund': 'bg-blue-500',
      'Investor': 'bg-green-500',
      'Employee': 'bg-purple-500',
    };
    
    return (
      <Badge className={`${colorMap[type] || 'bg-gray-500'}`}>
        {type}
      </Badge>
    );
  };
  
  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stakeholder Details</CardTitle>
          <CardDescription>Loading stakeholder information...</CardDescription>
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
          <CardTitle>Stakeholder Details</CardTitle>
          <CardDescription>Error loading stakeholder</CardDescription>
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
  
  if (!selectedStakeholder) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stakeholder Details</CardTitle>
          <CardDescription>Stakeholder not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The requested stakeholder could not be found.</p>
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
            {selectedStakeholder.stakeholderName}
            {getStakeholderTypeBadge(selectedStakeholder.type)}
          </CardTitle>
          <CardDescription>
            Stakeholder profile and management
          </CardDescription>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleManageUsers} className="justify-start sm:justify-center">
            <Users className="mr-2 h-4 w-4" />
            Manage Users
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
                <AlertDialogTitle>Delete Stakeholder</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the stakeholder &quot;{selectedStakeholder.stakeholderName}&quot;? 
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
            <h3 className="text-lg font-semibold">Stakeholder Information</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                <p className="text-base">{selectedStakeholder.type}</p>
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
              {selectedStakeholder.createdAt ? new Date(selectedStakeholder.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {selectedStakeholder.updatedAt ? new Date(selectedStakeholder.updatedAt).toLocaleDateString('en-US', {
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
