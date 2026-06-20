'use client';

/**
 * Feedback Detail Dialog
 *
 * Read-only view of a feedback item for the submitter; for a platform admin it adds
 * editable status + admin_notes (triage). Delete is shown to an admin (any) or the
 * owner while the item is still "open" (the backend enforces the same rule).
 */

import { useEffect, useState } from 'react';
import { useFeedback } from '../../hooks/use-feedback';
import {
  FeedbackStatusSchema,
  FEEDBACK_STATUS_LABELS,
  getFeedbackCategoryLabel,
  getFeedbackStatusLabel,
  type Feedback,
  type FeedbackStatus,
} from '../../schemas/feedback.schemas';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/modules/shadcnui/components/ui/dialog';
import { Loader2, Trash2 } from 'lucide-react';

export function FeedbackDetail({
  feedback,
  isAdmin,
  open,
  onOpenChange,
}: {
  feedback: Feedback | null;
  isAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateFeedback, deleteFeedback } = useFeedback();

  const [status, setStatus] = useState<FeedbackStatus>('open');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Seed the admin fields from the selected feedback whenever the dialog opens.
  useEffect(() => {
    if (feedback) {
      setStatus(feedback.status);
      setAdminNotes(feedback.admin_notes ?? '');
    }
  }, [feedback]);

  if (!feedback) return null;

  const handleSave = async () => {
    setSaving(true);
    const ok = await updateFeedback(feedback.id, { status, admin_notes: adminNotes || null });
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await deleteFeedback(feedback.id);
    setDeleting(false);
    if (ok) onOpenChange(false);
  };

  // Admin can delete any; the owner only while the item is still open (backend enforces too).
  const canDelete = isAdmin || feedback.status === 'open';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-6">
            <span>{feedback.title}</span>
            <Badge variant="outline" className="shrink-0">{getFeedbackStatusLabel(feedback.status)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{getFeedbackCategoryLabel(feedback.category)}</Badge>
            <span>{new Date(feedback.created_at).toLocaleString()}</span>
            {isAdmin && feedback.user_email && <span>· {feedback.user_name || feedback.user_email}</span>}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <p className="mt-1 whitespace-pre-wrap">{feedback.description}</p>
          </div>

          {feedback.page_url && (
            <div>
              <Label className="text-xs text-muted-foreground">Page</Label>
              <p className="mt-1 font-mono text-xs">{feedback.page_url}</p>
            </div>
          )}

          {isAdmin ? (
            <>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as FeedbackStatus)} disabled={saving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FeedbackStatusSchema.options.map((s) => (
                      <SelectItem key={s} value={s}>{FEEDBACK_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin notes</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal triage notes (not shown to the submitter as editable)" rows={3} disabled={saving} />
              </div>
            </>
          ) : (
            feedback.admin_notes && (
              <div>
                <Label className="text-xs text-muted-foreground">Response</Label>
                <p className="mt-1 whitespace-pre-wrap">{feedback.admin_notes}</p>
              </div>
            )
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {canDelete ? (
            <Button variant="destructive" onClick={handleDelete} disabled={deleting || saving}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          ) : <span />}
          {isAdmin && (
            <Button onClick={handleSave} disabled={saving || deleting}>
              {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
