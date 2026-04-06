'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { useOrganizationMembers } from '@/modules/accounts/hooks/use-organization-members';
import { useOrganizationInvitations } from '@/modules/accounts/hooks/use-organization-invitations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, Building, Users, Mail, MoreVertical, Trash2, Settings, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/modules/shadcnui/components/ui/dropdown-menu';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { useEffect, useState } from 'react';
import { useAuth } from '@/modules/accounts/hooks/use-auth-server';

export default function OrganizationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const organizationId = parseInt(params.id as string);
  const { organizations, isLoading, error, updateOrganization, deleteOrganization, fetchOrganizations } = useOrganizations();
  const { getUserId } = useAuth();
  const {
    members,
    isLoading: membersLoading,
    error: membersError,
    fetchMembers,
    updateMemberRole,
    removeMember,
    setActiveOrganization
  } = useOrganizationMembers();

  const {
    invitations,
    isLoading: invitationsLoading,
    error: invitationsError,
    fetchInvitations,
    createInvitation,
    cancelInvitation,
    setActiveOrganization: setActiveInvitationOrganization
  } = useOrganizationInvitations();

  const organization = organizations.find(org => org.id === organizationId);
  const defaultTab = searchParams.get('tab') || 'overview';
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [cancellingInvitationId, setCancellingInvitationId] = useState<number | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'>('VIEWER');
  const [inviting, setInviting] = useState(false);

  // Settings state
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when organization changes
  useEffect(() => {
    if (organization) {
      setEditName(organization.name);
    }
  }, [organization]);

  // Initialize members when organization changes
  useEffect(() => {
    if (organizationId) {
      setActiveOrganization(organizationId);
      fetchMembers(organizationId);
    }
  }, [organizationId, setActiveOrganization, fetchMembers]);

  // Initialize invitations when organization changes
  useEffect(() => {
    if (organizationId) {
      setActiveInvitationOrganization(organizationId);
      fetchInvitations(organizationId);
    }
  }, [organizationId, setActiveInvitationOrganization, fetchInvitations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!organization) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Organization not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/organizations">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Organizations
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
              <p className="text-sm text-muted-foreground">
                Your role: <span className="font-medium">{organization.role}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Building className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail className="h-4 w-4" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Basic information about this organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Organization Name</p>
                <p className="text-lg font-medium">{organization.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Role</p>
                <p className="text-lg font-medium">{organization.role}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(organization.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>
                Manage members and their roles in this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membersError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{membersError}</AlertDescription>
                </Alert>
              )}

              {membersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No members found in this organization</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const currentUserId = getUserId();
                      const isCurrentUser = member.user_id === currentUserId;
                      const canModify = organization?.role === 'OWNER' || organization?.role === 'ADMIN';
                      const isCurrentUserOwner = organization?.role === 'OWNER';
                      const canModifyThisMember = canModify && (member.role !== 'OWNER' || isCurrentUserOwner) && !isCurrentUser;

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.name || 'N/A'}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            {canModifyThisMember ? (
                              <Select
                                value={member.role}
                                onValueChange={async (newRole) => {
                                  setUpdatingMemberId(member.id);
                                  try {
                                    await updateMemberRole(organizationId, member.id, newRole);
                                  } catch (error) {
                                    console.error('Failed to update member role:', error);
                                  } finally {
                                    setUpdatingMemberId(null);
                                  }
                                }}
                                disabled={updatingMemberId === member.id}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="VIEWER">Viewer</SelectItem>
                                  <SelectItem value="EDITOR">Editor</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                  {isCurrentUserOwner && (
                                    <SelectItem value="OWNER">Owner</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="secondary">{member.role}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(member.joined_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {canModifyThisMember && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={removingMemberId === member.id}
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to remove ${member.email} from this organization?`)) {
                                        setRemovingMemberId(member.id);
                                        try {
                                          await removeMember(organizationId, member.id);
                                        } catch (error) {
                                          console.error('Failed to remove member:', error);
                                        } finally {
                                          setRemovingMemberId(null);
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove Member
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle>Organization Invitations</CardTitle>
                  <CardDescription>
                    Manage pending invitations to this organization
                  </CardDescription>
                </div>
                {(organization?.role === 'OWNER' || organization?.role === 'ADMIN') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="shrink-0"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showInviteForm && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Invite New Member</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="colleague@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Role</Label>
                      <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER')}>
                        <SelectTrigger id="invite-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VIEWER">Viewer</SelectItem>
                          <SelectItem value="EDITOR">Editor</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          {organization?.role === 'OWNER' && (
                            <SelectItem value="OWNER">Owner</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          if (!inviteEmail) {
                            alert('Please enter an email address');
                            return;
                          }
                          setInviting(true);
                          try {
                            await createInvitation({
                              email: inviteEmail,
                              organization_id: organizationId,
                              role: inviteRole
                            });
                            setInviteEmail('');
                            setInviteRole('VIEWER');
                            setShowInviteForm(false);
                            // Refresh invitations
                            await fetchInvitations(organizationId);
                          } catch (error) {
                            console.error('Failed to send invitation:', error);
                          } finally {
                            setInviting(false);
                          }
                        }}
                        disabled={inviting}
                      >
                        {inviting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send Invitation'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowInviteForm(false);
                          setInviteEmail('');
                          setInviteRole('VIEWER');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {invitationsError && (
                <Alert variant="destructive">
                  <AlertDescription>{invitationsError}</AlertDescription>
                </Alert>
              )}

              {invitationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending invitations</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">{invitation.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{invitation.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invitation.status === 'PENDING'
                                ? 'default'
                                : invitation.status === 'ACCEPTED'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {invitation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invitation.created_at
                            ? new Date(invitation.created_at).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {invitation.status === 'PENDING' &&
                            (organization?.role === 'OWNER' || organization?.role === 'ADMIN') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={cancellingInvitationId === invitation.id}
                                onClick={async () => {
                                  if (confirm(`Cancel invitation for ${invitation.email}?`)) {
                                    setCancellingInvitationId(invitation.id);
                                    try {
                                      await cancelInvitation(invitation.id);
                                      // Refresh invitations
                                      await fetchInvitations(organizationId);
                                    } catch (error) {
                                      console.error('Failed to cancel invitation:', error);
                                    } finally {
                                      setCancellingInvitationId(null);
                                    }
                                  }
                                }}
                              >
                                {cancellingInvitationId === invitation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Organization</CardTitle>
              <CardDescription>
                Update organization details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Organization name"
                />
              </div>
              <Button
                onClick={async () => {
                  if (!editName.trim()) {
                    alert('Please enter a name');
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    await updateOrganization(organizationId, { name: editName.trim() });
                    await fetchOrganizations();
                  } catch (error) {
                    console.error('Failed to update organization:', error);
                  } finally {
                    setIsUpdating(false);
                  }
                }}
                disabled={isUpdating || editName === organization?.name}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this organization</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete an organization, there is no going back. This will permanently delete the organization and remove all member associations.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete">
                    Type <span className="font-semibold">{organization?.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Organization name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== organization?.name) {
                      alert('Please type the organization name to confirm');
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      await deleteOrganization(organizationId);
                      router.push('/organizations');
                    } catch (error) {
                      console.error('Failed to delete organization:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== organization?.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Organization
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
