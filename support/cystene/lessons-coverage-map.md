# Cystene — Lessons & Scripts Coverage Map

Ce implementam si ce NU implementam din materialele de cercetare (`infosec-research/`), cu explicatii.

Cystene e o **platforma completa de cybersecurity** — pre-exploitation, exploitation, post-exploitation. Daca user-ul da acces (SSH, credentiale, API keys, APK upload), facem tot.

**Sursa:** `.examples/infosec-research/lessons/` (17 lectii) + `.examples/infosec-research/scripts/` (13 scripturi) + `support/cystene/readings/BHPCode/` (Black Hat Python, 11 capitole) + `support/cystene/readings/BHRCode/` (Black Hat Rust, 14 capitole)

---

## Overview — Cross-Reference Complet (BHP × BHR × Lessons)

### Black Hat Python (Seitz/Arnold, 2nd Ed) — 11 capitole

| BHP Ch | Subiect | BHR Echivalent | Lesson | Status |
|---|---|---|---|---|
| Ch 1: Setting Up Python | Kali Linux, Python 3, IDE | BHR Ch1 (setup, Rust intro) | — | N/A (setup) |
| Ch 2: Basic Networking Tools | TCP/UDP client, netcat, TCP proxy, SSH with Paramiko, SSH tunneling | BHR Ch2 (port scanning), BHR Ch3 (async networking) | **Lesson 1, 4** | ✅ → port_scan, host_audit_scan |
| Ch 3: Writing a Sniffer | UDP host discovery, packet sniffing, IP/ICMP decoding | BHR Ch2 (host discovery) | **Lesson 1, 5** | ✅ → port_scan |
| Ch 4: Owning the Network with Scapy | ARP cache poisoning, email credential stealing, pcap processing | — | **Lesson 5** (partial) | ❌ MITM — necesita pozitie in retea |
| Ch 5: Web Hackery | Directory brute-forcing, web app mapping, HTML form brute-forcing | BHR Ch4 (modular HTTP checks), BHR Ch5 (web crawling) | **Lesson 1, 2, 6** | ✅ → web_scan, active_web_scan, password_audit_scan |
| Ch 6: Extending Burp Proxy | Burp fuzzing, Bing dorking, website content → password lists | BHR Ch6 (finding vulnerabilities) | **Lesson 2, 6** | ✅ partial → active_web_scan, password_audit_scan |
| Ch 7: GitHub Command and Control | C2 via GitHub, trojan modules, import hacking | BHR Ch10 (modern RAT) | **Lesson 13** | ❌ C2 framework — offensive tooling |
| Ch 8: Common Trojaning Tasks | Keylogging, screenshots, shellcode execution, sandbox detection | BHR Ch8 (shellcodes in Rust) | **Lesson 13** | ❌ Trojaning — offensive tooling |
| Ch 9: Fun with Exfiltration | File encryption, email/web exfiltration | — | **Lesson 13** | ❌ Exfiltration — offensive |
| Ch 10: Windows Privilege Escalation | Process monitor, WMI, token privileges, race conditions | — | **Lesson 4, 9, 10** | ✅ → host_audit_scan (detection) |
| Ch 11: Offensive Forensics | Volatility, memory forensics, vulnerability reconnaissance | BHR Ch6 (CWE/CVE taxonomy) | **Lesson 15** | ✅ partial → Finding compliance metadata |

### Black Hat Rust (Kerkour) — 14 capitole

