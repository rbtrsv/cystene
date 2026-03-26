# Cybersecurity Course Scripts

This directory contains custom scripts organized by lesson for the comprehensive cybersecurity learning course.

## Directory Structure

- **lesson_01_recon/** - Network reconnaissance and OSINT tools
- **lesson_02_web_exploitation/** - Web application attack scripts
- **lesson_03_physical_access/** - Physical access and client-side attacks
- **lesson_04_post_exploitation/** - Privilege escalation and persistence
- **lesson_05_network_services/** - Service enumeration and exploitation
- **lesson_06_passwords/** - Password attacks and hash cracking
- **lesson_07_wireless/** - Wi-Fi and Bluetooth security
- **lesson_08_mobile/** - Android and iOS security testing
- **lesson_09_active_directory/** - Windows domain attacks
- **lesson_10_macos/** - macOS specific exploitation
- **lesson_11_c2/** - Command and control operations
- **lesson_12_evasion/** - AV bypass and anti-forensics
- **lesson_13_cloud/** - Cloud platform security
- **lesson_14_web3/** - Blockchain and smart contract security
- **lesson_15_binary/** - Binary exploitation and reverse engineering
- **lesson_16_capstone/** - Red team operations
- **common/** - Shared utilities and helpers

## Current Scripts

### Lesson 01 - Reconnaissance
- `port_scanner.py` - Basic TCP/UDP port scanning
- `dir_buster.sh` - Web directory enumeration

### Lesson 02 - Web Exploitation
- `sql_injector.py` - SQL injection testing
- `cmd_injector.py` - Command injection automation

### Lesson 06 - Passwords
- `password_cracker.sh` - Password brute forcing

### Common
- `reverse_shell_gen.sh` - Generate reverse shell payloads

## Usage

Each script includes usage instructions in its header. Generally:

```bash
# Python scripts
python3 lesson_01_recon/port_scanner.py <target>

# Shell scripts
./lesson_06_passwords/password_cracker.sh <target> <service>
```

## Development Guidelines

1. Each script should be educational and well-commented
2. Include comparison to professional tools (e.g., "Similar to: nmap")
3. Focus on understanding concepts, not just automation
4. Use existing GitHub tools when mature solutions exist

## Dependencies

Most scripts require:
- Python 3.x with requests, beautifulsoup4
- Bash shell
- Network utilities (nmap, curl, etc.)

See individual lesson requirements in the main COURSE_PLAN.md