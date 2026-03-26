# LESSON 15: Threat Intelligence & Incident Response

## Objective
Master threat intelligence collection, analysis, and incident response methodologies. Learn to use the MITRE ATT&CK framework, conduct threat hunting, and perform digital forensics investigations.

## Prerequisites
- Lessons 1-14 completed
- Understanding of network protocols
- Knowledge of operating system artifacts
- Familiarity with log analysis

## Phase 1: Threat Intelligence Fundamentals

### Step 1: Threat Intelligence Sources
```bash
# Open Source Intelligence (OSINT)
# AlienVault OTX
curl -H "X-OTX-API-KEY: YOUR_API_KEY" https://otx.alienvault.com/api/v1/indicators/domain/example.com/general

# VirusTotal API
curl -H "x-apikey: YOUR_API_KEY" https://www.virustotal.com/api/v3/domains/example.com

# Shodan API
curl -H "Authorization: YOUR_API_KEY" "https://api.shodan.io/shodan/host/8.8.8.8"

# ThreatCrowd API
curl "https://www.threatcrowd.org/searchApi/v2/domain/report/?domain=example.com"

# URLVoid API
curl "http://api.urlvoid.com/1000/YOUR_API_KEY/host/example.com/"
```

### Step 2: IOC Collection and Analysis
```python
# Indicator of Compromise (IOC) extraction
import re
import hashlib

def extract_iocs(text):
    iocs = {}
    
    # IP addresses
    ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
    iocs['ips'] = re.findall(ip_pattern, text)
    
    # Domain names
    domain_pattern = r'\b[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}\b'
    iocs['domains'] = re.findall(domain_pattern, text)
    
    # URLs
    url_pattern = r'https?://[^\s<>"\'|(){}[\]`]+'
    iocs['urls'] = re.findall(url_pattern, text)
    
    # File hashes (MD5, SHA1, SHA256)
    md5_pattern = r'\b[a-fA-F0-9]{32}\b'
    sha1_pattern = r'\b[a-fA-F0-9]{40}\b'
    sha256_pattern = r'\b[a-fA-F0-9]{64}\b'
    
    iocs['md5_hashes'] = re.findall(md5_pattern, text)
    iocs['sha1_hashes'] = re.findall(sha1_pattern, text)
    iocs['sha256_hashes'] = re.findall(sha256_pattern, text)
    
    # Email addresses
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    iocs['emails'] = re.findall(email_pattern, text)
    
    return iocs

# Example usage
threat_report = """
The malware communicates with C2 server at 192.168.1.100 and evil-domain.com.
It downloads additional payloads from https://malicious-site.com/payload.exe
File hash: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
"""

found_iocs = extract_iocs(threat_report)
for ioc_type, indicators in found_iocs.items():
    print(f"{ioc_type}: {indicators}")
```

### Step 3: MITRE ATT&CK Framework
```python
# ATT&CK technique mapping
mitre_attack_map = {
    "T1566": {
        "technique": "Phishing",
        "tactic": "Initial Access",
        "description": "Adversaries may send phishing messages to gain access",
        "subtechniques": ["T1566.001", "T1566.002", "T1566.003"]
    },
    "T1059": {
        "technique": "Command and Scripting Interpreter", 
        "tactic": "Execution",
        "description": "Adversaries may abuse command and script interpreters",
        "subtechniques": ["T1059.001", "T1059.003", "T1059.005"]
    },
    "T1055": {
        "technique": "Process Injection",
        "tactic": "Defense Evasion",
        "description": "Adversaries may inject code into processes",
        "subtechniques": ["T1055.001", "T1055.002", "T1055.012"]
    }
}

def map_to_attack(observed_behavior):
    """Map observed behavior to MITRE ATT&CK techniques"""
    techniques = []
    
    if "powershell" in observed_behavior.lower():
        techniques.append("T1059.001")
    if "cmd.exe" in observed_behavior.lower():
        techniques.append("T1059.003")
    if "phishing" in observed_behavior.lower():
        techniques.append("T1566")
    if "process injection" in observed_behavior.lower():
        techniques.append("T1055")
        
    return techniques
```

## Phase 2: Threat Hunting

### Step 4: Hypothesis-Driven Hunting
```bash
# Hypothesis: Attackers are using PowerShell for persistence
# Hunt for suspicious PowerShell usage

# Windows Event Logs
Get-WinEvent -LogName "Microsoft-Windows-PowerShell/Operational" | 
Where-Object {$_.Message -match "DownloadString|IEX|Invoke-Expression|EncodedCommand"}

# Process monitoring with Sysmon
Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" -FilterXPath "*[System[EventID=1] and EventData[Data[@Name='CommandLine'] and contains(., 'powershell')]]"

