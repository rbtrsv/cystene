#!/usr/bin/env python3
"""
Script Name: hash_cracker.py
Lesson: 06 - Password Attacks & Cryptography
Similar to: hashcat, john the ripper
Description: Comprehensive hash cracking toolkit with multiple attack modes

Usage:
    python3 hash_cracker.py --hash 5d41402abc4b2a76b9719d911017c592 --wordlist rockyou.txt
    python3 hash_cracker.py --hashfile hashes.txt --attack dictionary --wordlist passwords.txt
    python3 hash_cracker.py --hash 098f6bcd4621d373cade4e832627b4f6 --attack brute --charset lowercase --maxlength 6

Educational Notes:
    - Demonstrates various hash cracking techniques
    - Shows hash identification methods
    - Teaches optimization strategies
"""

import argparse
import hashlib
import itertools
import string
import time
from datetime import datetime
import multiprocessing
import threading

class HashCracker:
    def __init__(self, threads=4):
        self.threads = threads
        self.found_passwords = []
        self.attempts = 0
        self.start_time = None
        
        # Common hash patterns for identification
        self.hash_types = {
            32: ['MD5', 'NTLM'],
            40: ['SHA1'],
            56: ['SHA224'],
            64: ['SHA256'],
            96: ['SHA384'],
            128: ['SHA512']
        }
        
        # Character sets for brute force
        self.charsets = {
            'lowercase': string.ascii_lowercase,
            'uppercase': string.ascii_uppercase,
            'digits': string.digits,
            'symbols': '!@#$%^&*()_+-=[]{}|;:,.<>?',
            'all': string.ascii_letters + string.digits + '!@#$%^&*()_+-=[]{}|;:,.<>?'
        }

    def identify_hash(self, hash_value):
        """Identify hash type based on length and patterns"""
        hash_length = len(hash_value.strip())
        possible_types = self.hash_types.get(hash_length, ['Unknown'])
        
        print(f"[*] Hash length: {hash_length} characters")
        print(f"[*] Possible hash types: {', '.join(possible_types)}")
        
        # Additional pattern matching
        if hash_length == 32:
            if hash_value.startswith('$1$'):
                return 'MD5 Crypt'
            elif all(c in '0123456789abcdef' for c in hash_value.lower()):
                return 'MD5 or NTLM'
        elif hash_length == 60 and hash_value.startswith('$2'):
            return 'bcrypt'
        elif '$' in hash_value:
            if hash_value.startswith('$6$'):
                return 'SHA512 Crypt'
            elif hash_value.startswith('$5$'):
                return 'SHA256 Crypt'
        
        return possible_types[0] if possible_types else 'Unknown'

    def hash_password(self, password, hash_type='MD5'):
        """Generate hash for given password"""
        password_bytes = password.encode('utf-8')
        
        hash_functions = {
            'MD5': hashlib.md5,
            'SHA1': hashlib.sha1,
            'SHA224': hashlib.sha224,
            'SHA256': hashlib.sha256,
            'SHA384': hashlib.sha384,
            'SHA512': hashlib.sha512,
            'NTLM': self.ntlm_hash
        }
        
        hash_func = hash_functions.get(hash_type.upper(), hashlib.md5)
        if hash_type.upper() == 'NTLM':
            return hash_func(password)
        else:
            return hash_func(password_bytes).hexdigest()

    def ntlm_hash(self, password):
        """Generate NTLM hash"""
        try:
            import hashlib
            return hashlib.new('md4', password.encode('utf-16le')).hexdigest()
        except:
            # Fallback implementation
            return hashlib.md5(password.encode()).hexdigest()

    def dictionary_attack(self, target_hash, wordlist_file, hash_type='MD5'):
        """Perform dictionary attack"""
        print(f"[*] Starting dictionary attack with {wordlist_file}")
        print(f"[*] Hash type: {hash_type}")
        print(f"[*] Target hash: {target_hash}")
        
        self.start_time = time.time()
        
        try:
            with open(wordlist_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line_num, password in enumerate(f, 1):
                    password = password.strip()
                    if not password:
                        continue
                    
                    self.attempts += 1
                    
                    # Generate hash for current password
                    generated_hash = self.hash_password(password, hash_type)
                    
                    if generated_hash.lower() == target_hash.lower():
                        elapsed = time.time() - self.start_time
                        print(f"\n[+] PASSWORD FOUND!")
                        print(f"[+] Password: {password}")
                        print(f"[+] Hash: {generated_hash}")
                        print(f"[+] Attempts: {self.attempts:,}")
                        print(f"[+] Time: {elapsed:.2f} seconds")
                        print(f"[+] Speed: {self.attempts/elapsed:.0f} hashes/sec")
                        self.found_passwords.append(password)
                        return password
                    
                    # Progress indicator
                    if line_num % 10000 == 0:
                        elapsed = time.time() - self.start_time
                        speed = self.attempts / elapsed if elapsed > 0 else 0
                        print(f"[*] Tried {self.attempts:,} passwords, Speed: {speed:.0f} H/s", end='\r')
            
            print(f"\n[-] Password not found in wordlist")
            print(f"[-] Total attempts: {self.attempts:,}")
            
        except FileNotFoundError:
            print(f"[!] Wordlist file not found: {wordlist_file}")
        except Exception as e:
            print(f"[!] Error during dictionary attack: {e}")
        
        return None

    def brute_force_attack(self, target_hash, charset='lowercase', min_length=1, max_length=6, hash_type='MD5'):
        """Perform brute force attack"""
        chars = self.charsets.get(charset, string.ascii_lowercase)
        
        print(f"[*] Starting brute force attack")
        print(f"[*] Hash type: {hash_type}")
        print(f"[*] Target hash: {target_hash}")
        print(f"[*] Charset: {charset} ({len(chars)} characters)")
        print(f"[*] Length range: {min_length}-{max_length}")
        
        total_combinations = sum(len(chars)**i for i in range(min_length, max_length + 1))
        print(f"[*] Total combinations: {total_combinations:,}")
        
        self.start_time = time.time()
        
        try:
            for length in range(min_length, max_length + 1):
                print(f"\n[*] Trying length {length}...")
                
                for attempt in itertools.product(chars, repeat=length):
                    password = ''.join(attempt)
                    self.attempts += 1
                    
                    generated_hash = self.hash_password(password, hash_type)
                    
                    if generated_hash.lower() == target_hash.lower():
                        elapsed = time.time() - self.start_time
                        print(f"\n[+] PASSWORD FOUND!")
                        print(f"[+] Password: {password}")
                        print(f"[+] Hash: {generated_hash}")
                        print(f"[+] Attempts: {self.attempts:,}")
                        print(f"[+] Time: {elapsed:.2f} seconds")
                        print(f"[+] Speed: {self.attempts/elapsed:.0f} hashes/sec")
                        self.found_passwords.append(password)
                        return password
                    
                    # Progress indicator
                    if self.attempts % 1000 == 0:
                        elapsed = time.time() - self.start_time
                        speed = self.attempts / elapsed if elapsed > 0 else 0
                        progress = (self.attempts / total_combinations) * 100
                        print(f"[*] Progress: {progress:.2f}%, Speed: {speed:.0f} H/s", end='\r')
            
            print(f"\n[-] Password not found in search space")
            print(f"[-] Total attempts: {self.attempts:,}")
            
        except KeyboardInterrupt:
            print(f"\n[!] Attack interrupted by user")
            elapsed = time.time() - self.start_time
            speed = self.attempts / elapsed if elapsed > 0 else 0
            print(f"[*] Attempts made: {self.attempts:,}")
            print(f"[*] Speed: {speed:.0f} hashes/sec")
        
        return None

    def hybrid_attack(self, target_hash, wordlist_file, suffix_charset='digits', suffix_length=2, hash_type='MD5'):
        """Hybrid attack combining dictionary words with brute force suffixes"""
        print(f"[*] Starting hybrid attack")
        print(f"[*] Wordlist: {wordlist_file}")
        print(f"[*] Suffix charset: {suffix_charset}")
        print(f"[*] Suffix length: {suffix_length}")
        
        suffix_chars = self.charsets.get(suffix_charset, string.digits)
        self.start_time = time.time()
        
        try:
            with open(wordlist_file, 'r', encoding='utf-8', errors='ignore') as f:
                for base_word in f:
                    base_word = base_word.strip()
                    if not base_word:
                        continue
                    
                    # Try base word without suffix
                    self.attempts += 1
                    generated_hash = self.hash_password(base_word, hash_type)
                    if generated_hash.lower() == target_hash.lower():
                        print(f"\n[+] PASSWORD FOUND: {base_word}")
                        return base_word
                    
                    # Try with suffixes
                    for suffix in itertools.product(suffix_chars, repeat=suffix_length):
                        password = base_word + ''.join(suffix)
                        self.attempts += 1
                        
                        generated_hash = self.hash_password(password, hash_type)
                        if generated_hash.lower() == target_hash.lower():
                            elapsed = time.time() - self.start_time
                            print(f"\n[+] PASSWORD FOUND!")
                            print(f"[+] Password: {password}")
                            print(f"[+] Base word: {base_word}")
                            print(f"[+] Suffix: {''.join(suffix)}")
                            print(f"[+] Attempts: {self.attempts:,}")
                            print(f"[+] Time: {elapsed:.2f} seconds")
                            self.found_passwords.append(password)
                            return password
                    
                    # Progress indicator
                    if self.attempts % 1000 == 0:
                        elapsed = time.time() - self.start_time
                        speed = self.attempts / elapsed if elapsed > 0 else 0
                        print(f"[*] Tried {self.attempts:,} combinations, Speed: {speed:.0f} H/s", end='\r')
        
        except FileNotFoundError:
            print(f"[!] Wordlist file not found: {wordlist_file}")
        
        print(f"\n[-] Password not found")
        return None

    def crack_multiple_hashes(self, hash_file, wordlist_file, hash_type='MD5'):
        """Crack multiple hashes from file"""
        print(f"[*] Loading hashes from {hash_file}")
        
        try:
            with open(hash_file, 'r') as f:
                hashes = [line.strip() for line in f if line.strip()]
            
            print(f"[*] Loaded {len(hashes)} hashes")
            
            for i, target_hash in enumerate(hashes, 1):
                print(f"\n[*] Cracking hash {i}/{len(hashes)}: {target_hash}")
                result = self.dictionary_attack(target_hash, wordlist_file, hash_type)
                if result:
                    print(f"[+] Hash {i} cracked: {result}")
                else:
                    print(f"[-] Hash {i} not cracked")
        
        except FileNotFoundError:
            print(f"[!] Hash file not found: {hash_file}")

    def generate_report(self):
        """Generate cracking report"""
        if not self.start_time:
            return
        
        elapsed = time.time() - self.start_time
        speed = self.attempts / elapsed if elapsed > 0 else 0
        
        print("\n" + "="*60)
        print("HASH CRACKING REPORT")
        print("="*60)
        print(f"Start time: {datetime.fromtimestamp(self.start_time)}")
        print(f"Duration: {elapsed:.2f} seconds")
        print(f"Total attempts: {self.attempts:,}")
        print(f"Average speed: {speed:.0f} hashes/second")
        print(f"Passwords found: {len(self.found_passwords)}")
        
        if self.found_passwords:
            print(f"\n🔑 Cracked passwords:")
            for password in self.found_passwords:
                print(f"   {password}")

def main():
    parser = argparse.ArgumentParser(description="Hash cracking toolkit")
    parser.add_argument('--hash', help='Single hash to crack')
    parser.add_argument('--hashfile', help='File containing multiple hashes')
    parser.add_argument('--attack', choices=['dictionary', 'brute', 'hybrid'], default='dictionary',
                       help='Attack type')
    parser.add_argument('--wordlist', help='Wordlist file for dictionary/hybrid attacks')
    parser.add_argument('--hashtype', default='MD5',
                       choices=['MD5', 'SHA1', 'SHA256', 'SHA512', 'NTLM'],
                       help='Hash algorithm')
    parser.add_argument('--charset', default='lowercase',
                       choices=['lowercase', 'uppercase', 'digits', 'symbols', 'all'],
                       help='Character set for brute force')
    parser.add_argument('--minlength', type=int, default=1,
                       help='Minimum password length for brute force')
    parser.add_argument('--maxlength', type=int, default=6,
                       help='Maximum password length for brute force')
    parser.add_argument('--threads', type=int, default=4,
                       help='Number of threads')
    
    args = parser.parse_args()
    
    if not args.hash and not args.hashfile:
        parser.error("Either --hash or --hashfile must be specified")
    
    if args.attack in ['dictionary', 'hybrid'] and not args.wordlist:
        parser.error(f"{args.attack} attack requires --wordlist")
    
    cracker = HashCracker(threads=args.threads)
    
    try:
        if args.hash:
            # Identify hash type
            identified_type = cracker.identify_hash(args.hash)
            print(f"[*] Identified hash type: {identified_type}")
            
            if args.attack == 'dictionary':
                result = cracker.dictionary_attack(args.hash, args.wordlist, args.hashtype)
            elif args.attack == 'brute':
                result = cracker.brute_force_attack(
                    args.hash, args.charset, args.minlength, args.maxlength, args.hashtype
                )
            elif args.attack == 'hybrid':
                result = cracker.hybrid_attack(args.hash, args.wordlist, 'digits', 2, args.hashtype)
            
        elif args.hashfile:
            cracker.crack_multiple_hashes(args.hashfile, args.wordlist, args.hashtype)
        
        cracker.generate_report()
        
    except KeyboardInterrupt:
        print("\n[!] Cracking interrupted by user")
        cracker.generate_report()
        return 1
    except Exception as e:
        print(f"[!] Error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())