// WholesaleUSPeptides — Master Asset Library
// Produces 4 master product container renders (no product name, no logo mark).
// Canvas: 1000x1000 PNG · white seamless background · Navy #05111F · Gold #C9A84C
// Product container occupies ~85% of canvas height.

const { createCanvas } = require('canvas');
const fs   = require('fs');
const path = require('path');

const NAVY  = '#05111F';
const GOLD  = '#C9A84C';
const OUT_DIR = '/home/user/wholesaleuspeptides/public/images/master';
const W = 1000, H = 1000;

function hex2rgba(hex, a = 1) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function seamlessBackground(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(0.7, '#FFFFFF');
  g.addColorStop(1, '#F4F5F7');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function groundShadow(ctx, cx, y, rw, alpha = 0.20) {
  const g = ctx.createRadialGradient(cx, y, 0, cx, y, rw);
  g.addColorStop(0, hex2rgba('#05111F', alpha));
  g.addColorStop(1, hex2rgba('#05111F', 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, y, rw, rw * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Horizontal cylinder shading — light/dark/light bands that read as rounded glass/plastic.
function cylinderGradient(ctx, x, w, tints) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  tints.forEach(([stop, color]) => g.addColorStop(stop, color));
  return g;
}

function glossHighlight(ctx, x, y, w, h, r) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0,    'rgba(255,255,255,0)');
  g.addColorStop(0.12, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.08)');
  g.addColorStop(0.85, 'rgba(255,255,255,0)');
  g.addColorStop(0.93, 'rgba(255,255,255,0.30)');
  g.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function brandMark(ctx, cx, y) {
  ctx.fillStyle = hex2rgba(GOLD, 0.55);
  ctx.font = '600 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WholesaleUSPeptides.com', cx, y);
}

function saveCanvas(canvas, filename) {
  const buf = canvas.toBuffer('image/png');
  const fp  = path.join(OUT_DIR, filename);
  fs.writeFileSync(fp, buf);
  console.log('  ✓', filename);
}

// ── 1. INJECTABLE VIAL ────────────────────────────────────────────────────────
function generateMasterVial() {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  seamlessBackground(ctx);

  const cx = W / 2;
  const vw = 300, vh = 850, vr = 16;
  const vx = cx - vw / 2, vy = 70;
  const bodyTop = vy + 150;

  groundShadow(ctx, cx, vy + vh + 18, 190, 0.20);

  // Glass body — cylindrical shading
  ctx.save();
  ctx.shadowColor = 'rgba(5,17,31,0.18)';
  ctx.shadowBlur  = 50;
  ctx.shadowOffsetY = 22;
  ctx.fillStyle = cylinderGradient(ctx, vx, vw, [
    [0,    '#C7CDD4'],
    [0.10, '#E9EDF1'],
    [0.30, '#F7F9FA'],
    [0.55, '#DDE2E7'],
    [0.80, '#F2F4F6'],
    [1,    '#B9C0C8'],
  ]);
  ctx.beginPath(); ctx.roundRect(vx, bodyTop, vw, vy + vh - bodyTop, [0,0,vr,vr]); ctx.fill();
  ctx.restore();

  // Glass body fill liquid tint band (subtle, suggests sterile solution)
  ctx.fillStyle = 'rgba(180,200,210,0.18)';
  ctx.fillRect(vx + 14, bodyTop + 40, vw - 28, vy + vh - bodyTop - 70);

  // Aluminum crimp neck
  ctx.fillStyle = cylinderGradient(ctx, vx + 30, vw - 60, [
    [0, '#9AA1A8'], [0.15, '#E3E6E9'], [0.5, '#F4F5F6'], [0.85, '#D7DADD'], [1, '#92989F'],
  ]);
  ctx.beginPath(); ctx.roundRect(vx + 30, vy + 110, vw - 60, 50, [6,6,0,0]); ctx.fill();

  // Navy flip-off cap
  ctx.save();
  ctx.shadowColor = 'rgba(5,17,31,0.22)';
  ctx.shadowBlur  = 26;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = cylinderGradient(ctx, vx + 6, vw - 12, [
    [0, '#02080F'], [0.18, '#13283D'], [0.45, NAVY], [0.7, '#0E2436'], [1, '#020608'],
  ]);
  ctx.beginPath(); ctx.roundRect(vx + 6, vy, vw - 12, 122, [vr, vr, 10, 10]); ctx.fill();
  ctx.restore();

  // Gold crimp ring
  ctx.fillStyle = GOLD;
  ctx.fillRect(vx + 6, vy + 108, vw - 12, 9);

  // Cap dome highlight
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.beginPath(); ctx.ellipse(cx, vy + 16, vw / 2 - 24, 14, 0, 0, Math.PI * 2); ctx.fill();

  // Rubber stopper sliver under cap
  ctx.fillStyle = '#3A3F45';
  ctx.fillRect(vx + 30, vy + 132, vw - 60, 18);

  // Gloss / glass reflections down the body
  glossHighlight(ctx, vx, bodyTop, vw, vy + vh - bodyTop, [0,0,vr,vr]);

  brandMark(ctx, cx, vy + vh + 64);

  saveCanvas(canvas, 'master-vial.png');
}

// ── 2. CAPSULE BOTTLE ─────────────────────────────────────────────────────────
function generateMasterCapsule() {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  seamlessBackground(ctx);

  const cx = W / 2;
  const bw = 400, bh = 850, br = 46;
  const bx = cx - bw / 2, by = 70;
  const bodyTop = by + 150;

  groundShadow(ctx, cx, by + bh + 16, 240, 0.20);

  // HDPE bottle body — frosted plastic cylindrical shading
  ctx.save();
  ctx.shadowColor = 'rgba(5,17,31,0.18)';
  ctx.shadowBlur  = 55;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = cylinderGradient(ctx, bx, bw, [
    [0,    '#CDD2D8'],
    [0.12, '#EFF2F4'],
    [0.32, '#FBFCFD'],
    [0.55, '#E1E5E9'],
    [0.78, '#F6F8F9'],
    [1,    '#C2C8CE'],
  ]);
  ctx.beginPath(); ctx.roundRect(bx, bodyTop, bw, by + bh - bodyTop, [14,14,br,br]); ctx.fill();
  ctx.restore();

  // Navy screw cap
  ctx.save();
  ctx.shadowColor = 'rgba(5,17,31,0.22)';
  ctx.shadowBlur  = 28;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = cylinderGradient(ctx, bx + 8, bw - 16, [
    [0, '#02080F'], [0.18, '#13283D'], [0.45, NAVY], [0.7, '#0E2436'], [1, '#020608'],
  ]);
  ctx.beginPath(); ctx.roundRect(bx + 8, by, bw - 16, 165, [br, br, 14, 14]); ctx.fill();
  ctx.restore();

  // Cap ribbing (grip texture)
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    const x = bx + 30 + i * ((bw - 60) / 13);
    ctx.beginPath(); ctx.moveTo(x, by + 20); ctx.lineTo(x, by + 140); ctx.stroke();
  }

  // Gold trim ring
  ctx.fillStyle = GOLD;
  ctx.fillRect(bx + 8, by + 148, bw - 16, 11);

  // Empty white label panel (no text)
  const lx = bx + 26, ly = bodyTop + 60, lw = bw - 52, lh = 420;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.roundRect(lx, ly, lw, lh, 10); ctx.fill();
  ctx.strokeStyle = hex2rgba(GOLD, 0.35);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(lx + 10, ly + 10, lw - 20, lh - 20, 6); ctx.stroke();

  // Gloss / plastic reflections
  glossHighlight(ctx, bx, bodyTop, bw, by + bh - bodyTop, [14,14,br,br]);

  brandMark(ctx, cx, by + bh + 64);

  saveCanvas(canvas, 'master-capsule.png');
}

