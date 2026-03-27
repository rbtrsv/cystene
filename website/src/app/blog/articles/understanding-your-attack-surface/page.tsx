import React from 'react';
import { Metadata } from 'next';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import Footer from '@/modules/main/components/Footer/Footer';
import SimpleSection from '@/modules/blog/components/composed/SimpleSection';
import AlternativeArticleHeader from '@/modules/blog/components/composed/AlternativeArticleHeader';
import Text from '@/modules/blog/components/primitives/Text';
import UL from '@/modules/blog/components/primitives/UL';
import LI from '@/modules/blog/components/primitives/LI';
import Blockquote from '@/modules/blog/components/primitives/Blockquote';
import { generatePageMetadata } from '@/modules/blog/components/composed/PageSEO';

export const metadata: Metadata = generatePageMetadata({
  title: 'Understanding Your Attack Surface: DNS, SSL, and Web Security',
  description:
    'Learn how DNS enumeration, SSL/TLS analysis, and web security scanning work together to map your full attack surface and identify vulnerabilities before attackers do.',
  slug: 'blog/articles/understanding-your-attack-surface',
  type: 'article',
  publishDate: '2026-03-05',
  author: 'Cystene Team',
  keywords: [
    'Attack Surface',
    'DNS Enumeration',
    'SSL/TLS Analysis',
    'Web Security',
    'Security Headers',
    'Infrastructure Security',
  ],
});

export default function UnderstandingYourAttackSurfacePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarDownwards />
      <main className="grow bg-white dark:bg-black pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-12">

        <AlternativeArticleHeader
          title="Understanding Your Attack Surface: DNS, SSL, and Web Security"
          subtitle="Learn how DNS enumeration, SSL/TLS analysis, and web security scanning work together to map your full attack surface and identify vulnerabilities before attackers do."
          author="Cystene Team"
          publishDate="March 5, 2026"
          categories={[
            { label: 'Cybersecurity', variant: 'performance' },
            { label: 'Attack Surface', variant: 'energy' },
            { label: 'Infrastructure', variant: 'supplements' },
          ]}
        />

        <SimpleSection title="What Is an Attack Surface?">
          <Text>
            Your attack surface is the sum of all points where an unauthorized
            user could attempt to enter or extract data from your systems. It
            includes every domain, subdomain, IP address, open port, running
            service, and web endpoint that is reachable from the public internet.
          </Text>

          <UL>
            <LI>Domains and subdomains — including forgotten staging and dev environments</LI>
            <LI>IP addresses and open ports — every listener is a potential entry point</LI>
            <LI>SSL/TLS configurations — weak ciphers, expired certificates, protocol downgrades</LI>
            <LI>Web applications — missing security headers, exposed admin panels, verbose error pages</LI>
          </UL>

          <Blockquote>
            &ldquo;Attackers don&apos;t break in through your front door — they find the side door you forgot existed. Shadow IT, forgotten subdomains, and legacy services are where most breaches begin.&rdquo;
          </Blockquote>
        </SimpleSection>

        <SimpleSection title="DNS Enumeration: Mapping What You Own">
          <Text>
            DNS enumeration is the foundation of attack surface mapping. By
            querying DNS records, you discover every subdomain, mail server,
            name server, and service endpoint associated with your domain —
            including ones you may have forgotten about.
          </Text>

          <Text>
            Attackers routinely enumerate DNS as their first step in
            reconnaissance. If they find subdomains pointing to decommissioned
            servers, staging environments with default credentials, or internal
            services exposed to the public, they have an entry point.
          </Text>

          <UL>
            <LI>A/AAAA records — map domain names to IP addresses</LI>
            <LI>MX records — identify mail servers and their configurations</LI>
            <LI>NS records — reveal authoritative name servers</LI>
            <LI>TXT records — check for SPF, DKIM, and DMARC to prevent email spoofing</LI>
            <LI>CNAME records — detect dangling CNAMEs vulnerable to subdomain takeover</LI>
            <LI>Subdomain brute-force — discover hidden subdomains not in public records</LI>
          </UL>
        </SimpleSection>

        <SimpleSection title="SSL/TLS Analysis: Beyond the Padlock Icon">
          <Text>
            A valid SSL certificate does not mean your TLS configuration is
            secure. Certificate validity is the bare minimum — real TLS security
            requires proper cipher suite selection, protocol version enforcement,
            certificate chain validation, and expiry monitoring.
          </Text>

          <Blockquote>
            &ldquo;Over 30% of publicly reachable servers still support TLS 1.0 or 1.1, both of which have known vulnerabilities. A green padlock in the browser does not mean the connection is actually secure.&rdquo;
          </Blockquote>

          <UL>
            <LI>Certificate validation — hostname match, chain completeness, expiry date</LI>
            <LI>Protocol versions — ensure TLS 1.2+ only, no SSLv3/TLS 1.0/1.1</LI>
            <LI>Cipher suite analysis — identify weak ciphers (RC4, DES, export-grade)</LI>
            <LI>HSTS enforcement — verify HTTP Strict Transport Security is configured</LI>
          </UL>
        </SimpleSection>

        <SimpleSection title="Web Security: Headers, Configurations, and Exposures">
          <Text>
            Web security scanning examines the HTTP layer for misconfigurations
            and missing protections. Security headers are the first line of
            defense against common web attacks — and they are trivially easy to
            check, yet frequently missing.
          </Text>

          <UL>
            <LI>Content-Security-Policy (CSP) — prevents XSS and code injection</LI>
            <LI>X-Frame-Options — blocks clickjacking attacks</LI>
            <LI>X-Content-Type-Options — prevents MIME type sniffing</LI>
            <LI>Strict-Transport-Security (HSTS) — enforces HTTPS connections</LI>
            <LI>Server header disclosure — leaking web server version information</LI>
            <LI>Directory listing — exposing file structures to anyone who visits</LI>
          </UL>

          <Text>
            Each missing header is a missed opportunity to prevent an entire
            class of attacks. Most can be added with a single configuration
            line — the cost of implementation is near zero, but the protection
            is significant.
          </Text>
        </SimpleSection>

        <SimpleSection title="How Cystene Brings It Together">
          <Text>
            Cystene scans all four dimensions — ports, DNS, SSL/TLS, and web
            security — in a single assessment. Instead of running separate tools
            for each check and manually correlating results, you get a unified
            view of your attack surface with prioritized findings ranked by
            severity.
          </Text>

          <UL>
            <LI>Four scan types running in parallel against your verified targets</LI>
            <LI>Unified findings with severity ratings from critical to informational</LI>
            <LI>Discovered assets mapped into a single infrastructure view</LI>
            <LI>Exportable reports for compliance reviews and stakeholder briefings</LI>
          </UL>

          <Text>
            One scan. One dashboard. Your full attack surface. That&apos;s the
            Cystene approach — because your security posture should not depend
            on how many separate tools you can manage.
          </Text>
        </SimpleSection>

      </main>
      <Footer />
    </div>
  );
}
