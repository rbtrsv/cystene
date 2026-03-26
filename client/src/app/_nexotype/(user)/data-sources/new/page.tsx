'use client';

import Link from 'next/link';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useDataSources } from '@/modules/nexotype/hooks/user/use-data-sources';
import { CreateDataSourceSchema, DATA_SOURCE_TYPE_OPTIONS } from '@/modules/nexotype/schemas/user/data-source.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';

/** Create page for data source records. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Form state and navigation.
// Client-side validation happens before submit actions.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateDataSourcePage() {
  const router = useRouter();
  const { createDataSource, error } = useDataSources();

  const form = useForm({
    defaultValues: { name: '', source_type: '' },
    onSubmit: async ({ value }) => {
      try {
        const payload = { name: value.name.trim(), source_type: value.source_type.trim() };
        const parsed = CreateDataSourceSchema.safeParse(payload);
        if (!parsed.success) return;
        const ok = await createDataSource(parsed.data);
        if (ok) router.push('/data-sources');
    
      } catch {
        // Swallow — ensures TanStack Form resets isSubmitting on unhandled errors
      }
    },
  });

    // Render page content.
  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
<Link href="/data-sources">
<Button variant="ghost" size="sm" className="mb-4">
<ArrowLeft className="mr-2 h-4 w-4" />Back to Data Sources</Button>
</Link>
<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Data Source</h1>
</div>
      {error && <Alert variant="destructive">
<AlertDescription>{error}</AlertDescription>
</Alert>}
      <Card>
<CardHeader>
<CardTitle>Data Source Details</CardTitle>
<CardDescription>Define source metadata</CardDescription>
</CardHeader>
<CardContent>
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-4">
          <form.Field name="name">{(field) => <div className="space-y-2">
<Label htmlFor={field.name}>Name *</Label>
<Input id={field.name} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
</div>}</form.Field>
          <form.Field name="source_type">{(field) => <div className="space-y-2">
<Label>Source Type *</Label>
<Select value={field.state.value} onValueChange={field.handleChange} disabled={form.state.isSubmitting}>
<SelectTrigger className="w-full"><SelectValue placeholder="Select source type" /></SelectTrigger>
<SelectContent>{DATA_SOURCE_TYPE_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
</Select>
</div>}</form.Field>
          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
<Button type="submit" className="flex-1" disabled={form.state.isSubmitting}>{form.state.isSubmitting ? <>
<Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Data Source'}</Button>
<Link href="/data-sources" className="flex-1">
<Button type="button" variant="outline" className="w-full">Cancel</Button>
</Link>
</div>
        </form>
      </CardContent>
</Card>
    </div>
  );
}
