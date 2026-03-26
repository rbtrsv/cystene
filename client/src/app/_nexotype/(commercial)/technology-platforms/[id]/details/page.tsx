'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTechnologyPlatforms } from '@/modules/nexotype/hooks/commercial/use-technology-platforms';
import { PLATFORM_CATEGORY_OPTIONS, type PlatformCategory } from '@/modules/nexotype/schemas/commercial/technology-platform.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Cpu, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function TechnologyPlatformDetailPage() {
  const params = useParams();
  const router = useRouter();
  const technologyPlatformId = parseInt(params.id as string);
  const {
    technologyPlatforms,
    isLoading,
    error,
    setActiveTechnologyPlatform,
    fetchTechnologyPlatform,
    updateTechnologyPlatform,
    deleteTechnologyPlatform,
    fetchTechnologyPlatforms
  } = useTechnologyPlatforms();

  const listItem = technologyPlatforms.find(tp => tp.id === technologyPlatformId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const technologyPlatform = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editReadinessLevel, setEditReadinessLevel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID fallback when list doesn't contain this technology platform
  useEffect(() => {
    if (!listItem && technologyPlatformId && !isLoading) {
      fetchTechnologyPlatform(technologyPlatformId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, technologyPlatformId, isLoading, fetchTechnologyPlatform]);

  // Initialize edit form when technology platform changes
  useEffect(() => {
    if (technologyPlatform) {
      setEditName(technologyPlatform.name);
      setEditCategory(technologyPlatform.category);
      setEditReadinessLevel(technologyPlatform.readiness_level != null ? technologyPlatform.readiness_level.toString() : '');
      setEditDescription(technologyPlatform.description || '');
    }
  }, [technologyPlatform]);

  // Set active technology platform when ID changes
  useEffect(() => {
    if (technologyPlatformId) {
      setActiveTechnologyPlatform(technologyPlatformId);
    }
  }, [technologyPlatformId, setActiveTechnologyPlatform]);

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

  if (!technologyPlatform) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Technology platform not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/technology-platforms">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Technology Platforms
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Cpu className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{technologyPlatform.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{technologyPlatform.category}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Cpu className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technology Platform Details</CardTitle>
              <CardDescription>
                Basic information about this technology platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{technologyPlatform.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-lg font-medium">{technologyPlatform.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Readiness Level</p>
                <p className="text-lg font-medium">{technologyPlatform.readiness_level ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-lg font-medium">{technologyPlatform.description || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(technologyPlatform.created_at).toLocaleDateString()}
                </p>
              </div>
              {technologyPlatform.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(technologyPlatform.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Technology Platform</CardTitle>
              <CardDescription>
                Update technology platform details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., CRISPR-Cas9"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="readiness-level">Readiness Level</Label>
                  <Input
                    id="readiness-level"
                    type="number"
                    value={editReadinessLevel}
                    onChange={(e) => setEditReadinessLevel(e.target.value)}
                    placeholder="e.g., 7"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="e.g., A genome editing technology..."
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editName.trim()) {
                    return;
                  }
                  if (!editCategory) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateTechnologyPlatform(technologyPlatformId, {
                      name: editName.trim(),
                      category: editCategory as PlatformCategory,
                      readiness_level: editReadinessLevel === '' ? null : parseInt(editReadinessLevel, 10),
                      description: editDescription.trim() || undefined,
                    });
                    if (success) {
                      await fetchTechnologyPlatforms();
                    }
                  } catch (error) {
                    console.error('Failed to update technology platform:', error);
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
                  <h4 className="font-medium">Delete this technology platform</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the technology platform from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-technology-platform">
                    Type <span className="font-semibold">{technologyPlatform.name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-technology-platform"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== technologyPlatform.name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteTechnologyPlatform(technologyPlatformId);
                      if (success) {
                        router.push('/technology-platforms');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete technology platform:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== technologyPlatform.name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Technology Platform
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
