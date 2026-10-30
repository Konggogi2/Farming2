// 화면 그리기: 도트 캔버스에 세계와 사람, 동물, 날씨를 그려요.
import * as A from './art.js';
import * as D from './data.js';
import * as S from './sim.js';
import { PENS, MACHINE_ORDER, W, H } from './world.js';
const { TS } = A;

export function makeArt() {
  const art = { tiles: A.tiles(), b: A.buildings(), crops: A.cropSprites(D.CROPS), player: A.playerSprites(), animals: A.animalSprites(), icons: {}, machines: {}, slot: A.emptySlot(), drop: A.dropIcon(), spark: A.sparkIcon(), heart: A.heartIcon() };
  for (const id of Object.keys(D.MACHINES)) art.machines[id] = A.machineSprite(id);
  art.npc = [A.npcSprite('#5a8ad0', '#3a2a1a'), A.npcSprite('#e07a9a', '#6a3a1a'), A.npcSprite('#7ab05a', '#1a1a1a'), A.npcSprite('#e0b04a', '#8a5a2a'), A.npcSprite('#9a7ad0', '#2a1a3a')];
  art.shedC = { coop: A.buildings().shed('#c7473a', '#f2dcb0'), cow: A.buildings().shed('#7a4a3a', '#c04a3a'), goat: A.buildings().shed('#4a6aa8', '#e8d6b0'), sheep: A.buildings().shed('#4a9a3a', '#d9f0c8') };
  return art;
}
export const iconOf = (art, id) => art.icons[id] || (art.icons[id] = A.iconCanvas(id));

const ANIMAL_SPR = { coop: 'chicken', pond: 'duck', cow: 'cow', goat: 'goat', hive: 'hive', sheep: 'sheep' };

