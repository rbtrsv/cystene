'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil, Power, PowerOff } from 'lucide-react';

import { useScanSchedules } from '@/modules/cybersecurity/hooks/execution/use-scan-schedules';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { getScheduleFrequencyLabel } from '@/modules/cybersecurity/schemas/execution/scan-schedules.schemas';
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

type SortField = 'name' | 'frequency';
type SortDirection = 'asc' | 'desc' | null;

export default function ScanSchedulesPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { scanSchedules, isLoading, error, fetchScanSchedules, activateScanSchedule, deactivateScanSchedule } = useScanSchedules();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch scan schedules when organization changes
  useEffect(() => {
    if (activeOrganization) {
      fetchScanSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization]);

  // ==========================================
  // Filter and sort scan schedules
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...scanSchedules];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(term) ||
        getScheduleFrequencyLabel(item.frequency).toLowerCase().includes(term)
      );
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name': comparison = a.name.localeCompare(b.name); break;
          case 'frequency': comparison = a.frequency.localeCompare(b.frequency); break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [scanSchedules, searchTerm, sortField, sortDirection]);

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

  const totalCount = scanSchedules.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scan Schedules</h1>
          <p className="text-muted-foreground">Configure recurring scan schedules</p>
        </div>
        <Link href="/scan-schedules/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Create Schedule</Button>
        </Link>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by name or frequency..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{totalCount === 0 ? 'No scan schedules yet' : 'No schedules match filters'}</h3>
              <p className="text-sm text-muted-foreground mb-4">{totalCount === 0 ? 'Create a schedule to automate recurring scans' : 'Try adjusting your search criteria'}</p>
              {totalCount === 0 && <Link href="/scan-schedules/new"><Button><Plus className="mr-2 h-4 w-4" /> Create Schedule</Button></Link>}
            </CardContent>
          </Card>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('name')}>Name <SortIndicator field="name" /></Button></TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('frequency')}>Frequency <SortIndicator field="frequency" /></Button></TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((schedule) => (
                  <TableRow key={schedule.id} className="cursor-pointer" onClick={() => router.push(`/scan-schedules/${schedule.id}/details`)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{schedule.name}</div>
                    </TableCell>
                    <TableCell>{getScheduleFrequencyLabel(schedule.frequency)}</TableCell>
                    <TableCell>
                      {schedule.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-600"><Power className="h-3 w-3" /> Active</span>
                      ) : (
                        <span className="text-muted-foreground">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell>{schedule.last_run_at ? new Date(schedule.last_run_at).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>{schedule.next_run_at ? new Date(schedule.next_run_at).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/scan-schedules/${schedule.id}/details`); }}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/scan-schedules/${schedule.id}/details?tab=edit`); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          {schedule.is_active ? (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deactivateScanSchedule(schedule.id); }}><PowerOff className="mr-2 h-4 w-4" /> Deactivate</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); activateScanSchedule(schedule.id); }}><Power className="mr-2 h-4 w-4" /> Activate</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground">Showing {filteredRows.length} of {totalCount} scan schedules</p>
          </>
        )}
      </div>
    </div>
  );
}
