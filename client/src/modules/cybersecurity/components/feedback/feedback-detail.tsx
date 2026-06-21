'use client';

/**
 * Feedback Detail Dialog
 *
 * The submitter (or an admin) can edit the feedback CONTENT (category/title/description).
 * A platform admin additionally gets TRIAGE fields (status + admin_notes). Save runs the
 * content update first (PUT /{id}) then, for admins, the triage update (PUT /{id}/admin).
 * Delete is shown to an admin (any) or the owner while the item is still "open" (the
 * backend enforces the same rules).
 */

import { useEffect, useState } from 'react';
import { useFeedback } from '../../hooks/shared/use-feedback';
import {
  FeedbackCategorySchema,
  FeedbackStatusSchema,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUS_LABELS,
  getFeedbackStatusLabel,
  type Feedback,
  type FeedbackCategory,
  type FeedbackStatus,
} from '../../schemas/shared/feedback.schemas';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Input } from '@/modules/shadcnui/components/ui/input';
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
  const { updateFeedback, adminUpdateFeedback, deleteFeedback } = useFeedback();

  // Content (owner/admin editable)
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Triage (admin only)
  const [status, setStatus] = useState<FeedbackStatus>('open');
  const [adminNotes, setAdminNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed every field from the selected feedback whenever the dialog opens.
  useEffect(() => {
    if (feedback) {
      setCategory(feedback.category);
      setTitle(feedback.title);
      setDescription(feedback.description);
      setStatus(feedback.status);
      setAdminNotes(feedback.admin_notes ?? '');
      setError(null);
    }
  }, [feedback]);

  if (!feedback) return null;

  const handleSave = async () => {
    setError(null);
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }
    setSaving(true);
    // Content first (submitter or admin)...
    const contentOk = await updateFeedback(feedback.id, {
      category,
      title: title.trim(),
      description: description.trim(),
    });
    // ...then triage (admin only).
    let triageOk = true;
    if (contentOk && isAdmin) {
      triageOk = await adminUpdateFeedback(feedback.id, { status, admin_notes: adminNotes || null });
    }
    setSaving(false);
    if (contentOk && triageOk) onOpenChange(false);
    else setError('Failed to save feedback. Please try again.');
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
            <span className="truncate">{feedback.title}</span>
            <Badge variant="outline" className="shrink-0">{getFeedbackStatusLabel(feedback.status)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{new Date(feedback.created_at).toLocaleString()}</span>
            {isAdmin && feedback.user_email && <span>· {feedback.user_name || feedback.user_email}</span>}
            {feedback.page_url && <span className="font-mono">· {feedback.page_url}</span>}
          </div>

          {/* Content — editable by the submitter or an admin */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)} disabled={saving}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FeedbackCategorySchema.options.map((c) => (
                  <SelectItem key={c} value={c}>{FEEDBACK_CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} disabled={saving} />
          </div>

          {/* Triage — admin only */}
          {isAdmin && (
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
                  placeholder="Internal triage notes" rows={3} disabled={saving} />
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {canDelete ? (
            <Button variant="destructive" onClick={handleDelete} disabled={deleting || saving}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          ) : <span />}
          <Button onClick={handleSave} disabled={saving || deleting}>
            {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
