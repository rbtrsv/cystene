'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Loader2, Settings, Trash2, TestTubeDiagonal, ChevronsUpDown, Check } from 'lucide-react';
import { useBiospecimens } from '@/modules/nexotype/hooks/lims/use-biospecimens';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { SAMPLE_TYPE_OPTIONS, type SampleType } from '@/modules/nexotype/schemas/lims/biospecimen.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/** Detail/settings page for Biospecimen with list fallback fetch-by-id. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function BiospecimenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const biospecimenId = parseInt(params.id as string, 10);

  const {
    biospecimens,
    isLoading,
    error,
    setActiveBiospecimen,
    fetchBiospecimen,
    updateBiospecimen,
    deleteBiospecimen,
    fetchBiospecimens,
  } = useBiospecimens();
  const { subjects } = useSubjects();

  // Resolve subject FK to display name
  const getSubjectName = (id: number | null | undefined) => {
    if (!id) return '—';
    const subj = subjects.find(s => s.id === id);
    return subj ? subj.subject_identifier : `Subject #${id}`;
  };

  const listItem = biospecimens.find((biospecimen) => biospecimen.id === biospecimenId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [subjectId, setSubjectId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sampleType, setSampleType] = useState('');
  const [freezerLocation, setFreezerLocation] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [subjectPopoverOpen, setSubjectPopoverOpen] = useState(false);

  // Fetch directly when list is not yet hydrated.
  useEffect(() => {
    if (!listItem && biospecimenId && !isLoading) {
      fetchBiospecimen(biospecimenId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, biospecimenId, isLoading, fetchBiospecimen]);

  // Keep edit form synced with loaded record.
  useEffect(() => {
    if (!item) return;
    setSubjectId(String(item.subject_id));
    setBarcode(item.barcode);
    setSampleType(item.sample_type);
    setFreezerLocation(item.freezer_location ?? '');
  }, [item]);

  useEffect(() => {
    if (biospecimenId) setActiveBiospecimen(biospecimenId);
  }, [biospecimenId, setActiveBiospecimen]);

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
        <AlertDescription>Biospecimen not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/biospecimens">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Biospecimens
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <TestTubeDiagonal className="h-8 w-8 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Biospecimen {item.barcode}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{getSubjectName(item.subject_id)}</Badge>
              <Badge variant="secondary">{item.sample_type}</Badge>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <TestTubeDiagonal className="h-4 w-4" />
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
              <CardTitle>Biospecimen Details</CardTitle>
              <CardDescription>Core metadata for this biospecimen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="text-lg font-medium">{getSubjectName(item.subject_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Barcode</p>
                <p className="text-lg font-medium">{item.barcode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sample Type</p>
                <p className="text-lg font-medium">{item.sample_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Freezer Location</p>
                <p className="text-lg font-medium">{item.freezer_location ?? '—'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Biospecimen</CardTitle>
              <CardDescription>Update fields and save changes to this biospecimen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sample Type</Label>
                  <Select value={sampleType} onValueChange={setSampleType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sample type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAMPLE_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freezer-location">Freezer Location</Label>
                  <Input
                    id="freezer-location"
                    value={freezerLocation}
                    onChange={(e) => setFreezerLocation(e.target.value)}
                  />
                </div>
              </div>

              <Button
                disabled={isUpdating}
                onClick={async () => {
                  const parsedSubjectId = parseInt(subjectId, 10);
                  if (Number.isNaN(parsedSubjectId) || !barcode.trim() || !sampleType) return;

                  setIsUpdating(true);
                  try {
                    const success = await updateBiospecimen(biospecimenId, {
                      subject_id: parsedSubjectId,
                      barcode: barcode.trim(),
                      sample_type: sampleType as SampleType,
                      freezer_location: freezerLocation.trim() || null,
                    });
                    if (success) await fetchBiospecimens();
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
                This will remove the biospecimen from active use. The record will be soft-deleted.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm-delete-biospecimen">
                  Type <span className="font-semibold">{item.barcode}</span> to confirm
                </Label>
                <Input
                  id="confirm-delete-biospecimen"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Barcode"
                />
              </div>
              <Button
                variant="destructive"
                disabled={isDeleting || deleteConfirmText !== item.barcode}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const success = await deleteBiospecimen(biospecimenId);
                    if (success) router.push('/biospecimens');
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
                    Delete Biospecimen
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
