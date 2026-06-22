import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface CysteneCalloutProps {
  heading?: string;
  body?: string;
  ctaLabel?: string;
  href?: string;
}

/**
 * Reusable promo block tying an article back to the Cystene platform. Drop it into
 * any post (top and bottom read well). Narrative, not a hard-sell button — same shape
 * as the platform callout pattern. Brand green→cyan; the neon green is used only on
 * low-opacity tints, with a readable emerald for the icon and link.
 */
export default function CysteneCallout({
  heading = 'Why a security team is writing your vibe-coding guide',
  body = 'Every hole in this guide is one we built a scanner for — exposed Supabase tables, secrets in your bundle, broken access control, missing headers. Cystene is the security platform that finds them in your live app, from the outside and the inside. This guide is the field manual for what it checks.',
  ctaLabel = 'Explore the platform',
  href = 'https://client.cystene.com/',
}: CysteneCalloutProps) {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="rounded-2xl border border-[#23FFF6]/20 bg-linear-to-br from-[#3AFF00]/5 to-[#23FFF6]/5 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 sm:flex">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-[#3AFF00]" />
          </div>
          <div>
            <h3 className="mb-1.5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {heading}
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {body}
            </p>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-[#3AFF00] dark:hover:text-[#23FFF6]"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
