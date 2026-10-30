// 농장 시뮬레이션 엔진: 화면과 상관없이 돌아가는 순수 로직. 사람(UI)과 테스트용 봇이 같은 함수를 써요.
import * as D from './data.js';
const { CROPS, ITEMS, HOUSES, MACHINES, RECIPES, UPGRADES, WORKERS, CLIENTS, DAY } = D;

// ---------- 난수 ----------
export function rnd(s) { s.rs = (s.rs + 0x6d2b79f5) | 0; let t = Math.imul(s.rs ^ (s.rs >>> 15), 1 | s.rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const pick = (s, a) => a[Math.floor(rnd(s) * a.length)];
const R = (x, d = 0) => { const p = Math.pow(10, d); return Math.round(x * p) / p; };

// ---------- 새 게임 ----------
export function newGame({ diff = 'normal', perk = null, seed = Date.now() & 0x7fffffff } = {}) {
  const df = D.DIFFS[diff] || D.DIFFS.normal;
  const s = {
    v: 1, rs: seed | 0, diff, TL: df.tl, t: 0, day: 1, perk,
    gold: 500 + (perk === 'cash' ? 800 : 0), revenue: 0, level: 0, spent: 0,
    p: { stamina: 100, fatigue: 0, sick: 0, resting: false, maxSt: 100 + (perk === 'strong' ? 30 : 0), water: 6 },
    inv: { pack: {}, store: {} }, known: { lettuce: 1, carrot: 1 },
    plots: Array.from({ length: 36 }, (_, i) => ({ u: i < 6, crop: null, prog: 0, w: 0 })),
    plotPack: 0,
    houses: {}, machines: {}, workers: {}, up: {}, auto: { crops: [], },
    mart: { found: false, quota: {}, done: {}, sat: 0 },
    clients: CLIENTS.map((c) => ({ id: c.id, found: false, trust: 0, order: null, next: 0 })),
    online: { rating: 3, orders: [], ship: [], adsUntil: 0, id: 1 },
    market: { idx: {}, trends: [] }, consign: {},
    weather: 'sun', rivals: [], log: [], stats: { market: 0, contract: 0, mart: 0, online: 0, consign: 0, spentSeed: 0, wages: 0 },
    ended: null, nextTick: 5, nextSpoil: 10, slack: 1, acc: { farm: 0, ranch: 0, art: 0, drv: 0, onl: 0, feeder: 0, milker: 0, combine: 0 },
  };
  s.p.stamina = s.p.maxSt;
  for (const id of Object.keys(ITEMS)) s.market.idx[id] = 1;
  if (perk === 'network') { s.clients[0].found = true; s.clients[1].found = true; }
  // 라이벌: 이번 판에 나올 3~4곳을 무작위로 정하고 힘과 성장 방식을 달리 해요
  const pool = D.RIVALS.slice(); const n = 3 + (rnd(s) < 0.5 ? 1 : 0); const chosen = [];
  while (chosen.length < n) chosen.push(pool.splice(Math.floor(rnd(s) * pool.length), 1)[0]);
  s.rivals = chosen.map((r) => { const str = 0.8 + rnd(s) * 0.4; return { id: r.id, name: r.name, kind: r.kind, icon: r.icon, rev: 0, R0: Math.round(2500 + rnd(s) * 3500), F: RIVAL_F * df.rival * str, k: 0.85 + rnd(s) * 0.5, last: 0 }; });
  s.rivals.forEach((r) => { r.rev = r.R0; });
  addLog(s, '농장 경영을 시작했어요! 라이벌보다 먼저 매출 1위를 달성하세요.');
  return s;
}
export const RIVAL_F = 85000;       // 라이벌 마지막 날 기준 매출(보통 난이도). tools/balance.mjs로 조정해요.

export const addLog = (s, text) => { s.log.push({ t: s.t, text }); if (s.log.length > 40) s.log.shift(); };

// ---------- 인벤토리(묶음별 신선도) ----------
const poolOf = (s, name) => s.inv[name];
export const cap = (s, name) => (name === 'pack' ? UPGRADES.pack.steps[s.up.pack | 0].v : UPGRADES.store.steps[s.up.store | 0].v);
export const count = (s, name, item) => { const l = poolOf(s, name)[item]; if (!l) return 0; let n = 0; for (const x of l) n += x[0]; return n; };
export const total = (s, name) => { let n = 0; for (const it in poolOf(s, name)) n += count(s, name, it); return n; };
export const space = (s, name) => Math.max(0, cap(s, name) - total(s, name));
export const shelfOf = (s, name, item) => ITEMS[item].shelf * (name === 'store' && (s.up.cold | 0) ? 2 : 1);
export function add(s, name, item, qty, born = s.t) {
  const q = Math.min(qty, space(s, name)); if (q <= 0) return 0;
  const p = poolOf(s, name); const l = p[item] || (p[item] = []);
  const last = l[l.length - 1];
  if (last && Math.abs(last[1] - born) < 8) { last[1] = (last[1] * last[0] + born * q) / (last[0] + q); last[0] += q; } else l.push([q, born]);
  s.known[item] = 1; return q;
}
export function take(s, name, item, qty) {
  const l = poolOf(s, name)[item]; if (!l) return []; const out = []; let need = qty;
  while (need > 0 && l.length) { const x = l[0]; const g = Math.min(need, x[0]); out.push([g, x[1]]); x[0] -= g; need -= g; if (x[0] <= 1e-9) l.shift(); }
  if (!l.length) delete poolOf(s, name)[item];
  return out;
}
export const fresh = (s, name, item, born) => Math.max(0, 1 - (s.t - born) / shelfOf(s, name, item));
export function avgFresh(s, name, item) { const l = poolOf(s, name)[item]; if (!l) return 0; let n = 0, f = 0; for (const x of l) { n += x[0]; f += x[0] * fresh(s, name, item, x[1]); } return n ? f / n : 0; }
// 여러 곳에서 모으기: store 먼저
export const have = (s, item, pools = ['store', 'pack']) => pools.reduce((a, p) => a + count(s, p, item), 0);
export function takeAny(s, item, qty, pools = ['store', 'pack']) { let need = qty; const got = []; for (const p of pools) { if (need <= 0) break; const g = take(s, p, item, Math.min(need, count(s, p, item))); for (const x of g) { need -= x[0]; got.push({ pool: p, q: x[0], born: x[1] }); } } return got; }

// ---------- 가격 ----------
export const catMult = (s, cat) => (s.perk === 'dairy' && cat === 'dairy' ? 1.12 : s.perk === 'baker' && cat === 'bakery' ? 1.12 : 1);
export const unitPrice = (s, item) => ITEMS[item].price * s.market.idx[item] * catMult(s, ITEMS[item].cat);
export const freshMult = (f) => 0.4 + 0.6 * f;

// ---------- 레벨/체력 ----------
const checkLevel = (s) => { const l = D.levelOf(s.revenue); if (l > s.level) { s.level = l; addLog(s, `농장 레벨이 ${l}이(가) 되었어요! 새 물건이 가게에 들어왔어요.`); } };
export function earn(s, amount, channel) {
  if (amount <= 0) return; s.gold += amount; s.revenue += amount; s.stats[channel] = (s.stats[channel] || 0) + amount; checkLevel(s); checkWin(s);
}
export const spend = (s, amount) => { if (s.gold < amount) return false; s.gold -= amount; s.spent += amount; return true; };

// 행동 하나에 드는 체력. 체력이 바닥인데도 무리해서 하면 피로가 쌓이고 몸살이 날 수 있어요.
export function work(s, cost = 2) {
  const p = s.p;
  if (p.sick > 0) return { ok: false, msg: '몸살이 나서 일할 수 없어요. 병원에 가거나 쉬세요.' };
  if (p.stamina >= cost) { p.stamina -= cost; if (p.stamina < 15) p.fatigue += 3; }
  else { p.stamina = 0; p.fatigue += 7; }
  if (p.fatigue >= 100) { p.fatigue = 100; p.sick = 60; p.resting = false; addLog(s, '무리해서 몸살이 났어요! 쉬거나 병원에 가세요.'); return { ok: true, sick: true, msg: '몸살이 났어요!' }; }
  return { ok: true, warn: p.stamina <= 0 ? '체력이 바닥이에요. 무리하면 몸살이 나요!' : null };
}
export const canWork = (s) => s.p.sick <= 0;

// ---------- 밭 ----------
function thirsty(s, i) { const p = s.plots[i]; if (!p.u || !p.crop) return false; const c = CROPS[p.crop]; return p.w < c.water && p.prog >= p.w * (c.grow / c.water) - 1e-9 && p.prog < c.grow; }
const isReady = (s, i) => { const p = s.plots[i]; return p.u && p.crop && p.prog >= CROPS[p.crop].grow - 1e-9; };
export const plotKind = (s, i) => { const p = s.plots[i]; if (!p.u) return 'locked'; if (!p.crop) return 'empty'; if (isReady(s, i)) return 'ready'; if (thirsty(s, i)) return 'thirsty'; return 'growing'; };
export function plant(s, i, crop, by = 'player') {
  const p = s.plots[i]; const c = CROPS[crop];
  if (!p || !p.u || p.crop) return { ok: false, msg: '여기엔 심을 수 없어요.' };
  if (c.lv > s.level) return { ok: false, msg: `농장 레벨 ${c.lv}이(가) 되면 심을 수 있어요.` };
  if (s.gold < c.seed) return { ok: false, msg: '씨앗값이 모자라요.' };
  if (by === 'player') { const w = work(s); if (!w.ok) return w; }
  s.gold -= c.seed; s.spent += c.seed; s.stats.spentSeed += c.seed; p.crop = crop; p.prog = 0; p.w = 0; return { ok: true, msg: `${c.name} 심기` };
}
export function water(s, i, by = 'player') {
  if (!thirsty(s, i)) return { ok: false, msg: '물이 필요하지 않아요.' };
  if (by === 'player') { if (s.p.water <= 0) return { ok: false, msg: '물이 없어요. 우물에서 채우세요.' }; const w = work(s); if (!w.ok) return w; s.p.water -= 1; }
  s.plots[i].w += 1; return { ok: true, msg: '물 주기' };
}
export function harvest(s, i, to = 'pack', by = 'player') {
  if (!isReady(s, i)) return { ok: false, msg: '아직 다 자라지 않았어요.' };
  const p = s.plots[i]; const c = CROPS[p.crop];
  let y = c.yield; if (s.perk === 'harvest' && rnd(s) < 0.15) y += 1; else if (s.perk === 'harvest' && c.yield >= 4 && rnd(s) < 0.15) y += 1;
  if (space(s, to) < 1) return { ok: false, msg: to === 'pack' ? '배낭이 가득 찼어요. 창고에 맡기세요.' : '창고가 가득 찼어요.' };
  if (by === 'player') { const w = work(s); if (!w.ok) return w; }
  const crop = p.crop; const got = add(s, to, crop, y); p.crop = null; p.prog = 0; p.w = 0; return { ok: true, msg: `${c.name} +${got}`, item: crop };
}
export function refill(s) { s.p.water = UPGRADES.can.steps[s.up.can | 0].v; return { ok: true, msg: '물을 가득 채웠어요.' }; }

// ---------- 동물 ----------
const houseDef = (id) => HOUSES[id];
export const houseCap = (h) => (h.lvl >= 2 ? 8 : 4);
export const feedCap = (h) => h.animals * 3;
export function buildHouse(s, id) {
  const d = houseDef(id); if (s.houses[id]) return { ok: false, msg: '이미 있어요.' };
  if (d.lv > s.level) return { ok: false, msg: `레벨 ${d.lv}에 열려요.` };
  if (!spend(s, d.build)) return { ok: false, msg: '돈이 모자라요.' };
  s.houses[id] = { animals: 0, feed: 0, prod: 0, prog: 0, lvl: 1 }; return { ok: true, msg: `${d.name} 완성!` };
}
export function upgradeHouse(s, id) { const h = s.houses[id]; if (!h || h.lvl >= 2) return { ok: false, msg: '더 넓힐 수 없어요.' }; const c = Math.round(houseDef(id).build * 1.2); if (!spend(s, c)) return { ok: false, msg: '돈이 모자라요.' }; h.lvl = 2; return { ok: true, msg: `${houseDef(id).name}을(를) 넓혔어요.` }; }
export const animalCost = (s, id) => Math.round(houseDef(id).animalCost * (s.perk === 'dairy' && id === 'cow' ? 0.8 : 1));
export function buyAnimal(s, id) {
  const h = s.houses[id]; if (!h) return { ok: false, msg: '먼저 집을 지어야 해요.' };
  if (h.animals >= houseCap(h)) return { ok: false, msg: '자리가 없어요. 집을 넓혀 보세요.' };
  if (!spend(s, animalCost(s, id))) return { ok: false, msg: '돈이 모자라요.' }; h.animals++; return { ok: true, msg: `${houseDef(id).animal} 식구가 늘었어요!` };
}
export function feedHouse(s, id, by = 'player') {
  const h = s.houses[id]; if (!h || !h.animals) return { ok: false, msg: '동물이 없어요.' };
  const need = feedCap(h) - h.feed; if (need <= 0) return { ok: false, msg: '먹이가 가득해요.' };
  const q = Math.min(need, count(s, 'pack', 'feed')); if (q <= 0) return { ok: false, msg: '사료가 없어요. 종묘상에서 사세요.' };
  if (by === 'player') { const w = work(s); if (!w.ok) return w; }
  take(s, 'pack', 'feed', q); h.feed += q; return { ok: true, msg: '먹이 주기' };
}
export function collectHouse(s, id, to = 'pack', by = 'player') {
  const h = s.houses[id]; if (!h || h.prod < 1) return { ok: false, msg: '아직 없어요.' };
  const d = houseDef(id); const q = Math.min(Math.floor(h.prod), space(s, to)); if (q <= 0) return { ok: false, msg: to === 'pack' ? '배낭이 가득 찼어요.' : '창고가 가득 찼어요.' };
  if (by === 'player') { const w = work(s); if (!w.ok) return w; }
  add(s, to, d.prod, q); h.prod -= q; return { ok: true, msg: `${ITEMS[d.prod].name} +${q}` };
}

// ---------- 가공 ----------
export const machineCost = (s, id) => Math.round(MACHINES[id].cost * (s.perk === 'baker' && id === 'oven' ? 0.75 : 1) * (s.perk === 'thrift' ? 0.9 : 1));
export function buyMachine(s, id) {
  const d = MACHINES[id]; if (s.machines[id]) return { ok: false, msg: '이미 있어요.' };
  if (d.lv > s.level) return { ok: false, msg: `레벨 ${d.lv}에 열려요.` };
  if (!spend(s, machineCost(s, id))) return { ok: false, msg: '돈이 모자라요.' };
  s.machines[id] = { lvl: 0, job: null, out: null, auto: null }; return { ok: true, msg: `${d.name} 설치!` };
}
export function upgradeMachine(s, id) { const m = s.machines[id]; if (!m || m.lvl >= 2) return { ok: false, msg: '더 키울 수 없어요.' }; const c = Math.round(machineCost(s, id) * (m.lvl === 0 ? 0.9 : 1.6)); if (!spend(s, c)) return { ok: false, msg: '돈이 모자라요.' }; m.lvl++; return { ok: true, msg: `${MACHINES[id].name} 용량 증가! (x${D.BATCH[m.lvl]})` }; }
export const upgradeMachineCost = (s, id) => { const m = s.machines[id]; return m.lvl >= 2 ? null : Math.round(machineCost(s, id) * (m.lvl === 0 ? 0.9 : 1.6)); };
export const batchOf = (m) => D.BATCH[m.lvl];
export function canCraft(s, id, rid, pools = ['store', 'pack']) { const m = s.machines[id]; const r = RECIPES[rid]; if (!m || m.job || m.out || !r || r.m !== id) return false; const b = batchOf(m); for (const [it, q] of Object.entries(r.in)) if (have(s, it, pools) < q * b) return false; return true; }
export function startCraft(s, id, rid, pools = ['store', 'pack'], by = 'player') {
  const m = s.machines[id]; const r = RECIPES[rid]; if (!m) return { ok: false, msg: '설비가 없어요.' };
  if (m.job || m.out) return { ok: false, msg: '아직 작업 중이에요.' };
  if (!canCraft(s, id, rid, pools)) return { ok: false, msg: '재료가 모자라요.' };
  if (by === 'player') { const w = work(s); if (!w.ok) return w; }
  const b = batchOf(m); const frs = [];
  for (const [it, q] of Object.entries(r.in)) { const got = takeAny(s, it, q * b, pools); for (const x of got) frs.push(fresh(s, x.pool, it, x.born) * x.q); }
  const nIn = Object.values(r.in).reduce((a, b2) => a + b2, 0) * b; const f = Math.min(1, Math.max(0.3, frs.reduce((a, b2) => a + b2, 0) / nIn));
  m.job = { rid, left: r.time, f }; return { ok: true, msg: `${ITEMS[r.out[0]].name} 만들기 시작!` };
}
export function collectMachine(s, id, to = 'pack', by = 'player') {
  const m = s.machines[id]; if (!m || !m.out) return { ok: false, msg: '아직 없어요.' };
  const q = Math.min(m.out.q, space(s, to)); if (q <= 0) return { ok: false, msg: to === 'pack' ? '배낭이 가득 찼어요.' : '창고가 가득 찼어요.' };
  if (by === 'player') { const w = work(s); if (!w.ok) return w; }
  const born = s.t - (1 - m.out.f) * 0.15 * ITEMS[m.out.item].shelf; add(s, to, m.out.item, q, born); m.out.q -= q; const name = ITEMS[m.out.item].name; if (m.out.q <= 0) m.out = null; return { ok: true, msg: `${name} +${q}` };
}

// ---------- 창고/이동/먹기 ----------
export function moveAll(s, from, to, only = null) {
  let n = 0; for (const it of Object.keys(poolOf(s, from))) { if (only && !only.includes(it)) continue; const l = poolOf(s, from)[it].slice(); for (const x of l) { const q = Math.min(x[0], space(s, to)); if (q <= 0) break; add(s, to, it, q, x[1]); n += q; const got = take(s, from, it, q); void got; } }
  return n;
}
export function moveItem(s, from, to, item, qty) { let q = Math.min(qty, count(s, from, item), space(s, to)); if (q <= 0) return 0; const got = take(s, from, item, q); for (const x of got) add(s, to, item, x[0], x[1]); return q; }
export function eat(s, item, from = 'pack') {
  const e = ITEMS[item] && ITEMS[item].energy; if (!e) return { ok: false, msg: '먹을 수 없어요.' }; if (count(s, from, item) < 1) return { ok: false, msg: '없어요.' };
  if (s.p.stamina >= s.p.maxSt - 1) return { ok: false, msg: '배가 불러요! 체력이 가득해요.' };
  take(s, from, item, 1); s.p.stamina = Math.min(s.p.maxSt, s.p.stamina + e); return { ok: true, msg: `${ITEMS[item].name}을(를) 먹었어요. 체력 +${e}` };
}
export function sleep(s) {
  const tod = s.t % DAY; const rem = DAY - tod; advance(s, rem + 0.01, true);
  s.p.stamina = s.p.maxSt; s.p.fatigue = 0; s.p.sick = 0; s.p.resting = false; addLog(s, '푹 자고 일어났어요. 체력이 가득 찼어요!'); return { ok: true, msg: '새로운 아침이에요!' };
}
export function hospital(s) { if (s.p.sick <= 0 && s.p.fatigue < 30) return { ok: false, msg: '건강해요!' }; if (!spend(s, 80)) return { ok: false, msg: '진료비 80G가 모자라요.' }; s.p.sick = 0; s.p.fatigue = 0; s.p.stamina = Math.min(s.p.maxSt, s.p.stamina + 30); return { ok: true, msg: '푹 쉬고 치료받았어요.' }; }
export function setResting(s, v) { s.p.resting = !!v && s.p.sick <= 0; }

// ---------- 시장 판매 ----------
export function sellMarket(s, item, qty, from = 'pack', rate = 1, channel = 'market') {
  const it = ITEMS[item]; if (!it || it.noSell) return { ok: false, msg: '팔 수 없어요.' };
  const have0 = count(s, from, item); const q = Math.min(qty, have0); if (q <= 0) return { ok: false, msg: '없어요.' };
  const lots = take(s, from, item, q); let money = 0;
  for (const [n, born] of lots) { const f = fresh(s, from, item, born); for (let k = 0; k < n; k++) { money += unitPrice(s, item) * freshMult(f) * rate; s.market.idx[item] = Math.max(0.5, s.market.idx[item] * 0.988); } }
  money = Math.round(money); earn(s, money, channel); return { ok: true, msg: `${it.name} ${q}개 판매 +${money}G`, money, q };
}

// ---------- 업그레이드·직원 ----------
export const upLevel = (s, key) => s.up[key] | 0;
export const upNext = (s, key) => { const st = UPGRADES[key].steps; const l = upLevel(s, key); return l + 1 < st.length ? st[l + 1] : null; };
export const upCost = (s, key) => { const n = upNext(s, key); return n ? Math.round(n.cost * (s.perk === 'thrift' ? 0.9 : 1)) : null; };
export function buyUpgrade(s, key) {
  const n = upNext(s, key); if (!n) return { ok: false, msg: '최고 단계예요.' }; if (n.lv > s.level) return { ok: false, msg: `레벨 ${n.lv}에 열려요.` };
  if (!spend(s, upCost(s, key))) return { ok: false, msg: '돈이 모자라요.' }; s.up[key] = upLevel(s, key) + 1;
  if (key === 'can') s.p.water = UPGRADES.can.steps[s.up.can].v; return { ok: true, msg: `${UPGRADES[key].name} 완료!` };
}
export function buyPlots(s) { const n = D.PLOT_PACKS[s.plotPack + 1]; if (!n) return { ok: false, msg: '밭을 더 넓힐 수 없어요.' }; if (!spend(s, n.cost)) return { ok: false, msg: '돈이 모자라요.' }; s.plotPack++; s.plots.forEach((p, i) => { if (i < n.n) p.u = true; }); return { ok: true, msg: `밭이 ${n.n}칸이 되었어요!` }; }
export const nextPlots = (s) => D.PLOT_PACKS[s.plotPack + 1] || null;
export const wageOf = (s, id) => Math.round(WORKERS[id].wage * (s.perk === 'thrift' ? 0.75 : 1));
export function hire(s, id) {
  const d = WORKERS[id]; const n = s.workers[id] | 0; if (d.lv > s.level) return { ok: false, msg: `레벨 ${d.lv}에 열려요.` }; if (n >= d.max) return { ok: false, msg: '더 뽑을 수 없어요.' };
  if (id === 'driver' && !(s.up.truck | 0)) return { ok: false, msg: '먼저 트럭을 사야 해요.' };
  if (!spend(s, d.fee)) return { ok: false, msg: '고용비가 모자라요.' }; s.workers[id] = n + 1; return { ok: true, msg: `${d.name} 입사!` };
}
export function fire(s, id) { if (!(s.workers[id] | 0)) return { ok: false, msg: '없어요.' }; s.workers[id]--; return { ok: true, msg: '퇴사했어요.' }; }
export function buyItem(s, item, qty, to = 'pack') { const price = ITEMS[item].price * qty; const q = Math.min(qty, space(s, to)); if (q <= 0) return { ok: false, msg: '가득 찼어요.' }; if (!spend(s, ITEMS[item].price * q)) return { ok: false, msg: '돈이 모자라요.' }; add(s, to, item, q); void price; return { ok: true, msg: `${ITEMS[item].name} ${q}개 구입` }; }
export const wagesPerDay = (s) => Object.entries(s.workers).reduce((a, [id, n]) => a + wageOf(s, id) * n, 0);

// ---------- 거래처 ----------
export const clientDef = (id) => CLIENTS.find((c) => c.id === id);
export function discoverClient(s, id) {
  if (id === 'mart') { if (s.level < D.MART.lv) return { ok: false, msg: `레벨 ${D.MART.lv}이(가) 되면 거래할 수 있어요.` }; s.mart.found = true; return { ok: true, msg: '해피 마트와 거래를 시작했어요!' }; }
  const c = s.clients.find((x) => x.id === id); if (c.found) return { ok: true, msg: '이미 아는 곳이에요.' };
  const d = clientDef(id); if (d.minTrust > Math.max(0, ...s.clients.map((x) => x.trust))) return { ok: false, msg: '다른 거래처에서 신뢰를 먼저 쌓으면 소개받을 수 있어요.' };
  c.found = true; c.next = s.t; addLog(s, `${d.name}을(를) 거래처로 찾았어요!`); return { ok: true, msg: `${d.name}와 인사했어요! 곧 주문이 들어와요.` };
}
const salesBonus = (s) => 1 + 0.05 * (s.workers.sales | 0);
function makeOrder(s, cl) {
  const d = clientDef(cl.id); const kn = Object.keys(s.known).filter((it) => ITEMS[it] && !ITEMS[it].noSell && d.likes.includes(ITEMS[it].cat));
  if (!kn.length) return null;
  const lines = []; const n = rnd(s) < 0.4 ? 2 : 1; let reward = 0; const base = 3 + Math.floor(s.level * 1.1) + cl.trust;
  const items = []; for (let i = 0; i < n; i++) { const it = pick(s, kn); if (!items.includes(it)) items.push(it); }
  for (const it of items) { const q = Math.max(2, Math.round((base + rnd(s) * 3) * (ITEMS[it].price > 150 ? 0.45 : ITEMS[it].price > 60 ? 0.7 : 1))); lines.push([it, q]); reward += ITEMS[it].price * q; }
  reward = Math.round(reward * d.prem * (1 + 0.08 * cl.trust) * (s.perk === 'network' ? 1.1 : 1) * salesBonus(s));
  return { lines, reward, due: s.t + DAY * 2.2, minFresh: 0.5 };
}
export function orderReady(s, cl, pools) { if (!cl.order) return false; return cl.order.lines.every(([it, q]) => have(s, it, pools) >= q); }
export function deliverOrder(s, id, pools = ['pack'], feeRate = 0) {
  const cl = s.clients.find((x) => x.id === id); if (!cl || !cl.order) return { ok: false, msg: '주문이 없어요.' };
  if (!orderReady(s, cl, pools)) return { ok: false, msg: '물건이 모자라요.' };
  // 신선도 확인
  for (const [it, q] of cl.order.lines) { let ok = 0; for (const p of pools) { const l = poolOf(s, p)[it] || []; for (const x of l) if (fresh(s, p, it, x[1]) >= cl.order.minFresh) ok += x[0]; } if (ok < q) return { ok: false, msg: `${ITEMS[it].name}이(가) 너무 오래돼서 받을 수 없대요.` }; }
  for (const [it, q] of cl.order.lines) { let need = q; for (const p of pools) { const l = poolOf(s, p)[it] || []; for (let i = 0; i < l.length && need > 0;) { const x = l[i]; if (fresh(s, p, it, x[1]) < cl.order.minFresh) { i++; continue; } const g = Math.min(need, x[0]); x[0] -= g; need -= g; if (x[0] <= 1e-9) l.splice(i, 1); else i++; } if (!l.length) delete poolOf(s, p)[it]; } }
  const pay = Math.round(cl.order.reward * (1 - feeRate)); earn(s, pay, 'contract'); cl.trust++; cl.order = null; cl.next = s.t + DAY * 0.6; return { ok: true, msg: `납품 완료! +${pay}G (신뢰 ${cl.trust})`, money: pay };
}
export const martPrice = (s, item) => Math.round(ITEMS[item].price * D.MART.premium * (s.perk === 'network' ? 1.05 : 1) * catMult(s, ITEMS[item].cat));
export const martQuotaCap = (s) => 6 + 3 * s.level;
export function setMartQuota(s, item, q) { if (!s.mart.found) return { ok: false, msg: '마트와 거래를 먼저 시작하세요.' }; if (q <= 0) delete s.mart.quota[item]; else { if (Object.keys(s.mart.quota).length >= 4 && !s.mart.quota[item]) return { ok: false, msg: '납품 품목은 4개까지예요.' }; s.mart.quota[item] = Math.min(q, martQuotaCap(s)); } return { ok: true, msg: '납품 계획을 저장했어요.' }; }
export function martDeliver(s, item, from = 'pack') { const left = (s.mart.quota[item] || 0) - (s.mart.done[item] || 0); if (left <= 0) return { ok: false, msg: '오늘 납품량을 다 채웠어요.' }; const q = Math.min(left, count(s, from, item)); if (q <= 0) return { ok: false, msg: '가진 물건이 없어요.' }; const lots = take(s, from, item, q); let m = 0; for (const [n, born] of lots) m += n * martPrice(s, item) * freshMult(fresh(s, from, item, born)); m = Math.round(m); s.mart.done[item] = (s.mart.done[item] || 0) + q; earn(s, m, 'mart'); return { ok: true, msg: `${ITEMS[item].name} ${q}개 납품 +${m}G`, money: m }; }

// ---------- 온라인 ----------
export const onlineOn = (s) => (s.up.computer | 0) > 0;
function newOnlineOrder(s) {
  const kn = Object.keys(s.known).filter((it) => ITEMS[it] && !ITEMS[it].noSell && ITEMS[it].price >= 40 && ['dairy', 'bakery', 'preserve', 'drink', 'meal', 'craft', 'honey', 'egg'].includes(ITEMS[it].cat));
  const pool = kn.length ? kn : Object.keys(s.known).filter((it) => ITEMS[it] && !ITEMS[it].noSell); if (!pool.length) return null;
  const lines = []; const n = 1 + (rnd(s) < 0.45 ? 1 : 0) + (rnd(s) < 0.15 ? 1 : 0); let sum = 0; const used = [];
  for (let i = 0; i < n; i++) { const it = pick(s, pool); if (used.includes(it)) continue; used.push(it); const q = ITEMS[it].price > 120 ? 1 + (rnd(s) < 0.4 ? 1 : 0) : 1 + Math.floor(rnd(s) * 3); lines.push([it, q]); sum += ITEMS[it].price * q; }
  const reward = Math.round(sum * 1.3 * Math.sqrt(s.online.rating / 3) * salesBonus(s)); return { id: s.online.id++, lines, reward, due: s.t + DAY * 2.5 };
}
export function canPack(s, o, pools = ['store', 'pack']) { return have(s, 'box', pools) >= 1 && o.lines.every(([it, q]) => have(s, it, pools) >= q); }
export function packOrder(s, id, pools = ['store', 'pack'], by = 'player') {
  const o = s.online.orders.find((x) => x.id === id); if (!o) return { ok: false, msg: '주문이 사라졌어요.' }; if (!canPack(s, o, pools)) return { ok: false, msg: '상자나 물건이 모자라요.' };
  if (by === 'player') { const w = work(s, 2); if (!w.ok) return w; }
  let fsum = 0, n = 0; for (const [it, q] of o.lines) { const got = takeAny(s, it, q, pools); for (const x of got) { fsum += fresh(s, x.pool, it, x.born) * x.q; n += x.q; } } takeAny(s, 'box', 1, pools);
  s.online.orders = s.online.orders.filter((x) => x !== o); const f = n ? fsum / n : 1; s.online.ship.push({ at: s.t + 22 + rnd(s) * 20, reward: Math.round(o.reward * 0.93 * freshMult(f)), f });
  return { ok: true, msg: '포장 완료! 택배가 출발했어요.' };
}
export function buyAds(s, level) { const cost = [0, 200, 500, 1200][level]; const dur = [0, DAY * 2, DAY * 4, DAY * 8][level]; if (!onlineOn(s)) return { ok: false, msg: '컴퓨터가 필요해요.' }; if (!spend(s, cost)) return { ok: false, msg: '돈이 모자라요.' }; s.online.adsUntil = Math.max(s.online.adsUntil, s.t) + dur; return { ok: true, msg: '광고를 시작했어요! 주문이 늘어요.' }; }

// ---------- 자동 설정 ----------
export function setAutoCrops(s, list) { s.auto.crops = list.filter((c) => CROPS[c] && CROPS[c].lv <= s.level).slice(0, 3); return { ok: true, msg: '자동 파종 작물을 정했어요.' }; }
export function setAutoRecipe(s, mid, rid) { const m = s.machines[mid]; if (!m) return { ok: false, msg: '설비가 없어요.' }; m.auto = rid; return { ok: true, msg: rid ? `${ITEMS[RECIPES[rid].out[0]].name} 자동 제작` : '자동 제작 해제' }; }
export function setConsign(s, item, keep) { if (keep == null) delete s.consign[item]; else s.consign[item] = keep; return { ok: true, msg: '위탁 판매 설정을 저장했어요.' }; }

// ---------- 순위 ----------
export function board(s) { const rows = s.rivals.map((r) => ({ id: r.id, name: r.name, rev: Math.round(r.rev), me: false })); rows.push({ id: 'me', name: '내 농장', rev: Math.round(s.revenue), me: true }); rows.sort((a, b) => b.rev - a.rev); rows.forEach((r, i) => { r.rank = i + 1; }); return rows; }
export const myRank = (s) => board(s).find((r) => r.me).rank;
function checkWin(s) { if (s.ended) return; if (s.day < 2) return; const top = Math.max(...s.rivals.map((r) => r.rev)); if (s.revenue > top) { s.ended = { won: true, t: s.t, day: s.day }; addLog(s, '🎉 매출 1위를 달성했어요!'); } }
const rivalTarget = (r, u) => r.R0 + r.F * Math.pow(Math.max(0, u), r.k);
function rivalsDay(s) {
  const u1 = Math.min(1, s.t / s.TL); for (const r of s.rivals) {
    const dlt = rivalTarget(r, u1) - rivalTarget(r, r.last); r.last = u1;
    let m = 0; for (const c of r.kind) { const its = Object.keys(ITEMS).filter((i) => ITEMS[i].cat === c && !ITEMS[i].noSell); if (its.length) m += its.reduce((a, i) => a + s.market.idx[i], 0) / its.length; } m = m / r.kind.length;
    r.rev += dlt * (0.8 + rnd(s) * 0.4) * (0.88 + 0.24 * Math.min(1.3, Math.max(0.7, m)));
  }
}

// ---------- 날씨·시장 ----------
function rollWeather(s) { const tot = D.WEATHER.reduce((a, w) => a + w.w, 0); let x = rnd(s) * tot; for (const w of D.WEATHER) { x -= w.w; if (x <= 0) { s.weather = w.id; break; } } if (s.weather === 'rain') { for (let i = 0; i < s.plots.length; i++) if (thirsty(s, i)) s.plots[i].w += 1; addLog(s, '비가 와서 밭에 물이 뿌려졌어요.'); } }
function rollEvent(s) {
  if (rnd(s) > 0.55) return; const e = pick(s, D.EVENTS); let tgt, text;
  if (e.kind === 'cat') { const cats = Object.keys(D.CATS).filter((c) => c !== 'other'); const c = pick(s, cats); tgt = { cat: c }; text = e.text.replace('{c}', D.CATS[c]); }
  else { const its = Object.keys(s.known).filter((i) => ITEMS[i] && !ITEMS[i].noSell); if (!its.length) return; const i = pick(s, its); tgt = { item: i }; text = e.text.replace('{i}', ITEMS[i].name); }
  s.market.trends.push({ ...tgt, mult: e.mult, until: s.t + DAY * (1.5 + rnd(s) * 1.5), text: e.name + ': ' + text }); addLog(s, '📣 ' + text);
}
export const trendOf = (s, item) => { let m = 1; for (const t of s.market.trends) if ((t.item && t.item === item) || (t.cat && t.cat === ITEMS[item].cat)) m *= t.mult; return m; };

// ---------- 하루가 끝날 때 ----------
function dayEnd(s) {
  s.day++;
  s.slack = 1; const w = wagesPerDay(s); if (w > 0) { if (s.gold >= w) { s.gold -= w; s.stats.wages += w; s.spent += w; addLog(s, `직원 일당 ${w}G를 지급했어요.`); } else { s.slack = 0.5; s.stats.wages += s.gold; s.gold = 0; addLog(s, '일당을 다 주지 못해 직원들이 힘이 빠졌어요. 오늘은 일이 느려요.'); } }
  rollWeather(s); rollEvent(s); s.mart.done = {};
  // 막다른 길 방지: 심을 돈도, 자라는 작물도, 팔 물건도 없으면 이웃이 씨앗값을 보태 줘요.
  if (s.gold < 10 && !s.plots.some((p) => p.crop) && total(s, 'pack') + total(s, 'store') === 0 && !Object.values(s.machines).some((x) => x.job || x.out)) { s.gold += 40; addLog(s, '이웃 할머니가 씨앗값 40G를 보태 주셨어요. 고마워요!'); }
  // 마트 정기 납품(기사님이 있을 때)과 신뢰
  rivalsDay(s);
  s.market.trends = s.market.trends.filter((t) => t.until > s.t);
  // 온라인 주문
  if (onlineOn(s)) { let n = (0.9 + s.level * 0.28) * (s.t < s.online.adsUntil ? 1.8 : 1) * (s.perk === 'online' ? 1.25 : 1) * (0.7 + (s.online.rating - 1) * 0.2) * (1 + 0.08 * (s.workers.sales | 0)); let k = Math.floor(n); if (rnd(s) < n - k) k++; for (let i = 0; i < k; i++) { const o = newOnlineOrder(s); if (o && s.online.orders.length < 10) s.online.orders.push(o); } }
  if (s.day % 1 === 0) checkWin(s);
}
function expireStuff(s) {
  for (const cl of s.clients) if (cl.order && cl.order.due < s.t) { cl.trust = Math.max(0, cl.trust - 1); cl.order = null; cl.next = s.t + DAY * 0.5; addLog(s, `${clientDef(cl.id).name} 주문 기한이 지났어요. 신뢰가 조금 떨어졌어요.`); }
  const before = s.online.orders.length; s.online.orders = s.online.orders.filter((o) => o.due > s.t); if (s.online.orders.length < before) { s.online.rating = Math.max(1, s.online.rating - 0.15 * (before - s.online.orders.length)); addLog(s, '발송하지 못한 인터넷 주문이 취소됐어요. 평점이 내려갔어요.'); }
  for (const cl of s.clients) if (cl.found && !cl.order && s.t >= cl.next) { cl.order = makeOrder(s, cl); if (cl.order) addLog(s, `${clientDef(cl.id).name}에서 새 주문이 왔어요!`); else cl.next = s.t + 30; }
}

// ---------- 시간 진행 ----------
export function advance(s, dt, skipping = false) {
  if (s.ended) return;
  let left = dt; while (left > 1e-9 && !s.ended) { const h = Math.min(0.5, left); left -= h; step(s, h, skipping); }
}
function step(s, h) {
  const p = s.p; const prevDay = Math.floor(s.t / DAY); s.t += h;
  // 체력
  const hot = s.weather === 'hot' ? 0.75 : 1; const regen = (p.resting ? 3.2 : 0.55) * (s.perk === 'strong' ? 1.3 : 1) * hot; if (p.sick <= 0) p.stamina = Math.min(p.maxSt, p.stamina + regen * h); else p.stamina = Math.min(p.maxSt, p.stamina + 0.3 * h);
  if (p.sick > 0) { p.sick -= h; if (p.sick <= 0) { p.sick = 0; p.fatigue = 35; addLog(s, '몸살이 나았어요. 천천히 일하세요.'); } } else if (p.stamina > 40 || p.resting) p.fatigue = Math.max(0, p.fatigue - (p.resting ? 2.5 : 0.5) * h);
  if (p.resting && p.stamina >= p.maxSt - 0.5) p.resting = false;
  // 작물
  const sprink = (s.up.sprinkler | 0) * 6;
  for (let i = 0; i < s.plots.length; i++) { const pl = s.plots[i]; if (!pl.u || !pl.crop) continue; const c = CROPS[pl.crop]; if (pl.prog >= c.grow) continue; const stage = c.grow / c.water; const gate = pl.w * stage; if (pl.w < c.water && pl.prog >= gate - 1e-9) { if (i < sprink) pl.w += 1; else continue; } const lim = pl.w >= c.water ? c.grow : pl.w * stage; pl.prog = Math.min(lim, pl.prog + h * (s.weather === 'hot' ? 0.92 : 1)); }
  // 동물
  for (const [id, hh] of Object.entries(s.houses)) { if (!hh.animals) continue; const d = HOUSES[id]; if (hh.prod >= 12) continue; hh.prog += (hh.animals * h) / d.every; while (hh.prog >= 1) { hh.prog -= 1; if (hh.feed >= 0.5 && hh.prod < 12) { hh.feed -= 0.5; hh.prod += 1; } else { hh.prog = 0; break; } } }
  // 설비 작업
  for (const m of Object.values(s.machines)) if (m.job) { m.job.left -= h; if (m.job.left <= 0) { const r = RECIPES[m.job.rid]; m.out = { item: r.out[0], q: r.out[1] * batchOf(m), f: m.job.f }; m.job = null; } }
  // 직원·설비 자동화
  automate(s, h);
  // 택배
  for (let i = s.online.ship.length - 1; i >= 0; i--) { const sh = s.online.ship[i]; if (sh.at <= s.t) { earn(s, sh.reward, 'online'); s.online.rating = Math.min(5, s.online.rating + 0.08); s.online.ship.splice(i, 1); } }
  // 주기 처리
  if (s.t >= s.nextTick) { s.nextTick += 5; marketTick(s); expireStuff(s); }
  if (s.t >= s.nextSpoil) { s.nextSpoil += 10; spoil(s); }
  if (Math.floor(s.t / DAY) > prevDay) dayEnd(s);
  if (s.t >= s.TL && !s.ended) { s.ended = { won: false, t: s.t, day: s.day }; addLog(s, '제한 시간이 끝났어요...'); }
}
function marketTick(s) {
  for (const id of Object.keys(s.market.idx)) { if (ITEMS[id].noSell) continue; const target = Math.min(1.7, trendOf(s, id)); let v = s.market.idx[id]; v += (target - v) * 0.04 + (rnd(s) - 0.5) * 0.012; s.market.idx[id] = Math.min(1.8, Math.max(0.5, v)); }
}
function spoil(s) {
  for (const name of ['pack', 'store']) for (const it of Object.keys(s.inv[name])) { const l = s.inv[name][it]; const sh = shelfOf(s, name, it); let lost = 0; for (let i = l.length - 1; i >= 0; i--) if (s.t - l[i][1] >= sh) { lost += l[i][0]; l.splice(i, 1); } if (!l.length) delete s.inv[name][it]; if (lost > 0 && it !== 'feed' && it !== 'box') { addLog(s, `${ITEMS[it].name} ${lost}개가 상해서 버렸어요.`); s.stats.spoiled = (s.stats.spoiled | 0) + lost; } }
}

// ---------- 자동화(직원과 기계) ----------
function automate(s, h) {
  const a = s.acc; const wk = s.workers; const farm = wk.farmhand | 0, ranch = wk.rancher | 0, art = wk.artisan | 0, drv = wk.driver | 0, onl = wk.online | 0;
  const sl = s.slack == null ? 1 : s.slack;
  if (farm) { a.farm += (farm * sl * h) / (2.6 * ((s.up.tractor | 0) ? 0.7 : 1)); while (a.farm >= 1) { a.farm -= 1; if (!farmTask(s)) { a.farm = 0; break; } } }
  if (ranch) { a.ranch += (ranch * sl * h) / 3; while (a.ranch >= 1) { a.ranch -= 1; if (!ranchTask(s)) { a.ranch = 0; break; } } }
  if ((s.up.feeder | 0)) { a.feeder += h; if (a.feeder >= 15) { a.feeder = 0; for (const [id, hh] of Object.entries(s.houses)) { const need = feedCap(hh) - hh.feed; if (need > 0 && hh.animals) { const buy = need * FEED_PRICE; if (s.gold >= buy) { s.gold -= buy; s.spent += buy; hh.feed += need; } } } } }
  if ((s.up.milker | 0)) { a.milker += h; if (a.milker >= 20) { a.milker = 0; for (const id of Object.keys(s.houses)) collectHouse(s, id, 'store', 'auto'); } }
  if ((s.up.combine | 0)) { a.combine += h; if (a.combine >= 25) { a.combine = 0; for (let i = 0; i < s.plots.length; i++) if (isReady(s, i)) { if (!harvest(s, i, 'store', 'auto').ok) break; } } }
  if (art) { a.art += h * sl; if (a.art >= 2) { a.art = 0; let slots = art * 3; for (const [id, m] of Object.entries(s.machines)) { if (slots <= 0) break; if (m.out) { collectMachine(s, id, 'store', 'auto'); } if (!m.job && !m.out && m.auto) { slots--; if (canCraft(s, id, m.auto, ['store'])) startCraft(s, id, m.auto, ['store'], 'auto'); } else if (m.job) slots--; } } }
  if (drv && (s.up.truck | 0)) { a.drv += h; if (a.drv >= 10) { a.drv = 0; driverRun(s, drv); } }
  if (onl) { a.onl += (onl * sl * h) / 8; while (a.onl >= 1) { a.onl -= 1; const o = s.online.orders.find((x) => canPack(s, x, ['store'])); if (!o) { a.onl = 0; break; } packOrder(s, o.id, ['store'], 'auto'); } }
}
const FEED_PRICE = 4;
function farmTask(s) {
  const crops = s.auto.crops.filter((c) => CROPS[c].lv <= s.level);
  for (let i = 0; i < s.plots.length; i++) if (isReady(s, i)) { if (harvest(s, i, 'store', 'auto').ok) return true; }
  for (let i = 0; i < s.plots.length; i++) if (thirsty(s, i) && !(i < (s.up.sprinkler | 0) * 6)) { s.plots[i].w += 1; return true; }
  if (crops.length) for (let i = 0; i < s.plots.length; i++) { const p = s.plots[i]; if (p.u && !p.crop) { const c = crops[i % crops.length]; if (plant(s, i, c, 'auto').ok) return true; } }
  return false;
}
function ranchTask(s) {
  for (const [id, hh] of Object.entries(s.houses)) if (hh.prod >= 1 && space(s, 'store') > 0) { return collectHouse(s, id, 'store', 'auto').ok; }
  for (const [id, hh] of Object.entries(s.houses)) if (hh.animals && feedCap(hh) - hh.feed >= 2) { const need = feedCap(hh) - hh.feed; const fromStore = Math.min(need, count(s, 'store', 'feed')); if (fromStore > 0) { take(s, 'store', 'feed', fromStore); hh.feed += fromStore; return true; } const buy = need * FEED_PRICE; if (s.gold >= buy) { s.gold -= buy; s.spent += buy; hh.feed += need; return true; } }
  return false;
}
function driverRun(s, drv) {
  // 1) 주문 납품(수수료 6%) 2) 마트 정기 납품 3) 시장 위탁 판매(수수료 12%)
  for (const cl of s.clients) if (cl.order && orderReady(s, cl, ['store'])) deliverOrder(s, cl.id, ['store'], 0.06);
  if (s.mart.found) for (const [it, q] of Object.entries(s.mart.quota)) { const left = q - (s.mart.done[it] || 0); if (left > 0 && count(s, 'store', it) > 0) martDeliver(s, it, 'store'); }
  let trips = 4 * drv; for (const [it, keep] of Object.entries(s.consign)) { if (trips <= 0) break; const ex = count(s, 'store', it) - keep; if (ex > 0) { sellMarket(s, it, Math.min(ex, 8), 'store', 0.88, 'consign'); trips--; } }
}

// ---------- 저장 ----------
export const serialize = (s) => JSON.stringify(s);
export const deserialize = (txt) => { try { const s = JSON.parse(txt); return s && s.v === 1 ? s : null; } catch (e) { return null; } };
export const timeLeft = (s) => Math.max(0, s.TL - s.t);
export const isNight = (s) => (s.t % DAY) / DAY > 0.78;
