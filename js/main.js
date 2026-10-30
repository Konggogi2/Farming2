// 게임 컨트롤러: 입력, 반복 처리, 화면(HUD)과 창 열기, 저장.
import { h } from './util.js';
import * as D from './data.js';
import * as S from './sim.js';
import { buildWorld, blocked, PLOT_X, PLOT_Y, PLOT_COLS } from './world.js';
import { makeArt, Renderer } from './render.js';
import { SCREENS, G$, mmss, statsRows, ico } from './screens.js';
import { TS } from './art.js';

const SAVE = 'farmgame-save-v1', OPT = 'farmgame-opt-v1';
const art = makeArt(); const world = buildWorld(art);
const app = document.getElementById('app');
const canvas = h('canvas', { id: 'game' }); app.append(canvas);
const R = new Renderer(canvas, art, world);

const G = { s: null, art, world, seed: 'lettuce', pl: { x: 7 * TS + 8, y: 9 * TS, dir: 'down', moving: false, flash: 0 }, screen: null, ended: false, sound: true, hold: false, stick: { x: 0, y: 0 } };
try { const o = JSON.parse(localStorage.getItem(OPT) || '{}'); if (o.sound === false) G.sound = false; } catch (e) { /* 저장소를 못 쓰는 환경 */ }
window.__game = G; window.__S = S;

// ---------- 소리(아주 작은 효과음) ----------
let ac = null;
function beep(f = 660, d = 0.07, type = 'square', v = 0.04) { if (!G.sound) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d); o.stop(ac.currentTime + d); } catch (e) { /* 소리 없이 진행 */ } }
const sfx = { ok: () => { beep(740, 0.06); setTimeout(() => beep(990, 0.06), 60); }, no: () => beep(180, 0.12, 'sawtooth', 0.03), coin: () => { beep(1040, 0.05); setTimeout(() => beep(1400, 0.08), 55); }, tap: () => beep(520, 0.04) };

// ---------- 화면 조각 ----------
const hud = h('div', { id: 'hud' });
const chipGold = h('div', { class: 'chip gold' }), chipRank = h('button', { class: 'chip rank', onclick: () => G.open('board') }), chipTime = h('div', { class: 'chip time' });
const stBar = h('i'), ftBar = h('i'); const stTxt = h('span'), dayTxt = h('div', { class: 'daytxt' }), seedBtn = h('button', { class: 'seedbtn', onclick: () => G.open('seedpick') });
hud.append(h('div', { class: 'r1' }, chipGold, chipRank, chipTime), h('div', { class: 'r2' }, h('div', { class: 'bars' }, h('div', { class: 'lb' }, '❤️', h('div', { class: 'meter' }, stBar), stTxt), h('div', { class: 'lb' }, '😵', h('div', { class: 'meter ft' }, ftBar))), dayTxt, seedBtn));
const stick = h('div', { id: 'stick' }, h('div', { class: 'base' }), h('div', { class: 'knob' }));
const aBtn = h('button', { id: 'abtn' }, h('b', null, 'A'), h('small', null, ''));
const side = h('div', { id: 'side' }, h('button', { class: 'sb', onclick: () => G.open('inventory') }, '🎒'), h('button', { class: 'sb', onclick: () => G.open('orders') }, '📜'), h('button', { class: 'sb', id: 'restb', onclick: () => G.toggleRest() }, '💤'), h('button', { class: 'sb', onclick: () => G.open('menu') }, '☰'));
const hint = h('div', { id: 'hint' }); const prompt = h('div', { id: 'prompt' }); const toasts = h('div', { id: 'toasts' });
const controls = h('div', { id: 'controls' }, stick, side, aBtn);
const modal = h('div', { id: 'modal', class: 'hidden' }); const title = h('div', { id: 'title' }); const banner = h('div', { id: 'banner', class: 'hidden' });
app.append(hud, hint, prompt, toasts, controls, modal, banner, title);

