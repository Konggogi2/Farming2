// 세계 지도: 농장과 마을의 배치, 부딪히는 곳, 상호작용 지점을 정해요. 좌표는 타일(16px) 단위로 적고, 계산은 픽셀로 해요.
import { TS, hash } from './art.js';
export const W = 74, H = 40;
export const PLOT_X = 5, PLOT_Y = 16, PLOT_COLS = 9;
export const MACHINE_ORDER = ['mill', 'salad', 'oven', 'dairy', 'jam', 'press', 'juice', 'kitchen', 'loom'];
export const PENS = {
  coop:  { x: 17, y: 15, w: 6, h: 5 }, pond:  { x: 24, y: 15, w: 7, h: 5 },
  cow:   { x: 3,  y: 22, w: 8, h: 6 }, goat:  { x: 12, y: 22, w: 7, h: 6 }, hive: { x: 20, y: 22, w: 6, h: 6 }, sheep: { x: 27, y: 22, w: 7, h: 6 },
};
const SHOP_Y = 16, CLI_Y = 24;
export const BUILD = [
  { id: 'home', spr: 'house', x: 4, y: 3, w: 6, h: 5, label: '내 집', hint: '쉬기·먹기·잠자기' },
  { id: 'barn', spr: 'barn', x: 12, y: 3, w: 5, h: 5, label: '창고', hint: '물건 맡기기·꺼내기' },
  { id: 'seedshop', spr: 'seedshop', x: 39, y: SHOP_Y, w: 4, h: 4, label: '종묘상', hint: '사료·상자·작물 정보' },
  { id: 'equip', spr: 'equip', x: 45, y: SHOP_Y, w: 4, h: 4, label: '장비상', hint: '밭·설비·기계' },
  { id: 'hr', spr: 'hr', x: 51, y: SHOP_Y, w: 4, h: 4, label: '직원 소개소', hint: '직원 고용' },
  { id: 'clinic', spr: 'clinic', x: 57, y: SHOP_Y, w: 4, h: 4, label: '병원', hint: '몸살 치료' },
  { id: 'diner', spr: 'diner', x: 39, y: CLI_Y, w: 4, h: 4, label: '초록 식당', client: 'diner' },
  { id: 'cafe', spr: 'cafe', x: 45, y: CLI_Y, w: 4, h: 4, label: '달달 카페', client: 'cafe' },
  { id: 'school', spr: 'school', x: 51, y: CLI_Y, w: 4, h: 4, label: '햇살 학교 급식', client: 'school' },
  { id: 'bakery', spr: 'bakery', x: 57, y: CLI_Y, w: 4, h: 4, label: '바삭 빵집', client: 'bakery' },
  { id: 'hotel', spr: 'hotel', x: 63, y: CLI_Y, w: 6, h: 4, label: '그랜드 호텔', client: 'hotel' },
  { id: 'mart', spr: 'mart', x: 61, y: 8, w: 6, h: 4, label: '해피 마트', hint: '정기 납품' },
];

