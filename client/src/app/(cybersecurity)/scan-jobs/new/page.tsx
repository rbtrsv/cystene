'use client';

/**
 * Start Scan Page
 *
 * Starts a scan job: pick a target + one of its templates, hit Start. The backend
 * creates a ScanJob (pending) and runs the scanners in the background.
 *
 * Backend: POST /cybersecurity/scan-jobs/start?target_id=X&template_id=Y
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScanJobs } from '@/modules/cybersecurity/hooks/execution/use-scan-jobs';
import { useScanTargets } from '@/modules/cybersecurity/hooks/infrastructure/use-scan-targets';
import { useScanTemplates } from '@/modules/cybersecurity/hooks/execution/use-scan-templates';
import { useOrganizations } from '@/modules/accounts/hooks/use-organizations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/modules/shadcnui/components/ui/command';
import { Loader2, ArrowLeft, ChevronsUpDown, Check, Play } from 'lucide-react';
import Link from 'next/link';

export default function StartScanPage() {
  const router = useRouter();
  const { activeOrganization } = useOrganizations();
  const { startScan, error: storeError } = useScanJobs();
  const { scanTargets, fetchScanTargets } = useScanTargets();
  const { scanTemplates, fetchScanTemplates } = useScanTemplates();

  const [targetId, setTargetId] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [targetOpen, setTargetOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      fetchScanTargets();
      fetchScanTemplates();
    }
  }, [activeOrganization]);

  // Templates belong to a target — only show the ones for the chosen target.
  const templatesForTarget = targetId
    ? scanTemplates.filter((t) => t.target_id === targetId)
    : [];

  const targetName = targetId ? (scanTargets.find((t) => t.id === targetId)?.name || `Target #${targetId}`) : null;
  const templateName = templateId ? (scanTemplates.find((t) => t.id === templateId)?.name || `Template #${templateId}`) : null;

  const handleStart = async () => {
    if (!targetId || !templateId) return;
    setStarting(true);
    const ok = await startScan(targetId, templateId);
    setStarting(false);
    if (ok) router.push('/scan-jobs');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/scan-jobs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scan Jobs
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Start Scan</h1>
        <p className="text-muted-foreground mt-2">Pick a target and a template — the scan runs in the background.</p>
      </div>

      {storeError && (
        <Alert variant="destructive">
          <AlertDescription>{storeError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Scan configuration</CardTitle>
          <CardDescription>The template defines which scanners run and with what parameters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target */}
          <div className="space-y-2">
            <Label>Target *</Label>
            <Popover open={targetOpen} onOpenChange={setTargetOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" aria-expanded={targetOpen}
                  className="w-full justify-between font-normal" disabled={starting}>
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
                          onSelect={() => { setTargetId(t.id); setTemplateId(null); setTargetOpen(false); }}>
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

          {/* Template (filtered by target) */}
          <div className="space-y-2">
            <Label>Template *</Label>
            <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" aria-expanded={templateOpen}
                  className="w-full justify-between font-normal" disabled={starting || !targetId}>
                  {templateName || (targetId ? 'Select a template' : 'Select a target first')}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search templates..." />
                  <CommandList>
                    <CommandEmpty className="py-3 px-2 text-sm">
                      No templates for this target.{' '}
                      <Link href="/scan-templates/new" className="underline">Create one</Link>
                    </CommandEmpty>
                    <CommandGroup>
                      {templatesForTarget.map((t) => (
                        <CommandItem key={t.id} value={t.name}
                          onSelect={() => { setTemplateId(t.id); setTemplateOpen(false); }}>
                          <span className="truncate">{t.name}</span>
                          {templateId === t.id && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleStart} disabled={!targetId || !templateId || starting} className="flex-1">
              {starting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Scan
                </>
              )}
            </Button>
            <Link href="/scan-jobs" className="flex-1">
              <Button type="button" variant="outline" disabled={starting} className="w-full">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
