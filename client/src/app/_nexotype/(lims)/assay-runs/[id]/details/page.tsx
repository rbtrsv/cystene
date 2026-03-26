'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Beaker, Loader2, Settings, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { useAssayRuns } from '@/modules/nexotype/hooks/lims/use-assay-runs';
import { useAssayProtocols } from '@/modules/nexotype/hooks/lims/use-assay-protocols';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';

/** Detail/settings page for AssayRun with list fallback fetch-by-id. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function AssayRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assayRunId = parseInt(params.id as string, 10);

  const {
    assayRuns,
    isLoading,
    error,
    setActiveAssayRun,
    fetchAssayRun,
    updateAssayRun,
    deleteAssayRun,
    fetchAssayRuns,
  } = useAssayRuns();
  const { assayProtocols } = useAssayProtocols();

  // Resolve protocol FK to display name
  const getProtocolName = (id: number | null | undefined) => {
    if (!id) return '—';
    const protocol = assayProtocols.find(p => p.id === id);
    return protocol ? protocol.name : `Protocol #${id}`;
  };

  const listItem = assayRuns.find((assayRun) => assayRun.id === assayRunId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const item = listItem ?? fetchedItem ?? null;

  const [protocolId, setProtocolId] = useState('');
  const [runDate, setRunDate] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [protocolPopoverOpen, setProtocolPopoverOpen] = useState(false);

  // Fetch directly when list is not yet hydrated.
  useEffect(() => {
    if (!listItem && assayRunId && !isLoading) {
      fetchAssayRun(assayRunId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, assayRunId, isLoading, fetchAssayRun]);

  // Keep edit form synced with loaded record.
  useEffect(() => {
    if (!item) return;
    setProtocolId(String(item.protocol_id));
    setRunDate(item.run_date.split('T')[0]);
    setOperatorId(item.operator_id == null ? '' : String(item.operator_id));
  }, [item]);

  useEffect(() => {
    if (assayRunId) setActiveAssayRun(assayRunId);
  }, [assayRunId, setActiveAssayRun]);

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
        <AlertDescription>Assay run not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/assay-runs">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to Assay Runs
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Beaker className="h-8 w-8 hidden sm:block" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Assay Run #{item.id}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{getProtocolName(item.protocol_id)}</Badge>
              {item.operator_id != null && <Badge variant="secondary">Operator {item.operator_id}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Beaker className="h-4 w-4" />
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
              <CardTitle>Assay Run Details</CardTitle>
              <CardDescription>Core metadata for this assay run</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Protocol</p>
                <p className="text-lg font-medium">{getProtocolName(item.protocol_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Run Date</p>
                <p className="text-lg font-medium">{new Date(item.run_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Operator ID</p>
                <p className="text-lg font-medium">{item.operator_id ?? '—'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Assay Run</CardTitle>
              <CardDescription>Update fields and save run metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Protocol — searchable combobox */}
                <div className="space-y-2">
                  <Label>Protocol</Label>
                  <Popover open={protocolPopoverOpen} onOpenChange={setProtocolPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={protocolPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {protocolId
                            ? assayProtocols.find(p => p.id.toString() === protocolId)?.name || 'Select protocol'
                            : 'Select protocol'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search protocol..." />
                        <CommandList>
                          <CommandEmpty>No protocols found.</CommandEmpty>
                          <CommandGroup>
                            {assayProtocols.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.name}
                                onSelect={() => {
                                  setProtocolId(p.id.toString());
                                  setProtocolPopoverOpen(false);
                                }}
                              >
                                {p.name}
                                {protocolId === p.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="run-date">Run Date</Label>
                  <Input id="run-date" type="date" value={runDate} onChange={(e) => setRunDate(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="operator-id">Operator ID</Label>
                  <Input
                    id="operator-id"
                    type="number"
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <Button
                disabled={isUpdating}
                onClick={async () => {
                  const parsedProtocolId = parseInt(protocolId, 10);
                  if (Number.isNaN(parsedProtocolId) || !runDate.trim()) return;

                  setIsUpdating(true);
                  try {
                    const success = await updateAssayRun(assayRunId, {
                      protocol_id: parsedProtocolId,
                      run_date: runDate,
                      operator_id: operatorId.trim() ? parseInt(operatorId, 10) : null,
                    });
                    if (success) await fetchAssayRuns();
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
                This will remove the assay run from active use. The record will be soft-deleted.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm-delete-assay-run">
                  Type <span className="font-semibold">{item.id}</span> to confirm
                </Label>
                <Input
                  id="confirm-delete-assay-run"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Run ID"
                />
              </div>
              <Button
                variant="destructive"
                disabled={isDeleting || deleteConfirmText !== String(item.id)}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const success = await deleteAssayRun(assayRunId);
                    if (success) router.push('/assay-runs');
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
                    Delete Assay Run
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
