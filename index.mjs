#!/usr/bin/env node
// au-number-check — look up an Australian phone number against EndSpam's
// community reports, from the terminal.
//
// Data: https://www.endspam.org — a community-run reputation service for
// Australian phone numbers. A number only has a public record once
// multiple independent people have reported it and the reports passed
// moderation; anything else 404s by design (privacy).
//
// Zero dependencies, Node 18+ (global fetch).

const API = 'https://api.endspam.org/api/public/numbers';
const SITE = 'https://www.endspam.org';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const positional = args.filter((a) => !a.startsWith('--'));

if (positional.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`au-number-check — check an Australian phone number against EndSpam community reports

Usage:
  node index.mjs <number> [--json]
  npx github:changchunlei/au-number-check <number>

Examples:
  node index.mjs 0418666500
  node index.mjs "+61 3 9961 2116" --json

The number is normalised automatically: spaces, dashes, parentheses,
and a +61 country prefix are all fine.

Exit codes: 0 record found · 1 no public record · 2 bad input · 3 network/API error

Data: ${SITE} — community-reported AU phone reputation. Free to use.`);
  process.exit(positional.length === 0 ? 2 : 0);
}

// --- number normalisation -------------------------------------------------
// Accepts 0412345678, 0412 345 678, (03) 9961 2116, +61412345678 …
// and returns the 10-digit national form the API expects.
function normalizeAuNumber(raw) {
  let digits = String(raw).replace(/[^0-9+]/g, '');
  if (digits.startsWith('+61')) digits = digits.slice(3);
  // 61 + national form (610412345678) or 61 + significant form (61412345678)
  else if (digits.startsWith('61') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length === 10) return digits;
  // E.164 drops the national leading 0: +61 3 9961 2116 → 399612116.
  if (/^[2-9]\d{8}$/.test(digits)) return `0${digits}`;
  return null;
}

const national = normalizeAuNumber(positional[0]);
if (!national) {
  console.error(`Not a valid Australian number: "${positional[0]}"
Expected 10 digits starting with 0 (e.g. 0412 345 678), optionally with a +61 prefix.`);
  process.exit(2);
}

// --- lookup ----------------------------------------------------------------
let res;
try {
  res = await fetch(`${API}/${encodeURIComponent(national)}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
} catch (err) {
  console.error(`Network error talking to the EndSpam API: ${err?.message ?? err}`);
  process.exit(3);
}

if (res.status === 404) {
  const msg = {
    number: national,
    found: false,
    note: 'No public record yet. EndSpam only publishes numbers with multiple independent moderated reports — check the site to add yours.',
  };
  if (asJson) console.log(JSON.stringify(msg, null, 2));
  else console.log(`${national}: no public record yet.
EndSpam only publishes numbers with multiple independent moderated reports.
If you just got a call from it, report it at ${SITE} — you may be the first.`);
  process.exit(1);
}

if (!res.ok) {
  console.error(`EndSpam API returned HTTP ${res.status} — try again shortly.`);
  process.exit(3);
}

const d = await res.json();

if (asJson) {
  console.log(JSON.stringify(d, null, 2));
  process.exit(0);
}

const fmt = (n) => Number(n ?? 0).toLocaleString('en-AU');
console.log(`${d.formattedNumber ?? national} — ${d.category ?? 'uncategorised'}`);
if (d.riskLevel) {
  console.log(`Risk: ${d.riskLevel}${d.riskScore != null ? ` (${d.riskScore}/100)` : ''}`);
}
if (d.reportCount != null) {
  console.log(`Reports: ${fmt(d.reportCount)}${d.independentReporterCount != null ? ` from ${fmt(d.independentReporterCount)} independent reporters` : ''}`);
}
if (d.lastReported) console.log(`Last reported: ${d.lastReported}`);
if (d.carrier) console.log(`Carrier: ${d.carrier}`);
if (d.numberingArea) console.log(`Numbering area: ${d.numberingArea}`);
if (Array.isArray(d.recentComments) && d.recentComments.length > 0) {
  console.log(`\nRecent community reports:`);
  for (const c of d.recentComments.slice(0, 3)) {
    const note = (c.notes ?? '').replace(/\s+/g, ' ').trim();
    if (note) console.log(`  · "${note.slice(0, 140)}"${note.length > 140 ? '…' : ''}`);
  }
}
console.log(`\nFull report history: ${SITE}/number/${national}`);
