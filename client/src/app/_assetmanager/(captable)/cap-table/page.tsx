'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEntities } from '@/modules/assetmanager/hooks/entity/use-entities';
import { useFundingRounds } from '@/modules/assetmanager/hooks/captable/use-funding-rounds';
import { useStakeholders } from '@/modules/assetmanager/hooks/entity/use-stakeholders';
import { useSecurities } from '@/modules/assetmanager/hooks/captable/use-securities';
import { useSecurityTransactions } from '@/modules/assetmanager/hooks/captable/use-security-transactions';
import type { SecurityTransaction } from '@/modules/assetmanager/schemas/captable/security-transaction.schemas';
import type { Security } from '@/modules/assetmanager/schemas/captable/security.schemas';
import { type Stakeholder, getStakeholderTypeLabel, STAKEHOLDER_TYPE_LABELS } from '@/modules/assetmanager/schemas/entity/stakeholder.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Loader2, PieChart, Users, TrendingUp, DollarSign, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * A single row in the computed cap table
 * Represents one stakeholder's ownership across all security types
 */
interface CapTableRow {
  stakeholder_id: number;
  stakeholder_name: string;
  stakeholder_type: string;
  common: number;
  preferred: number;
  options: number;
  warrants: number;
  convertibles: number; // convertible + safe combined
  bonds: number;
  total_shares: number;
  ownership_percentage: number;
  total_investment: number;
}

/**
 * Sort field options for the table
 */
type SortField = 'stakeholder_name' | 'total_shares' | 'ownership_percentage' | 'total_investment';
type SortDirection = 'asc' | 'desc' | null;

// ==========================================
// Security type options for filter
// ==========================================

const SECURITY_TYPE_OPTIONS: Record<string, string> = {
  common: 'Common',
  preferred: 'Preferred',
  option: 'Options',
  warrant: 'Warrants',
  convertible: 'Convertible',
  safe: 'SAFE',
  bond: 'Bond',
};

