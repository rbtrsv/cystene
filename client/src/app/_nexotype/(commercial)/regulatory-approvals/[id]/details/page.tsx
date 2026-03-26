'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRegulatoryApprovals } from '@/modules/nexotype/hooks/commercial/use-regulatory-approvals';
import { AGENCY_OPTIONS, APPROVAL_TYPE_OPTIONS, APPROVAL_STATUS_OPTIONS, type Agency, type ApprovalType, type ApprovalStatus } from '@/modules/nexotype/schemas/commercial/regulatory-approval.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, ShieldCheck, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { useIndications } from '@/modules/nexotype/hooks/clinical/use-indications';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function RegulatoryApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const regulatoryApprovalId = parseInt(params.id as string);
  const {
    regulatoryApprovals,
    isLoading,
    error,
    setActiveRegulatoryApproval,
    fetchRegulatoryApproval,
    updateRegulatoryApproval,
    deleteRegulatoryApproval,
    fetchRegulatoryApprovals
  } = useRegulatoryApprovals();
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

  const listItem = regulatoryApprovals.find(ra => ra.id === regulatoryApprovalId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const regulatoryApproval = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editAssetId, setEditAssetId] = useState('');
  const [editIndicationId, setEditIndicationId] = useState('');
  const [editAgency, setEditAgency] = useState('');
  const [editApprovalType, setEditApprovalType] = useState('');
  const [editApprovalDate, setEditApprovalDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [indicationPopoverOpen, setIndicationPopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this regulatory approval
  useEffect(() => {
    if (!listItem && regulatoryApprovalId && !isLoading) {
      fetchRegulatoryApproval(regulatoryApprovalId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, regulatoryApprovalId, isLoading, fetchRegulatoryApproval]);

  // Initialize edit form when regulatory approval changes
  useEffect(() => {
    if (regulatoryApproval) {
      setEditAssetId(regulatoryApproval.asset_id.toString());
      setEditIndicationId(regulatoryApproval.indication_id.toString());
      setEditAgency(regulatoryApproval.agency);
      setEditApprovalType(regulatoryApproval.approval_type);
      setEditApprovalDate(regulatoryApproval.approval_date);
      setEditStatus(regulatoryApproval.status);
    }
  }, [regulatoryApproval]);

  // Set active regulatory approval when ID changes
  useEffect(() => {
    if (regulatoryApprovalId) {
      setActiveRegulatoryApproval(regulatoryApprovalId);
    }
  }, [regulatoryApprovalId, setActiveRegulatoryApproval]);

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

  if (!regulatoryApproval) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Regulatory approval not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/regulatory-approvals">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Regulatory Approvals
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Regulatory Approval #{regulatoryApproval.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                {regulatoryApproval.status && <Badge variant="outline">{regulatoryApproval.status}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <ShieldCheck className="h-4 w-4" />
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
              <CardTitle>Regulatory Approval Details</CardTitle>
              <CardDescription>
                Basic information about this regulatory approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="text-lg font-medium">{getAssetName(regulatoryApproval.asset_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Indication</p>
                <p className="text-lg font-medium">{getIndicationName(regulatoryApproval.indication_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agency</p>
                <p className="text-lg font-medium">{regulatoryApproval.agency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approval Type</p>
                <p className="text-lg font-medium">{regulatoryApproval.approval_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approval Date</p>
                <p className="text-lg font-medium">{new Date(regulatoryApproval.approval_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-medium">{regulatoryApproval.status}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(regulatoryApproval.created_at).toLocaleDateString()}
                </p>
              </div>
              {regulatoryApproval.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(regulatoryApproval.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Regulatory Approval</CardTitle>
              <CardDescription>
                Update regulatory approval details
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
                  <Label>Agency</Label>
                  <Select value={editAgency} onValueChange={setEditAgency}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select agency" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Approval Type</Label>
                  <Select value={editApprovalType} onValueChange={setEditApprovalType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select approval type" />
                    </SelectTrigger>
                    <SelectContent>
                      {APPROVAL_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approval-date">Approval Date</Label>
                  <Input
                    id="approval-date"
                    type="date"
                    value={editApprovalDate}
                    onChange={(e) => setEditApprovalDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {APPROVAL_STATUS_OPTIONS.map((option) => (
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
                  const parsedAssetId = parseInt(editAssetId, 10);
                  const parsedIndicationId = parseInt(editIndicationId, 10);
                  if (isNaN(parsedAssetId) || parsedAssetId <= 0) {
                    return;
                  }
                  if (isNaN(parsedIndicationId) || parsedIndicationId <= 0) {
                    return;
                  }
                  if (!editAgency) {
                    return;
                  }
                  if (!editApprovalType) {
                    return;
                  }
                  if (!editApprovalDate) {
                    return;
                  }
                  if (!editStatus) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateRegulatoryApproval(regulatoryApprovalId, {
                      asset_id: parsedAssetId,
                      indication_id: parsedIndicationId,
                      agency: editAgency as Agency,
                      approval_type: editApprovalType as ApprovalType,
                      approval_date: editApprovalDate,
                      status: editStatus as ApprovalStatus,
                    });
                    if (success) {
                      await fetchRegulatoryApprovals();
                    }
                  } catch (error) {
                    console.error('Failed to update regulatory approval:', error);
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
                  <h4 className="font-medium">Delete this regulatory approval</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the regulatory approval from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-regulatory-approval">
                    Type <span className="font-semibold">{regulatoryApproval.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-regulatory-approval"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== regulatoryApproval.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteRegulatoryApproval(regulatoryApprovalId);
                      if (success) {
                        router.push('/regulatory-approvals');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete regulatory approval:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== regulatoryApproval.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Regulatory Approval
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
