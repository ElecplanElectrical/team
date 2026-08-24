#!/bin/sh
set -eu
cd /app
exec ./node_modules/.bin/tsx scripts/scan-enrichment-worker.ts
