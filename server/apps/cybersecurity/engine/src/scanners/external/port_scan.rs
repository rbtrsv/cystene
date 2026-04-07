//! Port Scanner — Tokio async TCP connect scan
//!
//! Scans ports on a host using tokio's multi-threaded async runtime.
//! Thousands of concurrent TCP connections with bounded concurrency.
//!
//! Why tokio not rayon: Port scanning is I/O-bound (waiting for TCP handshake),
//! not CPU-bound. Tokio's async model handles thousands of concurrent connections
//! efficiently on a single thread pool, while rayon is designed for CPU-bound parallelism.
//!
//! Pattern: BHR Ch3 — tokio::net::TcpStream::connect with timeout + bounded concurrency
//! Source: black-hat-rust-code/ch_03/tricoder/src/ports.rs

use pyo3::prelude::*;
use std::net::{SocketAddr, ToSocketAddrs};
use std::time::Duration;
use tokio::net::TcpStream;
use tokio::sync::Semaphore;
use std::sync::Arc;

/// Scan ports on a host using tokio async TCP connect.
///
/// Args:
///     host: Target hostname or IP address
///     ports: List of port numbers to scan
///     timeout_ms: Connection timeout in milliseconds (e.g. 3000 = 3 seconds)
///     concurrency: Max concurrent connections (e.g. 500)
///
/// Returns:
///     List of (port, is_open) tuples
///
/// Example from Python:
///     results = engine.tcp_connect_scan("scanme.nmap.org", [22, 80, 443], 3000, 100)
#[pyfunction]
pub fn tcp_connect_scan(
    host: String,
    ports: Vec<u16>,
    timeout_ms: u64,
    concurrency: usize,
) -> PyResult<Vec<(u16, bool)>> {
    // Why build a tokio runtime here: PyO3 functions are called from Python's synchronous
    // context. We create a tokio runtime to run async code, then block on the result.
    // The runtime is multi-threaded — it uses all available CPU cores.
    let rt = tokio::runtime::Runtime::new()
        .map_err(|e| pyo3::exceptions::PyRuntimeError::new_err(format!("Failed to create tokio runtime: {}", e)))?;

    rt.block_on(async {
        // Resolve hostname to socket address
        let socket_addresses: Vec<SocketAddr> = format!("{}:0", host)
            .to_socket_addrs()
            .map_err(|e| pyo3::exceptions::PyValueError::new_err(format!("Failed to resolve host '{}': {}", host, e)))?
            .collect();

        if socket_addresses.is_empty() {
            return Err(pyo3::exceptions::PyValueError::new_err(format!("Could not resolve host '{}'", host)));
        }

        let base_addr = socket_addresses[0];
        let timeout = Duration::from_millis(timeout_ms);

        // Why Semaphore: Bounds concurrent connections to avoid overwhelming the target
        // or running out of file descriptors. Pattern from BHR Ch3's for_each_concurrent.
        let semaphore = Arc::new(Semaphore::new(concurrency));

        let mut handles = Vec::with_capacity(ports.len());

        for port in &ports {
            let permit = semaphore.clone().acquire_owned().await
                .map_err(|e| pyo3::exceptions::PyRuntimeError::new_err(format!("Semaphore error: {}", e)))?;

            let mut addr = base_addr;
            addr.set_port(*port);
            let port_val = *port;

            handles.push(tokio::spawn(async move {
                // Why timeout: Prevent hanging on filtered ports that never respond.
                // Pattern: BHR Ch3 — tokio::time::timeout wrapping TcpStream::connect
                let is_open = matches!(
                    tokio::time::timeout(timeout, TcpStream::connect(&addr)).await,
                    Ok(Ok(_)),
                );

                drop(permit); // Release semaphore slot
                (port_val, is_open)
            }));
        }

        // Collect results from all spawned tasks
        let mut results = Vec::with_capacity(handles.len());
        for handle in handles {
            match handle.await {
                Ok(result) => results.push(result),
                Err(_) => {} // Task panicked — skip
            }
        }

        Ok(results)
    })
}
