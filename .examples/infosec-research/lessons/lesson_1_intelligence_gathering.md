# LESSON 1: Intelligence Gathering and Target Analysis

## Objective
Learn to identify and map a target system using terminal tools. Find what's running, what ports are open, and gather intelligence before exploitation.

## Tools Installation

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install scanning tools
brew install nmap       # Port scanner and network discovery
brew install nikto      # Web server vulnerability scanner
brew install gobuster   # Directory/file brute forcer for web content (dirb alternative)
brew install sqlmap     # Automatic SQL injection and database takeover
brew install hydra      # Password cracking and brute force tool

# Install additional utilities
# nc already on macOS - TCP/UDP connections and port listening (reverse shells)
brew install wget       # Download files from web servers
# curl already on macOS - Transfer data to/from servers, API testing
brew install jq         # Parse and filter JSON output

# For writing custom scripts
# python3 already on macOS - Python for exploit development
pip3 install requests  # HTTP library for web exploitation scripts
pip3 install beautifulsoup4  # HTML parsing for scraping
pip3 install pwntools  # CTF and exploit development framework
```

## Target
DVWA running at: `localhost:8081`

## Phase 1: Network Discovery

### Step 1: Verify target is alive
```bash
ping -c 4 localhost
# Confirms host is responding
```

### Step 2: Basic port scan
```bash
nmap localhost -p 8081
# Check if our target port is open
```

### Step 3: Find all open ports
```bash
nmap -p- localhost
# Scan all 65535 ports (takes longer but thorough)
```

### Step 4: Service version detection
```bash
nmap -sV -p 8081 localhost
# Identify what web server and version is running
```

## Phase 2: Service Enumeration

### Step 5: Aggressive scan with scripts
```bash
nmap -A -p 8081 localhost
# OS detection, version detection, script scanning, traceroute
```

### Step 6: HTTP enumeration
```bash
nmap -p 8081 --script http-enum localhost
# Enumerate web directories and files
```

### Step 7: Vulnerability scanning
```bash
nmap -p 8081 --script vuln localhost
# Check for known vulnerabilities
```

## Phase 3: Web Application Enumeration

### Step 8: Web vulnerability scanner
```bash
nikto -h http://localhost:8081
# Comprehensive web vulnerability scan
```

### Step 9: Directory brute forcing
```bash
gobuster dir -u http://localhost:8081 -w /usr/share/wordlists/dirb/common.txt
# Find hidden directories and files
# If wordlist not found, use: -w /opt/homebrew/share/wordlists/dirbuster/directory-list-2.3-small.txt
# Or download: wget https://raw.githubusercontent.com/v0re/dirb/master/wordlists/common.txt
```

### Step 10: Manual HTTP analysis
```bash
# Get HTTP headers
curl -I http://localhost:8081

# Get full response with headers
curl -v http://localhost:8081

# Check robots.txt
curl http://localhost:8081/robots.txt

# Check common files
curl http://localhost:8081/sitemap.xml
curl http://localhost:8081/.git/HEAD
curl http://localhost:8081/admin
```

## Phase 4: Authentication Testing

### Step 11: Find login pages
```bash
gobuster dir -u http://localhost:8081 -w /usr/share/wordlists/dirb/common.txt -x php
# Search specifically for PHP files (login pages)
```

### Step 12: Test default credentials
```bash
# Create user list
echo -e "admin\nroot\ntest\ndvwa" > users.txt

# Create password list  
echo -e "password\nadmin\nroot\ntest\n123456" > passwords.txt

# Brute force login
hydra -L users.txt -P passwords.txt localhost http-get-form "/login.php:username=^USER^&password=^PASS^&Login=Login:Login failed"
```

## Expected Results

By end of this lesson, you should have discovered:
- Port 8081 running Apache/nginx
- PHP version and configuration
- Database backend (MySQL)
- Login page at /login.php
- Multiple vulnerabilities in /vulnerabilities/
- Default credentials admin:password

## Save Your Findings

```bash
# Create evidence directory
mkdir -p ~/Developer/tutorials/infosec-research/evidence/lesson1

# Save all scan results
nmap -A -p 8081 localhost -oA ~/Developer/tutorials/infosec-research/evidence/lesson1/nmap_scan
nikto -h http://localhost:8081 -output ~/Developer/tutorials/infosec-research/evidence/lesson1/nikto_scan.txt
```

## LESSON 1 RESULTS

### Most Effective Commands:
1. **`nmap -A localhost -p 8081`** - Apache/2.4.25, DVWA v1.10
2. **`nikto -h http://localhost:8081`** - Found /config/ directory 
3. **`gobuster dir -u http://localhost:8081 -w wordlists/common.txt`** - Found php.ini
4. **`./scripts/dir_buster.sh http://localhost:8081`** - Found README.md, CHANGELOG.md (missed by gobuster)
5. **`curl http://localhost:8081/config/config.inc.php.bak`** - **Database credentials!**
6. **`hydra -L users.txt -P passwords.txt -s 8081 localhost http-post-form`** - **Authentication completely broken! (20/20 combos work)**

### Critical Intel Obtained:
- **Database**: dvwa, Username: app, Password: vulnerables
- **PHP misconfigs**: allow_url_include on, magic_quotes off
- **Directory indexing** enabled on /config/
- **Authentication bypass**: ANY credentials work - critical vulnerability
- **Additional files**: README.md (9KB), CHANGELOG.md (7KB)

### Tool Comparison:
- **gobuster**: Found php.ini, standard web files
- **Custom dir_buster.sh**: Found documentation files gobuster missed
- **Both valuable**: Different wordlists = different discoveries

### Success Criteria ✅ EXCEEDED  
✓ Apache/2.4.25 identified ✓ login.php found ✓ 9+ directories discovered  
✓ PHP version found ✓ Database access obtained ✓ **BONUS**: Complete authentication bypass

## Next Lesson Preview
**Lesson 2**: Exploit the vulnerabilities we found