//! Hash Cracker — Rayon parallel dictionary attack
//!
//! Cracks password hashes using a wordlist dictionary attack with parallel processing.
//! Supports SHA-1, SHA-256, and MD5 hash algorithms.
//!
//! Use case in Cystene:
//! - host_audit_scan finds /etc/shadow readable → extracts SHA-512/SHA-256 hashes
//! - ad_audit_scan finds Kerberoastable accounts → NTLM hashes can be cracked
//! - Proves that a password is weak by actually cracking it
//!
//! Why rayon: Hash computation is CPU-bound. Rayon distributes wordlist entries
//! across all CPU cores. Each core computes hashes independently.
//!
//! Pattern: BHR Ch1 — sha1_cracker with rayon parallelism added
//! Source: black-hat-rust-code/ch_01/sha1_cracker/src/main.rs

use pyo3::prelude::*;
use rayon::prelude::*;
use sha1::Digest;

/// Crack a hash using a wordlist. Supports SHA-1, SHA-256, MD5.
///
/// Args:
///     hash: The hash to crack (hex-encoded string, lowercase)
///     wordlist: List of candidate passwords to try
///     hash_type: Hash algorithm — "sha1", "sha256", or "md5"
///
/// Returns:
///     The cracked password (String) if found, or None if not in wordlist
///
/// Example from Python:
///     # SHA-1 of "password" = 5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8
///     result = engine.crack_hash("5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8", ["admin", "password", "123456"], "sha1")
///     # Returns: Some("password")
#[pyfunction]
pub fn crack_hash(
    hash: String,
    wordlist: Vec<String>,
    hash_type: String,
) -> PyResult<Option<String>> {
    let hash_lower = hash.to_lowercase();

    // Validate hash type
    let hash_fn: fn(&str) -> String = match hash_type.as_str() {
        "sha1" => compute_sha1,
        "sha256" => compute_sha256,
        "md5" => compute_md5,
        _ => {
            return Err(pyo3::exceptions::PyValueError::new_err(
                format!("Unsupported hash_type '{}'. Use: sha1, sha256, md5", hash_type)
            ));
        }
    };

    // Why par_iter: Each password candidate is independent. Rayon distributes across all cores.
    // find_first stops as soon as any thread finds a match — no wasted computation.
    // Pattern: BHR Ch1 — sequential iteration, upgraded to rayon parallel
    let result = wordlist
        .par_iter()
        .find_first(|password| {
            let computed = hash_fn(password.trim());
            computed == hash_lower
        })
        .cloned();

    Ok(result)
}

/// Compute SHA-1 hash of a string, return hex-encoded lowercase
/// Pattern: BHR Ch1 — hex::encode(sha1::Sha1::digest(password.as_bytes()))
fn compute_sha1(input: &str) -> String {
    hex::encode(sha1::Sha1::digest(input.as_bytes()))
}

/// Compute SHA-256 hash of a string, return hex-encoded lowercase
fn compute_sha256(input: &str) -> String {
    hex::encode(sha2::Sha256::digest(input.as_bytes()))
}

/// Compute MD5 hash of a string, return hex-encoded lowercase
fn compute_md5(input: &str) -> String {
    hex::encode(md5::Md5::digest(input.as_bytes()))
}
