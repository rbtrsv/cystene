'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { getEntityTypeLabel } from '@/modules/assetmanager/schemas/entity/entity.schemas';
import { useEntityOrganizationMembers } from '@/modules/assetmanager/hooks/entity/use-entity-organization-members';
import { useEntityOrganizationInvitations } from '@/modules/assetmanager/hooks/entity/use-entity-organization-invitations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, Building2, Users, Mail, MoreVertical, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/modules/shadcnui/components/ui/dropdown-menu';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { useEffect, useState } from 'react';
export default function EntityDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const entityId = parseInt(params.id as string);
  const { entities, isLoading, error, setActiveEntity, updateEntity, deleteEntity, fetchEntities, generateInviteCode, revokeInviteCode } = useEntities();
  const { organizations, activeOrganization } = useOrganizations();

  const {
    members,
    isLoading: membersLoading,
    error: membersError,
    fetchMembers,
    updateMemberRole,
    deleteMember,
  } = useEntityOrganizationMembers();

  const {
    invitations,
    isLoading: invitationsLoading,
    error: invitationsError,
    fetchInvitations,
    createInvitation,
    acceptInvitation,
    rejectInvitation,
    deleteInvitation,
  } = useEntityOrganizationInvitations();

  const entity = entities.find(e => e.id === entityId);
  const defaultTab = searchParams.get('tab') === 'edit' ? 'edit' : (searchParams.get('tab') || 'details');
  const [updatingMemberId, setUpdatingMemberId] = useState<number | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [cancellingInvitationId, setCancellingInvitationId] = useState<number | null>(null);
  const [acceptingInvitationId, setAcceptingInvitationId] = useState<number | null>(null);
  const [rejectingInvitationId, setRejectingInvitationId] = useState<number | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteOrganizationId, setInviteOrganizationId] = useState<number | null>(null);
  const [inviteRole, setInviteRole] = useState<string>('VIEWER');
  const [inviting, setInviting] = useState(false);

  // Settings state
  const [editName, setEditName] = useState('');
  const [editEntityType, setEditEntityType] = useState<string>('');
  const [editDiscoverable, setEditDiscoverable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when entity changes
  useEffect(() => {
    if (entity) {
      setEditName(entity.name);
      setEditEntityType(entity.entity_type);
      setEditDiscoverable(entity.is_discoverable);
    }
  }, [entity]);

  // Set active entity and fetch members/invitations when entity ID changes
  useEffect(() => {
    if (entityId) {
      setActiveEntity(entityId);
      fetchMembers({ entity_id: entityId });
      fetchInvitations({ entity_id: entityId });
    }
  }, [entityId, setActiveEntity, fetchMembers, fetchInvitations]);

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

  if (!entity) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Entity not found</AlertDescription>
      </Alert>
    );
  }



  const getEntityTypeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'fund':
        return 'default';
      case 'company':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleInviteSubmit = async () => {
    if (!inviteOrganizationId) return;

    setInviting(true);
    try {
      await createInvitation({
        entity_id: entityId,
        organization_id: inviteOrganizationId,
        role: inviteRole,
      });
      setShowInviteForm(false);
      setInviteOrganizationId(null);
      setInviteRole('VIEWER');
      await fetchInvitations({ entity_id: entityId });
    } catch (error) {
      console.error('Failed to send invitation:', error);
    } finally {
      setInviting(false);
    }
  };

  // Filter out organizations that already have access or pending invitations
  const availableOrganizations = organizations.filter(org => {
    const hasAccess = members.some(m => m.organization_id === org.id);
    const hasPendingInvite = invitations.some(i => i.organization_id === org.id && i.status === 'PENDING');
    return !hasAccess && !hasPendingInvite;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/entities">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Entities
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{entity.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getEntityTypeVariant(entity.entity_type)}>
                  {getEntityTypeLabel(entity.entity_type)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {organizations.find(org => org.id === entity.organization_id)?.name || 'Unknown Org'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">
            <Building2 className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail className="h-4 w-4" />
            Invitations
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entity Details</CardTitle>
              <CardDescription>
                Basic information about this entity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Entity Name</p>
                <p className="text-lg font-medium">{entity.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entity Type</p>
                <p className="text-lg font-medium capitalize">{getEntityTypeLabel(entity.entity_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner Organization</p>
                <p className="text-lg font-medium">
                  {organizations.find(org => org.id === entity.organization_id)?.name || 'Unknown'}
                </p>
              </div>
              {entity.parent_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Parent Entity</p>
                  <p className="text-lg font-medium">
                    {entities.find(e => e.id === entity.parent_id)?.name || 'Unknown'}
                  </p>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(entity.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entity Members</CardTitle>
              <CardDescription>
                Manage organizations that have access to this entity
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
                  <p className="text-muted-foreground">No organizations have access to this entity yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Access Granted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const memberOrg = organizations.find(o => o.id === member.organization_id);
                      const isOwnerOrg = entity.organization_id === member.organization_id;
                      const canModify = activeOrganization?.id === entity.organization_id &&
                                       (activeOrganization?.role === 'OWNER' || activeOrganization?.role === 'ADMIN') &&
                                       !isOwnerOrg;

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {memberOrg?.name || 'Unknown Organization'}
                          </TableCell>
                          <TableCell>
                            {canModify ? (
                              <Select
                                value={member.role}
                                onValueChange={async (newRole) => {
                                  setUpdatingMemberId(member.id);
                                  try {
                                    await updateMemberRole(member.id, newRole);
                                    await fetchMembers({ entity_id: entityId });
                                  } catch (error) {
                                    console.error('Failed to update role:', error);
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
                            {canModify && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={async () => {
                                      if (confirm('Are you sure you want to remove this organization\'s access?')) {
                                        setRemovingMemberId(member.id);
                                        try {
                                          await deleteMember(member.id);
                                          await fetchMembers({ entity_id: entityId });
                                        } catch (error) {
                                          console.error('Failed to remove access:', error);
                                        } finally {
                                          setRemovingMemberId(null);
                                        }
                                      }
                                    }}
                                    disabled={removingMemberId === member.id}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {removingMemberId === member.id ? 'Removing...' : 'Remove Access'}
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
                  <CardTitle>Entity Invitations</CardTitle>
                  <CardDescription>
                    Manage pending invitations for organizations to access this entity
                  </CardDescription>
                </div>
                {activeOrganization?.id === entity.organization_id &&
                 (activeOrganization?.role === 'OWNER' || activeOrganization?.role === 'ADMIN') && (
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
            <CardContent>
              {invitationsError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{invitationsError}</AlertDescription>
                </Alert>
              )}

              {showInviteForm && (
                <Card className="mb-4 border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Invite New Member</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="organization">Organization</Label>
                        <Select
                          value={inviteOrganizationId?.toString() || ''}
                          onValueChange={(value) => setInviteOrganizationId(parseInt(value))}
                        >
                          <SelectTrigger id="organization">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableOrganizations.map((org) => (
                              <SelectItem key={org.id} value={org.id.toString()}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={inviteRole}
                          onValueChange={setInviteRole}
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                            <SelectItem value="EDITOR">Editor</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleInviteSubmit}
                          disabled={!inviteOrganizationId || inviting}
                        >
                          {inviting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                            setInviteOrganizationId(null);
                            setInviteRole('VIEWER');
                          }}
                          disabled={inviting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                      <TableHead>Organization</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => {
                      const invitedOrg = organizations.find(o => o.id === invitation.organization_id);
                      const canCancel = activeOrganization?.id === entity.organization_id &&
                                       (activeOrganization?.role === 'OWNER' || activeOrganization?.role === 'ADMIN');

                      return (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">
                            {invitedOrg?.name || 'Unknown Organization'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{invitation.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={invitation.status === 'PENDING' ? 'outline' : 'default'}>
                              {invitation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {invitation.invited_at ? new Date(invitation.invited_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            {canCancel && invitation.status === 'PENDING' && (
                              <div className="flex gap-1 justify-end">
                                {/* Accept — entity admin can approve incoming requests */}
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={async () => {
                                    setAcceptingInvitationId(invitation.id);
                                    try {
                                      await acceptInvitation(invitation.id);
                                      await fetchInvitations({ entity_id: entityId });
                                      await fetchMembers({ entity_id: entityId });
                                    } finally {
                                      setAcceptingInvitationId(null);
                                    }
                                  }}
                                  disabled={acceptingInvitationId === invitation.id}
                                >
                                  {acceptingInvitationId === invitation.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : 'Accept'}
                                </Button>
                                {/* Reject */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    setRejectingInvitationId(invitation.id);
                                    try {
                                      await rejectInvitation(invitation.id);
                                      await fetchInvitations({ entity_id: entityId });
                                    } finally {
                                      setRejectingInvitationId(null);
                                    }
                                  }}
                                  disabled={rejectingInvitationId === invitation.id}
                                >
                                  {rejectingInvitationId === invitation.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : 'Reject'}
                                </Button>
                                {/* Cancel (delete) */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    setCancellingInvitationId(invitation.id);
                                    try {
                                      await deleteInvitation(invitation.id);
                                      await fetchInvitations({ entity_id: entityId });
                                    } catch (error) {
                                      console.error('Failed to delete invitation:', error);
                                    } finally {
                                      setCancellingInvitationId(null);
                                    }
                                  }}
                                  disabled={cancellingInvitationId === invitation.id}
                                >
                                  {cancellingInvitationId === invitation.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Cancel'
                                  )}
                                </Button>
                              </div>
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

        <TabsContent value="edit" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Entity</CardTitle>
              <CardDescription>
                Update entity details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity-name">Entity Name *</Label>
                  <Input
                    id="entity-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Entity name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entity-type">Entity Type *</Label>
                  <Select
                    value={editEntityType}
                    onValueChange={setEditEntityType}
                  >
                    <SelectTrigger id="entity-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fund">Fund</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="syndicate">Syndicate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Discovery — allows other organizations to find this entity */}
              <div className="flex items-center space-x-2 pt-4 border-t">
                <Checkbox
                  id="discoverable"
                  checked={editDiscoverable}
                  onCheckedChange={(checked) => setEditDiscoverable(checked === true)}
                />
                <div>
                  <Label htmlFor="discoverable">Discoverable</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow other organizations to find this entity when adding stakeholders
                  </p>
                </div>
              </div>

              {/* Invite Code — private access without public discovery */}
              <div className="pt-4 border-t space-y-3">
                <div>
                  <Label>Invite Code</Label>
                  <p className="text-xs text-muted-foreground">
                    Generate a code to share privately. Anyone with this code can join as VIEWER.
                  </p>
                </div>
                {entity.invite_code ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={entity.invite_code}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(entity.invite_code!);
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        await revokeInviteCode(entityId);
                      }}
                    >
                      Revoke
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await generateInviteCode(entityId);
                    }}
                  >
                    Generate Invite Code
                  </Button>
                )}
              </div>

              <Button
                onClick={async () => {
                  if (!editName.trim()) {
                    alert('Please enter a name');
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    await updateEntity(entityId, {
                      name: editName.trim(),
                      entity_type: editEntityType as 'fund' | 'company' | 'individual' | 'syndicate',
                      is_discoverable: editDiscoverable,
                    });
                    await fetchEntities();
                  } catch (error) {
                    console.error('Failed to update entity:', error);
                  } finally {
                    setIsUpdating(false);
                  }
                }}
                disabled={isUpdating}
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
                  <h4 className="font-medium">Delete this entity</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete an entity, there is no going back. This will permanently delete the entity and all associated data.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-entity">
                    Type <span className="font-semibold">{entity?.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-entity"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Entity name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== entity?.name) {
                      alert('Please type the entity name to confirm');
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      await deleteEntity(entityId);
                      router.push('/entities');
                    } catch (error) {
                      console.error('Failed to delete entity:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== entity?.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Entity
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
