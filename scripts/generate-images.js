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
// Vial fills ~88% of canvas height (875/1000); top whitespace cut ~50% vs. prior pass.
function generateBottle(name, filename, subtitle) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const vw = 400, vh = 875, vr = 34;
  const vx = cx - vw / 2, vy = 60;

  // Drop shadow — soft, premium
  ctx.shadowColor = 'rgba(5,17,31,0.28)';
  ctx.shadowBlur  = 80;
  ctx.shadowOffsetY = 36;

  // Body — frosted white glass
  ctx.fillStyle = '#EEF1F5';
  ctx.beginPath(); ctx.roundRect(vx, vy + 112, vw, vh - 112, [0, 0, vr, vr]); ctx.fill();
  noShadow(ctx);

  // Cap — navy
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(vx + 22, vy, vw - 44, 138, [vr, vr, 12, 12]); ctx.fill();

  // Gold ring under cap
  ctx.fillStyle = GOLD;
  ctx.fillRect(vx + 22, vy + 120, vw - 44, 10);

  // Label background
  const lx = vx + 22, ly = vy + 188, lw = vw - 44, lh = 540;
  ctx.fillStyle = WHITE;
  ctx.fillRect(lx, ly, lw, lh);

  // Label top navy band
  ctx.fillStyle = NAVY;
  ctx.fillRect(lx, ly, lw, 60);
  brandLine(ctx, ly + 39, 16, 0.9);

  // Brand mark center of label
  wusMark(ctx, cx, ly + lh / 2 + 10, 1.9);

  // Gold bottom rule
  ctx.fillStyle = GOLD;
  ctx.fillRect(lx, ly + lh - 12, lw, 12);

  if (subtitle) {
    ctx.fillStyle = hex2rgba(NAVY, 0.6);
    ctx.font = 'bold 19px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(subtitle, cx, ly + lh - 28);
  }

  // Glass reflections — primary sheen
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath(); ctx.roundRect(vx + 20, vy + 112, 48, vh - 148, [12,12,12,12]); ctx.fill();
  // Secondary subtle highlight streak
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.roundRect(vx + vw - 60, vy + 130, 22, vh - 190, [10,10,10,10]); ctx.fill();
  // Faint cap highlight
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.roundRect(vx + 34, vy + 10, vw - 100, 30, [8,8,8,8]); ctx.fill();

  // Product name below bottle
  ruoBadge(ctx);
  productLabel(ctx, name, cx, vy + vh + 36);

  saveCanvas(canvas, 'bottles', filename);
}

// ── CAPSULE ───────────────────────────────────────────────────────────────────
// Bottle fills ~88% of canvas height (880/1000); top whitespace cut ~50% vs. prior pass.
function generateCapsule(name, filename) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const bw = 425, bh = 860, br = 52;
  const bx = cx - bw / 2, by = 56;

  ctx.shadowColor = 'rgba(5,17,31,0.26)';
  ctx.shadowBlur  = 75;
  ctx.shadowOffsetY = 32;

  // Body
  ctx.fillStyle = '#F0F3F7';
  ctx.beginPath(); ctx.roundRect(bx, by + 120, bw, bh - 120, [12,12,br,br]); ctx.fill();
  noShadow(ctx);

  // Cap
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(bx + 12, by, bw - 24, 148, [br,br,16,16]); ctx.fill();

  // Gold ring
  ctx.fillStyle = GOLD;
  ctx.fillRect(bx + 12, by + 128, bw - 24, 11);

  // Brand text on cap
  brandLine(ctx, by + 82, 15, 0.9);

  // Label
  const lx = bx + 20, ly = by + 188, lw = bw - 40, lh = 400;
  ctx.fillStyle = WHITE;
  ctx.fillRect(lx, ly, lw, lh);
  ctx.fillStyle = NAVY;
  ctx.fillRect(lx, ly, lw, 44);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WHOLESALEUSPEPTIDES', cx, ly + 30);

  wusMark(ctx, cx, ly + lh / 2 + 8, 1.6);

  ctx.fillStyle = GOLD;
  ctx.fillRect(lx, ly + lh - 10, lw, 10);

  // Glass reflections
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.beginPath(); ctx.roundRect(bx + 18, by + 120, 40, bh - 160, [10,10,10,10]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.beginPath(); ctx.roundRect(bx + bw - 50, by + 134, 18, bh - 190, [8,8,8,8]); ctx.fill();

  // Count tag
  ctx.fillStyle = hex2rgba(NAVY, 0.08);
  ctx.beginPath(); ctx.roundRect(cx - 90, by + bh + 6, 180, 34, 7); ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('60 CAPSULES', cx, by + bh + 29);

  ruoBadge(ctx);
  productLabel(ctx, name, cx, by + bh + 78);

  saveCanvas(canvas, 'capsules', filename);
}

