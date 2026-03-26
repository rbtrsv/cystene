'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Pill, Loader2, Settings, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { useUserTreatmentLogs } from '@/modules/nexotype/hooks/user/use-user-treatment-logs';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/** Detail/settings page for user treatment log records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function UserTreatmentLogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = parseInt(params.id as string, 10);
  const {
    userTreatmentLogs,
    isLoading,
    error,
    setActiveUserTreatmentLog,
    fetchUserTreatmentLog,
    updateUserTreatmentLog,
    deleteUserTreatmentLog,
    fetchUserTreatmentLogs
  } = useUserTreatmentLogs();
  const { subjects } = useSubjects();
  const { therapeuticAssets } = useTherapeuticAssets();

  // Resolve FK fields to display names
  const getSubjectName = (id: number | null | undefined) => {
    if (!id) return '—';
    const subj = subjects.find(s => s.id === id);
    return subj ? subj.subject_identifier : `Subject #${id}`;
  };

  const getAssetName = (id: number | null | undefined) => {
    if (!id) return '—';
    const a = therapeuticAssets.find(ta => ta.id === id);
    return a ? a.name : `Asset #${id}`;
  };

  const listItem = userTreatmentLogs.find((item) => item.id === itemId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [subjectId, setSubjectId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [dosage, setDosage] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [endedAt, setEndedAt] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  // Fetch by ID when the list cache does not contain this record yet.
  useEffect(() => {
    if (!listItem && itemId && !isLoading) {
      fetchUserTreatmentLog(itemId).then((result) => {
        if (result) {
          setFetchedItem(result);
        }
      });
    }
  }, [listItem, itemId, isLoading, fetchUserTreatmentLog]);
  // Keep form inputs in sync with loaded record values.
  useEffect(() => {
    if (!item) {
      return;
    }

    setSubjectId(String(item.subject_id));
    setAssetId(String(item.asset_id));
    setDosage(item.dosage);
    setStartedAt(item.started_at);
    setEndedAt(item.ended_at ?? '');
  }, [item]);
  // Track active entity for cross-page state consistency.
  useEffect(() => {
    if (itemId) {
      setActiveUserTreatmentLog(itemId);
    }
  }, [itemId, setActiveUserTreatmentLog]);

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
        <AlertDescription>Treatment log not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/user-treatment-logs">
<Button variant="ghost" size="sm" className="mb-2">← Back to Treatment Logs</Button>
</Link>
<div className="flex items-center gap-3">
<Pill className="h-8 w-8 hidden sm:block" />
<div>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Treatment Log #{item.id}</h1>
</div>
</div>
</div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
<TabsTrigger value="overview">
<Pill className="h-4 w-4" />Overview</TabsTrigger>
<TabsTrigger value="settings">
<Settings className="h-4 w-4" />Settings</TabsTrigger>
</TabsList>
        <TabsContent value="overview">
<Card>
<CardHeader>
<CardTitle>Treatment Log Details</CardTitle>
</CardHeader>
<CardContent className="space-y-3">
<div>
<p className="text-sm text-muted-foreground">Subject</p>
<p className="text-lg font-medium">{getSubjectName(item.subject_id)}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Asset</p>
<p className="text-lg font-medium">{getAssetName(item.asset_id)}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Dosage</p>
<p className="text-lg font-medium">{item.dosage}</p>
</div>
</CardContent>
</Card>
</TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
<CardHeader>
<CardTitle>Edit Treatment Log</CardTitle>
<CardDescription>Update treatment fields</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
{/* Subject — searchable combobox */}
<div className="space-y-2">
<Label>Subject</Label>
<Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
<PopoverTrigger asChild>
<Button variant="outline" role="combobox" aria-expanded={subjectPopoverOpen} className="w-full justify-between font-normal">
<span className="truncate">{subjectId ? subjects.find(s => s.id.toString() === subjectId)?.subject_identifier || 'Select subject' : 'Select subject'}</span>
<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
</PopoverTrigger>
<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
<Command><CommandInput placeholder="Search subject..." /><CommandList><CommandEmpty>No subjects found.</CommandEmpty><CommandGroup>
{subjects.map((s) => (<CommandItem key={s.id} value={s.subject_identifier} onSelect={() => { setSubjectId(s.id.toString()); setSubjectPopoverOpen(false); }}>{s.subject_identifier}{subjectId === s.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
</CommandGroup></CommandList></Command>
</PopoverContent>
</Popover>
</div>
{/* Asset — searchable combobox */}
<div className="space-y-2">
<Label>Asset</Label>
<Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
<PopoverTrigger asChild>
<Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal">
<span className="truncate">{assetId ? therapeuticAssets.find(a => a.id.toString() === assetId)?.name || 'Select asset' : 'Select asset'}</span>
<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
</PopoverTrigger>
<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
<Command><CommandInput placeholder="Search asset..." /><CommandList><CommandEmpty>No assets found.</CommandEmpty><CommandGroup>
{therapeuticAssets.map((a) => (<CommandItem key={a.id} value={a.name} onSelect={() => { setAssetId(a.id.toString()); setAssetPopoverOpen(false); }}>{a.name}{assetId === a.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
</CommandGroup></CommandList></Command>
</PopoverContent>
</Popover>
</div>
<div className="space-y-2">
<Label htmlFor="dosage">Dosage</Label>
<Input id="dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} />
</div>
<div className="space-y-2">
<Label htmlFor="started-at">Started At</Label>
<Input id="started-at" type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
</div>
<div className="space-y-2">
<Label htmlFor="ended-at">Ended At</Label>
<Input id="ended-at" type="date" value={endedAt} onChange={(e) => setEndedAt(e.target.value)} />
</div>
</div>
            <Button disabled={isUpdating} onClick={async () => { const parsedSubjectId = parseInt(subjectId, 10); const parsedAssetId = parseInt(assetId, 10); if (Number.isNaN(parsedSubjectId) || Number.isNaN(parsedAssetId) || !dosage.trim() || !startedAt) return; setIsUpdating(true); try { const success = await updateUserTreatmentLog(itemId, { subject_id: parsedSubjectId, asset_id: parsedAssetId, dosage: dosage.trim(), started_at: startedAt, ended_at: endedAt || null }); if (success) await fetchUserTreatmentLogs(); } finally { setIsUpdating(false); } }}>{isUpdating ? <>
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
<p className="text-sm text-muted-foreground">This will remove the treatment log from active use. The record will be soft-deleted.</p>
<div className="space-y-2">
<Label htmlFor="confirm-delete-treatment-log">Type <span className="font-semibold">{item.id}</span> to confirm</Label>
<Input id="confirm-delete-treatment-log" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Treatment Log ID" />
</div>
<Button variant="destructive" disabled={isDeleting || deleteConfirmText !== String(item.id)} onClick={async () => { setIsDeleting(true); try { const success = await deleteUserTreatmentLog(itemId); if (success) router.push('/user-treatment-logs'); else setIsDeleting(false); } catch { setIsDeleting(false); } }}>{isDeleting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : <>
<Trash2 className="mr-2 h-4 w-4" />Delete Treatment Log</>}</Button>
</CardContent>
</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
