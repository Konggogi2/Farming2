// 가게·창고·설비 같은 창(모달) 화면들. 각 함수는 { title, body } 를 돌려줘요. 화면은 G(게임 컨트롤러)를 통해 상태를 바꿔요.
import { h } from './util.js';
import * as D from './data.js';
import * as S from './sim.js';
import { iconOf } from './render.js';

const { ITEMS, CROPS, HOUSES, MACHINES, RECIPES, UPGRADES, WORKERS, CATS } = D;
export const G$ = (n) => Math.round(n).toLocaleString('ko-KR') + 'G';
export const mmss = (sec) => { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
const icoCache = {};
export const ico = (G, id, size = 28) => { const key = id + size; if (!icoCache[key]) icoCache[key] = iconOf(G.art, id).toDataURL(); return h('img', { class: 'ico', src: icoCache[key], width: size, height: size, alt: '' }); };
const btn = (label, fn, cls = '', dis = false) => h('button', { class: 'b ' + cls + (dis ? ' off' : ''), onclick: (e) => { e.stopPropagation(); if (!dis) fn(); } }, label);
const sec = (title, ...kids) => h('div', { class: 'sec' }, h('h3', null, title), ...kids);
const bar = (v, max, cls = '') => h('div', { class: 'meter ' + cls }, h('i', { style: { width: Math.max(0, Math.min(100, (v / max) * 100)) + '%' } }));
const row = (left, right, cls = '') => h('div', { class: 'row ' + cls }, h('div', { class: 'l' }, left), h('div', { class: 'r' }, right));
const note = (t) => h('p', { class: 'note' }, t);
const pct = (f) => Math.round(f * 100) + '%';
const trendMark = (s, id) => { const r = s.market.idx[id]; return r > 1.08 ? '▲' : r < 0.92 ? '▼' : '─'; };
const trendCls = (s, id) => { const r = s.market.idx[id]; return r > 1.08 ? 'up' : r < 0.92 ? 'down' : ''; };
const lvLock = (s, lv) => (lv > s.level ? ` (레벨 ${lv}에 열려요)` : '');

function capBars(G) {
  const s = G.s; return h('div', { class: 'caps' }, h('div', null, `🎒 배낭 ${S.total(s, 'pack')}/${S.cap(s, 'pack')}`, bar(S.total(s, 'pack'), S.cap(s, 'pack'))), h('div', null, `🏚️ 창고 ${S.total(s, 'store')}/${S.cap(s, 'store')}${s.up.cold ? ' ❄️' : ''}`, bar(S.total(s, 'store'), S.cap(s, 'store'))));
}
function stockRows(G, pool, buttons) {
  const s = G.s; const ids = Object.keys(s.inv[pool]).sort((a, b) => ITEMS[a].cat.localeCompare(ITEMS[b].cat)); if (!ids.length) return [note('비어 있어요.')];
  return ids.map((id) => { const n = S.count(s, pool, id); const f = S.avgFresh(s, pool, id); return row([ico(G, id), h('div', { class: 'nm' }, h('b', null, ITEMS[id].name), h('small', null, `${Math.round(n)}개 · 신선도 ${pct(f)}${ITEMS[id].noSell ? '' : ' · 약 ' + G$(S.unitPrice(s, id) * S.freshMult(f))}`), bar(f, 1, f < 0.35 ? 'bad' : ''))], buttons(id, n)); });
}

export const SCREENS = {
  // ---------- 창고 ----------
  barn(G) {
    const s = G.s; return { title: '🏚️ 창고', body: h('div', null, capBars(G),
      btn('🎒 → 🏚️ 배낭 물건 모두 맡기기', () => { const n = S.moveAll(s, 'pack', 'store'); G.say(n ? `${n}개를 창고에 맡겼어요.` : '맡길 물건이 없어요.', n > 0); }, 'pri'),
      sec('창고에 있는 물건', ...stockRows(G, 'store', (id, n) => h('div', { class: 'bs' }, btn('1', () => { S.moveItem(s, 'store', 'pack', id, 1); G.refresh(); }), btn('5', () => { S.moveItem(s, 'store', 'pack', id, 5); G.refresh(); }), btn('전부', () => { S.moveItem(s, 'store', 'pack', id, n); G.refresh(); })))),
      sec('배낭에 있는 물건', ...stockRows(G, 'pack', (id, n) => h('div', { class: 'bs' }, btn('1', () => { S.moveItem(s, 'pack', 'store', id, 1); G.refresh(); }), btn('전부', () => { S.moveItem(s, 'pack', 'store', id, n); G.refresh(); })))),
      note('창고가 가득 차면 일꾼이 거둔 작물을 둘 곳이 없어요. 오래 두면 상하니 잘 팔아 주세요.')) };
  },
  // ---------- 집 ----------
  home(G) {
    const s = G.s; const foods = []; for (const pool of ['pack', 'store']) for (const id of Object.keys(s.inv[pool])) if (ITEMS[id].energy > 0) foods.push([pool, id]);
    return { title: '🏠 내 집', body: h('div', null,
      row([h('b', null, '체력'), bar(s.p.stamina, s.p.maxSt)], `${Math.round(s.p.stamina)}/${s.p.maxSt}`), row([h('b', null, '피로'), bar(s.p.fatigue, 100, s.p.fatigue > 60 ? 'bad' : '')], s.p.sick > 0 ? '몸살!' : `${Math.round(s.p.fatigue)}%`),
      h('div', { class: 'grid2' }, btn('💤 쉬기', () => { S.setResting(s, !s.p.resting); G.close(); G.say(s.p.resting ? '쉬는 중... 움직이면 멈춰요.' : '쉬기를 멈췄어요.', true); }, ''), btn('🛏️ 푹 자기 (아침까지)', () => { G.sleep(); }, 'pri')),
      note('자면 체력이 가득 차고 몸살도 나아요. 대신 남은 하루 시간이 지나가요.'),
      S.onlineOn(s) ? btn(`💻 인터넷 주문 확인 (${s.online.orders.length}건)`, () => G.open('online'), 'sun') : note('컴퓨터·포장대를 장비상에서 사면 인터넷으로도 팔 수 있어요.'),
      sec('먹기', ...(foods.length ? foods.map(([pool, id]) => row([ico(G, id), h('div', { class: 'nm' }, h('b', null, ITEMS[id].name), h('small', null, `${pool === 'pack' ? '배낭' : '창고'} ${Math.round(S.count(s, pool, id))}개 · 체력 +${ITEMS[id].energy}`))], btn('먹기', () => { G.act(S.eat(s, id, pool)); }))) : [note('먹을 수 있는 음식이 없어요. 작물이나 가공품이 있으면 먹고 힘을 낼 수 있어요.')])),
      sec('내 농장 기록', ...statsRows(G))) };
  },
  // ---------- 인터넷 주문 ----------
  online(G) {
    const s = G.s; const o = s.online;
    return { title: '💻 인터넷 주문', body: h('div', null, row('평점', '⭐'.repeat(Math.round(o.rating)) + ` ${o.rating.toFixed(1)}`), row('택배 상자', `${Math.round(S.have(s, 'box'))}개`), row('배송 중', `${o.ship.length}건`),
      btn('📦 상자 5개 사기 (30G)', () => { G.act(S.buyItem(s, 'box', 5, 'pack')); }),
      sec('광고', h('div', { class: 'grid3' }, ...[1, 2, 3].map((l) => btn(['', '소 200G', '중 500G', '대 1,200G'][l], () => G.act(S.buyAds(s, l)), 'sun'))), note(s.t < o.adsUntil ? `광고 중! ${mmss(o.adsUntil - s.t)} 남음` : '광고를 하면 주문이 늘어요.')),
      sec(`받은 주문 ${o.orders.length}건`, ...(o.orders.length ? o.orders.map((ord) => { const ok = S.canPack(s, ord); return h('div', { class: 'card' }, ...ord.lines.map(([it, q]) => row([ico(G, it, 24), `${ITEMS[it].name} ×${q}`], h('span', { class: S.have(s, it) >= q ? 'ok' : 'no' }, `보유 ${Math.round(S.have(s, it))}`))), row(`보상 ${G$(ord.reward)}`, `기한 ${mmss(ord.due - s.t)}`), btn(ok ? '📦 포장해서 보내기' : '재료나 상자가 모자라요', () => { G.act(S.packOrder(s, ord.id)); }, ok ? 'pri' : '', !ok)); }) : [note('아직 주문이 없어요. 하루가 지나면 새 주문이 와요. 평점과 광고, 영업 직원이 주문을 늘려요.')]))) };
  },
  // ---------- 사육장 ----------
  house(G, p) {
    const s = G.s; const d = HOUSES[p.id]; const hh = s.houses[p.id]; const pi = ico(G, d.prod);
    if (!hh) return { title: `🏡 ${d.name}`, body: h('div', null, row('건설비', G$(d.build)), note(`${d.animal} 친구들이 지낼 집이에요${lvLock(s, d.lv)}. 동물들은 먹이를 먹고 ${ITEMS[d.prod].name}을(를) 만들어 줘요. 아이들도 안심하고 키울 수 있는 평화로운 목장이에요.`), btn('🔨 짓기', () => G.act(S.buildHouse(s, p.id)), 'pri', d.lv > s.level)) };
    return { title: `🏡 ${d.name}`, body: h('div', null, row(`${d.animal} 식구`, `${hh.animals}/${S.houseCap(hh)}마리`), row(['먹이', bar(hh.feed, S.feedCap(hh) || 1, hh.feed < 1 ? 'bad' : '')], `${hh.feed.toFixed(1)}/${S.feedCap(hh)}`), row([pi, ITEMS[d.prod].name + ' (모아 둔 것)'], `${Math.floor(hh.prod)}/12`),
      h('div', { class: 'grid2' }, btn('🌾 먹이 주기', () => G.act(S.feedHouse(s, p.id)), 'pri'), btn('🧺 모으기', () => G.act(S.collectHouse(s, p.id)), 'sun')),
      note(`사료 ${S.count(s, 'pack', 'feed')}개 보유(배낭). 사료는 종묘상에서 사요. 사료 1개로 ${ITEMS[d.prod].name} 2개를 만들 수 있어요.`),
      btn(`➕ ${d.animal} 식구 늘리기 (${G$(S.animalCost(s, p.id))})`, () => G.act(S.buyAnimal(s, p.id)), '', hh.animals >= S.houseCap(hh)),
      hh.lvl < 2 ? btn(`🏗️ 집 넓히기 → 8마리 (${G$(Math.round(d.build * 1.2))})`, () => G.act(S.upgradeHouse(s, p.id))) : note('집이 가장 넓은 상태예요.'),
      note(`한 마리가 약 ${d.every}초마다 하나씩 만들어요. 제품은 12개까지 쌓여요. 직원 '목장 도우미'나 '자동 수거기'가 대신 모아 줘요.`)) };
  },
  // ---------- 설비 ----------
  machine(G, p) {
    const s = G.s; const d = MACHINES[p.id]; const m = s.machines[p.id];
    if (!m) return { title: `⚙️ ${d.name}`, body: h('div', null, note(`재료를 가공해서 더 비싼 상품을 만들어요${lvLock(s, d.lv)}.`), row('가격', G$(S.machineCost(s, p.id))), btn('🔨 설치하기', () => G.act(S.buyMachine(s, p.id)), 'pri', d.lv > s.level), sec('만들 수 있는 것', ...Object.entries(RECIPES).filter(([, r]) => r.m === p.id).map(([id, r]) => recipeLine(G, id, r)))) };
    const b = S.batchOf(m); const arts = s.workers.artisan | 0;
    return { title: `⚙️ ${d.name} (x${b})`, body: h('div', null,
      m.job ? row(['작업 중: ', ico(G, RECIPES[m.job.rid].out[0], 24), ITEMS[RECIPES[m.job.rid].out[0]].name], `${Math.ceil(m.job.left)}초`) : note('쉬고 있어요. 만들 것을 고르세요.'),
      m.out ? h('div', { class: 'card' }, row([ico(G, m.out.item), `완성! ${ITEMS[m.out.item].name} ×${m.out.q}`], btn('가져오기', () => G.act(S.collectMachine(s, p.id)), 'pri'))) : null,
      sec('요리법', ...Object.entries(RECIPES).filter(([, r]) => r.m === p.id).map(([id, r]) => { const can = S.canCraft(s, p.id, id); return h('div', { class: 'card' }, recipeLine(G, id, r, b), h('div', { class: 'grid2' }, btn('▶ 만들기', () => G.act(S.startCraft(s, p.id, id)), 'pri', !can), arts ? btn(m.auto === id ? '✅ 자동 제작 중' : '🔁 자동 제작', () => { G.act(S.setAutoRecipe(s, p.id, m.auto === id ? null : id)); }, m.auto === id ? 'sun' : '') : btn('🔁 직원 필요', () => {}, '', true))); }) ),
      m.lvl < 2 ? btn(`📈 한 번에 ${D.BATCH[m.lvl + 1]}배로 늘리기 (${G$(S.upgradeMachineCost(s, p.id))})`, () => G.act(S.upgradeMachine(s, p.id))) : note('가장 큰 용량이에요.'),
      note('재료는 창고와 배낭에서 가져가요. 가공 기술자를 고용하면 자동 제작을 맡길 수 있어요.')) };
  },
  // ---------- 종묘상 ----------
  seedshop(G) {
    const s = G.s; const set = new Set(s.auto.crops);
    return { title: '🌱 종묘상', body: h('div', null,
      sec('사료·상자', h('div', { class: 'grid3' }, btn('사료 ×10 (40G)', () => G.act(S.buyItem(s, 'feed', 10, 'pack'))), btn('사료 ×30 (120G)', () => G.act(S.buyItem(s, 'feed', 30, 'pack'))), btn('상자 ×5 (30G)', () => G.act(S.buyItem(s, 'box', 5, 'pack')))), note('사서 배낭에 담아요. 창고에 맡겨 두면 목장 도우미가 써요.')),
      sec('내가 심을 씨앗', ...Object.entries(CROPS).map(([id, c]) => { const lock = c.lv > s.level; return h('div', { class: 'card seedrow' + (G.seed === id ? ' sel' : '') }, row([ico(G, id), h('div', { class: 'nm' }, h('b', null, c.name), h('small', null, `씨앗 ${c.seed}G · ${c.grow}초 · 수확 ${c.yield}개 · ${CATS[c.cat]} · 값 약 ${c.price}G${lock ? ' · 레벨 ' + c.lv : ''}`))], h('div', { class: 'bs' }, btn(G.seed === id ? '선택됨' : '선택', () => { G.seed = id; G.save(); G.refresh(); }, G.seed === id ? 'sun' : '', lock), btn(set.has(id) ? '🔁✔' : '🔁', () => { const l = new Set(s.auto.crops); if (l.has(id)) l.delete(id); else l.add(id); S.setAutoCrops(s, [...l]); G.refresh(); }, set.has(id) ? 'pri' : '', lock)))); }),
      note('🔁 표시한 작물(최대 3개)은 농장 일꾼이 자동으로 심어요. 수확물은 창고에 쌓여요.'))) };
  },
  // ---------- 장비상 ----------
  equip(G) {
    const s = G.s; const np = S.nextPlots(s);
    return { title: '🔧 장비상', body: h('div', null,
      sec('밭 넓히기', np ? row(`${np.n}칸으로 (지금 ${s.plots.filter((q) => q.u).length}칸)`, btn(G$(np.cost), () => G.act(S.buyPlots(s)), 'pri')) : note('밭이 가장 넓어요!')),
      sec('설비·업그레이드', ...Object.entries(UPGRADES).map(([k, u]) => { const n = S.upNext(s, k); const c = S.upCost(s, k); return row([h('div', { class: 'nm' }, h('b', null, `${u.name} ${S.upLevel(s, k) + 1 > u.steps.length - 1 ? '(최고)' : `Lv.${S.upLevel(s, k)}`}`), h('small', null, u.desc + (n ? ` → ${k === 'cold' || k === 'tractor' || k === 'combine' || k === 'feeder' || k === 'milker' || k === 'truck' || k === 'computer' ? '설치' : n.v}${lvLock(s, n.lv)}` : '')))], n ? btn(G$(c), () => G.act(S.buyUpgrade(s, k)), 'pri', n.lv > s.level) : h('span', { class: 'ok' }, '✔')); })),
      sec('가공 설비 (농장의 작업대 앞에서 설치해도 돼요)', ...Object.entries(MACHINES).map(([id, m]) => row([h('div', { class: 'nm' }, h('b', null, m.name), h('small', null, [...new Set(Object.values(RECIPES).filter((r) => r.m === id).map((r) => ITEMS[r.out[0]].name))].slice(0, 4).join(', ') + lvLock(s, m.lv)))], s.machines[id] ? h('span', { class: 'ok' }, '설치됨') : btn(G$(S.machineCost(s, id)), () => G.act(S.buyMachine(s, id)), 'pri', m.lv > s.level))))) };
  },
  // ---------- 직원 소개소 ----------
  hr(G) {
    const s = G.s; const hasTruck = (s.up.truck | 0) > 0;
    return { title: '🧑‍🌾 직원 소개소', body: h('div', null, row('오늘의 일당 합계', G$(S.wagesPerDay(s))), note('일당은 하루가 끝날 때 내요. 돈이 모자라면 직원들이 힘이 빠져 일이 느려져요.'),
      ...Object.entries(WORKERS).map(([id, w]) => { const n = s.workers[id] | 0; return h('div', { class: 'card' }, row([h('div', { class: 'nm' }, h('b', null, `${w.name} ${n}/${w.max}`), h('small', null, w.desc + lvLock(s, w.lv)))], h('div', { class: 'bs' }, btn(`고용 ${G$(w.fee)} (일당 ${S.wageOf(s, id)}G)`, () => G.act(S.hire(s, id)), 'pri', n >= w.max || w.lv > s.level), n ? btn('퇴사', () => G.act(S.fire(s, id)), 'bad') : null))); }),
      ((s.workers.driver | 0) > 0 && hasTruck) ? consignSection(G) : note('트럭을 사고 배송 기사를 고용하면 창고 물건을 시장에 대신 팔아 줘요(수수료 12%). 거래처·마트 납품도 맡아요.')) };
  },
  clinic(G) {
    const s = G.s; return { title: '🏥 병원', body: h('div', null, note('너무 무리하면 몸살이 나요. 체력이 바닥인데도 일하면 피로가 쌓여요.'), row('피로', `${Math.round(s.p.fatigue)}%${s.p.sick > 0 ? ' (몸살)' : ''}`), btn('💊 진료받기 (80G)', () => G.act(S.hospital(s)), 'pri')) };
  },
  // ---------- 시장 ----------
  market(G) {
    const s = G.s; const ids = Object.keys(s.inv.pack).filter((id) => !ITEMS[id].noSell); const total = ids.reduce((a, id) => a + S.unitPrice(s, id) * S.freshMult(S.avgFresh(s, 'pack', id)) * S.count(s, 'pack', id), 0);
    return { title: '🧺 시장', body: h('div', null, capBars(G), note('많이 팔수록 그 물건 값이 내려가요. 한동안 지나면 다시 올라요. 여러 가지를 나눠 팔고, 마트·거래처·인터넷도 활용해 보세요.'),
      ids.length ? btn(`🧺 전부 팔기 (약 ${G$(total)})`, () => { let t = 0; for (const id of ids) { const r = S.sellMarket(s, id, S.count(s, 'pack', id)); if (r.ok) t += r.money; } G.say(`+${G$(t)} 벌었어요!`, true); }, 'sun') : null,
      ...(ids.length ? ids.map((id) => { const n = S.count(s, 'pack', id); const f = S.avgFresh(s, 'pack', id); const up = S.unitPrice(s, id) * S.freshMult(f); return row([ico(G, id), h('div', { class: 'nm' }, h('b', null, ITEMS[id].name), h('small', null, `${Math.round(n)}개 · 1개 ${G$(up)} `, h('span', { class: trendCls(s, id) }, trendMark(s, id)), ` · 신선도 ${pct(f)}`))], h('div', { class: 'bs' }, btn('1', () => G.act(S.sellMarket(s, id, 1))), btn('전부', () => G.act(S.sellMarket(s, id, n)), 'pri'))); }) : [note('배낭에 팔 물건이 없어요. 창고에서 꺼내 오세요.')])) };
  },
  // ---------- 마트 ----------
  mart(G) {
    const s = G.s; const m = s.mart;
    if (!m.found) return { title: '🏬 해피 마트', body: h('div', null, note('마을 마트가 정기 납품 업체를 찾고 있어요. 매일 정해진 양을 꾸준히 사 줘서 안정적이에요(값은 시세의 92%, 시세가 떨어지지 않아요).'), btn(s.level >= D.MART.lv ? '🤝 거래 시작하기' : `레벨 ${D.MART.lv}부터 거래할 수 있어요`, () => G.act(S.discoverClient(s, 'mart')), 'pri', s.level < D.MART.lv)) };
    const known = Object.keys(s.known).filter((id) => ITEMS[id] && !ITEMS[id].noSell).sort((a, b) => ITEMS[b].price - ITEMS[a].price);
    return { title: '🏬 해피 마트', body: h('div', null, note(`하루 납품 한도는 품목당 ${S.martQuotaCap(s)}개예요(레벨이 오르면 늘어요). 배송 기사가 있으면 창고에서 알아서 납품해요.`),
      sec('오늘의 납품', ...(Object.keys(m.quota).length ? Object.entries(m.quota).map(([id, q]) => { const done = m.done[id] || 0; return row([ico(G, id), h('div', { class: 'nm' }, h('b', null, ITEMS[id].name), h('small', null, `${done}/${q}개 · 개당 ${G$(S.martPrice(s, id))}`))], h('div', { class: 'bs' }, btn('납품', () => G.act(S.martDeliver(s, id, 'pack')), 'pri', done >= q), btn('−', () => { S.setMartQuota(s, id, Math.max(0, q - 3)); G.refresh(); }), btn('+', () => { S.setMartQuota(s, id, q + 3); G.refresh(); }))); }) : [note('납품할 품목을 고르세요(최대 4개).')])),
      sec('품목 추가', h('div', { class: 'chips' }, ...known.filter((id) => !m.quota[id]).slice(0, 24).map((id) => h('button', { class: 'chip', onclick: () => { G.act(S.setMartQuota(s, id, 6)); } }, ico(G, id, 20), ITEMS[id].name))))) };
  },
  // ---------- 거래처 ----------
  client(G, p) {
    const s = G.s; const d = S.clientDef(p.id); const cl = s.clients.find((c) => c.id === p.id);
    if (!cl.found) return { title: `🏢 ${d.name}`, body: h('div', null, note(`${d.name}은(는) ${d.likes.map((c) => CATS[c]).join('·')} 같은 물건을 좋아해요. 인사를 나누면 주문을 받을 수 있어요. 좋은 거래처는 시장보다 값을 더 쳐줘요!`), btn('🤝 인사하기 (거래처 찾기)', () => G.act(S.discoverClient(s, p.id)), 'pri')) };
    const o = cl.order;
    return { title: `🏢 ${d.name}`, body: h('div', null, row('신뢰', '💛'.repeat(Math.min(5, cl.trust)) + ` ${cl.trust}`), note(`좋아하는 것: ${d.likes.map((c) => CATS[c]).join(', ')} · 값 ×${d.prem}`),
      o ? h('div', { class: 'card' }, h('b', null, '현재 주문'), ...o.lines.map(([it, q]) => row([ico(G, it, 24), `${ITEMS[it].name} ×${q}`], h('span', { class: S.count(s, 'pack', it) >= q ? 'ok' : 'no' }, `배낭 ${Math.round(S.count(s, 'pack', it))} / 창고 ${Math.round(S.count(s, 'store', it))}`))), row(`보상 ${G$(o.reward)}`, `기한 ${mmss(o.due - s.t)}`), note('신선도 50% 이상인 물건만 받아요.'), btn('📦 납품하기 (배낭에서)', () => G.act(S.deliverOrder(s, p.id, ['pack'])), 'pri', !S.orderReady(s, cl, ['pack']))) : note('지금은 주문이 없어요. 조금 있으면 새 주문이 와요.')) };
  },
  // ---------- 게시판 ----------
  board(G) {
    const s = G.s; const rows = S.board(s); const max = Math.max(...rows.map((r) => r.rev), 1);
    return { title: '📋 마을 게시판', body: h('div', null, sec('매출 순위', ...rows.map((r) => h('div', { class: 'rank' + (r.me ? ' me' : '') }, h('span', { class: 'no' }, r.rank), h('div', { class: 'nm' }, h('b', null, r.name), bar(r.rev, max, r.me ? 'me' : '')), h('span', null, G$(r.rev))))), note(`1위가 되면 게임이 끝나요! 남은 시간 ${mmss(S.timeLeft(s))}`),
      sec('시장 소식', ...(s.market.trends.length ? s.market.trends.map((t) => note('📣 ' + t.text + ` (${mmss(t.until - s.t)} 남음)`)) : [note('특별한 소식은 없어요.')])),
      sec('최근 일어난 일', ...s.log.slice(-8).reverse().map((l) => note(`· ${l.text}`)))) };
  },
  // ---------- 배낭 ----------
  inventory(G) {
    const s = G.s; return { title: '🎒 배낭', body: h('div', null, capBars(G), row('💧 물뿌리개', `${s.p.water}/${UPGRADES.can.steps[s.up.can | 0].v}`), row('체력', `${Math.round(s.p.stamina)}/${s.p.maxSt}`), sec('들고 있는 물건', ...stockRows(G, 'pack', (id) => ITEMS[id].energy > 0 ? btn('먹기', () => G.act(S.eat(s, id, 'pack'))) : h('span'))), note('물건은 창고에 맡기거나 시장·거래처로 가져가 팔아요.')) };
  },
  // ---------- 주문 요약 ----------
  orders(G) {
    const s = G.s; return { title: '📜 해야 할 일', body: h('div', null,
      sec('거래처 주문', ...(s.clients.some((c) => c.found) ? s.clients.filter((c) => c.found).map((c) => { const d = S.clientDef(c.id); return c.order ? h('div', { class: 'card' }, h('b', null, d.name), ...c.order.lines.map(([it, q]) => row([ico(G, it, 22), `${ITEMS[it].name} ×${q}`], `${Math.round(S.have(s, it))}개 보유`)), row(`보상 ${G$(c.order.reward)}`, `기한 ${mmss(c.order.due - s.t)}`)) : row(d.name, '주문 대기 중'); }) : [note('마을의 식당·카페·학교 등을 찾아가 인사하면 주문을 받아요.')])),
      S.onlineOn(s) ? sec('인터넷 주문', note(`${s.online.orders.length}건 대기 · 배송 중 ${s.online.ship.length}건 (집 컴퓨터에서 포장)`)) : null,
      s.mart.found ? sec('마트 납품', ...(Object.keys(s.mart.quota).length ? Object.entries(s.mart.quota).map(([id, q]) => row([ico(G, id, 22), ITEMS[id].name], `${s.mart.done[id] || 0}/${q}`)) : [note('납품 품목을 정해 보세요.')])) : null) };
  },
  seedpick(G) {
    const s = G.s; return { title: '🌱 무엇을 심을까요?', body: h('div', null, ...Object.entries(CROPS).map(([id, c]) => { const lock = c.lv > s.level; return h('div', { class: 'card' }, row([ico(G, id), h('div', { class: 'nm' }, h('b', null, c.name), h('small', null, `씨앗 ${c.seed}G · ${c.grow}초 · ${c.yield}개 · 값 ${c.price}G${lock ? ' · 레벨 ' + c.lv : ''}`))], btn('이걸로!', () => { G.seed = id; G.save(); G.close(); G.say(`${c.name}을(를) 심을 씨앗으로 골랐어요.`, true); }, 'pri', lock))); })) };
  },
  menu(G) {
    return { title: '☰ 메뉴', body: h('div', null, btn('▶ 계속하기', () => G.close(), 'pri'), btn('📖 게임 방법', () => G.open('help')), btn('📋 순위 보기', () => G.open('board')), btn(G.sound ? '🔊 소리 켜짐 (누르면 끔)' : '🔇 소리 꺼짐 (누르면 켬)', () => { G.sound = !G.sound; try { localStorage.setItem('farmgame-opt-v1', JSON.stringify({ sound: G.sound })); } catch (e) { /* */ } G.refresh(); }), btn('💾 저장하고 처음 화면으로', () => G.toTitle()), btn('🏳️ 이번 판 포기하기', () => { if (confirm('이번 판을 포기할까요?')) G.giveUp(); }, 'bad'), note('자동으로 저장돼요. 게임 시간은 화면을 켜고 플레이할 때만 흘러요.')) };
  },
  help(G) {
    return { title: '📖 게임 방법', body: h('div', { class: 'help' },
      h('p', null, h('b', null, '목표'), ' 다른 농장들보다 먼저 ', h('b', null, '누적 매출 1위'), '를 달성하면 승리! 제한 시간 안에 못 하면 져요.'),
      h('p', null, h('b', null, '움직이기'), ' 왼쪽 아래 둥근 조이스틱으로 걷고, 오른쪽 아래 ', h('b', null, 'A 버튼'), '으로 앞에 있는 것을 해요. 밭에서는 A를 꾹 누르고 있으면 계속해요.'),
      h('p', null, h('b', null, '농사'), ' 빈 밭에 씨앗을 심고(💧 물주기) 다 자라면 수확해요. 물은 우물에서 채워요. 동물은 사료를 주면 달걀·우유·꿀 같은 걸 만들어요.'),
      h('p', null, h('b', null, '가공'), ' 작업대에서 재료를 가공하면 값이 훨씬 올라요. 직원이 자동으로 해 줘요.'),
      h('p', null, h('b', null, '팔기'), ' 시장은 많이 팔면 값이 떨어져요. 마을의 식당·카페·학교(거래처), 해피 마트 납품, 인터넷 주문도 있어요. 트럭과 배송 기사가 있으면 가만히 있어도 팔려요.'),
      h('p', null, h('b', null, '체력'), ' 일할 때마다 체력이 줄어요. 쉬거나 음식을 먹으면 회복돼요. 체력이 바닥인데 무리하면 몸살이 나요!'),
      h('p', null, h('b', null, '재고'), ' 물건은 시간이 지나면 신선도가 떨어지고 결국 상해요. 창고 칸이 가득 차면 새 수확물을 둘 곳이 없어요.'),
      h('p', null, '동물은 잡거나 팔지 않아요. 모두 함께 지내는 식구예요 🐮')) };
  },
};

function recipeLine(G, id, r, b = 1) {
  const s = G.s; const out = r.out[0];
  return h('div', null, row([ico(G, out, 28), h('div', { class: 'nm' }, h('b', null, `${ITEMS[out].name} ×${r.out[1] * b}`), h('small', null, `${r.time}초 · 개당 ${G$(ITEMS[out].price)}`))], ''), h('div', { class: 'ing' }, ...Object.entries(r.in).map(([it, q]) => h('span', { class: S.have(s, it) >= q * b ? 'ok' : 'no' }, ico(G, it, 18), `${ITEMS[it].name} ${Math.round(S.have(s, it))}/${q * b}`))));
}
function consignSection(G) {
  const s = G.s; const ids = Object.keys(s.known).filter((id) => ITEMS[id] && !ITEMS[id].noSell).sort((a, b) => ITEMS[b].price - ITEMS[a].price);
  return sec('🚚 시장 위탁 판매 (배송 기사)', note('켜 둔 물건은 창고에 남겨 둘 양을 뺀 나머지를 기사님이 시장에 팔아 줘요. 요리 재료는 넉넉히 남겨 두세요.'), ...ids.map((id) => { const keep = s.consign[id]; const on = keep != null; return row([ico(G, id, 22), `${ITEMS[id].name}`], h('div', { class: 'bs' }, btn(on ? '켬' : '끔', () => { S.setConsign(s, id, on ? null : 0); G.refresh(); }, on ? 'pri' : ''), on ? btn(`남길 양 ${keep}`, () => { const nx = keep >= 40 ? 0 : keep >= 20 ? 40 : keep >= 10 ? 20 : keep >= 5 ? 10 : 5; S.setConsign(s, id, nx); G.refresh(); }) : null)); }));
}
function statsRows(G) {
  const s = G.s; const st = s.stats; const r = (a, b) => row(a, b);
  return [r('누적 매출', G$(s.revenue)), r('시장', G$(st.market)), r('거래처', G$(st.contract)), r('마트', G$(st.mart)), r('인터넷', G$(st.online)), r('위탁 판매', G$(st.consign)), r('직원 일당', G$(st.wages)), r('상해서 버린 물건', `${Math.round(st.spoiled | 0)}개`)];
}
export { statsRows };
