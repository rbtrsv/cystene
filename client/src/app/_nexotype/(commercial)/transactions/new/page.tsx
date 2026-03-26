'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import { useTransactions } from '@/modules/nexotype/hooks/commercial/use-transactions';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { CreateTransactionSchema, TRANSACTION_TYPE_OPTIONS } from '@/modules/nexotype/schemas/commercial/transaction.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function CreateTransactionPage() {
  const router = useRouter();
  const { createTransaction, error: storeError } = useTransactions();
  const { marketOrganizations } = useMarketOrganizations();
  const { therapeuticAssets } = useTherapeuticAssets();
  const { patents } = usePatents();
  const [buyerPopoverOpen, setBuyerPopoverOpen] = useState(false);
  const [sellerPopoverOpen, setSellerPopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [patentPopoverOpen, setPatentPopoverOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      buyer_id: '',
      seller_id: '',
      asset_id: '',
      patent_id: '',
      transaction_type: '',
      value_usd: '',
      announced_date: '',
    },
    onSubmit: async ({ value }) => {
      try {
        // Build payload — convert FK strings to integers, optional fields to null
        const payload = {
          buyer_id: parseInt(value.buyer_id, 10),
          seller_id: value.seller_id === '' ? null : parseInt(value.seller_id, 10),
          asset_id: value.asset_id === '' ? null : parseInt(value.asset_id, 10),
          patent_id: value.patent_id === '' ? null : parseInt(value.patent_id, 10),
          transaction_type: value.transaction_type,
          value_usd: value.value_usd === '' ? null : parseFloat(value.value_usd),
          announced_date: value.announced_date,
        };

        // Validate with Zod
        const validation = CreateTransactionSchema.safeParse(payload);

        if (!validation.success) {
          return;
        }

        const success = await createTransaction(validation.data);

        if (success) {
          router.push('/transactions');
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
        <Link href="/transactions">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Transaction</h1>
        <p className="text-muted-foreground mt-2">
          Add a new transaction
        </p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            Enter the details for your new transaction
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
              {/* Buyer — required FK searchable combobox */}
              <form.Field name="buyer_id" validators={{ onChange: ({ value }) => !value ? 'Buyer is required' : undefined }}>
                {(field) => (
                  <div className="space-y-2">
                    <Label>Buyer *</Label>
                    <Popover open={buyerPopoverOpen} onOpenChange={setBuyerPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={buyerPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value ? marketOrganizations.find(o => o.id.toString() === field.state.value)?.legal_name || 'Select buyer' : 'Select buyer'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search buyer..." /><CommandList><CommandEmpty>No organizations found.</CommandEmpty><CommandGroup>
                          {marketOrganizations.map((o) => (<CommandItem key={o.id} value={o.legal_name} onSelect={() => { field.handleChange(o.id.toString()); setBuyerPopoverOpen(false); }}>{o.legal_name}{field.state.value === o.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                    {field.state.meta.errors.length > 0 && <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>}
                  </div>
                )}
              </form.Field>

              {/* Seller — optional FK searchable combobox */}
              <form.Field name="seller_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Seller</Label>
                    <Popover open={sellerPopoverOpen} onOpenChange={setSellerPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={sellerPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value && field.state.value !== '__none__' ? marketOrganizations.find(o => o.id.toString() === field.state.value)?.legal_name || 'Select seller' : 'Select seller'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search seller..." /><CommandList><CommandEmpty>No organizations found.</CommandEmpty><CommandGroup>
                          <CommandItem value="__none__" onSelect={() => { field.handleChange(''); setSellerPopoverOpen(false); }}>— None —</CommandItem>
                          {marketOrganizations.map((o) => (<CommandItem key={o.id} value={o.legal_name} onSelect={() => { field.handleChange(o.id.toString()); setSellerPopoverOpen(false); }}>{o.legal_name}{field.state.value === o.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </form.Field>

              {/* Asset — optional FK searchable combobox */}
              <form.Field name="asset_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Asset</Label>
                    <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value && field.state.value !== '__none__' ? therapeuticAssets.find(a => a.id.toString() === field.state.value)?.name || 'Select asset' : 'Select asset'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search asset..." /><CommandList><CommandEmpty>No assets found.</CommandEmpty><CommandGroup>
                          <CommandItem value="__none__" onSelect={() => { field.handleChange(''); setAssetPopoverOpen(false); }}>— None —</CommandItem>
                          {therapeuticAssets.map((a) => (<CommandItem key={a.id} value={a.name} onSelect={() => { field.handleChange(a.id.toString()); setAssetPopoverOpen(false); }}>{a.name}{field.state.value === a.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </form.Field>

              {/* Patent — optional FK searchable combobox */}
              <form.Field name="patent_id">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Patent</Label>
                    <Popover open={patentPopoverOpen} onOpenChange={setPatentPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={patentPopoverOpen} className="w-full justify-between font-normal" disabled={form.state.isSubmitting}>
                          <span className="truncate">{field.state.value && field.state.value !== '__none__' ? patents.find(p => p.id.toString() === field.state.value)?.patent_number || 'Select patent' : 'Select patent'}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command><CommandInput placeholder="Search patent..." /><CommandList><CommandEmpty>No patents found.</CommandEmpty><CommandGroup>
                          <CommandItem value="__none__" onSelect={() => { field.handleChange(''); setPatentPopoverOpen(false); }}>— None —</CommandItem>
                          {patents.map((p) => (<CommandItem key={p.id} value={p.patent_number} onSelect={() => { field.handleChange(p.id.toString()); setPatentPopoverOpen(false); }}>{p.patent_number}{field.state.value === p.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </form.Field>

              {/* Transaction Type — required enum select */}
              <form.Field
                name="transaction_type"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Transaction type is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label>Transaction Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      disabled={form.state.isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSACTION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      The type of this transaction
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Value USD — optional */}
              <form.Field
                name="value_usd"
                validators={{
                  onChange: ({ value }) => {
                    if (value && isNaN(Number(value))) {
                      return 'Value must be a number';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Value (USD)</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g., 1000000"
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The value of this transaction in USD
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Announced Date — required */}
              <form.Field
                name="announced_date"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return 'Announced date is required';
                    }
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Announced Date *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={form.state.isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      The date this transaction was announced
                    </p>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
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
                    'Create Transaction'
                  )}
                </Button>
                <Link href="/transactions" className="flex-1">
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
