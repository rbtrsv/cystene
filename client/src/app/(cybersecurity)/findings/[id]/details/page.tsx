'use client';

/**
 * Finding Details Page
 *
 * Read-only detail view for a finding with triage dropdown.
 * No edit, no delete — findings are scanner-generated.
 * User can change triage status via PATCH /{id}/status.
 *
 * Backend: GET /cybersecurity/findings/{id}
 *          PATCH /cybersecurity/findings/{id}/status
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFindings } from '@/modules/cybersecurity/hooks/discovery/use-findings';
import {
  getSeverityLabel,
  SEVERITY_COLORS,
  getFindingStatusLabel,
  type Finding,
  type Severity,
  type FindingStatus,
} from '@/modules/cybersecurity/schemas/discovery/findings.schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Loader2, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function FindingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const {
    fetchFinding,
    updateFindingStatus,
    isLoading,
    error: storeError,
  } = useFindings();

  // Local state for the fetched item
  const [item, setItem] = useState<Finding | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch item on mount
  useEffect(() => {
    const load = async () => {
      const data = await fetchFinding(id);
      if (data) {
        setItem(data);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle triage status change
  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    const success = await updateFindingStatus(id, newStatus as FindingStatus);
    setIsUpdatingStatus(false);
    if (success) {
      // Refresh item after status update
      const updated = await fetchFinding(id);
      if (updated) setItem(updated);
    }
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
          <AlertDescription>Finding not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/findings">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Findings
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.title}</h1>
            <p className="text-muted-foreground">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[item.severity]}`}>
                {getSeverityLabel(item.severity)}
              </span>
              {item.is_new && (
                <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">New</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      {/* Status triage dropdown */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium">Triage Status:</p>
        <Select value={item.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="false_positive">False Positive</SelectItem>
          </SelectContent>
        </Select>
        {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Card 1: Finding */}
      <Card>
        <CardHeader>
          <CardTitle>Finding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Severity</p>
              <p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[item.severity]}`}>
                  {getSeverityLabel(item.severity)}
                </span>
              </p>
            </div>
            <div><p className="text-sm text-muted-foreground">Title</p><p className="font-medium">{item.title}</p></div>
            <div><p className="text-sm text-muted-foreground">Category</p><p className="font-medium">{item.category}</p></div>
            <div><p className="text-sm text-muted-foreground">Finding Type</p><p className="font-medium">{item.finding_type}</p></div>
            <div>
              <p className="text-sm text-muted-foreground">Is New</p>
              <p>
                {item.is_new ? (
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Yes</span>
                ) : (
                  <span className="font-medium">No</span>
                )}
              </p>
            </div>
            <div><p className="text-sm text-muted-foreground">Discovered At</p><p className="font-medium">{new Date(item.discovered_at).toLocaleString()}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Description */}
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><p className="text-sm text-muted-foreground">Description</p><p>{item.description}</p></div>
          {item.remediation && (
            <div><p className="text-sm text-muted-foreground">Remediation</p><p>{item.remediation}</p></div>
          )}
          {item.remediation_script && (
            <div>
              <p className="text-sm text-muted-foreground">Remediation Script</p>
              <pre className="bg-muted p-4 rounded overflow-x-auto mt-1"><code>{item.remediation_script}</code></pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 3: Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-muted-foreground">Host</p><p className="font-mono">{item.host || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Port</p><p className="font-mono">{item.port ?? '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Protocol</p><p className="font-mono">{item.protocol || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">URL</p><p className="font-mono">{item.url || '—'}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-muted-foreground">CVE ID</p><p className="font-mono">{item.cve_id || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">CVSS Score</p><p className="font-medium">{item.cvss_score ?? '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">CWE ID</p><p className="font-mono">{item.cwe_id || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">OWASP Category</p><p className="font-medium">{item.owasp_category || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">MITRE Tactic</p><p className="font-medium">{item.mitre_tactic || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">MITRE Technique</p><p className="font-medium">{item.mitre_technique || '—'}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Card 5: Evidence (only if evidence present) */}
      {item.evidence && (
        <Card>
          <CardHeader>
            <CardTitle>Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded overflow-x-auto"><code>{item.evidence}</code></pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
