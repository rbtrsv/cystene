'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTherapeuticPeptides } from '@/modules/nexotype/hooks/asset/use-therapeutic-peptides';
import { getAssetTypeLabel } from '@/modules/nexotype/schemas/asset/therapeutic-asset.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Scissors, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Page component for this route.
 */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function TherapeuticPeptideDetailPage() {
  const params = useParams();
  const router = useRouter();
  const therapeuticPeptideId = parseInt(params.id as string);
  const {
    therapeuticPeptides,
    isLoading,
    error,
    setActiveTherapeuticPeptide,
    fetchTherapeuticPeptide,
    updateTherapeuticPeptide,
    deleteTherapeuticPeptide,
    fetchTherapeuticPeptides
  } = useTherapeuticPeptides();

  const listItem = therapeuticPeptides.find(m => m.id === therapeuticPeptideId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const therapeuticPeptide = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editUid, setEditUid] = useState('');
  const [editName, setEditName] = useState('');
  const [editProjectCode, setEditProjectCode] = useState('');
  const [editSmiles, setEditSmiles] = useState('');
  const [editInchiKey, setEditInchiKey] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this therapeutic peptide
  useEffect(() => {
    if (!listItem && therapeuticPeptideId && !isLoading) {
      fetchTherapeuticPeptide(therapeuticPeptideId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, therapeuticPeptideId, isLoading, fetchTherapeuticPeptide]);

  // Initialize edit form when therapeuticPeptide changes
  useEffect(() => {
    if (therapeuticPeptide) {
      setEditUid(therapeuticPeptide.uid);
      setEditName(therapeuticPeptide.name);
      setEditProjectCode(therapeuticPeptide.project_code || '');
      setEditSmiles(therapeuticPeptide.sequence_aa);
      setEditInchiKey(therapeuticPeptide.purity_grade || '');
    }
  }, [therapeuticPeptide]);

  // Set active therapeutic peptide when ID changes
  useEffect(() => {
    if (therapeuticPeptideId) {
      setActiveTherapeuticPeptide(therapeuticPeptideId);
    }
  }, [therapeuticPeptideId, setActiveTherapeuticPeptide]);

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

  if (!therapeuticPeptide) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Small therapeuticPeptide not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/therapeutic-peptides">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Small Molecules
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Scissors className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{therapeuticPeptide.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{therapeuticPeptide.uid}</Badge>
                {therapeuticPeptide.project_code && <Badge variant="secondary">{therapeuticPeptide.project_code}</Badge>}
                <Badge variant="secondary">{getAssetTypeLabel(therapeuticPeptide.asset_type)}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Scissors className="h-4 w-4" />
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
                Basic information about this therapeutic peptide
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{therapeuticPeptide.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">UID</p>
                <p className="text-lg font-medium">{therapeuticPeptide.uid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Project Code</p>
                <p className="text-lg font-medium">{therapeuticPeptide.project_code || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset Type</p>
                <p className="text-lg font-medium">{getAssetTypeLabel(therapeuticPeptide.asset_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amino Acid Sequence</p>
                <p className="text-lg font-mono font-medium break-all">{therapeuticPeptide.sequence_aa}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purity Grade</p>
                <p className="text-lg font-mono font-medium">{therapeuticPeptide.purity_grade || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(therapeuticPeptide.created_at).toLocaleDateString()}
                </p>
              </div>
              {therapeuticPeptide.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(therapeuticPeptide.updated_at).toLocaleDateString()}
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
                Update therapeutic peptide details
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
                  <Label htmlFor="inchi-key">Purity Grade</Label>
                  <Input
                    id="inchi-key"
                    value={editInchiKey}
                    onChange={(e) => setEditInchiKey(e.target.value)}
                    placeholder="e.g., QJJXYPPXXYFBGM-LFZNUXCKSA-N"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sequence_aa">Amino Acid Sequence</Label>
                  <Textarea
                    id="sequence_aa"
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
                    const success = await updateTherapeuticPeptide(therapeuticPeptideId, {
                      uid: editUid.trim(),
                      name: editName.trim(),
                      project_code: editProjectCode.trim() || undefined,
                      sequence_aa: editSmiles.trim(),
                      purity_grade: editInchiKey.trim() || undefined,
                    });
                    if (success) {
                      await fetchTherapeuticPeptides();
                    }
                  } catch (error) {
                    console.error('Failed to update therapeutic peptide:', error);
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
                  <h4 className="font-medium">Delete this therapeutic peptide</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the therapeutic peptide from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-therapeuticPeptide">
                    Type <span className="font-semibold">{therapeuticPeptide.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-therapeuticPeptide"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== therapeuticPeptide.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteTherapeuticPeptide(therapeuticPeptideId);
                      if (success) {
                        router.push('/therapeutic-peptides');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete therapeutic peptide:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== therapeuticPeptide.name}
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
