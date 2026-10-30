// 게임 데이터: 작물, 동물, 가공품, 설비, 직원, 거래처, 라이벌. 가격 단위는 G(골드), 시간은 초.
export const DAY = 120;                       // 하루 길이(초)
export const DIFFS = { easy: { name: '여유롭게 (120분)', tl: 7200, rival: 0.85 }, normal: { name: '보통 (100분)', tl: 6000, rival: 1 }, hard: { name: '도전 (80분)', tl: 4800, rival: 0.8 } };
export const LEVELS = [0, 300, 1000, 2800, 6500, 14000, 28000, 50000];   // 누적 매출로 농장 레벨 결정

// 분류(시세·거래처 취향에 사용)
export const CATS = { veg: '채소', fruit: '과일', grain: '곡물', egg: '달걀', dairy: '유제품', wool: '털·실', honey: '꿀', bakery: '빵·과자', preserve: '잼·절임', drink: '주스', meal: '요리', craft: '공예', other: '기타' };

// 작물: seed 씨앗값, grow 자라는 시간, yield 수확량, water 필요한 물 주기 횟수, lv 해금 레벨
export const CROPS = {
  lettuce:   { name: '상추',   seed: 5,  grow: 36,  yield: 1, water: 1, lv: 0, price: 16, cat: 'veg',   shelf: 240,  energy: 8,  color: '#6bbf4a' },
  carrot:    { name: '당근',   seed: 8,  grow: 54,  yield: 2, water: 1, lv: 0, price: 14, cat: 'veg',   shelf: 480,  energy: 10, color: '#f28c28' },
  potato:    { name: '감자',   seed: 10, grow: 72,  yield: 2, water: 1, lv: 1, price: 20, cat: 'veg',   shelf: 900,  energy: 14, color: '#c9a66b' },
  corn:      { name: '옥수수', seed: 14, grow: 96,  yield: 3, water: 2, lv: 1, price: 18, cat: 'grain', shelf: 400,  energy: 14, color: '#f5d442' },
  wheat:     { name: '밀',     seed: 12, grow: 80,  yield: 4, water: 1, lv: 1, price: 12, cat: 'grain', shelf: 1200, energy: 0,  color: '#e3c26a' },
  tomato:    { name: '토마토', seed: 18, grow: 90,  yield: 3, water: 2, lv: 2, price: 26, cat: 'veg',   shelf: 360,  energy: 12, color: '#e0443a' },
  sunflower: { name: '해바라기', seed: 25, grow: 110, yield: 3, water: 2, lv: 2, price: 24, cat: 'other', shelf: 800,  energy: 6,  color: '#f2c200' },
  strawberry:{ name: '딸기',   seed: 30, grow: 120, yield: 3, water: 2, lv: 3, price: 44, cat: 'fruit', shelf: 280,  energy: 12, color: '#e5486a' },
  pumpkin:   { name: '호박',   seed: 40, grow: 150, yield: 2, water: 2, lv: 3, price: 90, cat: 'veg',   shelf: 900,  energy: 16, color: '#f0922b' },
  grape:     { name: '포도',   seed: 60, grow: 180, yield: 4, water: 2, lv: 4, price: 60, cat: 'fruit', shelf: 360,  energy: 14, color: '#7a4bb0' },
};

// 동물 주택. 동물은 먹이를 주면 제품을 만들어요. 모두 잡거나 팔지 않고 함께 지내요.
export const HOUSES = {
  coop:  { name: '닭장',     animal: '닭',   build: 250,  lv: 0, animalCost: 90,  prod: 'egg',     every: 36,  cap: 4, icon: 'egg' },
  pond:  { name: '오리 연못', animal: '오리', build: 500,  lv: 2, animalCost: 160, prod: 'duckegg', every: 32,  cap: 4, icon: 'egg' },
  cow:   { name: '외양간',   animal: '젖소', build: 900,  lv: 2, animalCost: 500, prod: 'milk',    every: 52,  cap: 4, icon: 'milk' },
  goat:  { name: '염소 우리', animal: '염소', build: 800,  lv: 3, animalCost: 380, prod: 'goatmilk',every: 48,  cap: 4, icon: 'milk' },
  hive:  { name: '벌통 마당', animal: '벌통', build: 600,  lv: 3, animalCost: 220, prod: 'honey',   every: 78,  cap: 4, icon: 'honey' },
  sheep: { name: '양 우리',   animal: '양',   build: 1000, lv: 4, animalCost: 420, prod: 'wool',    every: 90,  cap: 4, icon: 'wool' },
};
export const FEED = { price: 4, cat: 'other' };

