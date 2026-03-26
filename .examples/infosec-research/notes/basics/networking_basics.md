# Networking Fundamentals for Cybersecurity

## OSI Model Overview

| Layer | Name | Purpose | Examples | Security Relevance |
|-------|------|---------|----------|-------------------|
| 7 | Application | User interface | HTTP, SSH, DNS | Application attacks, protocol abuse |
| 6 | Presentation | Data formatting | SSL/TLS, encryption | Cryptographic attacks |
| 5 | Session | Managing connections | NetBIOS, RPC | Session hijacking |
| 4 | Transport | End-to-end delivery | TCP, UDP | Port scanning, connection attacks |
| 3 | Network | Routing | IP, ICMP | Network reconnaissance, routing attacks |
| 2 | Data Link | Local network | Ethernet, WiFi | ARP poisoning, WiFi attacks |
| 1 | Physical | Physical medium | Cables, radio | Physical access, signal interception |

## TCP/IP Stack Essentials

### IP Addresses
```bash
# IPv4 structure
192.168.1.100/24
# Network: 192.168.1.0
# Host: 100
# Subnet mask: 255.255.255.0 (/24)

# Private IP ranges (RFC 1918)
10.0.0.0/8        # 10.0.0.0 - 10.255.255.255
172.16.0.0/12     # 172.16.0.0 - 172.31.255.255  
192.168.0.0/16    # 192.168.0.0 - 192.168.255.255

# Special addresses
127.0.0.1         # Loopback (localhost)
0.0.0.0           # Any address
169.254.0.0/16    # Link-local (APIPA)
```

### Ports and Services
```bash
# Well-known ports (0-1023)
21    # FTP
22    # SSH
23    # Telnet
25    # SMTP
53    # DNS
80    # HTTP
110   # POP3
143   # IMAP
443   # HTTPS
993   # IMAPS
995   # POP3S

# Common high ports
3306  # MySQL
3389  # RDP (Remote Desktop)
5432  # PostgreSQL
5900  # VNC
8080  # HTTP alternate
8443  # HTTPS alternate
```

### TCP vs UDP
| TCP | UDP |
|-----|-----|
| Connection-oriented | Connectionless |
| Reliable delivery | Best effort |
| Flow control | No flow control |
| Slower | Faster |
| HTTP, SSH, FTP | DNS, DHCP, SNMP |

## DNS Fundamentals

### DNS Record Types
```bash
A       # Maps domain to IPv4
AAAA    # Maps domain to IPv6
CNAME   # Canonical name (alias)
MX      # Mail exchange
NS      # Name server
TXT     # Text records
SOA     # Start of authority
PTR     # Reverse DNS lookup
```

### DNS Queries
```bash
# Basic DNS lookup
nslookup google.com
dig google.com

# Specific record types
dig google.com MX
dig google.com TXT
dig @8.8.8.8 google.com  # Use specific DNS server

# Reverse DNS
dig -x 8.8.8.8
```

## Subnetting Basics

### CIDR Notation
```bash
/24 = 255.255.255.0   # 256 addresses, 254 usable
/25 = 255.255.255.128 # 128 addresses, 126 usable
/26 = 255.255.255.192 # 64 addresses, 62 usable
/27 = 255.255.255.224 # 32 addresses, 30 usable
/28 = 255.255.255.240 # 16 addresses, 14 usable
/29 = 255.255.255.248 # 8 addresses, 6 usable
/30 = 255.255.255.252 # 4 addresses, 2 usable
```

### Subnet Calculation
```bash
# Example: 192.168.1.0/26
# Subnet mask: 255.255.255.192
# Subnets:
# 192.168.1.0/26   (0-63)
# 192.168.1.64/26  (64-127)
# 192.168.1.128/26 (128-191)
# 192.168.1.192/26 (192-255)
```

## Network Protocols Security Implications

### HTTP/HTTPS
- **HTTP**: Plaintext, vulnerable to interception
- **HTTPS**: Encrypted with TLS/SSL
- **Attacks**: Man-in-the-middle, SSL stripping, certificate issues

