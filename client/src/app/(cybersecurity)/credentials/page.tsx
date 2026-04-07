'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Plus, Loader2, ChevronUp, ChevronDown, MoreHorizontal, Eye, Pencil } from 'lucide-react';

import { useCredentials } from '@/modules/cybersecurity/hooks/infrastructure/use-credentials';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { getCredentialTypeLabel } from '@/modules/cybersecurity/schemas/infrastructure/credentials.schemas';
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

type SortField = 'name' | 'cred_type' | 'username';
type SortDirection = 'asc' | 'desc' | null;

export default function CredentialsPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { credentials, isLoading, error, fetchCredentials } = useCredentials();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch credentials when organization changes
  useEffect(() => {
    if (activeOrganization) {
      fetchCredentials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization]);

  // ==========================================
  // Filter and sort credentials
  // ==========================================

  const filteredRows = useMemo(() => {
    let filtered = [...credentials];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(term) ||
        getCredentialTypeLabel(item.cred_type).toLowerCase().includes(term) ||
        (item.username && item.username.toLowerCase().includes(term))
      );
    }

    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'cred_type':
            comparison = a.cred_type.localeCompare(b.cred_type);
            break;
          case 'username':
            comparison = (a.username || '').localeCompare(b.username || '');
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [credentials, searchTerm, sortField, sortDirection]);

  // ==========================================
  // Sort handler
  // ==========================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null); }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 ml-1" /> : <ChevronDown className="inline h-4 w-4 ml-1" />;
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
    return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!activeOrganization) {
    return (
      <Alert>
        <AlertDescription>
          Please select an organization first.{' '}
          <Link href="/organizations" className="underline">Go to Organizations</Link>
        </AlertDescription>
      </Alert>
    );
  }

  const totalCount = credentials.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
          <p className="text-muted-foreground">
            Manage encrypted credentials for {activeOrganization.name}
          </p>
        </div>
        <Link href="/credentials/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Credential
          </Button>
        </Link>
      </div>

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by name, type, or username..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <KeyRound className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No credentials yet' : 'No credentials match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Add SSH keys, API keys, or domain credentials for internal scanning' : 'Try adjusting your search criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/credentials/new">
                  <Button><Plus className="mr-2 h-4 w-4" /> Add Credential</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('name')}>
                      Name <SortIndicator field="name" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('cred_type')}>
                      Type <SortIndicator field="cred_type" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm" className="p-0 h-auto font-medium hover:bg-transparent" onClick={() => handleSort('username')}>
                      Username <SortIndicator field="username" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((cred) => (
                  <TableRow key={cred.id} className="cursor-pointer" onClick={() => router.push(`/credentials/${cred.id}/details`)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                        {cred.name}
                      </div>
                    </TableCell>
                    <TableCell>{getCredentialTypeLabel(cred.cred_type)}</TableCell>
                    <TableCell className="font-mono text-sm">{cred.username || '—'}</TableCell>
                    <TableCell>
                      {cred.is_active ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-muted-foreground">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(cred.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/credentials/${cred.id}/details`); }}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/credentials/${cred.id}/details?tab=edit`); }}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <p className="text-sm text-muted-foreground">
              Showing {filteredRows.length} of {totalCount} credentials
            </p>
          </>
        )}
      </div>
    </div>
  );
}
