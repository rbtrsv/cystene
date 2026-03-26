'use client';

import { useParams, useRouter } from 'next/navigation';
import { useBiologics } from '@/modules/nexotype/hooks/asset/use-biologics';
import { BIOLOGIC_TYPE_OPTIONS, type BiologicType } from '@/modules/nexotype/schemas/asset/biologic.schemas';
import { getAssetTypeLabel } from '@/modules/nexotype/schemas/asset/therapeutic-asset.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, FlaskConical, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Page component for this route.
 */
export default function BiologicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const biologicId = parseInt(params.id as string);
  const {
    biologics,
    isLoading,
    error,
    setActiveBiologic,
    fetchBiologic,
    updateBiologic,
    deleteBiologic,
    fetchBiologics
  } = useBiologics();

  const listItem = biologics.find(m => m.id === biologicId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const biologic = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editUid, setEditUid] = useState('');
  const [editName, setEditName] = useState('');
  const [editProjectCode, setEditProjectCode] = useState('');
  const [editSequenceAa, setEditSmiles] = useState('');
  const [editBiologicType, setEditInchiKey] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this biologic
  useEffect(() => {
    if (!listItem && biologicId && !isLoading) {
      fetchBiologic(biologicId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, biologicId, isLoading, fetchBiologic]);

  // Initialize edit form when biologic changes
  useEffect(() => {
    if (biologic) {
      setEditUid(biologic.uid);
      setEditName(biologic.name);
      setEditProjectCode(biologic.project_code || '');
      setEditSmiles(biologic.sequence_aa);
      setEditInchiKey(biologic.biologic_type || '');
    }
  }, [biologic]);

  // Set active biologic when ID changes
  useEffect(() => {
    if (biologicId) {
      setActiveBiologic(biologicId);
    }
  }, [biologicId, setActiveBiologic]);

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

  if (!biologic) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Biologic not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/biologics">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Biologics
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{biologic.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{biologic.uid}</Badge>
                {biologic.project_code && <Badge variant="secondary">{biologic.project_code}</Badge>}
                <Badge variant="secondary">{getAssetTypeLabel(biologic.asset_type)}</Badge>
              </div>
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

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Biologic Details</CardTitle>
              <CardDescription>
                Basic information about this biologic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{biologic.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">UID</p>
                <p className="text-lg font-medium">{biologic.uid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Project Code</p>
                <p className="text-lg font-medium">{biologic.project_code || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset Type</p>
                <p className="text-lg font-medium">{getAssetTypeLabel(biologic.asset_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amino Acid Sequence</p>
                <p className="text-lg font-mono font-medium break-all">{biologic.sequence_aa}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Biologic Type</p>
                <p className="text-lg font-mono font-medium">{biologic.biologic_type || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(biologic.created_at).toLocaleDateString()}
                </p>
              </div>
              {biologic.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(biologic.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Biologic</CardTitle>
              <CardDescription>
                Update biologic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uid">UID</Label>
                  <Input
                    id="uid"
                    value={editUid}
                    onChange={(e) => setEditUid(e.target.value)}
                    placeholder="e.g., BIO-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., Rapamycin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-code">Project Code</Label>
                  <Input
                    id="project-code"
                    value={editProjectCode}
                    onChange={(e) => setEditProjectCode(e.target.value)}
                    placeholder="e.g., PRJ-RAPA-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Biologic Type</Label>
                  <Select value={editBiologicType} onValueChange={setEditInchiKey}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select biologic type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BIOLOGIC_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sequence_aa">Amino Acid Sequence</Label>
                  <Textarea
                    id="sequence_aa"
                    value={editSequenceAa}
                    onChange={(e) => setEditSmiles(e.target.value)}
                    placeholder="e.g., MKVLWAALLVTFLAGCQA..."
                    className="font-mono"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editName.trim() || !editUid.trim() || !editSequenceAa.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateBiologic(biologicId, {
                      uid: editUid.trim(),
                      name: editName.trim(),
                      project_code: editProjectCode.trim() || undefined,
                      sequence_aa: editSequenceAa.trim(),
                      biologic_type: editBiologicType as BiologicType || undefined,
                    });
                    if (success) {
                      await fetchBiologics();
                    }
                  } catch (error) {
                    console.error('Failed to update biologic:', error);
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
                  <h4 className="font-medium">Delete this biologic</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the biologic from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-biologic">
                    Type <span className="font-semibold">{biologic.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-biologic"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== biologic.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteBiologic(biologicId);
                      if (success) {
                        router.push('/biologics');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete biologic:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== biologic.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Biologic
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
