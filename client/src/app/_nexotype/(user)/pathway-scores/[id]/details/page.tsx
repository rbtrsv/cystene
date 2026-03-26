'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Route, Settings, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { usePathwayScores } from '@/modules/nexotype/hooks/user/use-pathway-scores';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { usePathways } from '@/modules/nexotype/hooks/clinical/use-pathways';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/** Detail/settings page for pathway score records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function PathwayScoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = parseInt(params.id as string, 10);
  const {
    pathwayScores,
    isLoading,
    error,
    setActivePathwayScore,
    fetchPathwayScore,
    updatePathwayScore,
    deletePathwayScore,
    fetchPathwayScores
  } = usePathwayScores();
  const { subjects } = useSubjects();
  const { pathways } = usePathways();

  // Resolve FK fields to display names
  const getSubjectName = (id: number | null | undefined) => {
    if (!id) return '—';
    const subj = subjects.find(s => s.id === id);
    return subj ? subj.subject_identifier : `Subject #${id}`;
  };

  const getPathwayName = (id: number | null | undefined) => {
    if (!id) return '—';
    const p = pathways.find(pw => pw.id === id);
    return p ? p.name : `Pathway #${id}`;
  };

  const listItem = pathwayScores.find((item) => item.id === itemId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [subjectId, setSubjectId] = useState('');
  const [pathwayId, setPathwayId] = useState('');
  const [score, setScore] = useState('');
  const [calculatedAt, setCalculatedAt] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
  const [pathwayPopoverOpen, setPathwayPopoverOpen] = useState(false);

  // Fetch by ID when the list cache does not contain this record yet.
  useEffect(() => {
    if (!listItem && itemId && !isLoading) {
      fetchPathwayScore(itemId).then((result) => {
        if (result) {
          setFetchedItem(result);
        }
      });
    }
  }, [listItem, itemId, isLoading, fetchPathwayScore]);
  // Keep form inputs in sync with loaded record values.
  useEffect(() => {
    if (!item) {
      return;
    }

    setSubjectId(String(item.subject_id));
    setPathwayId(String(item.pathway_id));
    setScore(String(item.score));
    setCalculatedAt(item.calculated_at.slice(0, 16));
  }, [item]);
  // Track active entity for cross-page state consistency.
  useEffect(() => {
    if (itemId) {
      setActivePathwayScore(itemId);
    }
  }, [itemId, setActivePathwayScore]);

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
        <AlertDescription>Pathway score not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/pathway-scores">
<Button variant="ghost" size="sm" className="mb-2">← Back to Pathway Scores</Button>
</Link>
<div className="flex items-center gap-3">
<Route className="h-8 w-8 hidden sm:block" />
<div>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pathway Score #{item.id}</h1>
</div>
</div>
</div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
<TabsTrigger value="overview">
<Route className="h-4 w-4" />Overview</TabsTrigger>
<TabsTrigger value="settings">
<Settings className="h-4 w-4" />Settings</TabsTrigger>
</TabsList>
        <TabsContent value="overview">
<Card>
<CardHeader>
<CardTitle>Pathway Score Details</CardTitle>
</CardHeader>
<CardContent className="space-y-3">
<div>
<p className="text-sm text-muted-foreground">Subject</p>
<p className="text-lg font-medium">{getSubjectName(item.subject_id)}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Pathway</p>
<p className="text-lg font-medium">{getPathwayName(item.pathway_id)}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Score</p>
<p className="text-lg font-medium">{item.score}</p>
</div>
</CardContent>
</Card>
</TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
<CardHeader>
<CardTitle>Edit Pathway Score</CardTitle>
<CardDescription>Update score metadata</CardDescription>
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
{/* Pathway — searchable combobox */}
<div className="space-y-2">
<Label>Pathway</Label>
<Popover open={pathwayPopoverOpen} onOpenChange={setPathwayPopoverOpen}>
<PopoverTrigger asChild>
<Button variant="outline" role="combobox" aria-expanded={pathwayPopoverOpen} className="w-full justify-between font-normal">
<span className="truncate">{pathwayId ? pathways.find(p => p.id.toString() === pathwayId)?.name || 'Select pathway' : 'Select pathway'}</span>
<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
</PopoverTrigger>
<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
<Command><CommandInput placeholder="Search pathway..." /><CommandList><CommandEmpty>No pathways found.</CommandEmpty><CommandGroup>
{pathways.map((p) => (<CommandItem key={p.id} value={p.name} onSelect={() => { setPathwayId(p.id.toString()); setPathwayPopoverOpen(false); }}>{p.name}{pathwayId === p.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
</CommandGroup></CommandList></Command>
</PopoverContent>
</Popover>
</div>
<div className="space-y-2">
<Label htmlFor="score">Score</Label>
<Input id="score" type="number" step="any" value={score} onChange={(e) => setScore(e.target.value)} />
</div>
<div className="space-y-2">
<Label htmlFor="calculated-at">Calculated At</Label>
<Input id="calculated-at" type="datetime-local" value={calculatedAt} onChange={(e) => setCalculatedAt(e.target.value)} />
</div>
</div>
            <Button disabled={isUpdating} onClick={async () => { const parsedSubjectId = parseInt(subjectId, 10); const parsedPathwayId = parseInt(pathwayId, 10); const parsedScore = parseFloat(score); if ([parsedSubjectId, parsedPathwayId].some(Number.isNaN) || Number.isNaN(parsedScore) || !calculatedAt) return; setIsUpdating(true); try { const success = await updatePathwayScore(itemId, { subject_id: parsedSubjectId, pathway_id: parsedPathwayId, score: parsedScore, calculated_at: calculatedAt }); if (success) await fetchPathwayScores(); } finally { setIsUpdating(false); } }}>{isUpdating ? <>
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
<p className="text-sm text-muted-foreground">This will remove the pathway score from active use. The record will be soft-deleted.</p>
<div className="space-y-2">
<Label htmlFor="confirm-delete-pathway-score">Type <span className="font-semibold">{item.id}</span> to confirm</Label>
<Input id="confirm-delete-pathway-score" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Pathway Score ID" />
</div>
<Button variant="destructive" disabled={isDeleting || deleteConfirmText !== String(item.id)} onClick={async () => { setIsDeleting(true); try { const success = await deletePathwayScore(itemId); if (success) router.push('/pathway-scores'); else setIsDeleting(false); } catch { setIsDeleting(false); } }}>{isDeleting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : <>
<Trash2 className="mr-2 h-4 w-4" />Delete Pathway Score</>}</Button>
</CardContent>
</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