// 모든 물건(작물 제외). price 기본 판매가, shelf 신선 유지 시간, energy 먹었을 때 회복 체력
export const ITEMS = {
  egg:      { name: '달걀',       cat: 'egg',      price: 18,  shelf: 500,  energy: 14 },
  duckegg:  { name: '오리알',     cat: 'egg',      price: 24,  shelf: 500,  energy: 16 },
  milk:     { name: '우유',       cat: 'dairy',    price: 30,  shelf: 200,  energy: 16 },
  goatmilk: { name: '염소젖',     cat: 'dairy',    price: 34,  shelf: 220,  energy: 16 },
  wool:     { name: '양털',       cat: 'wool',     price: 55,  shelf: 3000, energy: 0 },
  honey:    { name: '꿀',         cat: 'honey',    price: 70,  shelf: 6000, energy: 20 },
  butter:   { name: '버터',       cat: 'dairy',    price: 95,  shelf: 900,  energy: 22 },
  yogurt:   { name: '요거트',     cat: 'dairy',    price: 90,  shelf: 500,  energy: 24 },
  cheese:   { name: '치즈',       cat: 'dairy',    price: 185, shelf: 1500, energy: 30 },
  goatcheese:{ name: '염소치즈',  cat: 'dairy',    price: 210, shelf: 1500, energy: 30 },
  icecream: { name: '아이스크림', cat: 'dairy',    price: 260, shelf: 600,  energy: 34 },
  flour:    { name: '밀가루',     cat: 'grain',    price: 26,  shelf: 3000, energy: 0 },
  cornmeal: { name: '옥수수가루', cat: 'grain',    price: 36,  shelf: 3000, energy: 0 },
  bread:    { name: '빵',         cat: 'bakery',   price: 120, shelf: 400,  energy: 30 },
  cookie:   { name: '쿠키',       cat: 'bakery',   price: 60,  shelf: 900,  energy: 20 },
  honeycookie:{ name: '벌꿀 쿠키', cat: 'bakery',  price: 85,  shelf: 900,  energy: 24 },
  pie:      { name: '호박파이',   cat: 'bakery',   price: 390, shelf: 500,  energy: 40 },
  tart:     { name: '딸기 타르트', cat: 'bakery',  price: 190, shelf: 400,  energy: 34 },
  cornbread:{ name: '옥수수빵',   cat: 'bakery',   price: 130, shelf: 450,  energy: 30 },
  strawjam: { name: '딸기잼',     cat: 'preserve', price: 240, shelf: 3000, energy: 20 },
  grapejam: { name: '포도잼',     cat: 'preserve', price: 320, shelf: 3000, energy: 22 },
  sauce:    { name: '토마토소스', cat: 'preserve', price: 140, shelf: 2400, energy: 14 },
  pickle:   { name: '당근 피클',  cat: 'preserve', price: 75,  shelf: 2400, energy: 10 },
  grapejuice:{ name: '포도주스',  cat: 'drink',    price: 210, shelf: 700,  energy: 26 },
  tomatojuice:{ name: '토마토주스', cat: 'drink',  price: 100, shelf: 600,  energy: 20 },
  yarn:     { name: '양모실',     cat: 'craft',    price: 190, shelf: 6000, energy: 0 },
  scarf:    { name: '털목도리',   cat: 'craft',    price: 720, shelf: 6000, energy: 0 },
  oil:      { name: '해바라기유', cat: 'other',    price: 130, shelf: 3000, energy: 0 },
  salad:    { name: '샐러드',     cat: 'meal',     price: 60,  shelf: 240,  energy: 22 },
  fries:    { name: '감자튀김',   cat: 'meal',     price: 90,  shelf: 300,  energy: 26 },
  omelet:   { name: '오믈렛',     cat: 'meal',     price: 130, shelf: 300,  energy: 32 },
  pizza:    { name: '피자',       cat: 'meal',     price: 640, shelf: 450,  energy: 44 },
  feed:     { name: '사료',       cat: 'other',    price: 4,   shelf: 99999, energy: 0, noSell: true },
  box:      { name: '택배 상자',  cat: 'other',    price: 6,   shelf: 99999, energy: 0, noSell: true },
};
for (const [id, c] of Object.entries(CROPS)) ITEMS[id] = { name: c.name, cat: c.cat, price: c.price, shelf: c.shelf, energy: c.energy, crop: true };