| BHR Ch | Subiect | BHP Echivalent | Lesson | Status |
|---|---|---|---|---|
| Ch 1: Introduction | Types of attacks, phases, attacker profiles, setup, SHA-1 hash cracker | BHP Ch1 (setup) | — | N/A (setup) |
| Ch 2: Multi-threaded Attack Surface Discovery | Subdomain enum (crt.sh), port scanning (TCP connect), rayon threadpool, multithreading | BHP Ch2 (TCP client), BHP Ch3 (sniffer, host discovery) | **Lesson 1, 5** | ✅ → port_scan, dns_scan |
| Ch 3: Going Full Speed with Async | Tokio, cooperative vs preemptive scheduling, async port scan, channels, bounded concurrency | BHP Ch2 (TCP networking — async variant) | **Lesson 1** | ✅ → port_scan (asyncio pattern) |
| Ch 4: Adding Modules with Trait Objects | Generics, traits, modular HTTP checks (.git/HEAD, .env, directory listing, Kibana, Traefik, GitLab, Elasticsearch) | BHP Ch5 (web hackery, directory brute-forcing) | **Lesson 1, 2** | ✅ → web_scan (file discovery), active_web_scan |
| Ch 5: Crawling the Web for OSINT | OSINT, search engines, IoT/Shodan, social media, web crawler in Rust, crawling HTML/JSON/JS apps | BHP Ch5 (web mapping) | **Lesson 12** | ✅ partial → dns_scan (OSINT pasiv) |
| Ch 6: Finding Vulnerabilities | CWE vs CVE, web vulnerabilities, SQLi, XSS, SSRF, CSRF, open redirect, subdomain takeover, LFI, DoS, buffer overflow, RCE, bug hunting, automated audits | BHP Ch5 (web hackery), BHP Ch6 (Burp fuzzing) | **Lesson 2, 15, 17** | ✅ → active_web_scan, vuln_scan, Finding metadata |
| Ch 7: Exploit Development | Finding exploits, creating crate as lib+binary, exploitation toolkit, CVE-2019-11229, CVE-2021-3156 | — (BHP nu are exploit dev) | **Lesson 14** | ❌ Exploit development — nu automatizabil |
| Ch 8: Writing Shellcodes in Rust | Shellcode, assembly, `no_std`, linker scripts, reverse TCP shell in Rust | BHP Ch8 (shellcode execution in Python) | **Lesson 13, 14** | ❌ Shellcodes — offensive tooling |
| Ch 9: Phishing with WebAssembly | Social engineering, phishing pages, evil twin attack, WebAssembly client, email sending in Rust | — (BHP nu are phishing dedicat) | **Lesson 12** | ❌ Phishing — manual, nu automatizabil |
| Ch 10: A Modern RAT | RAT architecture, C2 channels (HTTP/DNS/domain fronting), agent design, Docker for offensive security | BHP Ch7 (GitHub C2), BHP Ch8 (trojaning) | **Lesson 13** | ❌ RAT/C2 — offensive tooling |
| Ch 11: Securing Communications with E2E Encryption | CIA triad, threat modeling, cryptography (hash, MAC, KDF, block ciphers, AEAD), asymmetric encryption, DH, signatures, TLS | — (BHP nu are crypto dedicat) | **Lesson 6, 16** | ✅ partial → ssl_scan (crypto/TLS concepts) |
| Ch 12: Going Multi-platform | Cross-compilation, Dockerfiles, arm64, binary optimization, packers, persistence, single instance | BHP Ch8 (trojaning — persistence) | **Lesson 13** | ❌ Persistence/packers — offensive tooling |
| Ch 13: Turning RAT into a Worm | Worm spreading techniques, SSH spreading, cross-platform worm implementation | — (BHP nu are worms) | **Lesson 13** | ❌ Worms — offensive tooling |
| Ch 14: Conclusion | What wasn't covered, leaked repos, OPSEC, how bad guys get caught | — | — | N/A (conclusion) |

### Rezumat Overview

| Sursa | Total capitole | ✅ Implementate | ❌ Excluse | N/A |
|---|---|---|---|---|
| Black Hat Python | 11 | 6 | 4 (ARP/MITM, C2, trojaning, exfiltration) | 1 (setup) |
| Black Hat Rust | 14 | 5 (+1 partial) | 6 (exploit dev, shellcodes, phishing, RAT, multi-platform, worms) | 2 (setup, conclusion) |
| Lessons | 17 | 14 | 2 (physical access, red team C2, binary RE) | 1 (wireless — future) |

**Ce implementam din carti:** Reconnaissance (BHP Ch2-3, BHR Ch2-3), web discovery + vulnerability detection (BHP Ch5-6, BHR Ch4-6), privilege escalation detection (BHP Ch10), cryptography/TLS analysis (BHR Ch11), OSINT (BHR Ch5), compliance metadata (BHR Ch6 CWE/CVE taxonomy, BHP Ch11 forensics).