# Registry persistence hunting
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"
```

### Step 5: Network-Based Hunting
```bash
# DNS hunting for C2 domains
# Look for suspicious domain patterns
dig +short txt _dmarc.suspicious-domain.com

# Certificate transparency hunting
curl -s "https://crt.sh/?q=%.evil.com&output=json" | jq -r '.[].name_value' | sort -u

# Network flow analysis
# Zeek/Bro log analysis
cat conn.log | zeek-cut id.orig_h id.resp_h id.resp_p proto conn_state | 
grep -E "(192\.168\.|10\.|172\.)" | sort | uniq -c | sort -nr

# Hunt for data exfiltration patterns
awk '$7 > 1000000 {print $1, $2, $3, $7}' conn.log  # Large uploads
```

### Step 6: Host-Based Hunting
```bash
# File system hunting
# Recently created executables
find / -type f -name "*.exe" -newermt "2023-01-01" 2>/dev/null
find /tmp -type f -executable -newermt "1 day ago"

# Unusual file locations
find /var/tmp -name "*.exe" -o -name "*.dll" -o -name "*.scr"
ls -la /dev/shm/  # Check for in-memory file systems

# Process hunting
# Long-running processes with network connections
netstat -tulnp | awk '{print $7}' | cut -d'/' -f1 | sort | uniq -c | sort -nr

# Processes running from unusual locations
ps aux | grep -E "/(tmp|var/tmp|dev/shm|home)"

# Memory analysis hunting
volatility -f memory.dump --profile=Win10x64 pslist
volatility -f memory.dump --profile=Win10x64 netscan
volatility -f memory.dump --profile=Win10x64 malfind
```

## Phase 3: Digital Forensics

### Step 7: Disk Imaging and Acquisition
```bash
# Create forensic image with dd
dd if=/dev/sda of=/forensics/disk_image.dd bs=4096 conv=noerror,sync status=progress

# Calculate hash for integrity
sha256sum /forensics/disk_image.dd > /forensics/disk_image.sha256

# Mount image read-only
mkdir /mnt/forensic_image
mount -o ro,loop,noexec,nodev /forensics/disk_image.dd /mnt/forensic_image

# Alternative: Use specialized forensic tools
# dc3dd (enhanced dd)
dc3dd if=/dev/sda of=/forensics/disk_image.dd hash=sha256 log=/forensics/acquisition.log

# FTK Imager (Windows)
# Autopsy (cross-platform)
# SANS SIFT Workstation
```

### Step 8: File System Analysis
```bash
# File system timeline generation
fls -r -m "/" /forensics/disk_image.dd > filesystem_timeline.bodyfile
mactime -d -b filesystem_timeline.bodyfile > timeline.csv

# Deleted file recovery
foremost -i /forensics/disk_image.dd -o /forensics/recovered_files/
scalpel /forensics/disk_image.dd -o /forensics/carved_files/

# Registry analysis (Windows)
regripper -r /mnt/forensic_image/Windows/System32/config/SOFTWARE -p all
regripper -r /mnt/forensic_image/Users/user/NTUSER.DAT -p all

# Prefetch analysis (Windows)
python3 prefetch_parser.py /mnt/forensic_image/Windows/Prefetch/
```

### Step 9: Memory Forensics
```bash
# Volatility memory analysis
# Profile identification
volatility -f memory.dump imageinfo

# Process analysis  
volatility -f memory.dump --profile=Win10x64 pslist
volatility -f memory.dump --profile=Win10x64 psscan  # Find hidden processes
volatility -f memory.dump --profile=Win10x64 pstree

# Network analysis
volatility -f memory.dump --profile=Win10x64 netscan
volatility -f memory.dump --profile=Win10x64 netstat

# Malware hunting
volatility -f memory.dump --profile=Win10x64 malfind
volatility -f memory.dump --profile=Win10x64 yarascan -Y malware_rules.yar

# Process memory dumps
volatility -f memory.dump --profile=Win10x64 procdump -p 1234 -D ./dumps/
volatility -f memory.dump --profile=Win10x64 dlldump -p 1234 -D ./dumps/
```

### Step 10: Log Analysis
```bash
# Windows Event Log analysis
# Security events
Get-WinEvent -LogName Security | Where-Object {$_.Id -eq 4624}  # Successful logons
Get-WinEvent -LogName Security | Where-Object {$_.Id -eq 4625}  # Failed logons
Get-WinEvent -LogName Security | Where-Object {$_.Id -eq 4648}  # Explicit credentials

# System events
Get-WinEvent -LogName System | Where-Object {$_.Id -eq 7045}    # Service installation

# Linux log analysis
# Authentication logs
grep "Failed password" /var/log/auth.log | awk '{print $1, $2, $3, $11}' | sort | uniq -c

# SSH analysis
grep "sshd" /var/log/auth.log | grep "Accepted\|Failed"

