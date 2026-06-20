'use client';

/**
 * Feedback Page
 *
 * In-app feedback (bug reports, feature requests, questions). A member sees only their
 * own submissions; a platform admin (User.role === "ADMIN") sees all + can triage
 * (status + admin notes) and sees the submitter column. Page uses ONLY the hook.
 */

import { useEffect, useState } from 'react';
import { useFeedback } from '@/modules/cybersecurity/hooks/use-feedback';
// Use the auth STORE directly (not the use-auth-client context hook): the (cybersecurity)
// route group is not wrapped in AuthProvider, so the context hook throws here.
import { useAuthStore } from '@/modules/accounts/store/auth.client.store';
import {
  FeedbackStatusSchema,
  FEEDBACK_STATUS_LABELS,
  getFeedbackCategoryLabel,
  getFeedbackStatusLabel,
  type FeedbackStatus,
} from '@/modules/cybersecurity/schemas/feedback.schemas';
import { FeedbackForm } from '@/modules/cybersecurity/components/feedback/feedback-form';
import { FeedbackDetail } from '@/modules/cybersecurity/components/feedback/feedback-detail';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Loader2, MessageSquare } from 'lucide-react';

export default function FeedbackPage() {
  const { feedbacks, fetchFeedbackList, setActiveFeedback, activeFeedback, isLoading } = useFeedback();
  const user = useAuthStore((state) => state.user);
  // Case-insensitive — User.role is free-form String(50) (matches the backend _is_admin check).
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailOpen, setDetailOpen] = useState(false);

  // The persisted auth store uses skipHydration — rehydrate so user.role is available.
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  // Load the list on mount + whenever the status filter changes.
  useEffect(() => {
    fetchFeedbackList(statusFilter !== 'all' ? { status: statusFilter as FeedbackStatus } : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openDetail = (id: number) => {
    setActiveFeedback(id);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'All submitted feedback — triage status and add notes.' : 'Your submitted feedback.'}
          </p>
        </div>
        <FeedbackForm />
      </div>

      {/* Filter */}
      <div className="w-48 space-y-2">
        <Label htmlFor="status-filter">Status</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger id="status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {FeedbackStatusSchema.options.map((s) => (
              <SelectItem key={s} value={s}>{FEEDBACK_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No feedback yet. Use “Report Issue” to send your first one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  {/* Submitter column only for admins (cross-user view) */}
                  {isAdmin && <TableHead>User</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((f) => (
                  <TableRow key={f.id} className="cursor-pointer" onClick={() => openDetail(f.id)}>
                    <TableCell className="text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="secondary">{getFeedbackCategoryLabel(f.category)}</Badge></TableCell>
                    <TableCell className="font-medium">{f.title}</TableCell>
                    <TableCell><Badge variant="outline">{getFeedbackStatusLabel(f.status)}</Badge></TableCell>
                    {isAdmin && <TableCell className="text-muted-foreground">{f.user_name || f.user_email || '—'}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FeedbackDetail feedback={activeFeedback} isAdmin={isAdmin} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