**Ce NU implementam:** C2 frameworks (BHP Ch7, BHR Ch10), trojaning/shellcodes (BHP Ch8, BHR Ch8), exfiltration (BHP Ch9), exploit development (BHR Ch7), phishing infrastructure (BHR Ch9), worms/persistence (BHR Ch12-13), ARP/MITM (BHP Ch4).

---

## Lectii + Capitole din Carti (Detaliat)

Fiecare lectie din `infosec-research/` e bazata pe capitole din **Black Hat Python** (BHP) si **Black Hat Rust** (BHR). Mapping-ul complet:

| Lectie | BHP/BHR Capitole | Status | Ce preluam in Cystene | De ce DA / De ce NU |
|---|---|---|---|---|
| **Lesson 1: Intelligence Gathering** | BHP Ch2 (TCP client, netcat, SSH), BHP Ch3 (sniffer, host discovery), BHR Ch2 (subdomain enum, port scan, rayon), BHR Ch3 (async port scan, tokio) | ✅ | port_scan, dns_scan, web_scan (headers, file discovery, robots.txt) | Core scanning — reconnaissance din exterior |
| **Lesson 2: Web Exploitation** | BHP Ch5 (web hackery, directory brute-forcing, HTML form brute), BHP Ch6 (Burp fuzzing), BHR Ch4 (modular HTTP checks: .git, .env, directory listing), BHR Ch6 (SQLi, XSS, SSRF, CSRF, open redirect, LFI) | ✅ | active_web_scan — detection SQLi, XSS, command injection, LFI | Vulnerability detection pe web apps |
| **Lesson 3: Physical Access** | — (nu e in BHP/BHR) | ❌ | — | Necesita prezenta fizica la masina (USB boot, firmware bypass, badge cloning). Nu poti face remote nici cu agent. Singura lectie care e 100% fizica. |
| **Lesson 4: Post-Exploitation** | BHP Ch2 (SSH with Paramiko, SSH tunneling), BHP Ch10 (Windows privilege escalation, process monitor, WMI, token privileges) | ✅ | host_audit_scan — privilege escalation checks, SUID binaries, cron jobs, weak permissions, credential discovery. Se conecteaza prin SSH (Credential entity). | Daca user-ul da acces SSH, auditem masina din interior. Pattern din privesc_scanner.py. |
| **Lesson 5: Network Infrastructure** | BHP Ch3 (sniffer, IP/ICMP decoding), BHP Ch4 (Scapy, ARP, pcap), BHR Ch2 (port scanning, multithreading) | ✅ | vuln_scan (CVE matching), port_scan (banner + service + SMB enumeration). ARP/MITM din BHP Ch4 NU se implementeaza — necesita pozitie in retea. | Service version → CVE lookup. SMB-specific checks integrate in port scan. |
| **Lesson 6: Password Attacks** | BHP Ch5 (HTML form brute-forcing), BHP Ch6 (website content → password lists), BHR Ch1 (SHA-1 hash cracker), BHR Ch11 (cryptography, hash functions, block ciphers) | ✅ | password_audit_scan — brute force pe servicii detectate (SSH, FTP, HTTP login), weak password detection, default credentials check, weak hash detection | User-ul vrea sa stie daca serviciile lui au parole slabe. Pattern din hash_cracker.py. BHR Ch11 crypto concepts folosite in ssl_scan. |
| **Lesson 7: Wireless Security** | — (nu e in BHP/BHR) | ⏳ Future | Necesita agent fizic (Raspberry Pi sau masina in reteaua clientului cu adaptor WiFi). Nu poti scana WiFi din cloud. | Pregatim arhitectura: `ScanJob.execution_point` = "cloud" sau "remote_agent". |
| **Lesson 8: Mobile Attacks** | — (nu e in BHP/BHR) | ✅ | mobile_scan — user uploadeaza APK, analizam server-side: hardcoded credentials, insecure storage, missing SSL pinning, exposed components, manifest analysis. Fisierul se sterge imediat dupa scanare. | User uploadeaza fisierul, noi il analizam. Pattern din apk_analyzer.py. |
| **Lesson 9: Active Directory** | BHP Ch10 (Windows privilege escalation — concepte de AD in contextul Windows) | ✅ | ad_audit_scan — 11 LDAP checks: Kerberoastable (SPN), ASREPRoastable (no preauth), unconstrained delegation, constrained delegation to sensitive services, stale accounts (90+ days), disabled accounts, privileged group membership, password policy, password never expires, orphaned admins (adminCount=1), reversible encryption. Uses ldap3 (no impacket — detection only). Necesita credentiale de domain (Credential entity). | Daca user-ul da credentiale de domain, auditem AD. Enterprise feature esential. |
| **Lesson 10: macOS Security** | BHP Ch10 (privilege escalation — adaptat macOS: SUID, LaunchAgents vs Windows services) | ✅ | host_audit_scan (acelasi scanner ca Lesson 4) — SIP status, TCC audit, FileVault status, SUID binaries, LaunchAgents suspect. Se conecteaza prin SSH (Credential entity). | macOS audit = subset de host audit prin SSH. Nu e un scanner separat, e acelasi host_audit cu detectie de OS. |
| **Lesson 11: Cloud Security** | — (nu e in BHP/BHR) | ✅ | cloud_audit_scan — S3 bucket exposure, IAM audit, security groups, metadata service, unencrypted storage, public snapshots. Necesita cloud API keys (Credential entity). | User-ul da API keys, noi auditem cloud-ul. Infrastructure.infra_type = "cloud_account". |
| **Lesson 12: Social Engineering** | BHR Ch5 (web crawling for OSINT, search engines, IoT/Shodan), BHR Ch9 (phishing with WebAssembly — concepte, nu implementare) | ✅ partial | dns_scan preia subdomain enumeration (crt.sh, OSINT pasiv). web_scan preia exposed info detection. | Partea automatizabila (OSINT pasiv din BHR Ch5). Phishing (BHR Ch9) e manual — nu le automatizam. |
| **Lesson 13: Red Team Operations** | BHP Ch7 (GitHub C2), BHP Ch8 (trojaning — keylogging, shellcode), BHP Ch9 (exfiltration), BHR Ch8 (shellcodes in Rust), BHR Ch10 (modern RAT — C2 channels, agent design), BHR Ch12 (multi-platform, packers, persistence), BHR Ch13 (worm spreading via SSH) | ❌ | — | C2 (BHP Ch7, BHR Ch10), trojaning (BHP Ch8, BHR Ch8), exfiltration (BHP Ch9), RAT (BHR Ch10), worms (BHR Ch13), persistence/packers (BHR Ch12) — toate sunt tool-uri ofensive manuale. Fiecare engagement e unic. |
| **Lesson 14: Binary Exploitation** | BHR Ch7 (exploit development — CVE exploitation, exploitation toolkit), BHR Ch8 (shellcodes — assembly, reverse TCP shell) | ❌ | — | Buffer overflow, ROP, exploit development (BHR Ch7), shellcodes (BHR Ch8). Necesita analiza manuala per-binary. Nu se automatizeaza. |
| **Lesson 15: Threat Intelligence** | BHP Ch11 (offensive forensics — Volatility, memory analysis, vuln recon), BHR Ch6 (CWE vs CVE, vulnerability taxonomy, bug hunting, automated audits) | ✅ | Finding entity: cve_id, cvss_score, cwe_id, mitre_tactic, mitre_technique, owasp_category. Compliance mapping in rapoarte. | BHR Ch6 vulnerability taxonomy (CWE/CVE) direct implementata in Finding fields. BHP Ch11 forensics concepts in rapoarte. |
| **Lesson 16: Secure Development** | BHR Ch11 (securing communications — E2E encryption, threat modeling, cryptography best practices) | ✅ partial | Finding.remediation_script — comanda/snippet copiabil de fix (chmod, nginx config, etc.). ssl_scan foloseste crypto concepts din BHR Ch11. Nu facem SAST. | BHR Ch11 crypto/TLS concepts folosite in ssl_scan. Remediation guidance cu script-uri copiabile. |
| **Lesson 17: API Security** | BHR Ch5 (crawling JSON API, JavaScript web apps), BHR Ch6 (SSRF, CSRF, injection, subdomain takeover, open redirect) | ✅ | api_scan — JWT analysis, GraphQL introspection, CORS, rate limiting, OpenAPI exposure | API scanning e esential. BHR Ch5 crawling + Ch6 vulnerability detection combined. |