export class Renderer {
  constructor(canvas, art, world) {
    this.c = canvas; this.x = canvas.getContext('2d'); this.art = art; this.world = world; this.S = 4; this.vw = 160; this.vh = 280; this.zoo = {}; this.npcs = []; this.t = 0; this.rain = [];
    for (let i = 0; i < 5; i++) this.npcs.push({ x: (40 + i * 6) * TS, y: (13.4 + (i % 2) * 7.5) * TS, dir: i % 2 ? -1 : 1, v: 8 + i * 2, spr: art.npc[i], min: 38 * TS, max: 69 * TS, f: 0 });
    this.resize();
  }
  resize() {
    const dpr = window.devicePixelRatio || 1; const cw = this.c.clientWidth || window.innerWidth, ch = this.c.clientHeight || window.innerHeight;
    this.c.width = Math.floor(cw * dpr); this.c.height = Math.floor(ch * dpr);
    this.S = Math.max(2, Math.round(this.c.width / (TS * 10.5))); this.vw = Math.ceil(this.c.width / this.S); this.vh = Math.ceil(this.c.height / this.S);
  }
  camera(px, py) { const w = this.world; let cx = px - this.vw / 2, cy = py - this.vh / 2 - 12; cx = Math.max(0, Math.min(W * TS - this.vw, cx)); cy = Math.max(0, Math.min(H * TS - this.vh, cy)); this.cx = Math.round(cx); this.cy = Math.round(cy); void w; }
  update(dt, s) {
    this.t += dt;
    for (const [id, p] of Object.entries(PENS)) { const n = s.houses[id] ? s.houses[id].animals : 0; const z = this.zoo[id] || (this.zoo[id] = []); while (z.length < n) { const b = this.bounds(p); z.push({ x: b.x0 + Math.random() * (b.x1 - b.x0), y: b.y0 + Math.random() * (b.y1 - b.y0), tx: 0, ty: 0, wait: Math.random() * 2, face: 1, f: 0 }); } z.length = n;
      for (const a of z) { const b = this.bounds(p); if (a.wait > 0) { a.wait -= dt; continue; } if (!a.tx) { a.tx = b.x0 + Math.random() * (b.x1 - b.x0); a.ty = b.y0 + Math.random() * (b.y1 - b.y0); } const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy); if (d < 1.5) { a.tx = 0; a.wait = 1 + Math.random() * 3; continue; } a.x += (dx / d) * 9 * dt; a.y += (dy / d) * 9 * dt; a.face = dx < 0 ? -1 : 1; a.f = Math.floor(this.t * 4) % 2; } }
    for (const n of this.npcs) { n.x += n.dir * n.v * dt; if (n.x > n.max) n.dir = -1; if (n.x < n.min) n.dir = 1; n.f = Math.floor(this.t * 3) % 2; }
  }
  bounds(p) { return { x0: (p.x + 1) * TS, x1: (p.x + p.w - 1) * TS - 12, y0: (p.y + 2) * TS, y1: (p.y + p.h - 1) * TS - 14 }; }
  draw(s, pl, ui) {
    const x = this.x, art = this.art, w = this.world, Sc = this.S; x.imageSmoothingEnabled = false; x.setTransform(Sc, 0, 0, Sc, 0, 0);
    this.camera(pl.x, pl.y); const cx = this.cx, cy = this.cy; x.fillStyle = '#4a9a3e'; x.fillRect(0, 0, this.vw, this.vh);
    x.drawImage(w.ground, cx, cy, this.vw, this.vh, 0, 0, this.vw, this.vh);
    x.save(); x.translate(-cx, -cy);
    this.drawPlots(s); this.drawPens(s); this.drawMachines(s);
    // y 순서 그리기
    const list = []; const vx0 = cx - 100, vx1 = cx + this.vw + 100, vy0 = cy - 100, vy1 = cy + this.vh + 100;
    for (const d of w.deco) if (d.x + d.img.width > vx0 && d.x < vx1 && d.by > vy0 && d.by - d.img.height < vy1) list.push({ by: d.by, fn: () => x.drawImage(d.img, d.x, d.y) });
    for (const [id, z] of Object.entries(this.zoo)) for (const a of z) { const spr = art.animals[ANIMAL_SPR[id]][a.f]; list.push({ by: a.y + 16, fn: () => { x.save(); if (a.face < 0 && id !== 'hive') { x.translate(a.x + 16, a.y); x.scale(-1, 1); x.drawImage(spr, 0, 0); } else x.drawImage(spr, a.x, a.y); x.restore(); } }); }
    for (const n of this.npcs) list.push({ by: n.y + 16, fn: () => x.drawImage(n.spr, Math.round(n.x), Math.round(n.y) + (n.f ? -1 : 0)) });
    list.push({ by: pl.y + 3, fn: () => this.drawPlayer(pl, s) });
    list.sort((a, b) => a.by - b.by); for (const e of list) e.fn();
    this.drawIndicators(s, ui);
    x.restore();
    this.drawWeather(s, dtSafe(this.t));
  }
  drawPlots(s) {
    const x = this.x, art = this.art; const w = this.world;
    for (const p of w.plots) { const pl = s.plots[p.i]; const X = p.tx * TS, Y = p.ty * TS; if (!pl.u) { x.drawImage(art.tiles.locked, X, Y); continue; }
      const k = S.plotKind(s, p.i); x.drawImage(pl.crop && (k === 'growing' || k === 'ready') && pl.w > 0 ? art.tiles.wet : art.tiles.soil, X, Y);
      if (pl.crop) { const c = D.CROPS[pl.crop]; const st = k === 'ready' ? 2 : pl.prog / c.grow > 0.5 ? 1 : (pl.prog > 0 ? 0 : 0); const spr = art.crops[pl.crop][k === 'ready' ? 2 : pl.prog / c.grow > 0.45 ? 1 : 0]; const bob = k === 'ready' ? Math.round(Math.sin(this.t * 4 + p.i) * 0.6) : 0; x.drawImage(spr, X, Y + bob); void st;
        if (k === 'thirsty') x.drawImage(art.drop, X + 4, Y - 6 + Math.round(Math.sin(this.t * 5 + p.i) * 1)); if (k === 'ready' && Math.floor(this.t * 3 + p.i) % 3 === 0) x.drawImage(art.spark, X + 8, Y - 2); }
    }
  }
  drawPens(s) {
    const x = this.x, art = this.art;
    for (const [id, p] of Object.entries(PENS)) {
      const h = s.houses[id]; const X = p.x * TS, Y = p.y * TS;
      if (!h) { x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(X + 16, Y + 20, (p.w - 2) * TS, (p.h - 3) * TS); x.fillStyle = 'rgba(255,255,255,0.65)'; const cxp = X + (p.w * TS) / 2, cyp = Y + (p.h * TS) / 2 + 4; x.fillRect(cxp - 6, cyp - 1, 12, 2); x.fillRect(cxp - 1, cyp - 6, 2, 12); continue; }
      const shed = art.shedC[id]; if (shed) x.drawImage(shed, X + 8, Y + 6);
      if (id !== 'pond') x.drawImage(art.b.trough, X + (p.w - 3) * TS, Y + TS + 4);
      void h;
    }
  }
  drawMachines(s) {
    const x = this.x, art = this.art;
    for (const m of this.world.machines) { const ms = s.machines[m.id]; if (!ms) { x.drawImage(art.slot, m.x, m.y); continue; } x.drawImage(art.machines[m.id], m.x, m.y); if (ms.lvl > 0) { x.fillStyle = '#ffd24a'; for (let i = 0; i < ms.lvl; i++) x.fillRect(m.x + 3 + i * 4, m.y + 31, 3, 1); }
      if (ms.job) { const r = D.RECIPES[ms.job.rid]; const f = 1 - ms.job.left / r.time; x.fillStyle = '#2b1d14'; x.fillRect(m.x + 4, m.y - 3, 24, 4); x.fillStyle = '#6bc24f'; x.fillRect(m.x + 5, m.y - 2, Math.round(22 * f), 2); const sm = (this.t * 12 + m.x) % 14; x.fillStyle = 'rgba(255,255,255,0.7)'; x.fillRect(m.x + 14 + Math.sin(this.t * 3 + m.x) * 2, m.y - 8 - sm * 0.6, 3, 3); }
      if (ms.out) x.drawImage(art.spark, m.x + 12, m.y - 8 + Math.round(Math.sin(this.t * 6) * 1)); }
  }
  drawPlayer(pl, s) {
    const x = this.x, art = this.art; const f = pl.moving ? (Math.floor(this.t * 8) % 2 ? 1 : 2) : 0; const spr = art.player[pl.dir][f];
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(Math.round(pl.x) - 5, Math.round(pl.y) + 1, 10, 3);
    x.drawImage(spr, Math.round(pl.x) - 8, Math.round(pl.y) - 14);
    if (s.p.sick > 0) { x.fillStyle = 'rgba(80,200,80,0.35)'; x.fillRect(Math.round(pl.x) - 5, Math.round(pl.y) - 12, 10, 8); }
    if (pl.flash > 0) { x.fillStyle = `rgba(255,255,255,${pl.flash})`; }
    if (s.p.resting) { x.fillStyle = '#fff'; const zz = Math.floor(this.t * 2) % 2; x.fillRect(Math.round(pl.x) + 6, Math.round(pl.y) - 18 - zz, 3, 1); x.fillRect(Math.round(pl.x) + 7, Math.round(pl.y) - 17 - zz, 1, 1); x.fillRect(Math.round(pl.x) + 6, Math.round(pl.y) - 16 - zz, 3, 1); }
  }
  drawIndicators(s, ui) {
    const x = this.x, art = this.art;
    for (const [id, p] of Object.entries(PENS)) { const h = s.houses[id]; if (!h) continue; const X = p.x * TS + 10, Y = p.y * TS - 6; let ox = 0; if (h.prod >= 1) { x.drawImage(art.heart, X, Y + Math.round(Math.sin(this.t * 4) * 1)); ox = 10; x.fillStyle = '#fff'; } if (h.animals && h.feed < 1) { x.drawImage(iconOf(art, 'feed'), X + ox, Y - 3, 12, 12); } }
    if (ui && ui.target && ui.target.px != null) { const t = ui.target; const b = Math.round(Math.sin(this.t * 6) * 1.5); x.fillStyle = '#ffec6a'; x.fillRect(t.px - 3, t.py - 22 + b, 7, 1); x.fillRect(t.px - 2, t.py - 21 + b, 5, 1); x.fillRect(t.px - 1, t.py - 20 + b, 3, 1); x.fillRect(t.px, t.py - 19 + b, 1, 1); x.fillStyle = '#2b1d14'; x.fillRect(t.px - 4, t.py - 23 + b, 9, 1); }
  }
  drawWeather(s) {
    const x = this.x; x.setTransform(this.S, 0, 0, this.S, 0, 0); const ph = (s.t % D.DAY) / D.DAY; let a = 0, col = '20,30,90';
    if (ph > 0.7) { const q = Math.min(1, (ph - 0.7) / 0.1); a = 0.38 * q; col = ph < 0.78 ? '200,90,40' : '20,30,90'; if (ph < 0.78) a = 0.22 * q; }
    else if (ph < 0.06) { a = 0.12 * (1 - ph / 0.06); col = '255,190,120'; }
    if (a > 0) { x.fillStyle = `rgba(${col},${a})`; x.fillRect(0, 0, this.vw, this.vh); }
    if (s.weather === 'cloud') { x.fillStyle = 'rgba(80,90,110,0.12)'; x.fillRect(0, 0, this.vw, this.vh); }
    if (s.weather === 'hot') { x.fillStyle = 'rgba(255,170,60,0.08)'; x.fillRect(0, 0, this.vw, this.vh); }
    if (s.weather === 'rain') { x.fillStyle = 'rgba(60,80,120,0.18)'; x.fillRect(0, 0, this.vw, this.vh); x.fillStyle = 'rgba(190,220,255,0.8)'; while (this.rain.length < 60) this.rain.push({ x: Math.random() * this.vw, y: Math.random() * this.vh, v: 90 + Math.random() * 40 }); for (const r of this.rain) { r.y += r.v / 30; r.x -= 1.2; if (r.y > this.vh) { r.y = -4; r.x = Math.random() * this.vw; } x.fillRect(Math.round(r.x), Math.round(r.y), 1, 4); } }
  }
}
const dtSafe = (t) => t;
