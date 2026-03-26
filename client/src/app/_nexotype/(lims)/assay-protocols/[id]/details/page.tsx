'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, FlaskConical, Loader2, Settings, Trash2 } from 'lucide-react';
import { useAssayProtocols } from '@/modules/nexotype/hooks/lims/use-assay-protocols';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/** Detail/settings page for AssayProtocol with list fallback fetch-by-id. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function AssayProtocolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assayProtocolId = parseInt(params.id as string, 10);

  const {
    assayProtocols,
    isLoading,
    error,
    setActiveAssayProtocol,
    fetchAssayProtocol,
    updateAssayProtocol,
    deleteAssayProtocol,
    fetchAssayProtocols,
  } = useAssayProtocols();

  const listItem = assayProtocols.find((protocol) => protocol.id === assayProtocolId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [methodDescription, setMethodDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Fetch directly when list is not yet hydrated.
  useEffect(() => {
    if (!listItem && assayProtocolId && !isLoading) {
      fetchAssayProtocol(assayProtocolId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, assayProtocolId, isLoading, fetchAssayProtocol]);

  // Keep edit form synced with loaded record.
  useEffect(() => {
    if (!item) return;
    setName(item.name);
    setVersion(item.version);
    setMethodDescription(item.method_description ?? '');
  }, [item]);

  useEffect(() => {
    if (assayProtocolId) setActiveAssayProtocol(assayProtocolId);
  }, [assayProtocolId, setActiveAssayProtocol]);

  // Guard: loading state.
  if (isLoading) {
      // Render page content.
  return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Guard: error state.
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!item) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Assay protocol not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/assay-protocols">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Assay Protocols
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <FlaskConical className="h-8 w-8 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{item.name}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">Version {item.version}</Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <FlaskConical className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Assay Protocol Details</CardTitle>
              <CardDescription>Core protocol metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{item.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="text-lg font-medium">{item.version}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Method Description</p>
                <p className="text-lg font-medium">{item.method_description ?? '—'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Assay Protocol</CardTitle>
              <CardDescription>Update fields and save protocol changes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method-description">Method Description</Label>
                  <Input
                    id="method-description"
                    value={methodDescription}
                    onChange={(e) => setMethodDescription(e.target.value)}
                  />
                </div>
              </div>

              <Button
                disabled={isUpdating}
                onClick={async () => {
                  if (!name.trim() || !version.trim()) return;

                  setIsUpdating(true);
                  try {
                    const success = await updateAssayProtocol(assayProtocolId, {
                      name: name.trim(),
                      version: version.trim(),
                      method_description: methodDescription.trim() || null,
                    });
                    if (success) await fetchAssayProtocols();
                  } finally {
                    setIsUpdating(false);
                  }
                }}
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

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will remove the assay protocol from active use. The record will be soft-deleted.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm-delete-assay-protocol">
                  Type <span className="font-semibold">{item.name}</span> to confirm
                </Label>
                <Input
                  id="confirm-delete-assay-protocol"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Protocol Name"
                />
              </div>
              <Button
                variant="destructive"
                disabled={isDeleting || deleteConfirmText !== item.name}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const success = await deleteAssayProtocol(assayProtocolId);
                    if (success) router.push('/assay-protocols');
                    else setIsDeleting(false);
                  } catch {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Assay Protocol
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
