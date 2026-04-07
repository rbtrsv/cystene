'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileBarChart, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Trash2 } from 'lucide-react';

import { useReports } from '@/modules/cybersecurity/hooks/discovery/use-reports';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { getReportTypeLabel, getReportFormatLabel } from '@/modules/cybersecurity/schemas/discovery/reports.schemas';
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

// ==========================================
// Types
// ==========================================

type SortField = 'name' | 'report_type' | 'generated_at';
type SortDirection = 'asc' | 'desc' | null;

export default function ReportsPage() {
  const { activeOrganization } = useOrganizations();
  const { reports, isLoading, error, fetchReports, deleteReport } = useReports();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch reports when organization changes
  useEffect(() => {
    if (activeOrganization) {
      fetchReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization]);

  // ==========================================
  // Filter and sort reports
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...reports];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(term) ||
        getReportTypeLabel(item.report_type).toLowerCase().includes(term)
      );
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name': comparison = a.name.localeCompare(b.name); break;
          case 'report_type': comparison = a.report_type.localeCompare(b.report_type); break;
          case 'generated_at': comparison = a.generated_at.localeCompare(b.generated_at); break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [reports, searchTerm, sortField, sortDirection]);

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

  const totalCount = reports.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generated security assessment reports</p>
        </div>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by name or type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileBarChart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{totalCount === 0 ? 'No reports yet' : 'No reports match filters'}</h3>
              <p className="text-sm text-muted-foreground mb-4">{totalCount === 0 ? 'Generate a report from scan results' : 'Try adjusting your search criteria'}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('name')}>Name <SortIndicator field="name" /></Button></TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('report_type')}>Type <SortIndicator field="report_type" /></Button></TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('generated_at')}>Generated <SortIndicator field="generated_at" /></Button></TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((report) => (
                  <TableRow key={report.id} className="cursor-pointer" onClick={() => window.location.href = `/reports/${report.id}/details`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2"><FileBarChart className="h-4 w-4 text-muted-foreground" />{report.name}</div>
                    </TableCell>
                    <TableCell>{getReportTypeLabel(report.report_type)}</TableCell>
                    <TableCell className="uppercase text-xs font-medium">{getReportFormatLabel(report.format)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 text-xs">
                        {report.critical_count > 0 && <span className="bg-red-600 text-white px-1.5 py-0.5 rounded">{report.critical_count}C</span>}
                        {report.high_count > 0 && <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded">{report.high_count}H</span>}
                        {report.medium_count > 0 && <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded">{report.medium_count}M</span>}
                        {report.total_findings === 0 && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(report.generated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.location.href = `/reports/${report.id}/details`; }}><Eye className="mr-2 h-4 w-4" /> View Report</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground">Showing {filteredRows.length} of {totalCount} reports</p>
          </>
        )}
      </div>
    </div>
  );
}
