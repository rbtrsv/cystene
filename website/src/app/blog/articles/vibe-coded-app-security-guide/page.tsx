import React from 'react';
import { Metadata } from 'next';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import Footer from '@/modules/main/components/Footer/Footer';
import { generatePageMetadata } from '@/modules/blog/components/composed/seo/PageSEO';
import ArticleHero from '@/modules/blog/components/composed/article/ArticleHero';
import CysteneCallout from '@/modules/blog/components/composed/article/CysteneCallout';
import RiskCard, { type RiskCardData } from '@/modules/blog/components/composed/article/RiskCard';

export const metadata: Metadata = generatePageMetadata({
  title: 'Scan Your Vibe-Coded App: The Security Guide AI Skips',
  description:
    'One in five AI-built apps ships with a real security hole. The six that show up most in apps built with Bolt, Lovable, v0, Replit and Cursor — what each is, how attackers find it, the exact fix, and how to catch them all in one scan.',
  slug: 'blog/articles/vibe-coded-app-security-guide',
  type: 'article',
  publishDate: '2026-06-22',
  author: 'Cystene Team',
  keywords: [
    'vibe coding security', 'AI app security', 'Supabase RLS', 'exposed secrets',
    'broken access control', 'IDOR', 'security headers', 'SAST', 'DAST', 'scan my app',
    'Lovable security', 'Bolt.new security', 'v0 security', 'Replit security',
  ],
});

// ── Data ─────────────────────────────────────────────────────────────────────
// The six risks kept inline at the top of the page (data-driven; mapped to RiskCard
// below). Every one maps to a scanner that actually runs in Cystene.
const risks: RiskCardData[] = [
  {
    name: 'Your database is wide open',
    severity: 'Critical',
    owasp: 'A01 · Broken Access Control',
    what: 'Apps that talk to Supabase or Firebase from the browser ship the public anon key in their bundle. Without Row Level Security, that key reads — and writes — every row in every table. Wiz found this exact misconfiguration is the most common one in vibe-coded apps.',
    how: 'They lift the project URL and anon key out of your JavaScript, then query the tables every starter ships — users, profiles, orders — and read whatever answers.',
    fix: 'Enable RLS on every table and add a deny-by-default policy: USING (auth.uid() = id).',
    scanner: 'baas_scan',
  },
  {
    name: 'Secrets in your JavaScript bundle',
    severity: 'Critical',
    owasp: 'A02 · Cryptographic Failures',
    what: 'Keys for OpenAI, Stripe, AWS or your own backend that end up in client-side code — or in published source maps — are readable by anyone. A leaked secret key is a blank cheque against your account, and the bills arrive within hours.',
    how: 'They grep your served bundles and .map files for known key patterns. It is fully automated and takes seconds.',
    fix: 'Move every secret server-side, rotate anything that already shipped, and only ever expose publishable keys to the client.',
    scanner: 'secret_scan',
  },
  {
    name: 'Auth that lives in the UI, not the server',
    severity: 'High',
    owasp: 'A01 · Broken Access Control',
    what: 'Hiding an admin button is not access control. If the endpoint behind it answers without a valid session — or trusts an id straight from the request — the protection is theatre. This is the OWASP number-one risk, and it is invisible to a code review.',
    how: 'They change one digit in a request — /invoice/4912 becomes /invoice/4913 — and read data that is not theirs.',
    fix: 'Verify the session and the object owner on the server for every endpoint, never just in the front end.',
    scanner: 'web_scan + api_scan',
  },
  {
    name: 'Private files left public',
    severity: 'High',
    owasp: 'A05 · Security Misconfiguration',
    what: 'A committed .env, an exposed .git directory, a stray backup, or a live debug endpoint hands attackers your config and credentials directly. Generated apps leave these behind constantly.',
    how: 'They request the usual paths — /.env, /.git/config, /backup.zip — and read whatever the server returns.',
    fix: 'Block dotfiles and archives at the edge, and keep secrets out of the repository entirely.',
    scanner: 'web_scan',
  },
  {
    name: 'Missing security headers',
    severity: 'Medium',
    owasp: 'A05 · Security Misconfiguration',
    what: 'Content-Security-Policy, HSTS, and X-Frame-Options are a ten-minute fix most generated apps skip. They blunt cross-site scripting, protocol downgrades, and clickjacking — the cheapest hardening you can buy.',
    how: 'They read your response headers. Their absence is the tell that nobody hardened the deploy.',
    fix: 'Set CSP, HSTS, X-Frame-Options and X-Content-Type-Options in your hosting config or middleware.',
    scanner: 'web_scan',
  },
  {
    name: 'Weak or misconfigured TLS',
    severity: 'Medium',
    owasp: 'A02 · Cryptographic Failures',
    what: 'An expired certificate, a deprecated cipher, or a missing HTTPS redirect quietly downgrades every visitor. It stays invisible until someone is on the same network as your user.',
    how: 'They inspect your certificate chain and negotiated ciphers, then sit on the wire for the rest.',
    fix: 'Auto-renew certificates, force HTTPS, and disable legacy TLS versions and ciphers.',
    scanner: 'ssl_scan',
  },
];

export default function VibeCodedSecurityGuidePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavbarDownwards />

      <main className="grow bg-white pb-12 dark:bg-black">
        <ArticleHero
          title="Scan Your Vibe-Coded App: The Security Guide AI Skips"
          subtitle="AI ships your app in a weekend and skips the boring, invisible parts — the database rules, the leaked keys, the access checks. Here are the six holes it leaves behind, how attackers find them, and how to close every one."
          categories={['Vibe-Coded Security', 'Application Security']}
          date="June 22, 2026"
        />

        {/* Stakes — the hook */}
        <section className="mx-auto max-w-3xl px-4 py-2">
          <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            Wiz Research found that roughly <span className="font-semibold text-zinc-900 dark:text-zinc-100">one in five</span> AI-built
            apps ships with a real security hole — most often a database anyone can read. The
            average breach now runs past <span className="font-semibold text-zinc-900 dark:text-zinc-100">$4.8 million</span>, and the
            window between a flaw going public and being weaponized is down to hours. None of these
            holes break your app — the page loads, the demo works — which is exactly why they sit
            there until someone finds them. This guide walks the six that show up most in apps built
            with Bolt, Lovable, v0, Replit and Cursor: what each is, how an attacker finds it, the
            exact fix, and the Cystene scanner that catches it.
          </p>
        </section>

        {/* Platform callout (top) */}
        <section className="py-6">
          <CysteneCallout />
        </section>

        {/* Thesis — SAST vs DAST */}
        <section className="mx-auto max-w-3xl px-4 py-8">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Reading the code is not testing the app
          </h2>
          <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            Today&apos;s coding models are good reviewers — point one at your repo and it catches
            unsanitized inputs and missing checks. That is static analysis, and it genuinely raises
            your baseline. But every model shares the same blind spot: it reads the source. It never
            logs in, never sends a real request, never sees how the deployed system behaves under an
            attacker&apos;s hands.
          </p>
          <p className="mt-4 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            The running app is a different artifact than the code that produced it — shaped by
            config, headers, environment variables, and the database. The most common flaw in
            AI-built apps proves the point. The code looks perfect in review; the bug only appears in
            a live request:
          </p>

          <div className="mx-auto my-6 max-w-2xl overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <span className="text-emerald-600 dark:text-[#3AFF00]">GET</span>{' '}
              <span className="text-zinc-700 dark:text-zinc-300">/invoice/4912</span>
              <span className="ml-2 text-zinc-400">→ 200 OK · yours</span>
            </div>
            <div className="px-4 py-3">
              <span className="text-emerald-600 dark:text-[#3AFF00]">GET</span>{' '}
              <span className="text-zinc-700 dark:text-zinc-300">/invoice/4913</span>
              <span className="ml-2 text-red-500">→ 200 OK · someone else&apos;s</span>
            </div>
          </div>

          <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            No reviewer flags this — the code did exactly what it was written to do. Only a test that
            actually sends the second request finds it. That is dynamic testing, and it is the half
            an AI reviewer can never reach.
          </p>
        </section>

        {/* Why AI ships these */}
        <section className="mx-auto max-w-3xl px-4 py-8">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Why AI ships these holes
          </h2>
          <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            AI coding tools optimize for one thing: code that runs. Ask for an invoice page and you
            get a working invoice page. What you do not get is the part no prompt asks for — the
            row-level policy on the database, the header config on the deploy, the check that the
            invoice is actually yours. Those live <span className="italic">outside</span> the code the
            model writes, in config and access rules it never sees.
          </p>
          <p className="mt-4 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            So the app works on the first try and ships with the security of a building that has
            doors but no locks. The six holes below are not exotic — they are the predictable blind
            spots of generating an app instead of hardening one.
          </p>
        </section>

        {/* The six risks — data-driven cards */}
        <section className="mx-auto max-w-3xl px-4 py-8">
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            The six holes AI-built apps ship with
          </h2>
          <p className="mb-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Ordered by how much they hurt. Each is real, common, and quietly invisible until someone
            finds it — and each is tagged with the scanner that catches it.
          </p>
          <div className="flex flex-col gap-4">
            {risks.map((risk) => (
              <RiskCard key={risk.name} risk={risk} />
            ))}
          </div>
        </section>

        {/* The two fixes that matter most — concrete code */}
        <section className="mx-auto max-w-3xl px-4 py-8">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            The two fixes worth doing first
          </h2>
          <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            Two of the six close the most common critical findings. Neither takes ten minutes. First,
            lock every table with a deny-by-default policy so the public key only ever returns the
            caller&apos;s own rows:
          </p>

          <div className="mx-auto my-6 max-w-2xl overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
            <div className="text-zinc-400 dark:text-zinc-500">-- lock the table, then allow only the owner&apos;s rows</div>
            <div><span className="text-emerald-600 dark:text-[#3AFF00]">ALTER TABLE</span> users <span className="text-emerald-600 dark:text-[#3AFF00]">ENABLE ROW LEVEL SECURITY</span>;</div>
            <div className="mt-2"><span className="text-emerald-600 dark:text-[#3AFF00]">CREATE POLICY</span> &quot;owner reads own row&quot;</div>
            <div className="pl-4">ON users <span className="text-emerald-600 dark:text-[#3AFF00]">FOR ALL USING</span> (auth.uid() = id);</div>
          </div>

          <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            Then set the headers most generated apps ship without. Four lines turn off the easiest
            attacks against your front end:
          </p>

          <div className="mx-auto my-6 max-w-2xl overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
            <div><span className="text-emerald-600 dark:text-[#3AFF00]">Content-Security-Policy</span>: default-src &apos;self&apos;</div>
            <div><span className="text-emerald-600 dark:text-[#3AFF00]">Strict-Transport-Security</span>: max-age=63072000</div>
            <div><span className="text-emerald-600 dark:text-[#3AFF00]">X-Frame-Options</span>: DENY</div>
            <div><span className="text-emerald-600 dark:text-[#3AFF00]">X-Content-Type-Options</span>: nosniff</div>
          </div>

          <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            Both show up on every scan until they are in place — which is the point of running one.
          </p>
        </section>

        {/* What a Cystene scan does — the product reveal */}
        <section className="mx-auto max-w-3xl px-4 py-8">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            What a Cystene scan actually does
          </h2>
          <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            You can verify all six by hand. Or you point Cystene at your live URL and it runs the
            attacker&apos;s playbook for you, safely — the difference between an AI that reviews your
            code and a scanner that tests your app:
          </p>
          <ul className="mt-4 flex flex-col gap-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-br from-[#3AFF00] to-[#23FFF6]" />
              <span><span className="font-semibold text-zinc-900 dark:text-zinc-100">From the outside (DAST)</span> — ports, DNS, SSL/TLS, headers, exposed files, and the app-layer checks above, run against your real deployment.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-br from-[#3AFF00] to-[#23FFF6]" />
              <span><span className="font-semibold text-zinc-900 dark:text-zinc-100">From the inside (credentialed)</span> — host, cloud, and domain audits using credentials you control, for the holes a URL scan can never see.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-linear-to-br from-[#3AFF00] to-[#23FFF6]" />
              <span><span className="font-semibold text-zinc-900 dark:text-zinc-100">An audit-ready report</span> — every finding with a severity, a CWE / OWASP / MITRE mapping, and a copy-paste fix. The data-minimizing checks prove a table is open without ever reading a row.</span>
            </li>
          </ul>
          <p className="mt-5 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            The free tier covers the external checks and needs no card. Ship fast — just do not ship
            blind.
          </p>
        </section>

        {/* Platform callout (bottom) — CTA flavored */}
        <section className="border-t border-zinc-200 py-12 dark:border-zinc-800">
          <CysteneCallout
            heading="Find your six before an attacker does"
            body="Point Cystene at your live app and get all six checks — plus internal, credentialed audits — in a single scan, each with a fix you can paste straight in."
            ctaLabel="Scan my app free"
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
