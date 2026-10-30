// 도트 그림 만들기: 모든 그림을 코드로 한 픽셀씩 그려서 오프스크린 캔버스에 보관해요.
export const TS = 16;
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const mk = (w, h, fn) => { const c = cv(w, h); const x = c.getContext('2d'); fn(x, w, h); return c; };
const px = (x, X, Y, col) => { x.fillStyle = col; x.fillRect(X, Y, 1, 1); };
const rc = (x, X, Y, W, H, col) => { x.fillStyle = col; x.fillRect(X, Y, W, H); };
function rng(seed) { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export { hash };

// 가장자리에 어두운 테두리를 둘러 도트 느낌을 살려요.
function outline(c, col = '#2b1d14') {
  const x = c.getContext('2d'); const w = c.width, h = c.height; const d = x.getImageData(0, 0, w, h); const o = x.createImageData(w, h); o.data.set(d.data);
  const a = (X, Y) => (X < 0 || Y < 0 || X >= w || Y >= h ? 0 : d.data[(Y * w + X) * 4 + 3]);
  const rgb = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) { if (a(X, Y)) continue; if (a(X - 1, Y) || a(X + 1, Y) || a(X, Y - 1) || a(X, Y + 1)) { const i = (Y * w + X) * 4; o.data[i] = rgb[0]; o.data[i + 1] = rgb[1]; o.data[i + 2] = rgb[2]; o.data[i + 3] = 255; } }
  x.putImageData(o, 0, 0); return c;
}
const ol = (w, h, fn, col) => outline(mk(w, h, fn), col);
const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f))), g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f))), b = Math.max(0, Math.min(255, Math.round((n & 255) * f))); return `rgb(${r},${g},${b})`; };

export const PAL = { grass: '#62b34f', grass2: '#58a646', grass3: '#74c25b', path: '#c9a266', path2: '#b98f55', soil: '#8a5a33', soilD: '#6e4526', wet: '#5a3a22', water: '#4aa3df', water2: '#6bbcf0', wood: '#9a6a36', woodD: '#7a4f26', ink: '#2b1d14' };

// ---------- 바닥 ----------
export function tiles() {
  const T = {};
  T.grass = [0, 1, 2, 3].map((v) => mk(16, 16, (x) => { rc(x, 0, 0, 16, 16, PAL.grass); const r = rng(v * 77 + 3); for (let i = 0; i < 14; i++) px(x, (r() * 16) | 0, (r() * 16) | 0, r() < 0.5 ? PAL.grass2 : PAL.grass3); if (v === 3) { px(x, 5, 6, '#fff'); px(x, 4, 6, '#ffd1e0'); px(x, 6, 6, '#ffd1e0'); px(x, 5, 5, '#ffd1e0'); px(x, 5, 7, '#ffd1e0'); px(x, 5, 6, '#ffe45e'); px(x, 11, 11, '#ffe45e'); px(x, 10, 11, '#fff'); px(x, 12, 11, '#fff'); px(x, 11, 10, '#fff'); px(x, 11, 12, '#fff'); } }));
  T.path = [0, 1].map((v) => mk(16, 16, (x) => { rc(x, 0, 0, 16, 16, PAL.path); const r = rng(v * 31 + 9); for (let i = 0; i < 12; i++) px(x, (r() * 16) | 0, (r() * 16) | 0, PAL.path2); for (let i = 0; i < 3; i++) px(x, (r() * 16) | 0, (r() * 16) | 0, '#e2c58f'); }));
  T.soil = mk(16, 16, (x) => { rc(x, 0, 0, 16, 16, PAL.soil); const r = rng(5); for (let i = 0; i < 18; i++) px(x, (r() * 16) | 0, (r() * 16) | 0, PAL.soilD); for (let y = 3; y < 16; y += 5) rc(x, 1, y, 14, 1, PAL.soilD); rc(x, 0, 0, 16, 1, '#a06c3f'); rc(x, 0, 0, 1, 16, '#a06c3f'); });
  T.wet = mk(16, 16, (x) => { rc(x, 0, 0, 16, 16, PAL.wet); const r = rng(6); for (let i = 0; i < 14; i++) px(x, (r() * 16) | 0, (r() * 16) | 0, '#47301c'); for (let y = 3; y < 16; y += 5) rc(x, 1, y, 14, 1, '#47301c'); rc(x, 0, 0, 16, 1, '#6e4a2c'); rc(x, 0, 0, 1, 16, '#6e4a2c'); });
  T.locked = mk(16, 16, (x) => { rc(x, 0, 0, 16, 16, PAL.grass); const r = rng(8); for (let i = 0; i < 10; i++) px(x, (r() * 16) | 0, (r() * 16) | 0, PAL.grass2); rc(x, 1, 1, 14, 14, 'rgba(0,0,0,0.12)'); rc(x, 2, 2, 12, 12, 'rgba(255,255,255,0.08)'); for (const [a, b] of [[2, 2], [13, 2], [2, 13], [13, 13]]) rc(x, a, b, 1, 1, PAL.wood); });
  T.water = [0, 1].map((f) => mk(16, 16, (x) => { rc(x, 0, 0, 16, 16, PAL.water); for (let i = 0; i < 4; i++) { const X = ((i * 5 + f * 3) % 14) + 1, Y = (i * 4 + 2) % 14; rc(x, X, Y, 3, 1, PAL.water2); } }));
  return T;
}

