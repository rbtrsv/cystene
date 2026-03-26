#!/usr/bin/env python3
"""
Simple Port Scanner
Similar to: nmap (but basic version)
Package equivalent: brew install nmap

Usage: python3 port_scanner.py <target> [port_range]
Example: python3 port_scanner.py localhost
Example: python3 port_scanner.py 192.168.1.100 1-1000
"""

import socket
import sys
import time

def scan_port(host, port):
    """Check if a single port is open"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 port_scanner.py <target> [port_range]")
        sys.exit(1)
    
    target = sys.argv[1]
    
    # Common web/service ports if no range specified
    if len(sys.argv) < 3:
        ports = [21, 22, 23, 25, 80, 110, 443, 445, 3306, 3389, 8080, 8081, 8443]
    else:
        # Parse port range like "1-1000"
        if '-' in sys.argv[2]:
            start, end = sys.argv[2].split('-')
            ports = range(int(start), int(end) + 1)
        else:
            ports = [int(sys.argv[2])]
    
    print(f"Scanning {target}...")
    print("-" * 40)
    
    open_ports = []
    for port in ports:
        if scan_port(target, port):
            print(f"Port {port}: OPEN")
            open_ports.append(port)
    
    if not open_ports:
        print("No open ports found")
    else:
        print(f"\nFound {len(open_ports)} open ports")

if __name__ == "__main__":
    main()