'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useRecommendations } from '@/modules/nexotype/hooks/user/use-recommendations';
import { useUserProfiles } from '@/modules/nexotype/hooks/user/use-user-profiles';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { CreateRecommendationSchema, PRIORITY_OPTIONS } from '@/modules/nexotype/schemas/user/recommendation.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/** Create page for recommendation records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateRecommendationPage() {
  const router = useRouter();
  const { createRecommendation, error } = useRecommendations();
  const { userProfiles } = useUserProfiles();
  const { therapeuticAssets } = useTherapeuticAssets();
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: { user_profile_id: '', asset_id: '', reason: '', priority: '' },
    onSubmit: async ({ value }) => {
      try {
        const payload = { user_profile_id: parseInt(value.user_profile_id, 10), asset_id: parseInt(value.asset_id, 10), reason: value.reason.trim(), priority: value.priority.trim() };
        const parsed = CreateRecommendationSchema.safeParse(payload);
        if (!parsed.success) return;
        const ok = await createRecommendation(parsed.data);
        if (ok) router.push('/recommendations');
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

    // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/recommendations">
<Button variant="ghost" size="sm" className="mb-4">
<ArrowLeft className="mr-2 h-4 w-4" />Back to Recommendations</Button>
</Link>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Recommendation</h1>
</div>
      {error && <Alert variant="destructive">
<AlertDescription>{error}</AlertDescription>
</Alert>}
      <Card>
<CardHeader>
<CardTitle>Recommendation Details</CardTitle>
<CardDescription>Enter recommendation metadata</CardDescription>
</CardHeader>
<CardContent>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          {/* User Profile — required FK searchable combobox */}
          <form.Field name="user_profile_id" validators={{ onChange: ({ value }) => !value ? 'User profile is required' : undefined }}>
            {(field) => (
              <div className="space-y-2">
                <Label>User Profile *</Label>
                <Popover open={profilePopoverOpen} onOpenChange={setProfilePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={profilePopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                      <span className="truncate">{field.state.value ? `Profile #${field.state.value}` : 'Select user profile'}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command><CommandInput placeholder="Search profile..." /><CommandList><CommandEmpty>No profiles found.</CommandEmpty><CommandGroup>
                      {userProfiles.map((p) => (<CommandItem key={p.id} value={`Profile #${p.id}`} onSelect={() => { field.handleChange(p.id.toString()); setProfilePopoverOpen(false); }}>{`Profile #${p.id}`}{field.state.value === p.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                    </CommandGroup></CommandList></Command>
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
              </div>
            )}
          </form.Field>
          {/* Asset — required FK searchable combobox */}
          <form.Field name="asset_id" validators={{ onChange: ({ value }) => !value ? 'Asset is required' : undefined }}>
            {(field) => (
              <div className="space-y-2">
                <Label>Asset *</Label>
                <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                      <span className="truncate">{field.state.value ? therapeuticAssets.find(a => a.id.toString() === field.state.value)?.name || 'Select asset' : 'Select asset'}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command><CommandInput placeholder="Search asset..." /><CommandList><CommandEmpty>No assets found.</CommandEmpty><CommandGroup>
                      {therapeuticAssets.map((a) => (<CommandItem key={a.id} value={a.name} onSelect={() => { field.handleChange(a.id.toString()); setAssetPopoverOpen(false); }}>{a.name}{field.state.value === a.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                    </CommandGroup></CommandList></Command>
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
              </div>
            )}
          </form.Field>
          <form.Field name="reason">{(field) => <div className="space-y-2">
<Label htmlFor={field.name}>Reason *</Label>
<Input id={field.name} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
</div>}</form.Field>
          <form.Field name="priority">{(field) => <div className="space-y-2">
<Label>Priority *</Label>
<Select value={field.state.value} onValueChange={field.handleChange} disabled={form.state.isSubmitting}>
<SelectTrigger className="w-full"><SelectValue placeholder="Select priority" /></SelectTrigger>
<SelectContent>{PRIORITY_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
</Select>
</div>}</form.Field>
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
<Button type="submit" className="flex-1" disabled={form.state.isSubmitting}>{form.state.isSubmitting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Recommendation'}</Button>
<Link href="/recommendations" className="flex-1">
<Button type="button" variant="outline" className="w-full">Cancel</Button>
</Link>
</div>
        </form>
      </CardContent>
</Card>
    </div>
  );
}