// ---------- 식물 ----------
export function cropSprites(CROPS) {
  const out = {};
  const kinds = { lettuce: 'leaf', carrot: 'root', potato: 'root', corn: 'stalk', wheat: 'stalk', tomato: 'bush', sunflower: 'flower', strawberry: 'bush', pumpkin: 'gourd', grape: 'vine' };
  for (const [id, c] of Object.entries(CROPS)) {
    const k = kinds[id] || 'leaf'; const col = c.color;
    out[id] = [0, 1, 2].map((st) => ol(16, 16, (x) => {
      if (st === 0) { rc(x, 7, 11, 2, 3, '#4c9a3c'); rc(x, 5, 10, 3, 2, '#6bc24f'); rc(x, 8, 9, 3, 2, '#6bc24f'); return; }
      if (k === 'leaf') { const g = st === 1 ? '#5fb04a' : '#74cf58'; rc(x, 4, 8, 8, 5, g); rc(x, 5, 6, 6, 3, st === 2 ? '#8be26a' : g); rc(x, 6, 9, 4, 3, shade('#74cf58', 1.15)); px(x, 7, 7, '#a8f08a'); }
      else if (k === 'root') { rc(x, 5, 7, 6, 3, '#4fa63f'); rc(x, 6, 5, 4, 3, '#6bc24f'); px(x, 4, 9, '#4fa63f'); px(x, 11, 9, '#4fa63f'); if (st === 2) { rc(x, 6, 10, 4, 4, col); rc(x, 7, 14, 2, 1, col); px(x, 7, 11, shade(col, 1.2)); } else rc(x, 7, 10, 2, 1, col); }
      else if (k === 'stalk') { const h = st === 1 ? 7 : 11; for (const X of [4, 7, 10]) { rc(x, X, 14 - h, 2, h, '#5fb04a'); } if (st === 2) { for (const X of [4, 7, 10]) { rc(x, X - 1, 14 - h - 1, 4, 3, col); px(x, X, 14 - h - 2, shade(col, 1.15)); } } }
      else if (k === 'bush') { rc(x, 3, 7, 10, 7, st === 1 ? '#4fa63f' : '#5fb94a'); rc(x, 5, 5, 6, 3, '#5fb94a'); if (st === 2) for (const [a, b] of [[4, 8], [8, 10], [11, 8], [6, 12], [9, 7]]) { rc(x, a, b, 2, 2, col); px(x, a, b, shade(col, 1.3)); } }
      else if (k === 'flower') { rc(x, 7, 6, 2, 8, '#4fa63f'); rc(x, 4, 10, 3, 2, '#5fb94a'); rc(x, 9, 9, 3, 2, '#5fb94a'); if (st === 2) { rc(x, 4, 1, 8, 6, col); rc(x, 6, 2, 4, 4, '#7a4a1e'); rc(x, 3, 3, 1, 2, col); rc(x, 12, 3, 1, 2, col); } else rc(x, 6, 4, 4, 3, '#6bc24f'); }
      else if (k === 'gourd') { rc(x, 3, 12, 10, 2, '#4fa63f'); rc(x, 2, 9, 3, 2, '#5fb94a'); if (st === 2) { rc(x, 4, 6, 9, 7, col); rc(x, 5, 5, 7, 1, col); rc(x, 8, 6, 1, 7, shade(col, 0.8)); rc(x, 7, 3, 3, 2, '#4a7a2a'); } else { rc(x, 6, 9, 4, 3, '#7dd05a'); } }
      else { for (const X of [3, 12]) rc(x, X, 3, 1, 11, '#8a5a33'); rc(x, 3, 3, 10, 1, '#8a5a33'); rc(x, 4, 4, 8, 4, '#4fa63f'); if (st === 2) for (const [a, b] of [[4, 6], [7, 7], [10, 6], [5, 9], [9, 9]]) { rc(x, a, b, 2, 3, col); px(x, a, b, shade(col, 1.4)); } }
    }));
  }
  return out;
}

