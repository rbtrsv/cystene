'use client';

import { useParams, useRouter } from 'next/navigation';
import { useContextAttributes } from '@/modules/nexotype/hooks/knowledge_graph/use-context-attributes';
import { useEvidenceAssertions } from '@/modules/nexotype/hooks/knowledge_graph/use-evidence-assertions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Tag, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function ContextAttributeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contextAttributeId = parseInt(params.id as string);
  const {
    contextAttributes,
    isLoading,
    error,
    setActiveContextAttribute,
    fetchContextAttribute,
    updateContextAttribute,
    deleteContextAttribute,
    fetchContextAttributes
  } = useContextAttributes();
  const { evidenceAssertions } = useEvidenceAssertions();

  // Resolve evidence FK to display label
  const getEvidenceName = (id: number | null | undefined) => {
    if (!id) return '—';
    const item = evidenceAssertions.find(ea => ea.id === id);
    return item ? `#${id} — ${item.relationship_table}` : `Evidence #${id}`;
  };

  const listItem = contextAttributes.find(ca => ca.id === contextAttributeId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const contextAttribute = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editEvidenceId, setEditEvidenceId] = useState('');
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [evidencePopoverOpen, setEvidencePopoverOpen] = useState(false);

  // Fetch by ID when list item is missing (prevents false-404 on direct navigation)
  useEffect(() => {
    if (!listItem && contextAttributeId && !isLoading) {
      fetchContextAttribute(contextAttributeId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, contextAttributeId, isLoading, fetchContextAttribute]);

  // Initialize edit form when context attribute changes
  useEffect(() => {
    if (contextAttribute) {
      setEditEvidenceId(contextAttribute.evidence_id.toString());
      setEditKey(contextAttribute.key);
      setEditValue(contextAttribute.value);
    }
  }, [contextAttribute]);

  // Set active context attribute when ID changes
  useEffect(() => {
    if (contextAttributeId) {
      setActiveContextAttribute(contextAttributeId);
    }
  }, [contextAttributeId, setActiveContextAttribute]);

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

  if (!contextAttribute) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Context attribute not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/context-attributes">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Context Attributes
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Tag className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Context Attribute #{contextAttribute.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{contextAttribute.key}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Tag className="h-4 w-4" />
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
              <CardTitle>Context Attribute Details</CardTitle>
              <CardDescription>
                Basic information about this context attribute
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Evidence Assertion</p>
                <p className="text-lg font-medium">{getEvidenceName(contextAttribute.evidence_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Key</p>
                <p className="text-lg font-medium">{contextAttribute.key}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Value</p>
                <p className="text-lg font-medium">{contextAttribute.value}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(contextAttribute.created_at).toLocaleDateString()}
                </p>
              </div>
              {contextAttribute.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(contextAttribute.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Context Attribute</CardTitle>
              <CardDescription>
                Update context attribute details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Evidence Assertion — searchable combobox */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Evidence Assertion</Label>
                  <Popover open={evidencePopoverOpen} onOpenChange={setEvidencePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={evidencePopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">
                          {editEvidenceId
                            ? `#${editEvidenceId} — ${evidenceAssertions.find(ea => ea.id.toString() === editEvidenceId)?.relationship_table || 'Unknown'}`
                            : 'Select evidence assertion'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search evidence assertion..." />
                        <CommandList>
                          <CommandEmpty>No evidence assertions found.</CommandEmpty>
                          <CommandGroup>
                            {evidenceAssertions.map((ea) => (
                              <CommandItem
                                key={ea.id}
                                value={`${ea.relationship_table} #${ea.id}`}
                                onSelect={() => {
                                  setEditEvidenceId(ea.id.toString());
                                  setEvidencePopoverOpen(false);
                                }}
                              >
                                #{ea.id} — {ea.relationship_table}
                                {editEvidenceId === ea.id.toString() && <Check className="ml-auto h-4 w-4" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key">Key</Label>
                  <Input
                    id="key"
                    value={editKey}
                    onChange={(e) => setEditKey(e.target.value)}
                    placeholder="e.g., tissue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="e.g., liver"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedEvidenceId = parseInt(editEvidenceId, 10);
                  if (isNaN(parsedEvidenceId) || parsedEvidenceId <= 0) {
                    return;
                  }
                  if (!editKey.trim()) {
                    return;
                  }
                  if (!editValue.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateContextAttribute(contextAttributeId, {
                      evidence_id: parsedEvidenceId,
                      key: editKey.trim(),
                      value: editValue.trim(),
                    });
                    if (success) {
                      await fetchContextAttributes();
                    }
                  } catch (error) {
                    console.error('Failed to update context attribute:', error);
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
                  <h4 className="font-medium">Delete this context attribute</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the context attribute from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-context-attribute">
                    Type <span className="font-semibold">{contextAttribute.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-context-attribute"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== contextAttribute.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteContextAttribute(contextAttributeId);
                      if (success) {
                        router.push('/context-attributes');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete context attribute:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== contextAttribute.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Context Attribute
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