// ---------- 창 ----------
let aHoldT = 0, aPointerId = null;
function releaseA() { G.hold = false; aHoldT = 0; aPointerId = null; aBtn.classList.remove('down'); }
G.open = (name, params = {}) => { releaseA(); G.screen = { name, params, fresh: true }; G.render(); };
G.close = () => { releaseA(); G.screen = null; modal.classList.add('hidden'); modal.innerHTML = ''; };
G.render = () => {
  if (!G.screen) return; const sc = SCREENS[G.screen.name]; if (!sc) return; const prevScroll = modal.querySelector('.body') ? modal.querySelector('.body').scrollTop : 0;
  const r = sc(G, G.screen.params); modal.innerHTML = ''; modal.classList.remove('hidden');
  const body = h('div', { class: 'body' }, r.body); modal.append(h('div', { class: 'panel' }, h('header', null, h('h2', null, r.title), h('button', { class: 'x', onclick: () => G.close() }, '✕')), body, h('div', { class: 'foot' }, h('span', null, `💰 ${G$(G.s.gold)}`), h('span', null, `🏆 ${S.myRank(G.s)}위`))));
  body.scrollTop = G.screen.fresh ? 0 : prevScroll; G.screen.fresh = false;
};
G.refresh = () => { G.render(); G.hudUpdate(true); };
G.say = (msg, ok = true) => { if (!msg) return; const t = h('div', { class: 'toast' + (ok ? '' : ' bad') }, msg); toasts.append(t); (ok ? sfx.tap : sfx.no)(); setTimeout(() => t.classList.add('out'), 2000); setTimeout(() => t.remove(), 2500); while (toasts.children.length > 3) toasts.firstChild.remove(); };
G.act = (r) => { if (!r) return; if (r.warn) G.say(r.warn, false); if (r.sick) { sfx.no(); } G.say(r.msg, r.ok !== false); if (r.ok !== false && r.money) sfx.coin(); else if (r.ok !== false) sfx.ok(); G.refresh(); };
G.save = () => { if (!G.s || G.s.ended) return; try { localStorage.setItem(SAVE, JSON.stringify({ s: G.s, seed: G.seed, pl: { x: G.pl.x, y: G.pl.y } })); } catch (e) { /* 저장 불가 */ } };
G.toggleRest = () => { S.setResting(G.s, !G.s.p.resting); G.say(G.s.p.resting ? '쉬는 중... 움직이면 멈춰요.' : '쉬기를 멈췄어요.', true); };
G.sleep = () => { G.close(); const r = S.sleep(G.s); G.say(r.msg, true); sfx.ok(); G.pl.x = 7 * TS + 8; G.pl.y = 9 * TS; G.save(); };
G.toTitle = () => { G.save(); G.close(); showTitle(); };
G.giveUp = () => { G.s.ended = { won: false, t: G.s.t, day: G.s.day, gaveUp: true }; G.close(); };