// ---------- 사람과 동물 ----------
export function playerSprites() {
  const S = {}; const dirs = ['down', 'up', 'left', 'right'];
  for (const d of dirs) S[d] = [0, 1, 2].map((f) => ol(16, 16, (x) => {
    const bob = f === 1 ? -1 : 0; const sh = f === 2 ? 1 : 0;
    // 다리
    rc(x, 5, 12 + bob * 0, 2, 3, '#3b5ba5'); rc(x, 9, 12, 2, 3, '#3b5ba5'); if (f === 1) rc(x, 5, 14, 2, 1, '#2d4580'); if (f === 2) rc(x, 9, 14, 2, 1, '#2d4580');
    rc(x, 5, 15, 2, 1, '#5a3a22'); rc(x, 9, 15, 2, 1, '#5a3a22');
    // 몸
    rc(x, 4, 7 + bob, 8, 6, '#e8573d'); rc(x, 5, 9 + bob, 6, 4, '#3b5ba5'); px(x, 6, 9 + bob, '#f2d34a'); px(x, 9, 9 + bob, '#f2d34a');
    if (d === 'left') { rc(x, 3, 8 + bob, 2, 4, '#e8573d'); } else if (d === 'right') { rc(x, 11, 8 + bob, 2, 4, '#e8573d'); } else { rc(x, 3, 8 + bob, 2, 4, '#e8573d'); rc(x, 11, 8 + bob, 2, 4, '#e8573d'); rc(x, 3, 12 + bob, 2, 1, '#f5cfa0'); rc(x, 11, 12 + bob, 2, 1, '#f5cfa0'); }
    // 얼굴
    rc(x, 5, 2 + bob, 6, 6, '#f5cfa0');
    if (d === 'down') { px(x, 6, 5 + bob, '#2b1d14'); px(x, 9, 5 + bob, '#2b1d14'); px(x, 7, 7 + bob, '#d98a7a'); px(x, 8, 7 + bob, '#d98a7a'); }
    if (d === 'left') { px(x, 6, 5 + bob, '#2b1d14'); } if (d === 'right') { px(x, 9, 5 + bob, '#2b1d14'); }
    if (d === 'up') rc(x, 5, 2 + bob, 6, 4, '#6b4423');
    // 밀짚모자
    rc(x, 3, 3 + bob, 10, 1, '#e8c25a'); rc(x, 5, 0 + bob, 6, 3, '#f0d27a'); rc(x, 5, 2 + bob, 6, 1, '#c8452f');
    void sh;
  }));
  return S;
}
export function npcSprite(shirt, hair) {
  return ol(16, 16, (x) => { rc(x, 5, 12, 2, 3, '#4a4a6a'); rc(x, 9, 12, 2, 3, '#4a4a6a'); rc(x, 4, 7, 8, 6, shirt); rc(x, 3, 8, 2, 4, shirt); rc(x, 11, 8, 2, 4, shirt); rc(x, 5, 2, 6, 6, '#f5cfa0'); rc(x, 5, 1, 6, 3, hair); px(x, 6, 5, '#2b1d14'); px(x, 9, 5, '#2b1d14'); });
}
export function animalSprites() {
  const A = {};
  const body = (x, base, spot, f) => { rc(x, 3, 6, 10, 6, base); rc(x, 2, 7, 1, 4, base); rc(x, 12, 4, 3, 5, base); rc(x, 4, 12, 2, 3 - f, '#5a3a22'); rc(x, 10, 12, 2, 3 - (1 - f), '#5a3a22'); if (spot) { rc(x, 5, 7, 3, 3, spot); rc(x, 9, 9, 2, 2, spot); } px(x, 13, 5, '#2b1d14'); };
  A.cow = [0, 1].map((f) => ol(16, 16, (x) => { body(x, '#fdfdfd', '#2b2b2b', f); rc(x, 13, 7, 3, 3, '#f5a8b8'); rc(x, 12, 3, 1, 2, '#e8e0c0'); rc(x, 14, 3, 1, 2, '#e8e0c0'); rc(x, 5, 11, 2, 1, '#f5a8b8'); }));
  A.goat = [0, 1].map((f) => ol(16, 16, (x) => { body(x, '#e8dcc0', '#b8a884', f); rc(x, 13, 3, 1, 3, '#7a6a48'); rc(x, 12, 2, 1, 2, '#7a6a48'); rc(x, 14, 9, 1, 2, '#e8dcc0'); }));
  A.sheep = [0, 1].map((f) => ol(16, 16, (x) => { rc(x, 3, 5, 10, 8, '#fafafa'); for (const [a, b] of [[3, 5], [6, 4], [9, 5], [12, 6], [3, 9], [12, 10]]) rc(x, a, b, 2, 2, '#fafafa'); rc(x, 12, 6, 3, 4, '#4a3a30'); rc(x, 4, 13, 2, 2 - f, '#4a3a30'); rc(x, 10, 13, 2, 1 + f, '#4a3a30'); px(x, 14, 7, '#fff'); }));
  A.chicken = [0, 1].map((f) => ol(16, 16, (x) => { rc(x, 4, 7, 8, 5, '#fafafa'); rc(x, 10, 4, 4, 4, '#fafafa'); rc(x, 11, 2, 2, 2, '#e8402f'); rc(x, 14, 6, 2, 1, '#f2a122'); px(x, 12, 5, '#2b1d14'); rc(x, 3, 8, 1, 3, '#e8e0d0'); rc(x, 6, 12, 1, 3 - f, '#f2a122'); rc(x, 9, 12, 1, 2 + f, '#f2a122'); rc(x, 11, 8, 2, 2, '#e8e0d0'); }));
  A.duck = [0, 1].map((f) => ol(16, 16, (x) => { rc(x, 3, 8, 9, 5, '#f7e04a'); rc(x, 10, 4, 4, 5, '#f7e04a'); rc(x, 14, 6, 2, 2, '#f28a22'); px(x, 12, 5, '#2b1d14'); rc(x, 5, 13 + f, 2, 1, '#f28a22'); rc(x, 8, 13 + (1 - f), 2, 1, '#f28a22'); rc(x, 4, 9, 4, 2, '#e8c82a'); }));
  A.hive = [0, 1].map((f) => ol(16, 16, (x) => { rc(x, 3, 4, 10, 10, '#f2c14a'); rc(x, 3, 7, 10, 1, '#d9a02a'); rc(x, 3, 10, 10, 1, '#d9a02a'); rc(x, 2, 3, 12, 2, '#a86a2a'); rc(x, 6, 11, 4, 3, '#4a2a10'); px(x, 2 + f * 11, 9, '#2b1d14'); px(x, 3 + f * 10, 8, '#f7e04a'); }));
  return A;
}

