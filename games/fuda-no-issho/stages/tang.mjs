import { DEFAULTS } from './defaults.mjs';

// 高昌・643年ごろは orange 決定（2026-11-04）。札と品の文は Codex の下書き（llm）。
// 620年生まれなら、西州設置の640年に20歳、田契の643年に23歳。史実札を成人後に選ぶ。
// 手本: 中国国家博物館「赵怀满夏田契」（643年、麦で払う田租・私田の賃貸借）。
// https://www.chnmuseum.cn/zp/zpml/kgfjp/201812/t20181218_25306.shtml
// 史料の契約者を主人公にせず、同じ土地に生きる架空の農家として書く。
const settings = {
  ...DEFAULTS,
  staggeredReveal: true,
  // DEFAULTS に無い家・普請・相続の仮値はローマと同じ。釣り合いの調整はしていない。
  houseMight: { rank: [0, 2, 4], field: 1, fieldLevel: 1, worker: 2, trust: 1 },
  buildPrice: { 2: 8, 3: 25, 4: 60 },
  claims: { heir: 5, '嫡子': 5, '庶子': 3, '妾腹の子': 2, '養子': 4, '兄': 4, '弟': 3, '異母兄弟': 3, '叔父': 3, '甥': 2, 'いとこ': 2 },
  // 農家の暮らしを初稿の範囲とし、側室のオプションルールは使わない。
  maxConcubines: 0,
  expansionField: 'newfield',
  roleAliases: { heir: 'heir', villagetrust: 'villageTrust', waterwise: 'waterwise' },
  // 太平でも旱魃・病・盗賊はある。独自の率を選ばず既定の外の死のくじを使う。
  dangerEras: [{ from: 620, to: 695, chance: DEFAULTS.disasterChance }],
};

const AXES = {
  status: { name: 'ステータス', mark: '王冠', here: '村の信を得て、役所に名を知られる', ladder: ['村の仲裁役', '高昌の役人の覚え', '長安に届く名', '碑に残る功績'] },
  money: { name: 'マネー', mark: '硬貨', here: '麦と商いで、身代を築く', ladder: ['家の蓄え', '高昌の店', '西域の商い', '語り草の富'] },
  love: { name: 'ラブ', mark: 'ハート', here: '水辺の出会いから、恋に生きる', ladder: ['村の恋', '高昌の浮名', '遠くまで届く恋文', '物語に残る恋'] },
  slow: { name: 'スローライフ', mark: '葉', here: '用水と畑を守り、家をつなぐ', ladderBy: 'generation', ladder: ['自分の畑と庭', '子の代の備え', '孫の代の実り', '語り継がれるご先祖'] },
  strength: { name: 'ストレングス', mark: '拳', here: '腕と足を鍛え、道を守る', ladder: ['村の夜番', '高昌の護衛', '西域の道案内', '道の伝えに残る腕'] },
  art: { name: 'アート', mark: '竪琴', here: '歌い、描き、書き写して残す', ladder: ['村の歌', '高昌の壁画', '旅する写本', '後世まで残る手跡'] },
};
const SCOPES = ['家と村', '高昌の町', '長安と西域', '天下と後世'];
const LAYERS = { village: { name: '家', ranks: ['暮らしの細い農家', '蓄えのある農家', '村の旧家'] } };
// 趙・張と懐満・歓仁・園富は上記の田契に見える。残りの姓・名の部品と女の呼び名は推測。
const SURNAMES = ['趙', '張', '王', '李', '麹', '曹', '陳', '馬', '宋', '郭'];
const NAMING = {
  male: ['懐満', '歓仁', '園富', '延寿', '守義', '文成', '善徳', '元慶', '思礼', '保寧'],
  female: ['玉娘', '春娘', '惠娘', '宝珠', '明月', '秋娘', '金華', '阿蘭', '妙音', '善妙'],
  // 推測: 姓を父から継ぎ、親の名を避ける。妻は生家の姓で呼ぶ。村での実際の命名慣行は未確認。
  // 名を変える節目は設けず、置き名は札の「隣村の人」「旅の人」で扱う。
  nameOf(ctx, who, key) {
    const { male, female } = NAMING;
    const father = male[ctx.hash('father') % male.length];
    const family = male.filter((name) => name !== father);
    const selfOrder = ctx.siblings.filter((sib) => sib.elder && sib.male).length;
    const given = (pool, order, tag) => `${pool[(ctx.hash(tag) % pool.length + order) % pool.length]}${order >= pool.length ? `（${order + 1}）` : ''}`;
    const self = given(family, selfOrder, 'brothers');
    const otherHouse = (tag) => { const pool = ctx.surnames.filter((name) => name !== ctx.house); return pool[ctx.hash(tag) % pool.length]; };
    if (who === 'father') return `${ctx.house}${father}`;
    if (who === 'self') return `${ctx.house}${self}`;
    if (who === 'son') return `${ctx.house}${given(male.filter((name) => ![father, self].includes(name)), Number(key) - 1, 'sons')}`;
    if (who === 'mother') return `${otherHouse('mother')}${given(female, 0, 'mother')}`;
    if (who === 'spouse') return `${otherHouse(`spouse${key}`)}${given(female, 0, `spouse${key}`)}`;
    if (who === 'daughter') return `${ctx.house}${given(female, Number(key) - 1, 'daughters')}`;
    if (['sister', '姉', '妹', '姪'].includes(who)) {
      const slot = key === '' || key === undefined ? Math.max(0, ctx.siblings.findIndex((sib) => sib.rel === (who === 'sister' ? '妹' : who))) : ctx.kinSlot(key);
      return `${ctx.house}${given(female, slot >= 200 ? slot - 200 : slot, 'sisters')}`;
    }
    if (['兄', '弟', '異母兄弟'].includes(who)) {
      let slot = key === '' || key === undefined ? ctx.siblings.findIndex((sib) => sib.rel === who) : ctx.kinSlot(key);
      if (slot >= 200) slot -= 200;
      const sibling = ctx.siblings[slot];
      const order = sibling ? ctx.siblings.slice(0, slot).filter((sib) => sib.male).length + (sibling.elder ? 0 : 1) : selfOrder + 1 + Math.max(0, slot);
      return `${ctx.house}${given(family, order, 'brothers')}`;
    }
    return `${ctx.house}${given(male, ctx.kinSlot(key), `kin${who}`)}`;
  },
  birthLine(sex, order, name) { return `${sex === 'son' ? '男の子' : '女の子'}で、${name}と名づけた。`; },
};

