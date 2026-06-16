// WholesaleUSPeptides — Product Image Generator v2
// Produces 1000×1000 PNG files per SKU
// Brand: Navy #05111F · Gold #C9A84C · White #FFFFFF
// Labels show WUS shield mark — NO "YOUR LOGO HERE" on catalog images

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

// ── WholesaleUSPeptides shield mark ──────────────────────────────────────────
function wusShield(ctx, cx, cy) {
  const sw = 58, sh = 64;
  const sx = cx - sw / 2, sy = cy - sh / 2;

  // Shield body (rect top, pointed bottom via quadratic)
  ctx.beginPath();
  ctx.moveTo(sx + 8, sy);
  ctx.lineTo(sx + sw - 8, sy);
  ctx.arcTo(sx + sw, sy, sx + sw, sy + 8, 8);
  ctx.lineTo(sx + sw, sy + sh * 0.62);
  ctx.quadraticCurveTo(cx, sy + sh + 4, sx, sy + sh * 0.62);
  ctx.lineTo(sx, sy + 8);
  ctx.arcTo(sx, sy, sx + 8, sy, 8);
  ctx.closePath();
  ctx.fillStyle = NAVY;
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner gold border (inset)
  const ins = 5;
  ctx.beginPath();
  ctx.moveTo(sx + ins + 4, sy + ins);
  ctx.lineTo(sx + sw - ins - 4, sy + ins);
  ctx.lineTo(sx + sw - ins - 4, sy + sh * 0.58);
  ctx.quadraticCurveTo(cx, sy + sh - ins + 3, sx + ins + 4, sy + sh * 0.58);
  ctx.closePath();
  ctx.strokeStyle = hex2rgba(GOLD, 0.30);
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // "W" monogram — top of shield
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('W', cx, cy - 4);

  // Thin gold divider
  ctx.fillStyle = hex2rgba(GOLD, 0.50);
  ctx.fillRect(cx - 18, cy + 3, 36, 1);

  // "PEPTIDES" below divider
  ctx.fillStyle = hex2rgba(GOLD, 0.75);
  ctx.font = 'bold 7px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PEPTIDES', cx, cy + 16);
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

function compoundNameOnLabel(ctx, name, cx, y, maxWidth) {
  const uname = name.toUpperCase();
  // Scale font to fit within label width
  const fontSize = uname.length > 16 ? 7 : uname.length > 12 ? 8 : uname.length > 8 ? 9 : 10;
  ctx.fillStyle = hex2rgba(NAVY, 0.65);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(uname, cx, y);
}