# Web server logs
awk '{print $1}' /var/log/apache2/access.log | sort | uniq -c | sort -nr | head -20
grep -E "(union|select|drop|insert|update)" /var/log/apache2/access.log
```

## Phase 4: Incident Response

### Step 11: Incident Response Methodology
```python
# NIST Incident Response Framework
incident_phases = {
    "preparation": [
        "Establish incident response team",
        "Create incident response procedures", 
        "Deploy monitoring and detection tools",
        "Train personnel"
    ],
    "detection_analysis": [
        "Monitor security events",
        "Analyze alerts and indicators",
        "Determine incident scope",
        "Document findings"
    ],
    "containment_eradication_recovery": [
        "Isolate affected systems",
        "Remove malware and threats",
        "Patch vulnerabilities", 
        "Restore systems from backups"
    ],
    "post_incident_activity": [
        "Document lessons learned",
        "Update procedures",
        "Improve security controls",
        "Share threat intelligence"
    ]
}

def incident_response_playbook(incident_type):
    """Generate IR playbook based on incident type"""
    playbooks = {
        "malware": [
            "Isolate infected systems",
            "Collect malware samples",
            "Analyze malware capabilities", 
            "Search for additional infections",
            "Remove malware and restore systems"
        ],
        "data_breach": [
            "Assess scope of compromised data",
            "Notify stakeholders and authorities",
            "Preserve evidence",
            "Contain the breach",
            "Implement additional security controls"
        ],
        "insider_threat": [
            "Preserve user activity logs",
            "Interview relevant personnel",
            "Review access controls",
            "Disable compromised accounts",
            "Implement monitoring controls"
        ]
    }
    
    return playbooks.get(incident_type, ["Follow general IR procedures"])
```

### Step 12: Evidence Collection and Chain of Custody
```bash
# Evidence collection checklist
EVIDENCE_LOG="evidence_$(date +%Y%m%d_%H%M%S).log"

# Document system state
echo "=== EVIDENCE COLLECTION START ===" >> $EVIDENCE_LOG
echo "Date: $(date)" >> $EVIDENCE_LOG  
echo "Investigator: $(whoami)" >> $EVIDENCE_LOG
echo "System: $(hostname)" >> $EVIDENCE_LOG
echo "OS: $(uname -a)" >> $EVIDENCE_LOG

# Network connections
netstat -an > network_connections.txt
ss -tuln > socket_connections.txt

# Running processes
ps aux > running_processes.txt
top -b -n1 > system_state.txt

# Memory acquisition
# Linux memory acquisition
cat /proc/kcore > memory_dump.raw 2>/dev/null  # May not work on all systems
# Better: Use dedicated tools like LiME

# Windows memory acquisition  
# Use DumpIt, FTK Imager, or WinPmem

# Hash all evidence
find ./evidence/ -type f -exec sha256sum {} \; > evidence_hashes.txt
```

### Step 13: Malware Analysis in IR Context
```bash
# Rapid malware triage
file suspicious_binary
strings suspicious_binary | head -50
hexdump -C suspicious_binary | head -20

# Dynamic analysis in sandbox
# Automated analysis with Cuckoo Sandbox
python3 cuckoo.py submit suspicious_binary

# Manual dynamic analysis
strace -o system_calls.log ./suspicious_binary &
MALWARE_PID=$!

# Monitor file system changes
inotifywait -m -r /tmp /var/tmp /home >> file_changes.log &

# Network monitoring
tcpdump -i any -w network_activity.pcap &
sleep 60  # Let malware run
kill $MALWARE_PID
```

## Phase 5: Threat Intelligence Production

### Step 14: Intelligence Analysis and Reporting
```python
# Threat intelligence report structure
def generate_threat_report(indicators, analysis):
    report = {
        "executive_summary": {
            "threat_level": "HIGH/MEDIUM/LOW",
            "key_findings": [],
            "recommendations": []
        },
        "technical_analysis": {
            "attack_vectors": [],
            "ttps": [],  # Tactics, Techniques, Procedures
            "indicators": {
                "network": [],
                "host": [],
                "behavioral": []
            }
        },
        "attribution": {
            "threat_actor": "",
            "confidence_level": "HIGH/MEDIUM/LOW",
            "supporting_evidence": []
        },
        "timeline": [],
        "iocs": indicators,
        "mitre_attack_mapping": []
    }
    return report

# IOC confidence scoring
def calculate_ioc_confidence(ioc_data):
    confidence_score = 0
    
    # Source credibility
    if ioc_data.get('source') == 'government':
        confidence_score += 30
    elif ioc_data.get('source') == 'commercial':
        confidence_score += 20
    elif ioc_data.get('source') == 'community':
        confidence_score += 10
        
    # Multiple sources
    if ioc_data.get('source_count', 1) > 3:
        confidence_score += 20
        
    # Age of intelligence
    age_days = ioc_data.get('age_days', 0)
    if age_days < 7:
        confidence_score += 20
    elif age_days < 30:
        confidence_score += 10
        
    return min(confidence_score, 100)