// 가공 설비와 요리법. in: 재료, out: [물건, 개수], time: 걸리는 시간(초)
export const MACHINES = {
  mill:    { name: '제분소',     cost: 400,  lv: 1 },
  salad:   { name: '샐러드 조리대', cost: 350, lv: 1 },
  oven:    { name: '오븐',       cost: 800, lv: 2 },
  dairy:   { name: '치즈 공방',  cost: 900, lv: 2 },
  jam:     { name: '잼 솥',      cost: 800,  lv: 2 },
  press:   { name: '기름 짜개',  cost: 700,  lv: 2 },
  juice:   { name: '주스기',     cost: 1000, lv: 3 },
  kitchen: { name: '주방',       cost: 900,  lv: 3 },
  loom:    { name: '방적기',     cost: 1200, lv: 4 },
};
export const RECIPES = {
  flour:     { m: 'mill',    in: { wheat: 3 },                       out: ['flour', 2],      time: 24 },
  cornmeal:  { m: 'mill',    in: { corn: 3 },                        out: ['cornmeal', 2],   time: 24 },
  salad:     { m: 'salad',   in: { lettuce: 2, tomato: 1, carrot: 1 }, out: ['salad', 2],     time: 20 },
  bread:     { m: 'oven',    in: { flour: 2 },                       out: ['bread', 1],      time: 30 },
  cookie:    { m: 'oven',    in: { flour: 1, butter: 1, egg: 1 },    out: ['cookie', 3],     time: 36 },
  honeycookie:{ m: 'oven',   in: { flour: 1, butter: 1, honey: 1 },  out: ['honeycookie', 3], time: 40 },
  cornbread: { m: 'oven',    in: { cornmeal: 2, egg: 1 },            out: ['cornbread', 1],  time: 32 },
  pie:       { m: 'oven',    in: { pumpkin: 1, flour: 1, butter: 1 }, out: ['pie', 1],       time: 50 },
  tart:      { m: 'oven',    in: { strawberry: 2, flour: 1, butter: 1 }, out: ['tart', 2],   time: 46 },
  butter:    { m: 'dairy',   in: { milk: 2 },                        out: ['butter', 1],     time: 28 },
  yogurt:    { m: 'dairy',   in: { milk: 2 },                        out: ['yogurt', 1],     time: 26 },
  cheese:    { m: 'dairy',   in: { milk: 3 },                        out: ['cheese', 1],     time: 56 },
  goatcheese:{ m: 'dairy',   in: { goatmilk: 3 },                    out: ['goatcheese', 1], time: 56 },
  icecream:  { m: 'dairy',   in: { milk: 2, honey: 1 },              out: ['icecream', 1],   time: 40 },
  strawjam:  { m: 'jam',     in: { strawberry: 3 },                  out: ['strawjam', 1],   time: 40 },
  grapejam:  { m: 'jam',     in: { grape: 3 },                       out: ['grapejam', 1],   time: 44 },
  sauce:     { m: 'jam',     in: { tomato: 3 },                      out: ['sauce', 1],      time: 34 },
  pickle:    { m: 'jam',     in: { carrot: 3 },                      out: ['pickle', 1],     time: 26 },
  grapejuice:{ m: 'juice',   in: { grape: 2 },                       out: ['grapejuice', 1], time: 34 },
  tomatojuice:{ m: 'juice',  in: { tomato: 2 },                      out: ['tomatojuice', 1], time: 28 },
  oil:       { m: 'press',   in: { sunflower: 3 },                   out: ['oil', 1],        time: 30 },
  fries:     { m: 'kitchen', in: { potato: 2, oil: 1 },              out: ['fries', 3],      time: 36 },
  omelet:    { m: 'kitchen', in: { egg: 2, milk: 1 },                out: ['omelet', 1],     time: 28 },
  pizza:     { m: 'kitchen', in: { flour: 2, cheese: 1, sauce: 1 },  out: ['pizza', 1],      time: 60 },
  yarn:      { m: 'loom',    in: { wool: 2 },                        out: ['yarn', 1],       time: 44 },
  scarf:     { m: 'loom',    in: { yarn: 2 },                        out: ['scarf', 1],      time: 70 },
};
export const MACHINE_UPGRADE = [0, 0.9, 1.6];   // 배치 크기 업그레이드 비용 배수(설비 가격 기준) — 1단계 구입, 2단계 x2, 3단계 x4
export const BATCH = [1, 2, 4];

