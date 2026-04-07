'use client';

/**
 * Infrastructure Details Page
 *
 * Detail view + edit form for an infrastructure item.
 * Tabs: Details (read-only) + Edit (form) + Danger Zone (delete).
 *
 * Backend: GET/PUT/DELETE /cybersecurity/infrastructure/{id}
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInfrastructures } from '@/modules/cybersecurity/hooks/infrastructure/use-infrastructure';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import {
  getInfraTypeLabel,
  getEnvironmentLabel,
  getCriticalityLabel,
  type Infrastructure,
} from '@/modules/cybersecurity/schemas/infrastructure/infrastructure.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, ArrowLeft, Server, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function InfrastructureDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const { activeOrganization } = useOrganizations();
  const {
    fetchInfrastructure,
    updateInfrastructure,
    deleteInfrastructure,
    isLoading,
    error: storeError,
  } = useInfrastructures();

  // Local state for the fetched item
  const [item, setItem] = useState<Infrastructure | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editInfraType, setEditInfraType] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEnvironment, setEditEnvironment] = useState('');
  const [editCriticality, setEditCriticality] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editIpAddress, setEditIpAddress] = useState('');
  const [editHostname, setEditHostname] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCloudProvider, setEditCloudProvider] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Fetch item on mount
  useEffect(() => {
    const load = async () => {
      const data = await fetchInfrastructure(id);
      if (data) {
        setItem(data);
        // Populate edit form
        setEditName(data.name);
        setEditInfraType(data.infra_type);
        setEditDescription(data.description || '');
        setEditEnvironment(data.environment);
        setEditCriticality(data.criticality);
        setEditOwner(data.owner || '');
        setEditIpAddress(data.ip_address || '');
        setEditHostname(data.hostname || '');
        setEditUrl(data.url || '');
        setEditCloudProvider(data.cloud_provider || '');
        setEditRegion(data.region || '');
        setEditTags(data.tags || '');
        setEditNotes(data.notes || '');
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateInfrastructure(id, {
      name: editName,
      infra_type: editInfraType as Infrastructure['infra_type'],
      description: editDescription || null,
      environment: editEnvironment as Infrastructure['environment'],
      criticality: editCriticality as Infrastructure['criticality'],
      owner: editOwner || null,
      ip_address: editIpAddress || null,
      hostname: editHostname || null,
      url: editUrl || null,
      cloud_provider: editCloudProvider || null,
      region: editRegion || null,
      tags: editTags || null,
      notes: editNotes || null,
    });
    setIsSaving(false);
    if (success) {
      // Refresh item
      const updated = await fetchInfrastructure(id);
      if (updated) setItem(updated);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteInfrastructure(id);
    setIsDeleting(false);
    if (success) {
      router.push('/infrastructure');
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
          <AlertDescription>Infrastructure item not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/infrastructure">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Infrastructure
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Server className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <p className="text-muted-foreground">
              {getInfraTypeLabel(item.infra_type)} &middot; {getEnvironmentLabel(item.environment)} &middot; {getCriticalityLabel(item.criticality)}
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
              <CardTitle>Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{item.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Type</p><p className="font-medium">{getInfraTypeLabel(item.infra_type)}</p></div>
                <div><p className="text-sm text-muted-foreground">Environment</p><p className="font-medium">{getEnvironmentLabel(item.environment)}</p></div>
                <div><p className="text-sm text-muted-foreground">Criticality</p><p className="font-medium">{getCriticalityLabel(item.criticality)}</p></div>
                <div><p className="text-sm text-muted-foreground">Owner</p><p className="font-medium">{item.owner || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium">{new Date(item.created_at).toLocaleString()}</p></div>
              </div>
              {item.description && (
                <div><p className="text-sm text-muted-foreground">Description</p><p>{item.description}</p></div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">IP Address</p><p className="font-mono">{item.ip_address || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Hostname</p><p className="font-mono">{item.hostname || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">URL</p><p className="font-mono">{item.url || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Cloud Provider</p><p>{item.cloud_provider || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Region</p><p>{item.region || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Tags</p><p>{item.tags || '—'}</p></div>
              </div>
              {item.notes && (
                <div className="mt-4"><p className="text-sm text-muted-foreground">Notes</p><p>{item.notes}</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Infrastructure</CardTitle>
              <CardDescription>Update infrastructure details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editInfraType} onValueChange={setEditInfraType} disabled={isSaving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="network_device">Network Device</SelectItem>
                    <SelectItem value="cloud_service">Cloud Service</SelectItem>
                    <SelectItem value="cloud_account">Cloud Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} disabled={isSaving} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Environment</Label>
                  <Select value={editEnvironment} onValueChange={setEditEnvironment} disabled={isSaving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Criticality</Label>
                  <Select value={editCriticality} onValueChange={setEditCriticality} disabled={isSaving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Owner</Label>
                <Input value={editOwner} onChange={(e) => setEditOwner(e.target.value)} disabled={isSaving} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IP Address</Label>
                  <Input value={editIpAddress} onChange={(e) => setEditIpAddress(e.target.value)} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label>Hostname</Label>
                  <Input value={editHostname} onChange={(e) => setEditHostname(e.target.value)} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label>Cloud Provider</Label>
                  <Input value={editCloudProvider} onChange={(e) => setEditCloudProvider(e.target.value)} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input value={editRegion} onChange={(e) => setEditRegion(e.target.value)} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} disabled={isSaving} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} disabled={isSaving} />
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
                Permanently delete this infrastructure item. This action cannot be undone.
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
                  <><Trash2 className="mr-2 h-4 w-4" /> Delete Infrastructure</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
