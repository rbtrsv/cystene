'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { useOrganizationInvitations } from '@/modules/accounts/hooks/use-organization-invitations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Building, Plus, CheckCircle, Loader2, Mail, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function OrganizationsPage() {
  const router = useRouter();
  const { organizations, isLoading, error, activeOrganization, setActiveOrganization } = useOrganizations();
  const {
    myInvitations,
    error: invitationsError,
    fetchMyInvitations,
    acceptInvitation,
    rejectInvitation
  } = useOrganizationInvitations();

  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMyInvitations();
  }, [fetchMyInvitations]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organizations and subscriptions
          </p>
        </div>
        <Link href="/organizations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </Link>
      </div>

      {myInvitations && myInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              You have been invited to join the following organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitationsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{invitationsError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              {myInvitations.map((invitation) => (
                <Card key={invitation.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold">{invitation.organization_name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Role:</span>
                          <Badge variant="secondary">{invitation.role}</Badge>
                        </div>
                        {invitation.created_at && (
                          <p className="text-xs text-muted-foreground">
                            Invited {new Date(invitation.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={acceptingId === invitation.id || rejectingId === invitation.id}
                          onClick={async () => {
                            setAcceptingId(invitation.id);
                            try {
                              await acceptInvitation(invitation.id);
                              await fetchMyInvitations();
                            } catch (error) {
                              console.error('Failed to accept invitation:', error);
                            } finally {
                              setAcceptingId(null);
                            }
                          }}
                        >
                          {acceptingId === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={acceptingId === invitation.id || rejectingId === invitation.id}
                          onClick={async () => {
                            setRejectingId(invitation.id);
                            try {
                              await rejectInvitation(invitation.id);
                              await fetchMyInvitations();
                            } catch (error) {
                              console.error('Failed to reject invitation:', error);
                            } finally {
                              setRejectingId(null);
                            }
                          }}
                        >
                          {rejectingId === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">My Organizations</h2>
        {organizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first organization to get started
            </p>
            <Link href="/organizations/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className={`relative cursor-pointer transition-colors hover:border-primary ${
                activeOrganization?.id === org.id ? 'border-primary' : ''
              }`}
              onClick={() => {
                setActiveOrganization(org.id);
              }}
            >
              {activeOrganization?.id === org.id && (
                <div className="absolute top-3 right-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {org.name}
                </CardTitle>
                <CardDescription>
                  Role: <span className="font-medium">{org.role}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Created: </span>
                    {new Date(org.created_at).toLocaleDateString()}
                  </div>
                  <div className="pt-2 border-t space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveOrganization(org.id);
                        router.push(`/organizations/${org.id}/details`);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveOrganization(org.id);
                        router.push(`/organizations/${org.id}/subscription`);
                      }}
                    >
                      Manage Subscription
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

        </div>
        )}
      </div>
    </div>
  );
}
