'use client';

import React, { useEffect } from 'react';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { useScanJobs } from '@/modules/cybersecurity/hooks/execution/use-scan-jobs';
import { useFindings } from '@/modules/cybersecurity/hooks/discovery/use-findings';
import { useScanTargets } from '@/modules/cybersecurity/hooks/infrastructure/use-scan-targets';
import { useAssets } from '@/modules/cybersecurity/hooks/discovery/use-assets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Building,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Target,
  Play,
  Globe,
  ArrowUpRight,
  Loader2,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';

export default function CybersecurityPage() {
  const { activeOrganization } = useOrganizations();
  const { scanJobs, fetchScanJobs, isLoading: jobsLoading } = useScanJobs();
  const { findings, fetchFindings, isLoading: findingsLoading } = useFindings();
  const { scanTargets, fetchScanTargets } = useScanTargets();
  const { assets, fetchAssets } = useAssets();

  // Fetch all data when organization changes
  useEffect(() => {
    if (activeOrganization) {
      fetchScanJobs();
      fetchFindings();
      fetchScanTargets();
      fetchAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization]);

  // If no active organization, prompt to select one
  if (!activeOrganization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cybersecurity</h1>
          <p className="text-muted-foreground mt-2">
            Enterprise Security Posture Management
          </p>
        </div>
        <Alert>
          <Building className="h-4 w-4" />
          <AlertDescription>
            Please select an organization first to access the cybersecurity dashboard.{' '}
            <Link href="/organizations" className="underline font-medium">
              Go to Organizations
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  const isLoading = jobsLoading || findingsLoading;

  // ==========================================
  // Compute stats from findings
  // ==========================================

  const totalFindings = findings.length;
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;
  const lowCount = findings.filter(f => f.severity === 'low').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;

  const openCount = findings.filter(f => f.status === 'open').length;
  const resolvedCount = findings.filter(f => f.status === 'resolved').length;
  const acknowledgedCount = findings.filter(f => f.status === 'acknowledged').length;
  const newFindings = findings.filter(f => f.is_new).length;

  // Security score from latest completed job
  const completedJobs = [...scanJobs]
    .filter(j => j.status === 'completed')
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const latestScore = completedJobs.length > 0 ? completedJobs[0].security_score : null;

  // Max bar width for severity breakdown (relative to highest count)
  const maxSeverityCount = Math.max(criticalCount, highCount, mediumCount, lowCount, infoCount, 1);

  return (
    <div className="space-y-6">
      {/* Header with context */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>{activeOrganization.name}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ==========================================
              Stat Cards — top row (inspired by Intrudify)
              ========================================== */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {/* All Findings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">All Findings</CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFindings}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            {/* New Findings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">New</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{newFindings}</div>
                <p className="text-xs text-muted-foreground">First time seen</p>
              </CardContent>
            </Card>

            {/* Critical */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Critical</CardTitle>
                <AlertOctagon className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                <p className="text-xs text-muted-foreground">Immediate action</p>
              </CardContent>
            </Card>

            {/* High */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">High</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{highCount}</div>
                <p className="text-xs text-muted-foreground">Significant risk</p>
              </CardContent>
            </Card>

            {/* Open */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Open</CardTitle>
                <TrendingDown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openCount}</div>
                <p className="text-xs text-muted-foreground">Pending triage</p>
              </CardContent>
            </Card>

            {/* Resolved */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Resolved</CardTitle>
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
                <p className="text-xs text-muted-foreground">Fixed</p>
              </CardContent>
            </Card>
          </div>

          {/* ==========================================
              Executive Overview — middle row
              ========================================== */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Security Score + Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Security Posture</CardTitle>
                <CardDescription>Remediated vs Open findings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Security Score */}
                <div className="flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <svg className="h-32 w-32 -rotate-90" viewBox="0 0 36 36">
                      {/* Background circle */}
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-muted/20"
                      />
                      {/* Score arc */}
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${latestScore || 0}, 100`}
                        className={
                          (latestScore || 0) >= 80 ? 'text-green-500' :
                          (latestScore || 0) >= 50 ? 'text-yellow-500' :
                          'text-red-500'
                        }
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-3xl font-bold ${
                        (latestScore || 0) >= 80 ? 'text-green-600' :
                        (latestScore || 0) >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {latestScore !== null && latestScore !== undefined ? latestScore : '—'}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* Status breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Open</span>
                    <span className="font-medium">{openCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Acknowledged</span>
                    <span className="font-medium">{acknowledgedCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Resolved</span>
                    <span className="font-medium text-green-600">{resolvedCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vulnerability Severity Breakdown — horizontal bars (like Intrudify) */}
            <Card>
              <CardHeader>
                <CardTitle>Severity Breakdown</CardTitle>
                <CardDescription>Open findings by severity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Critical */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Critical</span>
                    <span className="text-muted-foreground">{criticalCount}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted/30">
                    <div
                      className="h-3 rounded-full bg-red-600 transition-all"
                      style={{ width: `${(criticalCount / maxSeverityCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* High */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">High</span>
                    <span className="text-muted-foreground">{highCount}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted/30">
                    <div
                      className="h-3 rounded-full bg-orange-500 transition-all"
                      style={{ width: `${(highCount / maxSeverityCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Medium */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Medium</span>
                    <span className="text-muted-foreground">{mediumCount}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted/30">
                    <div
                      className="h-3 rounded-full bg-yellow-500 transition-all"
                      style={{ width: `${(mediumCount / maxSeverityCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Low */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Low</span>
                    <span className="text-muted-foreground">{lowCount}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted/30">
                    <div
                      className="h-3 rounded-full bg-blue-400 transition-all"
                      style={{ width: `${(lowCount / maxSeverityCount) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Info</span>
                    <span className="text-muted-foreground">{infoCount}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted/30">
                    <div
                      className="h-3 rounded-full bg-gray-400 transition-all"
                      style={{ width: `${(infoCount / maxSeverityCount) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ==========================================
              Bottom row — quick stats
              ========================================== */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Scan Targets */}
            <Link href="/scan-targets">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scan Targets</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{scanTargets.length}</div>
                  <p className="text-xs text-muted-foreground">Configured targets</p>
                </CardContent>
              </Card>
            </Link>

            {/* Recent Scans */}
            <Link href="/scan-jobs">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scan Jobs</CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{scanJobs.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {scanJobs.filter(j => j.status === 'running').length} running
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Discovered Assets */}
            <Link href="/assets">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assets Discovered</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assets.length}</div>
                  <p className="text-xs text-muted-foreground">Hosts, services, technologies</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* ==========================================
              Recent Scan Jobs table
              ========================================== */}
          {completedJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Scans</CardTitle>
                <CardDescription>Latest completed scan jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedJobs.slice(0, 5).map((job) => (
                    <Link key={job.id} href={`/scan-jobs/${job.id}/details`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs">
                            {job.critical_count > 0 && <span className="bg-red-600 text-white px-1.5 py-0.5 rounded">{job.critical_count}C</span>}
                            {job.high_count > 0 && <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded">{job.high_count}H</span>}
                            {job.medium_count > 0 && <span className="bg-yellow-500 text-black px-1.5 py-0.5 rounded">{job.medium_count}M</span>}
                            {job.low_count > 0 && <span className="bg-blue-400 text-white px-1.5 py-0.5 rounded">{job.low_count}L</span>}
                            {job.total_findings === 0 && <span className="text-muted-foreground text-sm">No findings</span>}
                          </div>
                          <span className="text-sm text-muted-foreground">{job.scan_types_run}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {job.security_score !== null && job.security_score !== undefined && (
                            <span className={`text-sm font-semibold ${
                              job.security_score >= 80 ? 'text-green-600' :
                              job.security_score >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {job.security_score}/100
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