// ---------- 아이템 아이콘(16x16) ----------
const ICON = { // shape, color(s)
  egg: ['egg', '#f7ead2'], duckegg: ['egg', '#cfe8d8'], milk: ['bottle', '#fdfdfd', '#6fb3e8'], goatmilk: ['bottle', '#f3ecd8', '#e8a85a'], wool: ['ball', '#f4f1ea'], honey: ['jar', '#f2b82a', '#7a4a1a'], butter: ['block', '#f9e27a'], yogurt: ['cup', '#fdfdfd', '#e88aa8'], cheese: ['wedge', '#f7d23a'], goatcheese: ['wedge', '#f4ead0'], icecream: ['cone', '#f6c6d8'],
  flour: ['sack', '#f4ede0'], cornmeal: ['sack', '#f2d46a'], bread: ['loaf', '#d9984a'], cookie: ['round', '#c8884a'], honeycookie: ['round', '#e0a84a'], pie: ['pie', '#e8a040'], tart: ['pie', '#e86a8a'], cornbread: ['loaf', '#f2c84a'], strawjam: ['jar', '#e5486a', '#fdfdfd'], grapejam: ['jar', '#7a4bb0', '#fdfdfd'], sauce: ['jar', '#e0443a', '#fdfdfd'], pickle: ['jar', '#f28c28', '#fdfdfd'],
  grapejuice: ['bottle', '#7a4bb0', '#fdfdfd'], tomatojuice: ['bottle', '#e0443a', '#fdfdfd'], yarn: ['ball', '#e86a8a'], scarf: ['scarf', '#e86a8a'], oil: ['bottle', '#f2c200', '#fdfdfd'], salad: ['bowl', '#74cf58'], fries: ['fries', '#f2c84a'], omelet: ['omelet', '#f7d23a'], pizza: ['pizza', '#f0b050'],
  feed: ['sack', '#c9a066'], box: ['box', '#c9a066'],
  lettuce: ['leafy', '#74cf58'], carrot: ['carrot', '#f28c28'], potato: ['potato', '#c9a66b'], corn: ['corn', '#f5d442'], wheat: ['wheat', '#e3c26a'], tomato: ['round', '#e0443a'], sunflower: ['flower', '#f2c200'], strawberry: ['berry', '#e5486a'], pumpkin: ['round', '#f0922b'], grape: ['grapes', '#7a4bb0'],
};
export function iconCanvas(id) {
  const [shape, c1, c2] = ICON[id] || ['round', '#aaa'];
  return ol(16, 16, (x) => {
    const d = shade(c1, 0.8), l = shade(c1, 1.2);
    switch (shape) {
      case 'egg': rc(x, 5, 4, 6, 9, c1); rc(x, 6, 3, 4, 1, c1); rc(x, 4, 7, 1, 4, c1); rc(x, 11, 7, 1, 4, c1); rc(x, 6, 5, 2, 2, '#fff'); break;
      case 'bottle': rc(x, 6, 1, 4, 3, '#d9d9d9'); rc(x, 5, 4, 6, 10, c1); rc(x, 5, 8, 6, 4, c2 || c1); px(x, 6, 5, '#fff'); break;
      case 'ball': rc(x, 3, 3, 10, 10, c1); rc(x, 4, 2, 8, 12, c1); rc(x, 5, 5, 3, 1, l); rc(x, 8, 9, 3, 1, d); break;
      case 'jar': rc(x, 4, 2, 8, 2, c2 || '#888'); rc(x, 3, 4, 10, 10, '#e6f4ff'); rc(x, 4, 6, 8, 7, c1); px(x, 5, 5, '#fff'); break;
      case 'block': rc(x, 2, 6, 12, 7, c1); rc(x, 3, 5, 10, 1, l); rc(x, 2, 9, 12, 1, d); break;
      case 'cup': rc(x, 3, 3, 10, 2, '#fff'); rc(x, 4, 5, 8, 8, c1); rc(x, 4, 5, 8, 3, c2 || '#ccc'); break;
      case 'wedge': for (let i = 0; i < 9; i++) rc(x, 2 + i, 12 - Math.min(i, 8) * 1, 12 - i, 1, c1); rc(x, 2, 8, 12, 5, c1); rc(x, 3, 5, 9, 3, c1); px(x, 5, 10, d); px(x, 9, 9, d); px(x, 7, 7, d); break;
      case 'cone': rc(x, 4, 2, 8, 6, c1); rc(x, 5, 1, 6, 2, shade(c1, 1.1)); for (let i = 0; i < 6; i++) rc(x, 5 + i * 0.5, 8 + i, 6 - i, 1, '#d8a050'); break;
      case 'sack': rc(x, 3, 4, 10, 10, c1); rc(x, 5, 2, 6, 3, c1); rc(x, 5, 4, 6, 1, d); px(x, 6, 9, d); px(x, 9, 11, d); break;
      case 'loaf': rc(x, 2, 6, 12, 7, c1); rc(x, 3, 5, 10, 1, c1); rc(x, 4, 7, 2, 1, l); rc(x, 8, 7, 2, 1, l); rc(x, 12, 9, 1, 3, d); break;
      case 'round': rc(x, 3, 4, 10, 9, c1); rc(x, 4, 3, 8, 11, c1); rc(x, 5, 5, 2, 2, l); rc(x, 7, 2, 2, 2, '#4a9a3a'); break;
      case 'pie': rc(x, 2, 8, 12, 5, d); rc(x, 3, 5, 10, 4, c1); rc(x, 5, 4, 6, 1, c1); for (const X of [4, 7, 10]) px(x, X, 6, l); break;
      case 'scarf': rc(x, 3, 4, 10, 4, c1); rc(x, 3, 8, 3, 6, c1); rc(x, 4, 5, 8, 1, l); for (const Y of [10, 12]) rc(x, 3, Y, 3, 1, d); break;
      case 'bowl': rc(x, 2, 8, 12, 5, '#fdfdfd'); rc(x, 3, 4, 10, 5, c1); rc(x, 5, 3, 3, 2, '#e0443a'); rc(x, 9, 5, 3, 2, '#f28c28'); break;
      case 'fries': for (let i = 0; i < 5; i++) rc(x, 4 + i * 2, 2 + (i % 2), 1, 7, c1); rc(x, 3, 8, 10, 6, '#e8402f'); rc(x, 5, 10, 6, 2, '#fdfdfd'); break;
      case 'omelet': rc(x, 2, 5, 12, 8, '#fdfdfd'); rc(x, 3, 6, 10, 6, c1); rc(x, 5, 8, 6, 1, shade(c1, 0.85)); break;
      case 'pizza': for (let i = 0; i < 12; i++) rc(x, 2 + i * 0.5, 3 + i, 12 - i, 1, c1); px(x, 6, 6, '#d83a2a'); px(x, 8, 9, '#d83a2a'); px(x, 5, 8, '#4a9a3a'); break;
      case 'box': rc(x, 2, 4, 12, 9, c1); rc(x, 2, 4, 12, 2, l); rc(x, 7, 4, 2, 9, '#e8d6b0'); break;
      case 'leafy': rc(x, 3, 6, 10, 7, c1); rc(x, 5, 4, 6, 3, shade(c1, 1.15)); rc(x, 7, 7, 2, 5, shade(c1, 0.85)); break;
      case 'carrot': rc(x, 6, 2, 4, 3, '#4fa63f'); rc(x, 5, 5, 6, 3, c1); rc(x, 6, 8, 4, 3, c1); rc(x, 7, 11, 2, 3, c1); px(x, 6, 6, l); break;
      case 'potato': rc(x, 3, 5, 10, 8, c1); rc(x, 4, 4, 8, 10, c1); px(x, 6, 7, d); px(x, 9, 9, d); px(x, 5, 10, d); break;
      case 'corn': rc(x, 5, 2, 6, 11, c1); rc(x, 3, 6, 3, 8, '#5fb04a'); rc(x, 10, 6, 3, 8, '#5fb04a'); for (const Y of [4, 7, 10]) rc(x, 6, Y, 4, 1, d); break;
      case 'wheat': for (const X of [4, 7, 10]) { rc(x, X, 5, 1, 9, '#c9a45a'); rc(x, X - 1, 2, 3, 4, c1); } break;
      case 'flower': rc(x, 7, 8, 2, 6, '#4fa63f'); rc(x, 3, 2, 10, 7, c1); rc(x, 6, 4, 4, 3, '#7a4a1e'); break;
      case 'berry': rc(x, 4, 5, 8, 8, c1); rc(x, 5, 4, 6, 10, c1); rc(x, 5, 2, 6, 3, '#4fa63f'); px(x, 6, 7, '#ffe9a0'); px(x, 9, 9, '#ffe9a0'); px(x, 7, 11, '#ffe9a0'); break;
      case 'grapes': for (const [a, b] of [[4, 5], [7, 5], [10, 5], [5, 8], [8, 8], [6, 11]]) rc(x, a, b, 3, 3, c1); rc(x, 7, 1, 2, 3, '#4fa63f'); break;
      default: rc(x, 3, 3, 10, 10, c1);
    }
  });
}

