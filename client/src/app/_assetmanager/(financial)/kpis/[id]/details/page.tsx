'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, BarChart3, Loader2, Pencil, Trash2 } from 'lucide-react';

import { useKPIs } from '@/modules/assetmanager/hooks/financial/use-kpis';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';

export default function KPIDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseInt(params.id as string, 10);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const {
    kpis,
    isLoading,
    error,
    fetchKPI,
    updateKPI,
    deleteKPI,
    fetchKPIs,
  } = useKPIs();

  const { getEntityById } = useEntities();

  const item = kpis.find((row) => row.id === id);

  // Resolve entity name from item's entity_id
  const entityName = item ? (getEntityById(item.entity_id)?.name || `Entity #${item.entity_id}`) : '';

  // Settings state — KPI Definition
  const [editName, setEditName] = useState('');
  const [editDataType, setEditDataType] = useState('');
  const [editIsCalculated, setEditIsCalculated] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editFormula, setEditFormula] = useState('');
  // Settings state — Actions
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Initialize edit form when item loads
  useEffect(() => {
    if (item) {
      setEditName(item.name);
      setEditDataType(item.data_type);
      setEditIsCalculated(item.is_calculated);
      setEditDescription(item.description || '');
      setEditFormula(item.formula || '');
    }
  }, [item]);

  useEffect(() => {
    if (id && !item) fetchKPI(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  if (!item) {
    return (
      <Alert variant="destructive">
        <AlertDescription>KPI not found</AlertDescription>
      </Alert>
    );
  }

  // Delete confirmation uses KPI name
  const deleteConfirmTarget = item.name;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/kpis">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to KPIs
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {entityName} — {item.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {item.data_type} · {item.is_calculated ? 'Calculated' : 'Manual'}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <BarChart3 className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        {/* ========== DETAILS TAB ========== */}
        <TabsContent value="details" className="space-y-4">
          {/* KPI Definition */}
          <Card>
            <CardHeader>
              <CardTitle>KPI Definition</CardTitle>
              <CardDescription>Core KPI attributes and configuration</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{item.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Type</p>
                <p className="text-lg font-medium">{item.data_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Is Calculated</p>
                <p className="text-lg font-medium">{item.is_calculated ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entity</p>
                <p className="text-lg font-medium">{entityName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-lg font-medium">{item.description || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Formula</p>
                <p className="text-lg font-medium">{item.formula || '—'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Record Info */}
          <Card>
            <CardHeader>
              <CardTitle>Record Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="text-lg font-medium">
                  {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== EDIT TAB ========== */}
        <TabsContent value="edit" className="space-y-4">
          {/* KPI Definition */}
          <Card>
            <CardHeader>
              <CardTitle>KPI Definition</CardTitle>
              <CardDescription>Update KPI attributes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-data-type">Data Type</Label>
                  <Input
                    id="edit-data-type"
                    value={editDataType}
                    onChange={(e) => setEditDataType(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="edit-is-calculated"
                  checked={editIsCalculated}
                  onCheckedChange={(checked) => setEditIsCalculated(checked === true)}
                />
                <Label htmlFor="edit-is-calculated">Is Calculated</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-formula">Formula</Label>
                <Textarea
                  id="edit-formula"
                  value={editFormula}
                  onChange={(e) => setEditFormula(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={async () => {
              setIsUpdating(true);
              try {
                await updateKPI(id, {
                  name: editName || undefined,
                  data_type: editDataType || undefined,
                  is_calculated: editIsCalculated,
                  description: editDescription || null,
                  formula: editFormula || null,
                });
                // Refresh list data after update to keep store in sync
                await fetchKPIs();
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

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this KPI</h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this KPI definition and all associated values cannot be recovered.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete">
                    Type <span className="font-semibold">{deleteConfirmTarget}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="KPI name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmText !== deleteConfirmTarget) return;
                    setIsDeleting(true);
                    try {
                      await deleteKPI(id);
                      router.push('/kpis');
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmText !== deleteConfirmTarget}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete KPI
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
