#!/usr/bin/env python3
"""
Script Name: network_scanner.py
Lesson: 05 - Network Service Exploitation
Similar to: nmap, masscan
Description: Comprehensive network service scanner with vulnerability detection

Usage:
    python3 network_scanner.py --target 192.168.1.0/24 --ports 21,22,80,443
    python3 network_scanner.py --target single_host --scan-all
    python3 network_scanner.py --target 10.0.0.1 --service-detection

Educational Notes:
    - Demonstrates socket programming for network scanning
    - Shows service fingerprinting techniques
    - Teaches vulnerability detection methods
"""

import argparse
import ipaddress
import socket
import threading
import time
from datetime import datetime
import json

class NetworkScanner:
    def __init__(self, threads=50, timeout=3):
        self.threads = threads
        self.timeout = timeout
        self.open_ports = {}
        self.services = {}
        self.vulnerabilities = {}
        
        # Common service banners for fingerprinting
        self.service_signatures = {
            21: {'name': 'FTP', 'banners': ['FTP', 'File Transfer Protocol']},
            22: {'name': 'SSH', 'banners': ['SSH', 'OpenSSH']},
            23: {'name': 'Telnet', 'banners': ['Telnet', 'login:']},
            25: {'name': 'SMTP', 'banners': ['SMTP', 'mail']},
            53: {'name': 'DNS', 'banners': []},
            80: {'name': 'HTTP', 'banners': ['HTTP', 'Server:']},
            110: {'name': 'POP3', 'banners': ['POP3', '+OK']},
            135: {'name': 'RPC', 'banners': []},
            139: {'name': 'NetBIOS', 'banners': []},
            143: {'name': 'IMAP', 'banners': ['IMAP', '* OK']},
            443: {'name': 'HTTPS', 'banners': []},
            445: {'name': 'SMB', 'banners': []},
            993: {'name': 'IMAPS', 'banners': []},
            995: {'name': 'POP3S', 'banners': []},
            1433: {'name': 'MSSQL', 'banners': []},
            3306: {'name': 'MySQL', 'banners': []},
            3389: {'name': 'RDP', 'banners': []},
            5432: {'name': 'PostgreSQL', 'banners': []},
        }

    def scan_port(self, host, port):
        """Scan a single port on a host"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(self.timeout)
            result = sock.connect_ex((host, port))
            
            if result == 0:
                if host not in self.open_ports:
                    self.open_ports[host] = []
                self.open_ports[host].append(port)
                
                # Try to grab banner
                banner = self.grab_banner(host, port)
                service = self.identify_service(port, banner)
                
                if host not in self.services:
                    self.services[host] = {}
                self.services[host][port] = {
                    'service': service,
                    'banner': banner
                }
                
                # Check for vulnerabilities
                vulns = self.check_vulnerabilities(host, port, service, banner)
                if vulns:
                    if host not in self.vulnerabilities:
                        self.vulnerabilities[host] = {}
                    self.vulnerabilities[host][port] = vulns
                
                print(f"[+] {host}:{port} - {service} - {banner[:50] if banner else 'No banner'}")
            
            sock.close()
        except Exception as e:
            pass

    def grab_banner(self, host, port, timeout=2):
        """Attempt to grab service banner"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            sock.connect((host, port))
            
            # Send appropriate probe based on port
            if port == 80:
                sock.send(b"GET / HTTP/1.1\r\nHost: " + host.encode() + b"\r\n\r\n")
            elif port == 25:
                sock.send(b"EHLO test\r\n")
            elif port == 21:
                pass  # FTP usually sends banner immediately
            else:
                sock.send(b"\r\n")
            
            banner = sock.recv(1024).decode('utf-8', errors='ignore').strip()
            sock.close()
            return banner
        except:
            return ""

    def identify_service(self, port, banner):
        """Identify service based on port and banner"""
        service_name = "Unknown"
        
        if port in self.service_signatures:
            service_name = self.service_signatures[port]['name']
            
            # Refine based on banner
            if banner:
                banner_lower = banner.lower()
                if port == 80 and 'apache' in banner_lower:
                    service_name = "Apache HTTP"
                elif port == 80 and 'nginx' in banner_lower:
                    service_name = "Nginx HTTP"
                elif port == 22 and 'openssh' in banner_lower:
                    version = self.extract_version(banner, 'OpenSSH_')
                    service_name = f"OpenSSH {version}" if version else "OpenSSH"
                elif port == 21 and 'vsftpd' in banner_lower:
                    version = self.extract_version(banner, 'vsftpd ')
                    service_name = f"vsftpd {version}" if version else "vsftpd"
        
        return service_name

    def extract_version(self, banner, prefix):
        """Extract version from banner"""
        try:
            start = banner.find(prefix) + len(prefix)
            end = banner.find(' ', start)
            if end == -1:
                end = banner.find('\r', start)
            if end == -1:
                end = start + 10
            return banner[start:end]
        except:
            return ""

    def check_vulnerabilities(self, host, port, service, banner):
        """Check for known vulnerabilities"""
        vulns = []
        
        # Check for default credentials
        if port == 21 and 'ftp' in service.lower():
            vulns.append("Potential anonymous FTP access")
        elif port == 23:
            vulns.append("Telnet - Unencrypted protocol")
        elif port == 22 and banner and 'openssh' in banner.lower():
            # Check for vulnerable SSH versions
            if any(v in banner.lower() for v in ['openssh_7.2', 'openssh_7.3']):
                vulns.append("CVE-2016-6210 - SSH username enumeration")
        elif port == 445:
            vulns.append("SMB - Check for MS17-010 (EternalBlue)")
        elif port == 3389:
            vulns.append("RDP - Check for CVE-2019-0708 (BlueKeep)")
        
        # Check for outdated software
        if banner and any(old in banner.lower() for old in ['apache/2.2', 'nginx/1.0', 'iis/6.0']):
            vulns.append("Outdated web server version detected")
        
        return vulns

    def scan_host(self, host, ports):
        """Scan multiple ports on a single host"""
        print(f"[*] Scanning {host}")
        
        for port in ports:
            self.scan_port(host, port)

    def scan_network(self, target, ports):
        """Scan network range with threading"""
        try:
            network = ipaddress.ip_network(target, strict=False)
            hosts = [str(ip) for ip in network.hosts()]
        except:
            hosts = [target]
        
        print(f"[*] Starting network scan of {len(hosts)} hosts")
        print(f"[*] Ports: {','.join(map(str, ports))}")
        print(f"[*] Threads: {self.threads}")
        print("-" * 50)
        
        threads = []
        
        for host in hosts:
            # Check if host is up first
            if self.is_host_up(host):
                thread = threading.Thread(target=self.scan_host, args=(host, ports))
                thread.daemon = True
                thread.start()
                threads.append(thread)
                
                # Limit concurrent threads
                if len(threads) >= self.threads:
                    for t in threads:
                        t.join()
                    threads = []
        
        # Wait for remaining threads
        for thread in threads:
            thread.join()

    def is_host_up(self, host, timeout=1):
        """Check if host is up using ICMP or TCP"""
        try:
            # Try connecting to a common port
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((host, 80))  # Try port 80
            sock.close()
            
            if result == 0:
                return True
                
            # Try another common port
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((host, 22))  # Try port 22
            sock.close()
            
            return result == 0
        except:
            return False

    def generate_report(self):
        """Generate scan report"""
        print("\n" + "="*60)
        print("NETWORK SCAN REPORT")
        print("="*60)
        
        total_hosts = len(self.open_ports)
        total_ports = sum(len(ports) for ports in self.open_ports.values())
        total_vulns = sum(len(vulns) for vulns in self.vulnerabilities.values())
        
        print(f"Scan completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Hosts with open ports: {total_hosts}")
        print(f"Total open ports: {total_ports}")
        print(f"Potential vulnerabilities: {total_vulns}")
        
        # Detailed results
        for host, ports in self.open_ports.items():
            print(f"\n🖥️  Host: {host}")
            print(f"   Open ports: {len(ports)}")
            
            for port in sorted(ports):
                service_info = self.services.get(host, {}).get(port, {})
                service = service_info.get('service', 'Unknown')
                banner = service_info.get('banner', '')
                
                print(f"   {port:>5}/tcp - {service}")
                if banner:
                    print(f"         Banner: {banner[:80]}")
                
                # Show vulnerabilities
                if host in self.vulnerabilities and port in self.vulnerabilities[host]:
                    for vuln in self.vulnerabilities[host][port]:
                        print(f"         🔴 {vuln}")
        
        # Summary by service
        services_count = {}
        for host_services in self.services.values():
            for port_info in host_services.values():
                service = port_info['service']
                services_count[service] = services_count.get(service, 0) + 1
        
        if services_count:
            print(f"\n📊 Services Summary:")
            for service, count in sorted(services_count.items(), key=lambda x: x[1], reverse=True):
                print(f"   {service}: {count}")

    def save_report(self, filename):
        """Save detailed report to file"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'hosts': self.open_ports,
            'services': self.services,
            'vulnerabilities': self.vulnerabilities
        }
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\n[+] Detailed report saved to: {filename}")

def main():
    parser = argparse.ArgumentParser(description="Network service scanner")
    parser.add_argument('--target', required=True, help='Target host or network (e.g., 192.168.1.0/24)')
    parser.add_argument('--ports', default='21,22,23,25,53,80,110,135,139,143,443,445,993,995,1433,3306,3389,5432',
                       help='Ports to scan (comma-separated)')
    parser.add_argument('--scan-all', action='store_true',
                       help='Scan all 65535 ports (very slow)')
    parser.add_argument('--threads', type=int, default=50, help='Number of threads')
    parser.add_argument('--timeout', type=int, default=3, help='Socket timeout')
    parser.add_argument('--output', help='Output file for results')
    
    args = parser.parse_args()
    
    # Parse ports
    if args.scan_all:
        ports = list(range(1, 65536))
    else:
        ports = [int(p.strip()) for p in args.ports.split(',')]
    
    scanner = NetworkScanner(threads=args.threads, timeout=args.timeout)
    
    try:
        scanner.scan_network(args.target, ports)
        scanner.generate_report()
        
        if args.output:
            scanner.save_report(args.output)
        
        print(f"\n[+] Scan completed successfully!")
        
    except KeyboardInterrupt:
        print("\n[!] Scan interrupted by user")
        return 1
    except Exception as e:
        print(f"[!] Error during scan: {e}")
        return 1

if __name__ == "__main__":
    exit(main())