### BHP Capitole fara lectie dedicata

| BHP Chapter | Subiect | Acoperit de | Status |
|---|---|---|---|
| **Ch 4: Owning the Network with Scapy** | ARP cache poisoning, email credential stealing, pcap | Lesson 5 (partial — network attacks) | ❌ ARP/MITM necesita pozitie in retea |

### BHR Capitole fara lectie dedicata

| BHR Chapter | Subiect | Acoperit de | Status |
|---|---|---|---|
| **Ch 9: Phishing with WebAssembly** | Phishing pages, evil twin, WebAssembly client | Lesson 12 (Social Engineering — concepte) | ❌ Phishing e manual |
| **Ch 10: A Modern RAT** | Remote Access Trojan, C2 channels, agent design | Lesson 13 (Red Team) | ❌ Offensive tooling |
| **Ch 11: Securing Communications** | E2E encryption, cryptography, TLS, threat modeling | Lesson 6 (crypto concepts), Lesson 16 (secure dev) | ✅ partial — crypto concepts in ssl_scan |
| **Ch 12: Going Multi-platform** | Cross-compilation, packers, persistence | Lesson 13 (Red Team) | ❌ Offensive tooling |
| **Ch 13: RAT into a Worm** | Worm spreading, SSH spreading | Lesson 13 (Red Team) | ❌ Offensive tooling |

