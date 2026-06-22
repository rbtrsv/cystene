import React from 'react';
import { Eye, Wrench, ScanLine } from 'lucide-react';

export type RiskSeverity = 'Critical' | 'High' | 'Medium';

export interface RiskCardData {
  /** Risk name, e.g. "Database tables wide open" */
  name: string;
  severity: RiskSeverity;
  /** OWASP Top 10 class, e.g. "A01 · Broken Access Control" */
  owasp: string;
  /** What it is and why it matters, in plain language. */
  what: string;
  /** How an attacker finds/exploits it. */
  how: string;
  /** The one-line fix. */
  fix: string;
  /** The Cystene scanner that detects it, e.g. "baas_scan". */
  scanner: string;
}

const SEVERITY_STYLES: Record<RiskSeverity, string> = {
  Critical: 'bg-red-500/10 text-red-600 dark:text-red-400',
  High: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  Medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500',
};

/**
 * One security risk, rendered as a detailed card: name + severity + OWASP class, what
 * it is, how attackers find it, the fix, and the Cystene scanner that catches it.
 * Data-driven — the article keeps the risk list at the top of the page and maps it here.
 */
export default function RiskCard({ risk }: { risk: RiskCardData }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {risk.name}
        </h3>
        <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_STYLES[risk.severity]}`}>
          {risk.severity}
        </span>
      </div>

      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
        OWASP {risk.owasp}
      </p>

      <p className="grow text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {risk.what}
      </p>

      <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800/60 dark:text-zinc-500">
        <span className="inline-flex items-start gap-2">
          <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span><span className="font-medium text-zinc-700 dark:text-zinc-400">How they find it:</span> {risk.how}</span>
        </span>
        <span className="inline-flex items-start gap-2">
          <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span><span className="font-medium text-zinc-700 dark:text-zinc-400">The fix:</span> {risk.fix}</span>
        </span>
        <span className="inline-flex items-start gap-2">
          <ScanLine className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-[#3AFF00]" />
          <span>
            Cystene catches it with{' '}
            <span className="font-mono font-semibold text-emerald-600 dark:text-[#3AFF00]">{risk.scanner}</span>
          </span>
        </span>
      </div>
    </div>
  );
}
