'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFees } from '@/modules/assetmanager/hooks/captable/use-fees';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { getFeeTypeLabel, getFrequencyLabel } from '@/modules/assetmanager/schemas/captable/fee.schemas';
import { getScenarioLabel } from '@/modules/assetmanager/schemas/financial/shared-financial.schemas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shadcnui/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, Receipt, Calendar, DollarSign, Percent, Clock, Pencil, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { useEffect, useState } from 'react';

export default function FeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const feeId = parseInt(params.id as string);
  const initialTab = searchParams.get('tab') === 'edit' ? 'edit' : 'details';
  const { fees, isLoading, error, fetchFee, updateFee, deleteFee, fetchFees } = useFees();
  const { getEntityName } = useEntities();

  const fee = fees.find(f => f.id === feeId);

  // Settings state
  const [editFeeType, setEditFeeType] = useState<string>('');
  const [editFeeCostName, setEditFeeCostName] = useState<string>('');
  const [editFrequency, setEditFrequency] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editPercentage, setEditPercentage] = useState<string>('');
  const [editYear, setEditYear] = useState<string>('');
  const [editQuarter, setEditQuarter] = useState<string>('');
  const [editScenario, setEditScenario] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editTransactionReference, setEditTransactionReference] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Initialize edit form when fee loads
  useEffect(() => {
    if (fee) {
      setEditFeeType(fee.fee_type);
      setEditFeeCostName(fee.fee_cost_name || '');
      setEditFrequency(fee.frequency);
      setEditAmount(fee.amount?.toString() || '');
      setEditPercentage(fee.percentage?.toString() || '');
      setEditYear(fee.year.toString());
      setEditQuarter(fee.quarter || 'none');
      setEditScenario(fee.scenario);
      setEditDate(fee.date || '');
      setEditDescription(fee.description || '');
      setEditTransactionReference(fee.transaction_reference || '');
    }
  }, [fee]);

  // Fetch fee if not in store
  useEffect(() => {
    if (feeId && !fee) {
      fetchFee(feeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeId]);


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

  if (!fee) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Fee not found</AlertDescription>
      </Alert>
    );
  }

  // Delete confirmation text
  const deleteConfirmTarget = `${getFeeTypeLabel(fee.fee_type)} ${fee.year}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/fees">
            <Button variant="ghost" size="sm" className="mb-2">
              ← Back to Fees
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {getFeeTypeLabel(fee.fee_type)}
                {fee.fee_cost_name ? ` — ${fee.fee_cost_name}` : ''}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {getFrequencyLabel(fee.frequency)}
                </Badge>
                <Badge variant="outline">
                  {getScenarioLabel(fee.scenario)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getEntityName(fee.entity_id)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <Receipt className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Pencil className="h-4 w-4" />
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Details</CardTitle>
              <CardDescription>
                Key information about this fee
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fee Type</p>
                  <p className="text-lg font-medium">{getFeeTypeLabel(fee.fee_type)}</p>
                </div>
                {fee.fee_cost_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fee Cost Name</p>
                    <p className="text-lg font-medium">{fee.fee_cost_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Entity</p>
                  <p className="text-lg font-medium">{getEntityName(fee.entity_id)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Frequency</p>
                    <p className="text-lg font-medium">{getFrequencyLabel(fee.frequency)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  {fee.amount !== null && fee.amount !== undefined && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="text-lg font-medium">
                          ${fee.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {fee.percentage !== null && fee.percentage !== undefined && (
                    <div className="flex items-center gap-2">
                      <Percent className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Percentage</p>
                        <p className="text-lg font-medium">{fee.percentage}%</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Year</p>
                      <p className="text-lg font-medium">
                        {fee.year}
                        {fee.quarter ? ` ${fee.quarter}` : ''}
                        {fee.semester ? ` ${fee.semester}` : ''}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Scenario</p>
                    <p className="text-lg font-medium">{getScenarioLabel(fee.scenario)}</p>
                  </div>
                  {fee.date && (
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="text-lg font-medium">
                        {new Date(fee.date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {fee.full_year && (
                    <div>
                      <p className="text-sm text-muted-foreground">Full Year</p>
                      <p className="text-lg font-medium">Yes</p>
                    </div>
                  )}
                </div>
              </div>

              {fee.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-lg font-medium">{fee.description}</p>
                </div>
              )}

              {fee.transaction_reference && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Transaction Reference</p>
                  <p className="text-lg font-medium">{fee.transaction_reference}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-lg font-medium">
                  {new Date(fee.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          {/* Edit Details */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Fee</CardTitle>
              <CardDescription>
                Update fee details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fee-type">Fee Type *</Label>
                  <Select
                    value={editFeeType}
                    onValueChange={setEditFeeType}
                  >
                    <SelectTrigger id="fee-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="setup">Setup</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-cost-name">Fee Cost Name</Label>
                  <Input
                    id="fee-cost-name"
                    value={editFeeCostName}
                    onChange={(e) => setEditFeeCostName(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-frequency">Frequency</Label>
                  <Select
                    value={editFrequency}
                    onValueChange={setEditFrequency}
                  >
                    <SelectTrigger id="fee-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-amount">Amount</Label>
                  <Input
                    id="fee-amount"
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-percentage">Percentage</Label>
                  <Input
                    id="fee-percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editPercentage}
                    onChange={(e) => setEditPercentage(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-year">Year *</Label>
                  <Input
                    id="fee-year"
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-quarter">Quarter</Label>
                  <Select
                    value={editQuarter}
                    onValueChange={setEditQuarter}
                  >
                    <SelectTrigger id="fee-quarter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-scenario">Scenario</Label>
                  <Select
                    value={editScenario}
                    onValueChange={setEditScenario}
                  >
                    <SelectTrigger id="fee-scenario">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actual">Actual</SelectItem>
                      <SelectItem value="forecast">Forecast</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-date">Date</Label>
                  <Input
                    id="fee-date"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee-transaction-ref">Transaction Reference</Label>
                  <Input
                    id="fee-transaction-ref"
                    value={editTransactionReference}
                    onChange={(e) => setEditTransactionReference(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-description">Description</Label>
                <Textarea
                  id="fee-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <Button
                onClick={async () => {
                  setIsUpdating(true);
                  try {
                    await updateFee(feeId, {
                      fee_type: editFeeType as 'management' | 'performance' | 'setup' | 'administrative' | 'other',
                      fee_cost_name: editFeeCostName || null,
                      frequency: editFrequency as 'one_time' | 'monthly' | 'quarterly' | 'annual',
                      amount: editAmount ? parseFloat(editAmount) : null,
                      percentage: editPercentage ? parseFloat(editPercentage) : null,
                      year: parseInt(editYear) || fee.year,
                      quarter: editQuarter === 'none' ? null : editQuarter as 'Q1' | 'Q2' | 'Q3' | 'Q4',
                      scenario: editScenario as 'actual' | 'forecast' | 'budget',
                      date: editDate || null,
                      description: editDescription || null,
                      transaction_reference: editTransactionReference || null,
                    });
                    await fetchFees({ entity_id: fee?.entity_id });
                  } catch (error) {
                    console.error('Failed to update fee:', error);
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
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive p-4 space-y-4">
                <div>
                  <h4 className="font-medium">Delete this fee</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete a fee, there is no going back. This will permanently delete the fee record.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-delete-fee">
                    Type <span className="font-semibold">{deleteConfirmTarget}</span> to confirm
                  </Label>
                  <Input
                    id="confirm-delete-fee"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Fee type and year"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteConfirmText !== deleteConfirmTarget) {
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      await deleteFee(feeId);
                      router.push('/fees');
                    } catch (error) {
                      console.error('Failed to delete fee:', error);
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmText !== deleteConfirmTarget}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Fee
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
