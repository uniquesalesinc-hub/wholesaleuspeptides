// WholesaleUSPeptides — Product Image Generator
// Produces individual 1000x1000 PNG files per SKU
// Brand: Navy #05111F · Gold #C9A84C · White #FFFFFF
// All images: transparent background, soft lab shadows, premium clinical aesthetic

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
  const bw = 280, bh = 32, bx = (W - bw) / 2, by = 36;
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 5); ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('RESEARCH USE ONLY', W / 2, by + 21);
}

function brandLine(ctx, y) {
  ctx.fillStyle = hex2rgba(GOLD, 0.35);
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WHOLESALEUSPEPTIDES.COM', W / 2, y);
}

function logoZone(ctx, cx, cy) {
  // Hexagon outline
  const hr = 52;
  ctx.strokeStyle = hex2rgba(GOLD, 0.28);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = cx + hr * Math.cos(a), py = cy + hr * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.stroke();

  ctx.fillStyle = hex2rgba(GOLD, 0.50);
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('YOUR',      cx, cy - 14);
  ctx.fillText('LOGO',      cx, cy - 1);
  ctx.fillText('HERE',      cx, cy + 13);
}

function productLabel(ctx, name, cx, labelBottom) {
  ctx.fillStyle = hex2rgba(NAVY, 0.92);
  ctx.font = 'bold 17px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase(), cx, labelBottom - 10);
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
function generateBottle(name, filename) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  // Transparent base
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 10;
  const vw = 160, vh = 340, vr = 18;
  const vx = cx - vw / 2, vy = cy - vh / 2;

  // Drop shadow
  ctx.shadowColor = 'rgba(5,17,31,0.22)';
  ctx.shadowBlur  = 60;
  ctx.shadowOffsetY = 24;

  // Body — frosted white glass
  ctx.fillStyle = '#EEF1F5';
  ctx.beginPath(); ctx.roundRect(vx, vy + 38, vw, vh - 38, [0, 0, vr, vr]); ctx.fill();
  noShadow(ctx);

  // Cap — navy
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(vx + 10, vy, vw - 20, 48, [vr, vr, 6, 6]); ctx.fill();

  // Gold ring under cap
  ctx.fillStyle = GOLD;
  ctx.fillRect(vx + 10, vy + 42, vw - 20, 4);

  // Label background
  const lx = vx + 10, ly = vy + 72, lw = vw - 20, lh = 188;
  ctx.fillStyle = WHITE;
  ctx.fillRect(lx, ly, lw, lh);

  // Label top navy band
  ctx.fillStyle = NAVY;
  ctx.fillRect(lx, ly, lw, 22);
  brandLine(ctx, ly + 15);

  // Logo zone center of label
  logoZone(ctx, cx, ly + lh / 2 - 10);

  // Gold bottom rule
  ctx.fillStyle = GOLD;
  ctx.fillRect(lx, ly + lh - 5, lw, 5);

  // Glass sheen
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.beginPath(); ctx.roundRect(vx + 8, vy + 38, 20, vh - 50, [6,6,6,6]); ctx.fill();

  // Product name below bottle
  ruoBadge(ctx);
  productLabel(ctx, name, cx, vy + vh + 52);

  saveCanvas(canvas, 'bottles', filename);
}

// ── CAPSULE ───────────────────────────────────────────────────────────────────
function generateCapsule(name, filename) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 5;
  const bw = 170, bh = 300, br = 24;
  const bx = cx - bw / 2, by = cy - bh / 2;

  ctx.shadowColor = 'rgba(5,17,31,0.20)';
  ctx.shadowBlur  = 55;
  ctx.shadowOffsetY = 22;

  // Body
  ctx.fillStyle = '#F0F3F7';
  ctx.beginPath(); ctx.roundRect(bx, by + 44, bw, bh - 44, [6,6,br,br]); ctx.fill();
  noShadow(ctx);

  // Cap
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(bx + 4, by, bw - 8, 56, [br,br,8,8]); ctx.fill();

  // Gold ring
  ctx.fillStyle = GOLD;
  ctx.fillRect(bx + 4, by + 50, bw - 8, 5);

  // Brand text on cap
  brandLine(ctx, by + 34);

  // Label
  const lx = bx + 8, ly = by + 74, lw = bw - 16, lh = 148;
  ctx.fillStyle = WHITE;
  ctx.fillRect(lx, ly, lw, lh);
  ctx.fillStyle = NAVY;
  ctx.fillRect(lx, ly, lw, 18);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 6px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WHOLESALEUSPEPTIDES', cx, ly + 13);

  logoZone(ctx, cx, ly + lh / 2 + 2);

  ctx.fillStyle = GOLD;
  ctx.fillRect(lx, ly + lh - 4, lw, 4);

  // Count tag
  ctx.fillStyle = hex2rgba(NAVY, 0.08);
  ctx.beginPath(); ctx.roundRect(cx - 38, by + bh + 8, 76, 22, 4); ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 9px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('60 CAPSULES', cx, by + bh + 23);

  ruoBadge(ctx);
  productLabel(ctx, name, cx, by + bh + 58);

  saveCanvas(canvas, 'capsules', filename);
}

