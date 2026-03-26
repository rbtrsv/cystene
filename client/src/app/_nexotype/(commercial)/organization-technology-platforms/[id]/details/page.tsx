'use client';

import { useParams, useRouter } from 'next/navigation';
import { useOrganizationTechnologyPlatforms } from '@/modules/nexotype/hooks/commercial/use-organization-technology-platforms';
import { UTILIZATION_TYPE_OPTIONS, type UtilizationType } from '@/modules/nexotype/schemas/commercial/organization-technology-platform.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Building2, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { useTechnologyPlatforms } from '@/modules/nexotype/hooks/commercial/use-technology-platforms';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function OrganizationTechnologyPlatformDetailPage() {
  const params = useParams();
  const router = useRouter();
  const organizationTechnologyPlatformId = parseInt(params.id as string);
  const {
    organizationTechnologyPlatforms,
    isLoading,
    error,
    setActiveOrganizationTechnologyPlatform,
    fetchOrganizationTechnologyPlatform,
    updateOrganizationTechnologyPlatform,
    deleteOrganizationTechnologyPlatform,
    fetchOrganizationTechnologyPlatforms
  } = useOrganizationTechnologyPlatforms();
  const { marketOrganizations } = useMarketOrganizations();
  const { technologyPlatforms } = useTechnologyPlatforms();

  // Resolve FK fields to display names
  const getOrgName = (id: number | null | undefined) => {
    if (!id) return '—';
    const o = marketOrganizations.find(mo => mo.id === id);
    return o ? o.legal_name : `Organization #${id}`;
  };

  const getPlatformName = (id: number | null | undefined) => {
    if (!id) return '—';
    const tp = technologyPlatforms.find(t => t.id === id);
    return tp ? tp.name : `Platform #${id}`;
  };

  const listItem = organizationTechnologyPlatforms.find(otp => otp.id === organizationTechnologyPlatformId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const organizationTechnologyPlatform = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editMarketOrganizationId, setEditMarketOrganizationId] = useState('');
  const [editTechnologyPlatformId, setEditTechnologyPlatformId] = useState('');
  const [editUtilizationType, setEditUtilizationType] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);
  const [platformPopoverOpen, setPlatformPopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this organization technology platform
  useEffect(() => {
    if (!listItem && organizationTechnologyPlatformId && !isLoading) {
      fetchOrganizationTechnologyPlatform(organizationTechnologyPlatformId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, organizationTechnologyPlatformId, isLoading, fetchOrganizationTechnologyPlatform]);

  // Initialize edit form when organization technology platform changes
  useEffect(() => {
    if (organizationTechnologyPlatform) {
      setEditMarketOrganizationId(organizationTechnologyPlatform.market_organization_id.toString());
      setEditTechnologyPlatformId(organizationTechnologyPlatform.technology_platform_id.toString());
      setEditUtilizationType(organizationTechnologyPlatform.utilization_type);
    }
  }, [organizationTechnologyPlatform]);

  // Set active organization technology platform when ID changes
  useEffect(() => {
    if (organizationTechnologyPlatformId) {
      setActiveOrganizationTechnologyPlatform(organizationTechnologyPlatformId);
    }
  }, [organizationTechnologyPlatformId, setActiveOrganizationTechnologyPlatform]);

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

  if (!organizationTechnologyPlatform) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Organization technology platform not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/organization-technology-platforms">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Organization Technology Platforms
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Organization Technology Platform #{organizationTechnologyPlatform.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{organizationTechnologyPlatform.utilization_type}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Building2 className="h-4 w-4" />
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
              <CardTitle>Organization Technology Platform Details</CardTitle>
              <CardDescription>
                Basic information about this organization technology platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Market Organization</p>
                <p className="text-lg font-medium">{getOrgName(organizationTechnologyPlatform.market_organization_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Technology Platform</p>
                <p className="text-lg font-medium">{getPlatformName(organizationTechnologyPlatform.technology_platform_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilization Type</p>
                <p className="text-lg font-medium">{organizationTechnologyPlatform.utilization_type}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(organizationTechnologyPlatform.created_at).toLocaleDateString()}
                </p>
              </div>
              {organizationTechnologyPlatform.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(organizationTechnologyPlatform.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Organization Technology Platform</CardTitle>
              <CardDescription>
                Update organization technology platform details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Market Organization — searchable combobox */}
                <div className="space-y-2">
                  <Label>Market Organization</Label>
                  <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={orgPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editMarketOrganizationId ? marketOrganizations.find(o => o.id.toString() === editMarketOrganizationId)?.legal_name || 'Select organization' : 'Select organization'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search organization..." /><CommandList><CommandEmpty>No organizations found.</CommandEmpty><CommandGroup>
                        {marketOrganizations.map((o) => (<CommandItem key={o.id} value={o.legal_name} onSelect={() => { setEditMarketOrganizationId(o.id.toString()); setOrgPopoverOpen(false); }}>{o.legal_name}{editMarketOrganizationId === o.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Technology Platform — searchable combobox */}
                <div className="space-y-2">
                  <Label>Technology Platform</Label>
                  <Popover open={platformPopoverOpen} onOpenChange={setPlatformPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={platformPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editTechnologyPlatformId ? technologyPlatforms.find(tp => tp.id.toString() === editTechnologyPlatformId)?.name || 'Select platform' : 'Select platform'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search platform..." /><CommandList><CommandEmpty>No platforms found.</CommandEmpty><CommandGroup>
                        {technologyPlatforms.map((tp) => (<CommandItem key={tp.id} value={tp.name} onSelect={() => { setEditTechnologyPlatformId(tp.id.toString()); setPlatformPopoverOpen(false); }}>{tp.name}{editTechnologyPlatformId === tp.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Utilization Type</Label>
                  <Select value={editUtilizationType} onValueChange={setEditUtilizationType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select utilization type" />
                    </SelectTrigger>
                    <SelectContent>
                      {UTILIZATION_TYPE_OPTIONS.map((option) => (
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
                  const parsedMarketOrganizationId = parseInt(editMarketOrganizationId, 10);
                  const parsedTechnologyPlatformId = parseInt(editTechnologyPlatformId, 10);
                  if (isNaN(parsedMarketOrganizationId) || parsedMarketOrganizationId <= 0) {
                    return;
                  }
                  if (isNaN(parsedTechnologyPlatformId) || parsedTechnologyPlatformId <= 0) {
                    return;
                  }
                  if (!editUtilizationType) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateOrganizationTechnologyPlatform(organizationTechnologyPlatformId, {
                      market_organization_id: parsedMarketOrganizationId,
                      technology_platform_id: parsedTechnologyPlatformId,
                      utilization_type: editUtilizationType as UtilizationType,
                    });
                    if (success) {
                      await fetchOrganizationTechnologyPlatforms();
                    }
                  } catch (error) {
                    console.error('Failed to update organization technology platform:', error);
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
                  <h4 className="font-medium">Delete this organization technology platform</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the organization technology platform from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-organization-technology-platform">
                    Type <span className="font-semibold">{organizationTechnologyPlatform.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-organization-technology-platform"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== organizationTechnologyPlatform.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteOrganizationTechnologyPlatform(organizationTechnologyPlatformId);
                      if (success) {
                        router.push('/organization-technology-platforms');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete organization technology platform:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== organizationTechnologyPlatform.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Organization Technology Platform
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
