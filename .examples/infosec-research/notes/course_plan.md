# Comprehensive Cybersecurity Learning Course Plan

## Course Structure: 16 Progressive Lessons

### **FOUNDATION TRACK (Lessons 1-6)**
Docker-based targets, fundamental skills, Mac terminal focus

### **INTERMEDIATE TRACK (Lessons 7-12)**
VMware environments, enterprise attacks, physical access

### **ADVANCED TRACK (Lessons 13-16)**
Specialized domains (cloud, mobile, binary), red teaming

---

## DETAILED LESSON PLAN

### **LESSON 1: Reconnaissance & OSINT** ✅ COMPLETE
- **Target**: DVWA on Docker, public websites
- **Skills**: Network discovery, service enumeration, information gathering
- **Mac Tools**: `brew install nmap nikto gobuster theharvester masscan`
- **Kali Alternative**: Pre-installed tools
- **Custom Scripts**:
  - `port_scanner.py` - TCP/UDP scanning basics
  - `dir_buster.sh` - Web directory enumeration

---

### **LESSON 2: Web Application Exploitation** ✅ COMPLETE
- **Target**: DVWA, WebGoat, Juice Shop (Docker)
- **Skills**: SQLi, Command Injection, XSS, File Upload, LFI
- **Mac Tools**: `brew install sqlmap wfuzz jwt-cli`
- **Kali Tools**: Burp Suite Community, OWASP ZAP
- **Custom Scripts**:
  - `sql_injector.py` - Manual SQL injection
  - `cmd_injector.py` - Command injection automation

---

### **LESSON 3: Physical Access & Client-Side Attacks**
- **Target**: Your own MacBook/Windows machine (controlled)
- **Skills**: USB attacks, phishing, browser exploitation, keylogging
- **Mac Tools**: `brew install metasploit ettercap dsniff`
- **Topics Covered**:
  - **MacBook Access**: 
    - Single user mode bypass
    - Firmware password bypass
    - USB Rubber Ducky payloads
    - Keychain extraction
  - **Windows Access**:
    - Kon-Boot, Hiren's Boot CD
    - SAM file extraction
    - Sticky Keys backdoor
  - **Client-Side**:
    - Browser exploitation (BeEF)
    - Malicious Office macros
    - PDF exploits
- **Custom Scripts**:
  - `usb_payload_generator.py` - Create HID attack payloads
  - `phishing_server.py` - Credential harvesting page

---

### **LESSON 4: Post-Exploitation & Privilege Escalation**
- **Target**: Vulnerable Linux container + local Mac
- **Skills**: Linux/macOS privilege escalation, persistence
- **Mac Tools**: `brew install pwntools radare2`
- **GitHub Tools**: LinPEAS, linux-exploit-suggester, PEASS-ng
- **macOS Specific**:
  - SIP bypass techniques
  - LaunchAgent persistence
  - Keychain dumping
  - dylib injection
- **Custom Scripts**:
  - `privesc_scanner.py` - SUID/capability finder
  - `mac_persistence.sh` - macOS backdoor installer

---

### **LESSON 5: Network Service Exploitation**
- **Target**: Metasploitable2 VM (VMware)
- **Skills**: SMB, SSH, FTP, RDP, database exploitation
- **Mac Tools**: `brew install smbclient enum4linux crackmapexec`
- **Kali Tools**: Built-in service exploitation tools
- **Custom Scripts**:
  - `service_scanner.py` - Multi-protocol vulnerability scanner

---

### **LESSON 6: Password Attacks & Cryptography**
- **Target**: Hash dumps, network captures, encrypted files
- **Skills**: Hash cracking, rainbow tables, pass-the-hash, keychain attacks
- **Mac Tools**: `brew install hashcat john hydra aircrack-ng`
- **macOS Specific**:
  - Keychain password extraction
  - FileVault2 attacks
  - Safari password dumping
- **Custom Scripts**:
  - `hash_identifier.py` - Detect hash types
  - `keychain_dumper.py` - macOS keychain extraction

---

### **LESSON 7: Wireless & Bluetooth Security**
- **Target**: Home network, Bluetooth devices
- **Skills**: WPA2 cracking, evil twin, Bluetooth exploitation
- **Mac Tools**: `brew install aircrack-ng reaver bettercap`
- **Hardware**: Alpha wireless adapter (monitor mode)
- **Topics**:
  - Wi-Fi deauth attacks
  - WPS exploitation
  - Bluetooth sniffing
  - AirDrop/AirPlay attacks (macOS specific)