// ---------- 목표(A 버튼) ----------
const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
function plotAt(px, py) { const tx = Math.floor(px / TS) - PLOT_X, ty = Math.floor(py / TS) - PLOT_Y; if (tx < 0 || tx >= PLOT_COLS || ty < 0 || ty >= 4) return -1; return ty * PLOT_COLS + tx; }
function findTarget() {
  const s = G.s, pl = G.pl, w = world; const [dx, dy] = DIRV[pl.dir];
  let pi = plotAt(pl.x + dx * 9, pl.y + dy * 9 - 3); if (pi < 0) pi = plotAt(pl.x, pl.y - 2);
  if (pi >= 0) { const k = S.plotKind(s, pi); const pt = w.plots[pi]; const base = { px: pt.tx * TS + 8, py: pt.ty * TS + 8, kind: 'plot' };
    if (k === 'locked') return { ...base, label: '잠긴 밭', run: () => G.say('장비상에서 밭을 넓힐 수 있어요.', false) };
    if (k === 'empty') return { ...base, label: `심기 · ${D.CROPS[G.seed].name}`, run: () => { const r = S.plant(s, pi, G.seed); if (!r.ok && /레벨|씨앗값/.test(r.msg)) G.say(r.msg, false); else G.act(r); } };
    if (k === 'thirsty') return { ...base, label: '물 주기 💧', run: () => G.act(S.water(s, pi)) };
    if (k === 'ready') return { ...base, label: '수확하기', run: () => G.act(S.harvest(s, pi)) };
    const c = D.CROPS[s.plots[pi].crop]; return { ...base, label: `자라는 중 ${Math.round((s.plots[pi].prog / c.grow) * 100)}%`, run: () => G.say(`${c.name}이(가) 자라고 있어요.`, true) };
  }
  let best = null, bd = 1e9; for (const o of w.objects) { const d = Math.hypot(pl.x - o.ix, pl.y - o.iy); if (d <= o.r && d < bd) { best = o; bd = d; } }
  if (!best) return null; const o = best; const base = { px: o.ix, py: o.iy - 4, kind: o.kind };
  switch (o.kind) {
    case 'home': return { ...base, label: '내 집', run: () => G.open('home') };
    case 'barn': return { ...base, label: '창고', run: () => G.open('barn') };
    case 'well': return { ...base, label: '물 채우기', run: () => G.act(S.refill(s)) };
    case 'market': return { ...base, label: '시장', run: () => G.open('market') };
    case 'board': return { ...base, label: '게시판', run: () => G.open('board') };
    case 'seedshop': case 'equip': case 'hr': case 'clinic': case 'mart': return { ...base, label: o.label, run: () => G.open(o.kind) };
    case 'client': return { ...base, label: o.label, run: () => G.open('client', { id: o.client }) };
    case 'machine': return { ...base, label: s.machines[o.id] ? D.MACHINES[o.id].name : `빈 자리 · ${D.MACHINES[o.id].name}`, run: () => G.open('machine', { id: o.id }) };
    case 'house': return { ...base, label: s.houses[o.id] ? D.HOUSES[o.id].name : `${D.HOUSES[o.id].name} (건설 가능)`, run: () => G.open('house', { id: o.id }) };
  }
  return null;
}
G.target = null; G.doA = () => { const t = findTarget(); if (t) t.run(); else G.say('앞에 할 일이 없어요.', false); };

// ---------- 조이스틱 ----------
{
  let pid = null, cx = 0, cy = 0; const knob = stick.querySelector('.knob'); const R0 = 46;
  const upd = (e) => { let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy); if (d > R0) { dx = (dx / d) * R0; dy = (dy / d) * R0; } knob.style.transform = `translate(${dx}px, ${dy}px)`; const m = Math.min(1, d / R0); G.stick.x = d < 8 ? 0 : (dx / R0) * (m > 0.2 ? 1 : 0) * 1.4; G.stick.y = d < 8 ? 0 : (dy / R0) * (m > 0.2 ? 1 : 0) * 1.4; const L = Math.hypot(G.stick.x, G.stick.y); if (L > 1) { G.stick.x /= L; G.stick.y /= L; } };
  stick.addEventListener('pointerdown', (e) => { if (pid != null) return; pid = e.pointerId; try { stick.setPointerCapture(pid); } catch (er) { /* 합성 이벤트 */ } const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; upd(e); e.preventDefault(); });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === pid) upd(e); });
  const end = (e) => { if (e.pointerId !== pid) return; pid = null; knob.style.transform = ''; G.stick.x = G.stick.y = 0; };
  stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
}
{
  aBtn.addEventListener('pointerdown', (e) => {
    if (aPointerId !== null) return;
    e.preventDefault(); aPointerId = e.pointerId;
    try { aBtn.setPointerCapture(e.pointerId); } catch (er) { /* 합성 이벤트 */ }
    G.hold = true; aHoldT = 0; aBtn.classList.add('down');
    if (!G.screen && G.s && !G.s.ended) G.doA();
  });
  const up = (e) => { if (e.pointerId === aPointerId) releaseA(); };
  aBtn.addEventListener('pointerup', up); aBtn.addEventListener('pointercancel', up); aBtn.addEventListener('lostpointercapture', up);
}