// ── SPRAY ─────────────────────────────────────────────────────────────────────
function generateSpray(name, filename) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 15;
  const bw = 100, bh = 320;
  const bx = cx - bw / 2, by = cy - bh / 2;

  ctx.shadowColor = 'rgba(5,17,31,0.18)';
  ctx.shadowBlur  = 50;
  ctx.shadowOffsetY = 20;

  // Body
  ctx.fillStyle = '#E8EDF2';
  ctx.beginPath(); ctx.roundRect(bx, by + 90, bw, bh - 90, [4,4,14,14]); ctx.fill();
  noShadow(ctx);

  // Neck
  ctx.fillStyle = '#D4D9DF';
  ctx.beginPath(); ctx.roundRect(cx - 20, by + 50, 40, 50, [4,4,2,2]); ctx.fill();

  // Pump head
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(cx - 32, by + 28, 64, 32, [10,10,6,6]); ctx.fill();

  // Nozzle
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(cx + 16, by + 32, 32, 14, [7,7,7,7]); ctx.fill();

  // Gold separator
  ctx.fillStyle = GOLD;
  ctx.fillRect(bx, by + 96, bw, 4);

  // Label
  const lx = bx + 4, ly = by + 108, lw = bw - 8, lh = 130;
  ctx.fillStyle = WHITE;
  ctx.fillRect(lx, ly, lw, lh);
  ctx.fillStyle = NAVY;
  ctx.fillRect(lx, ly, lw, 17);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 5px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WUSPEPTIDES', cx, ly + 12);

  // Smaller hex zone for narrower bottle
  const hr = 28;
  ctx.strokeStyle = hex2rgba(GOLD, 0.28);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    ctx.lineTo(cx + hr * Math.cos(a), ly + lh/2 + hr * Math.sin(a));
  }
  ctx.closePath(); ctx.stroke();

  ctx.fillStyle = hex2rgba(GOLD, 0.50);
  ctx.font = 'bold 6px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('YOUR',  cx, ly + lh/2 - 8);
  ctx.fillText('LOGO',  cx, ly + lh/2 + 2);
  ctx.fillText('HERE',  cx, ly + lh/2 + 12);

  ctx.fillStyle = GOLD;
  ctx.fillRect(lx, ly + lh - 4, lw, 4);

  // Volume tag
  ctx.fillStyle = hex2rgba(NAVY, 0.07);
  ctx.beginPath(); ctx.roundRect(cx - 24, by + bh + 6, 48, 18, 3); ctx.fill();
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('30 ml', cx, by + bh + 19);

  ruoBadge(ctx);
  productLabel(ctx, name, cx, by + bh + 52);

  saveCanvas(canvas, 'sprays', filename);
}

// ── CREAM ─────────────────────────────────────────────────────────────────────
function generateCream(name, filename) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H / 2 + 20;
  const jw = 220, jh = 105, jr = 18;
  const jx = cx - jw / 2, jy = cy - jh / 2;

  ctx.shadowColor = 'rgba(5,17,31,0.18)';
  ctx.shadowBlur  = 55;
  ctx.shadowOffsetY = 28;

  // Body
  ctx.fillStyle = '#EDF0F4';
  ctx.beginPath(); ctx.roundRect(jx, jy + 14, jw, jh, [4,4,jr,jr]); ctx.fill();
  noShadow(ctx);

  // Lid
  ctx.shadowColor = 'rgba(5,17,31,0.14)';
  ctx.shadowBlur  = 14;
  ctx.shadowOffsetY = -4;
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(jx - 6, jy - 24, jw + 12, 44, [jr,jr,4,4]); ctx.fill();
  noShadow(ctx);

  // Gold lid ring
  ctx.fillStyle = GOLD;
  ctx.fillRect(jx - 6, jy + 14, jw + 12, 4);

  // Lid text
  ctx.fillStyle = hex2rgba(GOLD, 0.7);
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WHOLESALEUSPEPTIDES.COM', cx, jy - 3);

  // Label on jar body
  const lx = jx + 10, ly = jy + 24, lw = jw - 20, lh = 76;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillRect(lx, ly, lw, lh);

  ctx.strokeStyle = hex2rgba(GOLD, 0.25);
  ctx.lineWidth = 0.8;
  ctx.strokeRect(lx + 4, ly + 4, lw - 8, lh - 8);

  ctx.fillStyle = hex2rgba(GOLD, 0.50);
  ctx.font = 'bold 9px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('YOUR LOGO HERE', cx, ly + lh / 2 + 4);

  ruoBadge(ctx);
  productLabel(ctx, name, cx, jy + jh + 66);

  ctx.fillStyle = hex2rgba(STONE, 0.7);
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('50ml Cream', cx, jy + jh + 83);

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
