'use client';

/**
 * Credential Details Page
 *
 * Detail view + edit form for a credential item.
 * Tabs: Details (read-only) + Edit (form) + Danger Zone (delete).
 *
 * SECURITY: encrypted_value is NEVER returned from the API and is NEVER displayed.
 * On edit, leaving the field empty preserves the existing secret.
 *
 * Backend: GET/PUT/DELETE /cybersecurity/credentials/{id}
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCredentials } from '@/modules/cybersecurity/hooks/infrastructure/use-credentials';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import {
  getCredentialTypeLabel,
  type Credential,
  type CredentialType,
} from '@/modules/cybersecurity/schemas/infrastructure/credentials.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, ArrowLeft, KeyRound, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CredentialDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const { activeOrganization } = useOrganizations();
  const {
    fetchCredential,
    updateCredential,
    deleteCredential,
    isLoading,
    error: storeError,
  } = useCredentials();

  // Local state for the fetched item
  const [item, setItem] = useState<Credential | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editCredType, setEditCredType] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEncryptedValue, setEditEncryptedValue] = useState('');
  const [editExtraMetadata, setEditExtraMetadata] = useState('');
  const [editInfrastructureId, setEditInfrastructureId] = useState('');
  const [editIsActive, setEditIsActive] = useState('true');

  // Fetch item on mount
  useEffect(() => {
    const load = async () => {
      const data = await fetchCredential(id);
      if (data) {
        setItem(data);
        // Populate edit form
        setEditName(data.name);
        setEditCredType(data.cred_type);
        setEditUsername(data.username || '');
        setEditEncryptedValue(''); // Never pre-populated — server does not return it
        setEditExtraMetadata(data.extra_metadata || '');
        setEditInfrastructureId(data.infrastructure_id ? String(data.infrastructure_id) : '');
        setEditIsActive(data.is_active ? 'true' : 'false');
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);

    // Build update payload — only include encrypted_value if user entered a new one
    const payload: Record<string, unknown> = {
      name: editName,
      cred_type: editCredType as CredentialType,
      username: editUsername || null,
      extra_metadata: editExtraMetadata || null,
      infrastructure_id: editInfrastructureId ? parseInt(editInfrastructureId) : null,
      is_active: editIsActive === 'true',
    };

    // Only send encrypted_value if the user provided a new secret
    if (editEncryptedValue) {
      payload.encrypted_value = editEncryptedValue;
    }

    const success = await updateCredential(id, payload as Parameters<typeof updateCredential>[1]);
    setIsSaving(false);
    if (success) {
      // Refresh item
      const updated = await fetchCredential(id);
      if (updated) setItem(updated);
      // Clear the secret field after successful save
      setEditEncryptedValue('');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteCredential(id);
    setIsDeleting(false);
    if (success) {
      router.push('/credentials');
    }
  };

  // ==========================================
  // Render
  // ==========================================

  if (isLoading && !item) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Credential not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/credentials">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Credentials
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <KeyRound className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <p className="text-muted-foreground">
              {getCredentialTypeLabel(item.cred_type)} &middot; {item.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credential Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{item.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Type</p><p className="font-medium">{getCredentialTypeLabel(item.cred_type)}</p></div>
                <div><p className="text-sm text-muted-foreground">Username</p><p className="font-medium">{item.username || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Infrastructure ID</p><p className="font-medium">{item.infrastructure_id ?? '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p><p className="font-medium">{item.is_active ? 'Active' : 'Inactive'}</p></div>
                <div><p className="text-sm text-muted-foreground">Secret Value</p><p className="font-mono font-medium">••••••••</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium">{new Date(item.created_at).toLocaleString()}</p></div>
                <div><p className="text-sm text-muted-foreground">Last Used</p><p className="font-medium">{item.last_used_at ? new Date(item.last_used_at).toLocaleString() : '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Last Verified</p><p className="font-medium">{item.last_verified_at ? new Date(item.last_verified_at).toLocaleString() : '—'}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Credential</CardTitle>
              <CardDescription>Update credential details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editCredType} onValueChange={setEditCredType} disabled={isSaving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ssh_key">SSH Key</SelectItem>
                    <SelectItem value="ssh_password">SSH Password</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="domain_credentials">Domain Credentials</SelectItem>
                    <SelectItem value="service_account">Service Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Secret Value</Label>
                <Textarea
                  value={editEncryptedValue}
                  onChange={(e) => setEditEncryptedValue(e.target.value)}
                  disabled={isSaving}
                  className="font-mono"
                  style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                  placeholder="Leave empty to keep existing secret"
                />
                <p className="text-xs text-muted-foreground">
                  Only fill this if you want to replace the current secret. Will be encrypted server-side.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Extra Metadata (JSON)</Label>
                <Textarea
                  value={editExtraMetadata}
                  onChange={(e) => setEditExtraMetadata(e.target.value)}
                  disabled={isSaving}
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Infrastructure ID</Label>
                  <Input
                    type="number"
                    value={editInfrastructureId}
                    onChange={(e) => setEditInfrastructureId(e.target.value)}
                    disabled={isSaving}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editIsActive} onValueChange={setEditIsActive} disabled={isSaving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete this credential. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Type <span className="font-mono font-bold">{item.name}</span> to confirm deletion.
              </p>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={item.name}
                disabled={isDeleting}
              />
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteConfirm !== item.name || isDeleting}
              >
                {isDeleting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="mr-2 h-4 w-4" /> Delete Credential</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