// ── 3. NASAL SPRAY BOTTLE ─────────────────────────────────────────────────────
function generateMasterSpray() {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  seamlessBackground(ctx);

  const cx = W / 2;
  const bw = 260, bh = 850;
  const bx = cx - bw / 2, by = 70;
  const bodyTop = by + 260;

  groundShadow(ctx, cx, by + bh + 14, 170, 0.20);

  // Glass reservoir
  ctx.save();
  ctx.shadowColor = 'rgba(5,17,31,0.16)';
  ctx.shadowBlur  = 48;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = cylinderGradient(ctx, bx, bw, [
    [0,    '#C9CFD5'],
    [0.12, '#EAEEF1'],
    [0.32, '#F8FAFA'],
    [0.55, '#DEE3E7'],
    [0.78, '#F4F6F7'],
    [1,    '#BCC3C9'],
  ]);
  ctx.beginPath(); ctx.roundRect(bx, bodyTop, bw, by + bh - bodyTop, [10,10,38,38]); ctx.fill();
  ctx.restore();

  // Neck (clear plastic collar)
  ctx.fillStyle = cylinderGradient(ctx, cx - 50, 100, [
    [0,'#B9C0C7'],[0.3,'#E9EDEF'],[0.6,'#F6F8F8'],[1,'#AEB5BB'],
  ]);
  ctx.beginPath(); ctx.roundRect(cx - 50, by + 150, 100, 130, [8,8,4,4]); ctx.fill();

  // Navy pump actuator
  ctx.save();
  ctx.shadowColor = 'rgba(5,17,31,0.20)';
  ctx.shadowBlur  = 22;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = cylinderGradient(ctx, cx - 84, 168, [
    [0, '#02080F'], [0.2, '#13283D'], [0.5, NAVY], [0.78, '#0E2436'], [1, '#020608'],
  ]);
  ctx.beginPath(); ctx.roundRect(cx - 84, by + 70, 168, 88, [26,26,14,14]); ctx.fill();
  ctx.restore();

  // Nozzle
  ctx.fillStyle = NAVY;
  ctx.beginPath(); ctx.roundRect(cx + 38, by + 86, 86, 38, [18,18,18,18]); ctx.fill();

  // Gold separator ring
  ctx.fillStyle = GOLD;
  ctx.fillRect(bx, bodyTop - 8, bw, 10);

  // Gloss / reflections
  glossHighlight(ctx, bx, bodyTop, bw, by + bh - bodyTop, [10,10,38,38]);

  brandMark(ctx, cx, by + bh + 60);

  saveCanvas(canvas, 'master-spray.png');
}