export default function CapTablePage() {
  const { activeEntity, getEntityName } = useEntities();
  const { fundingRounds, fetchFundingRounds, getFundingRoundsByEntity } = useFundingRounds();
  const { stakeholders, fetchStakeholders } = useStakeholders();
  const { securities, fetchSecurities } = useSecurities();
  const { transactions, isLoading, error, fetchSecurityTransactions } = useSecurityTransactions();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [stakeholderTypeFilter, setStakeholderTypeFilter] = useState<string>('all');
  const [securityTypeFilter, setSecurityTypeFilter] = useState<string>('all');
  const [fundingRoundFilter, setFundingRoundFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch data when active entity changes
  useEffect(() => {
    if (activeEntity) {
      fetchFundingRounds({ entity_id: activeEntity.id });
      fetchStakeholders({ entity_id: activeEntity.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity]);

  // Fetch securities and transactions when funding rounds are loaded
  useEffect(() => {
    if (activeEntity) {
      const entityRounds = getFundingRoundsByEntity(activeEntity.id);
      if (entityRounds.length > 0) {
        fetchSecurities();
        fetchSecurityTransactions();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntity, fundingRounds]);

  // Get entity-scoped data
  const entityRounds = activeEntity ? getFundingRoundsByEntity(activeEntity.id) : [];
  const entityStakeholders = stakeholders.filter(s => s.entity_id === activeEntity?.id);
  const entityTransactions = transactions.filter(t => t.entity_id === activeEntity?.id);

  // Build a lookup map: security_id → security object
  const securityMap = useMemo(() => {
    const map = new Map<number, Security>();
    securities.forEach(s => map.set(s.id, s));
    return map;
  }, [securities]);

  // Build a lookup map: stakeholder_id → stakeholder object
  const stakeholderMap = useMemo(() => {
    const map = new Map<number, Stakeholder>();
    entityStakeholders.forEach(s => map.set(s.id, s));
    return map;
  }, [entityStakeholders]);

  // ==========================================
  // Compute cap table from transactions
  // ==========================================

  const capTableRows = useMemo(() => {
    // Filter transactions by funding round if selected
    let filteredTransactions = entityTransactions;
    if (fundingRoundFilter !== 'all') {
      const roundId = parseInt(fundingRoundFilter);
      filteredTransactions = filteredTransactions.filter(t => t.funding_round_id === roundId);
    }

    // Group transactions by stakeholder_id
    const stakeholderGroups = new Map<number, SecurityTransaction[]>();
    filteredTransactions.forEach(t => {
      const group = stakeholderGroups.get(t.stakeholder_id) || [];
      group.push(t);
      stakeholderGroups.set(t.stakeholder_id, group);
    });

    // Build cap table rows
    const rows: CapTableRow[] = [];

    stakeholderGroups.forEach((txns, stakeholderId) => {
      const stakeholder = stakeholderMap.get(stakeholderId);
      if (!stakeholder) return;

      // Accumulate per security type
      let common = 0;
      let preferred = 0;
      let options = 0;
      let warrants = 0;
      let convertibles = 0;
      let bonds = 0;
      let totalInvestment = 0;

      txns.forEach(t => {
        const netUnits = t.units_credit - t.units_debit;
        const netInvestment = t.amount_debit - t.amount_credit; // debit = money out (invested)

        // Look up security type
        let secType = 'common'; // default for fund-level transactions
        if (t.security_id !== null) {
          const security = securityMap.get(t.security_id);
          if (security) {
            secType = security.security_type;
          }
        }

        // Accumulate units by security type
        switch (secType) {
          case 'common':
            common += netUnits;
            break;
          case 'preferred':
            preferred += netUnits;
            break;
          case 'option':
            options += netUnits;
            break;
          case 'warrant':
            warrants += netUnits;
            break;
          case 'convertible':
          case 'safe':
            convertibles += netUnits;
            break;
          case 'bond':
            bonds += netUnits;
            break;
        }

        totalInvestment += netInvestment;
      });

      const totalShares = common + preferred + options + warrants + convertibles + bonds;

      // Only include stakeholders with positive net ownership
      if (totalShares <= 0) return;

      rows.push({
        stakeholder_id: stakeholderId,
        stakeholder_name: getEntityName(stakeholder.source_entity_id),
        stakeholder_type: stakeholder.type,
        common,
        preferred,
        options,
        warrants,
        convertibles,
        bonds,
        total_shares: totalShares,
        ownership_percentage: 0, // calculated below
        total_investment: totalInvestment,
      });
    });

    // Calculate ownership percentages
    const grandTotalShares = rows.reduce((sum, r) => sum + r.total_shares, 0);
    if (grandTotalShares > 0) {
      rows.forEach(r => {
        r.ownership_percentage = (r.total_shares / grandTotalShares) * 100;
      });
    }

    return rows;
  }, [entityTransactions, fundingRoundFilter, stakeholderMap, securityMap]);

  // ==========================================
  // Apply client-side filters
  // ==========================================

  const filteredRows = useMemo(() => {
    let rows = capTableRows;

    // Search by stakeholder name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      rows = rows.filter(r => r.stakeholder_name.toLowerCase().includes(term));
    }

    // Filter by stakeholder type
    if (stakeholderTypeFilter !== 'all') {
      rows = rows.filter(r => r.stakeholder_type === stakeholderTypeFilter);
    }

    // Filter by security type (show only stakeholders who hold that security type)
    if (securityTypeFilter !== 'all') {
      rows = rows.filter(r => {
        switch (securityTypeFilter) {
          case 'common': return r.common > 0;
          case 'preferred': return r.preferred > 0;
          case 'option': return r.options > 0;
          case 'warrant': return r.warrants > 0;
          case 'convertible':
          case 'safe': return r.convertibles > 0;
          case 'bond': return r.bonds > 0;
          default: return true;
        }
      });
    }

    // Apply sorting
    if (sortField && sortDirection) {
      rows = [...rows].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'stakeholder_name':
            comparison = a.stakeholder_name.localeCompare(b.stakeholder_name);
            break;
          case 'total_shares':
            comparison = a.total_shares - b.total_shares;
            break;
          case 'ownership_percentage':
            comparison = a.ownership_percentage - b.ownership_percentage;
            break;
          case 'total_investment':
            comparison = a.total_investment - b.total_investment;
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return rows;
  }, [capTableRows, searchTerm, stakeholderTypeFilter, securityTypeFilter, sortField, sortDirection]);

  // ==========================================
  // Summary stats
  // ==========================================

  const summary = useMemo(() => {
    const totalStakeholders = capTableRows.length;
    const totalShares = capTableRows.reduce((sum, r) => sum + r.total_shares, 0);
    const totalInvestment = capTableRows.reduce((sum, r) => sum + r.total_investment, 0);

    // Count distinct security types held
    const securityTypesHeld = new Set<string>();
    capTableRows.forEach(r => {
      if (r.common > 0) securityTypesHeld.add('common');
      if (r.preferred > 0) securityTypesHeld.add('preferred');
      if (r.options > 0) securityTypesHeld.add('option');
      if (r.warrants > 0) securityTypesHeld.add('warrant');
      if (r.convertibles > 0) securityTypesHeld.add('convertible');
      if (r.bonds > 0) securityTypesHeld.add('bond');
    });

    return { totalStakeholders, totalShares, totalInvestment, securityTypes: securityTypesHeld.size };
  }, [capTableRows]);

  // ==========================================
  // Sort handler
  // ==========================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle: asc → desc → none
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="inline h-4 w-4 ml-1" />
    );
  };

  // ==========================================
  // Render
  // ==========================================

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

  if (!activeEntity) {
    return (
      <Alert>
        <AlertDescription>
          Please select an entity first.{' '}
          <Link href="/entities" className="underline">
            Go to Entities
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cap Table</h1>
        <p className="text-muted-foreground">
          Ownership structure for {activeEntity.name}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stakeholders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStakeholders}</div>
            <p className="text-xs text-muted-foreground">with ownership</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalShares.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">across all types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalInvestment.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">capital invested</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Types</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.securityTypes}</div>
            <p className="text-xs text-muted-foreground">distinct types held</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ownership Table</CardTitle>
          <CardDescription>
            Computed from security transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by stakeholder name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stakeholder-type">Stakeholder Type</Label>
              <Select value={stakeholderTypeFilter} onValueChange={setStakeholderTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(STAKEHOLDER_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="security-type">Security Type</Label>
              <Select value={securityTypeFilter} onValueChange={setSecurityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Securities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Securities</SelectItem>
                  {Object.entries(SECURITY_TYPE_OPTIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="funding-round">Funding Round</Label>
              <Select value={fundingRoundFilter} onValueChange={setFundingRoundFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Rounds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rounds</SelectItem>
                  {entityRounds.map((round) => (
                    <SelectItem key={round.id} value={round.id.toString()}>
                      {round.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cap table data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {capTableRows.length === 0
                  ? 'Create security transactions to populate the cap table'
                  : 'No stakeholders match the current filters'}
              </p>
              {capTableRows.length === 0 && (
                <Link href="/security-transactions/new">
                  <Button>Create Transaction</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('stakeholder_name')}
                      >
                        Stakeholder
                        <SortIndicator field="stakeholder_name" />
                      </Button>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Common</TableHead>
                    <TableHead className="text-right">Preferred</TableHead>
                    <TableHead className="text-right">Options</TableHead>
                    <TableHead className="text-right">Warrants</TableHead>
                    <TableHead className="text-right">Convertibles</TableHead>
                    <TableHead className="text-right">Bonds</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('total_shares')}
                      >
                        Total Shares
                        <SortIndicator field="total_shares" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('ownership_percentage')}
                      >
                        Ownership %
                        <SortIndicator field="ownership_percentage" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('total_investment')}
                      >
                        Investment
                        <SortIndicator field="total_investment" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={row.stakeholder_id}>
                      <TableCell className="font-medium">{row.stakeholder_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getStakeholderTypeLabel(row.stakeholder_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.common > 0 ? row.common.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.preferred > 0 ? row.preferred.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.options > 0 ? row.options.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.warrants > 0 ? row.warrants.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.convertibles > 0 ? row.convertibles.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.bonds > 0 ? row.bonds.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.total_shares.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.ownership_percentage.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.total_investment.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredRows.length} of {capTableRows.length} stakeholders
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
