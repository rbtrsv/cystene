'use client';

import { useParams, useRouter } from 'next/navigation';
import { useOntologyTerms } from '@/modules/nexotype/hooks/standardization/use-ontology-terms';
import { ONTOLOGY_SOURCE_OPTIONS, type OntologySource } from '@/modules/nexotype/schemas/standardization/ontology-term.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, BookOpen, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Page component for this route.
 */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
export default function OntologyTermDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ontologyTermId = parseInt(params.id as string);
  const {
    ontologyTerms,
    isLoading,
    error,
    setActiveOntologyTerm,
    fetchOntologyTerm,
    updateOntologyTerm,
    deleteOntologyTerm,
    fetchOntologyTerms
  } = useOntologyTerms();

  const listItem = ontologyTerms.find(ot => ot.id === ontologyTermId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const ontologyTerm = listItem ?? fetchedItem ?? null;

  // Fetch by ID fallback when list doesn't contain the item (prevents false-404)
  useEffect(() => {
    if (!listItem && ontologyTermId && !isLoading) {
      fetchOntologyTerm(ontologyTermId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, ontologyTermId, isLoading, fetchOntologyTerm]);

  // Settings state
  const [editSource, setEditSource] = useState('');
  const [editAccession, setEditAccession] = useState('');
  const [editName, setEditName] = useState('');
  const [editDefinition, setEditDefinition] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when ontology term changes
  useEffect(() => {
    if (ontologyTerm) {
      setEditSource(ontologyTerm.source);
      setEditAccession(ontologyTerm.accession);
      setEditName(ontologyTerm.name);
      setEditDefinition(ontologyTerm.definition || '');
    }
  }, [ontologyTerm]);

  // Set active ontology term when ID changes
  useEffect(() => {
    if (ontologyTermId) {
      setActiveOntologyTerm(ontologyTermId);
    }
  }, [ontologyTermId, setActiveOntologyTerm]);

  // Guard: loading state.
  if (isLoading) {
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

  if (!ontologyTerm) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Ontology term not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/ontology-terms">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Ontology Terms
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{ontologyTerm.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{ontologyTerm.source}</Badge>
                <span className="text-muted-foreground">{ontologyTerm.accession}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <BookOpen className="h-4 w-4" />
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
              <CardTitle>Ontology Term Details</CardTitle>
              <CardDescription>
                Basic information about this ontology term
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-medium">{ontologyTerm.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="text-lg font-medium">{ontologyTerm.source}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accession</p>
                <p className="text-lg font-medium">{ontologyTerm.accession}</p>
              </div>
              {ontologyTerm.definition && (
                <div>
                  <p className="text-sm text-muted-foreground">Definition</p>
                  <p className="text-lg font-medium">{ontologyTerm.definition}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(ontologyTerm.created_at).toLocaleDateString()}
                </p>
              </div>
              {ontologyTerm.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(ontologyTerm.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Ontology Term</CardTitle>
              <CardDescription>
                Update ontology term details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={editSource} onValueChange={setEditSource}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {ONTOLOGY_SOURCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accession">Accession</Label>
                  <Input
                    id="accession"
                    value={editAccession}
                    onChange={(e) => setEditAccession(e.target.value)}
                    placeholder="e.g., GO:0005515"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., Protein Binding"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="definition">Definition</Label>
                  <Textarea
                    id="definition"
                    value={editDefinition}
                    onChange={(e) => setEditDefinition(e.target.value)}
                    placeholder="e.g., Interacting selectively and non-covalently with any protein..."
                    rows={4}
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editSource || !editAccession.trim() || !editName.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateOntologyTerm(ontologyTermId, {
                      source: editSource as OntologySource,
                      accession: editAccession.trim(),
                      name: editName.trim(),
                      definition: editDefinition.trim() || null,
                    });
                    if (success) { await fetchOntologyTerms(); }
                  } catch (error) {
                    console.error('Failed to update ontology term:', error);
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
                  <h4 className="font-medium">Delete this ontology term</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the ontology term from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-ontology-term">
                    Type <span className="font-semibold">{ontologyTerm.accession}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-ontology-term"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Accession"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== ontologyTerm.accession) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteOntologyTerm(ontologyTermId);
                      if (success) { router.push('/ontology-terms'); } else { setIsDeleting(false); }
                    } catch (error) {
                      console.error('Failed to delete ontology term:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== ontologyTerm.accession}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Ontology Term
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
