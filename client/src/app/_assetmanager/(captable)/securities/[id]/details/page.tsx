'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSecurities } from '@/modules/assetmanager/hooks/captable/use-securities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { type Security, type SecurityType, getSecurityTypeLabel } from '@/modules/assetmanager/schemas/captable/security.schemas';
import {
  FieldType,
  type FieldConfig,
  getFieldsForTab,
  getVisibleTabs,
  SECURITY_TYPES,
  CURRENCIES,
  ANTI_DILUTION_TYPES,
  INTEREST_RATE_TYPES,
} from '@/modules/assetmanager/schemas/captable/security-form.schemas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, Shield, Pencil, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SecurityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const securityId = parseInt(params.id as string);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const { securities, isLoading, error, fetchSecurity, updateSecurity, deleteSecurity, fetchSecurities } = useSecurities();
  const { fundingRounds, getFundingRoundsByEntity } = useFundingRounds();

  const security = securities.find(s => s.id === securityId);

  // Edit form state - stores all field values as strings/booleans for form inputs
  const [editValues, setEditValues] = useState<Record<string, string | boolean | null>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Initialize edit form when security loads
  useEffect(() => {
    if (security) {
      const values: Record<string, string | boolean | null> = {};
      // Populate all fields from the security object
      Object.entries(security).forEach(([key, value]) => {
        if (key === 'id' || key === 'created_at' || key === 'updated_at') return;
        if (typeof value === 'boolean') {
          values[key] = value;
        } else if (value === null || value === undefined) {
          values[key] = null;
        } else {
          values[key] = String(value);
        }
      });
      setEditValues(values);
    }
  }, [security]);

  // Fetch security if not in store
  useEffect(() => {
    if (securityId && !security) {
      fetchSecurity(securityId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [securityId]);

  // Get funding round name
  const getFundingRoundName = (id: number) => {
    const round = fundingRounds.find(r => r.id === id);
    return round ? round.name : 'Unknown Round';
  };

  // Helper to get display value for a field
  const getDisplayValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  // Get select options for a field by name
  const getOptionsForField = (fieldName: string): Record<string, string> => {
    switch (fieldName) {
      case 'security_type':
        return SECURITY_TYPES;
      case 'currency':
        return CURRENCIES;
      case 'anti_dilution':
        return ANTI_DILUTION_TYPES;
      case 'interest_rate_type':
        return INTEREST_RATE_TYPES;
      default:
        return {};
    }
  };

  // Update a single edit value
  const setEditValue = (name: string, value: string | boolean | null) => {
    setEditValues(prev => ({ ...prev, [name]: value }));
  };

  // Render a single edit field based on FieldConfig
  const renderEditField = (fieldConfig: FieldConfig) => {
    const { name, label, type, placeholder, step, options, required } = fieldConfig;
    const value = editValues[name];

    // Special handling for funding_round_id
    if (name === 'funding_round_id') {
      return (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>
            {label}{required && ' *'}
          </Label>
          <Select
            value={value ? String(value) : ''}
            onValueChange={(v) => setEditValue(name, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a funding round" />
            </SelectTrigger>
            <SelectContent>
              {fundingRounds.map((round) => (
                <SelectItem key={round.id} value={round.id.toString()}>
                  {round.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Special handling for security_type
    if (name === 'security_type') {
      return (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>
            {label}{required && ' *'}
          </Label>
          <Select
            value={value ? String(value) : ''}
            onValueChange={(v) => setEditValue(name, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select security type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SECURITY_TYPES).map(([key, val]) => (
                <SelectItem key={key} value={val}>
                  {getSecurityTypeLabel(val)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    switch (type) {
      case FieldType.TEXT:
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label}{required && ' *'}
            </Label>
            <Input
              id={name}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => setEditValue(name, e.target.value || null)}
              placeholder={placeholder}
            />
          </div>
        );

      case FieldType.NUMBER:
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label}{required && ' *'}
            </Label>
            <Input
              id={name}
              type="number"
              step={step || '1'}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => setEditValue(name, e.target.value || null)}
              placeholder={placeholder}
            />
          </div>
        );

      case FieldType.CHECKBOX:
        return (
          <div key={name} className="flex items-center space-x-2">
            <Checkbox
              id={name}
              checked={!!value}
              onCheckedChange={(checked) => setEditValue(name, !!checked)}
            />
            <Label htmlFor={name} className="cursor-pointer">
              {label}
            </Label>
          </div>
        );

      case FieldType.SELECT: {
        const selectOptions = options || getOptionsForField(name);
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label}{required && ' *'}
            </Label>
            <Select
              value={value !== null && value !== undefined ? String(value) : ''}
              onValueChange={(v) => setEditValue(name, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(selectOptions).map(([key, val]) => (
                  <SelectItem key={key} value={val}>
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }

      case FieldType.TEXTAREA:
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label}{required && ' *'}
            </Label>
            <Textarea
              id={name}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => setEditValue(name, e.target.value || null)}
              placeholder={placeholder}
            />
          </div>
        );

      case FieldType.DATE:
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {label}{required && ' *'}
            </Label>
            <Input
              id={name}
              type="date"
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => setEditValue(name, e.target.value || null)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!security) return;

    setIsUpdating(true);
    try {
      // Build update data from editValues, converting types appropriately
      const updateData: Record<string, unknown> = {};
      Object.entries(editValues).forEach(([key, value]) => {
        if (key === 'funding_round_id') {
          updateData[key] = value ? parseInt(String(value)) : undefined;
        } else if (['issue_price', 'voting_ratio', 'dividend_rate', 'liquidation_preference',
          'participation_cap', 'conversion_ratio', 'interest_rate', 'valuation_cap',
          'conversion_discount', 'strike_price', 'pool_size', 'pool_available',
          'total_shares', 'principal', 'coupon_rate'].includes(key)) {
          updateData[key] = value !== null && value !== '' ? parseFloat(String(value)) : null;
        } else if (['seniority', 'redemption_term', 'vesting_months', 'cliff_months',
          'exercise_window_days', 'tenure_months', 'moratorium_period'].includes(key)) {
          updateData[key] = value !== null && value !== '' ? parseInt(String(value)) : null;
        } else if (typeof value === 'boolean') {
          updateData[key] = value;
        } else {
          updateData[key] = value !== null && value !== '' ? value : null;
        }
      });

      await updateSecurity(securityId, updateData);
      await fetchSecurities();
    } catch (err) {
      console.error('Failed to update security:', err);
    } finally {
      setIsUpdating(false);
    }
  };

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

  if (!security) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Security not found</AlertDescription>
      </Alert>
    );
  }

  // Get visible tabs for the security's type
  const visibleTabs = getVisibleTabs(security.security_type);

  // Current security type for edit form (may differ from original if user changes it)
  const editSecurityType = (editValues.security_type || security.security_type) as SecurityType;
  const editVisibleTabs = getVisibleTabs(editSecurityType);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/securities">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Securities
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{security.security_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {getSecurityTypeLabel(security.security_type)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {security.code}
                </span>
                <span className="text-sm text-muted-foreground">
                  · {getFundingRoundName(security.funding_round_id)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <Shield className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        {/* ==========================================
            Overview Tab
            ========================================== */}
        <TabsContent value="details" className="space-y-4">
          {/* General Details - always shown */}
          <Card>
            <CardHeader>
              <CardTitle>General Details</CardTitle>
              <CardDescription>
                Core security information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Security Name</p>
                  <p className="text-lg font-medium">{security.security_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Code</p>
                  <p className="text-lg font-medium">{security.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Security Type</p>
                  <p className="text-lg font-medium">{getSecurityTypeLabel(security.security_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Funding Round</p>
                  <p className="text-lg font-medium">{getFundingRoundName(security.funding_round_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="text-lg font-medium">{security.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issue Price</p>
                  <p className="text-lg font-medium">{getDisplayValue(security.issue_price)}</p>
                </div>
              </div>
              {security.special_terms && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Special Terms</p>
                  <p className="text-lg font-medium">{security.special_terms}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(security.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Type-specific sections - render remaining visible tabs as read-only overview cards */}
          {visibleTabs
            .filter(tab => tab.id !== 'general')
            .map(tab => {
              const tabFields = getFieldsForTab(tab.id, security.security_type);
              // Only show the tab section if there are fields with non-null values
              const hasData = tabFields.some(f => {
                const val = (security as Record<string, unknown>)[f.name];
                return val !== null && val !== undefined;
              });

              if (!hasData) return null;

              return (
                <Card key={tab.id}>
                  <CardHeader>
                    <CardTitle>{tab.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {tabFields.map(f => {
                        const val = (security as Record<string, unknown>)[f.name];
                        if (val === null || val === undefined) return null;
                        return (
                          <div key={f.name}>
                            <p className="text-sm text-muted-foreground">{f.label}</p>
                            <p className="text-lg font-medium">{getDisplayValue(val)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>

        {/* ==========================================
            Settings Tab
            ========================================== */}
        <TabsContent value="edit" className="space-y-4">
          {/* Edit form - render visible tabs as edit cards */}
          {editVisibleTabs.map(tab => {
            const tabFields = getFieldsForTab(tab.id, editSecurityType);
            if (tabFields.length === 0) return null;

            return (
              <Card key={tab.id}>
                <CardHeader>
                  <CardTitle>
                    {tab.id === 'general' ? 'Edit Security' : `Edit ${tab.label}`}
                  </CardTitle>
                  <CardDescription>
                    {tab.id === 'general'
                      ? 'Update core security details'
                      : `Update ${tab.label.toLowerCase()} settings`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {tabFields.map(fieldConfig => renderEditField(fieldConfig))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Save Button */}
          <Button
            onClick={handleSaveChanges}
            disabled={isUpdating}
            className="w-full"
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

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this security</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete a security, there is no going back. This will permanently delete the security and all associated data.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-security">
                    Type <span className="font-semibold">{security.security_name}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-security"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder="Security name"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmName !== security.security_name) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      await deleteSecurity(securityId);
                      router.push('/securities');
                    } catch (err) {
                      console.error('Failed to delete security:', err);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmName !== security.security_name}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Security
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
