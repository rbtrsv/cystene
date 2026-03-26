'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDevelopmentPipelines } from '@/modules/nexotype/hooks/commercial/use-development-pipelines';
import { PIPELINE_PHASE_OPTIONS, PIPELINE_STATUS_OPTIONS, type PipelinePhase, type PipelineStatus } from '@/modules/nexotype/schemas/commercial/development-pipeline.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Layers, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { useIndications } from '@/modules/nexotype/hooks/clinical/use-indications';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function DevelopmentPipelineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const developmentPipelineId = parseInt(params.id as string);
  const {
    developmentPipelines,
    isLoading,
    error,
    setActiveDevelopmentPipeline,
    fetchDevelopmentPipeline,
    updateDevelopmentPipeline,
    deleteDevelopmentPipeline,
    fetchDevelopmentPipelines
  } = useDevelopmentPipelines();
  const { therapeuticAssets } = useTherapeuticAssets();
  const { indications } = useIndications();

  // Resolve FK fields to display names
  const getAssetName = (id: number | null | undefined) => {
    if (!id) return '—';
    const a = therapeuticAssets.find(ta => ta.id === id);
    return a ? a.name : `Asset #${id}`;
  };

  const getIndicationName = (id: number | null | undefined) => {
    if (!id) return '—';
    const i = indications.find(ind => ind.id === id);
    return i ? i.name : `Indication #${id}`;
  };

  const listItem = developmentPipelines.find(dp => dp.id === developmentPipelineId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const developmentPipeline = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editAssetId, setEditAssetId] = useState('');
  const [editIndicationId, setEditIndicationId] = useState('');
  const [editPhase, setEditPhase] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNctNumber, setEditNctNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [indicationPopoverOpen, setIndicationPopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this development pipeline
  useEffect(() => {
    if (!listItem && developmentPipelineId && !isLoading) {
      fetchDevelopmentPipeline(developmentPipelineId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, developmentPipelineId, isLoading, fetchDevelopmentPipeline]);

  // Initialize edit form when development pipeline changes
  useEffect(() => {
    if (developmentPipeline) {
      setEditAssetId(developmentPipeline.asset_id.toString());
      setEditIndicationId(developmentPipeline.indication_id.toString());
      setEditPhase(developmentPipeline.phase);
      setEditStatus(developmentPipeline.status);
      setEditNctNumber(developmentPipeline.nct_number || '');
    }
  }, [developmentPipeline]);

  // Set active development pipeline when ID changes
  useEffect(() => {
    if (developmentPipelineId) {
      setActiveDevelopmentPipeline(developmentPipelineId);
    }
  }, [developmentPipelineId, setActiveDevelopmentPipeline]);

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

  if (!developmentPipeline) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Development pipeline not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/development-pipelines">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Development Pipelines
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Layers className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Development Pipeline #{developmentPipeline.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                {developmentPipeline.phase && <Badge variant="outline">{developmentPipeline.phase}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Layers className="h-4 w-4" />
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
              <CardTitle>Development Pipeline Details</CardTitle>
              <CardDescription>
                Basic information about this development pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="text-lg font-medium">{getAssetName(developmentPipeline.asset_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Indication</p>
                <p className="text-lg font-medium">{getIndicationName(developmentPipeline.indication_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phase</p>
                <p className="text-lg font-medium">{developmentPipeline.phase}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-medium">{developmentPipeline.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NCT Number</p>
                <p className="text-lg font-medium">{developmentPipeline.nct_number || '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(developmentPipeline.created_at).toLocaleDateString()}
                </p>
              </div>
              {developmentPipeline.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(developmentPipeline.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Development Pipeline</CardTitle>
              <CardDescription>
                Update development pipeline details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {/* Indication — searchable combobox */}
                <div className="space-y-2">
                  <Label>Indication</Label>
                  <Popover open={indicationPopoverOpen} onOpenChange={setIndicationPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={indicationPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editIndicationId ? indications.find(i => i.id.toString() === editIndicationId)?.name || 'Select indication' : 'Select indication'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search indication..." /><CommandList><CommandEmpty>No indications found.</CommandEmpty><CommandGroup>
                        {indications.map((i) => (<CommandItem key={i.id} value={i.name} onSelect={() => { setEditIndicationId(i.id.toString()); setIndicationPopoverOpen(false); }}>{i.name}{editIndicationId === i.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Phase</Label>
                  <Select value={editPhase} onValueChange={setEditPhase}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_PHASE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nct-number">NCT Number</Label>
                  <Input
                    id="nct-number"
                    value={editNctNumber}
                    onChange={(e) => setEditNctNumber(e.target.value)}
                    placeholder="e.g., NCT01234567"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedAssetId = parseInt(editAssetId, 10);
                  const parsedIndicationId = parseInt(editIndicationId, 10);
                  if (isNaN(parsedAssetId) || parsedAssetId <= 0) {
                    return;
                  }
                  if (isNaN(parsedIndicationId) || parsedIndicationId <= 0) {
                    return;
                  }
                  if (!editPhase) {
                    return;
                  }
                  if (!editStatus) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateDevelopmentPipeline(developmentPipelineId, {
                      asset_id: parsedAssetId,
                      indication_id: parsedIndicationId,
                      phase: editPhase as PipelinePhase,
                      status: editStatus as PipelineStatus,
                      nct_number: editNctNumber.trim() || null,
                    });
                    if (success) {
                      await fetchDevelopmentPipelines();
                    }
                  } catch (error) {
                    console.error('Failed to update development pipeline:', error);
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
                  <h4 className="font-medium">Delete this development pipeline</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the development pipeline from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-development-pipeline">
                    Type <span className="font-semibold">{developmentPipeline.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-development-pipeline"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== developmentPipeline.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteDevelopmentPipeline(developmentPipelineId);
                      if (success) {
                        router.push('/development-pipelines');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete development pipeline:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== developmentPipeline.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Development Pipeline
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
