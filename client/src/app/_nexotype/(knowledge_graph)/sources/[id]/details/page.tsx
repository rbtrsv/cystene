'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSources } from '@/modules/nexotype/hooks/knowledge_graph/use-sources';
import { SOURCE_TYPE_OPTIONS, type SourceType } from '@/modules/nexotype/schemas/knowledge_graph/source.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, FileSearch, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function SourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sourceId = parseInt(params.id as string);
  const {
    sources,
    isLoading,
    error,
    setActiveSource,
    fetchSource,
    updateSource,
    deleteSource,
    fetchSources
  } = useSources();

  const listItem = sources.find(s => s.id === sourceId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const source = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editSourceType, setEditSourceType] = useState('');
  const [editExternalId, setEditExternalId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editAuthors, setEditAuthors] = useState('');
  const [editJournal, setEditJournal] = useState('');
  const [editPublicationDate, setEditPublicationDate] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID when list item is missing (prevents false-404 on direct navigation)
  useEffect(() => {
    if (!listItem && sourceId && !isLoading) {
      fetchSource(sourceId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, sourceId, isLoading, fetchSource]);

  // Initialize edit form when source changes
  useEffect(() => {
    if (source) {
      setEditSourceType(source.source_type);
      setEditExternalId(source.external_id);
      setEditTitle(source.title || '');
      setEditAuthors(source.authors || '');
      setEditJournal(source.journal || '');
      setEditPublicationDate(source.publication_date || '');
      setEditUrl(source.url || '');
    }
  }, [source]);

  // Set active source when ID changes
  useEffect(() => {
    if (sourceId) {
      setActiveSource(sourceId);
    }
  }, [sourceId, setActiveSource]);

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

  if (!source) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Source not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/sources">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Sources
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <FileSearch className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{source.external_id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{source.source_type}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <FileSearch className="h-4 w-4" />
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
              <CardTitle>Source Details</CardTitle>
              <CardDescription>
                Basic information about this source
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">External ID</p>
                <p className="text-lg font-medium">{source.external_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source Type</p>
                <p className="text-lg font-medium">{source.source_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="text-lg font-medium">{source.title || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Authors</p>
                <p className="text-lg font-medium">{source.authors || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Journal</p>
                <p className="text-lg font-medium">{source.journal || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Publication Date</p>
                <p className="text-lg font-medium">{source.publication_date || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">URL</p>
                <p className="text-lg font-medium">{source.url || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(source.created_at).toLocaleDateString()}
                </p>
              </div>
              {source.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(source.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Source</CardTitle>
              <CardDescription>
                Update source details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source Type</Label>
                  <Select
                    value={editSourceType}
                    onValueChange={setEditSourceType}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="external-id">External ID</Label>
                  <Input
                    id="external-id"
                    value={editExternalId}
                    onChange={(e) => setEditExternalId(e.target.value)}
                    placeholder="e.g., PMID:12345678"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g., Study of protein interactions"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="authors">Authors</Label>
                  <Input
                    id="authors"
                    value={editAuthors}
                    onChange={(e) => setEditAuthors(e.target.value)}
                    placeholder="e.g., Smith J, Doe A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="journal">Journal</Label>
                  <Input
                    id="journal"
                    value={editJournal}
                    onChange={(e) => setEditJournal(e.target.value)}
                    placeholder="e.g., Nature"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publication-date">Publication Date</Label>
                  <Input
                    id="publication-date"
                    type="date"
                    value={editPublicationDate}
                    onChange={(e) => setEditPublicationDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="e.g., https://pubmed.ncbi.nlm.nih.gov/12345678"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editSourceType) {
                    return;
                  }
                  if (!editExternalId.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateSource(sourceId, {
                      source_type: editSourceType as SourceType,
                      external_id: editExternalId.trim(),
                      title: editTitle.trim() || undefined,
                      authors: editAuthors.trim() || undefined,
                      journal: editJournal.trim() || undefined,
                      publication_date: editPublicationDate.trim() || undefined,
                      url: editUrl.trim() || undefined,
                    });
                    if (success) {
                      await fetchSources();
                    }
                  } catch (error) {
                    console.error('Failed to update source:', error);
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
                  <h4 className="font-medium">Delete this source</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the source from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-source">
                    Type <span className="font-semibold">{source.external_id}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-source"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="External ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== source.external_id) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteSource(sourceId);
                      if (success) {
                        router.push('/sources');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete source:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== source.external_id}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Source
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
