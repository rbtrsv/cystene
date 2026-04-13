"""
Target Verification Utilities

Verifies that a user owns the target they want to scan.
Three verification methods: DNS TXT, file upload, meta tag.

Why: Legal and ethical requirement — scanning infrastructure you don't own
is unauthorized access. Every external scanning platform (Qualys, Tenable,
Intrudify) requires target verification before scanning.

Dependencies: dnspython (DNS queries), httpx (HTTP requests) — both already installed.
"""

import asyncio
import logging
import re
import uuid

import dns.resolver
import httpx

logger = logging.getLogger(__name__)


# ==========================================
# Token Generation
# ==========================================

def generate_verification_token() -> str:
    """
    Generate a unique verification token for a scan target.

    Why uuid4: cryptographically random, no collisions across orgs.
    Why prefix: makes it easy to identify in DNS records / files.
    Format: "cystene-verify-{24 hex chars}" (e.g., "cystene-verify-a1b2c3d4e5f6a1b2c3d4e5f6")
    """
    return f"cystene-verify-{uuid.uuid4().hex[:24]}"


# ==========================================
# DNS TXT Verification
# ==========================================

async def verify_dns_txt(domain: str, token: str) -> bool:
    """
    Check if the domain has a TXT record containing the verification token.

    User adds this TXT record to their domain:
        cystene-verify=cystene-verify-a1b2c3d4e5f6a1b2c3d4e5f6

    We check all TXT records for the domain and look for a match.

    Why asyncio.to_thread: dns.resolver is synchronous (blocking UDP calls).
    to_thread runs it in a thread pool so it doesn't block the event loop.

    Args:
        domain: Domain to check (e.g., "example.com")
        token: Expected verification token

    Returns:
        True if TXT record containing the token is found
    """
    try:
        resolver = dns.resolver.Resolver()
        resolver.lifetime = 10.0  # Why 10s: DNS propagation can be slow

        # Why asyncio.to_thread: dns.resolver.resolve() is blocking I/O
        answers = await asyncio.to_thread(resolver.resolve, domain, "TXT")

        for answer in answers:
            txt_value = str(answer).strip('"')
            # Check if the TXT record contains our token
            # Why contains (not exact match): record might have other content alongside
            if token in txt_value:
                logger.info(f"DNS TXT verification successful for {domain}")
                return True

        logger.info(f"DNS TXT verification failed for {domain} — token not found in {len(answers.rrset)} TXT records")
        return False

    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
        logger.info(f"DNS TXT verification failed for {domain} — no TXT records found")
        return False
    except dns.resolver.Timeout:
        logger.warning(f"DNS TXT verification timeout for {domain}")
        return False
    except Exception as e:
        logger.error(f"DNS TXT verification error for {domain}: {e}")
        return False


# ==========================================
# File Upload Verification
# ==========================================

async def verify_file_upload(target_value: str, token: str) -> bool:
    """
    Check if the target serves the verification token at a well-known path.

    User places a file at:
        https://{target}/.well-known/cystene-verify.txt

    The file must contain the verification token (can contain other text too).

    Why .well-known: RFC 8615 standard directory for site-wide metadata.
    Same pattern as Let's Encrypt (ACME), Google Search Console, etc.

    Args:
        target_value: Domain or URL to check (e.g., "example.com")
        token: Expected verification token

    Returns:
        True if the file exists and contains the token
    """
    # Normalize to full URL
    if target_value.startswith("http://") or target_value.startswith("https://"):
        base_url = target_value.rstrip("/")
    else:
        base_url = f"https://{target_value}"

    url = f"{base_url}/.well-known/cystene-verify.txt"

    try:
        async with httpx.AsyncClient(timeout=10, verify=False, follow_redirects=True) as client:
            resp = await client.get(url)

            if resp.status_code != 200:
                logger.info(f"File verification failed for {target_value} — HTTP {resp.status_code}")
                return False

            content = resp.text.strip()

            if token in content:
                logger.info(f"File verification successful for {target_value}")
                return True

            logger.info(f"File verification failed for {target_value} — token not found in response")
            return False

    except httpx.TimeoutException:
        logger.warning(f"File verification timeout for {target_value}")
        return False
    except Exception as e:
        logger.error(f"File verification error for {target_value}: {e}")
        return False


# ==========================================
# Meta Tag Verification
# ==========================================

async def verify_meta_tag(target_value: str, token: str) -> bool:
    """
    Check if the target's homepage contains a verification meta tag.

    User adds to their homepage <head>:
        <meta name="cystene-verify" content="cystene-verify-a1b2c3d4e5f6a1b2c3d4e5f6">

    We fetch the homepage and look for this meta tag.

    Why regex not BeautifulSoup: single regex is simpler and faster than
    parsing the entire DOM. We only need one specific tag.

    Args:
        target_value: Domain or URL to check (e.g., "example.com")
        token: Expected verification token

    Returns:
        True if the meta tag with matching content is found
    """
    # Normalize to full URL
    if target_value.startswith("http://") or target_value.startswith("https://"):
        url = target_value
    else:
        url = f"https://{target_value}"

    try:
        async with httpx.AsyncClient(timeout=10, verify=False, follow_redirects=True) as client:
            resp = await client.get(url)

            if resp.status_code != 200:
                logger.info(f"Meta tag verification failed for {target_value} — HTTP {resp.status_code}")
                return False

            html = resp.text

            # Why regex: faster than full HTML parsing for a single meta tag lookup
            # Matches: <meta name="cystene-verify" content="TOKEN">
            # Handles: single/double quotes, whitespace, attribute order
            pattern = r'<meta\s+[^>]*name\s*=\s*["\']cystene-verify["\'][^>]*content\s*=\s*["\']([^"\']*)["\'][^>]*/?>'
            match = re.search(pattern, html, re.IGNORECASE)

            if match and token in match.group(1):
                logger.info(f"Meta tag verification successful for {target_value}")
                return True

            # Also check reversed attribute order: content before name
            pattern_rev = r'<meta\s+[^>]*content\s*=\s*["\']([^"\']*)["\'][^>]*name\s*=\s*["\']cystene-verify["\'][^>]*/?>'
            match_rev = re.search(pattern_rev, html, re.IGNORECASE)

            if match_rev and token in match_rev.group(1):
                logger.info(f"Meta tag verification successful for {target_value} (reversed attr order)")
                return True

            logger.info(f"Meta tag verification failed for {target_value} — tag not found in HTML")
            return False

    except httpx.TimeoutException:
        logger.warning(f"Meta tag verification timeout for {target_value}")
        return False
    except Exception as e:
        logger.error(f"Meta tag verification error for {target_value}: {e}")
        return False
