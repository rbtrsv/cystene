'use client';

/**
 * Reporting View
 *
 * Main orchestrator for the reporting page.
 * Entity selector + conditional rendering of performance cards and charts.
 *
 * Data sources:
 * - Performance computed: GET /assetmanager/performance/* (entity, holdings, stakeholders)
 * - Valuations: existing CRUD store (for NAV chart)
 * - Holdings: existing CRUD store (for NAV composition chart)
 *
 * Adapted from v7capital's reporting-view.tsx
 */

import React, { useEffect, useState } from 'react';
import { useEntities } from '../../hooks/entity/use-entities';
import { usePerformanceComputed } from '../../hooks/holding/use-performance-computed';
import { useValuations } from '../../hooks/holding/use-valuations';
import { useHoldings } from '../../hooks/holding/use-holdings';
import { useSecurityTransactions } from '../../hooks/captable/use-security-transactions';
import { useStakeholders } from '../../hooks/entity/use-stakeholders';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/modules/shadcnui/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shadcnui/components/ui/select';
import EntityPerformanceCard from './entity-performance-card';
import StakeholderReturnsCard from './stakeholder-returns-card';
import NavChart from './nav-chart';
import NavCompositionChart from './nav-composition-chart';
import StakeholderTransactionsCard from './stakeholder-transactions-card';

// ==========================================
// Component
// ==========================================

export default function ReportingView() {
  // ===== STATE AND HOOKS =====
  const { entities, isLoading: entitiesLoading, fetchEntities } = useEntities();
  const {
    entityPerformance,
    stakeholderReturns,
    isLoading: perfLoading,
    error: perfError,
    fetchAll,
  } = usePerformanceComputed();
  const {
    valuations,
    isLoading: valuationsLoading,
    fetchValuations,
  } = useValuations();
  const {
    holdings,
    isLoading: holdingsLoading,
    fetchHoldings,
  } = useHoldings();
  const {
    transactions,
    isLoading: txLoading,
    fetchSecurityTransactions,
  } = useSecurityTransactions();
  const {
    stakeholders,
    isLoading: stakeholdersLoading,
    fetchStakeholders,
  } = useStakeholders();

  const [selectedEntity, setSelectedEntity] = useState<number | null>(null);

  // ===== DERIVED STATE =====
  // Filter valuations for selected entity
  const entityValuations = React.useMemo(() => {
    if (!selectedEntity) return valuations;
    return valuations.filter((v) => v.entity_id === selectedEntity);
  }, [valuations, selectedEntity]);

  // Filter holdings for selected entity
  const entityHoldings = React.useMemo(() => {
    if (!selectedEntity) return holdings;
    return holdings.filter((h) => h.entity_id === selectedEntity);
  }, [holdings, selectedEntity]);

  // Filter transactions for selected entity
  const entityTransactions = React.useMemo(() => {
    if (!selectedEntity) return transactions;
    return transactions.filter((t) => t.entity_id === selectedEntity);
  }, [transactions, selectedEntity]);

  // Filter stakeholders for selected entity
  const entityStakeholders = React.useMemo(() => {
    if (!selectedEntity) return stakeholders;
    return stakeholders.filter((s) => s.entity_id === selectedEntity);
  }, [stakeholders, selectedEntity]);

  const isLoading = perfLoading || valuationsLoading || holdingsLoading;

  // ===== EFFECTS =====
  // Fetch entities on mount
  useEffect(() => {
    fetchEntities({});
  }, [fetchEntities]);

  // Auto-select first entity when entities load
  useEffect(() => {
    if (entities.length > 0 && !selectedEntity) {
      setSelectedEntity(entities[0].id);
    }
  }, [entities, selectedEntity]);

  // Fetch data when entity changes
  useEffect(() => {
    if (selectedEntity) {
      fetchAll(selectedEntity);
      fetchValuations({});
      fetchHoldings({});
      fetchSecurityTransactions({});
      fetchStakeholders({});
    }
  }, [selectedEntity, fetchAll, fetchValuations, fetchHoldings, fetchSecurityTransactions, fetchStakeholders]);

  // ===== EVENT HANDLERS =====
  const handleEntityChange = (entityId: string) => {
    setSelectedEntity(Number(entityId));
  };

  // ===== CONDITIONAL RENDERING STATES =====
  if (entitiesLoading && entities.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reporting</CardTitle>
            <CardDescription>Loading reporting data...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (perfError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reporting</CardTitle>
            <CardDescription>Error loading reporting data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-destructive/10 p-4 rounded-md text-destructive">{perfError}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reporting</CardTitle>
            <CardDescription>No entities available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg">No entities available</p>
              <p className="text-sm">Create an entity to view reporting data.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== MAIN COMPONENT RENDER =====
  return (
    <div className="space-y-6">
      {/* ===== PAGE HEADER WITH ENTITY SELECTOR ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reporting</h1>
          <p className="text-muted-foreground">
            Performance metrics and portfolio analysis
          </p>
        </div>
        <Select value={selectedEntity?.toString()} onValueChange={handleEntityChange}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Select Entity" />
          </SelectTrigger>
          <SelectContent>
            {entities.map((entity) => (
              <SelectItem key={entity.id} value={entity.id.toString()}>
                {entity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ===== ENTITY PERFORMANCE SECTION (ALL USERS) ===== */}
      <EntityPerformanceCard
        performance={entityPerformance}
        isLoading={perfLoading}
      />

      {/* ===== STAKEHOLDER TRANSACTIONS SECTION ===== */}
      <StakeholderTransactionsCard
        transactions={entityTransactions}
        stakeholders={entityStakeholders}
        isLoading={txLoading || stakeholdersLoading}
      />

      {/* ===== STAKEHOLDER RETURNS SECTION ===== */}
      <StakeholderReturnsCard
        stakeholderReturns={stakeholderReturns}
        isLoading={perfLoading}
      />

      {/* ===== NAV CHART SECTION ===== */}
      <NavChart
        valuations={entityValuations}
        isLoading={valuationsLoading}
      />

      {/* ===== NAV COMPOSITION CHART SECTION ===== */}
      <NavCompositionChart
        holdings={entityHoldings}
        isLoading={holdingsLoading}
      />
    </div>
  );
}
