'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { JURISDICTION_OPTIONS, PATENT_STATUS_OPTIONS, getPatentStatusVariant, type Jurisdiction, type PatentStatus } from '@/modules/nexotype/schemas/commercial/patent.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, ScrollText, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PatentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patentId = parseInt(params.id as string);
  const {
    patents,
    isLoading,
    error,
    setActivePatent,
    fetchPatent,
    updatePatent,
    deletePatent,
    fetchPatents
  } = usePatents();

  const listItem = patents.find(p => p.id === patentId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const patent = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editJurisdiction, setEditJurisdiction] = useState('');
  const [editPatentNumber, setEditPatentNumber] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editFilingDate, setEditFilingDate] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmNumber, setDeleteConfirmNumber] = useState('');

  // Fetch by ID when list item is missing (prevents false-404 on direct navigation)
  useEffect(() => {
    if (!listItem && patentId && !isLoading) {
      fetchPatent(patentId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, patentId, isLoading, fetchPatent]);

  // Initialize edit form when patent changes
  useEffect(() => {
    if (patent) {
      setEditJurisdiction(patent.jurisdiction);
      setEditPatentNumber(patent.patent_number);
      setEditTitle(patent.title || '');
      setEditStatus(patent.status);
      setEditFilingDate(patent.filing_date || '');
      setEditExpiryDate(patent.expiry_date || '');
    }
  }, [patent]);

  // Set active patent when ID changes
  useEffect(() => {
    if (patentId) {
      setActivePatent(patentId);
    }
  }, [patentId, setActivePatent]);

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

  if (!patent) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Patent not found</AlertDescription>
      </Alert>
    );
  }

  // Delete confirmation uses jurisdiction + patent_number
  const deleteConfirmValue = `${patent.jurisdiction} ${patent.patent_number}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/patents">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Patents
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <ScrollText className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{patent.jurisdiction} {patent.patent_number}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{patent.jurisdiction}</Badge>
                <Badge variant={getPatentStatusVariant(patent.status)}>{patent.status}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <ScrollText className="h-4 w-4" />
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
              <CardTitle>Patent Details</CardTitle>
              <CardDescription>
                Basic information about this patent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {patent.title && (
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="text-lg font-medium">{patent.title}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Jurisdiction</p>
                  <p className="text-lg font-medium">{patent.jurisdiction}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patent Number</p>
                  <p className="text-lg font-medium">{patent.patent_number}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-medium">{patent.status}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Filing Date</p>
                  <p className="text-lg font-medium">
                    {patent.filing_date ? new Date(patent.filing_date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p className="text-lg font-medium">
                    {patent.expiry_date ? new Date(patent.expiry_date).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(patent.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Patent</CardTitle>
              <CardDescription>
                Update patent details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Select
                    value={editJurisdiction}
                    onValueChange={setEditJurisdiction}
                  >
                    <SelectTrigger id="jurisdiction">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JURISDICTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patent-number">Patent Number</Label>
                  <Input
                    id="patent-number"
                    value={editPatentNumber}
                    onChange={(e) => setEditPatentNumber(e.target.value)}
                    placeholder="e.g., 11,234,567"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="patent-title">Title</Label>
                  <Input
                    id="patent-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g., Methods for treating neurological disorders"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patent-status">Status</Label>
                  <Select
                    value={editStatus}
                    onValueChange={setEditStatus}
                  >
                    <SelectTrigger id="patent-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PATENT_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filing-date">Filing Date</Label>
                  <Input
                    id="filing-date"
                    type="date"
                    value={editFilingDate}
                    onChange={(e) => setEditFilingDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Expiry Date</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editJurisdiction || !editPatentNumber.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updatePatent(patentId, {
                      jurisdiction: editJurisdiction as Jurisdiction,
                      patent_number: editPatentNumber.trim(),
                      title: editTitle || null,
                      status: editStatus as PatentStatus,
                      filing_date: editFilingDate || null,
                      expiry_date: editExpiryDate || null,
                    });
                    if (success) {
                      await fetchPatents();
                    }
                  } catch (error) {
                    console.error('Failed to update patent:', error);
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
                  <h4 className="font-medium">Delete this patent</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the patent from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-patent">
                    Type <span className="font-semibold">{deleteConfirmValue}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-patent"
                    value={deleteConfirmNumber}
                    onChange={(e) => setDeleteConfirmNumber(e.target.value)}
                    placeholder="Jurisdiction and patent number"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmNumber !== deleteConfirmValue) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deletePatent(patentId);
                      if (success) {
                        router.push('/patents');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete patent:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmNumber !== deleteConfirmValue}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Patent
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