// ---------- 길잡이 말풍선: 지금 하면 좋은 일을 알려 줘요 ----------
function hintText(s) {
  if (s.p.sick > 0) return '🤒 몸살이 났어요! 마을 병원에 가거나 집에서 푹 자요.';
  if (s.p.stamina < 15) return '😮‍💨 체력이 부족해요. 💤로 쉬거나 음식을 먹어요.';
  const kinds = s.plots.map((p, i) => S.plotKind(s, i)); const has = (k) => kinds.includes(k);
  if (has('ready')) return '🌾 다 자란 작물이 있어요! 가서 수확해요.';
  if (has('thirsty') && s.p.water <= 0) return '🪣 물이 떨어졌어요. 우물에서 채워요.';
  if (has('thirsty')) return '💧 목마른 작물에 물을 줘요.';
  if (has('empty') && s.gold >= D.CROPS[G.seed].seed) return '🌱 빈 밭에 씨앗을 심어요.';
  if (S.total(s, 'pack') >= Math.max(8, S.cap(s, 'pack') * 0.6)) return '🎒 배낭이 무거워요. 창고에 맡기거나 시장에 팔아요.';
  const spare = s.gold > 400 && s.level >= 1; if (spare && !(s.workers.farmhand | 0)) return '🧑‍🌾 직원 소개소에서 농장 일꾼을 고용해 보세요.';
  if (s.gold > 300 && S.nextPlots(s)) return '🔧 장비상에서 밭을 넓혀 보세요.';
  return '';
}
// ---------- HUD ----------
let hudT = 0, lastDay = 1, lastLog = 0, lastLevel = 0;
G.hudUpdate = (force) => {
  const s = G.s; if (!s) return; const p = s.p;
  chipGold.textContent = `💰 ${G$(s.gold)}`; const rk = S.myRank(s); chipRank.textContent = `🏆 ${rk}위`; chipRank.className = 'chip rank' + (rk === 1 ? ' first' : ''); chipTime.textContent = `⏱ ${mmss(S.timeLeft(s))}`; chipTime.className = 'chip time' + (S.timeLeft(s) < 600 ? ' warn' : '');
  stBar.style.width = (p.stamina / p.maxSt) * 100 + '%'; stBar.parentElement.className = 'meter' + (p.stamina < 20 ? ' bad' : ''); stTxt.textContent = Math.round(p.stamina); ftBar.style.width = p.fatigue + '%'; ftBar.parentElement.className = 'meter ft' + (p.fatigue > 60 ? ' bad' : '');
  const wn = D.WEATHER.find((x) => x.id === s.weather); const ph = (s.t % D.DAY) / D.DAY; dayTxt.textContent = `${s.day}일차 ${ph > 0.78 ? '🌙' : s.weather === 'rain' ? '🌧️' : s.weather === 'cloud' ? '☁️' : s.weather === 'hot' ? '🔥' : '☀️'} ${wn ? wn.name : ''}${p.sick > 0 ? ' 🤒몸살' : ''}`;
  seedBtn.textContent = ''; seedBtn.append(ico(G, G.seed, 22), h('span', null, D.CROPS[G.seed].name)); document.getElementById('restb').className = 'sb' + (p.resting ? ' on' : '');
  const ht = hintText(s); hint.textContent = ht; hint.classList.toggle('on', !!ht && !G.screen); void force;
};

