'use client';

import { useParams, useRouter } from 'next/navigation';
import { useExternalReferences } from '@/modules/nexotype/hooks/standardization/use-external-references';
import { ENTITY_TYPE_OPTIONS, getEntityTypeLabel, type EntityType } from '@/modules/nexotype/schemas/standardization/external-reference.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Link2, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Page component for this route.
 */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
export default function ExternalReferenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const externalReferenceId = parseInt(params.id as string);
  const {
    externalReferences,
    isLoading,
    error,
    setActiveExternalReference,
    fetchExternalReference,
    updateExternalReference,
    deleteExternalReference,
    fetchExternalReferences
  } = useExternalReferences();

  const listItem = externalReferences.find(er => er.id === externalReferenceId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const externalReference = listItem ?? fetchedItem ?? null;

  // Fetch by ID fallback when list doesn't contain the item (prevents false-404)
  useEffect(() => {
    if (!listItem && externalReferenceId && !isLoading) {
      fetchExternalReference(externalReferenceId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, externalReferenceId, isLoading, fetchExternalReference]);

  // Settings state
  const [editEntityType, setEditEntityType] = useState('');
  const [editEntityId, setEditEntityId] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editExternalId, setEditExternalId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Initialize edit form when external reference changes
  useEffect(() => {
    if (externalReference) {
      setEditEntityType(externalReference.entity_type);
      setEditEntityId(externalReference.entity_id.toString());
      setEditSource(externalReference.source);
      setEditExternalId(externalReference.external_id);
    }
  }, [externalReference]);

  // Set active external reference when ID changes
  useEffect(() => {
    if (externalReferenceId) {
      setActiveExternalReference(externalReferenceId);
    }
  }, [externalReferenceId, setActiveExternalReference]);

  // Guard: loading state.
  if (isLoading) {
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

  if (!externalReference) {
    return (
      <Alert variant="destructive">
        <AlertDescription>External reference not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/external-references">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to External References
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Link2 className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{externalReference.external_id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{externalReference.source}</Badge>
                <span className="text-muted-foreground">{getEntityTypeLabel(externalReference.entity_type)} #{externalReference.entity_id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Link2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Reference Details</CardTitle>
              <CardDescription>
                Basic information about this external reference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Entity Type</p>
                <p className="text-lg font-medium">{getEntityTypeLabel(externalReference.entity_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entity ID</p>
                <p className="text-lg font-medium">{externalReference.entity_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="text-lg font-medium">{externalReference.source}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">External ID</p>
                <p className="text-lg font-medium">{externalReference.external_id}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(externalReference.created_at).toLocaleDateString()}
                </p>
              </div>
              {externalReference.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(externalReference.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit External Reference</CardTitle>
              <CardDescription>
                Update external reference details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Select value={editEntityType} onValueChange={setEditEntityType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entity_id">Entity ID</Label>
                  <Input
                    id="entity_id"
                    type="number"
                    value={editEntityId}
                    onChange={(e) => setEditEntityId(e.target.value)}
                    placeholder="e.g., 42"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    placeholder="e.g., PDB, ClinVar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="external_id">External ID</Label>
                  <Input
                    id="external_id"
                    value={editExternalId}
                    onChange={(e) => setEditExternalId(e.target.value)}
                    placeholder="e.g., 4F5S"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editEntityType || !editEntityId.trim() || !editSource.trim() || !editExternalId.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateExternalReference(externalReferenceId, {
                      entity_type: editEntityType as EntityType,
                      entity_id: parseInt(editEntityId),
                      source: editSource.trim(),
                      external_id: editExternalId.trim(),
                    });
                    if (success) { await fetchExternalReferences(); }
                  } catch (error) {
                    console.error('Failed to update external reference:', error);
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
                Destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this external reference</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the external reference from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-external-reference">
                    Type <span className="font-semibold">{externalReference.external_id}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-external-reference"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="External ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmText !== externalReference.external_id) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteExternalReference(externalReferenceId);
                      if (success) { router.push('/external-references'); } else { setIsDeleting(false); }
                    } catch (error) {
                      console.error('Failed to delete external reference:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmText !== externalReference.external_id}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete External Reference
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
