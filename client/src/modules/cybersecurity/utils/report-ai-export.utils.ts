/**
 * Report → AI-fix export
 *
 * Builds a single copy-pasteable markdown prompt from a report's findings, optimised for
 * pasting into an AI coding assistant (Claude Code, Cursor, Lovable, etc.) — cystene's
 * equivalent of vibeappscanner's "Export for AI". Pure function, no side effects, so it stays
 * trivial to unit-test and reuse.
 *
 * Per finding it prefers the scanner-generated `ai_fix_prompt` (a tailored instruction the
 * scanner already wrote); when that's absent it falls back to assembling an instruction from
 * the title / severity / evidence / remediation fields.
 */

import {
  SeverityEnum,
  getSeverityLabel,
  type Finding,
  type Severity,
} from '../schemas/discovery/findings.schemas';

// Critical → Info, so the assistant fixes the most dangerous issues first.
// Why derive from SeverityEnum.options: that enum already declares the canonical order
// (['critical','high','medium','low','info']) — no second source of truth to drift.
const SEVERITY_RANK: Record<Severity, number> = SeverityEnum.options.reduce(
  (acc, sev, idx) => ({ ...acc, [sev]: idx }),
  {} as Record<Severity, number>,
);

/**
 * Build the combined AI-fix markdown for a report's findings.
 *
 * @param reportName - the report's display name (used in the heading)
 * @param findings   - the findings to include (already scoped to the report's scan)
 * @returns a markdown string ready to copy into an AI coding assistant
 */
export function buildAiFixExport(reportName: string, findings: Finding[]): string {
  const ordered = [...findings].sort(
    (a, b) => (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99),
  );

  const out: string[] = [
    `# Fix these security issues — ${reportName}`,
    '',
    `A security scan found ${findings.length} issue(s). Fix each one below, working top-down (most severe first).`,
    '',
  ];

  ordered.forEach((f, i) => {
    out.push(`## ${i + 1}. [${getSeverityLabel(f.severity)}] ${f.title}`, '');
    if (f.description) out.push(f.description, '');
    if (f.evidence) out.push('**Evidence:**', '```', f.evidence, '```', '');

    if (f.ai_fix_prompt) {
      // Scanner already wrote a tailored fix instruction for the AI — prefer it verbatim.
      out.push(f.ai_fix_prompt, '');
    } else {
      if (f.remediation) out.push(`**Fix:** ${f.remediation}`, '');
      if (f.remediation_script) out.push('```', f.remediation_script, '```', '');
    }
  });

  return out.join('\n');
}
