'use client';

/**
 * Scan Job Details Page
 *
 * Read-only detail view for a scan job.
 * No edit, no delete — jobs are immutable once created.
 * Cancel button shown only for pending/running jobs.
 *
 * Backend: GET /cybersecurity/scan-jobs/{id}
 *          POST /cybersecurity/scan-jobs/{id}/cancel
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useScanJobs } from '@/modules/cybersecurity/hooks/execution/use-scan-jobs';
import {
  getJobStatusLabel,
  JOB_STATUS_COLORS,
  type ScanJob,
  type JobStatus,
} from '@/modules/cybersecurity/schemas/execution/scan-jobs.schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';

export default function ScanJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const {
    fetchScanJob,
    cancelScan,
    isLoading,
    error: storeError,
  } = useScanJobs();

  // Local state for the fetched item
  const [item, setItem] = useState<ScanJob | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch item on mount
  useEffect(() => {
    const load = async () => {
      const data = await fetchScanJob(id);
      if (data) {
        setItem(data);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle cancel scan
  const handleCancel = async () => {
    setIsCancelling(true);
    const success = await cancelScan(id);
    setIsCancelling(false);
    if (success) {
      // Refresh item after cancellation
      const updated = await fetchScanJob(id);
      if (updated) setItem(updated);
    }
  };

  /**
   * Helper to get a color class for the security score
   * Green >= 70, Yellow >= 40, Red < 40
   */
  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // ==========================================
  // Render
  // ==========================================

  if (isLoading && !item) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Scan job not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/scan-jobs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scan Jobs
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Play className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scan Job #{item.id}</h1>
            <p className="text-muted-foreground">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${JOB_STATUS_COLORS[item.status]}`}>
                {getJobStatusLabel(item.status)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      {/* Cancel button for pending/running jobs */}
      {(item.status === 'pending' || item.status === 'running') && (
        <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
          {isCancelling ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...</>
          ) : (
            'Cancel Scan'
          )}
        </Button>
      )}

      {/* Card 1: Job Info */}
      <Card>
        <CardHeader>
          <CardTitle>Job Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-muted-foreground">ID</p><p className="font-medium">{item.id}</p></div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${JOB_STATUS_COLORS[item.status]}`}>
                  {getJobStatusLabel(item.status)}
                </span>
              </p>
            </div>
            <div><p className="text-sm text-muted-foreground">Target ID</p><p className="font-medium">{item.target_id}</p></div>
            <div><p className="text-sm text-muted-foreground">Template ID</p><p className="font-medium">{item.template_id}</p></div>
            <div><p className="text-sm text-muted-foreground">Schedule ID</p><p className="font-medium">{item.schedule_id ?? '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Execution Point</p><p className="font-medium">{item.execution_point}</p></div>
            <div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium">{new Date(item.created_at).toLocaleString()}</p></div>
            <div><p className="text-sm text-muted-foreground">Started</p><p className="font-medium">{item.started_at ? new Date(item.started_at).toLocaleString() : '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Completed</p><p className="font-medium">{item.completed_at ? new Date(item.completed_at).toLocaleString() : '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Duration (seconds)</p><p className="font-medium">{item.duration_seconds ?? '—'}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Results */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security score — large colored number */}
          <div>
            <p className="text-sm text-muted-foreground">Security Score</p>
            <p className={`text-4xl font-bold ${item.security_score != null ? getScoreColor(item.security_score) : 'text-muted-foreground'}`}>
              {item.security_score != null ? item.security_score : '—'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-muted-foreground">Total Findings</p><p className="font-medium">{item.total_findings}</p></div>
            <div><p className="text-sm text-muted-foreground">Total Assets</p><p className="font-medium">{item.total_assets}</p></div>
          </div>
          {/* Severity breakdown with colored badges */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Severity Breakdown</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">Critical: {item.critical_count}</span>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-orange-500 text-white">High: {item.high_count}</span>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-yellow-500 text-black">Medium: {item.medium_count}</span>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-400 text-white">Low: {item.low_count}</span>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-400 text-white">Info: {item.info_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Scan Types */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Types</CardTitle>
        </CardHeader>
        <CardContent>
          {item.scan_types_run ? (
            <div className="flex flex-wrap gap-2">
              {item.scan_types_run.split(',').map((type) => (
                <span key={type.trim()} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                  {type.trim()}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </CardContent>
      </Card>

      {/* Card 4: Errors (only if error_message present) */}
      {item.error_message && (
        <Card>
          <CardHeader>
            <CardTitle>Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded overflow-x-auto"><code>{item.error_message}</code></pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
