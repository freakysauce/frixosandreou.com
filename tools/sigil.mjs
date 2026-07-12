// Golden-ram sigil generator, round 2.
// Horn = tapered ribbon along a golden (log) spiral: r = rRoot * e^(-B*theta),
// B = ln(phi)/(pi/2). Parametrized by root angle + sweep so silhouette is
// controllable; width is capped vs local radius to prevent self-intersection.
import { writeFileSync } from 'node:fs';

const PHI = (1 + Math.sqrt(5)) / 2;
const B = Math.log(PHI) / (Math.PI / 2);
const D2R = Math.PI / 180;

function horn({ cx, cy, rRoot, startAngle, sweepTurns, wRoot, wTip = 1.5,
                taperPow = 2.0, widthCap = 0.52, steps = 110, mirror = false, mx = 256 }) {
  const sweep = sweepTurns * 2 * Math.PI;
  const outer = [], inner = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const th = sweep * t;
    const r = rRoot * Math.exp(-B * th);
    const a = startAngle * D2R + th;            // SVG y-down: + = visually clockwise
    let w = wRoot + (wTip - wRoot) * Math.pow(t, taperPow);
    w = Math.min(w, widthCap * r);
    let x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    const nx = Math.cos(a), ny = Math.sin(a);
    let xo = x + nx * w, yo = y + ny * w, xi = x - nx * w, yi = y - ny * w;
    if (mirror) { xo = 2 * mx - xo; xi = 2 * mx - xi; }
    outer.push([xo, yo]); inner.push([xi, yi]);
  }
  const pts = outer.concat(inner.reverse());
  return 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
}

function facePath(f) {
  if (!f) return '';
  if (f.kind === 'diamond') {
    const { cx = 256, top, w, bot } = f;
    const midY = (top + bot) / 2;
    return `M${cx} ${top}L${cx + w / 2} ${midY}L${cx} ${bot}L${cx - w / 2} ${midY}Z`;
  }
  const { cx = 256, browY, browW, cheekY, cheekW, muzzleY, muzzleW } = f;
  const p = [[cx - browW / 2, browY], [cx + browW / 2, browY], [cx + cheekW / 2, cheekY],
             [cx + muzzleW / 2, muzzleY], [cx - muzzleW / 2, muzzleY], [cx - cheekW / 2, cheekY]];
  return 'M' + p.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
}

export function sigilPaths(v) {
  return { R: horn({ ...v.horn }), L: horn({ ...v.horn, mirror: true }), F: facePath(v.face) };
}

const variants = [
  { name: 'v7 classic', horn: { cx: 330, cy: 255, rRoot: 135, startAngle: -100, sweepTurns: 1.15, wRoot: 34 },
    face: { browY: 152, browW: 58, cheekY: 290, cheekW: 48, muzzleY: 412, muzzleW: 26 } },
  { name: 'v8 big-coil', horn: { cx: 336, cy: 240, rRoot: 148, startAngle: -105, sweepTurns: 1.3, wRoot: 38 },
    face: { browY: 148, browW: 54, cheekY: 300, cheekW: 46, muzzleY: 420, muzzleW: 24 } },
  { name: 'v9 hornsonly', horn: { cx: 330, cy: 262, rRoot: 150, startAngle: -98, sweepTurns: 1.2, wRoot: 40 }, face: null },
  { name: 'v10 diamond', horn: { cx: 332, cy: 250, rRoot: 142, startAngle: -100, sweepTurns: 1.2, wRoot: 36 },
    face: { kind: 'diamond', top: 205, w: 58, bot: 400 } },
  { name: 'v11 meet-crown', horn: { cx: 318, cy: 255, rRoot: 128, startAngle: -115, sweepTurns: 1.12, wRoot: 34 },
    face: { browY: 168, browW: 44, cheekY: 300, cheekW: 40, muzzleY: 415, muzzleW: 22 } },
  { name: 'v12 low-wide', horn: { cx: 344, cy: 268, rRoot: 138, startAngle: -95, sweepTurns: 1.05, wRoot: 40 },
    face: { browY: 160, browW: 60, cheekY: 296, cheekW: 50, muzzleY: 410, muzzleW: 28 } },
  { name: 'v13 sweep0.9', horn: { cx: 330, cy: 250, rRoot: 132, startAngle: -100, sweepTurns: 0.92, wRoot: 36 },
    face: { browY: 156, browW: 56, cheekY: 292, cheekW: 46, muzzleY: 410, muzzleW: 26 } },
  { name: 'v14 taper1.4', horn: { cx: 332, cy: 252, rRoot: 140, startAngle: -102, sweepTurns: 1.18, wRoot: 34, taperPow: 1.4 },
    face: { browY: 154, browW: 56, cheekY: 292, cheekW: 46, muzzleY: 412, muzzleW: 26 } },
  { name: 'v15 fat-cap.6', horn: { cx: 332, cy: 252, rRoot: 140, startAngle: -102, sweepTurns: 1.18, wRoot: 42, widthCap: 0.6 },
    face: { browY: 154, browW: 54, cheekY: 292, cheekW: 44, muzzleY: 412, muzzleW: 24 } },
];

let cells = '';
for (const v of variants) {
  const { R, L, F } = sigilPaths(v);
  const svg = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="${R}" fill="#D4A843"/><path d="${L}" fill="#D4A843"/>${F ? `<path d="${F}" fill="#D4A843"/>` : ''}</svg>`;
  cells += `<div class="cell"><div class="big">${svg(190)}</div>
    <div class="small">${svg(48)}${svg(32)}${svg(16)}</div><p>${v.name}</p></div>`;
}
const html = `<!doctype html><meta charset="utf-8"><style>
body{background:#101318;color:#889;font:12px monospace;margin:0;padding:16px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.cell{background:#181d24;padding:10px;text-align:center;border-radius:6px}
.small{display:flex;gap:10px;justify-content:center;align-items:center;margin-top:6px;background:#0b0e12;padding:5px;border-radius:4px}
p{margin:5px 0 0}</style><div class="grid">${cells}</div>`;
writeFileSync('tools/sigil-grid.html', html);
console.log('ok');
