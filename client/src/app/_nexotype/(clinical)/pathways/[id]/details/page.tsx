'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePathways } from '@/modules/nexotype/hooks/clinical/use-pathways';
import { LONGEVITY_TIER_OPTIONS, type LongevityTier } from '@/modules/nexotype/schemas/clinical/pathway.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Route, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function PathwayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathwayId = parseInt(params.id as string);
  const {
    pathways,
    isLoading,
    error,
    setActivePathway,
    fetchPathway,
    updatePathway,
    deletePathway,
    fetchPathways
  } = usePathways();

  const listItem = pathways.find(p => p.id === pathwayId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const pathway = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editName, setEditName] = useState('');
  const [editKeggId, setEditKeggId] = useState('');
  const [editLongevityTier, setEditLongevityTier] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this pathway
  useEffect(() => {
    if (!listItem && pathwayId && !isLoading) {
      fetchPathway(pathwayId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, pathwayId, isLoading, fetchPathway]);

  // Initialize edit form when pathway changes
  useEffect(() => {
    if (pathway) {
      setEditName(pathway.name);
      setEditKeggId(pathway.kegg_id || '');
      setEditLongevityTier(pathway.longevity_tier || '');
    }
  }, [pathway]);

  // Set active pathway when ID changes
  useEffect(() => {
    if (pathwayId) {
      setActivePathway(pathwayId);
    }
  }, [pathwayId, setActivePathway]);

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

  if (!pathway) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Pathway not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/pathways">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Pathways
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Route className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{pathway.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {pathway.longevity_tier && (
                  <Badge variant="outline">Tier {pathway.longevity_tier}</Badge>
                )}
                {pathway.kegg_id && (
                  <span className="text-sm text-muted-foreground">KEGG: {pathway.kegg_id}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Route className="h-4 w-4" />
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
              <CardTitle>Pathway Details</CardTitle>
              <CardDescription>
                Basic information about this pathway
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{pathway.name}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">KEGG ID</p>
                  <p className="text-lg font-medium">{pathway.kegg_id || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Longevity Tier</p>
                  <p className="text-lg font-medium">{pathway.longevity_tier || '—'}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(pathway.created_at).toLocaleDateString()}
                </p>
              </div>
              {pathway.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(pathway.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Pathway</CardTitle>
              <CardDescription>
                Update pathway details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pathway-name">Name</Label>
                  <Input
                    id="pathway-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., mTOR Signaling Pathway"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kegg-id">KEGG ID</Label>
                  <Input
                    id="kegg-id"
                    value={editKeggId}
                    onChange={(e) => setEditKeggId(e.target.value)}
                    placeholder="e.g., hsa04150"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longevity Tier</Label>
                  <Select
                    value={editLongevityTier}
                    onValueChange={setEditLongevityTier}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {LONGEVITY_TIER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editName.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updatePathway(pathwayId, {
                      name: editName.trim(),
                      kegg_id: editKeggId || null,
                      longevity_tier: editLongevityTier === '' || editLongevityTier === '__none__' ? null : editLongevityTier as LongevityTier,
                    });
                    if (success) {
                      await fetchPathways();
                    }
                  } catch (error) {
                    console.error('Failed to update pathway:', error);
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
                  <h4 className="font-medium">Delete this pathway</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the pathway from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-pathway">
                    Type <span className="font-semibold">{pathway.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-pathway"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Pathway name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== pathway.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deletePathway(pathwayId);
                      if (success) {
                        router.push('/pathways');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete pathway:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== pathway.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Pathway
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
