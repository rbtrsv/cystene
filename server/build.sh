#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build and install Rust engine (PyO3)
# Why pip install maturin first: maturin is the build backend for engine's pyproject.toml
# Why pip install ./path: pip detects pyproject.toml, invokes maturin automatically,
# compiles Rust and installs into current Python environment. Standard Python mechanism.
pip install maturin
pip install ./apps/cybersecurity/engine

# Install Python dependencies
pip install -r requirements.txt

# Apply any outstanding database migrations
alembic upgrade head