const FIELD = {
  ie: { name: '家', role: 'house', kind: '家', marks: { status: 0 }, art: 'place.house', levels: LAYERS.village.ranks.map((name, i) => ({ name, marks: { status: i }, art: `place.house.lv${i + 1}` })) },
  neighborhouse: { name: '隣の家', role: 'rivalHouse', kind: '相手の家', marks: {}, art: 'place.neighbors', levels: [1, 2, 3].map(() => ({ name: '隣の家', marks: {}, art: 'place.neighbors' })) },
  elderhouse: { name: '村の有力な家', role: 'patronHouse', kind: '相手の家', marks: {}, art: 'rank.nanushi', levels: [1, 2, 3].map(() => ({ name: '村の有力な家', marks: {}, art: 'rank.nanushi' })) },
  father: { name: '父', role: 'father', kind: '家族', marks: { slow: 1 }, art: 'place.father' },
  oldfather: { name: '老いた父', role: 'father', substitute: false, kind: '家族', marks: { slow: 1 }, art: 'place.father.old' },
  mother: { name: '母', role: 'mother', kind: '家族', marks: { slow: 1 }, art: 'place.mother' },
  sister: { name: '妹', role: 'sister', kind: '家族', marks: { slow: 1 }, art: 'place.sister' },
  siblings: { name: 'きょうだい', role: 'siblings', kind: '家族', marks: {}, art: 'place.sister' },
  kinsman: { name: '縁者', kind: '家族', marks: { slow: 1 }, art: 'place.father.old' },
  house: { name: '土壁の家', kind: '家', marks: { slow: 1 }, art: 'place.house', levels: [
    { name: '土壁の家', yearly: { body: 1 }, guard: [], art: 'place.house.lv1' },
    { name: '雨漏りを塞いだ家', yearly: { body: 2 }, guard: [], art: 'place.house.lv2' },
    { name: '水と寝床を清潔にした家', yearly: { body: 3 }, guard: ['dis.plague'], art: 'place.house.lv3' },
  ], pastLv3: ['hygiene'] },
  paddy: { name: '用水で潤す麦畑', role: 'field', primary: true, kind: '田', marks: { money: 1, slow: 1 }, art: 'roma.wheat', levels: [
    { name: '用水で潤す麦畑', yearly: { store: 1 }, guard: [], art: 'roma.wheat.lv1' },
    { name: '堆肥を入れた麦畑', yearly: { store: 2 }, guard: [], art: 'roma.wheat.lv2' },
    { name: '種と水加減を選ぶ麦畑', yearly: { store: 3 }, guard: [], art: 'roma.wheat.lv3' },
  ], pastLv3: ['soil'] },
  newfield: { name: '借り増した畑', role: 'field', kind: '田', marks: { money: 1, slow: 1 }, art: 'place.newfield', stacks: true, levels: [
    { name: '借り増した畑', yearly: { store: 1 }, guard: [], art: 'place.newfield.lv1' },
    { name: '畦を直した借り畑', yearly: { store: 2 }, guard: [], art: 'place.newfield.lv2' },
    { name: '水を逃がさぬ借り畑', yearly: { store: 3 }, guard: [], art: 'place.newfield.lv3' },
  ], pastLv3: ['soil'] },
  neighbors: { name: '用水を分ける村の人々', kind: '里の人々', marks: { slow: 1 }, art: 'place.neighbors' },
  villagetrust: { name: '村の信頼', role: 'villageTrust', kind: '縁', marks: { status: 1 }, art: 'bond.village' },
  waterwise: { name: '水番の心得', role: 'waterwise', kind: '役', marks: { status: 1 }, art: 'skill.water' },
  reading: { name: '漢字の読み書き', kind: '知恵', marks: { status: 1 }, art: 'skill.reading' },
  friend: { name: '畑の幼なじみ', kind: '縁', marks: { love: 1 }, guard: ['vi.road'], art: 'bond.friend' },
  strongbody: { name: '鍛えた体', kind: '体', marks: {}, ability: true, guard: ['vi.road', 'vi.bandits'], art: 'self.strong' },
  temple: { name: '村の寺との縁', kind: '縁', marks: { slow: 1 }, guard: ['dis.plague'], art: 'bond.temple' },
  kingdom: { name: '高昌の王国', kind: '遠くの歴史', marks: {}, art: 'scene.news' },
  tang: { name: '唐の西州', kind: '遠くの歴史', marks: {}, art: 'scene.news' },
  spring: { name: '春', kind: '季節', marks: {}, art: 'season.spring' },
  lover: { name: '想い人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover' },
  'lover.water': { name: '水汲みで会う人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.river' },
  'lover.weaver': { name: '町の織り手', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.weaver' },
  'lover.widow': { name: '畑を守る寡婦', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.widow' },
  'lover.traveler': { name: '市に来る旅の人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.traveler' },
  'keep.water': { name: '水辺でもらった髪紐', kind: '品', marks: { love: 1 }, art: 'roma.keep.ribbon' },
  'keep.weaver': { name: '織り手の小さな布', kind: '品', marks: { love: 1 }, art: 'keep.tenugui' },
  'keep.widow': { name: '共に使った麦の袋', kind: '品', marks: { love: 1 }, art: 'keep.comb' },
  'keep.traveler': { name: '旅の人の飾り紐', kind: '品', marks: { love: 1 }, art: 'keep.obi' },
  spouse: { name: '妻', role: 'spouse', partnerName: true, partnerPriority: 1, kind: '家族', marks: { love: 2, slow: 1 }, yearly: { body: 1 }, art: 'place.spouse' },
  arrangedspouse: { name: '妻（家の取り決め）', role: 'spouse', partnerPriority: 2, kind: '家族', marks: { slow: 2, money: 1 }, yearly: { body: 1 }, art: 'place.spouse.arranged' },
  concubine: { name: '妾', role: 'concubine', partnerPriority: 3, kind: '家族', marks: {}, yearly: { body: 1, store: -1 }, art: 'place.spouse.side' },
  mistress: { name: '別に暮らす恋人', role: 'mistress', partnerPriority: 4, kind: '縁', marks: { love: 2 }, yearly: { store: -1 }, art: 'place.mistress' },
  affair: { name: '浮名', kind: '縁', marks: { love: 2 }, art: 'bond.affair' },
  rumor: { name: '家々の噂', kind: '重荷', marks: { status: -1 }, art: 'bond.rumor' },
  coward: { name: '役を逃れたという噂', kind: '重荷', marks: { status: -2, love: -1 }, art: 'burden.coward' },
  shirk: { name: '水路を掘らぬ家の噂', kind: '重荷', marks: { status: -1 }, art: 'burden.shirk' },
  wound: { name: '古傷', kind: '重荷', marks: { strength: -1, slow: -1 }, art: 'burden.wound' },
  debt: { name: '返す麦の借り', kind: '重荷', marks: { money: -2 }, art: 'burden.debt' },
  child: { name: '子', kind: '家族', marks: {}, stacks: true, art: 'family.child' },
  grownchild: { name: '育った子', role: 'grownchild', kind: '家族', marks: {}, stacks: true, yearly: { body: 1 }, art: 'place.child.grown' },
  grandchild: { name: '孫', kind: '家族', marks: {}, stacks: true, art: 'family.child' },
  heir: { name: '跡取り', role: 'heir', kind: '家族', marks: { slow: 2, status: 1 }, art: 'family.heir' },
  branchhouse: { name: '畑を分けた子の家', kind: '家族', marks: { slow: 1, money: 1 }, yearly: { body: 1 }, art: 'family.branch' },
  inlaw: { name: '妹の嫁ぎ先', kind: '縁', marks: { slow: 1, money: 1 }, guard: ['dis.famine'], art: 'bond.inlaw' },
  childletters: { name: '子が読めるようになった契約', kind: '家族', marks: { status: 1 }, art: 'family.child.letters' },
  childhands: { name: '子の畑仕事', kind: '家族', marks: { money: 1 }, yearly: { store: 1 }, art: 'family.child.hands' },
  childaway: { name: '町で働く子', kind: '縁', marks: { money: 1, status: 1 }, yearly: { store: 1 }, art: 'family.child.away' },
  heirwed: { name: '跡取りの縁組', kind: '家族', marks: { slow: 1 }, yearly: { body: 1 }, art: 'family.heir' },
  rank: { name: '守備の兵', role: 'rank', kind: '身分', marks: { status: 1, strength: 1 }, noMaintain: true, art: 'rank.ashigaru', levels: [
    { name: '守備の兵', marks: { status: 1, strength: 1 }, scope: 2, art: 'rank.ashigaru' },
    { name: '隊を束ねる兵', marks: { status: 2, strength: 2 }, scope: 3, art: 'rank.samurai' },
    { name: '軍の指揮役', marks: { status: 3, strength: 2 }, scope: 3, art: 'rank.taisho' },
  ] },
  xun: { name: '戦で授かった勲', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.kanjo' },
  merit: { name: '軍粮を届けた功', role: 'merit', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.kanjo' },
  servant: { name: '雇った働き手', role: 'servant', kind: '家族', marks: { status: 1 }, stacks: true, art: 'place.servant', levels: [
    { name: '雇った働き手', yearly: { body: 1 }, guard: ['vi.bandits'], art: 'place.servant.lv1' },
    { name: '仕事を覚えた働き手', yearly: { body: 2 }, guard: [], art: 'place.servant.lv2' },
    { name: '家を任せられる働き手', yearly: { body: 2 }, guard: [], art: 'place.servant.lv3' },
  ], pastLv3: ['organizing'] },
  well: { name: '村の共同井戸', role: 'building', kind: '暮らし', marks: { slow: 1 }, guard: ['dis.famine'], art: 'place.well' },
  granary: { name: '虫を防ぐ穀倉', role: 'building', kind: '暮らし', marks: { money: 1 }, yearly: { store: 1 }, art: 'place.storehouse' },
  mediator: { name: '畦の仲裁役', kind: '役', marks: { status: 1 }, art: 'scene.meeting' },
  clerk: { name: '県の書き手との縁', kind: '縁', marks: { status: 2 }, art: 'scene.letters' },
  petition: { name: '長安まで届いた請願', kind: '品', marks: { status: 2 }, art: 'keep.letters' },
  stele: { name: '修渠の功を刻んだ碑', kind: '品', marks: { status: 3 }, art: 'keep.kishinbook' },
  jar: { name: '土間に埋めた銭の壺', kind: '品', marks: { money: 1 }, art: 'roma.jar' },
  trade: { name: '高昌の麦の売買帳', kind: '仕事', marks: { money: 2 }, yearly: { store: 1 }, art: 'work.trade' },
  shop: { name: '高昌の麦と布の店', role: 'building', kind: '仕事', marks: { money: 2 }, art: 'place.shop', levels: [
    { name: '高昌の麦と布の店', yearly: { store: 2 }, guard: [], art: 'work.shop.lv1' },
    { name: '品を揃えた店', yearly: { store: 3 }, guard: [], art: 'work.shop.lv2' },
    { name: '帳簿を整えた店', yearly: { store: 4 }, guard: [], art: 'work.shop.lv3' },
  ], pastLv3: ['numbers'] },
  caravan: { name: '西域の隊商の持ち分', kind: '仕事', marks: { money: 2 }, yearly: { store: 2 }, art: 'work.trade' },
  fortune: { name: '語り草の麦と布の身代', kind: '品', marks: { money: 3 }, art: 'place.storehouse' },
  waterpromise: { name: '水辺で交わした約束', kind: '縁', marks: { love: 1 }, art: 'bond.firstlove' },
  townlove: { name: '高昌の市で噂の二人', kind: '縁', marks: { love: 2 }, art: 'bond.affair' },
  farletters: { name: '西域を往く恋文', kind: '品', marks: { love: 2 }, art: 'keep.letter' },
  lovetale: { name: '書き継がれた二人の話', kind: '品', marks: { love: 3 }, art: 'keep.letters' },
  garden: { name: '家の豆と果樹の庭', kind: '暮らし', marks: { slow: 1 }, yearly: { body: 1 }, art: 'life.garden' },
  dowry: { name: '子の代へ残す麦の備え', kind: '品', marks: { slow: 1 }, art: 'place.storehouse' },
  oldorchard: { name: '孫の代へ渡す果樹園', kind: '暮らし', marks: { slow: 1 }, yearly: { body: 1 }, art: 'life.garden' },
  ancestor: { name: '家で語り継がれるご先祖', kind: '品', marks: { slow: 3 }, art: 'scene.hearth' },
  watchstaff: { name: '村の夜番の棒', kind: '品', marks: { strength: 1 }, art: 'keep.bokuto' },
  escort: { name: '高昌まで荷を守った評判', kind: '品', marks: { strength: 2 }, art: 'keep.kanjo' },
  guide: { name: '西域の道を越えた案内人', kind: '役', marks: { strength: 2 }, art: 'scene.bandits' },
  routetale: { name: '道の伝えに残った名', kind: '品', marks: { strength: 3 }, art: 'keep.letters' },
  song: { name: '村で覚えられた収穫の歌', kind: '品', marks: { art: 1 }, art: 'keep.flute' },
  wall: { name: '高昌の寺の壁画', kind: '品', marks: { art: 2 }, art: 'roma.work.fresco' },
  copy: { name: '西域へ渡った経の写本', kind: '品', marks: { art: 2 }, art: 'keep.letters' },
  manuscript: { name: '後世まで残る手跡', kind: '品', marks: { art: 3 }, art: 'keep.letters' },
  'past.memory': { name: '前世の記憶', kind: '前世', marks: {}, art: 'past.teacher' },
};
// 範囲・代はこの二表へ集める。書かない品の範囲・段は1。
const SCOPE_OF = {
  2: ['clerk', 'trade', 'shop', 'townlove', 'escort', 'wall', 'childletters', 'childaway', 'merit', 'xun'],
  3: ['petition', 'caravan', 'farletters', 'guide', 'copy'],
  4: ['stele', 'fortune', 'lovetale', 'routetale', 'manuscript'],
};
const RUNG_OF = { 2: ['grownchild', 'heir', 'branchhouse', 'dowry'], 3: ['grandchild', 'heirwed', 'oldorchard'], 4: ['ancestor'] };
for (const [scope, ids] of Object.entries(SCOPE_OF)) for (const id of ids) FIELD[id].scope = Number(scope);
for (const [rung, ids] of Object.entries(RUNG_OF)) for (const id of ids) FIELD[id].rung = Number(rung);
const START_FIELD = ['ie', 'neighborhouse', 'elderhouse', 'mother', 'house', 'father', 'paddy', 'neighbors', 'sister', 'temple', 'kingdom', 'spring'];
const LOVERS = ['lover.water', 'lover.weaver', 'lover.widow', 'lover.traveler'];
const body = (amount = 1) => ({ type: 'spend', what: 'body', amount });
const riskBody = (amount = 1) => ({ type: 'risk', what: 'body', amount });
const store = (amount = 1) => ({ type: 'spend', what: 'store', amount });
const risk = (what) => ({ type: 'risk', what });
const lock = (what, years) => ({ type: 'lock', what, years });
const SUB = { type: 'risk', what: 'substitute' };
const ladderNeeds = (axis, rung) => Object.entries(FIELD).filter(([, field]) => (field.marks[axis] || 0) > 0 && (field.rung ?? field.scope ?? 1) >= rung - 1).map(([id]) => id);
const RUNG_AGES = { 1: [7, 35], 2: [15, 60], 3: [25, 65], 4: [35, 75] };
const rungCard = (id, axis, rung, rest) => ({ id, frame: 'path', ages: RUNG_AGES[rung], axis, ...(rung > 1 ? { needsAny: ladderNeeds(axis, rung) } : {}), ...rest });

const CARDS = [
  // 手本: 田契に記された小麦の現物地代。子どもの分担と一日の情景は推測。
  { id: 'child.harvest', frame: 'path', ages: [7, 12], title: '麦を選る日', story: '庭で麦を広げる。地代に出す麦には、よく実った粒を残す。', art: 'scene.harvest',
    left: { title: '重い袋を運ぶ', art: 'choice.carry', stake: body(), odds: 5, win: { text: '袋を運べるようになり、父にうなずかれた。', body: 2, maxBody: 1, add: ['strongbody'] }, lose: { text: '麦をこぼして、拾い集めた。' } },
    right: { title: '隣の子と麦を選る', art: 'choice.chores', stake: body(), odds: 5, win: { text: '手を動かしながら話し、仲良くなった。', add: ['friend'] }, lose: { text: '話に夢中で、麦殻を混ぜてしまった。' } } },
  // 推測: 寺で読み書きを教わる機会を置く。高昌の農家の就学率は表していない。
  { id: 'child.letters', frame: 'path', ages: [7, 14], axis: 'status', title: '寺で習う文字', story: '寺の書き手が、畑の仕事のあとなら字を教えると言う。', art: 'scene.letters',
    left: { title: '紙と墨を持って通う', art: 'choice.reading', stake: store(), odds: 4, win: { text: '契約に書かれた名と数を読めるようになった。', add: ['reading'] }, lose: { text: '手本が難しく、通う足が遠のいた。' } },
    right: { title: '寺の庭仕事を手伝う', art: 'choice.temple', stake: body(), odds: 5, win: { text: '庭仕事のあと、僧が食事を分けてくれた。', add: ['temple'] }, lose: { text: '草を取り違え、植え直すことになった。' } } },
  // 手本: 高昌は640年に唐の西州となる（上記の国博解説）。村の二択と結果は推測。
  // 史実: 640年、唐の侯君集の軍が高昌を攻め、王国は降った。村の者がどこまで守りに駆り出されたかは推測。
  { id: 'hist.west', frame: 'demand', year: 640, demand: true, ignore: { substitute: true, odds: 4 }, omen: '唐の軍が高昌へ向かっている', title: '唐の軍が来た', story: '唐の大軍が高昌の城を囲んだ。王は村々からも人を集めている。この国が、終わるかもしれない。', art: 'scene.news',
    always: { remove: ['kingdom'], add: ['tang'] },
    left: { title: '城の守りに出る', art: 'choice.battle', stake: riskBody(2), odds: 4, win: { text: '城は降ったが、命は助かった。村へ戻ると、皆が頼ってきた。', add: ['villagetrust'], maxBody: 1 }, lose: { text: '城壁の下で討たれた。', die: true } },
    right: { title: '村に残る', art: 'choice.stay', stake: SUB, odds: 4, win: { text: '代わりに出た者は、城が降ったあと戻ってきた。' }, lose: { text: '代わりに出た者は戻らなかった。' } } },
  // 手本: 643年「赵怀满夏田契」。これは法の施行年ではなく、その年に残った契約を手本にした架空札。
  { id: 'hist.contract', frame: 'path', year: 643, axis: 'money', omen: '麦で地代を払う借り畑の話が来ている', title: '麦で払う田契', story: '田主と借り手が、麦で払う地代を書き決めている。麦が汚ければ、風で選り直すことまで約束する。', art: 'scene.letters',
    left: { title: '家で耕せる畑を借りる', art: 'choice.till', stake: store(2), odds: 4, win: { text: '地代を約束し、畑を借り増した。ここから毎年、家に残る実りがある。', add: ['newfield'] }, lose: { text: '契約がまとまらず、用意した種だけが残った。' } },
    right: { title: '隣家の契約を読み合わせる', art: 'choice.reading', stake: body(), odds: 4, win: { text: '境と麦の数を確かめ、隣家に礼を言われた。', add: ['reading', 'villagetrust'] }, lose: { text: '難しい文句を読み違え、書き手に直された。' } } },
  // 推測: 高昌の用水農業を手本にした旱魃。確定した年の災害ではない。
  { id: 'dis.famine', frame: 'disaster', disaster: true, repeat: true, omen: '用水の流れが細い', title: '麦の不作', story: '水が足りず、麦がまばらにしか実らなかった。', art: 'disaster.famine',
    left: { title: '蓄えで食べ物を買う', art: 'choice.rice', stake: store(3), odds: 6, win: { text: '食べ物を買い、家の冬をつないだ。' } },
    right: { title: '粗い穀物を煮てしのぐ', art: 'choice.endure', stake: riskBody(2), odds: 3, win: { text: '食べられるものを集め、次の実りまで耐えた。' }, lose: { text: '飢えに体が耐えられなかった。', die: true } } },
  // 推測: 特定の病名・流行年は断定しない。病の危ない側は災いの型どおり命を賭ける。
  { id: 'dis.plague', frame: 'disaster', disaster: true, repeat: true, omen: '村で熱を出す人が増えた', title: '村に入った熱', story: '隣家でも人が寝込んだ。いつもの畑仕事が止まっている。', art: 'disaster.plague',
    left: { title: '食べ物を買い、家で休む', art: 'choice.shut', stake: store(2), odds: 4, win: { text: '仕事を止め、熱が引くまで寝床を守った。' }, lose: { text: '熱が家に入り、体を壊した。', body: -2, maxBody: -1 } },
    right: { title: '看病しながら畑に出る', art: 'choice.nurse', stake: riskBody(2), odds: 3, win: { text: '家族は持ち直し、畑も荒れずに済んだ。', store: 1 }, lose: { text: '看病と畑仕事のうちに、熱に倒れた。', die: true } } },
  // 推測: 用水があふれて畦を壊す年。洪水は古傷で済む値を使う。
  { id: 'dis.flood', frame: 'disaster', disaster: true, repeat: true, omen: '水路に濁り水が増えた', title: 'あふれた用水', story: '用水が畦を越え、土壁の足元へ迫ってきた。', art: 'disaster.flood',
    left: { title: '蓄えを出して人手を集める', art: 'choice.levee', stake: store(3), odds: 5, win: { text: '人手で水を逃がし、畑を守った。' }, lose: { text: '間に合わず、麦を流された。', store: -2 } },
    right: { title: '自分で土を運ぶ', art: 'choice.till', stake: riskBody(2), odds: 4, win: { text: '夜まで土を運び、水を引かせた。', add: ['villagetrust'] }, lose: { text: '崩れた畦に巻かれ、足に傷が残った。', add: ['wound'] } } },
  // 推測: 農具や旅で負った古傷の悪化。焼いて塞ぐ治療を現代の常識とはしない。
  { id: 'dis.wound', frame: 'disaster', disaster: true, repeat: true, needs: ['wound'], omen: '古傷が熱を持つ', title: '古傷の膿み', story: '古傷の腫れが引かず、寝床から起きるのもつらい。', art: 'roma.disaster.wound',
    left: { title: '薬と清潔な布を用意する', art: 'choice.medicine', stake: store(2), odds: 5, win: { text: '傷を手当てし、腫れが引いた。', remove: ['wound'] }, lose: { text: '手当てが間に合わず、傷の熱に倒れた。', die: true } },
    right: { title: '仕事を続けて様子を見る', art: 'choice.work', stake: riskBody(2), odds: 3, win: { text: '傷は痛むが、実りを取り込めた。', store: 1 }, lose: { text: '無理を重ね、傷の熱で命を落とした。', die: true } } },
  // 推測: 盗賊の一夜。史料の犯罪頻度を再現する札ではない。
  { id: 'vi.bandits', frame: 'disaster', disaster: true, repeat: true, omen: '村の戸締まりが早くなった', title: '夜の物音', story: '戸口で知らぬ足音がした。蓄えを嗅ぎつけた者がいる。', art: 'scene.bandits',
    left: { title: '蓄えを渡して追い払う', art: 'choice.yield', stake: store(4), odds: 6, win: { text: '盗人は袋を抱え、村を出ていった。' } },
    right: { title: '棒を取って立ち向かう', art: 'choice.fight', stake: riskBody(2), odds: 3, win: { text: '盗人を追い払った。', add: ['watchstaff'] }, lose: { text: '暗い戸口で、盗人の刃に倒れた。', die: true } } },
  // 推測: 村の若者にも来る町への荷運び。争いの危ない側には死ぬ結果を置く。
  { id: 'vi.road', frame: 'fight', ages: [16, 60], repeat: true, title: '麦を運ぶ街道', story: '高昌へ麦を運ぶ駄賃はいいが、道には追い剥ぎも出る。', art: 'scene.market',
    left: { title: '一人で荷を届ける', art: 'choice.carry', stake: riskBody(2), odds: 4, win: { text: '荷を届け、駄賃を受け取った。', store: 3, add: ['escort'] }, lose: { text: '麦を狙う追い剥ぎに殺された。', die: true } },
    right: { title: '仲間に声をかけて組を作る', art: 'choice.organize', stake: body(), odds: 5, win: { text: '次からは一緒に運ぼうと約束した。', add: ['friend'] }, lose: { text: '日取りが合わず、話は流れた。' } } },
  // 史実: 640年以後、西州に折衝府が4つ置かれ、地元の人が府兵に徴された（気賀澤 1997）。648年の亀茲攻めに西州の兵が出たかは推測。
  { id: 'hist.kucha', frame: 'demand', year: 648, demand: true, ignore: { substitute: true, odds: 4 }, omen: '府の役人が名簿を見直している', title: '亀茲へ向かう軍', story: '唐の軍が西の亀茲を攻める。西州の府兵にも、出征の命が下った。', art: 'scene.news',
    left: { title: '府兵として西へ行く', art: 'choice.battle', stake: riskBody(2), odds: 4, delay: 1, win: { text: '亀茲の城攻めから生きて戻り、勲を授かった。', add: ['xun'], rank: 1, maxBody: 1 }, lose: { text: '亀茲の砂の中で討たれた。', die: true } },
    right: { title: '村に残る', art: 'choice.stay', stake: SUB, odds: 4, win: { text: '代わりに出た者は無事に戻った。' }, lose: { text: '代わりに出た者は戻らなかった。' } } },
  // 史実: 670年、吐蕃が西域の諸城を攻め、唐は安西四鎮を退いた。西州の村への影響は推測。
  { id: 'hist.tibet', frame: 'demand', year: 670, demand: true, ignore: { substitute: true, odds: 2 }, omen: '西の城が落ちたという', title: '吐蕃の攻勢', story: '吐蕃が西の諸城を落とした。唐の軍は押されている。西州にも守りの命が来た。', art: 'scene.news',
    left: { title: '老いた身で守りに出る', art: 'choice.battle', stake: riskBody(3), odds: 2, delay: 1, win: { text: '負け戦を生き延び、勲を授かった。', add: ['xun'], rank: 1 }, lose: { text: '五十の身で戦に出て、倒れた。', die: true } },
    right: { title: '村に残る', art: 'choice.stay', stake: SUB, odds: 2, win: { text: '代わりに出た者は無事に戻った。' }, lose: { text: '代わりに出た者は戻らなかった。' } } },
  // 推測: 西州の駐屯軍を支える運搬役。史実の戦闘年を捏造せず、軍役の共通の役で扱う。
  { id: 'dm.transport', frame: 'demand', ages: [20, 60], years: [640, 695], repeat: true, cooldown: 8, demand: true, ignore: { substitute: true, odds: 4 }, title: '軍粮を届ける役', story: '役所から、守備の兵の食べ物を運ぶよう命が来た。畑を空ける者を決めねばならない。', art: 'scene.fushin',
    left: { title: '自分で荷を運ぶ', art: 'choice.carry', stake: riskBody(2), odds: 4, delay: 1, win: { text: '干からびた道を越え、麦の袋を届けた。', add: ['merit'], store: 1 }, lose: { text: '帰りの道で倒れ、古傷が残った。', add: ['wound'] } },
    right: { title: '村に残る', art: 'choice.stay', stake: SUB, odds: 4, win: { text: '代わりに出た者は無事に戻った。' }, lose: { text: '代わりに出た者は戻らなかった。' } } },
  // 推測: 村の共同用水の補修。断る代償は水番の信頼を失うこと。
  { id: 'dm.water', frame: 'demand', ages: [16, 65], repeat: true, demand: true, ignore: { label: '村の信頼を失う', effect: { text: '水路掘りに出ず、村で陰口をたたかれた。', remove: ['villagetrust'], add: ['shirk'] } }, title: '春の水路掘り', story: '畑へ水を通す前に、村で水路の泥をさらう。', art: 'scene.irrigation',
    left: { title: '泥をさらい、水番を引き受ける', art: 'choice.water', stake: body(2), odds: 6, win: { text: '水が通った。分ける順も覚え、水番を頼まれた。', add: ['waterwise', 'villagetrust'], remove: ['shirk'] } },
    right: { title: 'その年のくじの札', art: 'choice.skip', stake: body(), odds: 5, win: { text: '' }, lose: { text: '' } } },

  // 推測: 以下の家族札は当時の個別世帯の復元ではなく、同じ型で描く暮らしの下書き。
  { id: 'fam.sister', frame: 'family', ages: [17, 22], needs: ['sister'], title: '妹の嫁入り', story: '水を分け合う隣村の家から、妹に縁談が来た。', art: 'scene.wedding.sister', always: { remove: ['sister'], add: ['inlaw'] },
    left: { title: '布と麦を持たせる', art: 'choice.dowry', stake: store(2), odds: 6, win: { text: '妹は布の包みを抱えて嫁いだ。', add: ['villagetrust'] } },
    right: { title: '婚礼の歌を歌う', art: 'choice.sing', stake: body(), odds: 4, win: { text: '妹は歌を聞き、泣きながら笑った。', add: ['song'] }, lose: { text: '声は震えたが、妹を送り出した。' } } },
  { id: 'fam.father', frame: 'family', ages: [28, 42], needsAny: ['father', 'oldfather'], title: '父の最期', story: '父が、畑の境と借りた麦のことを確かめたがっている。', art: 'scene.father.end', always: { remove: ['father', 'oldfather'] },
    left: { title: 'そばで話を聞く', art: 'choice.watch', stake: lock('kind:田', 1), odds: 6, win: { text: '畑のことを聞き終え、父を見送った。', add: ['waterwise'] } },
    right: { title: '僧を招いて弔う', art: 'choice.funeral', stake: store(2), odds: 6, win: { text: '近所の人々と父を弔った。', add: ['temple', 'villagetrust'] } } },
  { id: 'fam.mother', frame: 'family', ages: [33, 50], needs: ['mother'], title: '母の最期', story: '母が寝床で、昔の麦刈りの話をしている。', art: 'scene.mother.end', always: { remove: ['mother'] },
    left: { title: '好きだった花を供える', art: 'choice.flowers', stake: body(), odds: 6, win: { text: '庭の花を母の傍らに置いた。', add: ['garden'] } },
    right: { title: '家々に知らせ、弔ってもらう', art: 'choice.memorial', stake: store(2), odds: 6, win: { text: '母のことを覚えている人が集まった。', add: ['villagetrust'] } } },
  { id: 'ie.succession', frame: 'family', family: true, ages: [28, 75], contest: 'succession', title: '家を継ぐ者', story: '縁者が、畑と家の行く末について話しに来た。', art: 'scene.family',
    left: { title: '跡取りの分を守る', art: 'choice.inherit', odds: 3, win: { text: '話をまとめ、家を継いだ。' }, lose: { text: '畑の一部を譲り、家を継いだ。' } },
    right: { title: '縁者に譲って分家する', art: 'choice.separate', odds: 6, win: { text: '畑を分けて、別の暮らしを始めた。' } } },
  // 推測: 恋の相手は続柄と名で区別する。いずれも架空の村人・旅人。
  { id: 'lo.meet', frame: 'path', ages: [16, 50], repeat: true, axis: 'love', title: '市での出会い', story: '麦や布を持ち寄る市で、見知らぬ人と目が合った。', art: 'scene.meet',
    left: { title: '声をかける', art: 'choice.approach', stake: store(), odds: 5, win: { text: '次の市でも会う約束をした。', add: ['lover.water'] }, lose: { text: '人混みにまぎれ、話せなかった。' } },
    right: { title: '村の荷をまとめて売る', art: 'choice.market', stake: body(), odds: 5, win: { text: '売れ残りを減らし、村の人に喜ばれた。', add: ['villagetrust'] }, lose: { text: '値切られて、かえって叱られた。' } } },
  { id: 'lo.visit', frame: 'path', ages: [16, 60], repeat: true, axis: 'love', needsAny: LOVERS, title: '会いに行く', story: '市の日が近づき、また顔を見たくなった。', art: 'scene.visit',
    left: { title: '贈り物を持って会いに行く', art: 'choice.gift', stake: store(), odds: 4, win: { text: '贈り物を受け取り、話を聞いてくれた。' }, lose: { text: '留守で、会えなかった。' } },
    right: { title: '仕事を早めに切り上げて行く', art: 'choice.back', stake: body(), odds: 5, win: { text: '日が暮れるまで一緒にいた。' }, lose: { text: '道中に時間がかかり、行き違った。' } } },
  { id: 'lo.marry', frame: 'family', ages: [18, 60], repeat: true, needsAny: LOVERS, title: '添う相手', story: '想い人と所帯を持つか、家が勧める相手と添うか。', art: 'scene.marry',
    left: { title: '想い人と所帯を持つ', art: 'choice.lovematch', stake: risk('neighbors'), odds: 4, win: { text: '二人で所帯を持った。', add: ['spouse'] }, lose: { text: '近所とは気まずくなったが、二人で所帯を持った。', add: ['spouse'] } },
    right: { title: '家が勧める相手と添う', art: 'choice.arranged', stake: store(), odds: 6, win: { text: '家どうしの縁を結び、所帯を持った。', add: ['arrangedspouse'] } } },
  { id: 'lo.arranged', frame: 'family', ages: [20, 60], repeat: true, title: '縁談の話', story: '村の古い家が、近くの農家との縁談を勧めてきた。', art: 'scene.arranged',
    left: { title: '縁談を受ける', art: 'choice.accept', stake: store(), odds: 6, win: { text: '所帯を持った。畑仕事を二人で分けるようになった。', add: ['arrangedspouse'] } },
    right: { title: '自分で相手を探しに行く', art: 'choice.seek', stake: body(), odds: 4, win: { text: '市で、心の合う人と出会った。', meet: true }, lose: { text: '行き帰りに疲れ、話もまとまらなかった。' } } },
  { id: 'lo.child', frame: 'family', ages: [19, 42], repeat: true, needsAny: ['spouse', 'arrangedspouse', 'mistress'], title: '子を迎える', story: '家に新しい命を迎える日が近づいた。', art: 'scene.childbirth',
    left: { title: '人を頼み、食べ物を用意する', art: 'choice.celebrate', stake: store(2), odds: 6, win: { text: '皆に助けられ、子を迎えた。', add: ['child', 'villagetrust'] } },
    right: { title: '家の者で迎える', art: 'choice.quietbirth', stake: body(), odds: 5, win: { text: '元気な子を迎えた。', add: ['child'] }, lose: { text: '手を尽くしたが、子は育たなかった。' } } },
  { id: 'ch.seven', frame: 'family', ages: [20, 75], repeat: true, title: '子の学び', story: '子が七つになり、家の仕事に興味を持ち始めた。', art: 'scene.child.seven',
    left: { title: '文字と数を習わせる', art: 'choice.reading', stake: store(), odds: 5, win: { text: '子は契約の文字を指でなぞり始めた。', add: ['childletters'] }, lose: { text: '手本はまだ難しく、通えなかった。' } },
    right: { title: '麦の選り方を教える', art: 'choice.chores', stake: body(), odds: 6, win: { text: '子はよく実った麦を選れるようになった。', add: ['childhands'] } } },
  { id: 'ch.fifteen', frame: 'family', ages: [20, 75], repeat: true, title: '子の行く末', story: '育った子が、これからどこで暮らすか尋ねてきた。', art: 'scene.child.fifteen',
    left: { title: '家の畑を任せる', art: 'choice.inherit', stake: store(2), odds: 5, win: { text: '子は畑を覚え、家を継ぐ支度を始めた。', add: ['heir'] }, lose: { text: '話は先に延びたが、子は家に残った。' } },
    right: { title: '町の仕事を紹介する', art: 'choice.market', stake: body(), odds: 4, win: { text: '子は町の商家で働き始めた。', sendChild: true, add: ['childaway'] }, lose: { text: '口が見つからず、子は村に戻った。' } } },
  { id: 'sl.heirwed', frame: 'family', ages: [40, 70], needs: ['heir'], lacks: ['heirwed'], title: '跡取りの縁組', story: '跡取りに所帯を持たせる話が出ている。', art: 'scene.marry',
    left: { title: '家どうしで縁組をまとめる', art: 'choice.arranged', stake: store(2), odds: 4, win: { text: '縁組がまとまり、畑を見る手が増えた。', add: ['heirwed'] }, lose: { text: '支度がかさみ、借りをして縁組をまとめた。', add: ['heirwed', 'debt'] } },
    right: { title: '跡取りが望む相手と添わせる', art: 'choice.lovematch', stake: body(), odds: 4, win: { text: '二人は喜び、家に笑い声が増えた。', add: ['heirwed', 'garden'] }, lose: { text: '親類とは揉めたが、二人の縁組を通した。', add: ['heirwed', 'rumor'] } } },
  { id: 'ie.retire', frame: 'family', family: true, ages: [55, 65], needsAny: ['grownchild', 'heir'], title: '家を譲る日', story: '家の仕事を、育った子らに任せる頃合いになった。', art: 'scene.delegate',
    left: { title: '跡取りに家を譲る', art: 'choice.inherit', odds: 6, win: { text: '跡取りに仕事を渡し、畑の端で休む時間が増えた。', retire: 'inherit' } },
    right: { title: '子らに畑を分ける', art: 'choice.separate', odds: 6, win: { text: '子らに畑を分け、別々の竈を持たせた。', retire: 'divide', houseDown: true, add: ['branchhouse'] } } },

  // 手本: 灌漑農業と私田賃貸借。建設の規模・値段・成否と村の契約内容は推測。
  { id: 'build.newfield', frame: 'build', ages: [16, 60], repeat: true, max: { fieldId: 'newfield', count: 3 }, title: '畦を直す借り畑', story: '田主が、畦を直して耕してくれる家を探している。', art: 'place.newfield',
    left: { title: '借りて、畦を直す', art: 'choice.till', cost: { body: 2, store: 1 }, odds: 4, win: { text: '水が畑に収まり、耕せる場所が増えた。', add: ['newfield'] }, lose: { text: '土が固く、水を通しきれなかった。' } },
    right: { title: '土運びの働き手を紹介する', art: 'choice.organize', stake: body(), odds: 5, win: { text: '働き手と田主の間を取り持ち、頼られた。', add: ['villagetrust'] }, lose: { text: '条件が折り合わず、話が流れた。' } } },
  { id: 'build.well', frame: 'build', ages: [16, 60], lacks: ['well'], title: '共同井戸を直す', story: '井戸の縁が崩れ、水を汲むたびに土が落ちる。', art: 'place.well',
    left: { title: '石と人手を集めて直す', art: 'choice.build', cost: { body: 1, store: 3 }, odds: 4, win: { text: '井戸の口が整い、村で使いやすくなった。', add: ['well'] }, lose: { text: '石が足りず、直しきれなかった。' } },
    right: { title: '夜番を買って出る', art: 'choice.guard', stake: body(), odds: 4, win: { text: '井戸と村の戸口を守る番になった。', add: ['watchstaff'] }, lose: { text: '寒い夜に寝込んでしまった。' } } },
  { id: 'build.granary', frame: 'build', ages: [18, 60], lacks: ['granary'], title: '穀倉の床', story: '納屋の麦に虫が付く。床を上げ、麦を乾かす場所を作れないか。', art: 'place.storehouse',
    left: { title: '床と戸を作り直す', art: 'choice.tools', cost: { body: 1, store: 4 }, odds: 4, win: { text: '乾いた麦をしまえ、無駄が減った。', add: ['granary'] }, lose: { text: '湿りが抜けず、もう一度やり直すことになった。' } },
    right: { title: '麦を売って人を雇う', art: 'choice.hire', cost: { store: 3 }, odds: 5, win: { text: '畑を手伝う働き手が来た。', add: ['servant'] }, lose: { text: '働き手は、もっと条件のよい家へ行った。' } } },
  { id: 'build.shop', frame: 'build', ages: [20, 60], needsAny: ['jar', 'trade'], lacks: ['shop'], title: '市の売り場', story: '高昌の市で、麦と布を売る小さな店を借りられそうだ。', art: 'work.shop',
    left: { title: '蓄えを出して店を整える', art: 'choice.shop', cost: { store: 8 }, odds: 4, win: { text: '町で品物を預かる店を持った。', add: ['shop'] }, lose: { text: '店の用意で銭を使い切り、続けられなかった。' } },
    right: { title: '店先で歌と絵を売り込む', art: 'choice.paint', stake: body(), odds: 4, win: { text: '店主が寺の壁を塗る仕事を紹介してくれた。', add: ['wall'] }, lose: { text: '見本を見せたが、注文にはつながらなかった。' } } },
  // 推測: 薬の実効性や流通頻度は復元していない。回復量・間隔はローマと同じ出発点。
  { id: 'rec.medicine', frame: 'recovery', ages: [15, 75], repeat: true, cooldown: 10, tired: true, title: '薬と休み', story: '市で薬を求め、畑の仕事を一日休むことにした。', art: 'scene.medicine',
    left: { title: '自分を休ませる', art: 'choice.medicine', stake: store(), odds: 6, win: { text: '薬を飲んで眠り、体が少し楽になった。', body: 2 } },
    right: { title: '寺で仕事の相談をする', art: 'choice.temple', stake: body(), odds: 4, win: { text: '僧が畑仕事を手伝う人を紹介してくれた。', add: ['temple'] }, lose: { text: '相談相手は留守だった。' } } },
];

// 手本: 田契の証人・書き手、灌漑農業、往来する商人、寺の写経と絵。以下の主人公の道筋はすべて推測。
// 右は別の軸の同じ段へ寄る。六軸を一巡させ、どの段にも異なる札の側から入口を二本置く。
CARDS.push(
  // 推測: 村の畦の仲裁。農家が村の顔になっていく入口。
  rungCard('st.boundary', 'status', 1, { title: '動いた畦の石', story: '隣り合う二軒が、畑の境の石が動いたと言い争っている。', art: 'scene.meeting',
    left: { title: '双方の話を聞いて石を据える', art: 'choice.referee', stake: body(), odds: 5, win: { text: '両家がうなずき、村の揉め事で声をかけられるようになった。', add: ['mediator'] }, lose: { text: '双方に身びいきだと言われた。' } },
    right: { title: '忙しい二軒の麦を市で売る', art: 'choice.market', stake: body(), odds: 5, win: { text: '駄賃を受け取り、家の壺に銭を入れた。', add: ['jar'], store: 1 }, lose: { text: '売値を読み違え、駄賃は出なかった。' } } }),
  // 推測: 唐の県の文書仕事への縁。役職の法的な昇進段階を再現するものではない。
  rungCard('st.clerk', 'status', 2, { title: '役所の書き手', story: '高昌の役所で、村の畑をよく知る者に話を聞きたいという。', art: 'scene.letters',
    left: { title: '帳面を持って説明に通う', art: 'choice.reading', stake: store(2), odds: 4, win: { text: '県の書き手が、村のことはこの家に聞こうと言った。', add: ['clerk'] }, lose: { text: '帳面の食い違いを見つけられ、出直した。' } },
    right: { title: '町で麦の売り先を探す', art: 'choice.market', stake: store(2), odds: 4, win: { text: '町の商人と、毎年の売買を約束した。', add: ['trade'] }, lose: { text: '先の約束があると言われ、買ってもらえなかった。' } } }),
  // 推測: 村の請願が中央まで届く希少な道。必ず取り立てられるとは書かない。
  rungCard('st.petition', 'status', 3, { years: [640, 695], title: '遠くへ届く願い', story: '水路の修繕について、村の願いを上へ取り次ぐ者を役所が探している。', art: 'scene.letters',
    left: { title: '村の願いをまとめて託す', art: 'choice.rhetoric', stake: store(3), odds: 3, win: { text: '長安からの返書に、村と自分の名があった。', add: ['petition'] }, lose: { text: '託した書状は、返事のないままになった。' } },
    right: { title: '同じ旅の縁で隊商に加わる', art: 'choice.market', stake: store(3), odds: 3, win: { text: '西へ向かう隊商の商いに、持ち分を得た。', add: ['caravan'] }, lose: { text: '出発が遅れ、用意した品だけが残った。' } } }),
  // 推測: 碑に残る農村の水利の功。特定の高昌の碑を復元した札ではない。
  rungCard('st.stele', 'status', 4, { title: '水路の功を記す碑', story: '古い水路を直した人々の功を、石に残そうという話が出た。', art: 'scene.kishin',
    left: { title: '村の人々と名を連ねる', art: 'choice.memorial', stake: store(5), odds: 2, win: { text: '修渠の碑に名が刻まれた。後の世の人も、その水を飲み、名を読む。', add: ['stele'] }, lose: { text: '石には有力者の名だけが刻まれた。' } },
    right: { title: '人脈を使って麦と布を広く商う', art: 'choice.market', stake: store(5), odds: 2, win: { text: '商いは大きく育ち、家の身代が後の語り草になった。', add: ['fortune'] }, lose: { text: '預けた品が返らず、借りを背負った。', add: ['debt'] } } }),

  // 推測: 現物と銭が混じる家の蓄え。特定の換算率は置かない。
  rungCard('mo.jar', 'money', 1, { title: '麦刈りの駄賃', story: 'よその麦刈りを手伝い、わずかな駄賃をもらった。', art: 'scene.coin',
    left: { title: '銭を壺にしまう', art: 'choice.hoard', stake: store(), odds: 5, win: { text: '土間の壺に、少しずつ銭がたまっていく。', add: ['jar'] }, lose: { text: '壺に入れる前に、家の入り用で使ってしまった。' } },
    right: { title: '市で髪紐を買って渡す', art: 'choice.gift', stake: store(), odds: 5, win: { text: '水辺で顔を合わせる人が、次も待っていると言った。', add: ['waterpromise'] }, lose: { text: '贈り物は受け取ってもらえなかった。' } } }),
  // 手本: 小麦の現物の取引。町の商いの仕組みと主人公の成功は推測。
  rungCard('mo.trade', 'money', 2, { title: '高昌で麦を売る', story: '町の商人が、村々の麦をまとめて扱える相手を探している。', art: 'scene.market',
    left: { title: '売買の約束を帳面にする', art: 'choice.collect', stake: store(2), odds: 4, win: { text: '麦の売買を任された。毎年、手元に駄賃が残る。', add: ['trade'] }, lose: { text: '約束の量を揃えられず、取引は流れた。' } },
    right: { title: '市で気になる人を誘う', art: 'choice.approach', stake: store(), odds: 4, win: { text: '二人で市を歩く姿が、高昌で噂になった。', add: ['townlove'] }, lose: { text: '忙しいと断られ、ひとりで帰った。' } } }),
  // 推測: 隊商の共同出資。西州の具体的な契約様式・収益率は復元していない。
  rungCard('mo.caravan', 'money', 3, { title: '西へ行く隊商', story: '西域へ向かう商人が、品物を持ち寄る仲間を募っている。', art: 'work.trade',
    left: { title: '麦と布を託す', art: 'choice.market', stake: store(4), odds: 3, win: { text: '隊商が戻り、遠くの町との商いに持ち分を得た。', add: ['caravan'] }, lose: { text: '道がふさがり、託した品は戻らなかった。' } },
    right: { title: '旅へ出る想い人に手紙を託す', art: 'choice.letter', stake: body(), odds: 3, win: { text: '遠くの町から、返事が届くようになった。', add: ['farletters'] }, lose: { text: '返事はなく、便りの行方も分からなかった。' } } }),
  // 推測: 太平の商いで富を残す上の段。富の実数を歴史上の身代に換算しない。
  rungCard('mo.fortune', 'money', 4, { title: '家々を結ぶ商い', story: '幾つもの町の商人が、一緒に大きな取引をしないかと誘ってきた。', art: 'work.trade',
    left: { title: '家の蓄えを商いに出す', art: 'choice.market', stake: store(5), odds: 2, win: { text: '麦と布の取引は家を越えて育ち、その富は後世にも語られた。', add: ['fortune'] }, lose: { text: '取引相手が倒れ、預けた品は戻らなかった。', add: ['debt'] } },
    right: { title: '旅の語り手に二人の恋を話す', art: 'choice.tell', stake: body(), odds: 2, win: { text: '語り手は二人の話を書き留めた。名を変えた恋が、後の世まで伝わった。', add: ['lovetale'] }, lose: { text: '語り手は、別の話を選んだ。' } } }),

  // 推測: 用水の水汲みで始まる恋。身分・言語の違いの詳細は初稿で再現していない。
  rungCard('lo.water', 'love', 1, { title: '水汲みの帰り道', story: 'いつも同じ頃に水を汲む人が、今日は帰り道で待っている。', art: 'scene.river',
    left: { title: '一緒に帰ろうと誘う', art: 'choice.approach', stake: body(), odds: 5, win: { text: '二人で帰り、明日も会う約束をした。', add: ['waterpromise'] }, lose: { text: '待っていたのは、別の人だった。' } },
    right: { title: '水を家の豆の庭へ運ぶ', art: 'choice.garden', stake: body(), odds: 5, win: { text: '家の傍らに、豆と若い果樹の庭が育った。', add: ['garden'] }, lose: { text: '途中で水をこぼし、苗を枯らした。' } } }),
  // 推測: 町で恋を評判にする道と、家の次の代へ備える道。
  rungCard('lo.market', 'love', 2, { title: '市が終わる夕暮れ', story: '高昌の市が終わり、知り合った人がもう少し話そうと言う。', art: 'scene.festival',
    left: { title: '歌を聴きながら二人で歩く', art: 'choice.approach', stake: store(), odds: 4, win: { text: '二人が歩く姿を、町の人々が覚えた。', add: ['townlove'] }, lose: { text: '人目が気になり、早々に別れた。' } },
    right: { title: '家に帰り、子の代の備えを整える', art: 'choice.home', stake: store(2), odds: 4, win: { text: '次の代の支度に使える麦を取り分けた。', add: ['dowry'] }, lose: { text: '家の修繕で使ってしまい、取り分けられなかった。' } } }),
  // 推測: 恋文が隊商とともに旅する。実在の手紙の内容は借りていない。
  rungCard('lo.letters', 'love', 3, { title: '遠い町からの便り', story: '親しくなった人が、次は遠くの町で暮らすという。', art: 'scene.letter',
    left: { title: '手紙を交わし続ける', art: 'choice.letter', stake: store(2), odds: 3, win: { text: '幾つもの町を越え、二人の手紙が行き交った。', add: ['farletters'] }, lose: { text: '手紙は行き違い、返事が途絶えた。' } },
    right: { title: '村に残り、孫の代へ果樹を植える', art: 'choice.plant', stake: body(2), odds: 3, win: { text: '自分が老いてからも実る果樹を、家の畑に植えた。', add: ['oldorchard'] }, lose: { text: '若木が根づかず、植え直しになった。' } } }),
  // 推測: 恋を後世へ残す道。家で子が語り継ぐ側も選ぶため、育った子がいるときに来る。
  rungCard('lo.tale', 'love', 4, { needs: ['grownchild'], title: '二人の話を残す', story: '町の書き手が、旅の人から二人の恋を聞いたという。家の子らも、若い日の話を聞きたがっている。', art: 'scene.letters',
    left: { title: '書き手に二人の話を託す', art: 'choice.tell', stake: store(3), odds: 2, win: { text: '二人の話は書き継がれ、知らぬ土地の人まで読むようになった。', add: ['lovetale'] }, lose: { text: '書き手は故郷へ帰り、話は残らなかった。' } },
    right: { title: '子らに家の来し方を語る', art: 'choice.tell', stake: body(), odds: 2, win: { text: '子らはその話を孫へ伝えた。家を守った人として語り継がれた。', add: ['ancestor'] }, lose: { text: '子らは忙しく、話は聞かれないまま終わった。' } } }),

  // 推測: 麦だけに頼らない家の庭。
  rungCard('sl.garden', 'slow', 1, { title: '畑の端の小さな庭', story: '麦畑の端に、豆と果樹を育てる場所を取れそうだ。', art: 'scene.garden',
    left: { title: '家で食べるものを植える', art: 'choice.plant', stake: body(), odds: 5, win: { text: '家族が摘める豆と果物が育った。', add: ['garden'] }, lose: { text: '水加減を誤り、苗が根づかなかった。' } },
    right: { title: '庭仕事の代わりに村の夜番に立つ', art: 'choice.guard', stake: body(), odds: 5, win: { text: '戸口を回り、夜番の棒を預かった。', add: ['watchstaff'] }, lose: { text: '物音を追って畦で転び、笑われた。' } } }),
  // 推測: 現物を取り分ける次の代への備え。子が自動で生まれたことには点を付けない。
  rungCard('sl.reserve', 'slow', 2, { title: '次の代の麦', story: '今年の麦を使い切るか、家の次の代のために分けておくか。', art: 'place.storehouse',
    left: { title: '支度に使う麦を分けてしまう', art: 'choice.hoard', stake: store(2), odds: 4, win: { text: '家の次の代へ渡せる備えができた。', add: ['dowry'] }, lose: { text: 'しまった麦に虫が付いてしまった。' } },
    right: { title: '麦を町へ護送する仕事に出る', art: 'choice.escort', stake: riskBody(), odds: 4, win: { text: '荷を守り抜き、町で頼られるようになった。', add: ['escort'] }, lose: { text: '荷を狙われ、腕に傷を負った。', add: ['wound'] } } }),
  // 推測: 孫の代を見越す果樹園。果樹の寿命や地代の将来を数値で保証するものではない。
  rungCard('sl.orchard', 'slow', 3, { title: '老いてから実る木', story: '古い果樹の横に、新しい木を植え足す時期が来た。', art: 'scene.garden',
    left: { title: '孫の代の実りまで考えて植える', art: 'choice.plant', stake: store(3), odds: 3, win: { text: '若木が育った。家の畑で、次の次の代も実を摘めそうだ。', add: ['oldorchard'] }, lose: { text: '若木は冬を越せず、枯れてしまった。' } },
    right: { title: '果樹の代わりに西の道案内へ出る', art: 'choice.escort', stake: riskBody(2), odds: 3, win: { text: '水場を見失わず、一行を遠くの町まで導いた。', add: ['guide'] }, lose: { text: '道を誤り、衰弱して戻った。', add: ['wound'] } } }),
  // 推測: 後世の家の語り。育った子がいることを条件にする。
  rungCard('sl.ancestor', 'slow', 4, { needs: ['grownchild'], title: '家を守った人の話', story: '子らが、この家の畑と水はどのように守られてきたか尋ねてきた。', art: 'scene.hearth',
    left: { title: '家の来し方を子らに残す', art: 'choice.tell', stake: body(), odds: 2, win: { text: '子らは水番の日にこの話を思い出し、孫へ伝えた。家を守ったご先祖として名が残った。', add: ['ancestor'] }, lose: { text: '話をする機会がなく、名はやがて忘れられた。' } },
    right: { title: '旅人に越えてきた道を語る', art: 'choice.tell', stake: body(), odds: 2, win: { text: '旅人は道の伝えに名を添え、次の旅人へ伝えた。', add: ['routetale'] }, lose: { text: '道は変わり、話は使われなくなった。' } } }),

  // 推測: 日々の夜番が武の最初の実績になる。能力そのものには点を付けない。
  rungCard('sr.watch', 'strength', 1, { title: '眠らぬ夜番', story: '村の羊が一頭、夜のうちに消えた。戸口と囲いを見回る者が要る。', art: 'scene.bandits',
    left: { title: '棒を持ち、夜通し見回る', art: 'choice.guard', stake: riskBody(), odds: 5, win: { text: '囲いを守り、村の夜番を任された。', add: ['watchstaff'] }, lose: { text: '暗い畦で足をひねった。', add: ['wound'] } },
    right: { title: '皆を起こす歌を作る', art: 'choice.sing', stake: body(), odds: 5, win: { text: '歌は皆に覚えられ、麦刈りでも歌われた。', add: ['song'] }, lose: { text: '調子が合わず、歌は続かなかった。' } } }),
  // 推測: 村の夜番から町の護衛へ。これは戦場ではないので争いの型にはしない。
  rungCard('sr.escort', 'strength', 2, { title: '町までの護衛', story: '高昌へ向かう商人が、荷を守る者を探しに来た。', art: 'scene.market',
    left: { title: '荷のそばで見張り続ける', art: 'choice.guard', stake: riskBody(), odds: 4, win: { text: '町まで荷を届け、護衛を頼むならこの人だと言われた。', add: ['escort'] }, lose: { text: '荷は守ったが、石を受けて傷を負った。', add: ['wound'] } },
    right: { title: '寺へ行き、壁を描く仕事を求める', art: 'choice.paint', stake: body(2), odds: 4, win: { text: '壁の絵が町で評判になった。', add: ['wall'] }, lose: { text: '顔料がうまく乗らず、塗り直した。' } } }),
  // 推測: 西域の水場と道を知る案内人。特定の旅程・距離は復元しない。
  rungCard('sr.guide', 'strength', 3, { title: '水場をつなぐ道', story: '西へ向かう一行が、水場を知り、荷駄と人を導ける者を求めている。', art: 'scene.bandits',
    left: { title: '一行の先に立つ', art: 'choice.escort', stake: riskBody(2), odds: 3, win: { text: '皆を無事に導き、西の町々でも頼られる案内人になった。', add: ['guide'] }, lose: { text: '砂に足を取られ、古傷を増やして戻った。', add: ['wound'] } },
    right: { title: '旅の僧に写した経を託す', art: 'choice.reading', stake: store(2), odds: 3, win: { text: '自分の写本が、西域の寺へ運ばれた。', add: ['copy'] }, lose: { text: '旅の途中で雨に濡れ、字が流れたという。' } } }),
  // 推測: 地方の案内人が後代の道の語りに残る。実在の旅行記への登場は捏造しない。
  rungCard('sr.route', 'strength', 4, { title: '道の話を聞きたい人', story: '遠くから来た書き手が、ここを越えた人々の話を書き集めている。', art: 'scene.letters',
    left: { title: '自分の越えた道を語る', art: 'choice.tell', stake: body(), odds: 2, win: { text: '旅人を助けた話が書き留められ、後の旅人にも名が伝わった。', add: ['routetale'] }, lose: { text: '書き手は話を疑い、名を記さなかった。' } },
    right: { title: '文字と絵で道の覚えを残す', art: 'choice.paint', stake: store(3), odds: 2, win: { text: '手跡を写す人が現れ、紙が傷んでも次の写しが残った。', add: ['manuscript'] }, lose: { text: '紙はしまわれたまま、失われてしまった。' } } }),

  // 推測: 村で歌われる歌の作り手。史料にない歌詞を史実として扱わない。
  rungCard('ar.song', 'art', 1, { title: '麦刈りの歌', story: '長い麦刈りの間、誰かが歌を始めた。次の節が途切れ、皆がこちらを見る。', art: 'scene.harvest',
    left: { title: '村の畑を歌にする', art: 'choice.sing', stake: body(), odds: 5, win: { text: '歌は畑から畑へ渡り、村の人が口ずさむようになった。', add: ['song'] }, lose: { text: '息が続かず、歌は途中で止まった。' } },
    right: { title: '歌をやめ、働く組の仲を取り持つ', art: 'choice.referee', stake: body(), odds: 5, win: { text: '組どうしの言い争いを収め、村で頼られた。', add: ['mediator'] }, lose: { text: '双方の不満を聞くだけで、一日が終わった。' } } }),
  // 手本: 高昌の仏教文化。農夫が寺の壁画を描く道と、この絵の内容は推測。
  rungCard('ar.wall', 'art', 2, { title: '寺の壁を彩る', story: '高昌の寺で、古い壁を塗り直す絵師の手が足りないという。', art: 'scene.temple',
    left: { title: '絵師について壁を描く', art: 'choice.paint', stake: body(2), odds: 4, win: { text: '麦畑の人々を描いた壁が、参る人の目を引いた。', add: ['wall'] }, lose: { text: '顔料の加減が悪く、色が剥がれてしまった。' } },
    right: { title: '寄進者の名を書き留める', art: 'choice.reading', stake: body(), odds: 4, win: { text: '確かな書き手として、県の書き手に紹介された。', add: ['clerk'] }, lose: { text: '名を書き違え、書き直すことになった。' } } }),
  // 手本: 寺の写経と僧の往来。高昌のこの人物の写本が西へ渡る筋は推測。
  rungCard('ar.copy', 'art', 3, { title: '旅する経の写本', story: '西へ向かう僧が、旅先の寺へ持っていく経を写してほしいという。', art: 'scene.letters',
    left: { title: '字を揃え、経を書き写す', art: 'choice.reading', stake: store(2), odds: 3, win: { text: '写本は僧とともに西へ渡り、別の寺でも写された。', add: ['copy'] }, lose: { text: '誤写が多く、持っていってもらえなかった。' } },
    right: { title: '村の願いを同じ便りに託す', art: 'choice.letter', stake: body(), odds: 3, win: { text: '役所を通じて長安まで願いが届き、名を書いた返書が来た。', add: ['petition'] }, lose: { text: '書状は途中の役所に留め置かれた。' } } }),
  // 推測: 写しが重なって筆跡が後世へ残る。現存する特定の写本を主人公作とはしない。
  rungCard('ar.legacy', 'art', 4, { title: '手本にしたい手跡', story: '若い書き手が、あなたの手跡を手本に写したいと言う。', art: 'scene.letters',
    left: { title: '長く使う手本を書き上げる', art: 'choice.reading', stake: store(3), odds: 2, win: { text: '手本は何度も写され、後の世にもその手跡が残った。', add: ['manuscript'] }, lose: { text: '手本は一代で散逸し、写しも残らなかった。' } },
    right: { title: '水路を直した村人の功を記す', art: 'choice.memorial', stake: store(5), odds: 2, win: { text: '村人と連ねた名が、修渠の碑に残った。', add: ['stele'] }, lose: { text: '碑文は書き換えられ、村人と自分の名は消えた。' } } }),
);

// 推測: 畑と水のめぐりを描いた、二択なしで流れる暮らしの場面。
const VIGNETTES = [
  ['q.water', [7, 75], '水の来る朝', '夜の間に用水が来た。畑の土が黒く湿っている。'],
  ['q.wind', [7, 75], '麦を選る風', '籠から麦を落とす。風が麦殻だけを遠くへ運んだ。'],
  ['q.bread', [7, 75], '竈の匂い', '竈から焼いた粉ものの匂いがして、家の者が集まってきた。'],
  ['q.snow', [7, 75], '遠い山の雪', '畑の向こうの山が白い。水番の年寄りが、雪の残りを眺めている。'],
  ['q.donkey', [7, 75], '荷を下ろす昼', '驢馬から荷を下ろした。耳を動かす驢馬の横で、麦の袋を数えた。'],
  ['q.rain', [7, 75], '土壁の影', '珍しい雨のあと、家の土壁が濃い色になった。戸口で乾くのを待った。'],
  ['q.market', [15, 75], '市の言葉', '市には聞き慣れない言葉も響く。値を尋ねると、商人は指で数を示した。'],
  ['q.temple', [7, 75], '寺の灯', '夕暮れの寺から、灯がひとつ見えた。帰り道の足元を確かめた。'],
  ['q.apricot', [15, 75], '木陰の実', '果樹の下に小さな実が落ちている。拾って袖で拭き、口に入れた。'],
  ['q.thread', [15, 75], '糸を巻く音', '家の中で糸を巻く音がする。外では、鍬の土を落とす音がした。'],
  ['q.family', [25, 75], '子の歩幅', '隣を歩く子の歩幅が、いつの間にか自分と同じになっていた。', { needs: ['grownchild'] }],
  ['q.partner', [20, 75], '二人で数える麦', '連れ合いと、残った麦を数えた。同じ袋を二度数え、二人で笑った。', { needs: ['spouse'] }],
];
CARDS.push(
  { id: 'q.season', frame: 'quiet', quiet: true, repeat: true, ages: [7, 75], title: 'いつもの一年', story: '麦をまき、水を引き、収穫した。大きなことのない一年だった。', art: 'scene.quiet',
    left: { title: '一年が過ぎる', art: 'choice.rest', odds: 6, win: { text: '畑と家を行き来して、一年が過ぎた。' } },
    right: { title: '一年が過ぎる', art: 'choice.rest', odds: 6, win: { text: '畑と家を行き来して、一年が過ぎた。' } } },
  ...VIGNETTES.map(([id, ages, title, text, extra = {}]) => ({ id, frame: 'quiet', quiet: true, ages, title, story: text, art: 'scene.quiet', ...extra,
    left: { title, art: 'choice.rest', odds: 6, win: { text } }, right: { title, art: 'choice.rest', odds: 6, win: { text } } })),
);

// 推測: 世帯の重みと幼いきょうだいの生死はローマの出発値を借りる。高昌の人口推計ではない。
const BIRTH = {
  houses: [
    { id: 'plain', weight: 2 },
    { id: 'modest', weight: 1, houseLevel: 2, houseStore: 3, patch: { 1: { prepend: '家には少し麦の蓄えがあり、父は水路の順番を気にしている。' } } },
    { id: 'poor', weight: 1, add: ['debt'], patch: { 1: { prepend: '家は麦を借りて冬を越した。次の実りから返さねばならない。' } } },
  ],
  siblingModel: { born: [1, 2, 3, 3, 3, 2, 2, 1, 1], elderShare: 0.5, deathRate: 0.45, youngerAges: [2, 4, 6], replaceAge: 3, elderAge: 3,
    plainEvent: { title: '畑までひとりで', story: '畦の道を、ひとりで歩いて行けるようになった。', cards: [], art: 'event.walk' },
    elderStory: '上には、{list}いる。畑へ向かう背中を追う。', only: 'きょうだいは、いない。', birthLines: { 妹: '妹が生まれた。' },
    recallLines: { both: 'この六年で弟妹が{born}生まれ、きょうだいのうち{lost}が育たなかった。', born: 'この六年で弟妹が{born}生まれた。', lost: 'この六年で、きょうだいのうち{lost}が育たなかった。' },
  },
};
// 推測: 土壁の家・用水・麦畑・村の寺を一つずつ覚える。620年はまだ高昌の王国。
const CHILDHOOD = [
  { year: 620, age: 0, title: '高昌の農家に生まれた', story: '山から来る水で麦を育てる、高昌の小さな農家に生まれた。', cards: ['mother', 'house'], art: 'event.birth.mikawa' },
  { year: 621, age: 1, title: '父と麦畑', story: '父は朝から麦畑へ行く。畦の上で見つけると、肩に担いでくれた。', cards: ['father', 'paddy', 'ie'], art: 'event.father.field' },
  { year: 622, age: 2, title: '水を分ける家々', story: '水路のそばで、近所の人々が順番を話し合っている。', cards: ['neighbors', 'elderhouse'], art: 'event.neighbors' },
  { year: 623, age: 3, title: '家に増える声', story: '家にはいろいろな声がある。大人の言葉が、少しずつ分かる。', cards: [], art: 'event.walk' },
  { year: 624, age: 4, title: '寺への道', story: '母と寺へ行った。帰りに隣家へ寄り、水の話を聞いた。', cards: ['temple', 'neighborhouse'], art: 'scene.temple' },
  { year: 625, age: 5, title: '遠くの国の話', story: 'ここは高昌の国だという。東には唐という、大きな国があるらしい。', cards: ['kingdom'], art: 'scene.news' },
  { year: 626, age: 6, title: '麦と水の一年', story: '水を待つ春と、麦を選る季節。一年のめぐりが少し分かってきた。', cards: ['spring'], art: 'event.seasons' },
];
const FAMILY_OMENS = {
  'fam.father': '父が畑のことを確かめるようになった', 'fam.mother': '母が床に伏せる日が増えた', 'fam.sister': '妹に縁談が来ている',
  'ie.succession': '家の畑を求める縁者がいる', 'ie.retire': '育った子らに家を譲る頃合いだ', 'lo.arranged': '村の家から縁談の話が来ている',
  'lo.marry': '想い人と所帯を持つ話が出ている', 'lo.child': '家に新しい命を迎える兆しがある',
};
const FAMILY_AGES = { 'fam.father': [28, 42], 'fam.mother': [33, 50], 'fam.sister': [17, 22], 'ie.succession': [28, 75], 'ie.retire': [55, 65], 'lo.arranged': [20, 30], 'lo.marry': [18, 60] };
const INITIAL_FAMILY_EVENTS = ['fam.father', 'fam.mother', 'fam.sister', 'lo.arranged'];
const KINSHIP_RELATIVES = [];
const DISASTER_TARGETS = { fire: ['house', 'shop', 'granary'], flood: ['paddy', 'newfield', 'well'], famine: ['paddy', 'newfield'] };
const TEXT = {
  demandSources: { 'dm.transport': '西州の役所より', 'dm.water': '水を分ける村の家々より' },
  houseNames: { own: '{name}{layer}', neighbor: '隣の{name}{layer}', branch: '{rel}の{name}分家', patron: '村の有力な{name}{layer}' },
  spouseLabel: '妻（{name}）', diedOfIt: 'それがもとで、助からなかった。',
  substitutes: { father: '父が「私が行く」と言い出した。', grownchild: '子が「私が行きます」と言い出した。', fatherDemand: '父が「私が行く」と', grownchildDemand: '子が「私が行きます」と', childChoice: '子の申し出を受ける', fatherChoice: '父の申し出を受ける', servantChoice: '働き手を出す', hireChoice: '代わりの者を雇う', noneChoice: '誰も出さない', call: '戦', noOne: '役を逃れたという噂が立つ', noOneResult: '戦に誰も出さず、村で噂が立った。', hireResult: '代わりの者を雇って荷を運ばせた。', result: '{name}は{outcome}', ignoreResult: '{name}が代わりに戦へ出た。{outcome}', returned: '無事に戻った。', lost: '戻らなかった。' },
  contest: { lostField: '畑', surrender: '{rel}に家を譲り、別の所帯を持った。{result}', splitField: '畑を分けてもらった。', littleField: '畑はわずかしか残らなかった。', inherited: '{rel}を跡取りに替えた。{loss}', titleLoss: '家の格を失った。', noField: '{rel}を退けたが、畑と家の格を失った。' },
  succession: { title: '家を継ぐ者', selfStory: '父を見送った翌年、{rel}が家を継ぎたいと申し出た。', story: '{rel}が家を継ぎたいと申し出た。', fight: '{rel}と家の継承を争う', surrender: '{rel}に家を譲り、別の所帯を持つ', replace: '{rel}を跡取りに替える', noteSurrender: '{rel}に家を譲り、別の所帯を持った', noteWin: '{rel}と継承を争って家を継いだ', noteLose: '{rel}と継承を争い、畑を失いながら家を継いだ' },
  kinArrive: '{rel}の{name}が顔を見せに来た。', grandchildBorn: '跡取りに子が生まれた。孫だ。', childSpared: 'まだ子どもだったので、命までは取られなかった。',
  introduce: { mother: '母は{name}。', father: '父は{name}。', sister: '妹は{name}。', 兄: '兄は{name}。' },
  namedTitle: '{name}、生まれる', named: '家では{name}と呼ばれた。', namedAfterFather: '',
  yearEnd: '今年の実り：', maintenanceTitle: '{target}をよくする話', maintenanceStory: '{target}を、もう一段よくできそうだ。',
  medicineSide: { head: '親の薬', lead: '市の薬を、父や母のために求める。' },
  partingTitle: '疎遠になった縁', partingChoice: '会わないまま三年が過ぎた', partingArt: 'bond.parting', partingText: 'とは疎遠になった。思い出の品が残った。',
  familyShift: { fatherDeath: ['父の顔色がよくなった。', '父がめっきり老け込んだ。'], motherDeath: ['母が庭へ出られるようになった。', '母が床に伏せる日が増えた。'], sisterMarriage: ['妹の縁談が先に延びた。', '妹の縁談が早まりそうだ。'], arrangedMarriage: ['縁談の話が遠のいた。', '縁談の話が近づいた。'], partnerMarriage: ['所帯を持つ話が先に延びた。', '所帯を持つ話が近づいた。'], divorce: ['夫婦の溝が少し埋まった。', '夫婦の溝が深まった。'], birth: ['子はまだ授からない。', '子を授かる兆しがある。'] },
  lifeRoles: { general: '高昌の農夫', rank1: '麦を運んだ農夫', rank2: '守備の隊のまとめ役', champion: '軍の指揮役', knownVillageHead: '村と役所に頼られた顔役', villageHead: '村の顔役', storehouse: '麦倉持ち', merchant: '麦と布の商人', martial: '街道の護衛', hermit: '村に暮らす隠者' },
  lifeTitles: { status: '名の通った', money: '富を築いた', love: '浮名を流した', slow: '土地に根付いた', strength: '腕の立つ', art: '手跡を残した', loveless: '恋に縁のなかった', celebratedLove: '恋を重ねた', plain: '名もなき', kantoPrefix: '遠くの町へ出た' },
  houseEnding: { heading: '家の行く末：', inherited: '跡取りに家を譲った', divided: '子らに畑を分けた', rival: 'と継承を争い、所帯を分けた', defended: 'と継承を争い、跡取りが家を守った', ended: '当主の代で終えた', heir: '跡取り', yes: 'あり', no: 'なし' },
};
const CARD_RULES = {
  'dm.transport': 'battle', 'lo.meet': 'partnerMeet', 'lo.visit': 'partnerVisit', 'lo.marry': 'partnerMarriage', 'lo.arranged': 'arrangedMarriage',
  'lo.child': 'birth', 'ch.seven': 'childSeven', 'ch.fifteen': 'childFifteen', 'fam.father': 'fatherDeath', 'fam.mother': 'motherDeath', 'fam.sister': 'sisterMarriage',
  'ie.succession': 'succession', 'ie.retire': 'retirement', 'rec.medicine': 'medicine', 'maintenance': 'maintenance', 'q.season': 'quietCard',
  ...Object.fromEntries(VIGNETTES.map(([id]) => [id, 'quietCard'])),
};
const CARDS_WITH_RULES = CARDS.map((card) => ({ ...card, kind: card.year ? 'history' : card.disaster ? 'disaster' : card.demand ? 'demand' : card.quiet ? 'upkeep' : card.family ? 'family' : 'event', category: card.id.startsWith('lo.') ? 'relationship' : card.id.startsWith('ch.') ? 'child' : null, role: CARD_RULES[card.id] || (card.id.startsWith('lo.') ? 'relationship' : card.id.startsWith('ch.') ? 'childMilestone' : null), disasterType: card.id.startsWith('dis.') ? card.id.slice(4) : null, disasterKey: card.disaster ? card.id : null, familyAge: FAMILY_AGES[card.id] || null }));
const CARD_IDS = Object.fromEntries(CARDS_WITH_RULES.filter((card) => card.role).map((card) => [card.role, card.id]));
const ABILITY_EFFECTS = {
  hygiene: ['dis.plague', 'dis.wound', 'rec.medicine:left', 'lo.child'],
  soil: ['child.harvest', 'dis.famine', 'build.newfield', 'sl.garden', 'sl.orchard'],
  body: ['child.harvest', 'vi.road:left', 'sr.watch', 'sr.escort'],
  foresight: ['hist.west', 'hist.contract'],
  numbers: ['hist.contract:left', 'mo.jar', 'mo.trade', 'mo.caravan', 'mo.fortune'],
  organizing: ['dm.water', 'dm.transport', 'st.clerk', 'build.granary'],
  expression: ['child.letters', 'ar.song', 'ar.wall', 'ar.copy', 'ar.legacy', 'lo.tale'],
  outdoors: ['dis.flood', 'sr.guide', 'sr.route', 'vi.road'],
  cooking: ['dis.famine:right', 'build.granary', 'sl.garden'],
  making: ['build.well', 'build.granary', 'ar.wall'],
  animals: ['mo.caravan', 'sr.guide', 'dm.transport'],
  faith: ['fam.father:right', 'ar.copy', 'ar.legacy'],
};
const RANDOM_ABILITIES = Object.keys(ABILITY_EFFECTS);
const abilityStories = {
  hygiene: '水と布を清潔にし、病や傷を手当てする記憶が残っている。', soil: '種と土の様子を見て、育ち方を考える癖が残っている。', body: '無理をせず体を鍛え、重い物を運ぶ手つきが残っている。',
  foresight: '高昌と唐の行く末を、少しだけ知っている。', numbers: '麦と布の数を比べ、帳面を付ける感覚が残っている。', organizing: '人手と日取りを分け、仕事を回す知恵が残っている。',
  expression: '歌や絵や文字で、人の心を動かした記憶がある。', outdoors: '水場や天気を見て、道を選ぶ知恵が残っている。', cooking: '粗い食べ物を食べやすくし、保存する工夫を覚えている。',
  making: '身近な材料で、物を直した手つきが残っている。', animals: '荷を運ぶ獣の疲れや具合を見分ける感覚が残っている。', faith: '寺での作法や経の扱いに、自然と気を配る。',
};
const GLOSSARY = {
  高昌: '吐魯番の盆地にあった町と国。640年に唐の西州が置かれた。', 吐魯番: '現在のトルファン。山から来る水を利用する、乾いた盆地のオアシス。',
  西州: '唐が高昌の地に置いた州。この一生では640年からその名になる。', 田契: '畑を借りる約束などを書いた契約。643年の高昌の田契には、小麦で地代を払う取り決めが残る。',
  田租: '田畑を借りて耕す者が、田主に納める地代。ここでは麦で払う。国への税とは分ける。', 用水: '田畑へ引く水と、その通り道。村の家々で順を決めて使う。',
  麦殻: '麦の粒を包む殻など。風を使って、粒から分ける。', 軍粮: '兵の食べ物。ここでは農家から守備の兵へ運ぶ麦。',
  隊商: '人と荷を組にして、遠い町どうしを往来する商人たち。', 長安: '唐の都。高昌から遠く東にある。', 西域: '中国の王朝から見て西の地域。高昌を通る道の先に、幾つもの町と国がある。',
  修渠: '畑へ水を通す水路を造ったり直したりすること。', 写本: '文字を手で書き写した本や巻物。印刷した本ではない。',
};

export default { id: 'tang', SCOPES, birthYear: 620, yearLabel: (year) => `${year}年`, glossary: GLOSSARY, display: { title: '唐・高昌の農村 — 一年の札', heading: ['唐・高昌', 'の農村'], short: '唐・高昌' }, settings, AXES, LAYERS, SURNAMES, FIELD, START_FIELD, CARDS: CARDS_WITH_RULES, cardById: new Map(CARDS_WITH_RULES.map((card) => [card.id, card])), CARD_IDS, RANDOM_ABILITIES, ABILITY_EFFECTS, abilityStories, NAMING, specialIds: { reconsider: 'goal.reconsider', parting: 'lo.parting', maintenance: 'maintenance' }, specialRoles: { maintenance: 'maintenance' }, CHILDHOOD, BIRTH, FAMILY_OMENS, FAMILY_AGES, INITIAL_FAMILY_EVENTS, KINSHIP_RELATIVES, partnerIds: LOVERS, disasterTargets: DISASTER_TARGETS, text: TEXT };
