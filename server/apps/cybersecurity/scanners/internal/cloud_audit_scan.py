"""
Cloud Audit Scanner — AWS Security Configuration Audit via API Keys

Authenticates to AWS using provided API keys and audits cloud configuration
for security misconfigurations: public S3 buckets, IAM without MFA, open
security groups, disabled CloudTrail, unencrypted volumes.

This is an INTERNAL scanner — requires AWS API credentials (Credential entity).
Goes in scanners/internal/ because it needs authenticated access.

AWS-first approach. Azure/GCP checks can be added later in this file or as
separate scanners.

Why boto3: Official AWS SDK for Python. Mature, well-documented, supports
all AWS services. Synchronous but wrapped in asyncio.to_thread.

Why read-only: All API calls are describe/list/get operations. No modifications
to the AWS account. Scanner only reads configuration state.

References:
- Lesson 11 (Cloud Security — S3 attacks, IAM escalation, EC2 metadata, security groups)
- domain-architecture.md §4.2 (cloud_audit specification)
- AWS Well-Architected Framework Security Pillar
"""

import asyncio
import hashlib
import logging
import time
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)


# ==========================================
# HELPERS
# ==========================================

def _fingerprint(finding_type: str, detail: str = "") -> str:
    return hashlib.sha256(f"cloud_misconfiguration|{finding_type}|{detail}".encode()).hexdigest()


def _finding(severity, category, finding_type, title, description, remediation,
             remediation_script=None, evidence=None, cwe_id=None):
    return {
        "fingerprint": _fingerprint(finding_type, title),
        "is_new": True,
        "severity": severity,
        "category": category,
        "finding_type": finding_type,
        "title": title,
        "description": description,
        "remediation": remediation,
        "remediation_script": remediation_script,
        "evidence": evidence[:500] if evidence else None,
        "host": None,
        "port": None,
        "protocol": None,
        "url": None,
        "cve_id": None,
        "cvss_score": None,
        "cwe_id": cwe_id,
        "owasp_category": None,
        "mitre_tactic": "Discovery",
        "mitre_technique": "T1580",  # Cloud Infrastructure Discovery
        "status": "open",
    }


# ==========================================
# S3 CHECKS
# ==========================================

def check_s3_buckets(session) -> list[dict]:
    """
    Check S3 buckets for public access and missing encryption.

    Why public S3 is critical: Public buckets are the #1 cause of cloud data breaches.
    Companies like Capital One, Twitch, and Uber have been breached via public S3.
    Source: Lesson 11 Step 4 (S3 Bucket Attacks).
    """
    findings = []
    try:
        s3 = session.client("s3")
        buckets = s3.list_buckets().get("Buckets", [])

        for bucket in buckets:
            bucket_name = bucket["Name"]

            # Check bucket ACL for public access
            try:
                acl = s3.get_bucket_acl(Bucket=bucket_name)
                for grant in acl.get("Grants", []):
                    grantee = grant.get("Grantee", {})
                    uri = grantee.get("URI", "")
                    # Why these URIs: AllUsers = everyone on internet, AuthenticatedUsers = any AWS account
                    if "AllUsers" in uri or "AuthenticatedUsers" in uri:
                        findings.append(_finding(
                            "high", "cloud_misconfiguration", "s3_public_bucket",
                            f"S3 bucket is publicly accessible: {bucket_name}",
                            f"Bucket '{bucket_name}' has a public ACL grant ({uri.split('/')[-1]}). Anyone on the internet can access its contents.",
                            "Remove public access: set bucket ACL to private and enable S3 Block Public Access.",
                            f"aws s3api put-bucket-acl --bucket {bucket_name} --acl private",
                            f"Bucket: {bucket_name}, Grantee URI: {uri}",
                            "CWE-284",
                        ))
                        break
            except Exception:
                pass

            # Check bucket encryption
            try:
                s3.get_bucket_encryption(Bucket=bucket_name)
            except s3.exceptions.ClientError as e:
                if "ServerSideEncryptionConfigurationNotFoundError" in str(e):
                    findings.append(_finding(
                        "medium", "cloud_misconfiguration", "s3_no_encryption",
                        f"S3 bucket has no default encryption: {bucket_name}",
                        f"Bucket '{bucket_name}' does not have default server-side encryption enabled. Data is stored unencrypted at rest.",
                        "Enable default encryption on the bucket.",
                        f"aws s3api put-bucket-encryption --bucket {bucket_name} --server-side-encryption-configuration '{{\"Rules\":[{{\"ApplyServerSideEncryptionByDefault\":{{\"SSEAlgorithm\":\"AES256\"}}}}]}}'",
                        f"Bucket: {bucket_name}",
                        "CWE-311",
                    ))
            except Exception:
                pass

    except Exception as e:
        logger.debug(f"S3 check failed: {e}")

    return findings


