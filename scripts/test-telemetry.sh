#!/usr/bin/env bash
exec "$(dirname "${BASH_SOURCE[0]}")/_run-playwright.sh" tests/telemetry.spec.js "$@"
