// usage: node record.js timeline.json framesDir [fromSec toSec]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [tlFile, outDir, from = 0, to = 1e9] = process.argv.slice(2);
const TL = JSON.parse(fs.readFileSync(tlFile)); const FPS = 30;
const THREE_DIR = '/tmp/claude-0/-home-user-mobilenet/16c0af79-659b-55c2-ac7b-8925e8a96a54/scratchpad/node_modules/three';
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }, args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  await ctx.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', r => r.fulfill({ path: path.join(THREE_DIR, r.request().url().split('three@0.160.0/')[1]), contentType: 'application/javascript' }));
  const p = await ctx.newPage();
  p.on('pageerror', e => console.error('PAGEERR', e));
  await p.goto('http://localhost:8765/?capture', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.addScriptTag({ path: path.join(__dirname, 'director.js') });
  const total = TL.reduce((a, s) => a + s.dur, 0); const N = Math.round(Math.min(total, +to) * FPS);
  let t0 = Date.now();
  for (let f = 0; f < N; f++) {
    const t = f / FPS; let acc = 0, seg = TL[TL.length - 1], pp = 1;
    for (const s of TL) { if (t < acc + s.dur) { seg = s; pp = (t - acc) / s.dur; break; } acc += s.dur; }
    await p.evaluate(([id, pr, sub]) => { window.__direct(id, pr, sub); window.__atlas.step(1 / 30); }, [seg.id, pp, seg.sub]);
    if (t >= +from && f % (+process.env.EVERY || 1) === 0) await p.screenshot({ path: `${outDir}/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 88 });
    if (f % 150 === 0) console.log(`frame ${f}/${N} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await b.close();
})();