// ── 4. CREAM JAR ──────────────────────────────────────────────────────────────
function generateMasterCream() {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  seamlessBackground(ctx);

  const cx = W / 2;
  const jw = 700, jh = 620;
  const jy = 230;
  const jx = cx - jw / 2;
  const lidH = 220;

  groundShadow(ctx, cx, jy + jh + 16, 290, 0.22);

  // Jar body — frosted glass cylindrical shading
  ctx.save();
  ctx.shadowColor = 'rgba(5,17,31,0.18)';
  ctx.shadowBlur  = 60;
  ctx.shadowOffsetY = 28;
  ctx.fillStyle = cylinderGradient(ctx, jx, jw, [
    [0,    '#CCD2D8'],
    [0.10, '#EDF0F3'],
    [0.30, '#FAFBFC'],
    [0.55, '#E0E4E8'],
    [0.80, '#F5F7F8'],
    [1,    '#C1C7CD'],
  ]);
  ctx.beginPath(); ctx.roundRect(jx, jy, jw, jh, [16,16,48,48]); ctx.fill();
  ctx.restore();

  // Navy lid
  ctx.save();
  ctx.shadowColor = 'rgba(5,17,31,0.22)';
  ctx.shadowBlur  = 30;
  ctx.shadowOffsetY = -10;
  ctx.fillStyle = cylinderGradient(ctx, jx - 18, jw + 36, [
    [0, '#02080F'], [0.16, '#13283D'], [0.45, NAVY], [0.72, '#0E2436'], [1, '#020608'],
  ]);
  ctx.beginPath(); ctx.roundRect(jx - 18, jy - lidH, jw + 36, lidH + 30, [44, 44, 14, 14]); ctx.fill();
  ctx.restore();

  // Gold lid ring
  ctx.fillStyle = GOLD;
  ctx.fillRect(jx - 18, jy + 4, jw + 36, 12);

  // Lid dome highlight
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.ellipse(cx, jy - lidH + 30, jw / 2 - 60, 18, 0, 0, Math.PI * 2); ctx.fill();

  // Empty label panel on jar body
  const lx = jx + 60, ly = jy + 70, lw = jw - 120, lh = 420;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.roundRect(lx, ly, lw, lh, 12); ctx.fill();
  ctx.strokeStyle = hex2rgba(GOLD, 0.35);
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.roundRect(lx + 12, ly + 12, lw - 24, lh - 24, 8); ctx.stroke();

  // Gloss / glass reflections on jar body
  glossHighlight(ctx, jx, jy, jw, jh, [16,16,48,48]);

  brandMark(ctx, cx, jy + jh + 64);

  saveCanvas(canvas, 'master-cream.png');
}

console.log('\n── Master Asset Library ──');
generateMasterVial();
generateMasterCapsule();
generateMasterSpray();
generateMasterCream();
console.log('\n✓ 4 master product containers generated.\n');
