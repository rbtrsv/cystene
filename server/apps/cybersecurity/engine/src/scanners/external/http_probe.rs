//! HTTP Probe — Tokio parallel HTTP path checks
//!
//! Probes multiple HTTP paths on a host in parallel using tokio.
//! Used by web_scan.py to check for exposed files (/.git/HEAD, /.env, etc.)
//! and sensitive directories (/admin, /phpmyadmin, etc.).
//!
//! Why tokio: HTTP requests are I/O-bound. Tokio handles hundreds of concurrent
//! requests efficiently with bounded concurrency via Semaphore.
//!
//! Pattern: BHR Ch4 — modular HTTP checks with trait objects
//! Source: black-hat-rust-code/ch_04/tricoder/src/ (modules pattern)

use pyo3::prelude::*;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Semaphore;

/// Probe multiple HTTP paths on a host in parallel using tokio.
///
/// Args:
///     base_url: Base URL to probe (e.g. "https://example.com")
///     paths: List of paths to check (e.g. ["/.git/HEAD", "/.env", "/admin"])
///     timeout_ms: Request timeout in milliseconds
///     concurrency: Max concurrent HTTP requests
///
/// Returns:
///     List of (path, status_code, content_length) tuples.
///     status_code is 0 if the request failed (timeout, connection refused, etc.)
///
/// Example from Python:
///     results = engine.http_probe_paths("https://example.com", ["/.git/HEAD", "/.env"], 5000, 20)
#[pyfunction]
pub fn http_probe_paths(
    base_url: String,
    paths: Vec<String>,
    timeout_ms: u64,
    concurrency: usize,
) -> PyResult<Vec<(String, u16, usize)>> {
    let rt = tokio::runtime::Runtime::new()
        .map_err(|e| pyo3::exceptions::PyRuntimeError::new_err(format!("Failed to create tokio runtime: {}", e)))?;

    rt.block_on(async {
        let timeout = Duration::from_millis(timeout_ms);
        let semaphore = Arc::new(Semaphore::new(concurrency));

        // Why build client once: Reuses TCP connections (keep-alive) across requests.
        // Much faster than creating a new connection per path.
        let client = reqwest::Client::builder()
            .timeout(timeout)
            .danger_accept_invalid_certs(true) // Why: We're scanning, not trusting. Self-signed certs are common.
            .redirect(reqwest::redirect::Policy::limited(3))
            .user_agent("Mozilla/5.0 (compatible; CysteneScanner/1.0)")
            .build()
            .map_err(|e| pyo3::exceptions::PyRuntimeError::new_err(format!("Failed to create HTTP client: {}", e)))?;

        let mut handles = Vec::with_capacity(paths.len());

        for path in &paths {
            let permit = semaphore.clone().acquire_owned().await
                .map_err(|e| pyo3::exceptions::PyRuntimeError::new_err(format!("Semaphore error: {}", e)))?;

            let client = client.clone();
            let url = format!("{}{}", base_url.trim_end_matches('/'), path);
            let path_clone = path.clone();

            handles.push(tokio::spawn(async move {
                let result = match client.get(&url).send().await {
                    Ok(response) => {
                        let status = response.status().as_u16();
                        let content_length = response.content_length().unwrap_or(0) as usize;
                        (path_clone, status, content_length)
                    }
                    Err(_) => {
                        // Request failed — timeout, connection refused, etc.
                        (path_clone, 0u16, 0usize)
                    }
                };

                drop(permit);
                result
            }));
        }

        let mut results = Vec::with_capacity(handles.len());
        for handle in handles {
            match handle.await {
                Ok(result) => results.push(result),
                Err(_) => {}
            }
        }

        Ok(results)
    })
}
