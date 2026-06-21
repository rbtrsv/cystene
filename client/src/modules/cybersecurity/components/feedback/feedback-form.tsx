'use client';

/**
 * Feedback Form Dialog
 *
 * Self-contained "Report Issue" dialog — any authenticated user can submit feedback.
 * Captures the current page path automatically so the admin can reproduce the report.
 */

import { useState } from 'react';
import { useFeedback } from '../../hooks/shared/use-feedback';
import {
  FeedbackCategorySchema,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
} from '../../schemas/shared/feedback.schemas';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Textarea } from '@/modules/shadcnui/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/modules/shadcnui/components/ui/dialog';
import { Loader2, MessageSquarePlus } from 'lucide-react';

export function FeedbackForm() {
  const { createFeedback } = useFeedback();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCategory('bug');
    setTitle('');
    setDescription('');
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }
    setSubmitting(true);
    // Auto-capture the page the user is on so the admin can reproduce.
    const ok = await createFeedback({
      category,
      title: title.trim(),
      description: description.trim(),
      page_url: typeof window !== 'undefined' ? window.location.pathname : null,
    });
    setSubmitting(false);
    if (ok) {
      reset();
      setOpen(false);
    } else {
      setError('Failed to submit feedback. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>Found a bug or have a request? Tell us — we read every one.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)} disabled={submitting}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FeedbackCategorySchema.options.map((c) => (
                  <SelectItem key={c} value={c}>{FEEDBACK_CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-title">Title</Label>
            <Input id="feedback-title" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary" disabled={submitting} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-description">Description</Label>
            <Textarea id="feedback-description" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? What did you expect?" rows={5} disabled={submitting} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>) : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
