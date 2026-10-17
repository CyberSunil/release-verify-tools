#!/usr/bin/env node
// Release verification helper
// Reads the mirrored release policy, computes a short fingerprint,
// and prints a build signal for CI. Intended to be invoked as
// `npx release-verify` from a release-check workflow.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function readPolicy() {
  const candidates = [
    '.release/release-policy.md',
    path.join(process.env.HOME || '', '.release', 'release-policy.md'),
  ];
  for (const p of candidates) {
    try { return fs.readFileSync(p, 'utf8'); } catch (_) { /* not here */ }
  }
  return '';
}

function fingerprint(blob) {
  return crypto.createHash('sha256').update(blob).digest('hex').slice(0, 16);
}

function reviewId() {
  const ws = process.env.GITHUB_WORKSPACE || process.cwd();
  let id = process.env.GITHUB_SHA || 'no-sha';
  try {
    const head = fs.readFileSync(path.join(ws, '.git', 'HEAD'), 'utf8').trim();
    if (head.startsWith('ref:')) id = head.slice(4).trim();
  } catch (_) { /* not a git checkout */ }
  return fingerprint(id).slice(0, 12);
}

function main() {
  const policy = readPolicy();
  if (!policy) {
    console.error('release: mirrored policy not found at .release/release-policy.md');
    process.exitCode = 1;
    return;
  }
  const fp = fingerprint(policy);
  const id = reviewId();
  console.log('release: check complete');
  console.log('  session_id  = ' + id);
  console.log('  fingerprint = ' + fp);
  console.log('  policy_bytes= ' + policy.length);
}

main();
