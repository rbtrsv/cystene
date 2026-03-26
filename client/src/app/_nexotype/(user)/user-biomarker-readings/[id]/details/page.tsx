'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Activity, Loader2, Settings, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { useUserBiomarkerReadings } from '@/modules/nexotype/hooks/user/use-user-biomarker-readings';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { useBiomarkers } from '@/modules/nexotype/hooks/clinical/use-biomarkers';
import { useDataSources } from '@/modules/nexotype/hooks/user/use-data-sources';
import { useUnitsOfMeasure } from '@/modules/nexotype/hooks/standardization/use-units-of-measure';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/** Detail/settings page for user biomarker reading records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function UserBiomarkerReadingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = parseInt(params.id as string, 10);
  const {
    userBiomarkerReadings,
    isLoading,
    error,
    setActiveUserBiomarkerReading,
    fetchUserBiomarkerReading,
    updateUserBiomarkerReading,
    deleteUserBiomarkerReading,
    fetchUserBiomarkerReadings
  } = useUserBiomarkerReadings();
  const { subjects } = useSubjects();
  const { biomarkers } = useBiomarkers();
  const { dataSources } = useDataSources();
  const { unitsOfMeasure } = useUnitsOfMeasure();

  // Resolve FK fields to display names
  const getSubjectName = (id: number | null | undefined) => {
    if (!id) return '—';
    const subj = subjects.find(s => s.id === id);
    return subj ? subj.subject_identifier : `Subject #${id}`;
  };

  const getBiomarkerName = (id: number | null | undefined) => {
    if (!id) return '—';
    const b = biomarkers.find(bm => bm.id === id);
    return b ? b.name : `Biomarker #${id}`;
  };

  const getSourceName = (id: number | null | undefined) => {
    if (!id) return '—';
    const ds = dataSources.find(d => d.id === id);
    return ds ? ds.name : `Source #${id}`;
  };

  const getUnitName = (id: number | null | undefined) => {
    if (!id) return '—';
    const u = unitsOfMeasure.find(um => um.id === id);
    return u ? u.symbol : `Unit #${id}`;
  };

  const listItem = userBiomarkerReadings.find((item) => item.id === itemId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [subjectId, setSubjectId] = useState('');
  const [biomarkerId, setBiomarkerId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [value, setValue] = useState('');
  const [unitId, setUnitId] = useState('');
  const [measuredAt, setMeasuredAt] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
  const [biomarkerPopoverOpen, setBiomarkerPopoverOpen] = useState(false);
  const [sourcePopoverOpen, setSourcePopoverOpen] = useState(false);
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false);

  // Fetch by ID when the list cache does not contain this record yet.
  useEffect(() => {
    if (!listItem && itemId && !isLoading) {
      fetchUserBiomarkerReading(itemId).then((result) => {
        if (result) {
          setFetchedItem(result);
        }
      });
    }
  }, [listItem, itemId, isLoading, fetchUserBiomarkerReading]);
  // Keep form inputs in sync with loaded record values.
  useEffect(() => {
    if (!item) {
      return;
    }

    setSubjectId(String(item.subject_id));
    setBiomarkerId(String(item.biomarker_id));
    setSourceId(String(item.source_id));
    setValue(String(item.value));
    setUnitId(String(item.unit_id));
    setMeasuredAt(item.measured_at.slice(0, 16));
  }, [item]);
  // Track active entity for cross-page state consistency.
  useEffect(() => {
    if (itemId) {
      setActiveUserBiomarkerReading(itemId);
    }
  }, [itemId, setActiveUserBiomarkerReading]);

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
        <AlertDescription>User biomarker reading not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/user-biomarker-readings">
<Button variant="ghost" size="sm" className="mb-2">← Back to Readings</Button>
</Link>
<div className="flex items-center gap-3">
<Activity className="h-8 w-8 hidden sm:block" />
<div>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reading #{item.id}</h1>
</div>
</div>
</div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
<TabsTrigger value="overview">
<Activity className="h-4 w-4" />Overview</TabsTrigger>
<TabsTrigger value="settings">
<Settings className="h-4 w-4" />Settings</TabsTrigger>
</TabsList>
        <TabsContent value="overview">
<Card>
<CardHeader>
<CardTitle>Reading Details</CardTitle>
</CardHeader>
<CardContent className="space-y-3">
<div>
<p className="text-sm text-muted-foreground">Subject</p>
<p className="text-lg font-medium">{getSubjectName(item.subject_id)}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Biomarker</p>
<p className="text-lg font-medium">{getBiomarkerName(item.biomarker_id)}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Value</p>
<p className="text-lg font-medium">{item.value}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Measured At</p>
<p className="text-lg font-medium">{new Date(item.measured_at).toLocaleString()}</p>
</div>
</CardContent>
</Card>
</TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
<CardHeader>
<CardTitle>Edit Reading</CardTitle>
<CardDescription>Update measurement values</CardDescription>
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
{/* Biomarker — searchable combobox */}
<div className="space-y-2">
<Label>Biomarker</Label>
<Popover open={biomarkerPopoverOpen} onOpenChange={setBiomarkerPopoverOpen}>
<PopoverTrigger asChild>
<Button variant="outline" role="combobox" aria-expanded={biomarkerPopoverOpen} className="w-full justify-between font-normal">
<span className="truncate">{biomarkerId ? biomarkers.find(b => b.id.toString() === biomarkerId)?.name || 'Select biomarker' : 'Select biomarker'}</span>
<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
</PopoverTrigger>
<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
<Command><CommandInput placeholder="Search biomarker..." /><CommandList><CommandEmpty>No biomarkers found.</CommandEmpty><CommandGroup>
{biomarkers.map((b) => (<CommandItem key={b.id} value={b.name} onSelect={() => { setBiomarkerId(b.id.toString()); setBiomarkerPopoverOpen(false); }}>{b.name}{biomarkerId === b.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
</CommandGroup></CommandList></Command>
</PopoverContent>
</Popover>
</div>
{/* Data Source — searchable combobox */}
<div className="space-y-2">
<Label>Data Source</Label>
<Popover open={sourcePopoverOpen} onOpenChange={setSourcePopoverOpen}>
<PopoverTrigger asChild>
<Button variant="outline" role="combobox" aria-expanded={sourcePopoverOpen} className="w-full justify-between font-normal">
<span className="truncate">{sourceId ? dataSources.find(ds => ds.id.toString() === sourceId)?.name || 'Select data source' : 'Select data source'}</span>
<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
</PopoverTrigger>
<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
<Command><CommandInput placeholder="Search data source..." /><CommandList><CommandEmpty>No data sources found.</CommandEmpty><CommandGroup>
{dataSources.map((ds) => (<CommandItem key={ds.id} value={ds.name} onSelect={() => { setSourceId(ds.id.toString()); setSourcePopoverOpen(false); }}>{ds.name}{sourceId === ds.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
</CommandGroup></CommandList></Command>
</PopoverContent>
</Popover>
</div>
{/* Unit of Measure — searchable combobox */}
<div className="space-y-2">
<Label>Unit of Measure</Label>
<Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
<PopoverTrigger asChild>
<Button variant="outline" role="combobox" aria-expanded={unitPopoverOpen} className="w-full justify-between font-normal">
<span className="truncate">{unitId ? unitsOfMeasure.find(u => u.id.toString() === unitId)?.symbol || 'Select unit' : 'Select unit'}</span>
<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
</PopoverTrigger>
<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
<Command><CommandInput placeholder="Search unit..." /><CommandList><CommandEmpty>No units found.</CommandEmpty><CommandGroup>
{unitsOfMeasure.map((u) => (<CommandItem key={u.id} value={u.symbol} onSelect={() => { setUnitId(u.id.toString()); setUnitPopoverOpen(false); }}>{u.symbol}{unitId === u.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
</CommandGroup></CommandList></Command>
</PopoverContent>
</Popover>
</div>
<div className="space-y-2">
<Label htmlFor="value">Value</Label>
<Input id="value" type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} />
</div>
<div className="space-y-2">
<Label htmlFor="measured-at">Measured At</Label>
<Input id="measured-at" type="datetime-local" value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} />
</div>
</div>
            <Button disabled={isUpdating} onClick={async () => { const parsedSubjectId = parseInt(subjectId, 10); const parsedBiomarkerId = parseInt(biomarkerId, 10); const parsedSourceId = parseInt(sourceId, 10); const parsedUnitId = parseInt(unitId, 10); const parsedValue = parseFloat(value); if ([parsedSubjectId, parsedBiomarkerId, parsedSourceId, parsedUnitId].some(Number.isNaN) || Number.isNaN(parsedValue) || !measuredAt) return; setIsUpdating(true); try { const success = await updateUserBiomarkerReading(itemId, { subject_id: parsedSubjectId, biomarker_id: parsedBiomarkerId, source_id: parsedSourceId, value: parsedValue, unit_id: parsedUnitId, measured_at: measuredAt }); if (success) await fetchUserBiomarkerReadings(); } finally { setIsUpdating(false); } }}>{isUpdating ? <>
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
<p className="text-sm text-muted-foreground">This will remove the reading from active use. The record will be soft-deleted.</p>
<div className="space-y-2">
<Label htmlFor="confirm-delete-reading">Type <span className="font-semibold">{item.id}</span> to confirm</Label>
<Input id="confirm-delete-reading" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Reading ID" />
</div>
<Button variant="destructive" disabled={isDeleting || deleteConfirmText !== String(item.id)} onClick={async () => { setIsDeleting(true); try { const success = await deleteUserBiomarkerReading(itemId); if (success) router.push('/user-biomarker-readings'); else setIsDeleting(false); } catch { setIsDeleting(false); } }}>{isDeleting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : <>
<Trash2 className="mr-2 h-4 w-4" />Delete Reading</>}</Button>
</CardContent>
</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
