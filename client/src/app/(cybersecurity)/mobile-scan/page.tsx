'use client';

/**
 * Mobile Scan Page
 *
 * Dedicated APK upload flow (mobile_scan is not a network-target scanner). The user
 * uploads an APK, it's analyzed server-side, findings are shown here, and the file is
 * deleted immediately — nothing is persisted (no ScanJob, no Finding rows).
 *
 * Why a raw fetch (not fetchClient): fetchClient always sends JSON; this is a multipart
 * file upload, so we POST FormData with the bearer token and let the browser set the
 * multipart Content-Type/boundary.
 *
 * Backend: POST /cybersecurity/mobile-scan/scan
 */

import { useState } from 'react';
import { MOBILE_SCAN_ENDPOINTS } from '@/modules/cybersecurity/utils/api.endpoints';
import { getAccessToken } from '@/modules/accounts/utils/token.client.utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Badge } from '@/modules/shadcnui/components/ui/badge';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Loader2, Upload, AlertTriangle, ShieldCheck } from 'lucide-react';

// Shape of one scanner finding (raw dict from mobile_scan — not a persisted Finding row).
interface MobileFinding {
  severity: string;
  finding_type: string;
  title: string;
  description: string;
  remediation?: string | null;
}

interface MobileScanResult {
  findings: MobileFinding[];
  assets: unknown[];
  errors: string[];
  duration_seconds: number;
}

export default function MobileScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<MobileScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Bearer token only — no Content-Type, so the browser sets the multipart boundary.
      const token = getAccessToken();
      const resp = await fetch(MOBILE_SCAN_ENDPOINTS.SCAN, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
        body: formData,
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail || data?.error || `Scan failed (${resp.status})`);
      }

      const json = await resp.json();
      setResult(json.data as MobileScanResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mobile Scan</h1>
        <p className="text-muted-foreground mt-2">
          Upload an Android APK — it&apos;s analyzed server-side and deleted immediately. Nothing is stored.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload APK</CardTitle>
          <CardDescription>
            Checks the manifest, permissions, hardcoded credentials, weak crypto, and missing SSL pinning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept=".apk"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={scanning}
            className="block w-full rounded-md border bg-background text-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm hover:file:bg-muted/80"
          />
          <Button onClick={handleScan} disabled={!file || scanning} className="w-full">
            {scanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Scan APK
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-4">
          {result.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{result.errors.join(' · ')}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            {result.findings.length} finding{result.findings.length === 1 ? '' : 's'} · {result.duration_seconds}s
          </p>

          {result.findings.length === 0 && result.errors.length === 0 && (
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>No issues found in this APK.</AlertDescription>
            </Alert>
          )}

          {result.findings.map((f, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span>{f.title}</span>
                  <Badge variant="outline" className="shrink-0 uppercase">{f.severity}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{f.description}</p>
                {f.remediation && (
                  <p className="text-muted-foreground"><span className="font-medium">Fix:</span> {f.remediation}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
