'use client';

/**
 * Generate Report Page
 *
 * Generates a report for a target (optionally scoped to one scan job), with a type
 * (full / executive summary / compliance / delta) and a format (pdf / html / json).
 *
 * Backend: POST /cybersecurity/reports/generate
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReports } from '@/modules/cybersecurity/hooks/discovery/use-reports';
import { useScanTargets } from '@/modules/cybersecurity/hooks/infrastructure/use-scan-targets';
import { useScanJobs } from '@/modules/cybersecurity/hooks/execution/use-scan-jobs';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import {
  ReportTypeEnum,
  ReportFormatEnum,
  getReportTypeLabel,
  type ReportType,
  type ReportFormat,
} from '@/modules/cybersecurity/schemas/discovery/reports.schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/modules/shadcnui/components/ui/command';
import { Loader2, ArrowLeft, ChevronsUpDown, Check, X, FileBarChart } from 'lucide-react';
import Link from 'next/link';

export default function GenerateReportPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { generateReport, error: storeError } = useReports();
  const { scanTargets, fetchScanTargets } = useScanTargets();
  const { scanJobs, fetchScanJobs } = useScanJobs();

  const [name, setName] = useState('');
  const [targetId, setTargetId] = useState<number | null>(null);
  const [scanJobId, setScanJobId] = useState<number | null>(null);
  const [reportType, setReportType] = useState<ReportType>('full');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [targetOpen, setTargetOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      fetchScanTargets();
      fetchScanJobs();
    }
  }, [activeOrganization]);

  // Scan jobs belong to a target — only offer the ones for the chosen target.
  const jobsForTarget = targetId ? scanJobs.filter((j) => j.target_id === targetId) : [];

  const targetName = targetId ? (scanTargets.find((t) => t.id === targetId)?.name || `Target #${targetId}`) : null;

  const handleGenerate = async () => {
    if (!targetId || !name.trim()) return;
    setGenerating(true);
    const ok = await generateReport({
      name: name.trim(),
      target_id: targetId,
      scan_job_id: scanJobId,
      report_type: reportType,
      format,
    });
    setGenerating(false);
    if (ok) router.push('/reports');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/reports">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Generate Report</h1>
        <p className="text-muted-foreground mt-2">Build an audit-ready report from a target&apos;s scan results.</p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="report-name">Name *</Label>
            <Input id="report-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="March 2026 Security Assessment" disabled={generating} />
          </div>

          {/* Target */}
          <div className="space-y-2">
            <Label>Target *</Label>
            <Popover open={targetOpen} onOpenChange={setTargetOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" aria-expanded={targetOpen}
                  className="w-full justify-between font-normal" disabled={generating}>
                  {targetName || 'Select a scan target'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search targets..." />
                  <CommandList>
                    <CommandEmpty className="py-3 px-2 text-sm">
                      No scan targets yet.{' '}
                      <Link href="/scan-targets/new" className="underline">Create one</Link>
                    </CommandEmpty>
                    <CommandGroup>
                      {scanTargets.map((t) => (
                        <CommandItem key={t.id} value={t.name}
                          onSelect={() => { setTargetId(t.id); setScanJobId(null); setTargetOpen(false); }}>
                          <span className="truncate">{t.name}</span>
                          {targetId === t.id && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Scan job (optional — scope to a single scan) */}
          <div className="space-y-2">
            <Label>Scan Job</Label>
            <Popover open={jobOpen} onOpenChange={setJobOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" aria-expanded={jobOpen}
                  className="w-full justify-between font-normal" disabled={generating || !targetId}>
                  <span className={scanJobId ? '' : 'text-muted-foreground'}>
                    {scanJobId ? `Scan #${scanJobId}` : 'All scans for this target (optional)'}
                  </span>
                  <div className="flex items-center gap-1">
                    {scanJobId && <X className="h-4 w-4 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setScanJobId(null); }} />}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search scans..." />
                  <CommandList>
                    <CommandEmpty>No scans for this target.</CommandEmpty>
                    <CommandGroup>
                      {jobsForTarget.map((j) => (
                        <CommandItem key={j.id} value={`scan-${j.id}`}
                          onSelect={() => { setScanJobId(j.id); setJobOpen(false); }}>
                          <span className="truncate">Scan #{j.id} — {j.status}</span>
                          {scanJobId === j.id && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Type + format */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)} disabled={generating}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ReportTypeEnum.options.map((t) => (
                    <SelectItem key={t} value={t}>{getReportTypeLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ReportFormat)} disabled={generating}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ReportFormatEnum.options.map((f) => (
                    <SelectItem key={f} value={f}>{f.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleGenerate} disabled={!targetId || !name.trim() || generating} className="flex-1">
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileBarChart className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
            <Link href="/reports" className="flex-1">
              <Button type="button" variant="outline" disabled={generating} className="w-full">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
