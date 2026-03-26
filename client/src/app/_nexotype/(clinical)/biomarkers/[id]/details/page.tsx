'use client';

import { useParams, useRouter } from 'next/navigation';
import { useBiomarkers } from '@/modules/nexotype/hooks/clinical/use-biomarkers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, TestTubeDiagonal, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// This details page keeps fetch/update/delete flows explicit.
export default function BiomarkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const biomarkerId = parseInt(params.id as string);
  const {
    biomarkers,
    isLoading,
    error,
    setActiveBiomarker,
    fetchBiomarker,
    updateBiomarker,
    deleteBiomarker,
    fetchBiomarkers
  } = useBiomarkers();

  const listItem = biomarkers.find(b => b.id === biomarkerId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const biomarker = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editName, setEditName] = useState('');
  const [editLoincCode, setEditLoincCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this biomarker
  useEffect(() => {
    if (!listItem && biomarkerId && !isLoading) {
      fetchBiomarker(biomarkerId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, biomarkerId, isLoading, fetchBiomarker]);

  // Initialize edit form when biomarker changes
  useEffect(() => {
    if (biomarker) {
      setEditName(biomarker.name);
      setEditLoincCode(biomarker.loinc_code || '');
    }
  }, [biomarker]);

  // Set active biomarker when ID changes
  useEffect(() => {
    if (biomarkerId) {
      setActiveBiomarker(biomarkerId);
    }
  }, [biomarkerId, setActiveBiomarker]);

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

  if (!biomarker) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Biomarker not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/biomarkers">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Biomarkers
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <TestTubeDiagonal className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{biomarker.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {biomarker.loinc_code && (
                  <Badge variant="outline">LOINC: {biomarker.loinc_code}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <TestTubeDiagonal className="h-4 w-4" />
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
              <CardTitle>Biomarker Details</CardTitle>
              <CardDescription>
                Basic information about this biomarker
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{biomarker.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">LOINC Code</p>
                <p className="text-lg font-medium">{biomarker.loinc_code || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(biomarker.created_at).toLocaleDateString()}
                </p>
              </div>
              {biomarker.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(biomarker.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Biomarker</CardTitle>
              <CardDescription>
                Update biomarker details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="biomarker-name">Name</Label>
                  <Input
                    id="biomarker-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., NAD+ Levels"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loinc-code">LOINC Code</Label>
                  <Input
                    id="loinc-code"
                    value={editLoincCode}
                    onChange={(e) => setEditLoincCode(e.target.value)}
                    placeholder="e.g., 50123-4"
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
                    const success = await updateBiomarker(biomarkerId, {
                      name: editName.trim(),
                      loinc_code: editLoincCode || null,
                    });
                    if (success) {
                      await fetchBiomarkers();
                    }
                  } catch (error) {
                    console.error('Failed to update biomarker:', error);
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
                  <h4 className="font-medium">Delete this biomarker</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the biomarker from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-biomarker">
                    Type <span className="font-semibold">{biomarker.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-biomarker"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Biomarker name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== biomarker.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteBiomarker(biomarkerId);
                      if (success) {
                        router.push('/biomarkers');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete biomarker:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== biomarker.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Biomarker
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
