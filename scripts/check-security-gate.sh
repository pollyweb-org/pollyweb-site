#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
PENDING_FILE="${REPO_ROOT}/.security/pending-issues.txt"

if [[ ! -f "${PENDING_FILE}" ]]; then
  echo "security gate: no pending issues file found, allowing push"
  exit 0
fi

# Block if the file contains any non-comment, non-empty line.
if rg -n '^[[:space:]]*[^#[:space:]]' "${PENDING_FILE}" >/dev/null 2>&1; then
  echo "security gate: pending issues found"
  echo "Resolve or clear entries in .security/pending-issues.txt to push."
  exit 1
fi

echo "security gate: no pending issues, allowing push"
