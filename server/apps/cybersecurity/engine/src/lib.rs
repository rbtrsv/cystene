//! Cystene Engine — High-performance Rust modules for cybersecurity scanners
//!
//! Provides accelerated implementations of CPU-bound and I/O-bound scanner operations.
//! Python scanners import this as an optional accelerator — if the engine is not compiled,
//! scanners fall back to pure Python implementations.
//!
//! Modules organized by category (matching Python scanner structure):
//! - scanners/external/ — port_scan, subdomain_enum, http_probe (network scanning)
//! - scanners/crypto/ — hash_crack (password hash cracking)
//! - scanners/utils/ — banner_match (regex bulk matching)
//!
//! References:
//! - BHR Ch1: SHA-1 hash cracker (scanners/crypto/hash_crack.rs)
//! - BHR Ch2: Multi-threaded port scan + subdomain enum (scanners/external/)
//! - BHR Ch3: Async tokio port scan (scanners/external/port_scan.rs)
//! - BHR Ch4: Modular HTTP checks (scanners/external/http_probe.rs)
//!
//! Build: `cd server/apps/cybersecurity/engine && maturin develop --release`
//! Test: `uv run python -c "import engine; print(engine.tcp_connect_scan('scanme.nmap.org', [22, 80], 3000, 100))"`

// All modules under scanners/ — matching Python scanner folder structure
mod scanners;

use pyo3::prelude::*;

/// Python module definition — registers all Rust functions as Python callables.
///
/// After `maturin develop`, Python can do:
///   import engine
///   engine.tcp_connect_scan(...)
///   engine.crack_hash(...)
///   engine.bulk_banner_match(...)
#[pymodule]
fn engine(m: &Bound<'_, PyModule>) -> PyResult<()> {
    // scanners/external/ — network I/O heavy
    m.add_function(wrap_pyfunction!(scanners::external::port_scan::tcp_connect_scan, m)?)?;
    m.add_function(wrap_pyfunction!(scanners::external::subdomain_enum::resolve_subdomains, m)?)?;
    m.add_function(wrap_pyfunction!(scanners::external::http_probe::http_probe_paths, m)?)?;

    // scanners/crypto/ — CPU-bound hash operations
    m.add_function(wrap_pyfunction!(scanners::crypto::hash_crack::crack_hash, m)?)?;

    // scanners/utils/ — data processing
    m.add_function(wrap_pyfunction!(scanners::utils::banner_match::bulk_banner_match, m)?)?;

    Ok(())
}
