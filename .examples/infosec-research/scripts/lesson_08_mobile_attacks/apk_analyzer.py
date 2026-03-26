#!/usr/bin/env python3
"""
Script Name: apk_analyzer.py
Lesson: 08 - Mobile Device Attacks
Similar to: MobSF, Qark, AndroBugs
Description: Comprehensive APK security analysis toolkit

Usage:
    python3 apk_analyzer.py --apk app.apk --detailed
    python3 apk_analyzer.py --apk app.apk --extract-only
    python3 apk_analyzer.py --directory extracted_apk/ --analyze

Educational Notes:
    - Demonstrates APK structure analysis
    - Shows Android security weakness detection
    - Teaches manifest and code analysis techniques
"""

import argparse
import os
import subprocess
import xml.etree.ElementTree as ET
import zipfile
import json
import re
from datetime import datetime
import hashlib

class APKAnalyzer:
    def __init__(self, apk_path=None, extract_dir=None):
        self.apk_path = apk_path
        self.extract_dir = extract_dir or f"/tmp/apk_analysis_{int(datetime.now().timestamp())}"
        self.analysis_results = {
            'timestamp': datetime.now().isoformat(),
            'apk_file': apk_path,
            'basic_info': {},
            'permissions': [],
            'activities': [],
            'services': [],
            'receivers': [],
            'providers': [],
            'vulnerabilities': [],
            'security_issues': [],
            'certificates': [],
            'file_analysis': {}
        }

    def extract_apk(self):
        """Extract APK contents"""
        print(f"[*] Extracting APK to {self.extract_dir}")
        
        try:
            os.makedirs(self.extract_dir, exist_ok=True)
            
            with zipfile.ZipFile(self.apk_path, 'r') as zip_ref:
                zip_ref.extractall(self.extract_dir)
            
            print(f"[+] APK extracted successfully")
            
            # Try to decompile with apktool if available
            self.decompile_with_apktool()
            
            return True
            
        except Exception as e:
            print(f"[!] Error extracting APK: {e}")
            return False

    def decompile_with_apktool(self):
        """Decompile APK using apktool"""
        try:
            apktool_dir = f"{self.extract_dir}_decompiled"
            cmd = ['apktool', 'd', self.apk_path, '-o', apktool_dir, '-f']
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"[+] APK decompiled with apktool to {apktool_dir}")
                self.extract_dir = apktool_dir  # Use decompiled version for analysis
            else:
                print(f"[!] apktool not available or failed, using basic extraction")
        except FileNotFoundError:
            print(f"[!] apktool not found, using basic extraction")

    def analyze_basic_info(self):
        """Extract basic APK information"""
        print("[*] Analyzing basic APK information...")
        
        # Calculate file hash
        if self.apk_path:
            with open(self.apk_path, 'rb') as f:
                data = f.read()
                self.analysis_results['basic_info']['md5'] = hashlib.md5(data).hexdigest()
                self.analysis_results['basic_info']['sha256'] = hashlib.sha256(data).hexdigest()
                self.analysis_results['basic_info']['size'] = len(data)
        
        # Use aapt if available
        try:
            cmd = ['aapt', 'dump', 'badging', self.apk_path]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                self.parse_aapt_output(result.stdout)
            else:
                print("[!] aapt not available, analyzing manually")
                self.analyze_manifest_manually()
                
        except FileNotFoundError:
            print("[!] aapt not found, analyzing manually")
            self.analyze_manifest_manually()

    def parse_aapt_output(self, aapt_output):
        """Parse aapt dump output"""
        lines = aapt_output.split('\n')
        
        for line in lines:
            if line.startswith('package:'):
                # Extract package info
                match = re.search(r"name='([^']+)'", line)
                if match:
                    self.analysis_results['basic_info']['package_name'] = match.group(1)
                
                match = re.search(r"versionName='([^']+)'", line)
                if match:
                    self.analysis_results['basic_info']['version_name'] = match.group(1)
                
                match = re.search(r"versionCode='([^']+)'", line)
                if match:
                    self.analysis_results['basic_info']['version_code'] = match.group(1)
            
            elif line.startswith('application-label:'):
                match = re.search(r"'([^']+)'", line)
                if match:
                    self.analysis_results['basic_info']['app_name'] = match.group(1)
            
            elif line.startswith('uses-permission:'):
                match = re.search(r"name='([^']+)'", line)
                if match:
                    self.analysis_results['permissions'].append(match.group(1))

    def analyze_manifest_manually(self):
        """Analyze AndroidManifest.xml manually"""
        manifest_path = os.path.join(self.extract_dir, 'AndroidManifest.xml')
        
        if not os.path.exists(manifest_path):
            print("[!] AndroidManifest.xml not found")
            return
        
        try:
            # Try to parse as XML (if decompiled)
            tree = ET.parse(manifest_path)
            root = tree.getroot()
            
            # Extract package name
            package_name = root.get('package')
            if package_name:
                self.analysis_results['basic_info']['package_name'] = package_name
            
            # Extract permissions
            for perm in root.findall('.//uses-permission'):
                perm_name = perm.get('{http://schemas.android.com/apk/res/android}name')
                if perm_name:
                    self.analysis_results['permissions'].append(perm_name)
            
            # Extract components
            app = root.find('application')
            if app:
                # Activities
                for activity in app.findall('activity'):
                    name = activity.get('{http://schemas.android.com/apk/res/android}name')
                    if name:
                        self.analysis_results['activities'].append(name)
                
                # Services
                for service in app.findall('service'):
                    name = service.get('{http://schemas.android.com/apk/res/android}name')
                    if name:
                        self.analysis_results['services'].append(name)
                
                # Receivers
                for receiver in app.findall('receiver'):
                    name = receiver.get('{http://schemas.android.com/apk/res/android}name')
                    if name:
                        self.analysis_results['receivers'].append(name)
                
                # Providers
                for provider in app.findall('provider'):
                    name = provider.get('{http://schemas.android.com/apk/res/android}name')
                    if name:
                        self.analysis_results['providers'].append(name)
            
        except ET.ParseError:
            print("[!] Could not parse AndroidManifest.xml (binary format)")
            # For binary manifests, we'd need specialized tools

    def analyze_permissions(self):
        """Analyze permission security implications"""
        print("[*] Analyzing permissions...")
        
        dangerous_permissions = {
            'android.permission.READ_CONTACTS': 'HIGH - Can read contacts',
            'android.permission.WRITE_CONTACTS': 'HIGH - Can modify contacts',
            'android.permission.READ_SMS': 'HIGH - Can read SMS messages',
            'android.permission.SEND_SMS': 'HIGH - Can send SMS (premium charges)',
            'android.permission.RECEIVE_SMS': 'MEDIUM - Can receive SMS',
            'android.permission.READ_PHONE_STATE': 'MEDIUM - Can read phone state/IMEI',
            'android.permission.CALL_PHONE': 'HIGH - Can make phone calls',
            'android.permission.RECORD_AUDIO': 'HIGH - Can record audio',
            'android.permission.CAMERA': 'MEDIUM - Can use camera',
            'android.permission.ACCESS_FINE_LOCATION': 'MEDIUM - Can access precise location',
            'android.permission.ACCESS_COARSE_LOCATION': 'MEDIUM - Can access approximate location',
            'android.permission.WRITE_EXTERNAL_STORAGE': 'MEDIUM - Can write to external storage',
            'android.permission.READ_EXTERNAL_STORAGE': 'MEDIUM - Can read external storage',
            'android.permission.INTERNET': 'LOW - Can access internet',
            'android.permission.ACCESS_NETWORK_STATE': 'LOW - Can check network state',
            'android.permission.WAKE_LOCK': 'LOW - Can prevent device sleep',
            'android.permission.VIBRATE': 'LOW - Can control vibration',
            'android.permission.INSTALL_PACKAGES': 'CRITICAL - Can install apps',
            'android.permission.DELETE_PACKAGES': 'CRITICAL - Can uninstall apps',
            'android.permission.WRITE_SECURE_SETTINGS': 'CRITICAL - Can modify system settings'
        }
        
        for permission in self.analysis_results['permissions']:
            if permission in dangerous_permissions:
                severity, description = dangerous_permissions[permission].split(' - ', 1)
                self.analysis_results['security_issues'].append({
                    'type': 'Dangerous Permission',
                    'severity': severity,
                    'description': f"{permission}: {description}",
                    'permission': permission
                })

    def analyze_code_issues(self):
        """Analyze code for security issues"""
        print("[*] Analyzing code for security issues...")
        
        # Look for Java/Smali files
        code_files = []
        for root, dirs, files in os.walk(self.extract_dir):
            for file in files:
                if file.endswith('.java') or file.endswith('.smali'):
                    code_files.append(os.path.join(root, file))
        
        security_patterns = {
            'hardcoded_secrets': [
                r'password\s*=\s*["\'][^"\']+["\']',
                r'api[_-]?key\s*=\s*["\'][^"\']+["\']',
                r'secret\s*=\s*["\'][^"\']+["\']',
                r'token\s*=\s*["\'][^"\']+["\']'
            ],
            'weak_crypto': [
                r'DES\(',
                r'MD5\(',
                r'SHA1\(',
                r'ECB'
            ],
            'insecure_network': [
                r'http://[^"\']+',
                r'TrustAllCerts',
                r'setHostnameVerifier.*ALLOW_ALL'
            ],
            'sql_injection': [
                r'rawQuery.*\+',
                r'execSQL.*\+'
            ]
        }
        
        for file_path in code_files[:50]:  # Limit to avoid excessive processing
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                for issue_type, patterns in security_patterns.items():
                    for pattern in patterns:
                        matches = re.findall(pattern, content, re.IGNORECASE)
                        if matches:
                            self.analysis_results['vulnerabilities'].append({
                                'type': issue_type,
                                'file': os.path.basename(file_path),
                                'matches': len(matches),
                                'examples': matches[:3]  # First 3 matches
                            })
            except Exception as e:
                continue

    def analyze_certificate(self):
        """Analyze APK certificate"""
        print("[*] Analyzing APK certificate...")
        
        cert_path = os.path.join(self.extract_dir, 'META-INF')
        if os.path.exists(cert_path):
            cert_files = [f for f in os.listdir(cert_path) if f.endswith('.RSA') or f.endswith('.DSA')]
            
            for cert_file in cert_files:
                cert_full_path = os.path.join(cert_path, cert_file)
                try:
                    # Use openssl to analyze certificate
                    cmd = ['openssl', 'pkcs7', '-inform', 'DER', '-in', cert_full_path, '-print_certs', '-text']
                    result = subprocess.run(cmd, capture_output=True, text=True)
                    
                    if result.returncode == 0:
                        # Parse certificate info
                        cert_info = self.parse_certificate_output(result.stdout)
                        self.analysis_results['certificates'].append(cert_info)
                    
                except Exception as e:
                    print(f"[!] Error analyzing certificate {cert_file}: {e}")

    def parse_certificate_output(self, cert_output):
        """Parse openssl certificate output"""
        cert_info = {}
        
        # Extract common certificate fields
        patterns = {
            'subject': r'Subject: (.+)',
            'issuer': r'Issuer: (.+)',
            'not_before': r'Not Before: (.+)',
            'not_after': r'Not After : (.+)',
            'serial': r'Serial Number: (.+)'
        }
        
        for field, pattern in patterns.items():
            match = re.search(pattern, cert_output)
            if match:
                cert_info[field] = match.group(1).strip()
        
        return cert_info

    def analyze_file_structure(self):
        """Analyze APK file structure"""
        print("[*] Analyzing file structure...")
        
        file_stats = {}
        suspicious_files = []
        
        for root, dirs, files in os.walk(self.extract_dir):
            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, self.extract_dir)
                
                # Get file extension statistics
                ext = os.path.splitext(file)[1].lower()
                file_stats[ext] = file_stats.get(ext, 0) + 1
                
                # Check for suspicious files
                suspicious_patterns = [
                    r'\.so$',  # Native libraries
                    r'\.dex$', # Dalvik executables
                    r'payload',
                    r'backdoor',
                    r'shell',
                    r'root'
                ]
                
                for pattern in suspicious_patterns:
                    if re.search(pattern, file.lower()):
                        try:
                            size = os.path.getsize(file_path)
                            suspicious_files.append({
                                'file': relative_path,
                                'size': size,
                                'reason': f'Matches pattern: {pattern}'
                            })
                        except:
                            pass
        
        self.analysis_results['file_analysis'] = {
            'file_types': file_stats,
            'suspicious_files': suspicious_files
        }

    def check_security_features(self):
        """Check for security features"""
        print("[*] Checking security features...")
        
        security_checks = []
        
        # Check for obfuscation
        if any('obfuscated' in f.lower() or len(os.path.basename(f)) == 1 
               for root, dirs, files in os.walk(self.extract_dir) 
               for f in files if f.endswith('.smali')):
            security_checks.append({
                'feature': 'Code Obfuscation',
                'status': 'Present',
                'description': 'Code appears to be obfuscated'
            })
        else:
            security_checks.append({
                'feature': 'Code Obfuscation',
                'status': 'Absent',
                'description': 'No code obfuscation detected'
            })
        
        # Check for native libraries
        native_libs = []
        lib_dir = os.path.join(self.extract_dir, 'lib')
        if os.path.exists(lib_dir):
            for root, dirs, files in os.walk(lib_dir):
                for file in files:
                    if file.endswith('.so'):
                        native_libs.append(file)
        
        if native_libs:
            security_checks.append({
                'feature': 'Native Libraries',
                'status': 'Present',
                'description': f'Found {len(native_libs)} native libraries'
            })
        
        self.analysis_results['security_features'] = security_checks

    def generate_report(self):
        """Generate comprehensive analysis report"""
        print("\n" + "="*60)
        print("APK SECURITY ANALYSIS REPORT")
        print("="*60)
        
        # Basic Information
        basic_info = self.analysis_results['basic_info']
        print(f"APK File: {self.apk_path}")
        print(f"Package: {basic_info.get('package_name', 'Unknown')}")
        print(f"App Name: {basic_info.get('app_name', 'Unknown')}")
        print(f"Version: {basic_info.get('version_name', 'Unknown')} ({basic_info.get('version_code', 'Unknown')})")
        
        if 'size' in basic_info:
            print(f"File Size: {basic_info['size']:,} bytes")
        if 'md5' in basic_info:
            print(f"MD5: {basic_info['md5']}")
        
        # Permissions Analysis
        print(f"\n📋 Permissions ({len(self.analysis_results['permissions'])} total):")
        dangerous_count = len([p for p in self.analysis_results['security_issues'] 
                             if p['type'] == 'Dangerous Permission'])
        print(f"   Dangerous permissions: {dangerous_count}")
        
        for issue in self.analysis_results['security_issues'][:5]:  # Show first 5
            if issue['type'] == 'Dangerous Permission':
                print(f"   🔴 {issue['severity']}: {issue['permission']}")
        
        # Components
        print(f"\n📱 App Components:")
        print(f"   Activities: {len(self.analysis_results['activities'])}")
        print(f"   Services: {len(self.analysis_results['services'])}")
        print(f"   Receivers: {len(self.analysis_results['receivers'])}")
        print(f"   Providers: {len(self.analysis_results['providers'])}")
        
        # Security Issues
        if self.analysis_results['vulnerabilities']:
            print(f"\n🔓 Code Vulnerabilities ({len(self.analysis_results['vulnerabilities'])}):")
            for vuln in self.analysis_results['vulnerabilities'][:10]:  # Show first 10
                print(f"   • {vuln['type']}: {vuln['matches']} occurrences in {vuln['file']}")
        
        # File Analysis
        file_analysis = self.analysis_results['file_analysis']
        if 'file_types' in file_analysis:
            print(f"\n📁 File Types:")
            for ext, count in sorted(file_analysis['file_types'].items(), 
                                   key=lambda x: x[1], reverse=True)[:10]:
                print(f"   {ext or 'no extension'}: {count} files")
        
        # Certificates
        if self.analysis_results['certificates']:
            print(f"\n🔐 Certificate Information:")
            for cert in self.analysis_results['certificates']:
                if 'subject' in cert:
                    print(f"   Subject: {cert['subject']}")
                if 'not_after' in cert:
                    print(f"   Expires: {cert['not_after']}")
        
        # Overall Risk Assessment
        high_risk_count = len([s for s in self.analysis_results['security_issues'] 
                             if s.get('severity') == 'HIGH' or s.get('severity') == 'CRITICAL'])
        
        print(f"\n📊 Risk Assessment:")
        if high_risk_count > 5:
            print(f"   🔴 HIGH RISK - {high_risk_count} high/critical issues found")
        elif high_risk_count > 0:
            print(f"   🟡 MEDIUM RISK - {high_risk_count} high/critical issues found")
        else:
            print(f"   🟢 LOW RISK - No critical issues detected")

    def save_report(self, output_file):
        """Save detailed report to JSON file"""
        with open(output_file, 'w') as f:
            json.dump(self.analysis_results, f, indent=2, default=str)
        print(f"\n[+] Detailed report saved to: {output_file}")

