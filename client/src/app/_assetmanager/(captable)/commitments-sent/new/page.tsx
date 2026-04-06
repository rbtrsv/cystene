'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCommitments } from '@/modules/assetmanager/hooks/captable/use-commitments';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { useStakeholders } from '@/modules/assetmanager/hooks/entity/use-stakeholders';
import { useSecurities } from '@/modules/assetmanager/hooks/captable/use-securities';
import { CreateCommitmentSchema } from '@/modules/assetmanager/schemas/captable/commitment.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Checkbox } from '@/modules/shadcnui/components/ui/checkbox';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateCommitmentsPage() {
  const router = useRouter();
  const { activeEntity, getEntityName } = useEntities();
  const { getFundingRoundsByEntity, fetchFundingRounds } = useFundingRounds();
  const { stakeholders, fetchStakeholders } = useStakeholders();
  const { fetchSecurities, getSecuritiesByFundingRound } = useSecurities();
  const { createCommitment, error: storeError } = useCommitments();

  // Form state
  const [selectedFundingRoundId, setSelectedFundingRoundId] = useState<string>('');
  const [selectedSecurityIds, setSelectedSecurityIds] = useState<number[]>([]);
  const [selectedStakeholderIds, setSelectedStakeholderIds] = useState<number[]>([]);
  const [raiseAmount, setRaiseAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch data when active entity changes
  useEffect(() => {
    if (activeEntity) {
      fetchFundingRounds({ entity_id: activeEntity.id });
      fetchStakeholders({ entity_id: activeEntity.id });
      fetchSecurities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Get funding rounds and stakeholders for the active entity
  const entityRounds = activeEntity ? getFundingRoundsByEntity(activeEntity.id) : [];
  // All stakeholders on this entity's cap table can participate in commitment flow
  // (source_entity_id is always set — every stakeholder IS an entity)
  const entityStakeholders = stakeholders.filter(
    s => s.entity_id === activeEntity?.id
  );

  // Securities for the selected funding round — displayed as read-only info
  const roundSecurities = selectedFundingRoundId
    ? getSecuritiesByFundingRound(parseInt(selectedFundingRoundId))
    : [];

  // Reset security selection when funding round changes
  const handleFundingRoundChange = (value: string) => {
    setSelectedFundingRoundId(value);
    setSelectedSecurityIds([]);
  };

  // Toggle security selection
  const toggleSecurity = (securityId: number) => {
    setSelectedSecurityIds(prev =>
      prev.includes(securityId)
        ? prev.filter(id => id !== securityId)
        : [...prev, securityId]
    );
  };

  // Select all / deselect all securities
  const toggleAllSecurities = () => {
    if (selectedSecurityIds.length === roundSecurities.length) {
      setSelectedSecurityIds([]);
    } else {
      setSelectedSecurityIds(roundSecurities.map(s => s.id));
    }
  };

  // Toggle stakeholder selection
  const toggleStakeholder = (stakeholderId: number) => {
    setSelectedStakeholderIds(prev =>
      prev.includes(stakeholderId)
        ? prev.filter(id => id !== stakeholderId)
        : [...prev, stakeholderId]
    );
  };

  // Select all / deselect all
  const toggleAllStakeholders = () => {
    if (selectedStakeholderIds.length === entityStakeholders.length) {
      setSelectedStakeholderIds([]);
    } else {
      setSelectedStakeholderIds(entityStakeholders.map(s => s.id));
    }
  };

  // Handle form submission — one request per stakeholder per security.
  // raise_amount is passed separately to the service (query param), not in the schema body.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!activeEntity) return;

    const raiseAmountNum = parseFloat(raiseAmount);
    if (!raiseAmountNum || raiseAmountNum <= 0) {
      setValidationError('Raise amount must be greater than 0');
      return;
    }

    if (selectedSecurityIds.length === 0) {
      setValidationError('Select at least one security.');
      return;
    }

    // Validate each stakeholder × security combination with Zod before sending
    const baseData = {
      entity_id: activeEntity.id,
      funding_round_id: parseInt(selectedFundingRoundId),
    };

    for (const stakeholderId of selectedStakeholderIds) {
      for (const securityId of selectedSecurityIds) {
        const validation = CreateCommitmentSchema.safeParse({
          ...baseData,
          security_id: securityId,
          stakeholder_id: stakeholderId,
        });
        if (!validation.success) {
          setValidationError(validation.error.errors[0]?.message || 'Validation failed');
          return;
        }
      }
    }

    setIsSubmitting(true);

    // Iterate selected stakeholders × selected securities — one create request per combination
    let allSucceeded = true;
    for (const stakeholderId of selectedStakeholderIds) {
      for (const securityId of selectedSecurityIds) {
        const success = await createCommitment(
          { ...baseData, security_id: securityId, stakeholder_id: stakeholderId },
          raiseAmountNum
        );
        if (!success) {
          allSucceeded = false;
          break; // Stop on first failure — partial state is visible in the list
        }
      }
      if (!allSucceeded) break;
    }

    setIsSubmitting(false);

    if (allSucceeded) {
      router.push('/commitments-sent');
    }
    // Error is handled by store and displayed via storeError
  };

  if (!activeEntity) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            Please select an entity first.{' '}
            <Link href="/entities" className="underline">
              Go to Entities
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (entityRounds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert>
          <AlertDescription>
            No funding rounds found for this entity. Please create a funding round first.{' '}
            <Link href="/funding-rounds/new" className="underline">
              Create Funding Round
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/commitments-sent">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Commitments Sent
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Invite Stakeholders</h1>
        <p className="text-muted-foreground mt-2">
          Invite stakeholders to participate in a funding round for {activeEntity.name}
        </p>
      </div>

      {(storeError || validationError) && (
        <Alert variant="destructive">
          <AlertDescription>{storeError || validationError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Commitment Details</CardTitle>
            <CardDescription>
              Select a funding round and the stakeholders to invite.
              Pro-rata percentages and amounts will be calculated automatically from cap table data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Funding Round Select */}
              <div className="space-y-2">
                <Label htmlFor="funding_round_id">Funding Round *</Label>
                <Select
                  value={selectedFundingRoundId}
                  onValueChange={handleFundingRoundChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a funding round" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityRounds.map((round) => (
                      <SelectItem key={round.id} value={round.id.toString()}>
                        {round.name} — Target: {Number(round.target_amount).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Securities in selected round (selectable) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Securities *</Label>
                  {roundSecurities.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleAllSecurities}
                      disabled={isSubmitting}
                    >
                      {selectedSecurityIds.length === roundSecurities.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                  )}
                </div>
                {!selectedFundingRoundId ? (
                  <p className="text-sm text-muted-foreground">
                    Select a funding round first to see available securities.
                  </p>
                ) : roundSecurities.length === 0 ? (
                  <p className="text-sm text-destructive">
                    No securities found for this round. Create securities first.
                  </p>
                ) : (
                  <div className="border rounded-md p-4 space-y-3">
                    {roundSecurities.map((sec) => (
                      <div key={sec.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`security-${sec.id}`}
                          checked={selectedSecurityIds.includes(sec.id)}
                          onCheckedChange={() => toggleSecurity(sec.id)}
                          disabled={isSubmitting}
                        />
                        <Label
                          htmlFor={`security-${sec.id}`}
                          className="text-sm font-normal cursor-pointer flex-1 flex justify-between"
                        >
                          <span>{sec.security_name} ({sec.security_type})</span>
                          <span className="text-muted-foreground">
                            {sec.issue_price != null ? `${Number(sec.issue_price).toLocaleString()}/unit` : 'No price'}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedSecurityIds.length} of {roundSecurities.length} securities selected
                  {selectedSecurityIds.length > 0 && selectedStakeholderIds.length > 0 && (
                    <> · {selectedStakeholderIds.length} × {selectedSecurityIds.length} = {selectedStakeholderIds.length * selectedSecurityIds.length} commitments</>
                  )}
                </p>
              </div>

              {/* Raise Amount */}
              <div className="space-y-2">
                <Label htmlFor="raise_amount">Amount to Raise *</Label>
                <Input
                  id="raise_amount"
                  type="number"
                  placeholder="e.g. 5000000"
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(e.target.value)}
                  disabled={isSubmitting}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  Total amount to raise from stakeholders. Pro-rata will be calculated from this amount.
                </p>
              </div>

              {/* Stakeholder Multi-Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Stakeholders *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllStakeholders}
                    disabled={isSubmitting || entityStakeholders.length === 0}
                  >
                    {selectedStakeholderIds.length === entityStakeholders.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>

                {entityStakeholders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No stakeholders found for this entity.{' '}
                    <Link href="/stakeholders/new" className="underline">
                      Create Stakeholder
                    </Link>
                  </p>
                ) : (
                  <div className="border rounded-md p-4 space-y-3 max-h-64 overflow-y-auto">
                    {entityStakeholders.map((stakeholder) => (
                      <div key={stakeholder.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`stakeholder-${stakeholder.id}`}
                          checked={selectedStakeholderIds.includes(stakeholder.id)}
                          onCheckedChange={() => toggleStakeholder(stakeholder.id)}
                          disabled={isSubmitting}
                        />
                        <Label
                          htmlFor={`stakeholder-${stakeholder.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {getEntityName(stakeholder.source_entity_id)}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {selectedStakeholderIds.length} of {entityStakeholders.length} stakeholders selected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !selectedFundingRoundId || !raiseAmount || selectedStakeholderIds.length === 0 || selectedSecurityIds.length === 0}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Invitations...
              </>
            ) : (
              `Invite ${selectedStakeholderIds.length} Stakeholder${selectedStakeholderIds.length !== 1 ? 's' : ''}`
            )}
          </Button>
          <Link href="/commitments-sent" className="flex-1">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
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
