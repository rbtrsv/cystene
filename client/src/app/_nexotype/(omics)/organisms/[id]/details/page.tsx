'use client';

import { useParams, useRouter } from 'next/navigation';
import { useOrganisms } from '@/modules/nexotype/hooks/omics/use-organisms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Bug, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function OrganismDetailPage() {
  const params = useParams();
  const router = useRouter();
  const organismId = parseInt(params.id as string);
  const {
    organisms,
    isLoading,
    error,
    setActiveOrganism,
    fetchOrganism,
    updateOrganism,
    deleteOrganism,
    fetchOrganisms
  } = useOrganisms();

  const listItem = organisms.find(o => o.id === organismId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const organism = listItem ?? fetchedItem ?? null;

  // Fetch by ID fallback when list doesn't contain the item (prevents false-404)
  useEffect(() => {
    if (!listItem && organismId && !isLoading) {
      fetchOrganism(organismId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, organismId, isLoading, fetchOrganism]);

  // Settings state
  const [editNcbiTaxonomyId, setEditNcbiTaxonomyId] = useState('');
  const [editScientificName, setEditScientificName] = useState('');
  const [editCommonName, setEditCommonName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when organism changes
  useEffect(() => {
    if (organism) {
      setEditNcbiTaxonomyId(organism.ncbi_taxonomy_id.toString());
      setEditScientificName(organism.scientific_name);
      setEditCommonName(organism.common_name);
    }
  }, [organism]);

  // Set active organism when ID changes
  useEffect(() => {
    if (organismId) {
      setActiveOrganism(organismId);
    }
  }, [organismId, setActiveOrganism]);

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

  if (!organism) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Organism not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/organisms">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Organisms
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Bug className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{organism.scientific_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">{organism.common_name}</span>
                <Badge variant="outline">NCBI: {organism.ncbi_taxonomy_id}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Bug className="h-4 w-4" />
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
              <CardTitle>Organism Details</CardTitle>
              <CardDescription>
                Basic information about this organism
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Scientific Name</p>
                <p className="text-lg font-medium">{organism.scientific_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Common Name</p>
                <p className="text-lg font-medium">{organism.common_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NCBI Taxonomy ID</p>
                <p className="text-lg font-medium">{organism.ncbi_taxonomy_id}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(organism.created_at).toLocaleDateString()}
                </p>
              </div>
              {organism.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(organism.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Organism</CardTitle>
              <CardDescription>
                Update organism details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ncbi-taxonomy-id">NCBI Taxonomy ID</Label>
                  <Input
                    id="ncbi-taxonomy-id"
                    type="number"
                    value={editNcbiTaxonomyId}
                    onChange={(e) => setEditNcbiTaxonomyId(e.target.value)}
                    placeholder="e.g., 9606"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="scientific-name">Scientific Name</Label>
                  <Input
                    id="scientific-name"
                    value={editScientificName}
                    onChange={(e) => setEditScientificName(e.target.value)}
                    placeholder="e.g., Homo sapiens"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="common-name">Common Name</Label>
                  <Input
                    id="common-name"
                    value={editCommonName}
                    onChange={(e) => setEditCommonName(e.target.value)}
                    placeholder="e.g., Human"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editScientificName.trim() || !editCommonName.trim()) {
                    return;
                  }
                  const parsedId = parseInt(editNcbiTaxonomyId, 10);
                  if (isNaN(parsedId) || parsedId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateOrganism(organismId, {
                      ncbi_taxonomy_id: parsedId,
                      scientific_name: editScientificName.trim(),
                      common_name: editCommonName.trim(),
                    });
                    if (success) { await fetchOrganisms(); }
                  } catch (error) {
                    console.error('Failed to update organism:', error);
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
                  <h4 className="font-medium">Delete this organism</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the organism from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-organism">
                    Type <span className="font-semibold">{organism.scientific_name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-organism"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Scientific name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== organism.scientific_name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteOrganism(organismId);
                      if (success) { router.push('/organisms'); } else { setIsDeleting(false); }
                    } catch (error) {
                      console.error('Failed to delete organism:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== organism.scientific_name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Organism
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
