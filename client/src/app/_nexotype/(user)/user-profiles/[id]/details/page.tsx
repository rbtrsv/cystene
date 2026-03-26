'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Settings, Trash2, User2, ChevronsUpDown, Check } from 'lucide-react';
import { useUserProfiles } from '@/modules/nexotype/hooks/user/use-user-profiles';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/** Detail/settings page for user profile records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function UserProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = parseInt(params.id as string, 10);
  const {
    userProfiles,
    isLoading,
    error,
    setActiveUserProfile,
    fetchUserProfile,
    updateUserProfile,
    deleteUserProfile,
    fetchUserProfiles
  } = useUserProfiles();
  const { subjects } = useSubjects();

  // Resolve subject FK to display name
  const getSubjectName = (id: number | null | undefined) => {
    if (!id) return '—';
    const subj = subjects.find(s => s.id === id);
    return subj ? subj.subject_identifier : `Subject #${id}`;
  };

  const listItem = userProfiles.find((item) => item.id === itemId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [userId, setUserId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);

  // Fetch by ID when the list cache does not contain this record yet.
  useEffect(() => {
    if (!listItem && itemId && !isLoading) {
      fetchUserProfile(itemId).then((result) => {
        if (result) {
          setFetchedItem(result);
        }
      });
    }
  }, [listItem, itemId, isLoading, fetchUserProfile]);
  // Keep form inputs in sync with loaded record values.
  useEffect(() => {
    if (!item) {
      return;
    }

    setUserId(String(item.user_id));
    setSubjectId(String(item.subject_id));
  }, [item]);
  // Track active entity for cross-page state consistency.
  useEffect(() => {
    if (itemId) {
      setActiveUserProfile(itemId);
    }
  }, [itemId, setActiveUserProfile]);

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
        <AlertDescription>User profile not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/user-profiles">
<Button variant="ghost" size="sm" className="mb-2">← Back to User Profiles</Button>
</Link>
<div className="flex items-center gap-3">
<User2 className="h-8 w-8 hidden sm:block" />
<div>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Profile #{item.id}</h1>
</div>
</div>
</div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
<TabsTrigger value="overview">
<User2 className="h-4 w-4" />Overview</TabsTrigger>
<TabsTrigger value="settings">
<Settings className="h-4 w-4" />Settings</TabsTrigger>
</TabsList>
        <TabsContent value="overview">
<Card>
<CardHeader>
<CardTitle>User Profile Details</CardTitle>
</CardHeader>
<CardContent className="space-y-3">
<div>
<p className="text-sm text-muted-foreground">User ID</p>
<p className="text-lg font-medium">{item.user_id}</p>
</div>
<div>
<p className="text-sm text-muted-foreground">Subject</p>
<p className="text-lg font-medium">{getSubjectName(item.subject_id)}</p>
</div>
</CardContent>
</Card>
</TabsContent>
        <TabsContent value="settings" className="space-y-4">
          <Card>
<CardHeader>
<CardTitle>Edit User Profile</CardTitle>
<CardDescription>Update linkage fields</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div className="space-y-2">
<Label htmlFor="user-id">User ID</Label>
<Input id="user-id" type="number" value={userId} onChange={(e) => setUserId(e.target.value)} />
</div>
{/* Subject — searchable combobox */}
<div className="space-y-2">
<Label>Subject</Label>
<Popover open={subjectPopoverOpen} onOpenChange={setSubjectPopoverOpen}>
<PopoverTrigger asChild>
<Button variant="outline" role="combobox" aria-expanded={subjectPopoverOpen} className="w-full justify-between font-normal">
<span className="truncate">
{subjectId
? subjects.find(s => s.id.toString() === subjectId)?.subject_identifier || 'Select subject'
: 'Select subject'}
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
<CommandItem
key={s.id}
value={s.subject_identifier}
onSelect={() => {
setSubjectId(s.id.toString());
setSubjectPopoverOpen(false);
}}
>
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
</div>
            <Button disabled={isUpdating} onClick={async () => { const parsedUserId = parseInt(userId, 10); const parsedSubjectId = parseInt(subjectId, 10); if (Number.isNaN(parsedUserId) || Number.isNaN(parsedSubjectId)) return; setIsUpdating(true); try { const success = await updateUserProfile(itemId, { user_id: parsedUserId, subject_id: parsedSubjectId }); if (success) await fetchUserProfiles(); } finally { setIsUpdating(false); } }}>{isUpdating ? <>
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
<p className="text-sm text-muted-foreground">This will remove the user profile from active use. The record will be soft-deleted.</p>
<div className="space-y-2">
<Label htmlFor="confirm-delete-user-profile">Type <span className="font-semibold">{item.id}</span> to confirm</Label>
<Input id="confirm-delete-user-profile" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="Profile ID" />
</div>
<Button variant="destructive" disabled={isDeleting || deleteConfirmText !== String(item.id)} onClick={async () => { setIsDeleting(true); try { const success = await deleteUserProfile(itemId); if (success) router.push('/user-profiles'); else setIsDeleting(false); } catch { setIsDeleting(false); } }}>{isDeleting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : <>
<Trash2 className="mr-2 h-4 w-4" />Delete User Profile</>}</Button>
</CardContent>
</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
