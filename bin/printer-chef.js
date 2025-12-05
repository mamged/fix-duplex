#!/usr/bin/env node
import('../src/cli.js').catch(err => {
  console.error('Failed to start printer-chef CLI:', err?.message || err);
  process.exit(1);
});