// ---------- 반복 ----------
let last = 0, saveT = 0, tgtT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now; G.tick(dt); requestAnimationFrame(frame);
}
G.tick = (dt) => {
  const s = G.s;
  if (s && !title.parentNode) { /* 제목 화면이 아닐 때만 */ }
  if (s && !G.titleOpen) {
    const pause = !!G.screen || s.ended;
    if (!pause) {
      move(dt); S.advance(s, dt); if (G.hold) { aHoldT += dt; if (aHoldT > 0.45) { aHoldT -= 0.38; G.doA(); } }
      saveT += dt; if (saveT > 15) { saveT = 0; G.save(); }
    }
    R.update(dt, s); R.draw(s, G.pl, { target: G.target });
    tgtT += dt; hudT += dt; if (tgtT > 0.08) { tgtT = 0; G.target = G.screen ? null : findTarget(); prompt.textContent = G.target ? `A  ${G.target.label}` : ''; prompt.classList.toggle('on', !!G.target); aBtn.querySelector('small').textContent = G.target ? G.target.label.slice(0, 8) : ''; }
    if (hudT > 0.25) { hudT = 0; G.hudUpdate(); watchEvents(); }
    if (s.ended && !G.ended) showEnd();
  } else if (s) R.draw(s, G.pl, {});
};
function watchEvents() {
  const s = G.s; if (s.day !== lastDay) { lastDay = s.day; const wn = D.WEATHER.find((x) => x.id === s.weather); banner.textContent = `${s.day}일차 · ${wn.name}`; banner.classList.remove('hidden'); banner.classList.add('show'); setTimeout(() => banner.classList.remove('show'), 1800); setTimeout(() => banner.classList.add('hidden'), 2400); G.save(); }
  let n = 0; for (const l of s.log) { if (l.t > lastLog && n < 3) { G.say(l.text, !/상해|떠났|못 주|지났|취소|몸살|힘이 빠|제한 시간/.test(l.text)); n++; lastLog = Math.max(lastLog, l.t); } else if (l.t > lastLog) { lastLog = Math.max(lastLog, l.t); } }
  if (s.level !== lastLevel) { if (lastLevel && s.level > lastLevel) sfx.ok(); lastLevel = s.level; }
}
function move(dt) {
  const s = G.s, pl = G.pl; const { x: sx, y: sy } = G.stick; const m = Math.hypot(sx, sy); pl.moving = m > 0.12;
  if (pl.moving) { if (s.p.resting) S.setResting(s, false); const sp = 58 * (s.p.sick > 0 ? 0.55 : 1) * (s.p.stamina <= 0 ? 0.85 : 1) * (s.weather === 'rain' ? 0.92 : 1); const vx = (sx / Math.max(1, m)) * sp * dt, vy = (sy / Math.max(1, m)) * sp * dt; if (!blocked(world, pl.x + vx, pl.y)) pl.x += vx; if (!blocked(world, pl.x, pl.y + vy)) pl.y += vy; pl.dir = Math.abs(sx) > Math.abs(sy) ? (sx < 0 ? 'left' : 'right') : (sy < 0 ? 'up' : 'down'); }
}

