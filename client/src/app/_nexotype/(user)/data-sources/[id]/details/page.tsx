'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Database, Loader2, Settings, Trash2 } from 'lucide-react';
import { useDataSources } from '@/modules/nexotype/hooks/user/use-data-sources';
import { DATA_SOURCE_TYPE_OPTIONS, type DataSourceType } from '@/modules/nexotype/schemas/user/data-source.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/** Detail/settings page for data source records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function DataSourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = parseInt(params.id as string, 10);
  const {
    dataSources,
    isLoading,
    error,
    setActiveDataSource,
    fetchDataSource,
    updateDataSource,
    deleteDataSource,
    fetchDataSources
  } = useDataSources();

  const listItem = dataSources.find((item) => item.id === itemId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch by ID when the list cache does not contain this record yet.
  useEffect(() => {
    if (!listItem && itemId && !isLoading) {
      fetchDataSource(itemId).then((result) => {
        if (result) {
          setFetchedItem(result);
        }
      });
    }
  }, [listItem, itemId, isLoading, fetchDataSource]);
  // Keep form inputs in sync with loaded record values.
  useEffect(() => {
    if (!item) {
      return;
    }

    setName(item.name);
    setSourceType(item.source_type);
  }, [item]);
  // Track active entity for cross-page state consistency.
  useEffect(() => {
    if (itemId) {
      setActiveDataSource(itemId);
    }
  }, [itemId, setActiveDataSource]);

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
  if (!item) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Data source not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/data-sources">
<Button variant="ghost" size="sm" className="mb-2">← Back to Data Sources</Button>
</Link>
<div className="flex items-center gap-3">
<Database className="h-8 w-8 hidden sm:block" />
<div>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{item.name}</h1>
</div>
</div>
</div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
<TabsTrigger value="overview">
<Database className="h-4 w-4" />Overview</TabsTrigger>
<TabsTrigger value="settings">
<Settings className="h-4 w-4" />Settings</TabsTrigger>
</TabsList>
        <TabsContent value="overview">
<Card>
<CardHeader>
<CardTitle>Data Source Details</CardTitle>
</CardHeader>
<CardContent className="space-y-3">
<div>
<p className="text-sm text-muted-foreground">Name</p>
<p className="text-lg font-medium">{item.name}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Source Type</p>
<p className="text-lg font-medium">{item.source_type}</p>
</div>
</CardContent>
</Card>
</TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
<CardHeader>
<CardTitle>Edit Data Source</CardTitle>
<CardDescription>Update source metadata</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div className="space-y-2">
<Label htmlFor="name">Name</Label>
<Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
</div>
<div className="space-y-2">
<Label>Source Type</Label>
<Select value={sourceType} onValueChange={setSourceType}>
<SelectTrigger className="w-full"><SelectValue placeholder="Select source type" /></SelectTrigger>
<SelectContent>{DATA_SOURCE_TYPE_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
</Select>
</div>
</div>
            <Button disabled={isUpdating} onClick={async () => { if (!name.trim() || !sourceType) return; setIsUpdating(true); try { const success = await updateDataSource(itemId, { name: name.trim(), source_type: sourceType as DataSourceType }); if (success) await fetchDataSources(); } finally { setIsUpdating(false); } }}>{isUpdating ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}</Button>
          </CardContent>
</Card>
          <Card className="border-destructive">
<CardHeader>
<CardTitle className="flex items-center gap-2 text-destructive">
<AlertTriangle className="h-5 w-5" />Danger Zone</CardTitle>
<CardDescription>Destructive actions</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
<p className="text-sm text-muted-foreground">This will remove the data source from active use. The record will be soft-deleted.</p>
<div className="space-y-2">
<Label htmlFor="confirm-delete-data-source">Type <span className="font-semibold">{item.name}</span> to confirm</Label>
<Input id="confirm-delete-data-source" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Data Source Name" />
</div>
<Button variant="destructive" disabled={isDeleting || deleteConfirmText !== item.name} onClick={async () => { setIsDeleting(true); try { const success = await deleteDataSource(itemId); if (success) router.push('/data-sources'); else setIsDeleting(false); } catch { setIsDeleting(false); } }}>{isDeleting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : <>
<Trash2 className="mr-2 h-4 w-4" />Delete Data Source</>}</Button>
</CardContent>
</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