// ── SPRAY ─────────────────────────────────────────────────────────────────────
// Bottle fills ~87% of canvas height (870/1000); top whitespace cut ~50% vs. prior pass.
function generateSpray(name, filename) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const bw = 275, bh = 870;
  const bx = cx - bw / 2, by = 60;

  ctx.shadowColor = 'rgba(5,17,31,0.24)';
  ctx.shadowBlur  = 70;
  ctx.shadowOffsetY = 28;

  // Body
  ctx.fillStyle = '#E8EDF2';
  ctx.beginPath(); ctx.roundRect(bx, by + 236, bw, bh - 236, [10,10,34,34]); ctx.fill();
  noShadow(ctx);

  // Neck
  ctx.fillStyle = '#D4D9DF';
  ctx.beginPath(); ctx.roundRect(cx - 52, by + 132, 104, 130, [10,10,5,5]); ctx.fill();

  // Pump head
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(cx - 84, by + 70, 168, 84, [26,26,14,14]); ctx.fill();

  // Nozzle
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(cx + 42, by + 82, 84, 36, [18,18,18,18]); ctx.fill();

  // Gold separator
  ctx.fillStyle = GOLD;
  ctx.fillRect(bx, by + 250, bw, 10);

  // Label
  const lx = bx + 12, ly = by + 284, lw = bw - 24, lh = 340;
  ctx.fillStyle = WHITE;
  ctx.fillRect(lx, ly, lw, lh);
  ctx.fillStyle = NAVY;
  ctx.fillRect(lx, ly, lw, 40);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WUSPEPTIDES', cx, ly + 27);

  wusMark(ctx, cx, ly + lh / 2 + 10, 1.25);

  ctx.fillStyle = GOLD;
  ctx.fillRect(lx, ly + lh - 10, lw, 10);

  // Glass reflections
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.roundRect(bx + 10, by + 236, 24, bh - 270, [8,8,8,8]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.roundRect(bx + bw - 34, by + 250, 12, bh - 300, [6,6,6,6]); ctx.fill();

  // Volume tag
  ctx.fillStyle = hex2rgba(NAVY, 0.07);
  ctx.beginPath(); ctx.roundRect(cx - 60, by + bh + 6, 120, 32, 6); ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('30 ml', cx, by + bh + 28);

  ruoBadge(ctx);
  productLabel(ctx, name, cx, by + bh + 70);

  saveCanvas(canvas, 'sprays', filename);
}

// ── CREAM ─────────────────────────────────────────────────────────────────────
// Jar fills ~87% of canvas height; top whitespace cut ~50% vs. prior pass.
function generateCream(name, filename) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const jw = 650, jh = 760, jr = 44;
  const jx = cx - jw / 2, jy = 130;

  ctx.shadowColor = 'rgba(5,17,31,0.26)';
  ctx.shadowBlur  = 78;
  ctx.shadowOffsetY = 40;

  // Body
  ctx.fillStyle = '#EDF0F4';
  ctx.beginPath(); ctx.roundRect(jx, jy + 76, jw, jh - 76, [10,10,jr,jr]); ctx.fill();
  noShadow(ctx);

  // Lid
  ctx.shadowColor = 'rgba(5,17,31,0.16)';
  ctx.shadowBlur  = 22;
  ctx.shadowOffsetY = -8;
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(jx - 18, jy - 112, jw + 36, 200, [jr,jr,12,12]); ctx.fill();
  noShadow(ctx);

  // Gold lid ring
  ctx.fillStyle = GOLD;
  ctx.fillRect(jx - 18, jy + 74, jw + 36, 12);

  // Lid text
  ctx.fillStyle = hex2rgba(GOLD, 0.85);
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WHOLESALEUSPEPTIDES.COM', cx, jy - 12);

  // Label on jar body
  const lx = jx + 38, ly = jy + 140, lw = jw - 76, lh = 410;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillRect(lx, ly, lw, lh);

  ctx.strokeStyle = hex2rgba(GOLD, 0.3);
  ctx.lineWidth = 2.4;
  ctx.strokeRect(lx + 12, ly + 12, lw - 24, lh - 24);

  wusMark(ctx, cx, ly + lh / 2, 2.0);

  // Glass/jar reflections
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath(); ctx.roundRect(jx + 16, jy + 76, 40, jh - 130, [10,10,10,10]); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath(); ctx.roundRect(jx + jw - 56, jy + 90, 16, jh - 160, [8,8,8,8]); ctx.fill();

  ruoBadge(ctx);
  productLabel(ctx, name, cx, jy + jh + 74);

  ctx.fillStyle = hex2rgba(STONE, 0.8);
  ctx.font = '15px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('50ml Cream', cx, jy + jh + 100);

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
