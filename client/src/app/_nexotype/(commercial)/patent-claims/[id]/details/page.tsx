'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePatentClaims } from '@/modules/nexotype/hooks/commercial/use-patent-claims';
import { CLAIM_TYPE_OPTIONS, type ClaimType } from '@/modules/nexotype/schemas/commercial/patent-claim.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, FileCheck, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function PatentClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patentClaimId = parseInt(params.id as string);
  const {
    patentClaims,
    isLoading,
    error,
    setActivePatentClaim,
    fetchPatentClaim,
    updatePatentClaim,
    deletePatentClaim,
    fetchPatentClaims
  } = usePatentClaims();
  const { patents } = usePatents();
  const { therapeuticAssets } = useTherapeuticAssets();

  // Resolve FK fields to display names
  const getPatentName = (id: number | null | undefined) => {
    if (!id) return '—';
    const p = patents.find(pt => pt.id === id);
    return p ? p.patent_number : `Patent #${id}`;
  };

  const getAssetName = (id: number | null | undefined) => {
    if (!id) return '—';
    const a = therapeuticAssets.find(ta => ta.id === id);
    return a ? a.name : `Asset #${id}`;
  };

  const listItem = patentClaims.find(pc => pc.id === patentClaimId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const patentClaim = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editPatentId, setEditPatentId] = useState('');
  const [editAssetId, setEditAssetId] = useState('');
  const [editClaimType, setEditClaimType] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [patentPopoverOpen, setPatentPopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this patent claim
  useEffect(() => {
    if (!listItem && patentClaimId && !isLoading) {
      fetchPatentClaim(patentClaimId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, patentClaimId, isLoading, fetchPatentClaim]);

  // Initialize edit form when patent claim changes
  useEffect(() => {
    if (patentClaim) {
      setEditPatentId(patentClaim.patent_id.toString());
      setEditAssetId(patentClaim.asset_id.toString());
      setEditClaimType(patentClaim.claim_type || '');
    }
  }, [patentClaim]);

  // Set active patent claim when ID changes
  useEffect(() => {
    if (patentClaimId) {
      setActivePatentClaim(patentClaimId);
    }
  }, [patentClaimId, setActivePatentClaim]);

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

  if (!patentClaim) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Patent claim not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/patent-claims">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Patent Claims
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <FileCheck className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Patent Claim #{patentClaim.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                {patentClaim.claim_type && <Badge variant="outline">{patentClaim.claim_type}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <FileCheck className="h-4 w-4" />
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
              <CardTitle>Patent Claim Details</CardTitle>
              <CardDescription>
                Basic information about this patent claim
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Patent</p>
                <p className="text-lg font-medium">{getPatentName(patentClaim.patent_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="text-lg font-medium">{getAssetName(patentClaim.asset_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Claim Type</p>
                <p className="text-lg font-medium">{patentClaim.claim_type}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(patentClaim.created_at).toLocaleDateString()}
                </p>
              </div>
              {patentClaim.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(patentClaim.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Patent Claim</CardTitle>
              <CardDescription>
                Update patent claim details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patent — searchable combobox */}
                <div className="space-y-2">
                  <Label>Patent</Label>
                  <Popover open={patentPopoverOpen} onOpenChange={setPatentPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={patentPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editPatentId ? patents.find(p => p.id.toString() === editPatentId)?.patent_number || 'Select patent' : 'Select patent'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search patent..." /><CommandList><CommandEmpty>No patents found.</CommandEmpty><CommandGroup>
                        {patents.map((p) => (<CommandItem key={p.id} value={p.patent_number} onSelect={() => { setEditPatentId(p.id.toString()); setPatentPopoverOpen(false); }}>{p.patent_number}{editPatentId === p.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
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
                        <span className="truncate">{editAssetId ? therapeuticAssets.find(a => a.id.toString() === editAssetId)?.name || 'Select asset' : 'Select asset'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search asset..." /><CommandList><CommandEmpty>No assets found.</CommandEmpty><CommandGroup>
                        {therapeuticAssets.map((a) => (<CommandItem key={a.id} value={a.name} onSelect={() => { setEditAssetId(a.id.toString()); setAssetPopoverOpen(false); }}>{a.name}{editAssetId === a.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Claim Type</Label>
                  <Select value={editClaimType} onValueChange={setEditClaimType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select claim type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLAIM_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedPatentId = parseInt(editPatentId, 10);
                  const parsedAssetId = parseInt(editAssetId, 10);
                  if (isNaN(parsedPatentId) || parsedPatentId <= 0) {
                    return;
                  }
                  if (isNaN(parsedAssetId) || parsedAssetId <= 0) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updatePatentClaim(patentClaimId, {
                      patent_id: parsedPatentId,
                      asset_id: parsedAssetId,
                      claim_type: editClaimType as ClaimType || undefined,
                    });
                    if (success) {
                      await fetchPatentClaims();
                    }
                  } catch (error) {
                    console.error('Failed to update patent claim:', error);
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
                  <h4 className="font-medium">Delete this patent claim</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the patent claim from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-patent-claim">
                    Type <span className="font-semibold">{patentClaim.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-patent-claim"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== patentClaim.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deletePatentClaim(patentClaimId);
                      if (success) {
                        router.push('/patent-claims');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete patent claim:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== patentClaim.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Patent Claim
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
