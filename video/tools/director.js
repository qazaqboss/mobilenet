// Injected into the page in ?capture mode. window.__direct(segId, p, segT) is called once per frame.
(() => {
  const A = window.__atlas;
  const $ = s => document.querySelector(s);
  const fired = new Set();
  const once = (k, fn) => { if (!fired.has(k)) { fired.add(k); fn(); } };
  const at = (seg, p, when, k, fn) => { if (p >= when) once(seg + ':' + k, fn); };
  const click = sel => { const e = $(sel); if (e) e.click(); };
  const legend = (id, n) => click(`#${id}-legend li:nth-child(${n}) button`);
  const step = (id, n) => click(`#${id}-steps > :nth-child(${n})`);
  const slider = (sel, v) => { const e = $(sel); e.value = Math.round(v); e.dispatchEvent(new Event('input')); };
  const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const mix = (a, b, x) => a + (b - a) * x;
  const seg2 = (p, a, b) => ease((p - a) / (b - a));

  // chrome for video
  const st = document.createElement('style');
  st.textContent = `nav.top,.guide,.gsub{display:none!important} html{scroll-behavior:auto!important} body{overflow-x:hidden}
    #sub{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:99;max-width:1040px;width:calc(100% - 120px);
      text-align:center;font:500 18px/1.42 "IBM Plex Sans",sans-serif;color:#eef5fb;background:rgba(5,10,17,.82);
      border:1px solid rgba(127,227,255,.22);border-radius:12px;padding:12px 20px;text-wrap:balance;transition:opacity .3s}
    #chap{position:fixed;right:28px;top:22px;z-index:99;font:500 13px/1 "IBM Plex Mono",monospace;letter-spacing:.16em;text-transform:uppercase;
      color:#7fe3ff;background:rgba(5,10,17,.8);border:1px solid rgba(127,227,255,.25);border-radius:8px;padding:9px 12px}
    .zoomable{transition:none!important;will-change:transform}`;
  document.head.appendChild(st);
  const sub = document.createElement('div'); sub.id = 'sub'; document.body.appendChild(sub);
  const chap = document.createElement('div'); chap.id = 'chap'; document.body.appendChild(chap);

  // smoothed state
  const cur = { scroll: 0, cams: {}, zoom: { el: null, k: 1, x: 0, y: 0 } };
  const absTop = el => { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };
  function scrollTo(sel, off = 0) { cur.scrollT = absTop($(sel)) + off; }
  function cam(id, az, pol, dist, tgt) { cur.cams[id] = { az, pol, dist, tgt }; }
  function zoom(sel, k, fx = 0.5, fy = 0.5) { cur.zoomT = { sel, k, fx, fy }; }
  const camState = {};
  function applyCams(first) {
    for (const [id, t] of Object.entries(cur.cams)) {
      const S = A.stages[id]; if (!S) continue;
      S.controls.autoRotate = false;
      let c = camState[id];
      if (!c || first) c = camState[id] = { ...t, tgt: [...t.tgt] };
      const L = 0.07;
      // shortest-path azimuth lerp
      c.az += (t.az - c.az) * L; c.pol += (t.pol - c.pol) * L; c.dist += (t.dist - c.dist) * L;
      for (let i = 0; i < 3; i++) c.tgt[i] += (t.tgt[i] - c.tgt[i]) * L;
      const sp = Math.sin(c.pol);
      S.controls.target.set(...c.tgt);
      S.camera.position.set(c.tgt[0] + c.dist * sp * Math.sin(c.az), c.tgt[1] + c.dist * Math.cos(c.pol), c.tgt[2] + c.dist * sp * Math.cos(c.az));
      S.camera.lookAt(...c.tgt);
    }
  }
  let lastZoomEl = null, zk = 1, zfx = .5, zfy = .5;
  function applyZoom() {
    const t = cur.zoomT || { sel: null, k: 1, fx: .5, fy: .5 };
    const el = t.sel ? $(t.sel) : lastZoomEl;
    if (el !== lastZoomEl && lastZoomEl) { lastZoomEl.style.transform = ''; zk = 1; }
    if (!el) return;
    lastZoomEl = el; el.classList.add('zoomable');
    const L = 0.06; zk += (t.k - zk) * L; zfx += (t.fx - zfx) * L; zfy += (t.fy - zfy) * L;
    el.style.transformOrigin = `${zfx * 100}% ${zfy * 100}%`;
    el.style.transform = `scale(${zk.toFixed(4)})`;
  }

  const TAU = Math.PI * 2;
  const D = {
    s00(p) { chap.textContent = 'Анатомия сотовой связи'; scrollTo('#top', 0); cam('hero-stage', 0.4 + p * 1.2, 1.35, 9.2, [0, 0, 0]); zoom(null, 1); },
    s01(p) { chap.textContent = 'Земля · базовые станции · орбиты'; scrollTo('#top', 0);
      cam('hero-stage', 1.6 + p * 2.2, mix(1.35, 1.0, seg2(p, 0, .6)), mix(9.2, 4.6, seg2(p, 0, .7)), [0, 0.3, 0]);
      zoom('.hero', mix(1, 1.32, seg2(p, 0, .5)), 0.78, 0.5); },
    s02(p) { chap.textContent = 'I · Путь сигнала'; zoom(null, 1); scrollTo('#path .specimen', -40);
      at('s02', p, 0, 'a', () => step('path', 1)); at('s02', p, .5, 'b', () => step('path', 2));
      cam('path-stage', mix(-0.5, -0.25, p), 1.2, mix(14, 6.5, seg2(p, 0, .6)), [mix(0, -5.5, seg2(p, 0, .6)), 1.2, 0.3]); },
    s03(p) { chap.textContent = 'I · Эфир и базовая станция'; scrollTo('#path .specimen', -40);
      at('s03', p, 0, 'a', () => step('path', 3)); at('s03', p, .5, 'b', () => step('path', 4));
      cam('path-stage', mix(-0.25, 0.25, p), mix(1.2, 1.1, p), mix(7, 6, p), [mix(-5, -3.6, seg2(p, 0, .6)), mix(1.5, 2.4, p), -0.2]); },
    s04(p) { chap.textContent = 'I · Ядро сети и абонент B'; scrollTo('#path .specimen', -40);
      at('s04', p, 0, 'a', () => step('path', 5)); at('s04', p, .3, 'b', () => step('path', 6)); at('s04', p, .65, 'c', () => step('path', 7));
      const x = p < .3 ? mix(-2, 0, seg2(p, 0, .3)) : p < .65 ? 0 : mix(0, 4.6, seg2(p, .65, .9));
      cam('path-stage', mix(0.25, 0, p), 1.15, p > .85 ? 13 : 7.5, [p > .9 ? 0 : x, 1.4, 0]); },
    s05(p) { chap.textContent = 'II · Анатомия вышки'; scrollTo('#tower .specimen', -40);
      at('s05', p, 0, 'r', () => slider('#tower-explode', 0)); if (p > .3) slider('#tower-explode', mix(0, 100, seg2(p, .3, .95)));
      cam('tower-stage', 0.7 + p * TAU * 0.6, 1.25, 19, [1, 4.6, 0]); },
    s06(p) { chap.textContent = 'II · Антенны и радиоблоки'; scrollTo('#tower .specimen', -40);
      at('s06', p, 0, 'a', () => { legend('tower', 2); slider('#tower-explode', 55); }); at('s06', p, .45, 'b', () => legend('tower', 3)); at('s06', p, .72, 'c', () => legend('tower', 5));
      const tg = p < .72 ? [0, 8.4, 0] : [0, 6.4, -1];
      cam('tower-stage', 4.5 + p * 1.6, mix(1.35, 1.2, p), p < .72 ? 8 : 7, tg); },
    s07(p) { chap.textContent = 'II · Оборудование у основания'; scrollTo('#tower .specimen', -40);
      at('s07', p, 0, 'a', () => legend('tower', 9)); at('s07', p, .3, 'b', () => legend('tower', 10)); at('s07', p, .55, 'c', () => legend('tower', 11)); at('s07', p, .78, 'd', () => legend('tower', 12));
      cam('tower-stage', 6.2 + p * 1.2, mix(1.2, 1.05, p), p < .78 ? 6.5 : 12, p < .78 ? [3.6, 1.2, 0.9] : [1, 1, 0]); },
    s08(p) { chap.textContent = 'III · Анатомия смартфона'; scrollTo('#phone .specimen', -40);
      at('s08', p, 0, 'r', () => { slider('#phone-explode', 0); legend('tower', 12); }); if (p < .35) slider('#phone-explode', mix(0, 85, seg2(p, .05, .33)));
      at('s08', p, .35, 'a', () => legend('phone', 2)); at('s08', p, .55, 'b', () => legend('phone', 3)); at('s08', p, .72, 'c', () => legend('phone', 4)); at('s08', p, .86, 'd', () => legend('phone', 5));
      cam('phone-stage', 1.1 + p * TAU * 0.55, mix(1.3, 1.15, p), mix(6, 3.4, seg2(p, 0, .4)), [0, 0, 0]); },
    s09(p) { chap.textContent = 'IMEI и IMSI';
      if (p < .3) { scrollTo('#phone .specimen', -40); at('s09', p, 0, 'a', () => legend('phone', 5)); cam('phone-stage', 4.6 + p * 2, 1.25, 2.4, [-0.2, 0.05, -0.1]); zoom(null, 1); }
      else { scrollTo('#phone .prose', -230); zoom('#phone .prose', 1.35, p < .55 ? 0.0 : p < .8 ? 0.5 : 1.0, 0.3); } },
    s10(p) { chap.textContent = 'IV · Физика радиоинтерфейса'; scrollTo('#physics .instruments', -40);
      at('s10', p, .05, 'a', () => click('#qam-order [data-m="64"]'));
      if (p < .4) slider('#qam-snr', mix(32, 12, seg2(p, .08, .38))); else slider('#qam-snr', mix(12, 30, seg2(p, .4, .5)));
      if (p > .45 && p < .7) slider('#ofdm-n', mix(3, 12, seg2(p, .45, .68)));
      if (p > .7) { slider('#fs-f', mix(150, 900, seg2(p, .72, .95))); slider('#fs-d', mix(300, 650, seg2(p, .72, .95))); }
      zoom('#physics .instruments', 1.28, p < .4 ? 0 : p < .7 ? 0.5 : 1, 0.45); },
    s11(p) { chap.textContent = 'V · Соты и хендовер'; zoom(null, 1); scrollTo('#cells .specimen', -40);
      cam('cells-stage', mix(-0.3, 0.5, p), mix(0.9, 0.7, p), mix(15, 10.5, seg2(p, 0, .5)), [0, 0, 0.3]); },
    s12(p) { chap.textContent = 'VI · Зачем нужны спутники';
      if (p < .5) { scrollTo('#top', 0); zoom('.hero', 1.3, 0.78, 0.5); cam('hero-stage', 3 + p * 3, 1.1, mix(8, 5, seg2(p, 0, .4)), [0, 0.2, 0]); }
      else { zoom(null, 1); scrollTo('#satellite .specimen', -40); at('s12', p, .5, 'r', () => slider('#sat-explode', 0)); cam('sat-stage', 0.6 + p * 2.4, 1.2, mix(14, 8.5, seg2(p, .5, .8)), [0, 0, 0]); } },
    s13(p) { chap.textContent = 'VI · Анатомия спутника';
      if (p < .86) { zoom(null, 1); scrollTo('#satellite .specimen', -40); slider('#sat-explode', mix(0, 70, seg2(p, 0, .15)));
        at('s13', p, .02, 'a', () => legend('sat', 2)); at('s13', p, .15, 'b', () => legend('sat', 3)); at('s13', p, .38, 'c', () => legend('sat', 4)); at('s13', p, .52, 'd', () => legend('sat', 5)); at('s13', p, .68, 'e', () => legend('sat', 6));
        cam('sat-stage', 2.8 + p * TAU * 0.5, mix(1.0, 1.5, Math.sin(p * 3) * .5 + .5), 7.5, [0, mix(0, -0.4, p), 0]); }
      else { scrollTo('#satellite .tbl', -200); zoom('#satellite .tbl', 1.2, 0.3, 0.5); } },
    s14(p) { chap.textContent = 'VII · Почему возможен перехват'; zoom(null, 1); scrollTo('#intercept .specimen', -40);
      at('s14', p, 0, 'a', () => step('int', 1)); at('s14', p, .45, 'b', () => step('int', 2)); at('s14', p, .75, 'c', () => step('int', 3));
      cam('int-stage', mix(-0.2, 0.35, p), mix(1.1, 1.0, p), mix(13, 8.5, seg2(p, .3, .8)), [mix(-1, 1.8, seg2(p, .3, .9)), 1, 0.5]); },
    s15(p) { chap.textContent = 'VII · Понижение до 2G'; scrollTo('#intercept .specimen', -40);
      at('s15', p, 0, 'a', () => step('int', 4)); at('s15', p, .45, 'b', () => step('int', 5));
      cam('int-stage', mix(0.35, -0.3, p), 1.05, p < .45 ? 6.5 : 11, p < .45 ? [2, 1.2, 1.1] : [-0.4, 1.2, 0]); },
    s16(p) { chap.textContent = 'VII · Другие угрозы и защита';
      if (p < .5) { scrollTo('#intercept .cards', -120); zoom('#intercept .cards', 1.22, p < .25 ? 0.15 : 0.85, 0.65); }
      else { const el = document.querySelectorAll('#intercept .cards')[1]; el.id = 'defcards'; scrollTo('#defcards', -230); zoom('#defcards', 1.25, p < .68 ? 0 : p < .84 ? 0.5 : 1, 0.5); } },
    s17(p) { chap.textContent = 'Поколения 1G → 5G';
      if (p < .55) { scrollTo('#generations .tbl', -160); zoom('#generations .tbl', mix(1.25, 1.05, seg2(p, .1, .5)), 0.2, 0.4); }
      else { zoom(null, 1); scrollTo('#top', 0); cam('hero-stage', 6 + p * 2, 1.35, mix(5, 9.5, seg2(p, .55, .9)), [0, 0, 0]); } },
  };

  let first = true, curSeg = null;
  window.__direct = (seg, p, text) => {
    if (seg !== curSeg) { curSeg = seg; sub.textContent = text; }
    cur.zoomT = undefined;
    D[seg](p);
    if (cur.scrollT !== undefined) {
      const L = Math.abs(cur.scrollT - cur.scroll) > 2500 ? 0.22 : 0.09;
      cur.scroll += (cur.scrollT - cur.scroll) * (first ? 1 : L);
      window.scrollTo(0, cur.scroll);
    }
    applyCams(first); applyZoom(); first = false;
  };
})();
