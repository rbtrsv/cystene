'use client';

import { useParams, useRouter } from 'next/navigation';
import { useOligonucleotides } from '@/modules/nexotype/hooks/asset/use-oligonucleotides';
import { getAssetTypeLabel } from '@/modules/nexotype/schemas/asset/therapeutic-asset.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Brackets, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Page component for this route.
 */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function OligonucleotideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const oligonucleotideId = parseInt(params.id as string);
  const {
    oligonucleotides,
    isLoading,
    error,
    setActiveOligonucleotide,
    fetchOligonucleotide,
    updateOligonucleotide,
    deleteOligonucleotide,
    fetchOligonucleotides
  } = useOligonucleotides();

  const listItem = oligonucleotides.find(m => m.id === oligonucleotideId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const oligonucleotide = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editUid, setEditUid] = useState('');
  const [editName, setEditName] = useState('');
  const [editProjectCode, setEditProjectCode] = useState('');
  const [editSmiles, setEditSmiles] = useState('');
  const [editInchiKey, setEditInchiKey] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this oligonucleotide
  useEffect(() => {
    if (!listItem && oligonucleotideId && !isLoading) {
      fetchOligonucleotide(oligonucleotideId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, oligonucleotideId, isLoading, fetchOligonucleotide]);

  // Initialize edit form when oligonucleotide changes
  useEffect(() => {
    if (oligonucleotide) {
      setEditUid(oligonucleotide.uid);
      setEditName(oligonucleotide.name);
      setEditProjectCode(oligonucleotide.project_code || '');
      setEditSmiles(oligonucleotide.sequence_na);
      setEditInchiKey(oligonucleotide.modification_type || '');
    }
  }, [oligonucleotide]);

  // Set active oligonucleotide when ID changes
  useEffect(() => {
    if (oligonucleotideId) {
      setActiveOligonucleotide(oligonucleotideId);
    }
  }, [oligonucleotideId, setActiveOligonucleotide]);

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

  if (!oligonucleotide) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Small oligonucleotide not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/oligonucleotides">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Small Molecules
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Brackets className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{oligonucleotide.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{oligonucleotide.uid}</Badge>
                {oligonucleotide.project_code && <Badge variant="secondary">{oligonucleotide.project_code}</Badge>}
                <Badge variant="secondary">{getAssetTypeLabel(oligonucleotide.asset_type)}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Brackets className="h-4 w-4" />
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
              <CardTitle>Small Molecule Details</CardTitle>
              <CardDescription>
                Basic information about this oligonucleotide
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{oligonucleotide.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">UID</p>
                <p className="text-lg font-medium">{oligonucleotide.uid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Project Code</p>
                <p className="text-lg font-medium">{oligonucleotide.project_code || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset Type</p>
                <p className="text-lg font-medium">{getAssetTypeLabel(oligonucleotide.asset_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nucleotide Sequence</p>
                <p className="text-lg font-mono font-medium break-all">{oligonucleotide.sequence_na}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modification Type</p>
                <p className="text-lg font-mono font-medium">{oligonucleotide.modification_type || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(oligonucleotide.created_at).toLocaleDateString()}
                </p>
              </div>
              {oligonucleotide.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(oligonucleotide.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Small Molecule</CardTitle>
              <CardDescription>
                Update oligonucleotide details
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
                    placeholder="e.g., SM-001"
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
                  <Label htmlFor="inchi-key">Modification Type</Label>
                  <Input
                    id="inchi-key"
                    value={editInchiKey}
                    onChange={(e) => setEditInchiKey(e.target.value)}
                    placeholder="e.g., QJJXYPPXXYFBGM-LFZNUXCKSA-N"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sequence_na">Nucleotide Sequence</Label>
                  <Textarea
                    id="sequence_na"
                    value={editSmiles}
                    onChange={(e) => setEditSmiles(e.target.value)}
                    placeholder="e.g., CC1CCC2CC(/C=C/C=C/..."
                    className="font-mono"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editName.trim() || !editUid.trim() || !editSmiles.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateOligonucleotide(oligonucleotideId, {
                      uid: editUid.trim(),
                      name: editName.trim(),
                      project_code: editProjectCode.trim() || undefined,
                      sequence_na: editSmiles.trim(),
                      modification_type: editInchiKey.trim() || undefined,
                    });
                    if (success) {
                      await fetchOligonucleotides();
                    }
                  } catch (error) {
                    console.error('Failed to update oligonucleotide:', error);
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
                  <h4 className="font-medium">Delete this oligonucleotide</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the oligonucleotide from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-oligonucleotide">
                    Type <span className="font-semibold">{oligonucleotide.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-oligonucleotide"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== oligonucleotide.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteOligonucleotide(oligonucleotideId);
                      if (success) {
                        router.push('/oligonucleotides');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete oligonucleotide:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== oligonucleotide.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Small Molecule
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