function productLabel(ctx, name, cx, y) {
  ctx.fillStyle = hex2rgba(NAVY, 0.90);
  ctx.font = 'bold 17px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase(), cx, y);
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
function generateBottle(name, filename, subtitle) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
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

  // WUS shield — upper center of label
  wusShield(ctx, cx, ly + 72);

  // Compound name on label — below shield
  compoundNameOnLabel(ctx, name, cx, ly + 130, lw - 8);

  // Gold bottom rule
  ctx.fillStyle = GOLD;
  ctx.fillRect(lx, ly + lh - 5, lw, 5);

  // Glass sheen
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.beginPath(); ctx.roundRect(vx + 8, vy + 38, 20, vh - 50, [6,6,6,6]); ctx.fill();

  ruoBadge(ctx);
  productLabel(ctx, name, cx, vy + vh + 52);

  if (subtitle) {
    ctx.fillStyle = hex2rgba(NAVY, 0.55);
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(subtitle, cx, vy + vh + 70);
  }

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

  // WUS shield — scaled for narrower capsule label
  wusShield(ctx, cx, ly + 70);

  // Compound name below shield
  compoundNameOnLabel(ctx, name, cx, ly + 118, lw - 8);

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

  // Smaller WUS shield for narrower spray bottle
  const ssw = 34, ssh = 38;
  const ssx = cx - ssw/2, ssy = ly + 28;
  ctx.beginPath();
  ctx.moveTo(ssx + 4, ssy);
  ctx.lineTo(ssx + ssw - 4, ssy);
  ctx.arcTo(ssx + ssw, ssy, ssx + ssw, ssy + 4, 4);
  ctx.lineTo(ssx + ssw, ssy + ssh * 0.62);
  ctx.quadraticCurveTo(cx, ssy + ssh + 2, ssx, ssy + ssh * 0.62);
  ctx.lineTo(ssx, ssy + 4);
  ctx.arcTo(ssx, ssy, ssx + 4, ssy, 4);
  ctx.closePath();
  ctx.fillStyle = NAVY;
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = GOLD;
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('W', cx, ssy + ssh * 0.40);

  ctx.fillStyle = hex2rgba(GOLD, 0.50);
  ctx.fillRect(cx - 9, ssy + ssh * 0.52, 18, 1);

  ctx.fillStyle = hex2rgba(GOLD, 0.7);
  ctx.font = 'bold 4px Arial';
  ctx.fillText('PEP', cx, ssy + ssh * 0.76);

  // Compound name below shield (small, spray label is narrow)
  const nameLen = name.length;
  const nfs = nameLen > 8 ? 5 : 6;
  ctx.fillStyle = hex2rgba(NAVY, 0.65);
  ctx.font = `bold ${nfs}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase(), cx, ly + 88);

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

  // WUS brand on cream jar label (compact)
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('W', cx, ly + lh / 2 - 4);

  ctx.fillStyle = hex2rgba(GOLD, 0.6);
  ctx.fillRect(cx - 20, ly + lh / 2 + 1, 40, 1);

  ctx.fillStyle = hex2rgba(NAVY, 0.60);
  ctx.font = 'bold 7px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase(), cx, ly + lh / 2 + 14);

  ruoBadge(ctx);
  productLabel(ctx, name, cx, jy + jh + 66);

  ctx.fillStyle = hex2rgba(STONE, 0.7);
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('50ml Cream', cx, jy + jh + 83);

  saveCanvas(canvas, 'creams', filename);
}

// ── PRODUCT LISTS ─────────────────────────────────────────────────────────────
const BOTTLES = [
  // name,              subtitle (optional)
  ['5-Amino-1MQ',       null],
  ['AOD-9604',          null],
  ['Tesamorelin',       null],
  ['CJC-1295 No DAC',   null],
  ['CJC-1295 DAC',      null],
  ['Ipamorelin',        null],
  ['Sermorelin',        null],
  ['MOTS-C',            null],
  ['BPC-157',           null],
  ['TB-500',            null],
  ['KPV',               null],
  ['GHK-Cu',            null],
  ['Dihexa',            null],
  ['Semax',             null],
  ['Selank',            null],
  ['Epitalon',          null],
  ['PT-141',            null],
  ['Melanotan II',      null],
  ['IGF-1 LR3',         null],
  ['PEG-MGF',           null],
  ['NAD+',              null],
  ['SS-31',             null],
  ['MT-2',              null],
  ['GHRP-6',            null],
  ['GHRP-2',            null],
  ['Cagrilintide',      null],
  ['Hexarelin',         null],
  ['Thymosin Alpha-1',  null],
  ['Thymosin Beta-4',   null],
  ['LL-37',             null],
  ['Acetic Acid',       null],
  ['Bacteriostatic Water', null],
  ['Benzyl Alcohol',    null],
  ['PCSK9',             null],
  ['MK-677',            null],
  ['SR-9009',           null],
  ['YK-11',             null],
  // GLP — abbreviated names with dose ranges
  ['S',                 '5mg – 20mg'],
  ['T',                 '10mg – 40mg'],
  ['R',                 '10mg – 30mg'],
];

const CAPSULES = [
  '5-Amino-1MQ','BPC-157','Dihexa','GHK-Cu','Epitalon',
  'Selank','Semax','KPV','NAD+','TB-500',
];
const SPRAYS = ['BPC-157','Dihexa','MT-2','NAD+','PT-141','GHK-Cu','TB-500'];
const CREAMS = ['Repair','Smooth','Tan','Revive','Restore'];

console.log('\n── Bottles (' + BOTTLES.length + ') ──');
BOTTLES.forEach(([n, sub]) => generateBottle(n, slug(n), sub));

console.log('\n── Capsules (' + CAPSULES.length + ') ──');
CAPSULES.forEach(n => generateCapsule(n, slug(n)));

console.log('\n── Sprays (' + SPRAYS.length + ') ──');
SPRAYS.forEach(n => generateSpray(n, slug(n)));

console.log('\n── Creams (' + CREAMS.length + ') ──');
CREAMS.forEach(n => generateCream(n, slug(n)));

const total = BOTTLES.length + CAPSULES.length + SPRAYS.length + CREAMS.length;
console.log(`\n✓ ${total} product images generated.\n`);
