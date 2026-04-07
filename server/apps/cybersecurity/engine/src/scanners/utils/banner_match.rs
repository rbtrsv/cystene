//! Banner Matcher — Rayon parallel regex matching
//!
//! Matches multiple regex patterns against multiple banners in parallel.
//! Used by vuln_scan.py to match service versions against CVE patterns,
//! and by port_scan.py to identify services from banner responses.
//!
//! Why rayon: Regex matching on large datasets is CPU-bound. With 1000+ banners
//! and 100+ patterns, rayon distributes the work across all cores.
//!
//! Why Rust regex: Rust's regex crate is 10-50x faster than Python's re module
//! for bulk operations. It compiles patterns once and reuses them.

use pyo3::prelude::*;
use rayon::prelude::*;
use regex::Regex;

/// Match multiple regex patterns against multiple banners in parallel.
///
/// Args:
///     banners: List of banner strings (e.g. ["OpenSSH 8.9p1", "nginx/1.24.0"])
///     patterns: List of regex patterns (e.g. ["OpenSSH (\\d+\\.\\d+)", "nginx/(\\d+\\.\\d+)"])
///
/// Returns:
///     List of (banner_index, pattern_index, matched_text) tuples.
///     matched_text is the full match (group 0). Only includes successful matches.
///
/// Example from Python:
///     matches = engine.bulk_banner_match(
///         ["OpenSSH 8.9p1", "nginx/1.24.0", "Apache/2.4.51"],
///         ["OpenSSH (\\d+\\.\\d+)", "nginx/(\\d+\\.\\d+)"]
///     )
///     # Returns: [(0, 0, "OpenSSH 8.9"), (1, 1, "nginx/1.24")]
#[pyfunction]
pub fn bulk_banner_match(
    banners: Vec<String>,
    patterns: Vec<String>,
) -> PyResult<Vec<(usize, usize, String)>> {
    // Why compile patterns once: Regex compilation is expensive. We compile all patterns
    // upfront, then reuse them across all banners. This is the key optimization.
    let compiled_patterns: Vec<Option<Regex>> = patterns
        .iter()
        .map(|p| Regex::new(p).ok())
        .collect();

    // Why par_iter on banners: Each banner is matched against all patterns independently.
    // Rayon distributes banners across CPU cores.
    let results: Vec<(usize, usize, String)> = banners
        .par_iter()
        .enumerate()
        .flat_map(|(banner_idx, banner)| {
            let mut matches = Vec::new();
            for (pattern_idx, compiled) in compiled_patterns.iter().enumerate() {
                if let Some(re) = compiled {
                    if let Some(m) = re.find(banner) {
                        matches.push((banner_idx, pattern_idx, m.as_str().to_string()));
                    }
                }
            }
            matches
        })
        .collect();

    Ok(results)
}
