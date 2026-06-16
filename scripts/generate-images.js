// WholesaleUSPeptides — Product Image Generator
// Produces individual 1000x1000 PNG files per SKU
// Brand: Navy #05111F · Gold #C9A84C · White #FFFFFF
// All images: transparent background, soft lab shadows, premium clinical aesthetic
// Product container fills 70-80% of canvas height — large, clear, centered.

const { createCanvas } = require('canvas');
const fs   = require('fs');
const path = require('path');

const NAVY  = '#05111F';
const GOLD  = '#C9A84C';
const WHITE = '#FFFFFF';
const STONE = '#7D8794';
const W = 1000, H = 1000;

function hex2rgba(hex, a = 1) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function noShadow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
}

// ── Shared decorations ────────────────────────────────────────────────────────

function ruoBadge(ctx) {
  const bw = 280, bh = 32, bx = (W - bw) / 2, by = 16;
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 5); ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('RESEARCH USE ONLY', W / 2, by + 21);
}

function brandLine(ctx, y, size = 8, alpha = 0.35) {
  ctx.fillStyle = hex2rgba(GOLD, alpha);
  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('WHOLESALEUSPEPTIDES.COM', W / 2, y);
}

// WholesaleUSPeptides brand mark — used on all catalog product images.
// ("YOUR LOGO HERE" is reserved for white-label page assets only, not here.)
function wusMark(ctx, cx, cy, scale = 1) {
  const r = 46 * scale;
  ctx.strokeStyle = hex2rgba(GOLD, 0.55);
  ctx.lineWidth = 2 * scale;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = hex2rgba(GOLD, 0.25);
  ctx.lineWidth = 1 * scale;
  ctx.beginPath(); ctx.arc(cx, cy, r - 7 * scale, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = hex2rgba(NAVY, 0.92);
  ctx.font = `bold ${20 * scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('WUS', cx, cy + 6 * scale);

  ctx.fillStyle = hex2rgba(GOLD, 0.75);
  ctx.font = `bold ${8.5 * scale}px Arial`;
  ctx.fillText('PEPTIDES', cx, cy + 20 * scale);
}

function productLabel(ctx, name, cx, labelBottom) {
  ctx.fillStyle = hex2rgba(NAVY, 0.92);
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase(), cx, labelBottom - 18);
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
function saveCanvas(canvas, dir, filename) {
  const buf = canvas.toBuffer('image/png');
  const fp  = path.join('/home/user/wholesaleuspeptides/public/images', dir, filename + '.png');
  fs.writeFileSync(fp, buf);
  console.log('  ✓', dir + '/' + filename + '.png');
}

// ── BOTTLE ────────────────────────────────────────────────────────────────────
// Vial fills ~76% of canvas height (760/1000).
function generateBottle(name, filename, subtitle) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 6;
  const vw = 320, vh = 760, vr = 30;
  const vx = cx - vw / 2, vy = cy - vh / 2;

  // Drop shadow
  ctx.shadowColor = 'rgba(5,17,31,0.22)';
  ctx.shadowBlur  = 70;
  ctx.shadowOffsetY = 30;

  // Body — frosted white glass
  ctx.fillStyle = '#EEF1F5';
  ctx.beginPath(); ctx.roundRect(vx, vy + 90, vw, vh - 90, [0, 0, vr, vr]); ctx.fill();
  noShadow(ctx);

  // Cap — navy
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(vx + 18, vy, vw - 36, 110, [vr, vr, 10, 10]); ctx.fill();

  // Gold ring under cap
  ctx.fillStyle = GOLD;
  ctx.fillRect(vx + 18, vy + 96, vw - 36, 8);

  // Label background
  const lx = vx + 18, ly = vy + 150, lw = vw - 36, lh = 430;
  ctx.fillStyle = WHITE;
  ctx.fillRect(lx, ly, lw, lh);

  // Label top navy band
  ctx.fillStyle = NAVY;
  ctx.fillRect(lx, ly, lw, 48);
  brandLine(ctx, ly + 31, 13, 0.9);

  // Brand mark center of label
  wusMark(ctx, cx, ly + lh / 2 + 10, 1.5);

  // Gold bottom rule
  ctx.fillStyle = GOLD;
  ctx.fillRect(lx, ly + lh - 10, lw, 10);

  if (subtitle) {
    ctx.fillStyle = hex2rgba(NAVY, 0.6);
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(subtitle, cx, ly + lh - 24);
  }

  // Glass sheen
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.beginPath(); ctx.roundRect(vx + 16, vy + 90, 38, vh - 116, [10,10,10,10]); ctx.fill();

  // Product name below bottle
  ruoBadge(ctx);
  productLabel(ctx, name, cx, vy + vh + 90);

  saveCanvas(canvas, 'bottles', filename);
}

// ── CAPSULE ───────────────────────────────────────────────────────────────────
// Bottle fills ~74% of canvas height (740/1000).
function generateCapsule(name, filename) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 4;
  const bw = 340, bh = 740, br = 42;
  const bx = cx - bw / 2, by = cy - bh / 2;

  ctx.shadowColor = 'rgba(5,17,31,0.20)';
  ctx.shadowBlur  = 65;
  ctx.shadowOffsetY = 26;

  // Body
  ctx.fillStyle = '#F0F3F7';
  ctx.beginPath(); ctx.roundRect(bx, by + 100, bw, bh - 100, [10,10,br,br]); ctx.fill();
  noShadow(ctx);

  // Cap
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(bx + 10, by, bw - 20, 122, [br,br,14,14]); ctx.fill();

  // Gold ring
  ctx.fillStyle = GOLD;
  ctx.fillRect(bx + 10, by + 106, bw - 20, 9);

  // Brand text on cap
  brandLine(ctx, by + 68, 12, 0.9);

  // Label
  const lx = bx + 16, ly = by + 156, lw = bw - 32, lh = 330;
  ctx.fillStyle = WHITE;
  ctx.fillRect(lx, ly, lw, lh);
  ctx.fillStyle = NAVY;
  ctx.fillRect(lx, ly, lw, 36);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WHOLESALEUSPEPTIDES', cx, ly + 25);

  wusMark(ctx, cx, ly + lh / 2 + 8, 1.3);

  ctx.fillStyle = GOLD;
  ctx.fillRect(lx, ly + lh - 8, lw, 8);

  // Count tag
  ctx.fillStyle = hex2rgba(NAVY, 0.08);
  ctx.beginPath(); ctx.roundRect(cx - 80, by + bh + 14, 160, 44, 8); ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('60 CAPSULES', cx, by + bh + 43);

  ruoBadge(ctx);
  productLabel(ctx, name, cx, by + bh + 112);

  saveCanvas(canvas, 'capsules', filename);
}

// ── SPRAY ─────────────────────────────────────────────────────────────────────
// Bottle fills ~74% of canvas height (740/1000).
function generateSpray(name, filename) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 8;
  const bw = 220, bh = 740;
  const bx = cx - bw / 2, by = cy - bh / 2;

  ctx.shadowColor = 'rgba(5,17,31,0.18)';
  ctx.shadowBlur  = 60;
  ctx.shadowOffsetY = 24;

  // Body
  ctx.fillStyle = '#E8EDF2';
  ctx.beginPath(); ctx.roundRect(bx, by + 200, bw, bh - 200, [8,8,28,28]); ctx.fill();
  noShadow(ctx);

  // Neck
  ctx.fillStyle = '#D4D9DF';
  ctx.beginPath(); ctx.roundRect(cx - 42, by + 112, 84, 110, [8,8,4,4]); ctx.fill();

  // Pump head
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(cx - 68, by + 60, 136, 70, [22,22,12,12]); ctx.fill();

  // Nozzle
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(cx + 34, by + 70, 68, 30, [15,15,15,15]); ctx.fill();

  // Gold separator
  ctx.fillStyle = GOLD;
  ctx.fillRect(bx, by + 212, bw, 8);

  // Label
  const lx = bx + 10, ly = by + 240, lw = bw - 20, lh = 290;
  ctx.fillStyle = WHITE;
  ctx.fillRect(lx, ly, lw, lh);
  ctx.fillStyle = NAVY;
  ctx.fillRect(lx, ly, lw, 34);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WUSPEPTIDES', cx, ly + 23);

  wusMark(ctx, cx, ly + lh / 2 + 10, 1.0);

  ctx.fillStyle = GOLD;
  ctx.fillRect(lx, ly + lh - 8, lw, 8);

  // Volume tag
  ctx.fillStyle = hex2rgba(NAVY, 0.07);
  ctx.beginPath(); ctx.roundRect(cx - 54, by + bh + 14, 108, 38, 6); ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 17px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('30 ml', cx, by + bh + 40);

  ruoBadge(ctx);
  productLabel(ctx, name, cx, by + bh + 108);

  saveCanvas(canvas, 'sprays', filename);
}

// ── CREAM ─────────────────────────────────────────────────────────────────────
// Jar fills ~73% of canvas height (730/1000).
function generateCream(name, filename) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 14;
  const jw = 520, jh = 540, jr = 36;
  const jx = cx - jw / 2, jy = cy - jh / 2;

  ctx.shadowColor = 'rgba(5,17,31,0.18)';
  ctx.shadowBlur  = 65;
  ctx.shadowOffsetY = 32;

  // Body
  ctx.fillStyle = '#EDF0F4';
  ctx.beginPath(); ctx.roundRect(jx, jy + 60, jw, jh - 60, [8,8,jr,jr]); ctx.fill();
  noShadow(ctx);

  // Lid
  ctx.shadowColor = 'rgba(5,17,31,0.14)';
  ctx.shadowBlur  = 18;
  ctx.shadowOffsetY = -6;
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(jx - 14, jy - 90, jw + 28, 160, [jr,jr,10,10]); ctx.fill();
  noShadow(ctx);

  // Gold lid ring
  ctx.fillStyle = GOLD;
  ctx.fillRect(jx - 14, jy + 58, jw + 28, 10);

  // Lid text
  ctx.fillStyle = hex2rgba(GOLD, 0.85);
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WHOLESALEUSPEPTIDES.COM', cx, jy - 8);

  // Label on jar body
  const lx = jx + 30, ly = jy + 110, lw = jw - 60, lh = 320;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillRect(lx, ly, lw, lh);

  ctx.strokeStyle = hex2rgba(GOLD, 0.3);
  ctx.lineWidth = 2;
  ctx.strokeRect(lx + 10, ly + 10, lw - 20, lh - 20);

  wusMark(ctx, cx, ly + lh / 2, 1.6);

  ruoBadge(ctx);
  productLabel(ctx, name, cx, jy + jh + 130);

  ctx.fillStyle = hex2rgba(STONE, 0.8);
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('50ml Cream', cx, jy + jh + 168);

  saveCanvas(canvas, 'creams', filename);
}

// ── PRODUCT LISTS ─────────────────────────────────────────────────────────────
// Matches the live catalog in src/App.jsx exactly.
// [ name, filename, subtitle (optional) ] — filename must match productImg() output.
const BOTTLES = [
  // Peptides
  ['BPC-157',            'bpc-157'],
  ['TB-500',              'tb-500'],
  ['Ipamorelin',          'ipamorelin'],
  ['AOD-9604',            'aod-9604'],
  ['CJC-1295 W DAC',      'cjc-1295-w-dac'],
  ['CJC-1295',            'cjc-1295'],
  ['Epithalon',           'epithalon'],
  ['GHK-Cu',              'ghk-cu'],
  ['Melanotan-II',        'melanotan-ii'],
  ['FOXO4-DRI',           'foxo4-dri'],
  ['KPV',                 'kpv'],
  ['VIP',                 'vip'],
  ['GHRP-2',              'ghrp-2'],
  ['GHRP-6',              'ghrp-6'],
  ['SNAP-8',              'snap-8'],
  ['MOTS-C',              'mots-c'],
  ['IGF-1 LR3',           'igf-1-lr3'],
  ['Dihexa',              'dihexa'],
  ['Oxytocin',            'oxytocin'],
  ['PT-141',              'pt-141'],
  ['Thymosin Alpha-1',    'thymosin-alpha-1'],
  ['Gonadorelin',         'gonadorelin'],
  ['Semax',               'semax'],
  ['Selank',              'selank'],
  ['NAD+',                'nad'],
  ['LL-37',               'll-37'],
  ['ARA-290',             'ara-290'],
  ['SS-31',               'ss-31'],
  ['HGH Frag 176-191',    'hgh-frag-176-191'],
  // GLP
  ['GLP-S',               'glp-s', '5mg – 20mg'],
  ['GLP-T',               'glp-t', '10mg – 40mg'],
  ['GLP-R',               'glp-r', '10mg – 30mg'],
  ['Tesamorelin',         'tesamorelin'],
  ['Sermorelin',          'sermorelin'],
  // Bio Regulators
  ['Pinealon',            'pinealon'],
  ['Ovagen',              'ovagen'],
  ['Chonluten',           'chonluten'],
  ['Thymalin',            'thymalin'],
  ['Cardiogen',           'cardiogen'],
  ['Vesugen',             'vesugen'],
  ['Testagen',            'testagen'],
  ['Vilon',               'vilon'],
  ['Crystagen',           'crystagen'],
  ['Bronchogen',          'bronchogen'],
  // Blends
  ['BPC-TB Blend',        'bpc-tb'],
  ['Ipa/CJC Blend',       'ipa-cjc'],
  ['GLOW Blend',          'glow'],
  ['KLOW Blend',          'klow'],
  ['Semax/Selank',        'semax-selank'],
  ['AOD/Tesa Blend',      'aod-tesa'],
  // Diluents
  ['Water',               'water'],
];
const CAPSULES = [
  ['BPC-157',          'bpc-157'],
  ['TB-500',           'tb-500'],
  ['NAD+',             'nad'],
  ['NMN',              'nmn'],
  ['Methylene Blue',   'methylene-blue'],
  ['LDN',              'ldn'],
  ['Berberine HCl',    'berberine-hcl'],
  ['Rapamycin',        'rapamycin'],
  ['Metformin',        'metformin'],
];

const SPRAYS = [
  ['BPC-157', 'bpc-157'],
  ['NAD+',    'nad'],
  ['Semax',   'semax'],
  ['Selank',  'selank'],
  ['PT-141',  'pt-141'],
  ['TB500',   'tb500'],
];

const CREAMS = [
  ['Repair', 'repair'],
  ['Smooth', 'smooth'],
  ['Tan',    'tan'],
];

console.log('\n── Bottles (' + BOTTLES.length + ') ──');
BOTTLES.forEach(([n, fn, sub]) => generateBottle(n, fn, sub));

console.log('\n── Capsules (' + CAPSULES.length + ') ──');
CAPSULES.forEach(([n, fn]) => generateCapsule(n, fn));

console.log('\n── Sprays (' + SPRAYS.length + ') ──');
SPRAYS.forEach(([n, fn]) => generateSpray(n, fn));

console.log('\n── Creams (' + CREAMS.length + ') ──');
CREAMS.forEach(([n, fn]) => generateCream(n, fn));

const total = BOTTLES.length + CAPSULES.length + SPRAYS.length + CREAMS.length;
console.log(`\n✓ ${total} product images generated.\n`);
