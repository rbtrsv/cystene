'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Lightbulb, Loader2, Settings, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { useRecommendations } from '@/modules/nexotype/hooks/user/use-recommendations';
import { useUserProfiles } from '@/modules/nexotype/hooks/user/use-user-profiles';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { PRIORITY_OPTIONS, type Priority } from '@/modules/nexotype/schemas/user/recommendation.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/** Detail/settings page for recommendation records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function RecommendationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = parseInt(params.id as string, 10);
  const {
    recommendations,
    isLoading,
    error,
    setActiveRecommendation,
    fetchRecommendation,
    updateRecommendation,
    deleteRecommendation,
    fetchRecommendations
  } = useRecommendations();
  const { userProfiles } = useUserProfiles();
  const { therapeuticAssets } = useTherapeuticAssets();

  // Resolve FK fields to display names
  const getProfileName = (id: number | null | undefined) => {
    if (!id) return '—';
    const p = userProfiles.find(up => up.id === id);
    return p ? `Profile #${p.id}` : `Profile #${id}`;
  };

  const getAssetName = (id: number | null | undefined) => {
    if (!id) return '—';
    const a = therapeuticAssets.find(ta => ta.id === id);
    return a ? a.name : `Asset #${id}`;
  };

  const listItem = recommendations.find((item) => item.id === itemId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [userProfileId, setUserProfileId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  // Fetch by ID when the list cache does not contain this record yet.
  useEffect(() => {
    if (!listItem && itemId && !isLoading) {
      fetchRecommendation(itemId).then((result) => {
        if (result) {
          setFetchedItem(result);
        }
      });
    }
  }, [listItem, itemId, isLoading, fetchRecommendation]);
  // Keep form inputs in sync with loaded record values.
  useEffect(() => {
    if (!item) {
      return;
    }

    setUserProfileId(String(item.user_profile_id));
    setAssetId(String(item.asset_id));
    setReason(item.reason);
    setPriority(item.priority);
  }, [item]);
  // Track active entity for cross-page state consistency.
  useEffect(() => {
    if (itemId) {
      setActiveRecommendation(itemId);
    }
  }, [itemId, setActiveRecommendation]);

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
        <AlertDescription>Recommendation not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/recommendations">
<Button variant="ghost" size="sm" className="mb-2">← Back to Recommendations</Button>
</Link>
<div className="flex items-center gap-3">
<Lightbulb className="h-8 w-8 hidden sm:block" />
<div>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Recommendation #{item.id}</h1>
</div>
</div>
</div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
<TabsTrigger value="overview">
<Lightbulb className="h-4 w-4" />Overview</TabsTrigger>
<TabsTrigger value="settings">
<Settings className="h-4 w-4" />Settings</TabsTrigger>
</TabsList>
        <TabsContent value="overview">
<Card>
<CardHeader>
<CardTitle>Recommendation Details</CardTitle>
</CardHeader>
<CardContent className="space-y-3">
<div>
<p className="text-sm text-muted-foreground">User Profile</p>
<p className="text-lg font-medium">{getProfileName(item.user_profile_id)}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Asset</p>
<p className="text-lg font-medium">{getAssetName(item.asset_id)}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Priority</p>
<p className="text-lg font-medium">{item.priority}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Reason</p>
<p className="text-lg font-medium">{item.reason}</p>
</div>
</CardContent>
</Card>
</TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
<CardHeader>
<CardTitle>Edit Recommendation</CardTitle>
<CardDescription>Update recommendation fields</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
{/* User Profile — searchable combobox */}
<div className="space-y-2">
<Label>User Profile</Label>
<Popover open={profilePopoverOpen} onOpenChange={setProfilePopoverOpen}>
<PopoverTrigger asChild>
<Button variant="outline" role="combobox" aria-expanded={profilePopoverOpen} className="w-full justify-between font-normal">
<span className="truncate">{userProfileId ? `Profile #${userProfileId}` : 'Select user profile'}</span>
<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
</Button>
</PopoverTrigger>
<PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
<Command><CommandInput placeholder="Search profile..." /><CommandList><CommandEmpty>No profiles found.</CommandEmpty><CommandGroup>
{userProfiles.map((p) => (<CommandItem key={p.id} value={`Profile #${p.id}`} onSelect={() => { setUserProfileId(p.id.toString()); setProfilePopoverOpen(false); }}>{`Profile #${p.id}`}{userProfileId === p.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
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
<Label>Priority</Label>
<Select value={priority} onValueChange={setPriority}>
<SelectTrigger className="w-full"><SelectValue placeholder="Select priority" /></SelectTrigger>
<SelectContent>{PRIORITY_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
</Select>
</div>
<div className="space-y-2 sm:col-span-2">
<Label htmlFor="reason">Reason</Label>
<Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
</div>
</div>
            <Button disabled={isUpdating} onClick={async () => { const parsedProfileId = parseInt(userProfileId, 10); const parsedAssetId = parseInt(assetId, 10); if ([parsedProfileId, parsedAssetId].some(Number.isNaN) || !reason.trim() || !priority) return; setIsUpdating(true); try { const success = await updateRecommendation(itemId, { user_profile_id: parsedProfileId, asset_id: parsedAssetId, reason: reason.trim(), priority: priority as Priority }); if (success) await fetchRecommendations(); } finally { setIsUpdating(false); } }}>{isUpdating ? <>
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
<p className="text-sm text-muted-foreground">This will remove the recommendation from active use. The record will be soft-deleted.</p>
<div className="space-y-2">
<Label htmlFor="confirm-delete-recommendation">Type <span className="font-semibold">{item.id}</span> to confirm</Label>
<Input id="confirm-delete-recommendation" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Recommendation ID" />
</div>
<Button variant="destructive" disabled={isDeleting || deleteConfirmText !== String(item.id)} onClick={async () => { setIsDeleting(true); try { const success = await deleteRecommendation(itemId); if (success) router.push('/recommendations'); else setIsDeleting(false); } catch { setIsDeleting(false); } }}>{isDeleting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : <>
<Trash2 className="mr-2 h-4 w-4" />Delete Recommendation</>}</Button>
</CardContent>
</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