# ==========================================
# IAM CHECKS
# ==========================================

def check_iam(session) -> list[dict]:
    """
    Check IAM for users without MFA, stale access keys, and root account usage.

    Why MFA is critical: Without MFA, a leaked password = full account compromise.
    Why rotate keys: Old keys have had more time to be leaked/stolen.
    Source: Lesson 11 Step 5 (IAM Privilege Escalation).
    """
    findings = []
    try:
        iam = session.client("iam")

        # Check IAM users for MFA
        users = iam.list_users().get("Users", [])
        for user in users:
            username = user["UserName"]

            # Check MFA devices
            try:
                mfa_devices = iam.list_mfa_devices(UserName=username).get("MFADevices", [])
                if not mfa_devices:
                    # Check if user has console access (password enabled)
                    try:
                        iam.get_login_profile(UserName=username)
                        # Has console access but no MFA
                        findings.append(_finding(
                            "high", "iam_issue", "iam_no_mfa",
                            f"IAM user without MFA: {username}",
                            f"User '{username}' has console access but no MFA device configured. If password is compromised, attacker has full access.",
                            f"Enable MFA for user '{username}' in IAM console.",
                            None,
                            f"User: {username}, MFA devices: 0",
                            "CWE-308",
                        ))
                    except iam.exceptions.NoSuchEntityException:
                        pass  # No console access — MFA not needed
            except Exception:
                pass

            # Check access key age
            try:
                keys = iam.list_access_keys(UserName=username).get("AccessKeyMetadata", [])
                for key in keys:
                    if key["Status"] == "Active":
                        key_age = (datetime.now(timezone.utc) - key["CreateDate"]).days
                        if key_age > 90:
                            findings.append(_finding(
                                "medium", "iam_issue", "iam_stale_access_key",
                                f"IAM access key older than 90 days: {username}",
                                f"Access key {key['AccessKeyId'][:8]}... for user '{username}' is {key_age} days old. Stale keys should be rotated regularly.",
                                f"Rotate the access key for user '{username}'.",
                                f"aws iam create-access-key --user-name {username}\naws iam delete-access-key --user-name {username} --access-key-id {key['AccessKeyId']}",
                                f"Key: {key['AccessKeyId'][:8]}..., Age: {key_age} days",
                                "CWE-798",
                            ))
            except Exception:
                pass

        # Check password policy
        try:
            policy = iam.get_account_password_policy()["PasswordPolicy"]
            issues = []
            if policy.get("MinimumPasswordLength", 0) < 14:
                issues.append(f"Min length: {policy.get('MinimumPasswordLength', 'not set')} (should be ≥14)")
            if not policy.get("RequireUppercaseCharacters", False):
                issues.append("Uppercase not required")
            if not policy.get("RequireLowercaseCharacters", False):
                issues.append("Lowercase not required")
            if not policy.get("RequireNumbers", False):
                issues.append("Numbers not required")
            if not policy.get("RequireSymbols", False):
                issues.append("Symbols not required")

            if issues:
                findings.append(_finding(
                    "medium", "iam_issue", "iam_weak_password_policy",
                    "Weak IAM password policy",
                    f"Account password policy has weaknesses: {'; '.join(issues)}.",
                    "Strengthen password policy: minimum 14 chars, require uppercase, lowercase, numbers, symbols.",
                    None,
                    "; ".join(issues),
                    "CWE-521",
                ))
        except iam.exceptions.NoSuchEntityException:
            # No password policy set at all
            findings.append(_finding(
                "high", "iam_issue", "iam_no_password_policy",
                "No IAM password policy configured",
                "No account-level password policy is set. Users can create weak passwords.",
                "Set a strong password policy in IAM settings.",
                None,
                "No password policy found",
                "CWE-521",
            ))
        except Exception:
            pass

    except Exception as e:
        logger.debug(f"IAM check failed: {e}")

    return findings


# ==========================================
# SECURITY GROUP CHECKS
# ==========================================

