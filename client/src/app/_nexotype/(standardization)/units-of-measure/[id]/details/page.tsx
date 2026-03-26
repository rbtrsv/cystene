'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUnitsOfMeasure } from '@/modules/nexotype/hooks/standardization/use-units-of-measure';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Ruler, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Page component for this route.
 */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function UnitOfMeasureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const unitOfMeasureId = parseInt(params.id as string);
  const {
    unitsOfMeasure,
    isLoading,
    error,
    setActiveUnitOfMeasure,
    fetchUnitOfMeasure,
    updateUnitOfMeasure,
    deleteUnitOfMeasure,
    fetchUnitsOfMeasure
  } = useUnitsOfMeasure();

  // Try to resolve from list first; fall back to individually fetched record
  const listItem = unitsOfMeasure.find(uom => uom.id === unitOfMeasureId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const unitOfMeasure = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editSymbol, setEditSymbol] = useState('');
  const [editName, setEditName] = useState('');
  const [editSiConversionFactor, setEditSiConversionFactor] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID if the record is not available in the list
  useEffect(() => {
    if (!listItem && unitOfMeasureId && !isLoading) {
      fetchUnitOfMeasure(unitOfMeasureId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, unitOfMeasureId, isLoading, fetchUnitOfMeasure]);

  // Initialize edit form when unit of measure changes
  useEffect(() => {
    if (unitOfMeasure) {
      setEditSymbol(unitOfMeasure.symbol);
      setEditName(unitOfMeasure.name);
      setEditSiConversionFactor(unitOfMeasure.si_conversion_factor?.toString() || '');
    }
  }, [unitOfMeasure]);

  // Set active unit of measure when ID changes
  useEffect(() => {
    if (unitOfMeasureId) {
      setActiveUnitOfMeasure(unitOfMeasureId);
    }
  }, [unitOfMeasureId, setActiveUnitOfMeasure]);

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

  if (!unitOfMeasure) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Unit of measure not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/units-of-measure">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Units of Measure
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Ruler className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{unitOfMeasure.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{unitOfMeasure.symbol}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Ruler className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unit of Measure Details</CardTitle>
              <CardDescription>
                Basic information about this unit of measure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{unitOfMeasure.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Symbol</p>
                <p className="text-lg font-medium">{unitOfMeasure.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SI Conversion Factor</p>
                <p className="text-lg font-medium">{unitOfMeasure.si_conversion_factor ?? '—'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(unitOfMeasure.created_at).toLocaleDateString()}
                </p>
              </div>
              {unitOfMeasure.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(unitOfMeasure.updated_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Unit of Measure</CardTitle>
              <CardDescription>
                Update unit of measure details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={editSymbol}
                    onChange={(e) => setEditSymbol(e.target.value)}
                    placeholder="e.g., nM, mg/kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., Nanomolar"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="si_conversion_factor">SI Conversion Factor</Label>
                  <Input
                    id="si_conversion_factor"
                    type="text"
                    value={editSiConversionFactor}
                    onChange={(e) => setEditSiConversionFactor(e.target.value)}
                    placeholder="e.g., 0.000000001"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editSymbol.trim() || !editName.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateUnitOfMeasure(unitOfMeasureId, {
                      symbol: editSymbol.trim(),
                      name: editName.trim(),
                      si_conversion_factor: editSiConversionFactor ? parseFloat(editSiConversionFactor) : null,
                    });
                    if (success) {
                      await fetchUnitsOfMeasure();
                    }
                  } catch (error) {
                    console.error('Failed to update unit of measure:', error);
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
                  <h4 className="font-medium">Delete this unit of measure</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the unit of measure from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-unit-of-measure">
                    Type <span className="font-semibold">{unitOfMeasure.symbol}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-unit-of-measure"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Symbol"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== unitOfMeasure.symbol) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteUnitOfMeasure(unitOfMeasureId);
                      if (success) {
                        router.push('/units-of-measure');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete unit of measure:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== unitOfMeasure.symbol}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Unit of Measure
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
