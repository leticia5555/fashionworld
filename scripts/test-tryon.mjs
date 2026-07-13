#!/usr/bin/env node
// E2E test for the production try-on flow (FASHN via /api/tryon).
//
// Usage:
//   node scripts/test-tryon.mjs <model-photo>            # local file (jpg/png) or https:// URL of a person photo
//   node scripts/test-tryon.mjs <model-photo> <garment>  # optional garment override (default: Lavender Slip Dress)
//
// Example:
//   node scripts/test-tryon.mjs ./selfie.jpg
//
// Exits 0 and prints the FASHN output URL on success; exits 1 with the raw
// error response otherwise.

import { readFile } from 'node:fs/promises';

const BASE = process.env.TRYON_BASE_URL || 'https://fashionworld-theta.vercel.app';
const GARMENT_DEFAULT = '/garments/icony-slip-dress.png'; // ICONY Lavender Slip Dress

const [modelArg, garmentArg] = process.argv.slice(2);
if (!modelArg) {
  console.error('Usage: node scripts/test-tryon.mjs <model-photo.jpg | https://...> [garment-url]');
  process.exit(1);
}

async function toModelImage(arg) {
  if (/^https?:\/\//.test(arg) || arg.startsWith('data:')) return arg;
  const buf = await readFile(arg);
  const mime = arg.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

const modelImage = await toModelImage(modelArg);
const garmentImage = garmentArg || GARMENT_DEFAULT;

console.log(`POST ${BASE}/api/tryon  (garment: ${garmentImage})`);
const sub = await fetch(`${BASE}/api/tryon`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ modelImage, garmentImage, category: 'auto' })
});
const sd = await sub.json();
console.log('submit response:', sub.status, JSON.stringify(sd));
if (!sub.ok || !sd.id) process.exit(1);

for (let i = 0; i < 45; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const st = await fetch(`${BASE}/api/tryon-status?id=${encodeURIComponent(sd.id)}`);
  const sj = await st.json();
  console.log(`poll ${i + 1}:`, st.status, JSON.stringify(sj));
  if (sj.status === 'completed' && sj.output?.[0]) {
    console.log('\n✅ TRY-ON OK — result image:', sj.output[0]);
    process.exit(0);
  }
  if (sj.status === 'failed' || !st.ok) {
    console.error('\n❌ TRY-ON FAILED:', sj.error || JSON.stringify(sj));
    process.exit(1);
  }
}
console.error('\n❌ Timed out after 90s');
process.exit(1);