def check_security_groups(session) -> list[dict]:
    """
    Check EC2 security groups for overly permissive inbound rules.

    Why open SSH/RDP is high: 0.0.0.0/0 on port 22 or 3389 means anyone on the
    internet can attempt to brute-force login. This is how most cloud breaches start.
    Source: Lesson 11 (security groups), Lesson 5 (network infrastructure attacks).
    """
    findings = []
    try:
        ec2 = session.client("ec2")
        sgs = ec2.describe_security_groups().get("SecurityGroups", [])

        for sg in sgs:
            sg_id = sg["GroupId"]
            sg_name = sg.get("GroupName", "unnamed")

            for rule in sg.get("IpPermissions", []):
                from_port = rule.get("FromPort", 0)
                to_port = rule.get("ToPort", 65535)

                for ip_range in rule.get("IpRanges", []):
                    cidr = ip_range.get("CidrIp", "")

                    if cidr == "0.0.0.0/0":
                        # All ports open = critical
                        if from_port == 0 and to_port == 65535:
                            findings.append(_finding(
                                "critical", "cloud_misconfiguration", "sg_all_ports_open",
                                f"Security group allows ALL traffic from internet: {sg_name}",
                                f"Security group {sg_id} ({sg_name}) allows all inbound traffic from 0.0.0.0/0. This is extremely dangerous.",
                                "Restrict security group rules to specific ports and source IPs.",
                                f"aws ec2 revoke-security-group-ingress --group-id {sg_id} --protocol all --cidr 0.0.0.0/0",
                                f"SG: {sg_id} ({sg_name}), Ports: ALL, Source: 0.0.0.0/0",
                                "CWE-284",
                            ))
                        # SSH open to internet
                        elif from_port <= 22 <= to_port:
                            findings.append(_finding(
                                "high", "cloud_misconfiguration", "sg_ssh_open",
                                f"SSH (port 22) open to internet: {sg_name}",
                                f"Security group {sg_id} ({sg_name}) allows SSH from 0.0.0.0/0. Brute-force attacks are constant on public SSH.",
                                "Restrict SSH to specific IPs or use VPN/bastion host.",
                                f"aws ec2 revoke-security-group-ingress --group-id {sg_id} --protocol tcp --port 22 --cidr 0.0.0.0/0",
                                f"SG: {sg_id}, Port: 22, Source: 0.0.0.0/0",
                                "CWE-284",
                            ))
                        # RDP open to internet
                        elif from_port <= 3389 <= to_port:
                            findings.append(_finding(
                                "high", "cloud_misconfiguration", "sg_rdp_open",
                                f"RDP (port 3389) open to internet: {sg_name}",
                                f"Security group {sg_id} ({sg_name}) allows RDP from 0.0.0.0/0. BlueKeep and brute-force attacks target public RDP.",
                                "Restrict RDP to specific IPs or use VPN.",
                                f"aws ec2 revoke-security-group-ingress --group-id {sg_id} --protocol tcp --port 3389 --cidr 0.0.0.0/0",
                                f"SG: {sg_id}, Port: 3389, Source: 0.0.0.0/0",
                                "CWE-284",
                            ))

    except Exception as e:
        logger.debug(f"Security group check failed: {e}")

    return findings


# ==========================================
# CLOUDTRAIL CHECK
# ==========================================

def check_cloudtrail(session) -> list[dict]:
    """
    Check if CloudTrail is enabled.

    Why critical: Without CloudTrail, you can't detect or investigate breaches.
    It's like having no security cameras — you won't know when or how you were attacked.
    """
    findings = []
    try:
        ct = session.client("cloudtrail")
        trails = ct.describe_trails().get("trailList", [])

        if not trails:
            findings.append(_finding(
                "high", "cloud_misconfiguration", "cloudtrail_disabled",
                "AWS CloudTrail is not configured",
                "No CloudTrail trails found. Without CloudTrail, API activity is not logged. You cannot detect unauthorized access or investigate security incidents.",
                "Enable CloudTrail for all regions with S3 log storage.",
                "aws cloudtrail create-trail --name cystene-audit --s3-bucket-name your-log-bucket --is-multi-region-trail",
                "No trails found",
                "CWE-778",
            ))
        else:
            # Check if any trail is actually logging
            any_logging = False
            for trail in trails:
                try:
                    status = ct.get_trail_status(Name=trail["TrailARN"])
                    if status.get("IsLogging", False):
                        any_logging = True
                        break
                except Exception:
                    pass

            if not any_logging:
                findings.append(_finding(
                    "high", "cloud_misconfiguration", "cloudtrail_not_logging",
                    "CloudTrail exists but logging is stopped",
                    "CloudTrail trail(s) exist but none are actively logging. API activity is not being recorded.",
                    "Start logging on CloudTrail.",
                    f"aws cloudtrail start-logging --name {trails[0].get('Name', 'unknown')}",
                    f"Trails found: {len(trails)}, Active logging: 0",
                    "CWE-778",
                ))

    except Exception as e:
        logger.debug(f"CloudTrail check failed: {e}")

    return findings


