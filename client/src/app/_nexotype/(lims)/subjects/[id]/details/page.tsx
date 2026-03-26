'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Loader2, Settings, Trash2, User2, ChevronsUpDown, Check } from 'lucide-react';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { useOrganisms } from '@/modules/nexotype/hooks/omics/use-organisms';
import { SEX_OPTIONS, type Sex } from '@/modules/nexotype/schemas/lims/subject.schemas';
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

/** Detail/settings page for Subject with safe list fallback fetch-by-id. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = parseInt(params.id as string, 10);

  const {
    subjects,
    isLoading,
    error,
    setActiveSubject,
    fetchSubject,
    updateSubject,
    deleteSubject,
    fetchSubjects,
  } = useSubjects();
  const { organisms } = useOrganisms();

  // Resolve organism FK to display name
  const getOrganismName = (id: number | null | undefined) => {
    if (!id) return '—';
    const item = organisms.find(o => o.id === id);
    return item ? item.scientific_name : `Organism #${id}`;
  };

  const listItem = subjects.find((subject) => subject.id === subjectId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  // Settings form state
  const [subjectIdentifier, setSubjectIdentifier] = useState('');
  const [organismId, setOrganismId] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [sex, setSex] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [organismPopoverOpen, setOrganismPopoverOpen] = useState(false);

  // Fetch by ID when direct navigation lands before list hydration.
  useEffect(() => {
    if (!listItem && subjectId && !isLoading) {
      fetchSubject(subjectId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, subjectId, isLoading, fetchSubject]);

  // Keep edit form synced with loaded record.
  useEffect(() => {
    if (!item) return;
    setSubjectIdentifier(item.subject_identifier);
    setOrganismId(String(item.organism_id));
    setCohortName(item.cohort_name ?? '');
    setSex(item.sex ?? '');
  }, [item]);

  useEffect(() => {
    if (subjectId) setActiveSubject(subjectId);
  }, [subjectId, setActiveSubject]);

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
        <AlertDescription>Subject not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/subjects">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Subjects
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <User2 className="h-8 w-8 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Subject {item.subject_identifier}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{getOrganismName(item.organism_id)}</Badge>
              {item.cohort_name && <Badge variant="secondary">{item.cohort_name}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <User2 className="h-4 w-4" />
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
              <CardTitle>Subject Details</CardTitle>
              <CardDescription>Core metadata for this subject record</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Subject Identifier</p>
                <p className="text-lg font-medium">{item.subject_identifier}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Organism</p>
                <p className="text-lg font-medium">{getOrganismName(item.organism_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cohort Name</p>
                <p className="text-lg font-medium">{item.cohort_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sex</p>
                <p className="text-lg font-medium">{item.sex ?? '—'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Subject</CardTitle>
              <CardDescription>Update fields and save changes to this subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject-identifier">Subject Identifier</Label>
                  <Input
                    id="subject-identifier"
                    value={subjectIdentifier}
                    onChange={(e) => setSubjectIdentifier(e.target.value)}
                  />
                </div>
                {/* Organism — searchable combobox */}
                <div className="space-y-2">
                  <Label>Organism</Label>
                  <Popover open={organismPopoverOpen} onOpenChange={setOrganismPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={organismPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {organismId
                            ? organisms.find(o => o.id.toString() === organismId)?.scientific_name || 'Select organism'
                            : 'Select organism'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search organism..." />
                        <CommandList>
                          <CommandEmpty>No organisms found.</CommandEmpty>
                          <CommandGroup>
                            {organisms.map((o) => (
                              <CommandItem
                                key={o.id}
                                value={o.scientific_name}
                                onSelect={() => {
                                  setOrganismId(o.id.toString());
                                  setOrganismPopoverOpen(false);
                                }}
                              >
                                {o.scientific_name}
                                {organismId === o.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cohort-name">Cohort Name</Label>
                  <Input
                    id="cohort-name"
                    value={cohortName}
                    onChange={(e) => setCohortName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sex</Label>
                  <Select value={sex} onValueChange={setSex}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {SEX_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                disabled={isUpdating}
                onClick={async () => {
                  const parsedOrganismId = parseInt(organismId, 10);
                  if (!subjectIdentifier.trim() || Number.isNaN(parsedOrganismId)) return;

                  setIsUpdating(true);
                  try {
                    const success = await updateSubject(subjectId, {
                      subject_identifier: subjectIdentifier.trim(),
                      organism_id: parsedOrganismId,
                      cohort_name: cohortName.trim() || null,
                      sex: sex === '' || sex === '__none__' ? null : sex as Sex,
                    });
                    if (success) await fetchSubjects();
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
                This will remove the subject from active use. The record will be soft-deleted.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm-delete-subject">
                  Type <span className="font-semibold">{item.subject_identifier}</span> to confirm
                </Label>
                <Input
                  id="confirm-delete-subject"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Subject Identifier"
                />
              </div>
              <Button
                variant="destructive"
                disabled={isDeleting || deleteConfirmText !== item.subject_identifier}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const success = await deleteSubject(subjectId);
                    if (success) router.push('/subjects');
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
                    Delete Subject
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
