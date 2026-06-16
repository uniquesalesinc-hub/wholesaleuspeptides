// Generate s.png, t.png, r.png for GLP products
// Matches exact style of existing WholesaleUSPeptides bottle library

const { createCanvas } = require('canvas');
const fs   = require('fs');
const path = require('path');

const NAVY  = '#05111F';
const GOLD  = '#C9A84C';
const WHITE = '#FFFFFF';
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
  ctx.fillText('YOUR', cx, cy - 14);
  ctx.fillText('LOGO', cx, cy - 1);
  ctx.fillText('HERE', cx, cy + 13);
}

function generateGLPBottle(label, doseRange, filename) {
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

  // Logo zone center of label
  logoZone(ctx, cx, ly + lh / 2 - 10);

  // Gold bottom rule
  ctx.fillStyle = GOLD;
  ctx.fillRect(lx, ly + lh - 5, lw, 5);

  // Glass sheen
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.beginPath(); ctx.roundRect(vx + 8, vy + 38, 20, vh - 50, [6,6,6,6]); ctx.fill();

  // RUO badge
  ruoBadge(ctx);

  // Product letter — large, prominent
  const labelY = vy + vh + 32;
  ctx.fillStyle = NAVY;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, labelY);

  // Dose range sub-label
  ctx.fillStyle = hex2rgba(NAVY, 0.55);
  ctx.font = '13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(doseRange, cx, labelY + 20);

  const buf = canvas.toBuffer('image/png');
  const fp  = path.join('/home/user/wholesaleuspeptides/public/images/bottles', filename + '.png');
  fs.writeFileSync(fp, buf);
  console.log('  ✓ bottles/' + filename + '.png');
}

console.log('\n── GLP Bottles ──');
generateGLPBottle('S', '5mg–20mg',   's');
generateGLPBottle('T', '10mg–40mg',  't');
generateGLPBottle('R', '10mg–30mg',  'r');
console.log('\n✓ 3 GLP images generated.\n');
