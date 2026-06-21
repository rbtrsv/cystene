'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { getAuditTrailEntries, exportAuditTrail, AuditLogEntry } from '@/modules/cybersecurity/service/shared/audit-trail.service';
import { API_BASE_URL } from '@/modules/accounts/utils/api.endpoints';
import { fetchClient } from '@/modules/accounts/utils/fetch.client';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { History, Loader2, ChevronDown, ChevronRight, Download } from 'lucide-react';

// ==========================================
// Constants — table_name dropdown options (all cybersecurity audited tables)
// Mirrors the table_name strings written by log_audit() across the subrouters.
// ==========================================

const TABLE_NAME_LABELS: Record<string, string> = {
  // Infrastructure
  infrastructure: 'Infrastructure',
  credentials: 'Credentials',
  scan_targets: 'Scan Targets',
  // Execution
  scan_templates: 'Scan Templates',
  scan_schedules: 'Scan Schedules',
  // Discovery
  reports: 'Reports',
  // Administration
  cybersecurity_feedback: 'Feedback',
};

const ACTION_OPTIONS = ['INSERT', 'UPDATE', 'DELETE'];

// ==========================================
// Helpers
// ==========================================

function getActionBadgeVariant(action: string) {
  switch (action) {
    case 'INSERT': return 'default';
    case 'UPDATE': return 'secondary';
    case 'DELETE': return 'destructive';
    default: return 'outline';
  }
}

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

// Fields to skip in diff view (internal/audit fields)
const SKIP_FIELDS = new Set(['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at', 'deleted_by', 'organization_id']);

function getDiffFields(oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null): { key: string; old: unknown; new: unknown }[] {
  if (!oldData && !newData) return [];
  const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
  const changes: { key: string; old: unknown; new: unknown }[] = [];
  for (const key of allKeys) {
    if (SKIP_FIELDS.has(key)) continue;
    const oldVal = oldData?.[key] ?? null;
    const newVal = newData?.[key] ?? null;
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ key, old: oldVal, new: newVal });
    }
  }
  return changes;
}

// ==========================================
// Page Component
// ==========================================

interface Organization {
  id: number;
  name: string;
}

export default function AuditTrailPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  // Organizations for filter dropdown
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // Filters
  const [organizationId, setOrganizationId] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);

  // Fetch user's organizations on mount
  useEffect(() => {
    fetchClient<{ success: boolean; data: Organization[] }>(`${API_BASE_URL}/accounts/organizations/`)
      .then((res) => {
        if (res.success && res.data) {
          setOrganizations(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const params = useMemo(() => ({
    ...(organizationId && { organization_id: parseInt(organizationId) }),
    ...(tableName && { table_name: tableName }),
    ...(action && { action }),
    ...(startDate && { start_date: new Date(startDate).toISOString() }),
    ...(endDate && { end_date: new Date(endDate).toISOString() }),
    limit,
    offset,
  }), [organizationId, tableName, action, startDate, endDate, limit, offset]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getAuditTrailEntries(params).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setEntries(res.data || []);
        setTotalCount(res.count || 0);
      } else {
        setError('Failed to load audit trail');
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [params]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAuditTrail(params);
    } catch {
      setError('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleResetFilters = () => {
    setOrganizationId('');
    setTableName('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setOffset(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground mt-1">
            Track all data changes across your organization.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exporting || entries.length === 0}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Organization filter — only shown if user has multiple orgs */}
        {organizations.length > 1 && (
          <div className="space-y-1">
            <Label>Organization</Label>
            <Select value={organizationId} onValueChange={(v) => { setOrganizationId(v === 'all' ? '' : v); setOffset(0); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1">
          <Label>Table</Label>
          <Select value={tableName} onValueChange={(v) => { setTableName(v === 'all' ? '' : v); setOffset(0); }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              {Object.entries(TABLE_NAME_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Action</Label>
          <Select value={action} onValueChange={(v) => { setAction(v === 'all' ? '' : v); setOffset(0); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {ACTION_OPTIONS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>From</Label>
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setOffset(0); }} className="w-[160px]" />
        </div>

        <div className="space-y-1">
          <Label>To</Label>
          <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setOffset(0); }} className="w-[160px]" />
        </div>

        <Button variant="ghost" onClick={handleResetFilters} size="sm">Reset</Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <History className="h-12 w-12 mb-4" />
          <p>No audit log entries found.</p>
          <p className="text-sm">Changes made by your organization will appear here.</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]" />
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Record</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  const diffFields = getDiffFields(entry.old_data, entry.new_data);

                  return (
                    <Fragment key={entry.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      >
                        <TableCell>
                          {diffFields.length > 0 ? (
                            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm">{formatTimestamp(entry.timestamp)}</TableCell>
                        <TableCell className="text-sm">{entry.user_email || 'System'}</TableCell>
                        <TableCell className="text-sm font-mono">{TABLE_NAME_LABELS[entry.table_name || ''] || entry.table_name}</TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(entry.action) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">#{entry.record_id}</TableCell>
                      </TableRow>

                      {/* Expanded diff view */}
                      {isExpanded && diffFields.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Changes ({diffFields.length} fields):</p>
                              <div className="grid gap-1">
                                {diffFields.map(({ key, old: oldVal, new: newVal }) => (
                                  <div key={key} className="flex items-start gap-2 text-xs font-mono">
                                    <span className="font-semibold min-w-[150px] text-foreground">{key}:</span>
                                    {entry.action === 'INSERT' ? (
                                      <span className="text-green-600 dark:text-green-400">{JSON.stringify(newVal)}</span>
                                    ) : entry.action === 'DELETE' ? (
                                      <span className="text-red-600 dark:text-red-400 line-through">{JSON.stringify(oldVal)}</span>
                                    ) : (
                                      <>
                                        <span className="text-red-600 dark:text-red-400 line-through">{JSON.stringify(oldVal)}</span>
                                        <span className="text-muted-foreground">→</span>
                                        <span className="text-green-600 dark:text-green-400">{JSON.stringify(newVal)}</span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {offset + 1}–{Math.min(offset + limit, totalCount)} of {totalCount}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={offset + limit >= totalCount} onClick={() => setOffset(offset + limit)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