def main():
    parser = argparse.ArgumentParser(description="APK security analyzer")
    parser.add_argument('--apk', required=True, help='APK file to analyze')
    parser.add_argument('--output', help='Output JSON file for detailed results')
    parser.add_argument('--extract-only', action='store_true',
                       help='Only extract APK, do not analyze')
    parser.add_argument('--detailed', action='store_true',
                       help='Perform detailed analysis (slower)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.apk):
        print(f"[!] APK file not found: {args.apk}")
        return 1
    
    analyzer = APKAnalyzer(args.apk)
    
    try:
        # Extract APK
        if not analyzer.extract_apk():
            return 1
        
        if args.extract_only:
            print(f"[+] APK extracted to: {analyzer.extract_dir}")
            return 0
        
        # Perform analysis
        analyzer.analyze_basic_info()
        analyzer.analyze_permissions()
        analyzer.analyze_certificate()
        analyzer.analyze_file_structure()
        analyzer.check_security_features()
        
        if args.detailed:
            analyzer.analyze_code_issues()
        
        # Generate report
        analyzer.generate_report()
        
        if args.output:
            analyzer.save_report(args.output)
        
        print(f"\n[+] Analysis completed!")
        print(f"[*] Extracted files located at: {analyzer.extract_dir}")
        
    except KeyboardInterrupt:
        print("\n[!] Analysis interrupted by user")
        return 1
    except Exception as e:
        print(f"[!] Error during analysis: {e}")
        return 1

if __name__ == "__main__":
    exit(main())