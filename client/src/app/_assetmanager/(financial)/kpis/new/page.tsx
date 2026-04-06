'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronsUpDown, Check } from 'lucide-react';

import { useKPIs } from '@/modules/assetmanager/hooks/financial/use-kpis';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { CreateKPISchema } from '@/modules/assetmanager/schemas/financial/kpi.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

export default function CreateKPIPage() {
  const router = useRouter();
  const { activeEntity, entities } = useEntities();
  const { createKPI, error: storeError } = useKPIs();

  // Entity selector popover state
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      entity_id: activeEntity?.id || 0,
      name: '',
      description: null as string | null,
      data_type: 'decimal',
      is_calculated: false,
      formula: null as string | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.entity_id) return;

      // Validate with Zod
      const validation = CreateKPISchema.safeParse(value);
      if (!validation.success) return;

      const success = await createKPI(validation.data);
      if (success) router.push('/kpis');
    },
  });

  if (!activeEntity) {
    return (
      <Alert>
        <AlertDescription>
          Please select an entity first.{' '}
          <Link href="/entities" className="underline">
            Go to Entities
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/kpis">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to KPIs
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create KPI</h1>
        <p className="text-muted-foreground mt-2">
          Define a new key performance indicator
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Entity Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Entity</CardTitle>
            <CardDescription>
              Select which entity this KPI belongs to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.Field name="entity_id">
              {(field) => (
                <div className="space-y-2">
                  <Label>Entity</Label>
                  <Popover open={entityPopoverOpen} onOpenChange={setEntityPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={entityPopoverOpen}
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {field.state.value
                            ? entities.find((e) => e.id === field.state.value)?.name || 'Select entity'
                            : 'Select entity'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search entity..." />
                        <CommandList>
                          <CommandEmpty>No entities found.</CommandEmpty>
                          <CommandGroup>
                            {entities.map((entity) => (
                              <CommandItem
                                key={entity.id}
                                value={entity.name}
                                onSelect={() => {
                                  field.handleChange(entity.id);
                                  setEntityPopoverOpen(false);
                                }}
                              >
                                {entity.name}
                                {field.state.value === entity.id && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* KPI Definition */}
        <Card>
          <CardHeader>
            <CardTitle>KPI Definition</CardTitle>
            <CardDescription>
              Define the KPI name, data type, and optional formula
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Name *</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="data_type">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Data Type</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="is_calculated">
              {(field) => (
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked === true)}
                  />
                  <Label htmlFor={field.name}>Is Calculated</Label>
                </div>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Description</Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value || null)}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="formula">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Formula</Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value || null)}
                  />
                </div>
              )}
            </form.Field>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={form.state.isSubmitting}
            className="flex-1"
          >
            {form.state.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create KPI'
            )}
          </Button>
          <Link href="/kpis" className="flex-1">
            <Button
              type="button"
              variant="outline"
              disabled={form.state.isSubmitting}
              className="w-full"
            >
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
