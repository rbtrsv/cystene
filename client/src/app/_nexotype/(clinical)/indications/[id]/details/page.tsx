'use client';

import { useParams, useRouter } from 'next/navigation';
import { useIndications } from '@/modules/nexotype/hooks/clinical/use-indications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Heart, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function IndicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const indicationId = parseInt(params.id as string);
  const {
    indications,
    isLoading,
    error,
    setActiveIndication,
    fetchIndication,
    updateIndication,
    deleteIndication,
    fetchIndications
  } = useIndications();

  const listItem = indications.find(i => i.id === indicationId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const indication = listItem ?? fetchedItem ?? null;

  // Fetch by ID when the list doesn't contain this indication (prevents false-404)
  useEffect(() => {
    if (!listItem && indicationId && !isLoading) {
      fetchIndication(indicationId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, indicationId, isLoading, fetchIndication]);

  // Settings state
  const [editName, setEditName] = useState('');
  const [editIcd10Code, setEditIcd10Code] = useState('');
  const [editMeddraId, setEditMeddraId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when indication changes
  useEffect(() => {
    if (indication) {
      setEditName(indication.name);
      setEditIcd10Code(indication.icd_10_code || '');
      setEditMeddraId(indication.meddra_id || '');
    }
  }, [indication]);

  // Set active indication when ID changes
  useEffect(() => {
    if (indicationId) {
      setActiveIndication(indicationId);
    }
  }, [indicationId, setActiveIndication]);

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

  if (!indication) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Indication not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/indications">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Indications
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{indication.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {indication.icd_10_code && (
                  <Badge variant="outline">ICD-10: {indication.icd_10_code}</Badge>
                )}
                {indication.meddra_id && (
                  <span className="text-sm text-muted-foreground">MedDRA: {indication.meddra_id}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Heart className="h-4 w-4" />
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
              <CardTitle>Indication Details</CardTitle>
              <CardDescription>
                Basic information about this indication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{indication.name}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ICD-10 Code</p>
                  <p className="text-lg font-medium">{indication.icd_10_code || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">MedDRA ID</p>
                  <p className="text-lg font-medium">{indication.meddra_id || '—'}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(indication.created_at).toLocaleDateString()}
                </p>
              </div>
              {indication.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(indication.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Indication</CardTitle>
              <CardDescription>
                Update indication details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="indication-name">Name</Label>
                  <Input
                    id="indication-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., Alzheimer's Disease"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icd-10-code">ICD-10 Code</Label>
                  <Input
                    id="icd-10-code"
                    value={editIcd10Code}
                    onChange={(e) => setEditIcd10Code(e.target.value)}
                    placeholder="e.g., G30.9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meddra-id">MedDRA ID</Label>
                  <Input
                    id="meddra-id"
                    value={editMeddraId}
                    onChange={(e) => setEditMeddraId(e.target.value)}
                    placeholder="e.g., 10001896"
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
                    const success = await updateIndication(indicationId, {
                      name: editName.trim(),
                      icd_10_code: editIcd10Code || null,
                      meddra_id: editMeddraId || null,
                    });
                    if (success) {
                      await fetchIndications();
                    }
                  } catch (error) {
                    console.error('Failed to update indication:', error);
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
                  <h4 className="font-medium">Delete this indication</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the indication from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-indication">
                    Type <span className="font-semibold">{indication.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-indication"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Indication name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== indication.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteIndication(indicationId);
                      if (success) {
                        router.push('/indications');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete indication:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== indication.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Indication
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
