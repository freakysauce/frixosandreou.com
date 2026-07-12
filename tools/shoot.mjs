// Full-page screenshot via Chrome DevTools Protocol (no puppeteer needed).
// Usage: node tools/shoot.mjs <url> <out.png> <width> <height> [fullpage]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [url, out, w, h, full] = process.argv.slice(2);
const W = parseInt(w || '1440'), Hh = parseInt(h || '900');
const PORT = 9222 + Math.floor(Math.random() * 500);

const chrome = spawn('google-chrome', [
  '--headless=new', '--disable-gpu', '--use-gl=angle', '--enable-unsafe-swiftshader',
  `--remote-debugging-port=${PORT}`, '--no-first-run', `--window-size=${W},${Hh}`,
  `--user-data-dir=/tmp/shoot-profile-${PORT}`,
  '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const tabs = await res.json();
      const page = tabs.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) { /* retry */ }
    await sleep(250);
  }
  throw new Error('chrome did not expose CDP');
}

let idc = 0; const pending = new Map();
function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => resolve(ws);
    ws.onerror = reject;
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    };
  });
}
function send(ws, method, params = {}) {
  const id = ++idc;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise(r => pending.set(id, r));
}

try {
  const ws = await connect(await getWsUrl());
  await send(ws, 'Page.enable');
  await send(ws, 'Emulation.setDeviceMetricsOverride',
    { width: W, height: Hh, deviceScaleFactor: 1, mobile: W < 600 });
  await send(ws, 'Page.navigate', { url });
  await sleep(parseInt(process.env.SHOOT_WAIT || '5200')); // settle time, override via SHOOT_WAIT
  let clip;
  if (full) {
    const { result } = await send(ws, 'Page.getLayoutMetrics');
    const cs = result.cssContentSize || result.contentSize;
    clip = { x: 0, y: 0, width: W, height: Math.min(cs.height, 16000), scale: 1 };
  }
  const shot = await send(ws, 'Page.captureScreenshot',
    { format: 'png', captureBeyondViewport: !!full, ...(clip ? { clip } : {}) });
  writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('wrote', out, full ? `(full ${clip.height}px)` : `(${W}x${Hh})`);
} finally {
  chrome.kill();
}
