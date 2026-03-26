'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMarketOrganizations } from '@/modules/nexotype/hooks/commercial/use-market-organizations';
import { getOrgStatusVariant } from '@/modules/nexotype/schemas/commercial/market-organization.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Loader2, Building2, Settings, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MarketOrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = parseInt(params.id as string);
  const {
    marketOrganizations,
    isLoading,
    error,
    setActiveMarketOrganization,
    fetchMarketOrganization,
    updateMarketOrganization,
    deleteMarketOrganization,
    fetchMarketOrganizations
  } = useMarketOrganizations();

  const listItem = marketOrganizations.find(o => o.id === orgId);
  const [fetchedItem, setFetchedItem] = useState<typeof listItem | null>(null);
  const org = listItem ?? fetchedItem ?? null;

  // Settings state
  const [editLegalName, setEditLegalName] = useState('');
  const [editOrgType, setEditOrgType] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [editTickerSymbol, setEditTickerSymbol] = useState('');
  const [editIsin, setEditIsin] = useState('');
  const [editPrimaryExchange, setEditPrimaryExchange] = useState('');
  const [editHeadquarters, setEditHeadquarters] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editFounded, setEditFounded] = useState('');
  const [editEmployeeCount, setEditEmployeeCount] = useState('');
  const [editRevenueUsd, setEditRevenueUsd] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch by ID when list item is missing (prevents false-404 on direct navigation)
  useEffect(() => {
    if (!listItem && orgId && !isLoading) {
      fetchMarketOrganization(orgId).then((result) => {
        if (result) setFetchedItem(result);
      });
    }
  }, [listItem, orgId, isLoading, fetchMarketOrganization]);

  // Initialize edit form when org changes
  useEffect(() => {
    if (org) {
      setEditLegalName(org.legal_name);
      setEditOrgType(org.org_type);
      setEditStatus(org.status);
      setEditTickerSymbol(org.ticker_symbol || '');
      setEditIsin(org.isin || '');
      setEditPrimaryExchange(org.primary_exchange || '');
      setEditHeadquarters(org.headquarters || '');
      setEditWebsite(org.website || '');
      setEditFounded(org.founded || '');
      setEditEmployeeCount(org.employee_count?.toString() || '');
      setEditRevenueUsd(org.revenue_usd?.toString() || '');
    }
  }, [org]);

  // Set active market organization when ID changes
  useEffect(() => {
    if (orgId) {
      setActiveMarketOrganization(orgId);
    }
  }, [orgId, setActiveMarketOrganization]);

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

  if (!org) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Market organization not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/market-organizations">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Market Organizations
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{org.legal_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{org.org_type}</Badge>
                <Badge variant={getOrgStatusVariant(org.status)}>{org.status}</Badge>
                {org.ticker_symbol && (
                  <span className="text-sm text-muted-foreground">
                    {org.ticker_symbol}{org.primary_exchange ? ` · ${org.primary_exchange}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">
            <Building2 className="h-4 w-4" />
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
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Basic information about this market organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Legal Name</p>
                <p className="text-lg font-medium">{org.legal_name}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Organization Type</p>
                  <p className="text-lg font-medium">{org.org_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-medium">{org.status}</p>
                </div>
              </div>
              {(org.ticker_symbol || org.isin) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  {org.ticker_symbol && (
                    <div>
                      <p className="text-sm text-muted-foreground">Ticker Symbol</p>
                      <p className="text-lg font-medium">{org.ticker_symbol}</p>
                    </div>
                  )}
                  {org.isin && (
                    <div>
                      <p className="text-sm text-muted-foreground">ISIN</p>
                      <p className="text-lg font-medium">{org.isin}</p>
                    </div>
                  )}
                </div>
              )}
              {org.primary_exchange && (
                <div>
                  <p className="text-sm text-muted-foreground">Primary Exchange</p>
                  <p className="text-lg font-medium">{org.primary_exchange}</p>
                </div>
              )}
              {(org.headquarters || org.website || org.founded) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  {org.headquarters && (
                    <div>
                      <p className="text-sm text-muted-foreground">Headquarters</p>
                      <p className="text-lg font-medium">{org.headquarters}</p>
                    </div>
                  )}
                  {org.website && (
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <p className="text-lg font-medium">{org.website}</p>
                    </div>
                  )}
                  {org.founded && (
                    <div>
                      <p className="text-sm text-muted-foreground">Founded</p>
                      <p className="text-lg font-medium">{org.founded}</p>
                    </div>
                  )}
                </div>
              )}
              {(org.employee_count || org.revenue_usd) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  {org.employee_count && (
                    <div>
                      <p className="text-sm text-muted-foreground">Employee Count</p>
                      <p className="text-lg font-medium">{org.employee_count.toLocaleString()}</p>
                    </div>
                  )}
                  {org.revenue_usd && (
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue (USD)</p>
                      <p className="text-lg font-medium">${org.revenue_usd.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(org.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Organization</CardTitle>
              <CardDescription>
                Update market organization details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legal-name">Legal Name</Label>
                  <Input
                    id="legal-name"
                    value={editLegalName}
                    onChange={(e) => setEditLegalName(e.target.value)}
                    placeholder="Legal name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-type">Organization Type</Label>
                  <Select
                    value={editOrgType}
                    onValueChange={setEditOrgType}
                  >
                    <SelectTrigger id="org-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                      <SelectItem value="University">University</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editStatus}
                    onValueChange={setEditStatus}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Acquired">Acquired</SelectItem>
                      <SelectItem value="Bankrupt">Bankrupt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticker-symbol">Ticker Symbol</Label>
                  <Input
                    id="ticker-symbol"
                    value={editTickerSymbol}
                    onChange={(e) => setEditTickerSymbol(e.target.value)}
                    placeholder="e.g., AAPL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isin">ISIN</Label>
                  <Input
                    id="isin"
                    value={editIsin}
                    onChange={(e) => setEditIsin(e.target.value)}
                    placeholder="e.g., US0378331005"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-exchange">Primary Exchange</Label>
                  <Input
                    id="primary-exchange"
                    value={editPrimaryExchange}
                    onChange={(e) => setEditPrimaryExchange(e.target.value)}
                    placeholder="e.g., NASDAQ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headquarters">Headquarters</Label>
                  <Input
                    id="headquarters"
                    value={editHeadquarters}
                    onChange={(e) => setEditHeadquarters(e.target.value)}
                    placeholder="e.g., Cupertino, CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="e.g., https://apple.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="founded">Founded</Label>
                  <Input
                    id="founded"
                    value={editFounded}
                    onChange={(e) => setEditFounded(e.target.value)}
                    placeholder="e.g., 1976"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee-count">Employee Count</Label>
                  <Input
                    id="employee-count"
                    type="number"
                    value={editEmployeeCount}
                    onChange={(e) => setEditEmployeeCount(e.target.value)}
                    placeholder="e.g., 164000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue-usd">Revenue (USD)</Label>
                  <Input
                    id="revenue-usd"
                    type="number"
                    step="0.01"
                    value={editRevenueUsd}
                    onChange={(e) => setEditRevenueUsd(e.target.value)}
                    placeholder="e.g., 394328000000"
                  />
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!editLegalName.trim()) {
                    return;
                  }
                  setIsUpdating(true);
                  try {
                    const success = await updateMarketOrganization(orgId, {
                      legal_name: editLegalName.trim(),
                      org_type: editOrgType as 'Public' | 'Private' | 'University',
                      status: editStatus as 'Active' | 'Inactive' | 'Acquired' | 'Bankrupt',
                      ticker_symbol: editTickerSymbol || null,
                      isin: editIsin || null,
                      primary_exchange: editPrimaryExchange || null,
                      headquarters: editHeadquarters || null,
                      website: editWebsite || null,
                      founded: editFounded || null,
                      employee_count: editEmployeeCount ? parseInt(editEmployeeCount) : null,
                      revenue_usd: editRevenueUsd ? parseFloat(editRevenueUsd) : null,
                    });
                    if (success) {
                      await fetchMarketOrganizations();
                    }
                  } catch (error) {
                    console.error('Failed to update market organization:', error);
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
                  <h4 className="font-medium">Delete this market organization</h4>
                  <p className="text-sm text-muted-foreground">
                    This will remove the market organization from active use. The record will be soft-deleted and can be restored by an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-org">
                    Type <span className="font-semibold">{org.legal_name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-org"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Organization legal name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== org.legal_name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const success = await deleteMarketOrganization(orgId);
                      if (success) {
                        router.push('/market-organizations');
                      } else {
                        setIsDeleting(false);
                      }
                    } catch (error) {
                      console.error('Failed to delete market organization:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== org.legal_name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Organization
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
