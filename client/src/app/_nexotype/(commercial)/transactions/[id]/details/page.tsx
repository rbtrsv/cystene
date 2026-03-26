'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTransactions } from '@/modules/nexotype/hooks/commercial/use-transactions';
import { TRANSACTION_TYPE_OPTIONS, type TransactionType } from '@/modules/nexotype/schemas/commercial/transaction.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, ArrowLeftRight, Settings, AlertTriangle, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { useTherapeuticAssets } from '@/modules/nexotype/hooks/asset/use-therapeutic-assets';
import { usePatents } from '@/modules/nexotype/hooks/commercial/use-patents';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior and keep flows explicit.
export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = parseInt(params.id as string);
  const {
    transactions,
    isLoading,
    error,
    setActiveTransaction,
    fetchTransaction,
    updateTransaction,
    deleteTransaction,
    fetchTransactions
  } = useTransactions();
  const { marketOrganizations } = useMarketOrganizations();
  const { therapeuticAssets } = useTherapeuticAssets();
  const { patents } = usePatents();

  // Resolve FK fields to display names
  const getOrgName = (id: number | null | undefined) => {
    if (!id) return '—';
    const o = marketOrganizations.find(mo => mo.id === id);
    return o ? o.legal_name : `Organization #${id}`;
  };

  const getAssetName = (id: number | null | undefined) => {
    if (!id) return '—';
    const a = therapeuticAssets.find(ta => ta.id === id);
    return a ? a.name : `Asset #${id}`;
  };

  const getPatentName = (id: number | null | undefined) => {
    if (!id) return '—';
    const p = patents.find(pt => pt.id === id);
    return p ? p.patent_number : `Patent #${id}`;
  };

  const listItem = transactions.find(transaction => transaction.id === transactionId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const transaction = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editBuyerId, setEditBuyerId] = useState('');
  const [editSellerId, setEditSellerId] = useState('');
  const [editAssetId, setEditAssetId] = useState('');
  const [editPatentId, setEditPatentId] = useState('');
  const [editTransactionType, setEditTransactionType] = useState('');
  const [editValueUsd, setEditValueUsd] = useState('');
  const [editAnnouncedDate, setEditAnnouncedDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [buyerPopoverOpen, setBuyerPopoverOpen] = useState(false);
  const [sellerPopoverOpen, setSellerPopoverOpen] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [patentPopoverOpen, setPatentPopoverOpen] = useState(false);

  // Fetch by ID fallback when list doesn't contain this transaction
  useEffect(() => {
    if (!listItem && transactionId && !isLoading) {
      fetchTransaction(transactionId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, transactionId, isLoading, fetchTransaction]);

  // Initialize edit form when transaction changes
  useEffect(() => {
    if (transaction) {
      setEditBuyerId(transaction.buyer_id.toString());
      setEditSellerId(transaction.seller_id != null ? transaction.seller_id.toString() : '');
      setEditAssetId(transaction.asset_id != null ? transaction.asset_id.toString() : '');
      setEditPatentId(transaction.patent_id != null ? transaction.patent_id.toString() : '');
      setEditTransactionType(transaction.transaction_type || '');
      setEditValueUsd(transaction.value_usd != null ? transaction.value_usd.toString() : '');
      setEditAnnouncedDate(transaction.announced_date || '');
    }
  }, [transaction]);

  // Set active transaction when ID changes
  useEffect(() => {
    if (transactionId) {
      setActiveTransaction(transactionId);
    }
  }, [transactionId, setActiveTransaction]);

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

  if (!transaction) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Transaction not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Transactions
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Transaction #{transaction.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                {transaction.transaction_type && <Badge variant="outline">{transaction.transaction_type}</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <ArrowLeftRight className="h-4 w-4" />
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
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>
                Basic information about this transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Buyer</p>
                <p className="text-lg font-medium">{getOrgName(transaction.buyer_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seller</p>
                <p className="text-lg font-medium">{getOrgName(transaction.seller_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="text-lg font-medium">{getAssetName(transaction.asset_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patent</p>
                <p className="text-lg font-medium">{getPatentName(transaction.patent_id)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transaction Type</p>
                <p className="text-lg font-medium">{transaction.transaction_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Value USD</p>
                <p className="text-lg font-medium">{transaction.value_usd ?? '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Announced Date</p>
                <p className="text-lg font-medium">{new Date(transaction.announced_date).toLocaleDateString()}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </p>
              </div>
              {transaction.updated_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-medium">
                    {new Date(transaction.updated_at).toLocaleDateString()}
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
              <CardTitle>Edit Transaction</CardTitle>
              <CardDescription>
                Update transaction details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Buyer — searchable combobox */}
                <div className="space-y-2">
                  <Label>Buyer</Label>
                  <Popover open={buyerPopoverOpen} onOpenChange={setBuyerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={buyerPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editBuyerId ? marketOrganizations.find(o => o.id.toString() === editBuyerId)?.legal_name || 'Select buyer' : 'Select buyer'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search buyer..." /><CommandList><CommandEmpty>No organizations found.</CommandEmpty><CommandGroup>
                        {marketOrganizations.map((o) => (<CommandItem key={o.id} value={o.legal_name} onSelect={() => { setEditBuyerId(o.id.toString()); setBuyerPopoverOpen(false); }}>{o.legal_name}{editBuyerId === o.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Seller — optional searchable combobox */}
                <div className="space-y-2">
                  <Label>Seller</Label>
                  <Popover open={sellerPopoverOpen} onOpenChange={setSellerPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={sellerPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editSellerId ? marketOrganizations.find(o => o.id.toString() === editSellerId)?.legal_name || 'Select seller' : 'Select seller'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search seller..." /><CommandList><CommandEmpty>No organizations found.</CommandEmpty><CommandGroup>
                        <CommandItem value="__none__" onSelect={() => { setEditSellerId(''); setSellerPopoverOpen(false); }}>— None —</CommandItem>
                        {marketOrganizations.map((o) => (<CommandItem key={o.id} value={o.legal_name} onSelect={() => { setEditSellerId(o.id.toString()); setSellerPopoverOpen(false); }}>{o.legal_name}{editSellerId === o.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Asset — optional searchable combobox */}
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={assetPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editAssetId ? therapeuticAssets.find(a => a.id.toString() === editAssetId)?.name || 'Select asset' : 'Select asset'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search asset..." /><CommandList><CommandEmpty>No assets found.</CommandEmpty><CommandGroup>
                        <CommandItem value="__none__" onSelect={() => { setEditAssetId(''); setAssetPopoverOpen(false); }}>— None —</CommandItem>
                        {therapeuticAssets.map((a) => (<CommandItem key={a.id} value={a.name} onSelect={() => { setEditAssetId(a.id.toString()); setAssetPopoverOpen(false); }}>{a.name}{editAssetId === a.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Patent — optional searchable combobox */}
                <div className="space-y-2">
                  <Label>Patent</Label>
                  <Popover open={patentPopoverOpen} onOpenChange={setPatentPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={patentPopoverOpen} className="w-full justify-between font-normal">
                        <span className="truncate">{editPatentId ? patents.find(p => p.id.toString() === editPatentId)?.patent_number || 'Select patent' : 'Select patent'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command><CommandInput placeholder="Search patent..." /><CommandList><CommandEmpty>No patents found.</CommandEmpty><CommandGroup>
                        <CommandItem value="__none__" onSelect={() => { setEditPatentId(''); setPatentPopoverOpen(false); }}>— None —</CommandItem>
                        {patents.map((p) => (<CommandItem key={p.id} value={p.patent_number} onSelect={() => { setEditPatentId(p.id.toString()); setPatentPopoverOpen(false); }}>{p.patent_number}{editPatentId === p.id.toString() && <Check className="ml-auto h-4 w-4" />}</CommandItem>))}
                      </CommandGroup></CommandList></Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Transaction Type</Label>
                  <Select value={editTransactionType} onValueChange={setEditTransactionType}>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value-usd">Value USD</Label>
                  <Input
                    id="value-usd"
                    type="number"
                    value={editValueUsd}
                    onChange={(e) => setEditValueUsd(e.target.value)}
                    placeholder="e.g., 1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="announced-date">Announced Date</Label>
                  <Input
                    id="announced-date"
                    type="date"
                    value={editAnnouncedDate}
                    onChange={(e) => setEditAnnouncedDate(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  const parsedBuyerId = parseInt(editBuyerId, 10);
                  if (isNaN(parsedBuyerId) || parsedBuyerId <= 0) {
                    return;
                  }
                  if (!editTransactionType) {
                    return;
                  }
                  if (!editAnnouncedDate) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateTransaction(transactionId, {
                      buyer_id: parsedBuyerId,
                      seller_id: editSellerId === '' ? null : parseInt(editSellerId, 10),
                      asset_id: editAssetId === '' ? null : parseInt(editAssetId, 10),
                      patent_id: editPatentId === '' ? null : parseInt(editPatentId, 10),
                      transaction_type: editTransactionType as TransactionType,
                      value_usd: editValueUsd === '' ? null : parseFloat(editValueUsd),
                      announced_date: editAnnouncedDate,
                    });
                    if (success) {
                      await fetchTransactions();
                    }
                  } catch (error) {
                    console.error('Failed to update transaction:', error);
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
                  <h4 className="font-medium">Delete this transaction</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the transaction from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-transaction">
                    Type <span className="font-semibold">{transaction.id.toString()}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-transaction"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="ID"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== transaction.id.toString()) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteTransaction(transactionId);
                      if (success) {
                        router.push('/transactions');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete transaction:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== transaction.id.toString()}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Transaction
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
