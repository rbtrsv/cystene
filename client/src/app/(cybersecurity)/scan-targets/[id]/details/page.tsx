'use client';

/**
 * Scan Target Details Page
 *
 * Detail view + edit form for a scan target.
 * Tabs: Details (read-only) + Edit (form) + Danger Zone (delete).
 * Includes a "Verify Ownership" button on Details tab for unverified targets.
 *
 * Backend: GET/PUT/DELETE /cybersecurity/scan-targets/{id}
 *          POST /cybersecurity/scan-targets/{id}/verify
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScanTargets } from '@/modules/cybersecurity/hooks/infrastructure/use-scan-targets';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import {
  getTargetTypeLabel,
  getVerificationMethodLabel,
  type ScanTarget,
} from '@/modules/cybersecurity/schemas/infrastructure/scan-targets.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, ArrowLeft, Crosshair, Trash2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ScanTargetDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const { activeOrganization } = useOrganizations();
  const {
    fetchScanTarget,
    updateScanTarget,
    deleteScanTarget,
    verifyScanTarget,
    isLoading,
    error: storeError,
  } = useScanTargets();

  // Local state for the fetched item
  const [item, setItem] = useState<ScanTarget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('dns_txt');
  const [verifyResult, setVerifyResult] = useState<{ instructions?: string; token?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editTargetType, setEditTargetType] = useState('');
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editInfrastructureId, setEditInfrastructureId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Fetch item on mount
  useEffect(() => {
    const load = async () => {
      const data = await fetchScanTarget(id);
      if (data) {
        setItem(data);
        // Populate edit form
        setEditName(data.name);
        setEditTargetType(data.target_type);
        setEditTargetValue(data.target_value);
        setEditInfrastructureId(data.infrastructure_id ? String(data.infrastructure_id) : '');
        setEditNotes(data.notes || '');
        setEditTags(data.tags || '');
        setEditIsActive(data.is_active);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateScanTarget(id, {
      name: editName,
      target_type: editTargetType as ScanTarget['target_type'],
      target_value: editTargetValue,
      infrastructure_id: editInfrastructureId ? parseInt(editInfrastructureId) : null,
      notes: editNotes || null,
      tags: editTags || null,
      is_active: editIsActive,
    });
    setIsSaving(false);
    if (success) {
      // Refresh item
      const updated = await fetchScanTarget(id);
      if (updated) setItem(updated);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteScanTarget(id);
    setIsDeleting(false);
    if (success) {
      router.push('/scan-targets');
    }
  };

  // Handle verify ownership
  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyResult(null);
    const result = await verifyScanTarget(id, verificationMethod);
    setIsVerifying(false);
    if (result.success) {
      // Refresh item to get updated verification status
      const updated = await fetchScanTarget(id);
      if (updated) setItem(updated);
      setVerifyResult(null);
    } else {
      // Show instructions on failure
      setVerifyResult({ instructions: result.instructions, token: result.token });
    }
  };

  // ==========================================
  // Render
  // ==========================================

  if (isLoading && !item) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Scan target not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/scan-targets">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scan Targets
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Crosshair className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <p className="text-muted-foreground">
              {getTargetTypeLabel(item.target_type)} &middot; {item.target_value}
            </p>
          </div>
        </div>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Target Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{item.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Target Type</p><p className="font-medium">{getTargetTypeLabel(item.target_type)}</p></div>
                <div><p className="text-sm text-muted-foreground">Target Value</p><p className="font-mono font-medium">{item.target_value}</p></div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <Badge variant={item.is_verified ? 'default' : 'secondary'}>
                    {item.is_verified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </div>
                <div><p className="text-sm text-muted-foreground">Verification Method</p><p className="font-medium">{item.verification_method ? getVerificationMethodLabel(item.verification_method) : '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Infrastructure ID</p><p className="font-medium">{item.infrastructure_id ?? '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Tags</p><p className="font-medium">{item.tags || '—'}</p></div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <Badge variant={item.is_active ? 'default' : 'secondary'}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium">{new Date(item.created_at).toLocaleString()}</p></div>
              </div>
              {item.notes && (
                <div className="mt-4"><p className="text-sm text-muted-foreground">Notes</p><p>{item.notes}</p></div>
              )}
            </CardContent>
          </Card>

          {/* Verify Ownership — only shown if target is not verified */}
          {!item.is_verified && (
            <Card>
              <CardHeader>
                <CardTitle>Ownership Verification</CardTitle>
                <CardDescription>
                  Verify that you own this target before running scans against it.
                  Choose a verification method and follow the instructions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Verification token — user needs this to set up proof */}
                {item.verification_token && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Your Verification Token</p>
                    <code className="block bg-muted p-3 rounded font-mono text-sm break-all">{item.verification_token}</code>
                  </div>
                )}

                {/* Method selector */}
                <div className="space-y-2">
                  <Label>Verification Method</Label>
                  <Select value={verificationMethod} onValueChange={setVerificationMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dns_txt">DNS TXT Record</SelectItem>
                      <SelectItem value="file_upload">File Upload (.well-known)</SelectItem>
                      <SelectItem value="meta_tag">HTML Meta Tag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Instructions based on selected method */}
                <div className="bg-muted p-3 rounded text-sm space-y-1">
                  {verificationMethod === 'dns_txt' && (
                    <>
                      <p className="font-medium">DNS TXT Record</p>
                      <p>Add a TXT record to your domain with this value:</p>
                      <code className="block mt-1 bg-background p-2 rounded font-mono text-xs break-all">{item.verification_token}</code>
                    </>
                  )}
                  {verificationMethod === 'file_upload' && (
                    <>
                      <p className="font-medium">File Upload</p>
                      <p>Create a file at this URL containing your token:</p>
                      <code className="block mt-1 bg-background p-2 rounded font-mono text-xs break-all">
                        https://{item.target_value.replace(/^https?:\/\//, '').split('/')[0]}/.well-known/cystene-verify.txt
                      </code>
                    </>
                  )}
                  {verificationMethod === 'meta_tag' && (
                    <>
                      <p className="font-medium">HTML Meta Tag</p>
                      <p>Add this tag to your homepage {'<head>'}:</p>
                      <code className="block mt-1 bg-background p-2 rounded font-mono text-xs break-all">
                        {'<meta name="cystene-verify" content="'}{item.verification_token}{'">'}
                      </code>
                    </>
                  )}
                </div>

                {/* Verify button */}
                <Button onClick={handleVerify} disabled={isVerifying}>
                  {isVerifying ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                  ) : (
                    <><ShieldCheck className="mr-2 h-4 w-4" /> Verify Ownership</>
                  )}
                </Button>

                {/* Result message if verification failed */}
                {verifyResult?.instructions && (
                  <Alert>
                    <AlertDescription>
                      <p className="font-medium mb-1">Verification failed</p>
                      <p className="text-sm">{verifyResult.instructions}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Scan Target</CardTitle>
              <CardDescription>Update scan target details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Target Type</Label>
                <Select value={editTargetType} onValueChange={setEditTargetType} disabled={isSaving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="ip">IP Address</SelectItem>
                    <SelectItem value="ip_range">IP Range</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input value={editTargetValue} onChange={(e) => setEditTargetValue(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Infrastructure ID</Label>
                <Input
                  type="number"
                  value={editInfrastructureId}
                  onChange={(e) => setEditInfrastructureId(e.target.value)}
                  placeholder="Link to an infrastructure item (optional)"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <Select value={editIsActive ? 'true' : 'false'} onValueChange={(v) => setEditIsActive(v === 'true')} disabled={isSaving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Permanently delete this scan target. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Type <span className="font-mono font-bold">{item.name}</span> to confirm deletion.
              </p>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={item.name}
                disabled={isDeleting}
              />
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteConfirm !== item.name || isDeleting}
              >
                {isDeleting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="mr-2 h-4 w-4" /> Delete Scan Target</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