---

## Scripturi

| Script | Status | Unde in Cystene | Explicatie |
|---|---|---|---|
| `lesson_01_recon/port_scanner.py` | ✅ | → `scanners/port_scan.py` | TCP connect, banner grabbing — baza port scanner-ului |
| `lesson_01_recon/dir_buster.sh` | ✅ | → `scanners/web_scan.py` (file/directory discovery) | 50+ paths comune (/.git/HEAD, /.env, /admin, /backup, /api/, /swagger) |
| `lesson_02_web_exploitation/sql_injector.py` | ✅ | → `scanners/active_web_scan.py` (detection) | SQLi detection — inject `'`, check SQL errors |
| `lesson_02_web_exploitation/cmd_injector.py` | ✅ | → `scanners/active_web_scan.py` (detection) | Command injection detection — inject marker, check output |
| `lesson_04_post_exploitation/privesc_scanner.py` | ✅ | → `scanners/host_audit_scan.py` | Privilege escalation audit prin SSH |
| `lesson_05_network_service/network_scanner.py` | ✅ | → `scanners/vuln_scan.py` (CVE matching) | KNOWN_VULNERABILITIES dict — service version → CVE lookup |
| `lesson_05_network_service/smb_exploit.py` | ✅ | → `scanners/port_scan.py` (SMB enumeration integrat) | SMB share detection, null sessions, version check — parte din port scan |
| `lesson_06_password_attacks/hash_cracker.py` | ✅ | → `scanners/password_audit_scan.py` | Weak hash detection, default credentials, brute force pe servicii |
| `lesson_08_mobile_attacks/apk_analyzer.py` | ✅ | → `scanners/mobile_scan.py` | APK analysis (user upload, scan, stergere imediata) |
| `lesson_07_wireless_security/wifi_cracker.py` | ⏳ | Future (remote_agent) | Necesita agent fizic — pregatim arhitectura |
| `lesson_03_physical_access/phishing_server.py` | ❌ | — | Social engineering manual, nu automatizabil |
| `lesson_03_physical_access/usb_payload_generator.py` | ❌ | — | Hardware fizic (USB Rubber Ducky). Nu e remote. |
| `common/reverse_shell_gen.sh` | ❌ | — | Offensive tooling manual — genereaza reverse shells. Nu e un feature de platforma. |

---

## Rezumat

| Categorie | Implementate | Future | Excluse | Total |
|---|---|---|---|---|
| Lectii | 14 | 1 (wireless) | 2 (physical, red team C2, binary RE) | 17 |
| Scripturi | 9 | 1 (wifi) | 3 (phishing, USB, reverse shell) | 13 |

**Ce implementam:** Reconnaissance, vulnerability detection, exploitation detection, post-exploitation audit, password audit, mobile analysis, cloud audit, AD audit, host audit, API scanning, compliance mapping, remediation guidance.

**Ce NU implementam:**
- **Physical access** (Lesson 3) — necesita prezenta fizica, nu e remote
- **Red Team C2** (Lesson 13) — tool-uri ofensive manuale, fiecare engagement e unic
- **Binary RE** (Lesson 14) — analiza manuala per-binary, nu e automatizabil

