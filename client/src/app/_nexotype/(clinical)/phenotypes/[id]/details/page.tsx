'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePhenotypes } from '@/modules/nexotype/hooks/clinical/use-phenotypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Activity, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function PhenotypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const phenotypeId = parseInt(params.id as string);
  const {
    phenotypes,
    isLoading,
    error,
    setActivePhenotype,
    fetchPhenotype,
    updatePhenotype,
    deletePhenotype,
    fetchPhenotypes
  } = usePhenotypes();

  const listItem = phenotypes.find(p => p.id === phenotypeId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const phenotype = listItem ?? fetchedItem ?? null;

  // Fetch by ID when the list doesn't contain this phenotype (prevents false-404)
  useEffect(() => {
    if (!listItem && phenotypeId && !isLoading) {
      fetchPhenotype(phenotypeId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, phenotypeId, isLoading, fetchPhenotype]);

  // Settings state
  const [editName, setEditName] = useState('');
  const [editHpoId, setEditHpoId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when phenotype changes
  useEffect(() => {
    if (phenotype) {
      setEditName(phenotype.name);
      setEditHpoId(phenotype.hpo_id || '');
    }
  }, [phenotype]);

  // Set active phenotype when ID changes
  useEffect(() => {
    if (phenotypeId) {
      setActivePhenotype(phenotypeId);
    }
  }, [phenotypeId, setActivePhenotype]);

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

  if (!phenotype) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Phenotype not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/phenotypes">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Phenotypes
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{phenotype.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {phenotype.hpo_id && (
                  <Badge variant="outline">HPO: {phenotype.hpo_id}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4" />
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
              <CardTitle>Phenotype Details</CardTitle>
              <CardDescription>
                Basic information about this phenotype
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{phenotype.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">HPO ID</p>
                <p className="text-lg font-medium">{phenotype.hpo_id || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(phenotype.created_at).toLocaleDateString()}
                </p>
              </div>
              {phenotype.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(phenotype.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Phenotype</CardTitle>
              <CardDescription>
                Update phenotype details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phenotype-name">Name</Label>
                  <Input
                    id="phenotype-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., Grip Strength"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hpo-id">HPO ID</Label>
                  <Input
                    id="hpo-id"
                    value={editHpoId}
                    onChange={(e) => setEditHpoId(e.target.value)}
                    placeholder="e.g., HP:0003236"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editName.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updatePhenotype(phenotypeId, {
                      name: editName.trim(),
                      hpo_id: editHpoId || null,
                    });
                    if (success) {
                      await fetchPhenotypes();
                    }
                  } catch (error) {
                    console.error('Failed to update phenotype:', error);
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
                  <h4 className="font-medium">Delete this phenotype</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the phenotype from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-phenotype">
                    Type <span className="font-semibold">{phenotype.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-phenotype"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Phenotype name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== phenotype.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deletePhenotype(phenotypeId);
                      if (success) {
                        router.push('/phenotypes');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete phenotype:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== phenotype.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Phenotype
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