// ---------- 새 게임 / 제목 / 끝 ----------
function startGame(s, seed, pl) { G.s = s; G.seed = seed || 'lettuce'; G.ended = false; G.titleOpen = false; G.pl.x = pl ? pl.x : 7 * TS + 8; G.pl.y = pl ? pl.y : 9 * TS; G.pl.dir = 'down'; lastDay = s.day; lastLog = s.log.length ? s.log[s.log.length - 1].t : 0; lastLevel = s.level; title.classList.add('hidden'); title.innerHTML = ''; G.close(); G.hudUpdate(); if (!pl) { G.open('help'); } }
function showTitle() {
  G.titleOpen = true; title.classList.remove('hidden'); title.innerHTML = '';
  let saved = null; try { saved = JSON.parse(localStorage.getItem(SAVE) || 'null'); } catch (e) { saved = null; }
  const box = h('div', { class: 'tbox' }, h('div', { class: 'logo' }, h('div', { class: 'l1' }, '모락모락'), h('div', { class: 'l2' }, '농장 대작전')), h('p', { class: 'tag' }, '키우고 · 만들고 · 팔아서 매출 1위 농장이 되어 보세요!'));
  if (saved && saved.s && !saved.s.ended) box.append(h('button', { class: 'b pri big', onclick: () => { startGame(saved.s, saved.seed, saved.pl); } }, `▶ 이어하기 (${saved.s.day}일차 · 남은 ${mmss(S.timeLeft(saved.s))})`));
  box.append(h('button', { class: 'b sun big', onclick: () => newGameMenu(box) }, '🌱 새로 시작'), h('button', { class: 'b', onclick: () => { G.sound = !G.sound; try { localStorage.setItem(OPT, JSON.stringify({ sound: G.sound })); } catch (e) { /* */ } showTitle(); } }, G.sound ? '🔊 소리 켬' : '🔇 소리 끔'));
  box.append(h('p', { class: 'foot' }, '동물을 잡거나 팔지 않아요 · 모두 함께 지내는 평화로운 농장'));
  title.append(box);
}
function newGameMenu() {
  title.innerHTML = ''; const seed = Math.floor(Math.random() * 1e9); const rs = { rs: seed }; const picks = []; const pool = D.PERKS.slice(); while (picks.length < 3) { const i = Math.floor(S.rnd(rs) * pool.length); picks.push(pool.splice(i, 1)[0]); }
  let diff = 'normal', perk = picks[0].id;
  const diffRow = h('div', { class: 'seg' }); const perkRow = h('div', { class: 'perks' });
  const draw = () => { diffRow.innerHTML = ''; for (const [k, d] of Object.entries(D.DIFFS)) diffRow.append(h('button', { class: 'b' + (diff === k ? ' sun' : ''), onclick: () => { diff = k; draw(); } }, d.name)); perkRow.innerHTML = ''; for (const p of picks) perkRow.append(h('button', { class: 'perk' + (perk === p.id ? ' sel' : ''), onclick: () => { perk = p.id; draw(); } }, h('b', null, p.name), h('small', null, p.desc))); };
  draw();
  title.append(h('div', { class: 'tbox' }, h('h2', null, '이번 판 정하기'), h('p', { class: 'tag' }, '제한 시간 안에 모든 라이벌 농장보다 매출이 높아지면 승리! 판마다 라이벌과 시장이 달라요.'), h('h3', null, '난이도'), diffRow, h('h3', null, '시작 특별 카드 (하나 고르기)'), perkRow, h('button', { class: 'b pri big', onclick: () => startGame(S.newGame({ diff, perk, seed }), 'lettuce', null) }, '🚜 농장 시작!'), h('button', { class: 'b', onclick: showTitle }, '← 돌아가기')));
}
function showEnd() {
  G.ended = true; const s = G.s; const e = s.ended; try { localStorage.removeItem(SAVE); } catch (er) { /* */ }
  const top = S.board(s); const me = top.find((r) => r.me);
  G.close(); modal.classList.remove('hidden'); modal.innerHTML = '';
  const body = h('div', { class: 'body end' }, h('div', { class: 'big' }, e.won ? '🏆' : '😢'), h('h2', null, e.won ? '매출 1위 달성! 승리!' : e.gaveUp ? '이번 판을 포기했어요' : '아쉬워요, 시간이 다 됐어요'), h('p', { class: 'note' }, e.won ? `${s.day}일차(${mmss(e.t)})에 모든 라이벌 농장을 앞질렀어요!` : `최종 순위 ${me.rank}위 · 1위와 ${G$(top[0].rev - me.rev)} 차이였어요.`),
    h('div', { class: 'sec' }, h('h3', null, '최종 순위'), ...top.map((r) => h('div', { class: 'rank' + (r.me ? ' me' : '') }, h('span', { class: 'no' }, r.rank), h('div', { class: 'nm' }, h('b', null, r.name)), h('span', null, G$(r.rev))))), h('div', { class: 'sec' }, h('h3', null, '내 농장 기록'), ...statsRows(G)),
    e.won ? null : h('p', { class: 'note' }, '다음 판 팁: 레벨 4에 트럭과 배송 기사를 일찍 마련하고, 여러 가지 판매처(시장·거래처·마트·인터넷)로 나눠 팔아 보세요. 재고가 상하지 않게 가공해서 파는 것도 좋아요.'), h('button', { class: 'b pri big', onclick: () => { modal.classList.add('hidden'); modal.innerHTML = ''; showTitle(); } }, '다시 도전하기'));
  modal.append(h('div', { class: 'panel' }, h('header', null, h('h2', null, e.won ? '🎉 결과' : '결과')), body));
}

// ---------- 시작 ----------
window.addEventListener('resize', () => R.resize());
window.addEventListener('blur', releaseA);
document.addEventListener('visibilitychange', () => { if (document.hidden) { releaseA(); G.save(); } });
window.addEventListener('pagehide', () => { releaseA(); G.save(); });
document.addEventListener('contextmenu', (e) => e.preventDefault());
showTitle(); requestAnimationFrame(frame);
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== 'localhost') navigator.serviceWorker.register('sw.js').catch(() => {});
