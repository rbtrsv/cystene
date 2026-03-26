'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, GitBranch, Loader2, Settings, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { useUserVariants } from '@/modules/nexotype/hooks/user/use-user-variants';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { useVariants } from '@/modules/nexotype/hooks/omics/use-variants';
import { ZYGOSITY_OPTIONS, type Zygosity } from '@/modules/nexotype/schemas/user/user-variant.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/** Detail/settings page for user variant records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function UserVariantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = parseInt(params.id as string, 10);
  const {
    userVariants,
    isLoading,
    error,
    setActiveUserVariant,
    fetchUserVariant,
    updateUserVariant,
    deleteUserVariant,
    fetchUserVariants
  } = useUserVariants();
  const { subjects } = useSubjects();
  const { variants } = useVariants();

  // Resolve FK fields to display names
  const getSubjectName = (id: number | null | undefined) => {
    if (!id) return '—';
    const subj = subjects.find(s => s.id === id);
    return subj ? subj.subject_identifier : `Subject #${id}`;
  };

  const getVariantName = (id: number | null | undefined) => {
    if (!id) return '—';
    const v = variants.find(vr => vr.id === id);
    return v ? v.db_snp_id : `Variant #${id}`;
  };

  const listItem = userVariants.find((item) => item.id === itemId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [subjectId, setSubjectId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [zygosity, setZygosity] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);
  const [variantPopoverOpen, setVariantPopoverOpen] = useState(false);

  // Fetch by ID when the list cache does not contain this record yet.
  useEffect(() => {
    if (!listItem && itemId && !isLoading) {
      fetchUserVariant(itemId).then((result) => {
        if (result) {
          setFetchedItem(result);
        }
      });
    }
  }, [listItem, itemId, isLoading, fetchUserVariant]);
  // Keep form inputs in sync with loaded record values.
  useEffect(() => {
    if (!item) {
      return;
    }

    setSubjectId(String(item.subject_id));
    setVariantId(String(item.variant_id));
    setZygosity(item.zygosity);
  }, [item]);
  // Track active entity for cross-page state consistency.
  useEffect(() => {
    if (itemId) {
      setActiveUserVariant(itemId);
    }
  }, [itemId, setActiveUserVariant]);

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
        <AlertDescription>User variant not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/user-variants">
<Button variant="ghost" size="sm" className="mb-2">← Back to User Variants</Button>
</Link>
<div className="flex items-center gap-3">
<GitBranch className="h-8 w-8 hidden sm:block" />
<div>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Variant #{item.id}</h1>
</div>
</div>
</div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
<TabsTrigger value="overview">
<GitBranch className="h-4 w-4" />Overview</TabsTrigger>
<TabsTrigger value="settings">
<Settings className="h-4 w-4" />Settings</TabsTrigger>
</TabsList>
        <TabsContent value="overview">
<Card>
<CardHeader>
<CardTitle>User Variant Details</CardTitle>
</CardHeader>
<CardContent className="space-y-3">
<div>
<p className="text-sm text-muted-foreground">Subject</p>
<p className="text-lg font-medium">{getSubjectName(item.subject_id)}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Variant</p>
<p className="text-lg font-medium">{getVariantName(item.variant_id)}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Zygosity</p>
<p className="text-lg font-medium">{item.zygosity}</p>
</div>
</CardContent>
</Card>
</TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
<CardHeader>
<CardTitle>Edit User Variant</CardTitle>
<CardDescription>Update linkage and zygosity</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
{/* Subject — searchable combobox */}
<div className="space-y-2">
<Label>Subject</Label>
<Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
<PopoverTrigger asChild>
<Button variant="outline" role="combobox" aria-expanded={subjectPopoverOpen} className="w-full justify-between font-normal">
<span className="truncate">
{subjectId ? subjects.find(s => s.id.toString() === subjectId)?.subject_identifier || 'Select subject' : 'Select subject'}
</span>
<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
</PopoverTrigger>
<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
<Command>
<CommandInput placeholder="Search subject..." />
<CommandList>
<CommandEmpty>No subjects found.</CommandEmpty>
<CommandGroup>
{subjects.map((s) => (
<CommandItem key={s.id} value={s.subject_identifier} onSelect={() => { setSubjectId(s.id.toString()); setSubjectPopoverOpen(false); }}>
{s.subject_identifier}
{subjectId === s.id.toString() && <Check className="ml-auto h-4 w-4" />}
</CommandItem>
))}
</CommandGroup>
</CommandList>
</Command>
</PopoverContent>
</Popover>
</div>
{/* Variant — searchable combobox */}
<div className="space-y-2">
<Label>Variant</Label>
<Popover open={variantPopoverOpen} onOpenChange={setVariantPopoverOpen}>
<PopoverTrigger asChild>
<Button variant="outline" role="combobox" aria-expanded={variantPopoverOpen} className="w-full justify-between font-normal">
<span className="truncate">
{variantId ? variants.find(v => v.id.toString() === variantId)?.db_snp_id || 'Select variant' : 'Select variant'}
</span>
<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
</PopoverTrigger>
<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
<Command>
<CommandInput placeholder="Search variant..." />
<CommandList>
<CommandEmpty>No variants found.</CommandEmpty>
<CommandGroup>
{variants.map((v) => (
<CommandItem key={v.id} value={v.db_snp_id} onSelect={() => { setVariantId(v.id.toString()); setVariantPopoverOpen(false); }}>
{v.db_snp_id}
{variantId === v.id.toString() && <Check className="ml-auto h-4 w-4" />}
</CommandItem>
))}
</CommandGroup>
</CommandList>
</Command>
</PopoverContent>
</Popover>
</div>
<div className="space-y-2">
<Label>Zygosity</Label>
<Select value={zygosity} onValueChange={setZygosity}>
<SelectTrigger className="w-full"><SelectValue placeholder="Select zygosity" /></SelectTrigger>
<SelectContent>{ZYGOSITY_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
</Select>
</div>
</div>
            <Button disabled={isUpdating} onClick={async () => { const parsedSubjectId = parseInt(subjectId, 10); const parsedVariantId = parseInt(variantId, 10); if (Number.isNaN(parsedSubjectId) || Number.isNaN(parsedVariantId) || !zygosity) return; setIsUpdating(true); try { const success = await updateUserVariant(itemId, { subject_id: parsedSubjectId, variant_id: parsedVariantId, zygosity: zygosity as Zygosity }); if (success) await fetchUserVariants(); } finally { setIsUpdating(false); } }}>{isUpdating ? <>
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
<p className="text-sm text-muted-foreground">This will remove the user variant from active use. The record will be soft-deleted.</p>
<div className="space-y-2">
<Label htmlFor="confirm-delete-user-variant">Type <span className="font-semibold">{item.id}</span> to confirm</Label>
<Input id="confirm-delete-user-variant" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="User Variant ID" />
</div>
<Button variant="destructive" disabled={isDeleting || deleteConfirmText !== String(item.id)} onClick={async () => { setIsDeleting(true); try { const success = await deleteUserVariant(itemId); if (success) router.push('/user-variants'); else setIsDeleting(false); } catch { setIsDeleting(false); } }}>{isDeleting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : <>
<Trash2 className="mr-2 h-4 w-4" />Delete User Variant</>}</Button>
</CardContent>
</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