- **Custom Scripts**:
  - `wifi_recon.py` - Network mapping
  - `bluetooth_scanner.py` - BLE device enumeration

---

### **LESSON 8: Mobile Device Attacks**
- **Target**: Android emulator, iOS simulator, physical devices
- **Skills**: Mobile app pentesting, device exploitation
- **Mac Tools**: `brew install apktool jadx frida objection`
- **GitHub Tools**: MobSF, needle (iOS)
- **Topics**:
  - **Android**: APK reversing, root detection bypass, SSL pinning
  - **iOS**: IPA analysis, jailbreak detection bypass, Keychain dumping
  - **Physical Access**: USB debugging, backup extraction
- **Custom Scripts**:
  - `apk_analyzer.py` - Automated APK analysis
  - `ios_backup_extractor.py` - iTunes backup parsing

---

### **LESSON 9: Active Directory & Windows Attacks**
- **Target**: Windows Server 2019 DC (VMware)
- **Skills**: Kerberoasting, DCSync, Golden Tickets, lateral movement
- **Mac Tools**: `brew install impacket` (via Python)
- **GitHub Tools**: BloodHound, Rubeus, Mimikatz
- **Windows from Mac**:
  - Remote exploitation via Impacket
  - PowerShell Empire from Mac
  - Wine for Windows tools
- **Custom Scripts**:
  - `kerberos_enum.py` - Service account discovery
  - `ad_password_spray.py` - Smart password spraying

---

### **LESSON 10: macOS Security & Exploitation**
- **Target**: macOS VM or test Mac
- **Skills**: macOS specific vulnerabilities and defenses
- **Topics**:
  - Gatekeeper bypass
  - TCC (Transparency, Consent, Control) bypass
  - Swift/Objective-C exploitation
  - macOS malware development
  - KEXT attacks
- **Tools**: `osxcollector`, `KnockKnock`, `TaskExplorer`
- **Custom Scripts**:
  - `mac_enum.py` - macOS enumeration
  - `tcc_bypass.py` - TCC database manipulation

---

### **LESSON 11: Command & Control Operations**
- **Target**: Multi-OS environment
- **Skills**: C2 frameworks, covert channels, OPSEC
- **Mac Tools**: Install via git/docker
- **GitHub C2**: Sliver, Mythic, Empire, Merlin
- **Cross-Platform C2**:
  - macOS implants
  - Windows beacons
  - Linux agents
- **Custom Scripts**:
  - `dns_beacon.py` - DNS exfiltration
  - `c2_connector.py` - Custom implant

---

### **LESSON 12: Evasion & Anti-Forensics**
- **Target**: Systems with AV/EDR
- **Skills**: AV bypass, log clearing, steganography
- **Mac Tools**: `brew install exiftool steghide`
- **GitHub Tools**: Veil, ScareCrow, Donut
- **macOS Evasion**:
  - XProtect bypass
  - Code signing bypass
  - Unified log manipulation
- **Custom Scripts**:
  - `log_cleaner.py` - Multi-OS log clearing
  - `payload_obfuscator.py` - Shellcode encoding

---

### **LESSON 13: Cloud & Container Security**
- **Target**: AWS/Azure free tier, Docker/Kubernetes
- **Skills**: Cloud exploitation, container escapes
- **Mac Tools**: `brew install aws-cli azure-cli kubectl`
- **GitHub Tools**: ScoutSuite, Pacu, kube-hunter
- **Topics**:
  - S3 bucket exploitation
  - IAM privilege escalation
  - Docker breakouts
  - Kubernetes attacks
- **Custom Scripts**:
  - `cloud_enum.py` - Multi-cloud resource discovery

---

### **LESSON 14: Web3 & Smart Contract Security**
- **Target**: Ethereum testnets, vulnerable contracts
- **Skills**: Smart contract exploitation, wallet attacks
- **Mac Tools**: `brew install ethereum mythril`
- **Topics**:
  - Reentrancy attacks
  - Integer overflow/underflow
  - Wallet security
  - NFT vulnerabilities
- **Custom Scripts**:
  - `contract_scanner.py` - Vulnerability detection

---