// ---------- 건물 ----------
function building(w, h, o) {
  return ol(w, h, (x) => {
    const wallH = Math.round(h * 0.55), roofH = h - wallH;
    rc(x, 0, roofH, w, wallH, o.wall); rc(x, 0, roofH + wallH - 3, w, 3, shade(o.wall, 0.85));
    for (let i = 0; i < w; i += 4) rc(x, i, roofH, 1, wallH - 3, shade(o.wall, 0.94));
    // 지붕(계단식)
    for (let r = 0; r < roofH; r++) { const inset = Math.round((roofH - 1 - r) * (o.slope || 0.4)); rc(x, inset, r, w - inset * 2, 1, r % 3 === 2 ? shade(o.roof, 0.82) : o.roof); }
    rc(x, 0, roofH - 1, w, 1, shade(o.roof, 0.7));
    // 문
    const dw = o.door || 8, dx = Math.round((w - dw) / 2); rc(x, dx, h - 14, dw, 14, o.doorColor || '#7a4a24'); rc(x, dx + 1, h - 13, dw - 2, 12, shade(o.doorColor || '#7a4a24', 1.15)); px(x, dx + dw - 2, h - 7, '#f2d34a');
    // 창
    if (o.windows !== false) for (const wx of o.winX || [Math.round(w * 0.14), Math.round(w * 0.74)]) { rc(x, wx, roofH + 4, 7, 7, '#e6f4ff'); rc(x, wx, roofH + 4, 7, 1, '#fff'); rc(x, wx + 3, roofH + 4, 1, 7, '#9fb4c8'); rc(x, wx, roofH + 7, 7, 1, '#9fb4c8'); rc(x, wx - 1, roofH + 11, 9, 1, '#7a4a24'); }
    // 간판
    if (o.sign) { const sx = Math.round(w / 2) - 8; rc(x, sx, roofH, 16, 10, '#fff5d6'); rc(x, sx, roofH, 16, 1, '#7a4a24'); rc(x, sx, roofH + 9, 16, 1, '#7a4a24'); x.drawImage(iconCanvas(o.sign), sx + 4, roofH + 1, 8, 8); }
  });
}
export function buildings() {
  const B = {};
  B.house = building(96, 80, { wall: '#f2dcb0', roof: '#c7473a', door: 10, sign: null, winX: [14, 72], slope: 0.35 });
  B.barn = building(80, 80, { wall: '#c04a3a', roof: '#6a4a3a', door: 16, doorColor: '#e8d6b0', sign: null, winX: [10, 62], slope: 0.3 });
  const shop = (wall, roof, sign) => building(64, 52, { wall, roof, door: 8, sign, winX: [8, 48] });
  B.seedshop = shop('#d9f0c8', '#4a9a3a', 'carrot'); B.equip = shop('#cfe0f0', '#4a6aa8', 'box'); B.hr = shop('#f5e3c0', '#c88a3a', 'egg'); B.clinic = shop('#fdfdfd', '#e8573d', 'honey');
  const client = (wall, roof, sign) => building(64, 52, { wall, roof, door: 8, sign, winX: [8, 48] });
  B.diner = client('#f8d6c0', '#d8553a', 'salad'); B.cafe = client('#e8d4f0', '#8a5ab0', 'cup'); B.school = client('#fdf0b8', '#e8a82a', 'leafy'); B.bakery = client('#f6d9a6', '#b8683a', 'bread');
  B.hotel = building(96, 64, { wall: '#e8e4f4', roof: '#4a4a8a', door: 12, sign: 'honey', winX: [10, 28, 60, 78] });
  B.mart = building(96, 64, { wall: '#d6f0f0', roof: '#2a9aa8', door: 16, doorColor: '#cfe8f0', sign: 'box', winX: [8, 22, 64, 80], slope: 0.25 });
  B.stall = (c1) => ol(48, 32, (x) => { rc(x, 2, 14, 44, 16, '#a0703a'); rc(x, 2, 14, 44, 2, '#c08a4a'); for (let i = 0; i < 6; i++) rc(x, 0 + i * 8, 0, 8, 10, i % 2 ? '#fdfdfd' : c1); for (let i = 0; i < 6; i++) rc(x, i * 8, 10, 8, 2, i % 2 ? '#e6e6e6' : shade(c1, 0.85)); rc(x, 4, 8, 2, 8, '#7a4a24'); rc(x, 42, 8, 2, 8, '#7a4a24'); for (const [a, b, c] of [[8, 16, '#e0443a'], [16, 16, '#f28c28'], [24, 16, '#74cf58'], [32, 16, '#f5d442'], [38, 16, '#e5486a']]) rc(x, a, b, 5, 4, c); });
  B.well = ol(16, 20, (x) => { rc(x, 2, 8, 12, 10, '#8a8f98'); rc(x, 3, 9, 10, 2, '#a6abb4'); rc(x, 4, 12, 8, 5, '#2a6aa8'); rc(x, 2, 2, 2, 8, '#7a4a24'); rc(x, 12, 2, 2, 8, '#7a4a24'); rc(x, 1, 0, 14, 3, '#c7473a'); rc(x, 7, 3, 2, 5, '#c9a066'); });
  B.board = ol(24, 24, (x) => { rc(x, 2, 2, 20, 14, '#a0703a'); rc(x, 3, 3, 18, 12, '#e8d6b0'); rc(x, 4, 5, 6, 3, '#e0443a'); rc(x, 12, 5, 7, 2, '#4a6aa8'); rc(x, 5, 10, 12, 1, '#7a6a48'); rc(x, 5, 12, 8, 1, '#7a6a48'); rc(x, 4, 16, 3, 7, '#7a4a24'); rc(x, 17, 16, 3, 7, '#7a4a24'); });
  B.tree = ol(32, 40, (x) => { rc(x, 13, 26, 6, 12, '#7a4a24'); rc(x, 12, 36, 8, 2, '#6a3e1e'); const g = ['#3f8f3a', '#4fa645', '#5fb85a']; rc(x, 4, 8, 24, 20, g[0]); rc(x, 8, 3, 16, 10, g[0]); rc(x, 6, 10, 20, 16, g[1]); rc(x, 10, 5, 12, 8, g[1]); rc(x, 9, 7, 6, 4, g[2]); rc(x, 14, 14, 7, 5, g[2]); rc(x, 8, 18, 5, 3, g[2]); });
  B.bush = ol(16, 16, (x) => { rc(x, 2, 6, 12, 8, '#3f8f3a'); rc(x, 4, 4, 8, 4, '#4fa645'); rc(x, 5, 6, 3, 2, '#5fb85a'); px(x, 10, 9, '#e8573d'); px(x, 5, 11, '#e8573d'); });
  B.rock = ol(16, 16, (x) => { rc(x, 3, 8, 10, 6, '#9aa0a8'); rc(x, 5, 6, 6, 3, '#aeb4bc'); rc(x, 4, 9, 3, 2, '#c4cad2'); });
  B.fenceH = mk(16, 16, (x) => { rc(x, 0, 6, 16, 2, '#b07a3a'); rc(x, 0, 10, 16, 2, '#b07a3a'); rc(x, 0, 8, 16, 1, '#7a4f26'); rc(x, 0, 12, 16, 1, '#7a4f26'); });
  B.fenceP = mk(16, 16, (x) => { rc(x, 6, 3, 4, 12, '#9a6a36'); rc(x, 6, 3, 4, 1, '#c08a4a'); rc(x, 9, 4, 1, 11, '#7a4f26'); });
  B.fenceV = mk(16, 16, (x) => { rc(x, 6, 0, 4, 16, '#9a6a36'); rc(x, 9, 0, 1, 16, '#7a4f26'); rc(x, 6, 0, 1, 16, '#b07a3a'); });
  B.trough = ol(16, 10, (x) => { rc(x, 1, 3, 14, 5, '#8a5a2a'); rc(x, 2, 4, 12, 2, '#c9a066'); });
  B.shed = (roof, wall) => ol(48, 40, (x) => { rc(x, 2, 16, 44, 22, wall); for (let i = 2; i < 46; i += 5) rc(x, i, 16, 1, 22, shade(wall, 0.86)); for (let r = 0; r < 16; r++) { const inset = Math.round((15 - r) * 0.5); rc(x, inset, r, 48 - inset * 2, 1, r % 3 === 2 ? shade(roof, 0.8) : roof); } rc(x, 18, 24, 12, 14, '#5a3a22'); rc(x, 19, 25, 10, 12, '#7a4a24'); });
  B.pond = mk(64, 48, (x) => { for (let Y = 0; Y < 48; Y++) for (let X = 0; X < 64; X++) { const dx = (X - 32) / 30, dy = (Y - 24) / 22; const d = dx * dx + dy * dy; if (d < 1) { x.fillStyle = d > 0.82 ? '#3a8ac8' : '#4aa3df'; x.fillRect(X, Y, 1, 1); if (d < 0.8 && ((X + Y * 3) % 11 === 0)) { x.fillStyle = '#7fcaf5'; x.fillRect(X, Y, 3, 1); } } else if (d < 1.12) { x.fillStyle = '#b8a070'; x.fillRect(X, Y, 1, 1); } } });
  return B;
}

