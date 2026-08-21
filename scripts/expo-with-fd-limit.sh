#!/usr/bin/env bash
# Raise macOS soft FD limit before Metro starts (avoids EMFILE when Watchman is not installed).
ulimit -n 65536 2>/dev/null || ulimit -n 10240 2>/dev/null || true
exec expo "$@"
