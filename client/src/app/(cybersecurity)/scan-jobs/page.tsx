'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Play, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, XCircle, RotateCcw } from 'lucide-react';

import { useScanJobs } from '@/modules/cybersecurity/hooks/execution/use-scan-jobs';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { getJobStatusLabel, JOB_STATUS_COLORS } from '@/modules/cybersecurity/schemas/execution/scan-jobs.schemas';
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
import type { JobStatus } from '@/modules/cybersecurity/schemas/execution/scan-jobs.schemas';

// ==========================================
// Types
// ==========================================

type SortField = 'status' | 'created_at' | 'security_score';
type SortDirection = 'asc' | 'desc' | null;

export default function ScanJobsPage() {
  const { activeOrganization } = useOrganizations();
  const { scanJobs, isLoading, error, fetchScanJobs, cancelScan } = useScanJobs();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch scan jobs when organization changes
  useEffect(() => {
    if (activeOrganization) {
      fetchScanJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization]);

  // ==========================================
  // Filter and sort scan jobs
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...scanJobs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        getJobStatusLabel(item.status).toLowerCase().includes(term) ||
        (item.scan_types_run && item.scan_types_run.toLowerCase().includes(term))
      );
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'status': comparison = a.status.localeCompare(b.status); break;
          case 'created_at': comparison = a.created_at.localeCompare(b.created_at); break;
          case 'security_score': comparison = (a.security_score || 0) - (b.security_score || 0); break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [scanJobs, searchTerm, sortField, sortDirection]);

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

  const totalCount = scanJobs.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scan Jobs</h1>
          <p className="text-muted-foreground">Monitor scan executions and results</p>
        </div>
        <Button onClick={() => fetchScanJobs()} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by status or scan types..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Play className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{totalCount === 0 ? 'No scan jobs yet' : 'No jobs match filters'}</h3>
              <p className="text-sm text-muted-foreground mb-4">{totalCount === 0 ? 'Start a scan from a scan target to create your first job' : 'Try adjusting your search criteria'}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('status')}>Status <SortIndicator field="status" /></Button></TableHead>
                  <TableHead>Scan Types</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('security_score')}>Score <SortIndicator field="security_score" /></Button></TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('created_at')}>Created <SortIndicator field="created_at" /></Button></TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((job) => (
                  <TableRow key={job.id} className="cursor-pointer" onClick={() => window.location.href = `/scan-jobs/${job.id}/details`}>
                    <TableCell className="font-mono text-sm">#{job.id}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${JOB_STATUS_COLORS[job.status as JobStatus] || 'bg-gray-100 text-gray-800'}`}>
                        {getJobStatusLabel(job.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{job.scan_types_run || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 text-xs">
                        {job.critical_count > 0 && <span className="bg-red-600 text-white px-1.5 py-0.5 rounded">{job.critical_count}C</span>}
                        {job.high_count > 0 && <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded">{job.high_count}H</span>}
                        {job.medium_count > 0 && <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded">{job.medium_count}M</span>}
                        {job.low_count > 0 && <span className="bg-blue-400 text-white px-1.5 py-0.5 rounded">{job.low_count}L</span>}
                        {job.total_findings === 0 && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.security_score !== null && job.security_score !== undefined ? (
                        <span className={`font-semibold ${job.security_score >= 80 ? 'text-green-600' : job.security_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {job.security_score}/100
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{job.duration_seconds ? `${job.duration_seconds}s` : '—'}</TableCell>
                    <TableCell>{new Date(job.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.location.href = `/scan-jobs/${job.id}/details`; }}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          {(job.status === 'pending' || job.status === 'running') && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); cancelScan(job.id); }}><XCircle className="mr-2 h-4 w-4" /> Cancel</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground">Showing {filteredRows.length} of {totalCount} scan jobs</p>
          </>
        )}
      </div>
    </div>
  );
}
