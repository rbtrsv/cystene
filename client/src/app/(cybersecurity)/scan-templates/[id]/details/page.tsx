'use client';

/**
 * Scan Template Details Page
 *
 * Detail view + edit form for a scan template.
 * Tabs: Details (read-only) + Edit (form) + Danger Zone (delete).
 *
 * Backend: GET/PUT/DELETE /cybersecurity/scan-templates/{id}
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScanTemplates } from '@/modules/cybersecurity/hooks/execution/use-scan-templates';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import {
  getScanSpeedLabel,
  type ScanTemplate,
} from '@/modules/cybersecurity/schemas/execution/scan-templates.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, ArrowLeft, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ScanTemplateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const { activeOrganization } = useOrganizations();
  const {
    fetchScanTemplate,
    updateScanTemplate,
    deleteScanTemplate,
    isLoading,
    error: storeError,
  } = useScanTemplates();

  // Local state for the fetched item
  const [item, setItem] = useState<ScanTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editScanTypes, setEditScanTypes] = useState('');
  const [editPortRange, setEditPortRange] = useState('');
  const [editScanSpeed, setEditScanSpeed] = useState('');
  const [editTimeoutSeconds, setEditTimeoutSeconds] = useState(300);
  const [editMaxConcurrent, setEditMaxConcurrent] = useState(50);
  const [editFollowRedirects, setEditFollowRedirects] = useState(true);
  const [editCheckHeaders, setEditCheckHeaders] = useState(true);
  const [editDnsBruteForce, setEditDnsBruteForce] = useState(false);
  const [editActiveScanConsent, setEditActiveScanConsent] = useState(false);
  const [editCredentialId, setEditCredentialId] = useState<number | null>(null);
  const [editEngineParams, setEditEngineParams] = useState('');

  // Fetch item on mount
  useEffect(() => {
    const load = async () => {
      const data = await fetchScanTemplate(id);
      if (data) {
        setItem(data);
        // Populate edit form
        setEditName(data.name);
        setEditDescription(data.description || '');
        setEditScanTypes(data.scan_types);
        setEditPortRange(data.port_range);
        setEditScanSpeed(data.scan_speed);
        setEditTimeoutSeconds(data.timeout_seconds);
        setEditMaxConcurrent(data.max_concurrent);
        setEditFollowRedirects(data.follow_redirects);
        setEditCheckHeaders(data.check_headers);
        setEditDnsBruteForce(data.dns_brute_force);
        setEditActiveScanConsent(data.active_scan_consent);
        setEditCredentialId(data.credential_id ?? null);
        setEditEngineParams(data.engine_params || '');
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateScanTemplate(id, {
      name: editName,
      description: editDescription || null,
      scan_types: editScanTypes,
      port_range: editPortRange,
      scan_speed: editScanSpeed as ScanTemplate['scan_speed'],
      timeout_seconds: editTimeoutSeconds,
      max_concurrent: editMaxConcurrent,
      follow_redirects: editFollowRedirects,
      check_headers: editCheckHeaders,
      dns_brute_force: editDnsBruteForce,
      active_scan_consent: editActiveScanConsent,
      credential_id: editCredentialId,
      engine_params: editEngineParams || null,
    });
    setIsSaving(false);
    if (success) {
      // Refresh item
      const updated = await fetchScanTemplate(id);
      if (updated) setItem(updated);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteScanTemplate(id);
    setIsDeleting(false);
    if (success) {
      router.push('/scan-templates');
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
          <AlertDescription>Scan template not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/scan-templates">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scan Templates
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <p className="text-muted-foreground">
              {item.scan_types} &middot; {getScanSpeedLabel(item.scan_speed)}
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
              <CardTitle>Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{item.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Scan Types</p><p className="font-mono">{item.scan_types}</p></div>
                <div><p className="text-sm text-muted-foreground">Port Range</p><p className="font-medium">{item.port_range}</p></div>
                <div><p className="text-sm text-muted-foreground">Scan Speed</p><p className="font-medium">{getScanSpeedLabel(item.scan_speed)}</p></div>
                <div><p className="text-sm text-muted-foreground">Timeout</p><p className="font-medium">{item.timeout_seconds}s</p></div>
                <div><p className="text-sm text-muted-foreground">Max Concurrent</p><p className="font-medium">{item.max_concurrent}</p></div>
                <div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium">{new Date(item.created_at).toLocaleString()}</p></div>
                <div><p className="text-sm text-muted-foreground">Credential ID</p><p className="font-medium">{item.credential_id ?? '—'}</p></div>
              </div>
              {item.description && (
                <div><p className="text-sm text-muted-foreground">Description</p><p>{item.description}</p></div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Follow Redirects</p><p className="font-medium">{item.follow_redirects ? 'Yes' : 'No'}</p></div>
                <div><p className="text-sm text-muted-foreground">Check Headers</p><p className="font-medium">{item.check_headers ? 'Yes' : 'No'}</p></div>
                <div><p className="text-sm text-muted-foreground">DNS Brute Force</p><p className="font-medium">{item.dns_brute_force ? 'Yes' : 'No'}</p></div>
                <div><p className="text-sm text-muted-foreground">Active Scan Consent</p><p className="font-medium">{item.active_scan_consent ? 'Yes' : 'No'}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Scan Template</CardTitle>
              <CardDescription>Update scan template configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Scan Types</Label>
                <Input value={editScanTypes} onChange={(e) => setEditScanTypes(e.target.value)} disabled={isSaving} />
                <p className="text-xs text-muted-foreground">
                  Available types: port_scan, dns_enum, ssl_check, web_scan, vuln_scan, api_scan,
                  active_web_scan, password_audit, host_audit, cloud_audit, ad_audit, mobile_scan
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Port Range</Label>
                  <Select value={editPortRange} onValueChange={setEditPortRange} disabled={isSaving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top_100">Top 100</SelectItem>
                      <SelectItem value="top_1000">Top 1000</SelectItem>
                      <SelectItem value="full">Full (All Ports)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scan Speed</Label>
                  <Select value={editScanSpeed} onValueChange={setEditScanSpeed} disabled={isSaving}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow (Stealth)</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast (Aggressive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timeout (seconds)</Label>
                  <Input type="number" value={editTimeoutSeconds} onChange={(e) => setEditTimeoutSeconds(Number(e.target.value))} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label>Max Concurrent</Label>
                  <Input type="number" value={editMaxConcurrent} onChange={(e) => setEditMaxConcurrent(Number(e.target.value))} disabled={isSaving} />
                </div>
              </div>

              {/* Boolean Flags */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-follow-redirects"
                    checked={editFollowRedirects}
                    onCheckedChange={(checked) => setEditFollowRedirects(checked === true)}
                    disabled={isSaving}
                  />
                  <Label htmlFor="edit-follow-redirects" className="cursor-pointer">Follow Redirects</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-check-headers"
                    checked={editCheckHeaders}
                    onCheckedChange={(checked) => setEditCheckHeaders(checked === true)}
                    disabled={isSaving}
                  />
                  <Label htmlFor="edit-check-headers" className="cursor-pointer">Check Headers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-dns-brute-force"
                    checked={editDnsBruteForce}
                    onCheckedChange={(checked) => setEditDnsBruteForce(checked === true)}
                    disabled={isSaving}
                  />
                  <Label htmlFor="edit-dns-brute-force" className="cursor-pointer">DNS Brute Force</Label>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-active-scan-consent"
                      checked={editActiveScanConsent}
                      onCheckedChange={(checked) => setEditActiveScanConsent(checked === true)}
                      disabled={isSaving}
                    />
                    <Label htmlFor="edit-active-scan-consent" className="cursor-pointer">Active Scan Consent</Label>
                  </div>
                  <p className="text-xs text-destructive ml-6">
                    Warning: Enabling this allows active scanning techniques that may trigger IDS/IPS alerts
                    or affect target availability. Only enable if you have explicit authorization.
                  </p>
                </div>
              </div>

              {/* Credential */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Credential ID</Label>
                  <Input
                    type="number"
                    value={editCredentialId ?? ''}
                    onChange={(e) => setEditCredentialId(e.target.value ? Number(e.target.value) : null)}
                    disabled={isSaving}
                    placeholder="Leave empty if no credential needed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Engine Parameters</Label>
                  <Textarea value={editEngineParams} onChange={(e) => setEditEngineParams(e.target.value)} disabled={isSaving} placeholder='{"key": "value"}' />
                  <p className="text-xs text-muted-foreground">JSON string for custom engine parameters</p>
                </div>
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
                Permanently delete this scan template. This action cannot be undone.
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
                  <><Trash2 className="mr-2 h-4 w-4" /> Delete Scan Template</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