# ==========================================
# EBS ENCRYPTION CHECK
# ==========================================

def check_ebs_encryption(session) -> list[dict]:
    """
    Check for unencrypted EBS volumes.

    Why: Unencrypted volumes mean data at rest is not protected. If a snapshot
    is shared or a volume is detached and attached to another instance, data is readable.
    """
    findings = []
    try:
        ec2 = session.client("ec2")
        volumes = ec2.describe_volumes().get("Volumes", [])

        unencrypted = [v for v in volumes if not v.get("Encrypted", False)]
        if unencrypted:
            findings.append(_finding(
                "medium", "cloud_misconfiguration", "ebs_unencrypted",
                f"{len(unencrypted)} unencrypted EBS volume(s) found",
                f"Found {len(unencrypted)} EBS volumes without encryption. Data at rest is not protected.",
                "Enable default EBS encryption for the account and encrypt existing volumes.",
                "aws ec2 enable-ebs-encryption-by-default",
                f"Unencrypted volumes: {', '.join(v['VolumeId'] for v in unencrypted[:5])}",
                "CWE-311",
            ))

    except Exception as e:
        logger.debug(f"EBS check failed: {e}")

    return findings


# ==========================================
# MAIN SCANNER ENTRY POINT
# ==========================================

async def run(target: str, params: dict) -> dict:
    """
    Execute AWS cloud audit scan.

    Authenticates to AWS using provided API keys and checks cloud configuration
    for security misconfigurations.

    Args:
        target: Ignored (not a network target). Can be empty string.
        params: Scanner parameters including AWS credentials:
            - aws_access_key_id: AWS access key ID
            - aws_secret_access_key: AWS secret access key
            - aws_region: AWS region (default us-east-1)

    Returns:
        dict with keys: findings, assets, errors, duration_seconds
    """
    start_time = time.time()
    findings = []
    assets = []
    errors = []

    aws_key = params.get("aws_access_key_id")
    aws_secret = params.get("aws_secret_access_key")
    aws_region = params.get("aws_region", "us-east-1")

    if not aws_key or not aws_secret:
        errors.append("Cloud audit requires AWS credentials (aws_access_key_id + aws_secret_access_key in params)")
        return {"findings": [], "assets": [], "errors": errors, "duration_seconds": 0}

    logger.info(f"Cloud audit starting: region={aws_region}, key={aws_key[:8]}...")

    def do_audit():
        """
        Run all AWS checks synchronously (boto3 is sync).
        Wrapped in asyncio.to_thread by caller.
        """
        import boto3

        try:
            # Create session with explicit credentials
            # Why explicit: Scanner is stateless — can't rely on env vars or ~/.aws/credentials
            session = boto3.Session(
                aws_access_key_id=aws_key,
                aws_secret_access_key=aws_secret,
                region_name=aws_region,
            )

            # Verify credentials work
            sts = session.client("sts")
            identity = sts.get_caller_identity()
            account_id = identity.get("Account", "unknown")
            arn = identity.get("Arn", "unknown")

            logger.info(f"AWS authenticated: account={account_id}, arn={arn}")

            # AWS account as asset
            assets.append({
                "asset_type": "technology",
                "value": f"AWS Account: {account_id}",
                "host": None,
                "port": None,
                "protocol": None,
                "service_name": "aws",
                "service_version": None,
                "banner": f"ARN: {arn}",
                "service_metadata": None,
                "confidence": "confirmed",
            })

        except Exception as e:
            errors.append(f"AWS authentication failed: {e}")
            return

        # Run all checks — each one handles its own exceptions
        findings.extend(check_s3_buckets(session))
        findings.extend(check_iam(session))
        findings.extend(check_security_groups(session))
        findings.extend(check_cloudtrail(session))
        findings.extend(check_ebs_encryption(session))

    await asyncio.to_thread(do_audit)

    duration = round(time.time() - start_time, 1)
    logger.info(f"Cloud audit complete: findings={len(findings)}, duration={duration}s")

    return {
        "findings": findings,
        "assets": assets,
        "errors": errors,
        "duration_seconds": duration,
    }