// ---------- 설비(32x32) ----------
export function machineSprite(id) {
  return ol(32, 32, (x) => {
    const base = (c) => { rc(x, 2, 14, 28, 16, c); rc(x, 2, 14, 28, 2, shade(c, 1.2)); rc(x, 2, 28, 28, 2, shade(c, 0.75)); };
    switch (id) {
      case 'mill': base('#c9a066'); rc(x, 6, 2, 20, 12, '#e8d6b0'); rc(x, 4, 0, 24, 4, '#a0703a'); rc(x, 12, 18, 8, 8, '#7a4a24'); for (let i = 0; i < 4; i++) rc(x, 26, 4 + i * 2, 5, 1, '#fff'); break;
      case 'salad': base('#7cc060'); rc(x, 5, 6, 22, 8, '#fdfdfd'); rc(x, 7, 4, 4, 3, '#e0443a'); rc(x, 14, 5, 5, 3, '#f28c28'); rc(x, 21, 4, 4, 3, '#74cf58'); rc(x, 12, 19, 8, 6, '#4a8a3a'); break;
      case 'oven': base('#b04a3a'); rc(x, 5, 16, 22, 12, '#4a3a30'); rc(x, 7, 18, 18, 8, '#f09a3a'); rc(x, 9, 20, 14, 4, '#ffd27a'); rc(x, 8, 4, 16, 10, '#7a3a2a'); rc(x, 13, 0, 6, 5, '#7a7a82'); break;
      case 'dairy': base('#8ab4d8'); rc(x, 6, 4, 20, 12, '#d8e8f4'); rc(x, 8, 6, 16, 8, '#fdfdfd'); rc(x, 12, 8, 8, 4, '#6fb3e8'); rc(x, 12, 20, 8, 6, '#2a6aa8'); break;
      case 'jam': base('#c8586a'); rc(x, 8, 4, 16, 12, '#d8a050'); rc(x, 10, 6, 12, 4, '#7a1a3a'); rc(x, 6, 2, 20, 3, '#a0703a'); rc(x, 12, 20, 8, 6, '#6a2a3a'); break;
      case 'press': base('#e0b040'); rc(x, 14, 0, 4, 14, '#7a7a82'); rc(x, 8, 2, 16, 3, '#9a9aa2'); rc(x, 8, 10, 16, 5, '#f2c200'); rc(x, 12, 20, 8, 6, '#a07a20'); break;
      case 'juice': base('#e87a3a'); rc(x, 8, 2, 16, 14, '#f4e8d0'); rc(x, 10, 4, 12, 8, '#7a4bb0'); rc(x, 8, 2, 16, 2, '#fdfdfd'); rc(x, 12, 20, 8, 6, '#c0502a'); break;
      case 'kitchen': base('#9aa0a8'); rc(x, 4, 4, 10, 10, '#4a4a52'); rc(x, 18, 4, 10, 10, '#e8402f'); rc(x, 6, 2, 6, 3, '#c0c0c8'); rc(x, 12, 20, 8, 6, '#6a6a72'); break;
      case 'loom': base('#9a6a3a'); rc(x, 3, 2, 3, 14, '#7a4a24'); rc(x, 26, 2, 3, 14, '#7a4a24'); rc(x, 3, 2, 26, 3, '#7a4a24'); for (let X = 8; X < 26; X += 3) rc(x, X, 5, 1, 11, '#e86a8a'); rc(x, 12, 20, 8, 6, '#6a4a2a'); break;
      default: base('#aaa');
    }
  });
}
export function emptySlot() { return mk(32, 32, (x) => { rc(x, 2, 14, 28, 16, 'rgba(0,0,0,0.12)'); for (let i = 2; i < 30; i += 4) { rc(x, i, 14, 2, 1, 'rgba(255,255,255,0.4)'); rc(x, i, 29, 2, 1, 'rgba(255,255,255,0.4)'); } for (let i = 14; i < 30; i += 4) { rc(x, 2, i, 1, 2, 'rgba(255,255,255,0.4)'); rc(x, 29, i, 1, 2, 'rgba(255,255,255,0.4)'); } rc(x, 14, 20, 4, 1, 'rgba(255,255,255,0.7)'); rc(x, 15, 19, 2, 3, 'rgba(255,255,255,0.7)'); }); }

// ---------- 말풍선 아이콘 ----------
export function dropIcon() { return ol(8, 8, (x) => { rc(x, 3, 0, 2, 2, '#5ab4f0'); rc(x, 2, 2, 4, 3, '#5ab4f0'); rc(x, 1, 4, 6, 3, '#4aa3df'); px(x, 3, 4, '#bfe6ff'); }); }
export function sparkIcon() { return mk(8, 8, (x) => { rc(x, 3, 0, 2, 8, '#fff6a8'); rc(x, 0, 3, 8, 2, '#fff6a8'); rc(x, 3, 3, 2, 2, '#fff'); }); }
export function heartIcon() { return ol(8, 8, (x) => { rc(x, 1, 1, 2, 2, '#ff6a8a'); rc(x, 5, 1, 2, 2, '#ff6a8a'); rc(x, 0, 2, 8, 2, '#ff6a8a'); rc(x, 1, 4, 6, 1, '#ff6a8a'); rc(x, 2, 5, 4, 1, '#ff6a8a'); rc(x, 3, 6, 2, 1, '#ff6a8a'); }); }