### **LESSON 15: Binary Exploitation & Reverse Engineering**
- **Target**: CTF challenges, macOS/Linux binaries
- **Skills**: Buffer overflows, ROP, heap exploitation
- **Mac Tools**: `brew install gdb radare2 ghidra`
- **Python**: `pip install pwntools capstone`
- **macOS Binary Exploitation**:
  - Mach-O format
  - dyld exploitation
  - Objective-C runtime attacks
- **Custom Scripts**:
  - `exploit_template.py` - Pwntools boilerplate
  - `rop_finder.py` - ROP gadget discovery

---

### **LESSON 16: Red Team Capstone Project**
- **Target**: Complete corporate environment simulation
- **Scenario**: Full kill chain with physical + digital access
- **Phases**:
  1. OSINT & Reconnaissance
  2. Phishing & Initial Access (client-side)
  3. Physical penetration (USB/badge cloning)
  4. Internal network compromise
  5. Lateral movement to Domain Admin
  6. Data exfiltration
  7. Covering tracks
- **Custom Scripts**:
  - `operation_logger.py` - Complete attack documentation
  - `report_generator.py` - Professional pentest report

---

## Script Organization

```
/scripts/
├── lesson_01_recon/
│   ├── port_scanner.py
│   └── dir_buster.sh
├── lesson_02_web_exploitation/
│   ├── sql_injector.py
│   └── cmd_injector.py
├── lesson_03_physical_access/
│   ├── usb_payload_generator.py
│   └── phishing_server.py
├── lesson_04_post_exploitation/
│   ├── privesc_scanner.py
│   └── mac_persistence.sh
├── lesson_05_network_services/
│   └── service_scanner.py
├── lesson_06_passwords/
│   ├── hash_identifier.py
│   ├── keychain_dumper.py
│   └── password_cracker.sh
├── lesson_07_wireless/
│   ├── wifi_recon.py
│   └── bluetooth_scanner.py
├── lesson_08_mobile/
│   ├── apk_analyzer.py
│   └── ios_backup_extractor.py
├── lesson_09_active_directory/
│   ├── kerberos_enum.py
│   └── ad_password_spray.py
├── lesson_10_macos/
│   ├── mac_enum.py
│   └── tcc_bypass.py
├── lesson_11_c2/
│   ├── dns_beacon.py
│   └── c2_connector.py
├── lesson_12_evasion/
│   ├── log_cleaner.py
│   └── payload_obfuscator.py
├── lesson_13_cloud/
│   └── cloud_enum.py
├── lesson_14_web3/
│   └── contract_scanner.py
├── lesson_15_binary/
│   ├── exploit_template.py
│   └── rop_finder.py
├── lesson_16_capstone/
│   ├── operation_logger.py
│   └── report_generator.py
└── common/
    ├── reverse_shell_gen.sh
    └── utils.py
```

## Required Infrastructure

### **Foundation (Lessons 1-6)**
- Docker Desktop for Mac
- Basic Python environment
- USB drive for physical attacks

### **Intermediate (Lessons 7-12)**
- VMware Fusion (3-4 VMs)
- Kali Linux VM (optional)
- Windows 10/11 VM
- Windows Server 2019 VM
- Wi-Fi adapter with monitor mode

### **Advanced (Lessons 13-16)**
- AWS/Azure free tier
- Android emulator (Android Studio)
- iOS simulator (Xcode)
- Binary analysis tools

## Key Mac-Specific Tools Installation

```bash
# Core penetration testing
brew install nmap masscan nikto gobuster sqlmap hydra john hashcat metasploit

# Network tools
brew install aircrack-ng bettercap ettercap wireshark tcpdump

# Binary/RE tools
brew install radare2 binwalk gdb

# Cloud/container
brew install aws-cli azure-cli kubectl docker

# Development
brew install python3 go rust node

# Python packages
pip3 install impacket pwntools requests beautifulsoup4 scapy
```

## Learning Path Philosophy

1. **Start with web apps** (easiest entry point)
2. **Add physical access** (real-world scenarios)
3. **Master OS-specific attacks** (Windows/macOS/Linux)
4. **Mobile & wireless** (expanding attack surface)
5. **Enterprise environments** (AD, cloud)
6. **Advanced exploitation** (binary, smart contracts)
7. **Combine everything** (red team operations)

Each lesson builds on previous knowledge while introducing new attack vectors that reflect real-world penetration testing scenarios.