// 설비·업그레이드: 레벨(lv)과 비용(단계별 cost)
export const UPGRADES = {
  can:      { name: '물뿌리개 확장', desc: '한 번에 담는 물 양', steps: [{ v: 6, cost: 0, lv: 0 }, { v: 12, cost: 150, lv: 0 }, { v: 24, cost: 500, lv: 2 }, { v: 48, cost: 1500, lv: 4 }] },
  pack:     { name: '배낭·수레', desc: '들고 다닐 수 있는 양', steps: [{ v: 20, cost: 0, lv: 0 }, { v: 40, cost: 200, lv: 0 }, { v: 70, cost: 800, lv: 3 }, { v: 120, cost: 2500, lv: 5 }] },
  store:    { name: '창고 확장', desc: '창고에 쌓을 수 있는 양', steps: [{ v: 60, cost: 0, lv: 0 }, { v: 150, cost: 400, lv: 1 }, { v: 320, cost: 1500, lv: 3 }, { v: 600, cost: 4000, lv: 5 }] },
  cold:     { name: '냉장 창고', desc: '창고 안 물건이 2배 오래 신선해요', steps: [{ v: 0, cost: 0, lv: 0 }, { v: 1, cost: 1800, lv: 3 }] },
  sprinkler:{ name: '스프링클러', desc: '밭 6칸에 자동으로 물을 줘요', steps: [{ v: 0, cost: 0, lv: 0 }, { v: 1, cost: 250, lv: 1 }, { v: 2, cost: 250, lv: 1 }, { v: 3, cost: 250, lv: 1 }, { v: 4, cost: 250, lv: 2 }, { v: 5, cost: 250, lv: 2 }, { v: 6, cost: 250, lv: 2 }] },
  tractor:  { name: '트랙터', desc: '농장 일꾼이 더 빨리 일해요', steps: [{ v: 0, cost: 0, lv: 0 }, { v: 1, cost: 6000, lv: 5 }] },
  combine:  { name: '수확기', desc: '다 자란 작물을 자동으로 거둬요', steps: [{ v: 0, cost: 0, lv: 0 }, { v: 1, cost: 9000, lv: 6 }] },
  feeder:   { name: '자동 급식기', desc: '동물 먹이를 자동으로 채워요', steps: [{ v: 0, cost: 0, lv: 0 }, { v: 1, cost: 1200, lv: 3 }] },
  milker:   { name: '자동 수거기', desc: '동물이 만든 제품을 자동으로 모아요', steps: [{ v: 0, cost: 0, lv: 0 }, { v: 1, cost: 1800, lv: 4 }] },
  truck:    { name: '트럭', desc: '배송 기사가 일할 수 있어요', steps: [{ v: 0, cost: 0, lv: 0 }, { v: 1, cost: 3500, lv: 4 }] },
  computer: { name: '컴퓨터·포장대', desc: '인터넷 주문을 받고 포장해요', steps: [{ v: 0, cost: 0, lv: 0 }, { v: 1, cost: 1500, lv: 3 }] },
};
export const PLOT_PACKS = [{ n: 6, cost: 0 }, { n: 9, cost: 120 }, { n: 12, cost: 200 }, { n: 15, cost: 300 }, { n: 18, cost: 450 }, { n: 21, cost: 650 }, { n: 24, cost: 900 }, { n: 27, cost: 1300 }, { n: 30, cost: 1800 }, { n: 33, cost: 2400 }, { n: 36, cost: 3200 }];

// 직원: wage 일당, fee 고용비, max 최대 인원
export const WORKERS = {
  farmhand: { name: '농장 일꾼',   desc: '씨앗 심기·물 주기·수확을 도와요', wage: 40, fee: 120, max: 6, lv: 0 },
  rancher:  { name: '목장 도우미', desc: '먹이 주기와 제품 모으기를 도와요', wage: 45, fee: 200, max: 3, lv: 2 },
  artisan:  { name: '가공 기술자', desc: '자동 제작으로 설정한 설비를 돌려요', wage: 55, fee: 300, max: 4, lv: 3 },
  driver:   { name: '배송 기사',   desc: '거래처 납품·마트 납품·시장 위탁 판매 (트럭 필요)', wage: 60, fee: 250, max: 2, lv: 4 },
  online:   { name: '온라인 매니저', desc: '인터넷 주문을 자동으로 포장해요', wage: 60, fee: 400, max: 2, lv: 4 },
  sales:    { name: '영업 담당',   desc: '거래처 가격과 인터넷 주문이 늘어요', wage: 70, fee: 500, max: 2, lv: 3 },
};

