#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
dist_dir="$repo_root/dist"

cd "$repo_root"
mkdir -p "$dist_dir"

npm run lint
npm run compile
npx vsce package \
  --allow-missing-repository \
  --baseContentUrl https://github.com/placeholder/vscode-mcp-hook \
  --out "$dist_dir"
