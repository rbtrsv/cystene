'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, BarChart3, Loader2, Pencil, Trash2 } from 'lucide-react';

import { useKPIValues } from '@/modules/assetmanager/hooks/financial/use-kpi-values';
import { useKPIs } from '@/modules/assetmanager/hooks/financial/use-kpis';
import { SCENARIO_OPTIONS, QUARTER_OPTIONS, SEMESTER_OPTIONS, MONTH_OPTIONS, getScenarioLabel } from '@/modules/assetmanager/schemas/financial/shared-financial.schemas';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';

export default function KPIValueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = parseInt(params.id as string, 10);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const {
    kpiValues,
    isLoading,
    error,
    fetchKPIValue,
    updateKPIValue,
    deleteKPIValue,
    fetchKPIValues,
  } = useKPIValues();

  const { kpis } = useKPIs();

  const item = kpiValues.find((row) => row.id === id);

  // Helper to get KPI name by ID
  const getKpiName = (kpiId: number): string => {
    const kpi = kpis.find((k) => k.id === kpiId);
    return kpi ? kpi.name : `KPI #${kpiId}`;
  };

  // Settings state — Time Dimensions
  const [editYear, setEditYear] = useState('');
  const [editScenario, setEditScenario] = useState('');
  const [editQuarter, setEditQuarter] = useState<string | null>(null);
  const [editSemester, setEditSemester] = useState<string | null>(null);
  const [editMonth, setEditMonth] = useState<string | null>(null);
  const [editFullYear, setEditFullYear] = useState(false);
  const [editDate, setEditDate] = useState('');
  // Settings state — Value
  const [editValue, setEditValue] = useState('');
  const [editNotes, setEditNotes] = useState('');
  // Settings state — Actions
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Initialize edit form when item loads
  useEffect(() => {
    if (item) {
      // Time Dimensions
      setEditYear(item.year.toString());
      setEditScenario(item.scenario);
      setEditQuarter(item.quarter);
      setEditSemester(item.semester);
      setEditMonth(item.month);
      setEditFullYear(item.full_year);
      setEditDate(item.date || '');
      // Value
      setEditValue(item.value?.toString() || '');
      setEditNotes(item.notes || '');
    }
  }, [item]);

  useEffect(() => {
    if (id && !item) fetchKPIValue(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Helper to parse optional number fields for the update payload
  const optNum = (val: string): number | null | undefined =>
    val === '' ? null : parseFloat(val) || undefined;

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
        <AlertDescription>KPI Value not found</AlertDescription>
      </Alert>
    );
  }

  // Delete confirmation uses year
  const deleteConfirmTarget = `${item.year}`;

  // Helper to format nullable numbers
  const fmtNum = (val: number | null): string =>
    val != null ? val.toLocaleString() : '—';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/kpi-values">
          <Button variant="ghost" size="sm" className="mb-2">
            ← Back to KPI Values
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {getKpiName(item.kpi_id)} — KPI Value
            </h1>
            <p className="text-sm text-muted-foreground">
              {item.year} · {getScenarioLabel(item.scenario)}
              {item.quarter && ` · ${item.quarter}`}
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
          {/* Time Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle>Time Dimensions</CardTitle>
              <CardDescription>Reporting period details</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="text-lg font-medium">{item.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scenario</p>
                <p className="text-lg font-medium">{getScenarioLabel(item.scenario)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quarter</p>
                <p className="text-lg font-medium">{item.quarter || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semester</p>
                <p className="text-lg font-medium">{item.semester || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Month</p>
                <p className="text-lg font-medium">{item.month || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Full Year</p>
                <p className="text-lg font-medium">{item.full_year ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-lg font-medium">
                  {item.date ? new Date(item.date).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">KPI</p>
                <p className="text-lg font-medium">{getKpiName(item.kpi_id)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Value */}
          <Card>
            <CardHeader>
              <CardTitle>Value</CardTitle>
              <CardDescription>KPI measurement and notes</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Value</p>
                <p className="text-xl font-semibold">{fmtNum(item.value)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-lg font-medium">{item.notes || '—'}</p>
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
          {/* Time Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle>Time Dimensions</CardTitle>
              <CardDescription>Update reporting period fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-year">Year *</Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-scenario">Scenario</Label>
                  <Select
                    value={editScenario}
                    onValueChange={(value) => setEditScenario(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENARIO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quarter">Quarter</Label>
                  <Select
                    value={editQuarter || 'none'}
                    onValueChange={(value) => setEditQuarter(value === 'none' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {QUARTER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-semester">Semester</Label>
                  <Select
                    value={editSemester || 'none'}
                    onValueChange={(value) => setEditSemester(value === 'none' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {SEMESTER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-month">Month</Label>
                  <Select
                    value={editMonth || 'none'}
                    onValueChange={(value) => setEditMonth(value === 'none' ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {MONTH_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="edit-full-year"
                  checked={editFullYear}
                  onCheckedChange={(checked) => setEditFullYear(checked === true)}
                />
                <Label htmlFor="edit-full-year">Full Year</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Value */}
          <Card>
            <CardHeader>
              <CardTitle>Value</CardTitle>
              <CardDescription>Update KPI measurement and notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-value">Value</Label>
                <Input
                  id="edit-value"
                  type="number"
                  step="0.01"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={async () => {
              setIsUpdating(true);
              try {
                await updateKPIValue(id, {
                  // Time Dimensions
                  year: editYear ? parseInt(editYear, 10) : undefined,
                  scenario: editScenario || undefined,
                  quarter: editQuarter,
                  semester: editSemester,
                  month: editMonth,
                  full_year: editFullYear,
                  date: editDate || null,
                  // Value
                  value: optNum(editValue),
                  notes: editNotes || null,
                });
                // Refresh list data after update to keep store in sync
                await fetchKPIValues();
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
                  <h4 className="font-medium">Delete this KPI value</h4>
                  <p className="text-sm text-muted-foreground">
                    Once deleted, this KPI data point cannot be recovered.
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
                    placeholder="Year"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmText !== deleteConfirmTarget) return;
                    setIsDeleting(true);
                    try {
                      await deleteKPIValue(id);
                      router.push('/kpi-values');
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
                      Delete KPI Value
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
