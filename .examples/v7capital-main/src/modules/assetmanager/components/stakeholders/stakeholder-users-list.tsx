'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/modules/shadcnui/components/ui/table';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction,
  AlertDialogTrigger 
} from '@/modules/shadcnui/components/ui/alert-dialog';
import { ChevronLeft, RefreshCw, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/modules/shadcnui/components/ui/tooltip';
import { type StakeholderUserWithProfile } from '../../schemas/stakeholders.schemas';

interface StakeholderUsersListProps {
  stakeholderId: number;
  stakeholderName: string;
  users: StakeholderUserWithProfile[];
  isLoading: boolean;
  error: string | null;
  onAddUser: () => void;
  onEditUser: (user: StakeholderUserWithProfile) => void;
  onRemoveUser: (user: StakeholderUserWithProfile) => void;
  onRefresh: () => void;
}

export function StakeholderUsersList({
  stakeholderId,
  stakeholderName,
  users,
  isLoading,
  error,
  onAddUser,
  onEditUser,
  onRemoveUser,
  onRefresh
}: StakeholderUsersListProps) {
  const [userToRemove, setUserToRemove] = useState<StakeholderUserWithProfile | null>(null);
  
  const getRoleBadge = (role: string) => {
    const colorMap: Record<string, string> = {
      'ADMIN': 'bg-red-500',
      'EDITOR': 'bg-blue-500',
      'VIEWER': 'bg-green-500',
    };
    
    return (
      <Badge className={`${colorMap[role] || 'bg-gray-500'}`}>
        {role}
      </Badge>
    );
  };
  
  const handleRemove = (user: StakeholderUserWithProfile) => {
    onRemoveUser(user);
    setUserToRemove(null);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stakeholder Users</CardTitle>
          <CardDescription>Loading users...</CardDescription>
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
          <CardTitle>Stakeholder Users</CardTitle>
          <CardDescription>Error loading users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={onRefresh} className="mt-4">Try Again</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users for {stakeholderName}</CardTitle>
        <CardDescription>Add, edit, or remove users from this stakeholder</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add User Button */}
        <div className="flex justify-end">
          <Button onClick={onAddUser}>
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
        
        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableCaption>
              {users.length === 0 
                ? 'No users found for this stakeholder' 
                : `Showing ${users.length} users for this stakeholder`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.userProfileId}>
                  <TableCell>{user.userProfileId}</TableCell>
                  <TableCell className="font-medium">{user.profile?.name || 'N/A'}</TableCell>
                  <TableCell>{user.profile?.email || 'N/A'}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditUser(user)}
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      
                      <AlertDialog open={userToRemove?.userProfileId === user.userProfileId} onOpenChange={(open) => {
                        if (!open) setUserToRemove(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setUserToRemove(user)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {user.profile?.name || 'this user'} from the stakeholder? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(user)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
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
      </CardContent>
    </Card>
  );
}

export default StakeholderUsersList;
