FROM kalilinux/kali-rolling:latest

# Fix Kali repositories
RUN echo "deb http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware" > /etc/apt/sources.list && \
    echo "deb-src http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware" >> /etc/apt/sources.list

# Update and install MCP server first
# https://www.kali.org/tools/mcp-kali-server/
RUN apt-get update && \
    apt-get install -y mcp-kali-server && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install scanning tools
RUN apt-get update && \
    apt-get install -y \
    nmap \
    nikto \
    masscan \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install web tools
RUN apt-get update && \
    apt-get install -y \
    sqlmap \
    gobuster \
    dirb \
    wfuzz \
    whatweb \
    wafw00f \
    wpscan \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install enumeration tools
RUN apt-get update && \
    apt-get install -y \
    enum4linux \
    smbclient \
    nbtscan \
    dnsrecon \
    dnsenum \
    fierce \
    theharvester \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install password tools
RUN apt-get update && \
    apt-get install -y \
    hydra \
    john \
    hashcat \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install forensics tools
RUN apt-get update && \
    apt-get install -y \
    binwalk \
    foremost \
    steghide \
    exiftool \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install metasploit
RUN apt-get update && \
    apt-get install -y \
    metasploit-framework \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Expose API server port
EXPOSE 5000

# Run the Kali API server
CMD ["kali-server-mcp", "--port", "5000"]
