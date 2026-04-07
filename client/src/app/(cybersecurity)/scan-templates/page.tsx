'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileCode, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useScanTemplates } from '@/modules/cybersecurity/hooks/execution/use-scan-templates';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { getScanSpeedLabel } from '@/modules/cybersecurity/schemas/execution/scan-templates.schemas';
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

type SortField = 'name' | 'scan_types' | 'scan_speed';
type SortDirection = 'asc' | 'desc' | null;

export default function ScanTemplatesPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { scanTemplates, isLoading, error, fetchScanTemplates } = useScanTemplates();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch scan templates when organization changes
  useEffect(() => {
    if (activeOrganization) {
      fetchScanTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization]);

  // ==========================================
  // Filter and sort scan templates
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...scanTemplates];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(term) ||
        item.scan_types.toLowerCase().includes(term)
      );
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name': comparison = a.name.localeCompare(b.name); break;
          case 'scan_types': comparison = a.scan_types.localeCompare(b.scan_types); break;
          case 'scan_speed': comparison = a.scan_speed.localeCompare(b.scan_speed); break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [scanTemplates, searchTerm, sortField, sortDirection]);

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

  const totalCount = scanTemplates.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scan Templates</h1>
          <p className="text-muted-foreground">Configure how and what to scan</p>
        </div>
        <Link href="/scan-templates/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Create Template</Button>
        </Link>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by name or scan types..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileCode className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{totalCount === 0 ? 'No scan templates yet' : 'No templates match filters'}</h3>
              <p className="text-sm text-muted-foreground mb-4">{totalCount === 0 ? 'Create a template to configure your scan parameters' : 'Try adjusting your search criteria'}</p>
              {totalCount === 0 && <Link href="/scan-templates/new"><Button><Plus className="mr-2 h-4 w-4" /> Create Template</Button></Link>}
            </CardContent>
          </Card>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('name')}>Name <SortIndicator field="name" /></Button></TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('scan_types')}>Scan Types <SortIndicator field="scan_types" /></Button></TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('scan_speed')}>Speed <SortIndicator field="scan_speed" /></Button></TableHead>
                  <TableHead>Consent</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((tmpl) => (
                  <TableRow key={tmpl.id} className="cursor-pointer" onClick={() => router.push(`/scan-templates/${tmpl.id}/details`)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2"><FileCode className="h-4 w-4 text-muted-foreground" />{tmpl.name}</div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{tmpl.scan_types}</TableCell>
                    <TableCell>{getScanSpeedLabel(tmpl.scan_speed)}</TableCell>
                    <TableCell>{tmpl.active_scan_consent ? <span className="text-green-600">Yes</span> : <span className="text-muted-foreground">No</span>}</TableCell>
                    <TableCell>{new Date(tmpl.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/scan-templates/${tmpl.id}/details`); }}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/scan-templates/${tmpl.id}/details?tab=edit`); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-muted-foreground">Showing {filteredRows.length} of {totalCount} scan templates</p>
          </>
        )}
      </div>
    </div>
  );
}
