#!/usr/bin/env bash
exec "$(dirname "${BASH_SOURCE[0]}")/_run-playwright.sh" tests/boot.spec.js tests/encounters.spec.js tests/rarity.spec.js tests/telemetry.spec.js "$@"
