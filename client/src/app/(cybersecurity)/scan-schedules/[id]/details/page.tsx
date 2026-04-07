'use client';

/**
 * Scan Schedule Details Page
 *
 * Detail view + edit form for a scan schedule.
 * Tabs: Details (read-only + activate/deactivate) + Edit (form) + Danger Zone (delete).
 *
 * Backend: GET/PUT/DELETE /cybersecurity/scan-schedules/{id}
 * Backend: POST /cybersecurity/scan-schedules/{id}/activate
 * Backend: POST /cybersecurity/scan-schedules/{id}/deactivate
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScanSchedules } from '@/modules/cybersecurity/hooks/execution/use-scan-schedules';
import {
  getScheduleFrequencyLabel,
  type ScanSchedule,
} from '@/modules/cybersecurity/schemas/execution/scan-schedules.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, ArrowLeft, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ScanScheduleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const {
    fetchScanSchedule,
    updateScanSchedule,
    deleteScanSchedule,
    activateScanSchedule,
    deactivateScanSchedule,
    isLoading,
    error: storeError,
  } = useScanSchedules();

  // Local state for the fetched item
  const [item, setItem] = useState<ScanSchedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editFrequency, setEditFrequency] = useState('');
  const [editCronExpression, setEditCronExpression] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Fetch item on mount
  useEffect(() => {
    const load = async () => {
      const data = await fetchScanSchedule(id);
      if (data) {
        setItem(data);
        // Populate edit form
        setEditName(data.name);
        setEditFrequency(data.frequency);
        setEditCronExpression(data.cron_expression || '');
        setEditIsActive(data.is_active);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateScanSchedule(id, {
      name: editName,
      frequency: editFrequency as ScanSchedule['frequency'],
      cron_expression: editCronExpression || null,
      is_active: editIsActive,
    });
    setIsSaving(false);
    if (success) {
      // Refresh item
      const updated = await fetchScanSchedule(id);
      if (updated) setItem(updated);
    }
  };

  // Handle activate/deactivate toggle
  const handleToggleActive = async () => {
    if (!item) return;
    setIsToggling(true);
    if (item.is_active) {
      await deactivateScanSchedule(id);
    } else {
      await activateScanSchedule(id);
    }
    // Refresh item after toggle
    const updated = await fetchScanSchedule(id);
    if (updated) {
      setItem(updated);
      // Sync edit form state
      setEditIsActive(updated.is_active);
    }
    setIsToggling(false);
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteScanSchedule(id);
    setIsDeleting(false);
    if (success) {
      router.push('/scan-schedules');
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
          <AlertDescription>Scan schedule not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/scan-schedules">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scan Schedules
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <p className="text-muted-foreground">
              {getScheduleFrequencyLabel(item.frequency)} &middot;{' '}
              {item.is_active ? 'Active' : 'Inactive'}
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
              <CardTitle>Schedule Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{item.name}</p></div>
                <div><p className="text-sm text-muted-foreground">Frequency</p><p className="font-medium">{getScheduleFrequencyLabel(item.frequency)}</p></div>
                <div><p className="text-sm text-muted-foreground">Cron Expression</p><p className="font-mono">{item.cron_expression || '—'}</p></div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={item.is_active ? 'default' : 'secondary'}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div><p className="text-sm text-muted-foreground">Target ID</p><p className="font-medium">{item.target_id}</p></div>
                <div><p className="text-sm text-muted-foreground">Template ID</p><p className="font-medium">{item.template_id}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Execution Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Last Run At</p><p className="font-medium">{item.last_run_at ? new Date(item.last_run_at).toLocaleString() : '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Next Run At</p><p className="font-medium">{item.next_run_at ? new Date(item.next_run_at).toLocaleString() : '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Last Run Status</p><p className="font-medium">{item.last_run_status || '—'}</p></div>
                <div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium">{new Date(item.created_at).toLocaleString()}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Activate / Deactivate Button */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Control</CardTitle>
              <CardDescription>
                {item.is_active
                  ? 'This schedule is currently active and will run on its configured frequency.'
                  : 'This schedule is currently inactive and will not run.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={item.is_active ? 'outline' : 'default'}
                onClick={handleToggleActive}
                disabled={isToggling}
              >
                {isToggling ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {item.is_active ? 'Deactivating...' : 'Activating...'}</>
                ) : (
                  item.is_active ? 'Deactivate Schedule' : 'Activate Schedule'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Edit Scan Schedule</CardTitle>
              <CardDescription>Update schedule details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={isSaving} />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={editFrequency} onValueChange={setEditFrequency} disabled={isSaving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cron Expression</Label>
                <Input
                  value={editCronExpression}
                  onChange={(e) => setEditCronExpression(e.target.value)}
                  placeholder="0 2 * * 1"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">Optional — overrides frequency with a custom cron expression</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editIsActive ? 'true' : 'false'}
                  onValueChange={(value) => setEditIsActive(value === 'true')}
                  disabled={isSaving}
                >
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
                Permanently delete this scan schedule. This action cannot be undone.
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
                  <><Trash2 className="mr-2 h-4 w-4" /> Delete Scan Schedule</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
