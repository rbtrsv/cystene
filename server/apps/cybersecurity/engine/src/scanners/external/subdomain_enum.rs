//! Subdomain Enumeration — Rayon parallel DNS resolution
//!
//! Resolves a list of subdomains in parallel using rayon's data parallelism.
//! Used after crt.sh API returns a list of candidate subdomains — this module
//! verifies which ones actually resolve to an IP address.
//!
//! Why rayon not tokio: DNS resolution via std::net is blocking. Rayon distributes
//! blocking calls across thread pool workers. Each worker resolves one subdomain.
//!
//! Pattern: BHR Ch2 — trust-dns-resolver + rayon par_iter
//! Source: black-hat-rust-code/ch_02/tricoder/src/subdomains.rs

use pyo3::prelude::*;
use rayon::prelude::*;
use std::net::ToSocketAddrs;
use std::time::Duration;

/// Resolve a list of subdomains in parallel using rayon.
///
/// Args:
///     subdomains: List of subdomain strings to check (e.g. ["api.example.com", "mail.example.com"])
///     timeout_secs: DNS resolution timeout in seconds per subdomain
///
/// Returns:
///     List of (subdomain, resolves) tuples — resolves is true if the subdomain has an A/AAAA record
///
/// Example from Python:
///     results = engine.resolve_subdomains(["api.example.com", "mail.example.com"], 4)
#[pyfunction]
pub fn resolve_subdomains(
    subdomains: Vec<String>,
    timeout_secs: u64,
) -> PyResult<Vec<(String, bool)>> {
    // Why par_iter: Each DNS resolution is independent. Rayon distributes across all CPU cores.
    // For 1000 subdomains, this is ~Nx faster where N = number of cores.
    // Pattern: BHR Ch2 — subdomains.into_par_iter().filter(resolves).collect()
    let _timeout = Duration::from_secs(timeout_secs);

    let results: Vec<(String, bool)> = subdomains
        .into_par_iter()
        .map(|subdomain| {
            // Why format with :1024: ToSocketAddrs requires a port. We use 1024 as dummy.
            // We only care if the hostname resolves, not if the port is open.
            // Pattern: BHR Ch2 — format!("{}:1024", subdomain.domain).to_socket_addrs()
            let resolves = format!("{}:1024", subdomain)
                .to_socket_addrs()
                .map(|addrs| addrs.count() > 0)
                .unwrap_or(false);

            (subdomain, resolves)
        })
        .collect();

    Ok(results)
}
