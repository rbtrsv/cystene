'use client';

import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { CreateTherapeuticAssetSchema, ASSET_TYPE_OPTIONS } from '@/modules/nexotype/schemas/asset/therapeutic-asset.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Page component for this route.
 */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
export default function CreateTherapeuticAssetPage() {
  const router = useRouter();
  const { createTherapeuticAsset, error: storeError } = useTherapeuticAssets();

  const form = useForm({
    defaultValues: {
      uid: '',
      name: '',
      project_code: '',
      asset_type: 'asset',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert empty strings to null for optional fields
        const payload = {
          uid: value.uid,
          name: value.name,
          project_code: value.project_code || null,
          asset_type: value.asset_type,
        };

        // Validate with Zod
        const validation = CreateTherapeuticAssetSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createTherapeuticAsset(validation.data);

        if (success) {
          router.push('/therapeutic-assets');
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
        <Link href="/therapeutic-assets">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Therapeutic Assets
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Therapeutic Asset</h1>
        <p className="text-muted-foreground mt-2">
          Add a new drug, biologic, or pipeline candidate
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
          <CardDescription>
            Enter the details for your new therapeutic asset
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
              {/* UID — required */}
              <form.Field
                name="uid"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length === 0) {
                      return 'UID is required';
                    }
                    if (value.length > 100) {
                      return 'UID must be 100 characters or less';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>UID *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., CTX-001"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Unique identifier for this asset (must be globally unique)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

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
                      placeholder="e.g., Rapamycin"
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

              {/* Asset Type — required enum select */}
              <form.Field
                name="asset_type"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Asset type is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Asset Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Polymorphic discriminator (e.g., asset, small_molecule, biologic, oligonucleotide)
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Project Code — optional */}
              <form.Field name="project_code">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Project Code</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., PRJ-2024-001"
                      disabled={form.state.isSubmitting}
                    />
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
                    'Create Asset'
                  )}
                </Button>
                <Link href="/therapeutic-assets" className="flex-1">
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
