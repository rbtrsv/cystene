# SSH SOCKS Proxy Tunnel

## What Is This?

A way to make your internet traffic appear to come from a remote server instead of your local machine.

## The Problem We Solved

Hetzner console was down globally, but still worked from **inside** their datacenter. We needed a way to access it "from the inside."

## The Solution

Route browser traffic through our Hetzner server using an SSH tunnel.

```
Your Mac → SSH Tunnel → Hetzner Server (91.98.44.218) → Hetzner Console
                                ↑
                    Console sees this IP, not yours
```

## Commands Explained

### Regular SSH
```bash
ssh root@91.98.44.218
```
- Opens terminal to remote server
- Your browser still uses your home internet
- Websites see your home IP

### SSH with SOCKS Proxy
```bash
ssh -D 1080 root@91.98.44.218
```
- Same terminal access
- **PLUS** creates a SOCKS proxy on your Mac's port 1080
- `-D 1080` = "Dynamic" port forwarding on port 1080
- Any app configured to use `localhost:1080` as proxy will route through the server

## How to Use

### 1. Start the Tunnel
```bash
ssh -D 1080 root@91.98.44.218
```
Keep this terminal window open.

### 2. Configure Browser/System

**macOS System-wide (affects all apps):**
1. System Settings → Network → Wi-Fi → Details → Proxies
2. Enable "SOCKS Proxy"
3. Server: `127.0.0.1`
4. Port: `1080`
5. Click OK → Apply

**Firefox Only (doesn't affect other apps):**
1. Settings → Network Settings → Manual proxy
2. SOCKS Host: `localhost`
3. Port: `1080`
4. Select "SOCKS v5"

### 3. Browse
Go to the website (e.g., console.hetzner.cloud). It sees your server's IP.

### 4. Disable When Done
Turn off the proxy settings, otherwise all your traffic goes through Hetzner.

## Why This Works

```
Normal connection:
Your Mac (home IP) → Hetzner Console → BLOCKED (outage from external IPs)

With SOCKS proxy:
Your Mac → SSH Tunnel → Hetzner Server → Hetzner Console → WORKS
                              ↑
                    Request comes from datacenter IP
```

The console thinks you're connecting from inside Hetzner's network.

## Key Concepts

| Term | Meaning |
|------|---------|
| SSH | Secure Shell - encrypted connection to remote server |
| SOCKS | Protocol for routing traffic through a proxy |
| `-D` flag | Dynamic port forwarding (creates SOCKS proxy) |
| Port 1080 | Arbitrary choice, could be any free port |
| Tunnel | Encrypted "pipe" your traffic flows through |

## When to Use This

- Service works from datacenter but not from outside
- You want to appear to be in a different location
- Bypass geo-restrictions (your server's location)
- Access internal resources that only accept datacenter IPs

## Security Notes

- All traffic through the tunnel is encrypted (SSH)
- The remote server can see your unencrypted traffic after it exits
- Only use with servers you trust
- Remember to disable proxy when done
