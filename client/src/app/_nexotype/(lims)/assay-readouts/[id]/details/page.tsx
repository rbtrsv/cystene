'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, AlertTriangle, Loader2, Settings, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { useAssayReadouts } from '@/modules/nexotype/hooks/lims/use-assay-readouts';
import { useAssayRuns } from '@/modules/nexotype/hooks/lims/use-assay-runs';
import { useBiospecimens } from '@/modules/nexotype/hooks/lims/use-biospecimens';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { useUnitsOfMeasure } from '@/modules/nexotype/hooks/standardization/use-units-of-measure';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/** Detail/settings page for AssayReadout with list fallback fetch-by-id. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function AssayReadoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assayReadoutId = parseInt(params.id as string, 10);

  const {
    assayReadouts,
    isLoading,
    error,
    setActiveAssayReadout,
    fetchAssayReadout,
    updateAssayReadout,
    deleteAssayReadout,
    fetchAssayReadouts,
  } = useAssayReadouts();
  const { assayRuns } = useAssayRuns();
  const { biospecimens } = useBiospecimens();
  const { therapeuticAssets } = useTherapeuticAssets();
  const { unitsOfMeasure } = useUnitsOfMeasure();

  // Resolve FK fields to display names
  const getRunName = (id: number | null | undefined) => {
    if (!id) return '—';
    return `Run #${id}`;
  };

  const getBiospecimenName = (id: number | null | undefined) => {
    if (!id) return '—';
    const b = biospecimens.find(bs => bs.id === id);
    return b ? b.barcode : `Biospecimen #${id}`;
  };

  const getAssetName = (id: number | null | undefined) => {
    if (!id) return '—';
    const a = therapeuticAssets.find(ta => ta.id === id);
    return a ? a.name : `Asset #${id}`;
  };

  const getUnitName = (id: number | null | undefined) => {
    if (!id) return '—';
    const u = unitsOfMeasure.find(um => um.id === id);
    return u ? u.symbol : `Unit #${id}`;
  };

  const listItem = assayReadouts.find((assayReadout) => assayReadout.id === assayReadoutId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [runId, setRunId] = useState('');
  const [biospecimenId, setBiospecimenId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [rawValue, setRawValue] = useState('');
  const [unitId, setUnitId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [runPopoverOpen, setRunPopoverOpen] = useState(false);
  const [biospecimenPopoverOpen, setBiospecimenPopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false);

  // Fetch directly when list is not yet hydrated.
  useEffect(() => {
    if (!listItem && assayReadoutId && !isLoading) {
      fetchAssayReadout(assayReadoutId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, assayReadoutId, isLoading, fetchAssayReadout]);

  // Keep edit form synced with loaded record.
  useEffect(() => {
    if (!item) return;
    setRunId(String(item.run_id));
    setBiospecimenId(item.biospecimen_id == null ? '' : String(item.biospecimen_id));
    setAssetId(item.asset_id == null ? '' : String(item.asset_id));
    setRawValue(String(item.raw_value));
    setUnitId(String(item.unit_id));
  }, [item]);

  useEffect(() => {
    if (assayReadoutId) setActiveAssayReadout(assayReadoutId);
  }, [assayReadoutId, setActiveAssayReadout]);

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
        <AlertDescription>Assay readout not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/assay-readouts">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Assay Readouts
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Assay Readout #{item.id}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{getRunName(item.run_id)}</Badge>
              <Badge variant="secondary">{getUnitName(item.unit_id)}</Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Assay Readout Details</CardTitle>
              <CardDescription>Measured value and linkage metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Assay Run</p>
                <p className="text-lg font-medium">{getRunName(item.run_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Biospecimen</p>
                <p className="text-lg font-medium">{getBiospecimenName(item.biospecimen_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Therapeutic Asset</p>
                <p className="text-lg font-medium">{getAssetName(item.asset_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Raw Value</p>
                <p className="text-lg font-medium">{item.raw_value}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit of Measure</p>
                <p className="text-lg font-medium">{getUnitName(item.unit_id)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Assay Readout</CardTitle>
              <CardDescription>Update fields and save readout metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Assay Run — searchable combobox */}
                <div className="space-y-2">
                  <Label>Assay Run</Label>
                  <Popover open={runPopoverOpen} onOpenChange={setRunPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={runPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {runId ? `Run #${runId}` : 'Select run'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search assay run..." />
                        <CommandList>
                          <CommandEmpty>No assay runs found.</CommandEmpty>
                          <CommandGroup>
                            {assayRuns.map((r) => (
                              <CommandItem
                                key={r.id}
                                value={`Run #${r.id}`}
                                onSelect={() => {
                                  setRunId(r.id.toString());
                                  setRunPopoverOpen(false);
                                }}
                              >
                                Run #{r.id}
                                {runId === r.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Unit of Measure — searchable combobox */}
                <div className="space-y-2">
                  <Label>Unit of Measure</Label>
                  <Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={unitPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {unitId
                            ? unitsOfMeasure.find(u => u.id.toString() === unitId)?.symbol || 'Select unit'
                            : 'Select unit'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search unit..." />
                        <CommandList>
                          <CommandEmpty>No units found.</CommandEmpty>
                          <CommandGroup>
                            {unitsOfMeasure.map((u) => (
                              <CommandItem
                                key={u.id}
                                value={u.symbol}
                                onSelect={() => {
                                  setUnitId(u.id.toString());
                                  setUnitPopoverOpen(false);
                                }}
                              >
                                {u.symbol}
                                {unitId === u.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Biospecimen — optional searchable combobox */}
                <div className="space-y-2">
                  <Label>Biospecimen</Label>
                  <Popover open={biospecimenPopoverOpen} onOpenChange={setBiospecimenPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={biospecimenPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {biospecimenId
                            ? biospecimens.find(b => b.id.toString() === biospecimenId)?.barcode || 'Select biospecimen'
                            : 'Select biospecimen'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search biospecimen..." />
                        <CommandList>
                          <CommandEmpty>No biospecimens found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__none__"
                              onSelect={() => {
                                setBiospecimenId('');
                                setBiospecimenPopoverOpen(false);
                              }}
                            >
                              — None —
                              {!biospecimenId && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            {biospecimens.map((b) => (
                              <CommandItem
                                key={b.id}
                                value={b.barcode}
                                onSelect={() => {
                                  setBiospecimenId(b.id.toString());
                                  setBiospecimenPopoverOpen(false);
                                }}
                              >
                                {b.barcode}
                                {biospecimenId === b.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Therapeutic Asset — optional searchable combobox */}
                <div className="space-y-2">
                  <Label>Therapeutic Asset</Label>
                  <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {assetId
                            ? therapeuticAssets.find(a => a.id.toString() === assetId)?.name || 'Select asset'
                            : 'Select asset'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search asset..." />
                        <CommandList>
                          <CommandEmpty>No assets found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="__none__"
                              onSelect={() => {
                                setAssetId('');
                                setAssetPopoverOpen(false);
                              }}
                            >
                              — None —
                              {!assetId && <Check className="ml-auto h-4 w-4" />}
                            </CommandItem>
                            {therapeuticAssets.map((a) => (
                              <CommandItem
                                key={a.id}
                                value={a.name}
                                onSelect={() => {
                                  setAssetId(a.id.toString());
                                  setAssetPopoverOpen(false);
                                }}
                              >
                                {a.name}
                                {assetId === a.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="raw-value">Raw Value</Label>
                  <Input
                    id="raw-value"
                    type="number"
                    step="any"
                    value={rawValue}
                    onChange={(e) => setRawValue(e.target.value)}
                  />
                </div>
              </div>

              <Button
                disabled={isUpdating}
                onClick={async () => {
                  const parsedRunId = parseInt(runId, 10);
                  const parsedUnitId = parseInt(unitId, 10);
                  const parsedRawValue = parseFloat(rawValue);
                  if (Number.isNaN(parsedRunId) || Number.isNaN(parsedUnitId) || Number.isNaN(parsedRawValue)) return;

                  setIsUpdating(true);
                  try {
                    const success = await updateAssayReadout(assayReadoutId, {
                      run_id: parsedRunId,
                      biospecimen_id: biospecimenId.trim() ? parseInt(biospecimenId, 10) : null,
                      asset_id: assetId.trim() ? parseInt(assetId, 10) : null,
                      raw_value: parsedRawValue,
                      unit_id: parsedUnitId,
                    });
                    if (success) await fetchAssayReadouts();
                  } finally {
                    setIsUpdating(false);
                  }
                }}
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

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Destructive actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will remove the assay readout from active use. The record will be soft-deleted.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm-delete-assay-readout">
                  Type <span className="font-semibold">{item.id}</span> to confirm
                </Label>
                <Input
                  id="confirm-delete-assay-readout"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Readout ID"
                />
              </div>
              <Button
                variant="destructive"
                disabled={isDeleting || deleteConfirmText !== String(item.id)}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const success = await deleteAssayReadout(assayReadoutId);
                    if (success) router.push('/assay-readouts');
                    else setIsDeleting(false);
                  } catch {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Assay Readout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
