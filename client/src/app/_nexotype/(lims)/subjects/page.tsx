'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User2, Loader2, Plus } from 'lucide-react';
import { useSubjects } from '@/modules/nexotype/hooks/lims/use-subjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** Subject list with simple client-side search across key LIMS fields. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function SubjectsPage() {
  const router = useRouter();
  const { subjects, isLoading, error } = useSubjects();
  const [searchTerm, setSearchTerm] = useState('');

  // Search by subject identifier, organism ID, cohort, or sex.
  const filteredSubjects = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return subjects;

    return subjects.filter((subject) =>
      subject.subject_identifier.toLowerCase().includes(term) ||
      String(subject.organism_id).includes(term) ||
      String(subject.cohort_name ?? '').toLowerCase().includes(term) ||
      String(subject.sex ?? '').toLowerCase().includes(term)
    );
  }, [subjects, searchTerm]);

  // Guard: loading state.
  if (isLoading) {
      // Render page content.
  return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Guard: error state.
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">Manage subject records used in LIMS workflows</p>
        </div>
        <Link href="/subjects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Subject
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
          <CardDescription>All subject records visible to your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by subject identifier, organism ID, cohort, or sex..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <User2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {subjects.length === 0 ? 'No subjects yet' : 'No subjects match filters'}
              </h3>
              {subjects.length === 0 && (
                <Link href="/subjects/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Subject
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Subject Identifier</TableHead>
                    <TableHead>Organism ID</TableHead>
                    <TableHead>Cohort</TableHead>
                    <TableHead>Sex</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject) => (
                    <TableRow
                      key={subject.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/subjects/${subject.id}/details`)}
                    >
                      <TableCell className="font-medium">{subject.id}</TableCell>
                      <TableCell>{subject.subject_identifier}</TableCell>
                      <TableCell>{subject.organism_id}</TableCell>
                      <TableCell>{subject.cohort_name ?? '—'}</TableCell>
                      <TableCell>{subject.sex ?? '—'}</TableCell>
                      <TableCell>{new Date(subject.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/subjects/${subject.id}/details`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">
                Showing {filteredSubjects.length} of {subjects.length} subjects
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