### SSH (Secure Shell)
- **Port**: 22
- **Purpose**: Secure remote access
- **Attacks**: Brute force, key-based attacks, version vulnerabilities

### FTP (File Transfer Protocol)
- **Ports**: 21 (control), 20 (data)
- **Security Issues**: Plaintext passwords, passive/active mode confusion
- **Secure Alternatives**: SFTP (SSH), FTPS (SSL)

### SMTP/POP3/IMAP
- **Ports**: 25 (SMTP), 110 (POP3), 143 (IMAP)
- **Security**: Often unencrypted, use secure versions (465, 993, 995)

### SNMP (Simple Network Management Protocol)
- **Ports**: 161 (agent), 162 (manager)
- **Security Issues**: Default community strings, information disclosure

## NAT and Firewalls

### Network Address Translation (NAT)
```bash
# NAT types affect security scanning
Full Cone NAT      # Most permissive
Restricted NAT     # Restricted by IP
Port Restricted NAT # Restricted by IP and port
Symmetric NAT      # Different mapping for each destination
```

### Firewall Concepts
- **Stateless**: Examines each packet independently
- **Stateful**: Tracks connection state
- **Application Layer**: Inspects application data
- **Next-Generation**: Includes IPS, application awareness

## Network Troubleshooting Commands

### Connectivity Testing
```bash
# Test reachability
ping google.com
ping6 google.com

# Trace route
traceroute google.com
traceroute6 google.com

# Test specific ports
telnet google.com 80
nc -zv google.com 80
```

### Network Information
```bash
# Show network interfaces (Linux/macOS)
ifconfig
ip addr show

# Show routing table
route -n
ip route show

# Show network connections
netstat -tuln
ss -tuln

# Show ARP table
arp -a
ip neighbor show
```

### Packet Capture
```bash
# Basic packet capture
tcpdump -i any
tcpdump -i eth0 host 192.168.1.100
tcpdump -i eth0 port 80

# Advanced filtering
tcpdump -i eth0 'tcp port 80 and host 192.168.1.100'
tcpdump -i eth0 'icmp or arp'
```

## Wireless Networking Basics

### 802.11 Standards
- **802.11a**: 5GHz, 54 Mbps
- **802.11b**: 2.4GHz, 11 Mbps  
- **802.11g**: 2.4GHz, 54 Mbps
- **802.11n**: 2.4/5GHz, 600 Mbps
- **802.11ac**: 5GHz, 1+ Gbps
- **802.11ax**: 2.4/5GHz, 9+ Gbps

### WiFi Security
- **Open**: No encryption (avoid!)
- **WEP**: Broken, easily cracked
- **WPA**: Better than WEP, still vulnerable
- **WPA2**: Current standard (AES encryption)
- **WPA3**: Latest standard (enhanced security)

## Security Implications by Protocol

### Insecure Protocols (Avoid)
- **Telnet**: Plaintext remote access
- **FTP**: Plaintext file transfer
- **HTTP**: Plaintext web traffic
- **SNMP v1/v2c**: Plaintext network management
- **TFTP**: Trivial file transfer, no authentication

### Secure Alternatives
- **SSH**: Instead of Telnet
- **SFTP/FTPS**: Instead of FTP
- **HTTPS**: Instead of HTTP
- **SNMP v3**: Instead of SNMP v1/v2c
- **Secure protocols**: Use encryption and authentication

## Quick Reference

### Port Scanning Concepts
```bash
# Open port: Service accepting connections
# Closed port: No service, but port reachable
# Filtered port: Firewall blocking access

# TCP scan types
SYN scan     # Stealth scan
Connect scan # Full connection
ACK scan     # Firewall detection
FIN scan     # Stealth alternative
```

### Network Segmentation
- **DMZ**: Demilitarized zone for public services
- **VLAN**: Virtual LAN segmentation
- **Subnetting**: Logical network division
- **Microsegmentation**: Granular security boundaries

This networking foundation is essential for understanding how network-based attacks work and how to defend against them.