export function buildWorld(art) {
  const solid = new Uint8Array(W * H); const mark = (x, y, w = 1, h = 1) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) solid[j * W + i] = 1; };
  const ground = document.createElement('canvas'); ground.width = W * TS; ground.height = H * TS; const g = ground.getContext('2d'); g.imageSmoothingEnabled = false;
  // 풀밭
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const r = hash(x, y); const v = r < 0.06 ? 3 : r < 0.4 ? 1 : r < 0.7 ? 2 : 0; g.drawImage(art.tiles.grass[v], x * TS, y * TS); }
  // 길
  const path = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g.drawImage(art.tiles.path[hash(i + 9, j + 4) < 0.5 ? 0 : 1], i * TS, j * TS); };
  path(1, 13, 72, 2); path(37, 20, 33, 2); path(36, 3, 2, 24); path(6, 8, 2, 5); path(13, 8, 2, 5); path(40, 12, 2, 4); path(46, 12, 2, 4); path(52, 12, 2, 4); path(58, 12, 2, 4);
  for (const x of [40, 46, 52, 58]) path(x, 20, 2, 4);
  path(64, 12, 2, 12); path(3, 20, 1, 1);
  // 밭 가장자리 땅
  for (let j = PLOT_Y - 1; j <= PLOT_Y + 4; j++) for (let i = PLOT_X - 1; i <= PLOT_X + PLOT_COLS; i++) g.drawImage(art.tiles.path[1], i * TS, j * TS);
  // 울타리(우리)
  const fence = (pen, gate = true) => { const { x, y, w, h } = pen; for (let i = x; i < x + w; i++) { const gap = gate && (i === x + Math.floor(w / 2) || i === x + Math.floor(w / 2) - 1); g.drawImage(art.b.fenceH, i * TS, y * TS); mark(i, y); if (!gap) { g.drawImage(art.b.fenceH, i * TS, (y + h - 1) * TS); mark(i, y + h - 1); } else { g.drawImage(art.b.fenceP, i * TS, (y + h - 1) * TS); } } for (let j = y + 1; j < y + h - 1; j++) { g.drawImage(art.b.fenceV, x * TS, j * TS); g.drawImage(art.b.fenceV, (x + w - 1) * TS, j * TS); mark(x, j); mark(x + w - 1, j); } };
  const pens = {};
  for (const [id, p] of Object.entries(PENS)) { fence(p); pens[id] = { ...p, gx: (p.x + p.w / 2) * TS, gy: (p.y + p.h) * TS + 6 }; }
  // 연못(오리)
  g.drawImage(art.b.pond, (PENS.pond.x + 3) * TS - 8, (PENS.pond.y + 1) * TS + 4);
  // 건물과 꾸밈은 y 순서대로 그려야 해서 따로 모아 둬요.
  const deco = []; const objects = []; const clients = [];
  const place = (img, px, py, baseY) => deco.push({ img, x: px, y: py, by: baseY == null ? py + img.height : baseY });
  for (const b of BUILD) {
    const img = art.b[b.spr]; const px = b.x * TS, py = (b.y + b.h) * TS - img.height; place(img, px, py);
    mark(b.x, b.y + 1, b.w, b.h - 1);
    const o = { id: b.id, kind: b.client ? 'client' : b.id, label: b.label, hint: b.hint || '거래처', ix: (b.x + b.w / 2) * TS, iy: (b.y + b.h) * TS + 6, r: 26, client: b.client || null };
    objects.push(o); if (b.client) clients.push(o);
  }
  // 우물
  place(art.b.well, 2 * TS, 9 * TS - 4); mark(2, 9); objects.push({ id: 'well', kind: 'well', label: '우물', hint: '물뿌리개 채우기', ix: 2 * TS + 8, iy: 10 * TS + 6, r: 24 });
  // 게시판
  place(art.b.board, 38 * TS, 5 * TS); mark(38, 6); objects.push({ id: 'board', kind: 'board', label: '마을 게시판', hint: '순위·소식', ix: 38 * TS + 12, iy: 7 * TS + 6, r: 26 });
  // 시장 가판대
  [41, 46, 51].forEach((x, i) => { place(art.b.stall(['#e0443a', '#4a8ad0', '#3fa84a'][i]), x * TS, 8 * TS + 8 + 16, null); mark(x, 9, 3, 1); });
  objects.push({ id: 'market', kind: 'market', label: '시장', hint: '물건 팔기', ix: 47.5 * TS, iy: 10 * TS + 14, r: 44 });
  // 설비 자리
  const machines = MACHINE_ORDER.map((id, i) => { const x = 4 + i * 3; mark(x, 12, 2, 1); const o = { id, kind: 'machine', x: x * TS, y: 11 * TS - 4, ix: (x + 1) * TS, iy: 13 * TS + 2, r: 24, label: '', hint: '' }; objects.push(o); return o; });
  // 사육장 상호작용 지점과 헛간 그림
  for (const [id, p] of Object.entries(pens)) { objects.push({ id, kind: 'house', label: '', hint: '', ix: p.gx, iy: p.gy, r: 30 }); }
  // 나무와 바위
  const trees = []; const addTree = (x, y) => { if (x < 0 || y < 0 || x >= W - 1 || y >= H) return; place(art.b.tree, x * TS - 8, (y + 1) * TS - 40 + 8, null); mark(x, y); trees.push([x, y]); };
  for (let x = 0; x < W; x += 2) { addTree(x, 0); addTree(x + (x % 4 ? 0 : 1), H - 1); addTree(x, H - 3 + (x % 3)); }
  for (let y = 2; y < H - 3; y += 3) { addTree(0, y); addTree(W - 2, y); }
  [[1, 5], [1, 17], [1, 19], [35, 6], [35, 28], [34, 33], [36, 36], [70, 14], [71, 20], [69, 31], [8, 31], [20, 33], [27, 31], [47, 33], [57, 33], [63, 32], [3, 13]].forEach(([x, y]) => addTree(x, y));
  [[11, 9], [30, 12], [36, 21], [60, 6], [19, 29], [34, 30]].forEach(([x, y]) => { place(art.b.bush, x * TS, y * TS, null); mark(x, y); });
  [[9, 30], [53, 29], [68, 17]].forEach(([x, y]) => { place(art.b.rock, x * TS, y * TS, null); mark(x, y); });
  // 외곽 벽
  for (let x = 0; x < W; x++) { mark(x, 0); mark(x, H - 1); } for (let y = 0; y < H; y++) { mark(0, y); mark(W - 1, y); }
  deco.sort((a, b) => a.by - b.by);
  // 밭
  const plots = Array.from({ length: 36 }, (_, i) => ({ i, tx: PLOT_X + (i % PLOT_COLS), ty: PLOT_Y + Math.floor(i / PLOT_COLS) }));
  return { ground, solid, deco, objects, clients, plots, pens, machines, W, H };
}
export const isSolid = (w, x, y) => { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true; return !!w.solid[ty * W + tx]; };
// 발 위치(px, py)에서 상자 모양 충돌 검사
export function blocked(w, px, py) { const r = 5; return isSolid(w, px - r, py - 2) || isSolid(w, px + r, py - 2) || isSolid(w, px - r, py + 3) || isSolid(w, px + r, py + 3); }
