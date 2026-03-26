'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePatentAssignees } from '@/modules/nexotype/hooks/commercial/use-patent-assignees';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, UserCheck, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function PatentAssigneeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patentAssigneeId = parseInt(params.id as string);
  const {
    patentAssignees,
    isLoading,
    error,
    setActivePatentAssignee,
    fetchPatentAssignee,
    updatePatentAssignee,
    deletePatentAssignee,
    fetchPatentAssignees
  } = usePatentAssignees();
  const { patents } = usePatents();
  const { marketOrganizations } = useMarketOrganizations();

  // Resolve FK fields to display names
  const getPatentName = (id: number | null | undefined) => {
    if (!id) return '—';
    const p = patents.find(pt => pt.id === id);
    return p ? p.patent_number : `Patent #${id}`;
  };

  const getOrgName = (id: number | null | undefined) => {
    if (!id) return '—';
    const o = marketOrganizations.find(mo => mo.id === id);
    return o ? o.legal_name : `Organization #${id}`;
  };

  const listItem = patentAssignees.find(pa => pa.id === patentAssigneeId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const patentAssignee = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editPatentId, setEditPatentId] = useState('');
  const [editMarketOrganizationId, setEditMarketOrganizationId] = useState('');
  const [editAssignmentDate, setEditAssignmentDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [patentPopoverOpen, setPatentPopoverOpen] = useState(false);
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this patent assignee
  useEffect(() => {
    if (!listItem && patentAssigneeId && !isLoading) {
      fetchPatentAssignee(patentAssigneeId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, patentAssigneeId, isLoading, fetchPatentAssignee]);

  // Initialize edit form when patent assignee changes
  useEffect(() => {
    if (patentAssignee) {
      setEditPatentId(patentAssignee.patent_id.toString());
      setEditMarketOrganizationId(patentAssignee.market_organization_id.toString());
      setEditAssignmentDate(patentAssignee.assignment_date || '');
    }
  }, [patentAssignee]);

  // Set active patent assignee when ID changes
  useEffect(() => {
    if (patentAssigneeId) {
      setActivePatentAssignee(patentAssigneeId);
    }
  }, [patentAssigneeId, setActivePatentAssignee]);

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

  if (!patentAssignee) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Patent assignee not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/patent-assignees">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Patent Assignees
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <UserCheck className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Patent Assignee #{patentAssignee.id}</h1>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <UserCheck className="h-4 w-4" />
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
              <CardTitle>Patent Assignee Details</CardTitle>
              <CardDescription>
                Basic information about this patent assignee
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Patent</p>
                <p className="text-lg font-medium">{getPatentName(patentAssignee.patent_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Market Organization</p>
                <p className="text-lg font-medium">{getOrgName(patentAssignee.market_organization_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assignment Date</p>
                <p className="text-lg font-medium">{new Date(patentAssignee.assignment_date).toLocaleDateString()}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(patentAssignee.created_at).toLocaleDateString()}
                </p>
              </div>
              {patentAssignee.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(patentAssignee.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Patent Assignee</CardTitle>
              <CardDescription>
                Update patent assignee details
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="assignment-date">Assignment Date</Label>
                  <Input
                    id="assignment-date"
                    type="date"
                    value={editAssignmentDate}
                    onChange={(e) => setEditAssignmentDate(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedPatentId = parseInt(editPatentId, 10);
                  const parsedMarketOrganizationId = parseInt(editMarketOrganizationId, 10);
                  if (isNaN(parsedPatentId) || parsedPatentId <= 0) {
                    return;
                  }
                  if (isNaN(parsedMarketOrganizationId) || parsedMarketOrganizationId <= 0) {
                    return;
                  }
                  if (!editAssignmentDate) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updatePatentAssignee(patentAssigneeId, {
                      patent_id: parsedPatentId,
                      market_organization_id: parsedMarketOrganizationId,
                      assignment_date: editAssignmentDate,
                    });
                    if (success) {
                      await fetchPatentAssignees();
                    }
                  } catch (error) {
                    console.error('Failed to update patent assignee:', error);
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
                  <h4 className="font-medium">Delete this patent assignee</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the patent assignee from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-patent-assignee">
                    Type <span className="font-semibold">{patentAssignee.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-patent-assignee"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== patentAssignee.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deletePatentAssignee(patentAssigneeId);
                      if (success) {
                        router.push('/patent-assignees');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete patent assignee:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== patentAssignee.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Patent Assignee
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