// 거래처: 마을에서 직접 찾아가야 해요. likes 선호 분류, prem 가격 배수
export const CLIENTS = [
  { id: 'diner', name: '초록 식당',   likes: ['veg', 'egg', 'dairy', 'meal'], prem: 1.25, minTrust: 0 },
  { id: 'cafe',  name: '달달 카페',   likes: ['dairy', 'bakery', 'drink', 'fruit'], prem: 1.3, minTrust: 0 },
  { id: 'school',name: '햇살 학교 급식', likes: ['veg', 'fruit', 'dairy', 'egg'], prem: 1.15, minTrust: 0 },
  { id: 'bakery',name: '바삭 빵집',   likes: ['grain', 'dairy', 'egg', 'fruit', 'bakery'], prem: 1.3, minTrust: 1 },
  { id: 'hotel', name: '그랜드 호텔', likes: ['meal', 'bakery', 'preserve', 'dairy', 'drink'], prem: 1.5, minTrust: 2 },
];
export const MART = { id: 'mart', name: '해피 마트', premium: 0.92, lv: 2 };

// 라이벌 농장: kind 에 따라 시세 영향을 받는 분류
export const RIVALS = [
  { id: 'blue',  name: '푸른들 농장',   kind: ['grain', 'veg'],   icon: 'wheat' },
  { id: 'white', name: '하얀구름 목장', kind: ['dairy', 'egg'],   icon: 'milk' },
  { id: 'sweet', name: '달콤 농원',     kind: ['bakery', 'preserve', 'fruit'], icon: 'bread' },
  { id: 'click', name: '클릭팜',       kind: ['meal', 'drink', 'craft'], icon: 'box' },
  { id: 'sun',   name: '햇살 목장',     kind: ['honey', 'wool', 'dairy'], icon: 'sun' },
];

// 시작할 때 고르는 특별 카드
export const PERKS = [
  { id: 'dairy',  name: '낙농 장인',   desc: '유제품 판매가 +12%, 젖소 구입비 -20%' },
  { id: 'baker',  name: '제빵왕',      desc: '빵·과자 판매가 +12%, 오븐 가격 -25%' },
  { id: 'online', name: '온라인 스타', desc: '인터넷 주문이 25% 더 자주 들어와요' },
  { id: 'strong', name: '튼튼한 일꾼', desc: '최대 체력 +30, 체력 회복 +30%' },
  { id: 'cash',   name: '든든한 자금', desc: '시작 자금 +800G' },
  { id: 'network',name: '인맥왕',      desc: '거래처 가격 +10%, 거래처 2곳을 이미 알고 시작' },
  { id: 'harvest',name: '풍년의 손',   desc: '작물 수확량 +15%' },
  { id: 'thrift', name: '알뜰 경영',   desc: '직원 일당 -25%, 설비 가격 -10%' },
];

// 날씨와 시장 이벤트
export const WEATHER = [{ id: 'sun', name: '맑음', w: 5 }, { id: 'rain', name: '비', w: 2 }, { id: 'hot', name: '더운 날', w: 1.2 }, { id: 'cloud', name: '흐림', w: 2 }];
export const EVENTS = [
  { kind: 'cat', name: '마을 축제', text: '축제 때문에 {c} 수요가 늘었어요!', mult: 1.35 },
  { kind: 'cat', name: '건강 캠페인', text: '건강 캠페인으로 {c} 인기가 높아졌어요.', mult: 1.25 },
  { kind: 'cat', name: '풍작', text: '이웃 농장이 풍작이라 {c} 값이 내려갔어요.', mult: 0.78 },
  { kind: 'item', name: '품귀', text: '{i}이(가) 부족해 값이 올랐어요!', mult: 1.5 },
  { kind: 'item', name: '유행', text: '요즘 {i}이(가) 유행이에요.', mult: 1.35 },
];

export const itemName = (id) => (ITEMS[id] ? ITEMS[id].name : id);
export const levelOf = (rev) => { let l = 0; LEVELS.forEach((t, i) => { if (rev >= t) l = i; }); return l; };