```

### Step 15: Threat Intelligence Sharing
```python
# STIX/TAXII implementation for threat sharing
from stix2 import Indicator, Bundle, Malware, AttackPattern

def create_stix_indicator(ioc_value, ioc_type):
    """Create STIX indicator object"""
    
    if ioc_type == "domain":
        pattern = f"[domain-name:value = '{ioc_value}']"
    elif ioc_type == "ip":
        pattern = f"[ipv4-addr:value = '{ioc_value}']" 
    elif ioc_type == "file_hash":
        pattern = f"[file:hashes.SHA-256 = '{ioc_value}']"
    
    indicator = Indicator(
        pattern=pattern,
        labels=["malicious-activity"],
        name=f"Malicious {ioc_type}",
        description=f"Observed malicious {ioc_type} indicator"
    )
    
    return indicator

# Threat intelligence feeds
def consume_threat_feeds():
    """Consume external threat intelligence feeds"""
    feeds = [
        "https://rules.emergingthreats.net/open/suricata/rules/",
        "https://www.malwaredomainlist.com/mdlcsv.php",
        "https://zeustracker.abuse.ch/monitor.php?urlfeed=csv"
    ]
    
    for feed_url in feeds:
        # Download and parse feed
        # Update local threat intelligence database
        pass
```

## Custom Scripts Usage

### threat_hunter.py
```bash
# Automated threat hunting framework
python3 scripts/lesson_15_threat_intelligence/threat_hunter.py --hunt-type powershell --timeframe 24h --output hunting_results.json
```

### ioc_enrichment.py
```bash
# IOC enrichment and analysis
python3 scripts/lesson_15_threat_intelligence/ioc_enrichment.py --ioc-file indicators.txt --sources vt,otx,shodan --output enriched_iocs.json
```

## Evidence Collection

### Step 16: Document Threat Intelligence Operations
```bash
# Threat hunting results
echo "$(date): Threat hunting campaign completed - found 15 suspicious indicators" >> threat_hunting_log.txt

# Incident response documentation
echo "$(date): Incident IR-2023-001 contained and eradicated" >> incident_response_log.txt

# Forensic investigation summary
sha256sum evidence/* > forensic_evidence_integrity.txt
```

## Success Criteria

✓ Threat intelligence sources identified and utilized
✓ IOCs extracted and analyzed
✓ MITRE ATT&CK framework applied
✓ Threat hunting campaigns executed
✓ Digital forensics investigation completed
✓ Memory forensics performed
✓ Incident response procedures followed
✓ Custom scripts functioning

## Threat Intelligence Pyramid

```
    Strategic Intelligence (Why?)
         ↑
    Operational Intelligence (How?)
         ↑
    Tactical Intelligence (What?)
```

### Intelligence Types
- **Strategic**: Long-term trends, threat landscape, policy decisions
- **Operational**: Campaign analysis, attribution, TTPs  
- **Tactical**: IOCs, signatures, immediate defensive actions

## MITRE ATT&CK Tactics

| Tactic | Description | Example Techniques |
|--------|-------------|-------------------|
| Initial Access | Get into network | Phishing, Exploit Public-Facing App |
| Execution | Run malicious code | Command Line Interface, PowerShell |
| Persistence | Maintain foothold | Registry Run Keys, Scheduled Tasks |
| Privilege Escalation | Higher-level permissions | Process Injection, Valid Accounts |
| Defense Evasion | Avoid detection | Obfuscation, Disable Security Tools |
| Credential Access | Steal credentials | Credential Dumping, Brute Force |
| Discovery | Learn environment | System Information Discovery |
| Lateral Movement | Move through network | Remote Services, Pass the Hash |
| Collection | Gather data | Data from Local System |
| Exfiltration | Steal data | Exfiltration Over C2 Channel |
| Impact | Manipulate/destroy | Data Destruction, Service Stop |

## Incident Response Best Practices

### Preparation
- Incident response team and roles defined
- Communication plans established  
- Tools and procedures documented
- Regular training and exercises

### Detection & Analysis
- Centralized logging and monitoring
- Alert triage and prioritization
- Evidence preservation procedures
- Initial damage assessment

### Containment, Eradication & Recovery
- Short-term and long-term containment
- System hardening and patching
- Evidence-based eradication
- Gradual system restoration

### Post-Incident Activity
- Lessons learned documentation
- Process improvement recommendations
- Staff debriefings
- Legal and regulatory compliance

## Next Lesson Preview
**Lesson 16**: Secure Development & DevSecOps
- Secure coding practices
- Security testing integration
- Container and cloud security