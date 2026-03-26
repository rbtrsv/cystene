'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useTransactions } from '@/modules/assetmanager/hooks/use-transactions';
import { useStakeholders } from '@/modules/assetmanager/hooks/use-stakeholders';
import { useSecurities } from '@/modules/assetmanager/hooks/use-securities';
import { useFunds } from '@/modules/assetmanager/hooks/use-funds';
import { useRounds } from '@/modules/assetmanager/hooks/use-rounds';
import { getNextTransactionReference } from '@/modules/assetmanager/actions/transactions.actions';
import { CreateTransactionSchema, UpdateTransactionSchema, type TransactionType, type Transaction } from '@/modules/assetmanager/schemas/transactions.schemas';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
import { Save } from 'lucide-react';

interface TransactionFormProps {
  id?: number;
  initialData?: Transaction;
}

// Standard FieldInfo component for displaying validation errors
function FieldInfo({ field }: { field: any }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <p className="text-sm text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
      ) : null}
      {field.state.meta.isValidating ? <p className="text-sm text-muted-foreground mt-1">Validating...</p> : null}
    </>
  );
}

export default function TransactionForm({ id, initialData }: TransactionFormProps) {
  const router = useRouter();
  const { selectedTransaction, fetchTransaction, fetchTransactions, createTransaction, updateTransaction, isLoading, error, clearError, transactions } = useTransactions();
  const { stakeholders, isLoading: stakeholdersLoading } = useStakeholders();
  const { securities, isLoading: securitiesLoading } = useSecurities();
  const { funds, isLoading: fundsLoading } = useFunds();
  const { rounds, isLoading: roundsLoading } = useRounds();
  
  const isEditMode = !!id;
  const [isGeneratingReference, setIsGeneratingReference] = useState(false);
  const [hasUserEditedReference, setHasUserEditedReference] = useState(false);
  
  // TanStack Form setup with schema validation
  const form = useForm({
    defaultValues: {
      transactionDate: initialData?.transactionDate?.toISOString().split('T')[0] || selectedTransaction?.transactionDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      transactionReference: initialData?.transactionReference || selectedTransaction?.transactionReference || '',
      transactionType: initialData?.transactionType || selectedTransaction?.transactionType || '' as TransactionType,
      stakeholderId: initialData?.stakeholderId || selectedTransaction?.stakeholderId || undefined,
      securityId: initialData?.securityId || selectedTransaction?.securityId || undefined,
      fundId: initialData?.fundId || selectedTransaction?.fundId || undefined,
      roundId: initialData?.roundId || selectedTransaction?.roundId || undefined,
      amountDebit: initialData?.amountDebit?.toString() || selectedTransaction?.amountDebit?.toString() || '0',
      amountCredit: initialData?.amountCredit?.toString() || selectedTransaction?.amountCredit?.toString() || '0',
      unitsDebit: initialData?.unitsDebit?.toString() || selectedTransaction?.unitsDebit?.toString() || '0',
      unitsCredit: initialData?.unitsCredit?.toString() || selectedTransaction?.unitsCredit?.toString() || '0',
      relatedTransactionId: initialData?.relatedTransactionId || selectedTransaction?.relatedTransactionId || null,
      notes: initialData?.notes || selectedTransaction?.notes || '',
    },
    
    // Form-level validation using full schema
    validators: {
      onChange: ({ value }) => {
        // Transform form strings to match schema expectations
        const transformedValue = {
          transactionDate: new Date(value.transactionDate),
          transactionReference: value.transactionReference,
          transactionType: value.transactionType,
          stakeholderId: Number(value.stakeholderId),
          securityId: Number(value.securityId),
          fundId: Number(value.fundId),
          roundId: Number(value.roundId),
          amountDebit: Number(value.amountDebit) || 0,
          amountCredit: Number(value.amountCredit) || 0,
          unitsDebit: Number(value.unitsDebit) || 0,
          unitsCredit: Number(value.unitsCredit) || 0,
          relatedTransactionId: value.relatedTransactionId ? Number(value.relatedTransactionId) : null,
          notes: value.notes || null,
        };
        
        const schema = isEditMode ? UpdateTransactionSchema : CreateTransactionSchema;
        const result = schema.safeParse(transformedValue);
        
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path.length > 0) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          return fieldErrors;
        }
        
        return undefined;
      },
    },
    
    onSubmit: async ({ value }) => {
      // Transform form strings to match schema expectations
      const transformedValue = {
        transactionDate: new Date(value.transactionDate),
        transactionReference: value.transactionReference,
        transactionType: value.transactionType,
        stakeholderId: Number(value.stakeholderId),
        securityId: Number(value.securityId),
        fundId: Number(value.fundId),
        roundId: Number(value.roundId),
        amountDebit: Number(value.amountDebit) || 0,
        amountCredit: Number(value.amountCredit) || 0,
        unitsDebit: Number(value.unitsDebit) || 0,
        unitsCredit: Number(value.unitsCredit) || 0,
        relatedTransactionId: value.relatedTransactionId ? Number(value.relatedTransactionId) : null,
        notes: value.notes || null,
      };
      
      const schema = isEditMode ? UpdateTransactionSchema : CreateTransactionSchema;
      const result = schema.parse(transformedValue);
      
      if (isEditMode && id) {
        const success = await updateTransaction(id, result);
        if (success) router.push(`/dashboard/transactions/${id}`);
      } else {
        const success = await createTransaction(result);
        if (success) router.push('/dashboard/transactions');
      }
    },
  });

  // Generate initial reference when transaction type changes
  const currentTransactionType = form.getFieldValue('transactionType') as TransactionType;
  
  useEffect(() => {
    const generateInitialReference = async () => {
      if (!isEditMode && !hasUserEditedReference && currentTransactionType) {
        setIsGeneratingReference(true);
        try {
          const newReference = await getNextTransactionReference(currentTransactionType);
          form.setFieldValue('transactionReference', newReference);
        } catch (error) {
          console.error('Error generating initial reference:', error);
        } finally {
          setIsGeneratingReference(false);
        }
      }
    };

    generateInitialReference();
  }, [currentTransactionType, isEditMode, hasUserEditedReference, form]);

  // Fetch transaction data for edit mode
  useEffect(() => {
    if (isEditMode && id && !initialData) fetchTransaction(id);
  }, [isEditMode, id, initialData, fetchTransaction]);

  // Reset form when selectedTransaction changes
  useEffect(() => {
    if (selectedTransaction && isEditMode && selectedTransaction.id === id) {
      form.reset({
        transactionDate: selectedTransaction.transactionDate.toISOString().split('T')[0],
        transactionReference: selectedTransaction.transactionReference,
        transactionType: selectedTransaction.transactionType,
        stakeholderId: selectedTransaction.stakeholderId,
        securityId: selectedTransaction.securityId,
        fundId: selectedTransaction.fundId,
        roundId: selectedTransaction.roundId,
        amountDebit: selectedTransaction.amountDebit.toString(),
        amountCredit: selectedTransaction.amountCredit.toString(),
        unitsDebit: selectedTransaction.unitsDebit.toString(),
        unitsCredit: selectedTransaction.unitsCredit.toString(),
        relatedTransactionId: selectedTransaction.relatedTransactionId,
        notes: selectedTransaction.notes || '',
      });
      setHasUserEditedReference(true);
    }
  }, [selectedTransaction, isEditMode, id, form]);

  // Fetch all transactions for the related transaction dropdown
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Loading state
  if (isLoading || stakeholdersLoading || securitiesLoading || fundsLoading || roundsLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Transaction' : 'Create Transaction'}</CardTitle>
          <CardDescription>Loading transaction information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Transaction' : 'Create Transaction'}</CardTitle>
          <CardDescription>Error loading transaction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error}
          </div>
          <Button onClick={clearError} className="mt-4">Try Again</Button>
        </CardContent>
      </>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {isEditMode ? 'Edit Transaction' : 'Create Transaction'}
        </CardTitle>
        <CardDescription>
          {isEditMode ? 'Update transaction details' : 'Enter transaction information'}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}>
        <CardContent className="space-y-4 p-3 md:p-4">
          
          {/* Basic Information */}
          <Card className="w-full shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Transaction Date */}
                <div className="space-y-1">
                  <form.Field
                    name="transactionDate"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return 'Transaction date is required';
                        if (isNaN(new Date(value).getTime())) return 'Invalid date';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Transaction Date</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="date"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
                
                {/* Transaction Reference */}
                <div className="space-y-2">
                  <form.Field
                    name="transactionReference"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value || value.trim() === '') return 'Transaction reference is required';
                        if (value.length > 100) return 'Transaction reference too long (max 100 characters)';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Transaction Reference</Label>
                        <div className="flex space-x-2">
                          <Input
                            id={field.name}
                            name={field.name}
                            type="text"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(e.target.value);
                              setHasUserEditedReference(true);
                            }}
                            placeholder={isGeneratingReference ? "Generating reference..." : "Auto-generated or enter custom reference"}
                            className="flex-1"
                            disabled={isGeneratingReference}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const currentType = form.getFieldValue('transactionType') as TransactionType;
                              if (!currentType) return;
                              setIsGeneratingReference(true);
                              try {
                                const newReference = await getNextTransactionReference(currentType);
                                field.handleChange(newReference);
                                setHasUserEditedReference(false);
                              } catch (error) {
                                console.error('Error generating new reference:', error);
                              } finally {
                                setIsGeneratingReference(false);
                              }
                            }}
                            disabled={isGeneratingReference}
                            className="whitespace-nowrap"
                          >
                            {isGeneratingReference ? 'Generating...' : 'Generate New'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Auto-generated reference that updates with transaction type. Edit to group related transactions or use &quot;Generate New&quot; for a fresh reference.
                        </p>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
              
              {/* Transaction Type */}
              <div className="space-y-2">
                <form.Field
                  name="transactionType"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return 'Transaction type is required';
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Transaction Type</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => {
                          field.handleChange(value as TransactionType);
                          // Auto-regenerate reference if user hasn't manually edited it
                          if (!hasUserEditedReference && !isEditMode) {
                            (async () => {
                              try {
                                const newReference = await getNextTransactionReference(value as TransactionType);
                                form.setFieldValue('transactionReference', newReference);
                              } catch (error) {
                                console.error('Error auto-generating reference:', error);
                              }
                            })();
                          }
                        }}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Entity Perspective: Primary transaction types */}
                          <SelectItem value="ISSUANCE">Issuance</SelectItem>
                          <SelectItem value="DISTRIBUTION">Distribution</SelectItem>
                          <SelectItem value="REDEMPTION">Redemption</SelectItem>

                          {/* Transfer Transactions */}
                          <SelectItem value="TRANSFER_IN">Transfer In</SelectItem>
                          <SelectItem value="TRANSFER_OUT">Transfer Out</SelectItem>

                          {/* Legacy/Other Cash Transactions */}
                          <SelectItem value="CASH_IN">Cash In</SelectItem>
                          <SelectItem value="CASH_OUT">Cash Out</SelectItem>
                          <SelectItem value="COUPON_IN">Coupon In</SelectItem>
                          <SelectItem value="COUPON_OUT">Coupon Out</SelectItem>

                          {/* Share Transactions */}
                          <SelectItem value="CONVERSION_IN">Conversion In</SelectItem>
                          <SelectItem value="CONVERSION_OUT">Conversion Out</SelectItem>
                          <SelectItem value="SPLIT">Split</SelectItem>
                          <SelectItem value="CONSOLIDATION">Consolidation</SelectItem>

                          {/* Option Transactions */}
                          <SelectItem value="GRANT">Grant</SelectItem>
                          <SelectItem value="VEST">Vest</SelectItem>
                          <SelectItem value="EXERCISE">Exercise</SelectItem>
                          <SelectItem value="EXPIRE">Expire</SelectItem>
                          <SelectItem value="FORFEIT">Forfeit</SelectItem>
                          <SelectItem value="CANCEL">Cancel</SelectItem>

                          {/* Financial Transactions */}
                          <SelectItem value="DIVIDEND">Dividend</SelectItem>
                          <SelectItem value="INTEREST">Interest</SelectItem>
                          <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>
          
          {/* Entity References */}
          <Card className="w-full shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Entity References</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {/* Stakeholder */}
                <div className="space-y-2">
                  <form.Field
                    name="stakeholderId"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value || value === 0) return 'Stakeholder is required';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Stakeholder</Label>
                        <Select
                          value={field.state.value?.toString() || ''}
                          onValueChange={(value) => field.handleChange(parseInt(value))}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select a stakeholder" />
                          </SelectTrigger>
                          <SelectContent>
                            {stakeholders.map((stakeholder) => (
                              <SelectItem key={stakeholder.id} value={stakeholder.id.toString()}>
                                {stakeholder.stakeholderName} ({stakeholder.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Security */}
                <div className="space-y-2">
                  <form.Field
                    name="securityId"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value || value === 0) return 'Security is required';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Security</Label>
                        <Select
                          value={field.state.value?.toString() || ''}
                          onValueChange={(value) => field.handleChange(parseInt(value))}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select a security" />
                          </SelectTrigger>
                          <SelectContent>
                            {securities.map((security) => (
                              <SelectItem key={security.id} value={security.id.toString()}>
                                {security.securityName} - {security.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Fund */}
                <div className="space-y-2">
                  <form.Field
                    name="fundId"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value || value === 0) return 'Fund is required';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Fund</Label>
                        <Select
                          value={field.state.value?.toString() || ''}
                          onValueChange={(value) => field.handleChange(parseInt(value))}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select a fund" />
                          </SelectTrigger>
                          <SelectContent>
                            {funds.map((fund) => (
                              <SelectItem key={fund.id} value={fund.id.toString()}>
                                {fund.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Round */}
                <div className="space-y-2">
                  <form.Field
                    name="roundId"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value || value === 0) return 'Round is required';
                        return undefined;
                      }
                    }}
                  >
                    {(field) => (
                      <div>
                        <Label htmlFor={field.name}>Round</Label>
                        <Select
                          value={field.state.value?.toString() || ''}
                          onValueChange={(value) => field.handleChange(parseInt(value))}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder="Select a round" />
                          </SelectTrigger>
                          <SelectContent>
                            {rounds.map((round) => (
                              <SelectItem key={round.id} value={round.id.toString()}>
                                {round.roundName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldInfo field={field} />
                      </div>
                    )}
                  </form.Field>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Transaction Amounts */}
          <Card className="w-full shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Transaction Amounts</CardTitle>
              <CardDescription>Enter debit and credit amounts for both cash and units (double-entry accounting)</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                {/* Cash Amounts */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Cash Amounts</h4>
                  
                  {/* Amount Debit */}
                  <div className="space-y-2">
                    <form.Field
                      name="amountDebit"
                      validators={{
                        onChange: ({ value }) => {
                          const numValue = Number(value);
                          if (isNaN(numValue)) return 'Amount must be a number';
                          if (numValue < 0) return 'Amount cannot be negative';
                          return undefined;
                        }
                      }}
                    >
                      {(field) => (
                        <div>
                          <Label htmlFor={field.name}>Amount Debit</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="number"
                            step="0.01"
                            value={field.state.value || ''}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0.00"
                          />
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>
                  </div>
                  
                  {/* Amount Credit */}
                  <div className="space-y-2">
                    <form.Field
                      name="amountCredit"
                      validators={{
                        onChange: ({ value }) => {
                          const numValue = Number(value);
                          if (isNaN(numValue)) return 'Amount must be a number';
                          if (numValue < 0) return 'Amount cannot be negative';
                          return undefined;
                        }
                      }}
                    >
                      {(field) => (
                        <div>
                          <Label htmlFor={field.name}>Amount Credit</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="number"
                            step="0.01"
                            value={field.state.value || ''}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0.00"
                          />
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>
                
                {/* Units Amounts */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Units/Shares</h4>
                  
                  {/* Units Debit */}
                  <div className="space-y-2">
                    <form.Field
                      name="unitsDebit"
                      validators={{
                        onChange: ({ value }) => {
                          const numValue = Number(value);
                          if (isNaN(numValue)) return 'Units must be a number';
                          if (numValue < 0) return 'Units cannot be negative';
                          return undefined;
                        }
                      }}
                    >
                      {(field) => (
                        <div>
                          <Label htmlFor={field.name}>Units Debit</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="number"
                            step="0.0001"
                            value={field.state.value || ''}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>
                  </div>
                  
                  {/* Units Credit */}
                  <div className="space-y-2">
                    <form.Field
                      name="unitsCredit"
                      validators={{
                        onChange: ({ value }) => {
                          const numValue = Number(value);
                          if (isNaN(numValue)) return 'Units must be a number';
                          if (numValue < 0) return 'Units cannot be negative';
                          return undefined;
                        }
                      }}
                    >
                      {(field) => (
                        <div>
                          <Label htmlFor={field.name}>Units Credit</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="number"
                            step="0.0001"
                            value={field.state.value || ''}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="0"
                          />
                          <FieldInfo field={field} />
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Additional Details */}
          <Card className="w-full shadow-none border-muted bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Related Transaction */}
              <div className="space-y-2">
                <form.Field name="relatedTransactionId">
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Related Transaction (Optional)</Label>
                      <Select
                        value={field.state.value?.toString() || 'none'}
                        onValueChange={(value) => field.handleChange(value === 'none' ? null : Number(value))}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select related transaction (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {transactions.map((transaction) => (
                            <SelectItem key={transaction.id} value={transaction.id.toString()}>
                              {transaction.transactionReference} - {transaction.transactionType} - {new Date(transaction.transactionDate).toLocaleDateString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <form.Field
                  name="notes"
                  validators={{
                    onChange: ({ value }) => {
                      if (value && value.length > 1000) return 'Notes too long (max 1000 characters)';
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <div>
                      <Label htmlFor={field.name}>Notes (Optional)</Label>
                      <Textarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value || ''}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Optional transaction notes"
                        rows={3}
                      />
                      <FieldInfo field={field} />
                    </div>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>

        </CardContent>
        
        {/* Submit Button */}
        <CardFooter className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditMode ? 'Update Transaction' : 'Create Transaction'}
                  </>
                )}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </form>
    </Card>
  );
}
