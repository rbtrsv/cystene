'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStakeholders } from '../../hooks/use-stakeholders';
import { useForm } from '@tanstack/react-form';
import { getAllUserProfiles } from '@/modules/accounts/actions/auth.actions';
import { type UserProfile } from '@/modules/accounts/schemas/auth.schemas';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
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
import { Search, Save, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { type StakeholderUserWithProfile, type StakeholderRole } from '../../schemas/stakeholders.schemas';

interface StakeholderUsersProps {
  stakeholderId: number;
  userProfileId?: number;
}

// Helper function to render form field errors
function FieldInfo({ field }: { field: any }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
      ) : null}
      {field.state.meta.isValidating ? <p className="text-sm text-muted-foreground mt-1">Validating...</p> : null}
    </>
  );
}

export default function StakeholderUsers({ stakeholderId, userProfileId }: StakeholderUsersProps) {
  const router = useRouter();
  const { 
    selectedStakeholder,
    stakeholderUsers,
    isLoading, 
    error, 
    fetchStakeholder,
    fetchStakeholderUsers,
    addUserToStakeholder,
    updateUserRole,
    removeUserFromStakeholder,
    clearError 
  } = useStakeholders();
  
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<StakeholderUserWithProfile | null>(null);
  const [userToRemove, setUserToRemove] = useState<StakeholderUserWithProfile | null>(null);
  const [allUserProfiles, setAllUserProfiles] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  
  // ===== EFFECTS =====
  useEffect(() => {
    fetchStakeholder(stakeholderId);
    fetchStakeholderUsers(stakeholderId);
  }, [stakeholderId, fetchStakeholder, fetchStakeholderUsers]);
  
  useEffect(() => {
    // Fetch all user profiles for autocomplete
    const fetchUserProfiles = async () => {
      setIsLoadingProfiles(true);
      try {
        const response = await getAllUserProfiles();
        if (response.success && response.data) {
          setAllUserProfiles(response.data);
        } else {
          console.error('Failed to fetch user profiles:', response.error);
        }
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      } finally {
        setIsLoadingProfiles(false);
      }
    };
    
    fetchUserProfiles();
  }, []);
  
  // Filter out users already assigned to this stakeholder
  const availableUserProfiles = allUserProfiles.filter(
    profile => !stakeholderUsers.some(user => user.userProfileId === profile.id)
  );
  
  // Filter users based on search query
  const filteredUserProfiles = searchQuery 
    ? availableUserProfiles.filter(
        profile => 
          profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          profile.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableUserProfiles;
  
  // ===== FORMS =====
  // Form for adding a new user
  const addUserForm = useForm({
    defaultValues: {
      userProfileId: 0,
      role: 'VIEWER' as StakeholderRole,
    },
    onSubmit: async ({ value }) => {
      const success = await addUserToStakeholder(
        value.userProfileId, 
        stakeholderId, 
        value.role
      );
      if (success) {
        setIsAddingUser(false);
        // Refresh stakeholder users
        fetchStakeholderUsers(stakeholderId);
      }
    },
  });
  
  // Form for editing a user's role
  const editUserForm = useForm({
    defaultValues: {
      role: (editingUser?.role || 'VIEWER') as StakeholderRole,
    },
    onSubmit: async ({ value }) => {
      if (editingUser?.userProfileId) {
        const success = await updateUserRole(
          editingUser.userProfileId, 
          stakeholderId, 
          value.role
        );
        if (success) {
          setEditingUser(null);
          // Refresh stakeholder users
          fetchStakeholderUsers(stakeholderId);
        }
      }
    },
  });
  
  // If userProfileId is provided, find the user and set up edit mode
  useEffect(() => {
    if (userProfileId && stakeholderUsers.length > 0) {
      const user = stakeholderUsers.find(u => u.userProfileId === userProfileId);
      if (user) {
        setEditingUser(user);
        editUserForm.setFieldValue('role', user.role);
      }
    }
  }, [userProfileId, stakeholderUsers, editUserForm]);
  
  const handleRemoveUser = async (user: StakeholderUserWithProfile) => {
    if (user.userProfileId && user.stakeholderId) {
      const success = await removeUserFromStakeholder(user.userProfileId, user.stakeholderId);
      if (success) {
        setUserToRemove(null);
        // Refresh stakeholder users
        fetchStakeholderUsers(stakeholderId);
      }
    }
  };
  
  const getRoleBadge = (role: StakeholderRole) => {
    const colorMap: Record<StakeholderRole, string> = {
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
  
  // ===== CONDITIONAL RENDERING STATES =====
  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>Stakeholder Users</CardTitle>
          <CardDescription>Loading users...</CardDescription>
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
          <CardTitle>Stakeholder Users</CardTitle>
          <CardDescription>Error loading users</CardDescription>
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
  
  if (!selectedStakeholder) {
    return (
      <>
        <CardHeader>
          <CardTitle>Stakeholder Users</CardTitle>
          <CardDescription>Stakeholder not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p>The requested stakeholder could not be found.</p>
        </CardContent>
      </>
    );
  }
  
  // ===== MAIN COMPONENT RENDER =====
  // If in edit mode (userProfileId provided), show only the edit form
  if (userProfileId && editingUser) {
    return (
      <>
        <CardHeader>
          <CardTitle>Edit User Role</CardTitle>
          <CardDescription>
            Update role for {editingUser.profile?.name || `User ID: ${userProfileId}`}
            {selectedStakeholder?.stakeholderName ? ` in ${selectedStakeholder.stakeholderName}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editUserForm.handleSubmit();
            }}
          >
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">User Details</p>
                <div className="bg-muted p-3 rounded-md">
                  <p><span className="font-semibold">ID:</span> {userProfileId}</p>
                  <p><span className="font-semibold">Name:</span> {editingUser?.profile?.name || 'N/A'}</p>
                  <p><span className="font-semibold">Email:</span> {editingUser?.profile?.email || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <editUserForm.Field
                  name="role"
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Role</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value: StakeholderRole) => field.handleChange(value)}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="EDITOR">Editor</SelectItem>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldInfo field={field} />
                    </div>
                  )}
                </editUserForm.Field>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <editUserForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                {([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit}>
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> 
                        Update Role
                      </>
                    )}
                  </Button>
                )}
              </editUserForm.Subscribe>
            </div>
          </form>
        </CardContent>
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Users for {selectedStakeholder.stakeholderName}</CardTitle>
        <CardDescription>Add, edit, or remove users from this stakeholder</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Add User Form */}
        {isAddingUser ? (
          <Card>
            <CardHeader>
              <CardTitle>Add User</CardTitle>
              <CardDescription>Add a new user to this stakeholder</CardDescription>
            </CardHeader>
            {availableUserProfiles.length === 0 ? (
              <CardContent>
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-muted-foreground">All users have already been added to this stakeholder.</p>
                  <Button variant="outline" onClick={() => setIsAddingUser(false)} className="mt-4">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addUserForm.handleSubmit();
                }}
              >
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <addUserForm.Field
                      name="userProfileId"
                      validators={{
                        onChange: ({ value }) => {
                          if (!value) return 'User ID is required';
                          if (isNaN(Number(value)) || Number(value) <= 0) return 'User ID must be a positive number';
                          return undefined;
                        }
                      }}
                    >
                      {(field) => (
                        <div>
                          <Label htmlFor={field.name}>Select User</Label>
                          <div className="relative">
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <Input
                                  id="user-search"
                                  placeholder="Search by name or email"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full"
                                />
                                <Search className="h-4 w-4 text-muted-foreground" />
                              </div>
                              
                              {isLoadingProfiles ? (
                                <div className="py-2 text-center">
                                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                  <span className="ml-2">Loading users...</span>
                                </div>
                              ) : (
                                <div className="border rounded-md max-h-60 overflow-auto">
                                  {filteredUserProfiles.length === 0 ? (
                                    <div className="p-2 text-center text-muted-foreground">
                                      {searchQuery ? 'No matching users found' : 'No available users'}
                                    </div>
                                  ) : (
                                    <div className="p-1">
                                      {filteredUserProfiles.map(profile => (
                                        <div
                                          key={profile.id}
                                          className={`flex items-center justify-between p-2 cursor-pointer rounded-md ${
                                            field.state.value === profile.id ? 'bg-primary/10' : 'hover:bg-muted'
                                          }`}
                                          onClick={() => field.handleChange(profile.id)}
                                        >
                                          <div>
                                            <div className="font-medium">{profile.name || 'Unnamed User'}</div>
                                            <div className="text-sm text-muted-foreground">{profile.email}</div>
                                          </div>
                                          {field.state.value === profile.id && (
                                            <Badge className="ml-2">Selected</Badge>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {field.state.value > 0 && (
                                <div className="mt-2 p-2 border rounded-md bg-muted/50">
                                  <div className="text-sm font-medium">Selected User:</div>
                                  {allUserProfiles.find(p => p.id === field.state.value) ? (
                                    <div>
                                      <div>
                                        {allUserProfiles.find(p => p.id === field.state.value)?.name || 'Unnamed User'}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {allUserProfiles.find(p => p.id === field.state.value)?.email}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground">User ID: {field.state.value}</div>
                                  )}
                                </div>
                              )}
                            </div>
                            <FieldInfo field={field} />
                          </div>
                        </div>
                      )}
                    </addUserForm.Field>
                  </div>
                  
                  <div className="space-y-2">
                    <addUserForm.Field
                      name="role"
                    >
                      {(field) => (
                        <div>
                          <Label htmlFor={field.name}>Role</Label>
                          <Select
                            value={field.state.value}
                            onValueChange={(value: StakeholderRole) => field.handleChange(value)}
                          >
                            <SelectTrigger id={field.name}>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="EDITOR">Editor</SelectItem>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </addUserForm.Field>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setIsAddingUser(false)}>
                    Cancel
                  </Button>
                  
                  <addUserForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                      <Button type="submit" disabled={!canSubmit || isLoadingProfiles}>
                        {isSubmitting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" /> 
                            Add User
                          </>
                        )}
                      </Button>
                    )}
                  </addUserForm.Subscribe>
                </CardFooter>
              </form>
            )}
          </Card>
        ) : (
          <div className="flex justify-end">
            <Button onClick={() => setIsAddingUser(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>
        )}
        
        {/* Edit User Form */}
        {editingUser && (
          <Card>
            <CardHeader>
              <CardTitle>Edit User Role</CardTitle>
              <CardDescription>
                Update role for {editingUser.profile?.name || `User ID: ${editingUser.userProfileId}`}
              </CardDescription>
            </CardHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editUserForm.handleSubmit();
              }}
            >
              <CardContent>
                <div className="space-y-2">
                  <editUserForm.Field
                    name="role"
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Role</Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(value: StakeholderRole) => field.handleChange(value)}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="EDITOR">Editor</SelectItem>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </editUserForm.Field>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                
                <editUserForm.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <Button type="submit" disabled={!canSubmit}>
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> 
                          Update Role
                        </>
                      )}
                    </Button>
                  )}
                </editUserForm.Subscribe>
              </CardFooter>
            </form>
          </Card>
        )}
        
        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableCaption>
              {stakeholderUsers.length === 0 
                ? 'No users found for this stakeholder' 
                : `Showing ${stakeholderUsers.length} users for this stakeholder`}
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
              {stakeholderUsers.map((user) => (
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
                        onClick={() => {
                          setEditingUser(user);
                          // Initialize the edit form with the current role
                          editUserForm.setFieldValue('role', user.role);
                        }}
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
                              onClick={() => handleRemoveUser(user)}
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