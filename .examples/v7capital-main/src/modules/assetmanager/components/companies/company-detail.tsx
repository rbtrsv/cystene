'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanies } from '../../hooks/use-companies';
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
import { Pencil, Trash2, Users, ExternalLink } from 'lucide-react';

interface CompanyDetailProps {
  id: number;
}

export default function CompanyDetail({ id }: CompanyDetailProps) {
  // ===== ROUTER, STATE, AND HOOKS =====
  const router = useRouter();
  const { 
    selectedCompany, 
    isLoading, 
    error, 
    fetchCompany,
    removeCompany,
    clearError 
  } = useCompanies();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // ===== EFFECTS =====
  useEffect(() => {
    fetchCompany(id);
  }, [id, fetchCompany]);
  
  // ===== EVENT HANDLERS =====
  const handleDelete = async () => {
    if (selectedCompany?.id) {
      const success = await removeCompany(selectedCompany.id);
      if (success) {
        router.push('/dashboard/companies');
      }
    }
  };
  
  const handleEdit = () => {
    router.push(`/dashboard/companies/${id}/edit`);
  };
  
  const handleManageUsers = () => {
    router.push(`/dashboard/companies/${id}/users`);
  };
  
  // ===== HELPER FUNCTIONS =====
  const renderWebsiteLink = (website: string | null | undefined) => {
    if (!website) return 'N/A';
    return (
      <a 
        href={website} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center text-blue-600 hover:underline"
      >
        {website}
        <ExternalLink className="ml-1 h-3 w-3" />
      </a>
    );
  };
  
  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Loading company information...</CardDescription>
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
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Error loading company</CardDescription>
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
  
  if (!selectedCompany) {
    return (
      <>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Company not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The requested company could not be found.</p>
        </CardContent>
      </>
    );
  }
  
  // ===== MAIN COMPONENT RENDER =====
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-xl sm:text-2xl">{selectedCompany.name}</CardTitle>
          <CardDescription>
            Company profile and management
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
                <AlertDialogTitle>Delete Company</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the company &quot;{selectedCompany.name}&quot;? 
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
            <h3 className="text-lg font-semibold">Company Information</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Website</h4>
                <p className="text-base">
                  {renderWebsiteLink(selectedCompany.website)}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Country</h4>
                <p className="text-base">{selectedCompany.country || 'N/A'}</p>
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
              {selectedCompany.createdAt ? new Date(selectedCompany.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{' '}
              {selectedCompany.updatedAt ? new Date(selectedCompany.updatedAt).toLocaleDateString('en-US', {
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
