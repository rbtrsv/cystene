#!/bin/bash
#
# Directory Buster Script
# Similar to: gobuster, dirb, dirbuster
# Package equivalent: brew install gobuster
#
# Usage: ./dir_buster.sh <url>
# Example: ./dir_buster.sh http://localhost:8081

if [ -z "$1" ]; then
    echo "Usage: $0 <url>"
    echo "Example: $0 http://localhost:8081"
    exit 1
fi

BASE_URL="$1"

# Common directories and files to check
# This is a small wordlist - real tools use massive lists
dirs=(
    # Directories
    "admin" "administrator" "backup" "backups" "config" "configuration"
    "database" "db" "dev" "development" "test" "testing" "api" "v1"
    "includes" "inc" "uploads" "upload" "images" "img" "css" "js"
    "scripts" "style" "styles" "temp" "tmp" "cache" "logs" "log"
    "private" "public" "static" "assets" "files" "documents" "docs"
    "downloads" "data" "sql" "old" "new" "bak" "save" "saved"
    "wp-admin" "wp-content" "wp-includes"  # WordPress
    "phpmyadmin" "pma" "mysql" "cpanel"    # Admin panels
    ".git" ".svn" ".env" ".htaccess"       # Hidden files
    
    # Files
    "index.php" "login.php" "admin.php" "config.php" "test.php"
    "phpinfo.php" "info.php" "shell.php" "backdoor.php" "c99.php"
    "robots.txt" "sitemap.xml" "crossdomain.xml" "humans.txt"
    ".DS_Store" "web.config" "wp-config.php" "configuration.php"
    "database.sql" "dump.sql" "backup.sql" "users.sql"
    "passwords.txt" "users.txt" "admin.txt"
    ".git/HEAD" ".env.example" "composer.json" "package.json"
    "README.md" "readme.txt" "CHANGELOG.md" "TODO.txt"
)

echo "Directory Busting: $BASE_URL"
echo "Testing ${#dirs[@]} paths..."
echo "----------------------------------------"

found=0

for path in "${dirs[@]}"; do
    # Get HTTP response code
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$path")
    
    # Check if not 404 (not found)
    if [ "$response" != "404" ] && [ "$response" != "000" ]; then
        # Get content length for more info
        size=$(curl -s -I "$BASE_URL/$path" | grep -i content-length | awk '{print $2}' | tr -d '\r')
        
        if [ "$response" == "200" ]; then
            echo -e "[\033[32m+\033[0m] FOUND: /$path (HTTP $response) [Size: ${size:-unknown}]"
            ((found++))
        elif [ "$response" == "301" ] || [ "$response" == "302" ]; then
            # Check redirect location
            location=$(curl -s -I "$BASE_URL/$path" | grep -i location | awk '{print $2}' | tr -d '\r')
            echo -e "[\033[33m→\033[0m] REDIRECT: /$path (HTTP $response) → $location"
            ((found++))
        elif [ "$response" == "403" ]; then
            echo -e "[\033[31m!\033[0m] FORBIDDEN: /$path (HTTP $response) [Exists but access denied]"
            ((found++))
        elif [ "$response" == "401" ]; then
            echo -e "[\033[35m🔒\033[0m] AUTH REQUIRED: /$path (HTTP $response)"
            ((found++))
        else
            echo -e "[?] UNUSUAL: /$path (HTTP $response)"
            ((found++))
        fi
    fi
done

echo "----------------------------------------"
echo "Scan complete. Found $found interesting paths."