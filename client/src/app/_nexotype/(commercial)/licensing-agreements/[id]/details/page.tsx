'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLicensingAgreements } from '@/modules/nexotype/hooks/commercial/use-licensing-agreements';
import { AGREEMENT_TYPE_OPTIONS, TERRITORY_OPTIONS, LICENSE_STATUS_OPTIONS, type AgreementType, type Territory, type LicenseStatus } from '@/modules/nexotype/schemas/commercial/licensing-agreement.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Handshake, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function LicensingAgreementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const licensingAgreementId = parseInt(params.id as string);
  const {
    licensingAgreements,
    isLoading,
    error,
    setActiveLicensingAgreement,
    fetchLicensingAgreement,
    updateLicensingAgreement,
    deleteLicensingAgreement,
    fetchLicensingAgreements
  } = useLicensingAgreements();
  const { marketOrganizations } = useMarketOrganizations();
  const { therapeuticAssets } = useTherapeuticAssets();
  const { patents } = usePatents();

  // Resolve FK fields to display names
  const getOrgName = (id: number | null | undefined) => {
    if (!id) return '—';
    const o = marketOrganizations.find(mo => mo.id === id);
    return o ? o.legal_name : `Organization #${id}`;
  };

  const getAssetName = (id: number | null | undefined) => {
    if (!id) return '—';
    const a = therapeuticAssets.find(ta => ta.id === id);
    return a ? a.name : `Asset #${id}`;
  };

  const getPatentName = (id: number | null | undefined) => {
    if (!id) return '—';
    const p = patents.find(pt => pt.id === id);
    return p ? p.patent_number : `Patent #${id}`;
  };

  const listItem = licensingAgreements.find(la => la.id === licensingAgreementId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const licensingAgreement = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editLicensorId, setEditLicensorId] = useState('');
  const [editLicenseeId, setEditLicenseeId] = useState('');
  const [editAssetId, setEditAssetId] = useState('');
  const [editPatentId, setEditPatentId] = useState('');
  const [editAgreementType, setEditAgreementType] = useState('');
  const [editTerritory, setEditTerritory] = useState('');
  const [editValueUsd, setEditValueUsd] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [licensorPopoverOpen, setLicensorPopoverOpen] = useState(false);
  const [licenseePopoverOpen, setLicenseePopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [patentPopoverOpen, setPatentPopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this licensing agreement
  useEffect(() => {
    if (!listItem && licensingAgreementId && !isLoading) {
      fetchLicensingAgreement(licensingAgreementId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, licensingAgreementId, isLoading, fetchLicensingAgreement]);

  // Initialize edit form when licensing agreement changes
  useEffect(() => {
    if (licensingAgreement) {
      setEditLicensorId(licensingAgreement.licensor_id.toString());
      setEditLicenseeId(licensingAgreement.licensee_id.toString());
      setEditAssetId(licensingAgreement.asset_id != null ? licensingAgreement.asset_id.toString() : '');
      setEditPatentId(licensingAgreement.patent_id != null ? licensingAgreement.patent_id.toString() : '');
      setEditAgreementType(licensingAgreement.agreement_type);
      setEditTerritory(licensingAgreement.territory || '');
      setEditValueUsd(licensingAgreement.value_usd != null ? licensingAgreement.value_usd.toString() : '');
      setEditStartDate(licensingAgreement.start_date);
      setEditEndDate(licensingAgreement.end_date || '');
      setEditStatus(licensingAgreement.status);
    }
  }, [licensingAgreement]);

  // Set active licensing agreement when ID changes
  useEffect(() => {
    if (licensingAgreementId) {
      setActiveLicensingAgreement(licensingAgreementId);
    }
  }, [licensingAgreementId, setActiveLicensingAgreement]);

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

  if (!licensingAgreement) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Licensing agreement not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/licensing-agreements">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Licensing Agreements
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Handshake className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Licensing Agreement #{licensingAgreement.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                {licensingAgreement.agreement_type && <Badge variant="outline">{licensingAgreement.agreement_type}</Badge>}
                {licensingAgreement.status && <Badge variant="outline">{licensingAgreement.status}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Handshake className="h-4 w-4" />
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
              <CardTitle>Licensing Agreement Details</CardTitle>
              <CardDescription>
                Basic information about this licensing agreement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Licensor</p>
                <p className="text-lg font-medium">{getOrgName(licensingAgreement.licensor_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Licensee</p>
                <p className="text-lg font-medium">{getOrgName(licensingAgreement.licensee_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="text-lg font-medium">{getAssetName(licensingAgreement.asset_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patent</p>
                <p className="text-lg font-medium">{getPatentName(licensingAgreement.patent_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agreement Type</p>
                <p className="text-lg font-medium">{licensingAgreement.agreement_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Territory</p>
                <p className="text-lg font-medium">{licensingAgreement.territory || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Value USD</p>
                <p className="text-lg font-medium">{licensingAgreement.value_usd ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-lg font-medium">{new Date(licensingAgreement.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="text-lg font-medium">{licensingAgreement.end_date ? new Date(licensingAgreement.end_date).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-medium">{licensingAgreement.status}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(licensingAgreement.created_at).toLocaleDateString()}
                </p>
              </div>
              {licensingAgreement.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(licensingAgreement.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Licensing Agreement</CardTitle>
              <CardDescription>
                Update licensing agreement details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Licensor — searchable combobox */}
                <div className="space-y-2">
                  <Label>Licensor</Label>
                  <Popover open={licensorPopoverOpen} onOpenChange={setLicensorPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={licensorPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editLicensorId ? marketOrganizations.find(o => o.id.toString() === editLicensorId)?.legal_name || 'Select licensor' : 'Select licensor'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search licensor..." /><CommandList><CommandEmpty>No organizations found.</CommandEmpty><CommandGroup>
                        {marketOrganizations.map((o) => (<CommandItem key={o.id} value={o.legal_name} onSelect={() => { setEditLicensorId(o.id.toString()); setLicensorPopoverOpen(false); }}>{o.legal_name}{editLicensorId === o.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Licensee — searchable combobox */}
                <div className="space-y-2">
                  <Label>Licensee</Label>
                  <Popover open={licenseePopoverOpen} onOpenChange={setLicenseePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={licenseePopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editLicenseeId ? marketOrganizations.find(o => o.id.toString() === editLicenseeId)?.legal_name || 'Select licensee' : 'Select licensee'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search licensee..." /><CommandList><CommandEmpty>No organizations found.</CommandEmpty><CommandGroup>
                        {marketOrganizations.map((o) => (<CommandItem key={o.id} value={o.legal_name} onSelect={() => { setEditLicenseeId(o.id.toString()); setLicenseePopoverOpen(false); }}>{o.legal_name}{editLicenseeId === o.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Asset — optional searchable combobox */}
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editAssetId && editAssetId !== '__none__' ? therapeuticAssets.find(a => a.id.toString() === editAssetId)?.name || 'Select asset' : 'Select asset'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search asset..." /><CommandList><CommandEmpty>No assets found.</CommandEmpty><CommandGroup>
                        <CommandItem value="__none__" onSelect={() => { setEditAssetId(''); setAssetPopoverOpen(false); }}>— None —</CommandItem>
                        {therapeuticAssets.map((a) => (<CommandItem key={a.id} value={a.name} onSelect={() => { setEditAssetId(a.id.toString()); setAssetPopoverOpen(false); }}>{a.name}{editAssetId === a.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Patent — optional searchable combobox */}
                <div className="space-y-2">
                  <Label>Patent</Label>
                  <Popover open={patentPopoverOpen} onOpenChange={setPatentPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={patentPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editPatentId && editPatentId !== '__none__' ? patents.find(p => p.id.toString() === editPatentId)?.patent_number || 'Select patent' : 'Select patent'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search patent..." /><CommandList><CommandEmpty>No patents found.</CommandEmpty><CommandGroup>
                        <CommandItem value="__none__" onSelect={() => { setEditPatentId(''); setPatentPopoverOpen(false); }}>— None —</CommandItem>
                        {patents.map((p) => (<CommandItem key={p.id} value={p.patent_number} onSelect={() => { setEditPatentId(p.id.toString()); setPatentPopoverOpen(false); }}>{p.patent_number}{editPatentId === p.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Agreement Type</Label>
                  <Select value={editAgreementType} onValueChange={setEditAgreementType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select agreement type" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGREEMENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Territory</Label>
                  <Select value={editTerritory || '__none__'} onValueChange={setEditTerritory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select territory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {TERRITORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value-usd">Value USD</Label>
                  <Input
                    id="value-usd"
                    type="number"
                    value={editValueUsd}
                    onChange={(e) => setEditValueUsd(e.target.value)}
                    placeholder="e.g., 50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_STATUS_OPTIONS.map((option) => (
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
                  const parsedLicensorId = parseInt(editLicensorId, 10);
                  const parsedLicenseeId = parseInt(editLicenseeId, 10);
                  if (isNaN(parsedLicensorId) || parsedLicensorId <= 0) {
                    return;
                  }
                  if (isNaN(parsedLicenseeId) || parsedLicenseeId <= 0) {
                    return;
                  }
                  if (!editAgreementType) {
                    return;
                  }
                  if (!editStartDate) {
                    return;
                  }
                  if (!editStatus) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateLicensingAgreement(licensingAgreementId, {
                      licensor_id: parsedLicensorId,
                      licensee_id: parsedLicenseeId,
                      asset_id: editAssetId ? parseInt(editAssetId, 10) : null,
                      patent_id: editPatentId ? parseInt(editPatentId, 10) : null,
                      agreement_type: editAgreementType as AgreementType,
                      territory: editTerritory === '' || editTerritory === '__none__' ? null : editTerritory as Territory,
                      value_usd: editValueUsd ? parseFloat(editValueUsd) : null,
                      start_date: editStartDate,
                      end_date: editEndDate || null,
                      status: editStatus as LicenseStatus,
                    });
                    if (success) {
                      await fetchLicensingAgreements();
                    }
                  } catch (error) {
                    console.error('Failed to update licensing agreement:', error);
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
                  <h4 className="font-medium">Delete this licensing agreement</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the licensing agreement from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-licensing-agreement">
                    Type <span className="font-semibold">{licensingAgreement.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-licensing-agreement"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== licensingAgreement.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteLicensingAgreement(licensingAgreementId);
                      if (success) {
                        router.push('/licensing-agreements');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete licensing agreement:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== licensingAgreement.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Licensing Agreement
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
