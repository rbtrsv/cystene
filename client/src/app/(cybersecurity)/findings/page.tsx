'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye } from 'lucide-react';

import { useFindings } from '@/modules/cybersecurity/hooks/discovery/use-findings';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { ExportButton } from '@/modules/cybersecurity/components/shared/export-button';
import { FINDING_ENDPOINTS } from '@/modules/cybersecurity/utils/api.endpoints';
import { getSeverityLabel, getFindingStatusLabel, SEVERITY_COLORS } from '@/modules/cybersecurity/schemas/discovery/findings.schemas';
import type { Severity, FindingStatus } from '@/modules/cybersecurity/schemas/discovery/findings.schemas';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/modules/shadcnui/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/modules/shadcnui/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/modules/shadcnui/components/ui/select';

// ==========================================
// Types
// ==========================================

type SortField = 'severity' | 'title' | 'status' | 'discovered_at';
type SortDirection = 'asc' | 'desc' | null;

// Severity sort order (critical first)
const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export default function FindingsPage() {
  const { activeOrganization } = useOrganizations();
  const { findings, isLoading, error, fetchFindings, updateFindingStatus } = useFindings();

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField | null>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch findings when organization changes
  useEffect(() => {
    if (activeOrganization) {
      fetchFindings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization]);

  // ==========================================
  // Filter and sort findings
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...findings];

    // Search across fields
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(term) ||
        (item.host && item.host.toLowerCase().includes(term)) ||
        item.category.toLowerCase().includes(term)
      );
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter((item) => item.severity === severityFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'severity': comparison = (SEVERITY_ORDER[a.severity] || 4) - (SEVERITY_ORDER[b.severity] || 4); break;
          case 'title': comparison = a.title.localeCompare(b.title); break;
          case 'status': comparison = a.status.localeCompare(b.status); break;
          case 'discovered_at': comparison = a.discovered_at.localeCompare(b.discovered_at); break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [findings, searchTerm, severityFilter, statusFilter, sortField, sortDirection]);

  // ==========================================
  // Sort handler
  // ==========================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null); }
    } else { setSortField(field); setSortDirection('asc'); }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />;
  };

  // ==========================================
  // Render
  // ==========================================

  if (isLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!activeOrganization) return <Alert><AlertDescription>Please select an organization first. <Link href="/organizations" className="underline">Go to Organizations</Link></AlertDescription></Alert>;

  const totalCount = findings.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Findings</h1>
          <p className="text-muted-foreground">Security vulnerabilities and misconfigurations</p>
        </div>
        {/* Export button — appends current filters to export URL */}
        <ExportButton
          exportUrl={`${FINDING_ENDPOINTS.EXPORT}${severityFilter !== 'all' || statusFilter !== 'all' ? '?' : ''}${severityFilter !== 'all' ? `severity=${severityFilter}` : ''}${severityFilter !== 'all' && statusFilter !== 'all' ? '&' : ''}${statusFilter !== 'all' ? `status=${statusFilter}` : ''}`}
          fileName="findings"
          disabled={isLoading || findings.length === 0}
        />
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by title, host, or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger><SelectValue placeholder="All severities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table or empty state */}
        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{totalCount === 0 ? 'No findings yet' : 'No findings match filters'}</h3>
              <p className="text-sm text-muted-foreground mb-4">{totalCount === 0 ? 'Run a scan to discover security findings' : 'Try adjusting your filter criteria'}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('severity')}>Severity <SortIndicator field="severity" /></Button></TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('title')}>Title <SortIndicator field="title" /></Button></TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('status')}>Status <SortIndicator field="status" /></Button></TableHead>
                  <TableHead>New</TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('discovered_at')}>Discovered <SortIndicator field="discovered_at" /></Button></TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((finding) => (
                  <TableRow key={finding.id} className="cursor-pointer" onClick={() => window.location.href = `/findings/${finding.id}/details`}>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_COLORS[finding.severity as Severity] || 'bg-gray-400 text-white'}`}>
                        {getSeverityLabel(finding.severity)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate">{finding.title}</TableCell>
                    <TableCell className="font-mono text-sm">{finding.host || '—'}{finding.port ? `:${finding.port}` : ''}</TableCell>
                    <TableCell>
                      <Select
                        value={finding.status}
                        onValueChange={(value) => { updateFindingStatus(finding.id, value as FindingStatus); }}
                      >
                        <SelectTrigger className="w-[140px] h-8" onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="acknowledged">Acknowledged</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="false_positive">False Positive</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{finding.is_new ? <span className="text-blue-600 text-xs font-medium">NEW</span> : ''}</TableCell>
                    <TableCell>{new Date(finding.discovered_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.location.href = `/findings/${finding.id}/details`; }}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground">Showing {filteredRows.length} of {totalCount} findings</p>
          </>
        )}
      </div>
    </div>
  );
}