**Ce lasam pentru viitor:**
- **Wireless** (Lesson 7) — necesita agent fizic, pregatim arhitectura cu `ScanJob.execution_point`

**Principiu:** Cystene e o platforma Enterprise Security Posture Management (ESPM). Scaneaza din exterior (network/web) SI din interior (SSH, API keys, credentiale domain). Clasifica conform standardelor (CWE, OWASP, MITRE ATT&CK). Genereaza rapoarte audit-ready (SOC2, ISO27001, NIS2).

---

## Mapping la Scannere Cystene (12 total)

| # | Scanner Cystene | Tip | Lectii sursa | Scripturi sursa | Necesita |
|---|---|---|---|---|---|
| 1 | `port_scan.py` | Extern | Lesson 1, 5 | port_scanner.py, network_scanner.py, smb_exploit.py | Target (IP/domain) |
| 2 | `dns_scan.py` | Extern | Lesson 1, 12 | — | Target (domain) |
| 3 | `ssl_scan.py` | Extern | — (cryptography_basics.md) | — | Target (domain/IP) |
| 4 | `web_scan.py` | Extern | Lesson 1 | dir_buster.sh | Target (URL/domain) |
| 5 | `vuln_scan.py` | Extern | Lesson 5, 15 | network_scanner.py | Output de la port_scan |
| 6 | `api_scan.py` | Extern | Lesson 17 | — | Target (URL) |
| 7 | `active_web_scan.py` | Extern | Lesson 2, 17 | sql_injector.py, cmd_injector.py | Target (URL) + active_scan_consent |
| 8 | `password_audit_scan.py` | Extern | Lesson 6 | hash_cracker.py | Target (servicii detectate) |
| 9 | `host_audit_scan.py` | Intern (SSH) | Lesson 4, 10 | privesc_scanner.py | Credential (SSH key/password) |
| 10 | `cloud_audit_scan.py` | Intern (API) | Lesson 11 | — | Credential (cloud API keys) |
| 11 | `ad_audit_scan.py` | Intern (domain) | Lesson 9 | — | Credential (domain credentials) |
| 12 | `mobile_scan.py` | Upload | Lesson 8 | apk_analyzer.py | APK file upload OR URL download (scan & delete) |

### Categorii de scanare

- **Extern (7 scanners):** Nu necesita acces — scaneaza din internet. Port, DNS, SSL, Web, Vuln, API, Active Web.
- **Intern (3 scanners):** Necesita credentiale (Credential entity) — scaneaza din interior prin SSH/API. Host Audit, Cloud Audit, AD Audit.
- **Password Audit (1 scanner):** Testeaza parole slabe pe servicii detectate de port scan.
- **Upload (1 scanner):** User uploadeaza fisier (APK) — analizat server-side, sters imediat dupa scanare.

### Arhitectura necesara

| Concept | Entitate/Camp | De ce |
|---|---|---|
| Credentiale criptate | **Credential** (entitate noua) | SSH keys, cloud API keys, domain passwords — criptate cu Fernet. Un credential poate fi folosit de mai multe Infrastructure items. |
| Cloud infrastructure | **Infrastructure.infra_type** = "cloud_account" | S3/IAM/security groups nu sunt pe un IP, ci pe un cont cloud intreg |
| Scan execution context | **ScanJob.execution_point** = "cloud" / "remote_agent" | Pregateste arhitectura pt wireless (future agent fizic) |
| Remediation actionable | **Finding.remediation_script** | Comanda/snippet copiabil de fix (chmod 600, nginx config, AWS CLI) |
| Mobile file handling | Scanare temporara | APK uploadat sau descarcat de la URL → analizat → sters imediat. Nu stocam permanent fisiere mobile. |
| Scanner Dispatcher | **scan_job_subrouter.py** → `run_scan_job()` | Background task: asyncio.gather (parallel, partial results), fingerprint dedup, credential decrypt, security_score (0-100), severity counts. POST /start → return imediat → scan ruleaza in background. |
| Credential mapping | **build_credential_params()** | SSH → ssh_username/password/port. Cloud → aws_access_key_id/secret/region. AD → domain/dc_host/username/password/use_ssl. |
