'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSmallMolecules } from '@/modules/nexotype/hooks/asset/use-small-molecules';
import { getAssetTypeLabel } from '@/modules/nexotype/schemas/asset/therapeutic-asset.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Pill, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Page component for this route.
 */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
export default function SmallMoleculeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const moleculeId = parseInt(params.id as string);
  const {
    smallMolecules,
    isLoading,
    error,
    setActiveSmallMolecule,
    fetchSmallMolecule,
    updateSmallMolecule,
    deleteSmallMolecule,
    fetchSmallMolecules
  } = useSmallMolecules();

  const listItem = smallMolecules.find(m => m.id === moleculeId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const molecule = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editUid, setEditUid] = useState('');
  const [editName, setEditName] = useState('');
  const [editProjectCode, setEditProjectCode] = useState('');
  const [editSmiles, setEditSmiles] = useState('');
  const [editInchiKey, setEditInchiKey] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this small molecule
  useEffect(() => {
    if (!listItem && moleculeId && !isLoading) {
      fetchSmallMolecule(moleculeId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, moleculeId, isLoading, fetchSmallMolecule]);

  // Initialize edit form when molecule changes
  useEffect(() => {
    if (molecule) {
      setEditUid(molecule.uid);
      setEditName(molecule.name);
      setEditProjectCode(molecule.project_code || '');
      setEditSmiles(molecule.smiles);
      setEditInchiKey(molecule.inchi_key || '');
    }
  }, [molecule]);

  // Set active small molecule when ID changes
  useEffect(() => {
    if (moleculeId) {
      setActiveSmallMolecule(moleculeId);
    }
  }, [moleculeId, setActiveSmallMolecule]);

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

  if (!molecule) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Small molecule not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/small-molecules">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Small Molecules
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Pill className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{molecule.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{molecule.uid}</Badge>
                {molecule.project_code && <Badge variant="secondary">{molecule.project_code}</Badge>}
                <Badge variant="secondary">{getAssetTypeLabel(molecule.asset_type)}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Pill className="h-4 w-4" />
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
                Basic information about this small molecule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{molecule.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">UID</p>
                <p className="text-lg font-medium">{molecule.uid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Project Code</p>
                <p className="text-lg font-medium">{molecule.project_code || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset Type</p>
                <p className="text-lg font-medium">{getAssetTypeLabel(molecule.asset_type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SMILES</p>
                <p className="text-lg font-mono font-medium break-all">{molecule.smiles}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">InChI Key</p>
                <p className="text-lg font-mono font-medium">{molecule.inchi_key || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(molecule.created_at).toLocaleDateString()}
                </p>
              </div>
              {molecule.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(molecule.updated_at).toLocaleDateString()}
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
                Update small molecule details
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
                  <Label htmlFor="inchi-key">InChI Key</Label>
                  <Input
                    id="inchi-key"
                    value={editInchiKey}
                    onChange={(e) => setEditInchiKey(e.target.value)}
                    placeholder="e.g., QJJXYPPXXYFBGM-LFZNUXCKSA-N"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="smiles">SMILES</Label>
                  <Textarea
                    id="smiles"
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
                    const success = await updateSmallMolecule(moleculeId, {
                      uid: editUid.trim(),
                      name: editName.trim(),
                      project_code: editProjectCode.trim() || undefined,
                      smiles: editSmiles.trim(),
                      inchi_key: editInchiKey.trim() || undefined,
                    });
                    if (success) {
                      await fetchSmallMolecules();
                    }
                  } catch (error) {
                    console.error('Failed to update small molecule:', error);
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
                  <h4 className="font-medium">Delete this small molecule</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the small molecule from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-molecule">
                    Type <span className="font-semibold">{molecule.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-molecule"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== molecule.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteSmallMolecule(moleculeId);
                      if (success) {
                        router.push('/small-molecules');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete small molecule:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== molecule.name}
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
