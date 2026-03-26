'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStakeholders } from '../../hooks/use-stakeholders';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/modules/shadcnui/components/ui/table';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/modules/shadcnui/components/ui/tooltip';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Pencil, Trash2, Eye, Users, Plus } from 'lucide-react';
import { 
  type Stakeholder, 
  type StakeholderType,
  stakeholderTypeEnum 
} from '../../schemas/stakeholders.schemas';

export default function StakeholderList() {
  // ===== ROUTER, STATE, AND HOOKS =====
  const router = useRouter();
  const { 
    stakeholders, 
    isLoading, 
    error, 
    fetchStakeholders, 
    removeStakeholder,
    clearError 
  } = useStakeholders();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<StakeholderType | 'ALL'>('ALL');
  const [stakeholderToDelete, setStakeholderToDelete] = useState<Stakeholder | null>(null);
  
  // ===== EFFECTS =====
  useEffect(() => {
    fetchStakeholders();
  }, [fetchStakeholders]);
  
  // ===== EVENT HANDLERS =====
  const handleDelete = async (stakeholder: Stakeholder) => {
    if (stakeholder.id) {
      const success = await removeStakeholder(stakeholder.id);
      if (success) {
        setStakeholderToDelete(null);
      }
    }
  };
  
  const handleViewDetails = (id: number) => {
    router.push(`/dashboard/stakeholders/${id}`);
  };
  
  const handleEdit = (id: number) => {
    router.push(`/dashboard/stakeholders/${id}/edit`);
  };
  
  const handleCreate = () => {
    router.push('/dashboard/stakeholders/new');
  };
  
  const handleManageUsers = (id: number) => {
    router.push(`/dashboard/stakeholders/${id}/users`);
  };
  
  // ===== HELPER FUNCTIONS =====
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };
  
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
  
  // Filter stakeholders based on search term and type filter
  const filteredStakeholders = stakeholders.filter(stakeholder => {
    const matchesSearch = stakeholder.stakeholderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' ? true : stakeholder.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stakeholders</CardTitle>
          <CardDescription>Loading stakeholders...</CardDescription>
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
          <CardTitle>Stakeholders</CardTitle>
          <CardDescription>Error loading stakeholders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={() => fetchStakeholders()} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }
  
  // ===== MAIN COMPONENT RENDER =====
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Stakeholders</CardTitle>
          <CardDescription>Manage your stakeholders</CardDescription>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Stakeholder
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search stakeholders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-2.5 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as StakeholderType | 'ALL')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {Object.values(stakeholderTypeEnum.enum).map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border overflow-x-auto">
          <Table className="text-sm min-w-[1000px]">
            <TableCaption className="text-xs text-muted-foreground">
              {filteredStakeholders.length === 0 
                ? 'No stakeholders found' 
                : `Showing ${filteredStakeholders.length} of ${stakeholders.length} stakeholders`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStakeholders.map((stakeholder) => (
                <TableRow key={stakeholder.id}>
                  <TableCell className="font-medium">{stakeholder.stakeholderName}</TableCell>
                  <TableCell>{getStakeholderTypeBadge(stakeholder.type)}</TableCell>
                  <TableCell>{formatDate(stakeholder.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => stakeholder.id && handleViewDetails(stakeholder.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => stakeholder.id && handleManageUsers(stakeholder.id)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Manage Users</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => stakeholder.id && handleEdit(stakeholder.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <AlertDialog open={stakeholderToDelete?.id === stakeholder.id} onOpenChange={(open) => {
                        if (!open) setStakeholderToDelete(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setStakeholderToDelete(stakeholder)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Stakeholder</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the stakeholder &quot;{stakeholder.stakeholderName}&quot;? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(stakeholder)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobile List View */}
        <div className="md:hidden space-y-2">
          {filteredStakeholders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stakeholders found
            </div>
          ) : (
            filteredStakeholders.map((stakeholder) => (
              <div key={stakeholder.id} className="border rounded-lg p-3 bg-card hover:bg-muted/30 transition-colors">
                {/* Header row with name and actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">
                      {stakeholder.stakeholderName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => stakeholder.id && handleViewDetails(stakeholder.id)}
                      className="h-7 w-7"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => stakeholder.id && handleManageUsers(stakeholder.id)}
                      className="h-7 w-7"
                    >
                      <Users className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => stakeholder.id && handleEdit(stakeholder.id)}
                      className="h-7 w-7"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog open={stakeholderToDelete?.id === stakeholder.id} onOpenChange={(open) => {
                      if (!open) setStakeholderToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setStakeholderToDelete(stakeholder)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Stakeholder</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the stakeholder &quot;{stakeholder.stakeholderName}&quot;? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(stakeholder)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Type row */}
                <div className="flex items-center gap-2 mb-2">
                  {getStakeholderTypeBadge(stakeholder.type)}
                </div>

                {/* Created date */}
                <div className="text-xs text-muted-foreground">
                  Created: {new Date(stakeholder.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}