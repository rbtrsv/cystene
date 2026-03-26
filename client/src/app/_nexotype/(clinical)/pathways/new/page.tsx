'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { usePathways } from '@/modules/nexotype/hooks/clinical/use-pathways';
import { CreatePathwaySchema, LONGEVITY_TIER_OPTIONS } from '@/modules/nexotype/schemas/clinical/pathway.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function CreatePathwayPage() {
  const router = useRouter();
  const { createPathway, error: storeError } = usePathways();

  const form = useForm({
    defaultValues: {
      name: '',
      kegg_id: '',
      longevity_tier: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert empty strings and __none__ sentinel to null for optional fields
        const payload = {
          name: value.name,
          kegg_id: value.kegg_id || null,
          longevity_tier: value.longevity_tier === '' || value.longevity_tier === '__none__' ? null : value.longevity_tier,
        };

        // Validate with Zod
        const validation = CreatePathwaySchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createPathway(validation.data);

        if (success) {
          router.push('/pathways');
        }
        // Error is handled by store and displayed via storeError
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <Link href="/pathways">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pathways
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Pathway</h1>
        <p className="text-muted-foreground mt-2">
          Add a new biological network or signaling pathway
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pathway Details</CardTitle>
          <CardDescription>
            Enter the details for your new pathway
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="space-y-4">
              {/* Name — required */}
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'Name is required';
                    }
                    if (value.length > 255) {
                      return 'Name must be 255 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Name *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., mTOR Signaling Pathway"
                      disabled={form.state.isSubmitting}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* KEGG ID — optional */}
              <form.Field name="kegg_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>KEGG ID</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., hsa04150"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Kyoto Encyclopedia of Genes and Genomes pathway identifier
                    </p>
                  </div>
                )}
              </form.Field>

              {/* Longevity Tier — optional nullable enum select */}
              <form.Field name="longevity_tier">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Longevity Tier</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        {LONGEVITY_TIER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Static pathway importance ranking for recommendation prioritization
                    </p>
                  </div>
                )}
              </form.Field>

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
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
                    'Create Pathway'
                  )}
                </Button>
                <Link href="/pathways" className="flex-1">
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
