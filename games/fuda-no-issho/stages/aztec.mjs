import { DEFAULTS } from './defaults.mjs';

// アステカ（メシーカ）の湖畔、チナンパの村の一生。1484 年生まれ、場所（ショチミルコ湖・チャルコ湖のほとり）は作り手の Claude が決めた（2026-11-05）。
// 調査と出典: docs/planning/2026-11-05-butai-aztec--wip.md。メモの節番号を札のコメントに「メモ 6」のように書く。
// 一次史料は読んでいない。確かめていない所は「推測」。ここの文は全部 LLM の下書き（llm）。
// 1484 生まれ: 7 歳 1491、成人 1499 ごろ。1502 モクテスマ 2 世、1507 新しい火、1519〜21 征服、1545 疫病、1558 聞き書き（推測）。
const settings = {
  ...DEFAULTS,
  staggeredReveal: true,
  // DEFAULTS に無い家・普請・相続の値はローマと同じ仮置き。釣り合いは sim の表で試した。
  houseMight: { rank: [0, 2, 4], field: 1, fieldLevel: 1, worker: 2, trust: 1 },
  buildPrice: { 2: 8, 3: 25, 4: 60 },
  claims: { heir: 5, '嫡子': 5, '庶子': 4, '妾腹の子': 3, '兄': 4 },
  // 一夫多妻は貴族だけ（メモ 8）。農民の主人公は側室を持たない。
  maxConcubines: 0,
  expansionField: 'newfield',
  roleAliases: { heir: 'heir', villagetrust: 'villageTrust', waterwise: 'waterwise', feat: 'merit' },
  rankAliases: { captor: 1, warrior: 2 },
  // 外の死の来やすさ。1519〜21 の戦と天然痘、1545〜48 の疫病は札でも出すので、年の率は上げすぎない。
  dangerEras: [
    { from: 1484, to: 1518, chance: 0.13 },
    { from: 1519, to: 1521, chance: 0.24 },
    { from: 1522, to: 1544, chance: 0.15 },
    { from: 1545, to: 1548, chance: 0.26 },
    { from: 1549, to: 1560, chance: 0.15 },
  ],
};

const AXES = {
  status: { name: 'ステータス', mark: '王冠', here: '平民から身を起こして、名を知られる', ladder: ['カルプリの顔役', '湖畔の町の役目', '王の都の役目', '絵に名が残る'] },
  money: { name: 'マネー', mark: '硬貨', here: '布とカカオで財を成す', ladder: ['家のカカオ', '市の売り場', '遠い国への荷', '語り草の富'] },
  love: { name: 'ラブ', mark: 'ハート', here: '歌と花に恋を重ねる', ladder: ['歌の家の恋', '市で噂の二人', '宮廷に聞こえた恋', '歌に残る恋'] },
  slow: { name: 'スローライフ', mark: '葉', here: '浮き畑を守り、穏やかに暮らす', ladderBy: 'generation', ladder: ['自分の畑と庭', '子の代', '孫の代', '語り継がれるご先祖'] },
  strength: { name: 'ストレングス', mark: '拳', here: '捕虜を捕える戦士になる', ladder: ['村の力自慢', '捕えた者', '鷲とジャガーの戦士団', '名の残る武勇'] },
};
const SCOPES = ['カルプリ（村）', '湖畔の町', '王の都', '天下と後世'];
const LAYERS = { village: { name: '家', ranks: ['暮らしの細い家', '蓄えのある家', 'カルプリで名の通った家'] } };
// 家の呼び名は村の小さな区画の名（推測: 平民は姓を持たない。ナワトル語の語形は未確認）。
const SURNAMES = ['アカルコ', 'アメヤルコ', 'トラルテンコ', 'イスタパ', 'ミルコ', 'アワウトラ', 'テソントラ', 'ショチカルコ'];

// 人名: 平民は日の名（数 + 日の印）で呼ばれたとする（推測）。名前の部品表は各 10。
// 同じ家の兄弟は部品表の順で呼び分け、10 を超えたら（2）を添える。
const NAMING = {
  male: ['セ・アカトル', 'オメ・トチトリ', 'エイ・コアトル', 'ナウイ・オセロトル', 'マクイリ・クアウトリ', 'チコメ・マサトル', 'チクエイ・カリ', 'チコナウイ・アトル', 'マトラクトリ・イツクイントリ', 'オメ・テクパトル'],
  female: ['マクイリ・ショチトル', 'セ・マリナリ', 'オメ・キアウィトル', 'エイ・シパクトリ', 'チコメ・ショチトル', 'ナウイ・アトル', 'チクアセ・マリナリ', 'マトラクトリ・ショチトル', 'セ・シトラリ', 'オメ・アカトル'],
  nameOf(ctx, who, key) {
    const { male, female } = NAMING;
    const father = male[ctx.hash('father') % male.length];
    const family = male.filter((name) => name !== father);
    const selfOrder = ctx.siblings.filter((sib) => sib.elder && sib.male).length;
    const given = (pool, order, tag) => `${pool[(ctx.hash(tag) % pool.length + order) % pool.length]}${order >= pool.length ? `（${order + 1}）` : ''}`;
    const self = given(family, selfOrder, 'brothers');
    if (who === 'father') return father;
    if (who === 'self') return self;
    if (who === 'son') return given(male.filter((name) => ![father, self].includes(name)), Number(key) - 1, 'sons');
    if (who === 'mother') return given(female, 0, 'mother');
    if (who === 'spouse') return given(female, 0, `spouse${key}`);
    if (who === 'daughter') return given(female, Number(key) - 1, 'daughters');
    if (['sister', '姉', '妹', '姪'].includes(who)) {
      const slot = key === '' || key === undefined ? Math.max(0, ctx.siblings.findIndex((sib) => sib.rel === (who === 'sister' ? '妹' : who))) : ctx.kinSlot(key);
      return given(female, slot >= 200 ? slot - 200 : slot, 'sisters');
    }
    if (['兄', '弟', '異母兄弟'].includes(who)) {
      let slot = key === '' || key === undefined ? ctx.siblings.findIndex((sib) => sib.rel === who) : ctx.kinSlot(key);
      if (slot >= 200) slot -= 200;
      const sibling = ctx.siblings[slot];
      const order = sibling ? ctx.siblings.slice(0, slot).filter((sib) => sib.male).length + (sibling.elder ? 0 : 1) : selfOrder + 1 + Math.max(0, slot);
      return given(family, order, 'brothers');
    }
    return given(male, ctx.kinSlot(key), `kin${who}`);
  },
  birthLine(sex, order, name) { return `${sex === 'son' ? '男の子' : '女の子'}で、${name}と名づけた。`; },
};

const FIELD = {
  ie: { name: '家', role: 'house', kind: '家', marks: { status: 0 }, art: 'place.house', levels: LAYERS.village.ranks.map((name, i) => ({ name, marks: { status: i }, art: `place.house.lv${i + 1}` })) },
  neighborhouse: { name: '隣の家', role: 'rivalHouse', kind: '相手の家', marks: {}, art: 'place.neighbors', levels: [1, 2, 3].map(() => ({ name: '隣の家', marks: {}, art: 'place.neighbors' })) },
  elderhouse: { name: 'カルプリの長老の家', role: 'patronHouse', kind: '相手の家', marks: {}, art: 'rank.nanushi', levels: [1, 2, 3].map(() => ({ name: 'カルプリの長老の家', marks: {}, art: 'rank.nanushi' })) },
  father: { name: '父', role: 'father', kind: '家族', marks: { slow: 1 }, art: 'place.father' },
  oldfather: { name: '老いた父', role: 'father', substitute: false, kind: '家族', marks: { slow: 1 }, art: 'place.father.old' },
  mother: { name: '母', role: 'mother', kind: '家族', marks: { slow: 1 }, art: 'place.mother' },
  sister: { name: '妹', role: 'sister', kind: '家族', marks: { slow: 1 }, art: 'place.sister' },
  siblings: { name: 'きょうだい', role: 'siblings', kind: '家族', marks: {}, art: 'place.sister' },
  kinsman: { name: '縁者', kind: '家族', marks: { slow: 1 }, art: 'place.father.old' },
  house: { name: '葦ぶきの家', kind: '家', marks: { slow: 1 }, art: 'place.house', levels: [
    { name: '葦ぶきの家', yearly: { body: 1 }, guard: [], art: 'place.house.lv1' },
    { name: '石の土台の家', yearly: { body: 2 }, guard: [], art: 'place.house.lv2' },
    { name: '蒸し風呂のある家', yearly: { body: 3 }, guard: ['dis.plague'], art: 'place.house.lv3' },
  ], pastLv3: ['hygiene'] },
  paddy: { name: 'チナンパの畑', role: 'field', primary: true, kind: '畑', marks: { money: 1, slow: 1 }, art: 'place.paddy', levels: [
    { name: 'チナンパの畑', yearly: { store: 1 }, guard: [], art: 'place.paddy.lv1' },
    { name: '泥を足した畑', yearly: { store: 2 }, guard: [], art: 'place.paddy.lv2' },
    { name: '苗床を使う畑', yearly: { store: 3 }, guard: [], art: 'place.paddy.lv3' },
  ], pastLv3: ['soil'] },
  newfield: { name: '新しいチナンパ', role: 'field', kind: '畑', marks: { money: 1, slow: 1 }, stacks: true, art: 'place.newfield', levels: [
    { name: '新しいチナンパ', yearly: { store: 1 }, guard: [], art: 'place.newfield.lv1' },
    { name: '柳が根づいた畑', yearly: { store: 2 }, guard: [], art: 'place.newfield.lv2' },
    { name: '苗床を使う畑', yearly: { store: 3 }, guard: [], art: 'place.newfield.lv3' },
  ], pastLv3: ['soil'] },
  neighbors: { name: 'カルプリの人々', kind: '里の人々', marks: { slow: 1 }, art: 'place.neighbors' },
  canoe: { name: '丸木舟', kind: '持ち物', marks: {}, art: 'goods.zori' },
  nocanoe: { name: '舟を失った', kind: '持ち物', marks: {}, art: 'goods.barefoot' },
  ahuitzotl: { name: 'アウィツォトル王の世', kind: '遠くの歴史', marks: {}, art: 'history.imagawa.rule' },
  motecuhzoma: { name: 'モクテスマ王の世', kind: '遠くの歴史', marks: {}, art: 'history.matsudaira' },
  spain: { name: 'スペイン人の世', kind: '遠くの歴史', marks: {}, art: 'history.tokugawa' },
  spring: { name: '雨の季節', kind: '季節', marks: {}, art: 'season.spring' },
  waterwise: { name: '水路の心得', role: 'waterwise', kind: '知恵', marks: { status: 1 }, art: 'skill.water' },
  villagetrust: { name: 'カルプリの信頼', role: 'villageTrust', kind: '縁', marks: { status: 1 }, art: 'bond.village' },
  speech: { name: '長老の言葉', kind: '知恵', marks: { status: 1 }, art: 'skill.tales' },
  friend: { name: '舟仲間', kind: '縁', marks: { love: 1 }, art: 'bond.friend' },
  strongbody: { name: '鍛えた体', kind: '体', marks: {}, ability: true, art: 'self.strong' },
  oldtales: { name: '昔話', kind: '知恵', marks: { slow: 1 }, art: 'skill.tales' },
  songlearn: { name: '覚えた恋の歌', kind: '知恵', marks: { love: 1 }, art: 'bond.firstlove' },
  riverbank: { name: '舟の上の昼寝', kind: '暮らし', marks: { slow: 1 }, art: 'life.riverbank' },
  garden: { name: '家の庭', kind: '暮らし', marks: { slow: 1 }, art: 'life.garden' },
  atlatl: { name: '投げ槍器の腕', kind: '体', marks: { strength: 1 }, art: 'goods.spear' },
  telpochcalli: { name: '若者の家の籍', kind: '縁', marks: { strength: 1 }, art: 'bond.master' },
  ballskill: { name: '球の名手', kind: '体', marks: { strength: 1 }, art: 'self.sumo' },
  cacaostash: { name: 'カカオの蓄え', kind: '持ち物', marks: { money: 1 }, art: 'goods.sickle' },
  turkeys: { name: '七面鳥の群れ', kind: '持ち物', marks: { money: 1 }, art: 'work.trade' },
  newfire: { name: '新しい火の種', kind: '品', marks: { slow: 1 }, art: 'season.spring' },
  oldfaith: { name: '隠した供物', kind: '縁', marks: { slow: 1 }, art: 'bond.temple' },
  friarlearning: { name: '修道士の読み書き', kind: '知恵', marks: { status: 1 }, art: 'skill.reading' },
  citysights: { name: '都の見聞', kind: '知恵', marks: { status: 1 }, art: 'skill.gossip' },
  priest: { name: '神官との縁', kind: '縁', marks: { slow: 1 }, art: 'bond.temple' },

  lover: { name: '想い人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover' },
  'lover.canal': { name: '水路で会う人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.river' },
  'lover.market': { name: '市の布売り', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.weaver' },
  'lover.singer': { name: '歌の家の人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.singer' },
  'lover.traveler': { name: '荷を背負って来た人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.traveler' },
  'lover.widow': { name: '畑を守る寡婦', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.widow' },
  spouse: { name: '妻', role: 'spouse', partnerName: true, partnerPriority: 1, kind: '家族', marks: { love: 2, slow: 1 }, yearly: { body: 1 }, art: 'place.spouse' },
  arrangedspouse: { name: '妻（仲人の話）', role: 'spouse', partnerPriority: 2, kind: '家族', marks: { slow: 2, money: 1 }, yearly: { body: 1 }, art: 'place.spouse.arranged' },
  secondwife: { name: '第二の妻', role: 'concubine', partnerPriority: 3, kind: '家族', marks: {}, yearly: { body: 1, store: -1 }, art: 'place.spouse.side' },
  mistress: { name: '別に暮らす恋人', role: 'mistress', partnerPriority: 4, kind: '縁', marks: { love: 2 }, yearly: { store: -1 }, art: 'place.mistress' },
  affair: { name: '浮名', kind: '縁', marks: { love: 2 }, art: 'bond.affair' },
  rumor: { name: '家々の噂', kind: '重荷', marks: { status: -1 }, art: 'bond.rumor' },
  coward: { name: '臆病者の噂', kind: '重荷', marks: { status: -2, love: -1 }, art: 'burden.coward' },
  shirk: { name: '労役逃れの噂', kind: '重荷', marks: { status: -1 }, art: 'burden.shirk' },
  wound: { name: '古傷', kind: '重荷', marks: { strength: -1, slow: -1 }, art: 'burden.wound' },
  debt: { name: 'カカオの借り', kind: '重荷', marks: { money: -2 }, art: 'burden.debt' },
  child: { name: '子', kind: '家族', marks: { slow: 1 }, stacks: true, art: 'place.child' },
  grownchild: { name: '育った子', role: 'grownchild', kind: '家族', marks: { slow: 1, strength: 1 }, stacks: true, art: 'place.child.grown', yearly: { body: 1 } },
  grandchild: { name: '孫', kind: '家族', marks: {}, rung: 3, stacks: true, art: 'family.child' },
  heir: { name: '跡取り', role: 'heir', kind: '家族', marks: { slow: 2, status: 1 }, art: 'family.heir' },
  heirwed: { name: '跡取りの縁組', kind: '家族', marks: { slow: 1 }, rung: 3, art: 'family.child' },
  branchhouse: { name: '分けた畑の家', kind: '家族', marks: { slow: 1, money: 1 }, art: 'family.branch' },
  inlaw: { name: '妹の嫁ぎ先', kind: '縁', marks: { slow: 1, money: 1 }, guard: ['dis.famine'], art: 'bond.inlaw' },
  childletters: { name: '子の絵文書の読み', kind: '家族', marks: { status: 1 }, art: 'family.child.letters' },
  childhands: { name: '子の泥あげ', kind: '家族', marks: { money: 1 }, yearly: { store: 1 }, art: 'family.child.hands' },
  childaway: { name: '都で働く子', kind: '縁', marks: { status: 1, money: 1 }, art: 'family.child.away' },
  servant: { name: '住み込みの働き手', role: 'servant', kind: '家族', marks: { status: 1 }, art: 'place.servant', levels: [
    { name: '住み込みの働き手', yearly: { body: 1 }, guard: [], art: 'place.servant.lv1' },
    { name: '舟を任せた働き手', yearly: { body: 2 }, guard: [], art: 'place.servant.lv2' },
    { name: '約束と休みを決めた奉公', yearly: { body: 2 }, guard: [], art: 'place.servant.lv3' },
  ], pastLv3: ['organizing'] },

  // 身分: 捕虜の数で上がる（メモ 6）。1 人 = 捕えた者、2〜3 人 = 色の戦衣の戦士、4 人 = 鷲・ジャガーの戦士団、6 人超 = 剃髪の者。ここでは 3 段にまとめる
  rank: { name: '捕えた者', role: 'rank', kind: '身分', marks: { status: 1, strength: 1 }, art: 'rank.ashigaru', noMaintain: true, levels: [
    { name: '捕えた者', marks: { status: 1, strength: 1 }, scope: 2, art: 'rank.ashigaru' },
    { name: '鷲かジャガーの戦士', marks: { status: 3, strength: 1 }, scope: 3, art: 'rank.samurai' },
    { name: '剃髪の者', marks: { status: 5, strength: 2 }, scope: 3, art: 'rank.taisho' },
  ] },
  'merit.nopala': { name: 'ノパラ遠征の功', role: 'merit', kind: '品', marks: { status: 1, strength: 1 }, scope: 3, art: 'keep.kanjo' },
  'merit.atlixco': { name: 'アトリスコの生還', role: 'merit', kind: '品', marks: { status: 1, strength: 1 }, scope: 3, art: 'keep.kanjo' },
  'merit.lake': { name: '湖の戦いの功', role: 'merit', kind: '品', marks: { status: 1, strength: 1 }, scope: 3, art: 'keep.jinbaori' },
  'merit.mixton': { name: '北の戦の功', role: 'merit', kind: '品', marks: { status: 1, strength: 1 }, scope: 3, art: 'keep.letter' },
  'merit.captive': { name: '生け捕りの手柄', role: 'merit', kind: '品', marks: { status: 1, strength: 1 }, scope: 3, art: 'keep.bokuto' },
  guardwork: { name: '荷舟の護衛の評判', kind: '品', marks: { strength: 2 }, scope: 2, art: 'keep.kanjo' },
  valortale: { name: '語り継がれる武勇', kind: '品', marks: { strength: 3 }, scope: 4, art: 'keep.spear' },

  marketwatch: { name: '市の見張り役', kind: '仕事', marks: { status: 1 }, scope: 2, art: 'scene.meeting' },
  calpixqui: { name: '貢ぎ物の取り立て役', kind: '仕事', marks: { status: 2 }, scope: 3, art: 'rank.nanushi' },
  cabildo: { name: '町会の席', kind: '仕事', marks: { status: 2 }, scope: 3, art: 'rank.nanushi' },
  codexname: { name: '絵に描かれた名', kind: '品', marks: { status: 3 }, scope: 4, art: 'keep.kishinbook' },
  stallright: { name: '市の売り場の権利', kind: '仕事', marks: { money: 2 }, yearly: { store: 1 }, scope: 2, art: 'work.trade' },
  caravan: { name: '遠い国への荷の持ち分', kind: '仕事', marks: { money: 2 }, scope: 3, art: 'work.trade' },
  fortune: { name: '語り草の身代', kind: '品', marks: { money: 3 }, scope: 4, art: 'place.storehouse' },
  townlove: { name: '市で噂の二人', kind: '縁', marks: { love: 2 }, scope: 2, art: 'bond.affair' },
  courtlove: { name: '宮廷に聞こえた恋', kind: '縁', marks: { love: 2 }, scope: 3, art: 'bond.lover' },
  lovesong: { name: '歌に残った恋', kind: '品', marks: { love: 3 }, scope: 4, art: 'keep.letters' },
  cornreserve: { name: '次の代へ残すトウモロコシ', kind: '品', marks: { slow: 1 }, rung: 2, art: 'place.storehouse' },
  oldgrove: { name: '孫の代に実る木', kind: '暮らし', marks: { slow: 1 }, rung: 3, art: 'life.garden' },
  ancestor: { name: '語り継がれるご先祖', kind: '品', marks: { slow: 3 }, rung: 4, art: 'place.house' },

  // 建てるもの（role building）
  temazcal: { name: '蒸し風呂', role: 'building', kind: '家', marks: { slow: 1 }, art: 'place.well', levels: [
    { name: '蒸し風呂', yearly: { body: 1 }, guard: [], art: 'place.well.lv1' },
    { name: '薬草を焚く蒸し風呂', yearly: { body: 1 }, guard: ['dis.fire'], art: 'place.well.lv2' },
    { name: '石組みの蒸し風呂', yearly: { body: 2 }, guard: ['dis.fire', 'dis.plague'], art: 'place.well.lv3' },
  ], pastLv3: ['hygiene'] },
  willows: { name: '畑の縁の柳の列', role: 'building', kind: '畑', marks: { slow: 1 }, guard: ['dis.famine'], art: 'place.pond' },
  cuezcomatl: { name: '高床の穀倉', role: 'building', kind: '家', marks: { money: 1 }, guard: ['dis.flood'], art: 'place.storehouse' },
  stall: { name: '市の露店', role: 'building', kind: '仕事', marks: { money: 2 }, scope: 2, art: 'work.shop', levels: [
    { name: '市の露店', yearly: { store: 2 }, guard: [], art: 'work.shop.lv1' },
    { name: '品ぞろえのよい露店', yearly: { store: 3 }, guard: [], art: 'work.shop.lv2' },
    { name: '客のつく露店', yearly: { store: 4 }, guard: [], art: 'work.shop.lv3' },
  ], pastLv3: ['numbers', 'expression'] },
  cargocanoe: { name: '荷舟', role: 'building', kind: '仕事', marks: { money: 2, status: 1 }, scope: 2, art: 'work.ferry', levels: [
    { name: '荷舟', yearly: { store: 2 }, guard: [], art: 'work.ferry.lv1' },
    { name: '大きな荷舟', yearly: { store: 3 }, guard: [], art: 'work.ferry.lv2' },
    { name: '日取りを決めた荷舟の組', yearly: { store: 4 }, guard: [], art: 'work.ferry.lv3' },
  ], pastLv3: ['organizing'] },

  'past.memory': { name: '前世の記憶', kind: '前世', marks: {}, art: 'past.teacher' },
};
// 範囲と代。書かない品は範囲 1（rank、stall などは品または段に直接書いた）
const RUNG_OF = { 2: ['grownchild', 'heir', 'branchhouse'] };
for (const [rung, ids] of Object.entries(RUNG_OF)) for (const id of ids) FIELD[id].rung = Number(rung);

const START_FIELD = ['ie', 'neighborhouse', 'elderhouse', 'mother', 'house', 'father', 'paddy', 'neighbors', 'sister', 'canoe', 'ahuitzotl', 'spring'];
const LOVERS = ['lover.canal', 'lover.market', 'lover.singer', 'lover.traveler', 'lover.widow'];
const body = (amount = 1) => ({ type: 'spend', what: 'body', amount });
const riskBody = (amount = 1) => ({ type: 'risk', what: 'body', amount });
const store = (amount = 1) => ({ type: 'spend', what: 'store', amount });
const riskStore = (amount = 1) => ({ type: 'risk', what: 'store', amount });
const spend = (what) => ({ type: 'spend', what });
const risk = (what) => ({ type: 'risk', what });
const lock = (what, years) => ({ type: 'lock', what, years });
const SUB = { type: 'risk', what: 'substitute' };
const ladderNeeds = (axis, rung) => Object.entries(FIELD).filter(([, field]) => (field.marks?.[axis] || 0) > 0 && (field.rung ?? field.scope ?? 1) >= rung - 1).map(([id]) => id);
const RUNG_AGES = { 1: [15, 40], 2: [20, 55], 3: [25, 65], 4: [35, 75] };
const rungCard = (id, axis, rung, rest) => ({ id, frame: 'path', ages: RUNG_AGES[rung], axis, ...(rung > 1 ? { needsAny: ladderNeeds(axis, rung) } : {}), ...rest });

// 暮らしの場面（静かな年に一度ずつ出て、二択にせず流す）。メモ 2・3・5・9 から。years は時期の限定。
const VIGNETTES = [
  ['q.atole', [7, 75], '朝のアトーリ', '夜明け、石臼の音で目が覚める。母が挽いたトウモロコシの粥が、湯気を立てている。'],
  ['q.tortilla', [7, 75], '手で叩く音', '家々から、手のひらでトルティーヤを叩く音が重なって聞こえる。どの家の音か、目をつぶっても当てられた。'],
  ['q.ducks', [7, 75], '冬の水鳥', '冬の湖は、鴨でまっ黒になる。猟師の舟が、葦のあいだを音もなく滑っていく。'],
  ['q.market', [10, 75], '市の日', '市には、舟で来た人が集まる。値は、カカオ豆の数で決まる。袋の中の豆を数える音が、あちこちから聞こえた。'],
  ['q.turkey', [7, 75], '庭の七面鳥', '庭の七面鳥が、客人に向かって羽根を広げた。母が追いかけ、犬が追いかけ、客人は逃げた。'],
  ['q.rain', [7, 75], '雨乞いの月', '水の神々の祭りの月。老人たちが水の神の名を唱えながら、畑の端に水を撒いた。'],
  ['q.nemontemi', [7, 75], '名のない五日間', '一年の終わりの五日間は、名のない日だという。この五日は何も始めない。畑にも出ず、新しい舟も出さない。'],
  ['q.tlameme', [12, 75], '荷を背負う人', '堤道を、荷を背負った人の列が通る。羊も馬もいない。荷を運ぶのは、人の背と、人の足だ。', { years: [1484, 1520] }],
  ['q.cityfall', [10, 75], '壊れた堤道', '都のほうから、石を運ぶ舟が毎日通る。壊れた堤道を直すのも、人の仕事だ。', { years: [1522, 1530] }],
  ['q.bell', [10, 75], '新しい鐘', '町の新しい建物から、鐘の音が聞こえてくる。朝にも夕にも同じ音で、犬が毎回吠えた。', { years: [1530, 1560] }],
  ['q.pig', [10, 75], '豚の鳴き声', '領主の使いが連れてきた豚が、村の泥の中で寝そべっている。七面鳥の群れは、遠巻きに見ている。', { years: [1530, 1560] }],
  ['q.drunk', [20, 50], '酔った隣人', '祭りの夜、隣の男が禁じられた酒を飲みすぎた。翌朝、長老たちがその家を取り壊しにかかっていた。'],
  ['q.fire', [7, 75], '炉の火', '炉の火が消えないように、夜通し交代で見張る。炉石の上で、薪がぱちぱちと音を立てた。'],
  ['q.partner', [20, 75], '二人で数える豆', '連れ合いと、残った豆を数えた。同じ袋を二度数え、二人で笑った。', { needsAny: ['spouse', 'arrangedspouse'] }],
  ['q.family', [25, 75], '子の歩幅', '舟で隣を漕ぐ子の櫂さばきが、いつの間にか自分と同じになっていた。', { needs: ['grownchild'] }],
];

const CARDS = [
  // ── 子ども（7〜15）。掛け金は小さい。メモ 1・3・8
  // メモ 1: 水路にたまった泥を掘り上げて畑にかぶせる。掃除と肥やしが一度にすむ。
  { id: 'child.mud', frame: 'path', ages: [8, 11], title: '水路の泥', story: '水路の底の泥を、畑の上にすくい上げる日。臭いが取れないほど、よく実ると父は言う。', art: 'scene.irrigation',
    left: { title: '深いところの泥を狙う', art: 'choice.till', stake: riskBody(), odds: 4, win: { text: '腕まで泥だらけで、いちばん黒い泥を上げた。父が畑にまくと、苗の色がちがった。', maxBody: 1, add: ['strongbody'] }, lose: { text: '足を取られて頭まで沈み、父に襟をつかまれて引き上げられた。' } },
    right: { title: '浅瀬で泥をならす', art: 'choice.water', stake: body(), odds: 5, win: { text: '手際をほめられ、苗床に回す泥をひと山もらった。', store: 1 }, lose: { text: '平らにならしたつもりが、いちばん端が水に流れ出した。' } } },
  { id: 'child.canoe', frame: 'path', ages: [7, 10], title: '竿を持つ日', story: '父が小さな丸木舟を水路に浮かべ、竿を一本ほうってよこした。「向こう岸に着くまでおりるな」。', art: 'scene.river',
    left: { title: 'ひとりで漕ぎ出す', art: 'choice.water', stake: body(), odds: 4, win: { text: '舟は三度回ったが、四度目からまっすぐ進んだ。他の舟に道を譲る順番も覚えた。', add: ['waterwise'] }, lose: { text: '岸の杭に三度ぶつかった。父は笑いをこらえて、柳の枝を見ているふりをした。' } },
    right: { title: '隣の子と競漕する', art: 'choice.fish', stake: risk('canoe'), odds: 5, win: { text: '負けた。けれど水の上で並んでいるうちに、隣の子と仲良くなった。', add: ['friend'] }, lose: { text: '転覆して、舟が流れていった。拾いに行ったときには、もう見えなかった。', add: ['nocanoe'], body: -1 } } },
  // メモ 1: 苗床は泥を薄い板にならして種をまき、育った苗を畑へ移す。
  { id: 'child.seedbed', frame: 'path', ages: [9, 12], title: '泥の板の苗床', story: '泥を薄い板のようにならして、種をまく。育った苗は、畑に移して実らせる。', art: 'scene.spring.village',
    left: { title: '泥をならして種をまく', art: 'choice.seedling', stake: body(), odds: 5, win: { text: '指の幅ほどの苗が揃った。畑に移すとき、父は一本も傷めなかったと言った。', store: 1 }, lose: { text: '泥が乾いてひび割れ、まいた種が半分流れた。' } },
    right: { title: '苗を畑に運ぶ', art: 'choice.rice', stake: riskBody(), odds: 4, win: { text: '舟に苗を積んで一日往復した。翌日は腕が上がらなかったが、日に日に楽になった。', maxBody: 1, add: ['strongbody'] }, lose: { text: '舟に積みすぎて傾き、苗の半分が水に浮いた。' } } },
  // メモ 8: 11 歳の罰に唐辛子の煙を吸わせる絵がある。
  { id: 'child.chili', frame: 'path', ages: [10, 12], axis: 'status', title: '唐辛子の煙', story: '言いつけを破ると、唐辛子を焚いた煙の前に座らされる。大人たちは冗談のように言うが、本当にやる。', art: 'scene.hearth',
    left: { title: '目をつぶって座る', art: 'choice.watch', stake: body(), odds: 5, win: { text: '涙は止まらなかったが、ひとことも言わなかった。長老たちは、あの子は話を聞ける子だと言った。', add: ['speech'] }, lose: { text: '咳と涙で転げ回り、母に抱えられて外へ出された。' } },
    right: { title: '舟に飛び乗って逃げる', art: 'choice.flee', stake: risk('canoe'), odds: 4, win: { text: '葦のあいだに隠れて夜まで待ち、水鳥を数えて過ごした。帰ると、罰はもう終わっていた。', add: ['friend'] }, lose: { text: '逃げた拍子に舟の綱がほどけ、舟だけが先に家へ流れ着いた。', add: ['nocanoe'], body: -1 } } },
  // メモ 3: 水鳥は猟の獲物。メモ 6: 投げ槍器。
  { id: 'child.atlatl', frame: 'path', ages: [10, 14], axis: 'strength', title: '冬の水鳥', story: '冬の湖には鴨がいくらでも来る。猟師たちが、投げ槍器の使い方を子供に見せている。', art: 'scene.sumo',
    left: { title: '猟師について投げてみる', art: 'choice.spear', stake: riskBody(), odds: 3, win: { text: '槍は鴨のそばの水に落ちたが、三本目で一羽を落とした。猟師が肩を叩いた。', add: ['atlatl'] }, lose: { text: '槍が自分の足元の舟べりに刺さった。猟師の舟の上で、全員が黙った。' } },
    right: { title: '網で鴨を追い込む手伝い', art: 'choice.netting', stake: body(), odds: 5, win: { text: '葦のかげで音を立てずに待ち、網が閉じた。日暮れに鴨の汁が回ってきた。', add: ['villagetrust'] }, lose: { text: 'くしゃみをして、鴨が全部飛び立った。' } } },
  // メモ 6・8: 男の子は十五ごろから若者の家に通い、捕虜を捕えるまで背の髪を伸ばす。
  { id: 'child.telpochcalli', frame: 'path', ages: [13, 15], axis: 'strength', title: '若者の家', story: '十五が近い。若者の家に通えば、槍と労役を習う。捕虜を捕えるまで、背の髪は切れない。', art: 'scene.training',
    left: { title: '若者の家に通い、髪を伸ばす', art: 'choice.drill', stake: riskBody(), odds: 4, win: { text: '朝は槍の稽古、昼は労役。背の髪は肩まで伸び、仲間に一人前扱いされはじめた。', add: ['telpochcalli'] }, lose: { text: '稽古で足をくじいた。年上の若者に笑われた。' } },
    right: { title: '畑を理由に、通う日を減らす', art: 'choice.expand', stake: body(), odds: 5, win: { text: '父は喜んだ。畑の泥あげは、誰よりも手早くなった。', store: 1 }, lose: { text: '通わない日が増え、仲間の輪に入りにくくなった。' } } },
  { id: 'child.cuicacalli', frame: 'path', ages: [11, 14], axis: 'love', title: '歌の家の夕べ', story: '日が暮れると、若者たちは歌の家に集まって歌い、踊る。決まった歌を、決まった足運びで。', art: 'scene.festival',
    left: { title: '輪に入って足運びを覚える', art: 'choice.dance', stake: body(), odds: 4, win: { text: '足は何度も踏み間違えたが、最後には隣の子と息が合った。', add: ['songlearn'] }, lose: { text: '一つ前の歌の足で踊りつづけて、輪の全員にぶつかった。' } },
    right: { title: '太鼓を叩く役を買う', art: 'choice.mikoshi', stake: body(), odds: 5, win: { text: '腕が痛くなるまで叩き続け、太鼓の師匠に覚えられた。', add: ['friend'] }, lose: { text: '拍がずれ、歌い手が全員こちらを見た。' } } },
  { id: 'child.elders', frame: 'path', ages: [8, 12], axis: 'status', title: '長老の長い話', story: '長老が、昔の人の言葉をひとつずつ語る。座って聞くだけで、日が傾く。', art: 'scene.hearth',
    left: { title: '膝を揃えて、最後まで聞く', art: 'choice.grandmother', stake: body(), odds: 5, win: { text: '言葉は覚えきれなかったが、長老が「この子は座れる」と言ったのは覚えている。', add: ['speech'] }, lose: { text: '足がしびれて立てなくなり、そのまま寝てしまった。' } },
    right: { title: '舟の修理を手伝うと言って抜ける', art: 'choice.tools', stake: body(), odds: 5, win: { text: '父の舟を直しているうちに、ひとりで櫂が削れるようになった。', store: 1 }, lose: { text: '手伝いの口実がばれて、翌日も長老の前に座らされた。' } } },
  { id: 'child.axolotl', frame: 'path', ages: [7, 11], axis: 'slow', title: '水の中の子', story: '水路の浅いところに、手足のある小さな魚のようなものがいる。アホロートルだ。大人はよく煮て食べる。', art: 'scene.fishing',
    left: { title: '手づかみで追いかける', art: 'choice.swim', stake: riskBody(), odds: 4, win: { text: '泥まみれで二匹つかまえた。母は文句を言いながら、鍋にかけた。', add: ['strongbody'] }, lose: { text: '追いかけて水路にはまり、泥を飲んだ。' } },
    right: { title: '舟底に寝転んで空を見る', art: 'choice.nap', stake: body(), odds: 5, win: { text: '雲が水に映って、空が上にも下にもあった。', add: ['riverbank'] }, lose: { text: '寝ているあいだに舟が岸を離れて、見知らぬ家の畑に着いた。' } } },
  { id: 'child.market', frame: 'path', ages: [12, 14], axis: 'money', title: 'はじめての市', story: '大人たちの舟に混ぜてもらい、市へ行く。売り買いはカカオ豆の数で決まる。', art: 'scene.market',
    left: { title: '豆を握って値切ってみる', art: 'choice.market', stake: body(), odds: 4, win: { text: '売り手と三度押し問答をして、豆を二粒まけさせた。', add: ['cacaostash'] }, lose: { text: '数えまちがえ、売り手に笑われて豆を余分に取られた。' } },
    right: { title: '市の見張り役の後ろをついて回る', art: 'choice.referee', stake: body(), odds: 5, win: { text: '秤をごまかす者を見つけて、見張り役が礼代わりに魚をくれた。', add: ['speech'] }, lose: { text: '見張り役の足が速く、人混みで迷子になった。' } } },
  { id: 'child.newcanoe', frame: 'path', ages: [7, 20], repeat: true, needs: ['nocanoe'], title: '新しい舟', story: '舟を失くして歩く一年。岸から岸へは泳ぐしかない。', art: 'event.zori',
    left: { title: '父に刳り貫いてもらう', art: 'choice.sister', stake: body(), odds: 5, win: { text: '父は黙って木を削り、翌朝、舟が水に浮いていた。', add: ['canoe'], remove: ['nocanoe'] }, lose: { text: '父は忙しくて、削りかけの木が畑の隅に置かれたままになった。' } },
    right: { title: '自分で木を削ってみる', art: 'choice.seedling', stake: body(), odds: 3, win: { text: '形はいびつだが、水に浮いた。すこし右へ曲がる。', add: ['canoe'], remove: ['nocanoe'] }, lose: { text: '木は割れた。まだ舟がない。' } } },

  // ── 史実（その年に必ず来る）。年と出来事はメモ 9
  // メモ 9: アクエクエシュコの水路は 1499 か 1500 年。洪水で都が水に沈んだという（ドゥラン）。
  { id: 'hist.flood', frame: 'path', year: 1500, omen: '都のほうから、水の轟く音がするという', title: '都を沈めた水', story: '王が泉から都へ水を引いた。水路は壊れ、都は水に沈んだ。湖畔の村々にも、堤の直しに人を出せと知らせが来た。', art: 'disaster.flood',
    left: { title: '舟に乗って、都の堤に出る', art: 'choice.levee', stake: riskBody(2), odds: 4, win: { text: '水の中で一昼夜、石を運んだ。都の人は、湖畔の村の者に礼を言った。', add: ['villagetrust'] }, lose: { text: '崩れた堤の下敷きになり、足に傷が残った。', add: ['wound'] } },
    right: { title: '村に残って、うちの杭を守る', art: 'choice.guard', stake: riskBody(), odds: 5, win: { text: '都の水が引くまで、柳の杭に綱をかけて畑が流れないように見張った。', store: 1 }, lose: { text: '夜通し杭を押さえて、朝には熱が出ていた。' } } },
  // メモ 6・9: モクテスマ 2 世は平民を宮廷と高官から締め出したと言われる。即位は 1502 が通説。
  { id: 'hist.motecuhzoma', frame: 'path', year: 1502, omen: '王が病で亡くなったという', title: '新しい王', story: '王が替わった。新しい王は、宮廷の役を貴い生まれの者にだけ与えるらしい。戦功で出世する平民の道は、細くなる。', art: 'history.okehazama',
    always: { remove: ['ahuitzotl'], add: ['motecuhzoma'] },
    left: { title: '祝いの行列に加わって、都を見に行く', art: 'choice.procession', stake: store(1), odds: 5, win: { text: '堤道を舟で渡り、石の神殿と人の波を見た。村に戻って話すと、近所が集まった。', add: ['citysights'] }, lose: { text: '人混みで荷を盗まれ、手ぶらで帰った。' } },
    right: { title: '畑に腰を据える', art: 'choice.till', stake: body(), odds: 5, win: { text: '王が誰でも、苗は育つ。その年は特によく実った。', store: 2 }, lose: { text: '畑に出ても、近所の話題は王のことばかりで、手が止まった。' } } },
  // メモ 9: 即位の戦いはノパラとイクパテペク（オアハカ）。6 万の兵、約 5100 の捕虜。
  { id: 'hist.nopala', frame: 'demand', year: 1503, demand: true, ignore: { substitute: true, odds: 4 }, omen: '都で大きな戦支度が始まっている', title: '新しい王の戦', story: '新しい王の最初の戦だ。南の遠い土地に、六万の兵が行く。村からも人を出す。', art: 'history.anegawa',
    left: { title: '兵の列に加わる', art: 'choice.march', stake: riskBody(2), odds: 4, delay: 1, win: { text: '遠い土地の山道を越え、生きて戻った。捕えた者の印を受け、背の髪を切る日が近づいた。', add: ['merit.nopala'], rank: 1, store: 2 }, lose: { text: '帰りの道で熱を出し、古傷のような咳が残った。', add: ['wound'] } },
    right: { title: '村に残る', art: 'choice.stay', stake: SUB, odds: 4, win: { text: '代わりに出た者は無事に戻った。' }, lose: { text: '代わりに出た者は戻らなかった。' } } },
  // メモ 9: アトリスコでワシンゴに大敗（1503 か 1507。年は推測）。
  { id: 'hist.atlixco', frame: 'demand', year: 1505, demand: true, ignore: { substitute: true, odds: 2 }, omen: '東の山の向こうの国と、また戦になるという', title: 'アトリスコの敗戦', story: '東の山の国との戦で、都の軍が大敗するという噂が先に届いた。それでも荷を背負う人が要る。', art: 'history.mikatagahara',
    left: { title: '荷を背負って従軍する', art: 'choice.battle', stake: riskBody(3), odds: 2, win: { text: '負け戦の中で荷を捨てずに戻った。戻った者は少なかった。', add: ['merit.atlixco'], rank: 1 }, lose: { text: '山の谷で退く軍に巻き込まれ、戻らなかった。', die: true } },
    right: { title: '村に残る', art: 'choice.flee', stake: SUB, odds: 2, win: { text: '代わりに出た者は無事に戻った。' }, lose: { text: '代わりに出た者は戻らなかった。' } } },
  // メモ 5: 新しい火。炉石も壺も捨て、夜は眠らず、子の耳から血を取って火に投げた。妊婦と子供の仮面は諸説。
  { id: 'hist.newfire', frame: 'path', year: 1507, omen: '夜空の星の動きを、神官が数えている', title: '新しい火の夜', story: '五十二年に一度の夜が来た。家の炉の火は消され、壺は割られ、炉石まで捨てた。この夜、太陽が上らなければ、世界は終わる。', art: 'season.spring',
    left: { title: '丘に登って、新しい火を待つ', art: 'choice.watch', stake: riskBody(), odds: 5, win: { text: '空の高いところに、星の列がまっすぐ来た。丘の上で火がついた。走って持ち帰った火で、新しい炉に火をつけた。', add: ['newfire'] }, lose: { text: '人の波に押されて坂を転がり、火が見えたのは家に帰ってからだった。' } },
    right: { title: '家に残って、子らを眠らせない', art: 'choice.home', stake: body(), odds: 5, win: { text: '子らは鼠にならないと、口々に言いながら夜通し起きていた。朝日が上ると、泣いて笑った。', add: ['villagetrust'] }, lose: { text: '子らが全員寝てしまった。隣の婆さんが、まだ鼠になっていないか数えて回った。' } } },
  // メモ 9: 1510 年の予言で戦が止まり、反乱が増えた。ふしぎな前兆は後世の記録。
  { id: 'hist.omens', frame: 'path', year: 1510, omen: '夜、女の泣き声が聞こえたという', title: '空に火の柱', story: '昼にも空に光る柱が立ち、夜は湖が風もないのに沸き立つ。神官たちは、王に何かを告げに行った。', art: 'history.takeda',
    left: { title: '長老に、これから起きることを伝える', art: 'choice.news', stake: body(), odds: 4, win: { text: '誰も信じなかったが、一人だけ古い話を覚えていて、あとで聞きに来た。', add: ['villagetrust'] }, lose: { text: '縁起でもないと叱られ、その晩は誰も目を合わせなかった。' } },
    right: { title: '黙って穀倉に実りを積む', art: 'choice.hoard', stake: body(), odds: 5, win: { text: '誰にも言わず、トウモロコシを袋に詰め直した。', store: 3 }, lose: { text: '袋に詰めたトウモロコシを、湿らせてしまった。' } } },
  { id: 'hist.ships', frame: 'path', year: 1518, omen: '海のほうから、知らせの走り手が来たという', title: '海の山', story: '海の上を、山のようなものが動いているという。走り手が王に絵を見せた。', art: 'scene.news',
    left: { title: '内陸に住む親戚に、様子を聞きに行く', art: 'choice.migrate', stake: store(1), odds: 4, win: { text: '内陸の村では何も知らず、大笑いされた。けれど帰り道、同じ話を三度聞いた。', add: ['citysights'] }, lose: { text: '道中で舟を借りた礼に、豆を取られた。' } },
    right: { title: 'いつも通り種をまく', art: 'choice.till', stake: body(), odds: 5, win: { text: '畑は、世の中の騒ぎと関係なく実った。', store: 2 }, lose: { text: '手につかず、種を一列、まく向きを間違えた。' } } },
  { id: 'hist.cortes', frame: 'path', year: 1519, omen: '海から来た者が、王の都に入るという', title: '異国の者たち', story: '見たことのない顔と、鉄の服の人々が、堤道を通って都へ入った。馬という獣を連れているらしい。', art: 'history.sekigahara',
    left: { title: '堤道まで舟で見に行く', art: 'choice.procession', stake: riskBody(), odds: 5, win: { text: '遠くから、鉄の服と、背の高い獣を見た。獣は人よりも大きく、鼻息が見えた。', add: ['citysights'] }, lose: { text: '堤道の人の波に押され、舟が岸にぶつかって傷ついた。' } },
    right: { title: '村の者を集めて、堤を点検する', art: 'choice.defend', stake: body(), odds: 5, win: { text: '何が来ても、水の守りは必要だ。近所は黙って手を貸した。', add: ['villagetrust'] }, lose: { text: '集まったのは半分で、残りは都の話をしていた。' } } },
  // メモ 7・9: 天然痘（ウエイサウアトル）。9〜10 月に都へ。クイトラワクも死んだ。
  { id: 'hist.smallpox', frame: 'fight', year: 1520, omen: '遠くの都で、人が次々と倒れているという', title: '大きなかさ', story: '全身に膿を持った水ぶくれが出る病が、村にも来た。起き上がれず、水も飲めない者が増えていく。', art: 'disaster.plague',
    left: { title: '病人を舟小屋に離し、世話をする', art: 'choice.nurse', stake: riskBody(2), odds: 3, win: { text: '舟小屋の中で、三人が持ち直した。膿の跡は、一生消えなかった。' }, lose: { text: '看病するうちに自分も膿疱だらけになり、戻れなかった。', die: true } },
    right: { title: '蒸し風呂で熱を追い出す習いに頼る', art: 'choice.shut', stake: risk('kind:家族'), odds: 3, win: { text: '汗とともに熱が下がった家族もいた。誰にも理由はわからなかった。', add: ['priest'] }, lose: { text: '蒸し風呂から出た家族は、熱が上がって戻らなかった。' } } },
  // メモ 9: 包囲は 1521 年 5 月〜8 月 13 日。13 隻の帆船。水道を断たれ、飢えと渇き。ミシュキックなど湖畔の村は降伏して和した。
  { id: 'hist.lake', frame: 'demand', year: 1521, demand: true, ignore: { substitute: true, odds: 3 }, omen: '湖に、見たことのない大きな帆が浮かんだ', title: '湖の戦い', story: '帆のついた舟が湖に浮かび、都への水道が断たれた。湖畔の村々は、どちらにつくかを選ばされている。', art: 'history.komaki',
    always: { remove: ['motecuhzoma'], add: ['spain'] },
    left: { title: '舟で夜に、都へ糧を運び込む', art: 'choice.supply', stake: riskBody(3), odds: 3, win: { text: '葦のあいだを縫い、米も豆も都に届けた。戻ると都の火が見えた。', add: ['merit.lake'], rank: 1 }, lose: { text: '帆の舟の大砲に狙われ、舟ごと沈んだ。', die: true } },
    right: { title: '村に残る', art: 'choice.stay', stake: SUB, odds: 3, win: { text: '代わりに出た者は無事に戻った。' }, lose: { text: '代わりに出た者は戻らなかった。' } } },
  // メモ 9: フランシスコ会は 1523〜24 年。貴族の息子のための学校。
  { id: 'hist.friars', frame: 'path', year: 1524, omen: '遠い国の修道士が、都に着いたという', title: '十字架の人々', story: '粗い布の服を着た男たちが、新しい神の教えを説きに来た。字を教えるという。', art: 'scene.temple',
    left: { title: '字を習いに通う', art: 'choice.study', stake: store(1), odds: 4, win: { text: '見慣れぬ文字で、自分の名を書けるようになった。', add: ['friarlearning'] }, lose: { text: '教えは長く、同じ祈りを毎日唱えるだけで終わった。' } },
    right: { title: '古い神への供物を、家の奥に隠す', art: 'choice.offering', stake: body(), odds: 4, win: { text: '誰にも見せずに、トウモロコシの粥を毎月供えた。', add: ['oldfaith'] }, lose: { text: '隣の子が供物に気づいて、修道士に告げた。' } } },
  // 推測: 1536 年に銀貨の造幣が始まった（記憶。未確認）。カカオが銭として残ったのも確かめきれていない。
  { id: 'hist.silver', frame: 'path', year: 1536, omen: '都で、新しい銭が配られるという', title: '銀の銭', story: '都で、銀の小さな円盤が銭として使われはじめた。カカオ豆で払う客と、銀で払う客が並ぶようになった。', art: 'scene.coin',
    left: { title: '手持ちの豆を銀に替える', art: 'choice.sell', stake: store(3), odds: 3, win: { text: '早く替えたので値がよかった。銀は軽く、懐に入った。', add: ['cacaostash'], store: 3 }, lose: { text: '替える相手に豆の目方をごまかされた。' } },
    right: { title: '豆のまま様子を見る', art: 'choice.hoard', stake: body(), odds: 5, win: { text: '豆のほうが、村の市ではまだ強かった。', store: 2 }, lose: { text: '市で、豆では売れないと断られた。' } } },
  // 推測: ミシュトンの戦（1541）。先住民の兵も加わった（記憶。未確認）。
  { id: 'hist.mixton', frame: 'demand', year: 1541, demand: true, ignore: { substitute: true, odds: 3 }, omen: '副王が北へ大軍を送るという', title: '北の反乱', story: '北の山で反乱が起き、副王が大軍を出す。先住民の兵と、荷を背負う者がたくさん要る。五十七の身にも声がかかった。', art: 'history.nagashino',
    left: { title: '荷を背負って北へ行く', art: 'choice.oldmarch', stake: riskBody(3), odds: 3, win: { text: '山を越える荷の列を最後尾まで守り、生きて戻った。', add: ['merit.mixton'] }, lose: { text: '北の山道で倒れた。', die: true } },
    right: { title: '村に残る', art: 'choice.seeoff', stake: SUB, odds: 3, win: { text: '代わりに出た者は無事に戻った。' }, lose: { text: '代わりに出た者は戻らなかった。' } } },
  // メモ 7: ココリストリ。高熱、頭痛、鼻から血。1545〜48 年。
  { id: 'hist.cocoliztli', frame: 'fight', year: 1545, omen: '遠い村で、鼻から血を出して倒れる人が出ているという', title: '鼻から血', story: '高い熱が出て、鼻から血が流れ、三日で人が死ぬ。去年の疫病とも、前の大きなかさとも違う。', art: 'disaster.plague',
    left: { title: '病人の世話を続ける', art: 'choice.nurse', stake: riskBody(2), odds: 3, win: { text: '血の出る前に水を飲ませ続けて、三人が持ち直した。' }, lose: { text: '世話をするうちに、自分の鼻から血が出た。', die: true } },
    right: { title: '村の端の離れ家に家族を移す', art: 'choice.separate', stake: risk('kind:家族'), odds: 4, win: { text: '離れ家では誰も倒れなかった。戻ったとき、村の三分の一がいなかった。', add: ['priest'] }, lose: { text: '離れ家に着いた翌日、家族のひとりが倒れた。' } } },
  // 推測: 修道士が先住民の古老に昔の暮らしを聞いて回る（1558 年ごろ。確かめられなかった）。主人公が届きやすい 71 歳（1555 年）に置いた。
  { id: 'hist.elders', frame: 'path', year: 1555, omen: '修道士が、古い人の話を集めているという', title: '聞き書き', story: '修道士が、村を回って古い人を探している。昔の都のこと、昔の祭り、昔の神々のことを、絵と字に写すという。', art: 'scene.letters',
    left: { title: '覚えていることを全部話す', art: 'choice.tell', stake: body(), odds: 3, win: { text: '話は三日続いた。新しい火の夜のことも、あの舟のことも話した。写し取った人は、何度も礼を言った。', add: ['oldtales'] }, lose: { text: '話が長すぎて、書き手は途中で眠ってしまった。' } },
    right: { title: '聖なることは、家族にだけ話す', art: 'choice.refuse', stake: body(), odds: 4, win: { text: '孫たちだけに話した。家の奥でしか語れない話になった。', add: ['oldfaith'] }, lose: { text: '孫たちは聞かないふりをした。' } } },

  // ── 災い（成人後に引かれる。何度でも）
  { id: 'dis.famine', frame: 'disaster', disaster: true, repeat: true, omen: '夜が冷える', title: '霜の朝', story: '朝、苗の葉が白い。霜が降りた。', art: 'disaster.famine',
    left: { title: '蓄えで食べ物を買う', art: 'choice.rice', stake: store(3), odds: 6, win: { text: '市でトウモロコシを買い、冬をつないだ。' } },
    right: { title: '水路の水を畑に引き込んで霜を溶かす', art: 'choice.water', stake: riskBody(2), odds: 3, win: { text: '夜通し水をかけて、苗の半分を守った。' }, lose: { text: '寒い夜に水をかけ続けて、体を壊した。' } } },
  { id: 'dis.flood', frame: 'disaster', disaster: true, repeat: true, omen: '長雨が続く', title: '水があふれる', story: '雨が続き、水路の水が畑を越えそうだ。', art: 'disaster.flood',
    left: { title: '柳の杭を打ち足しに出る', art: 'choice.levee', stake: riskBody(), odds: 3, win: { text: '杭を打ち足して畦を守った。近所が礼に来た。', add: ['villagetrust'] }, lose: { text: '流されかけて、足を傷めた。', add: ['wound'] } },
    right: { title: '家の穀を高台へ運ぶ', art: 'choice.highground', stake: store(1), odds: 5, win: { text: '穀は守れた。', store: 2 }, lose: { text: '家に水が入り、泥の床で寝る日が続いた。', body: -1 } } },
  { id: 'dis.plague', frame: 'disaster', disaster: true, repeat: true, omen: '隣の家で熱を出した者がいる', title: '熱病', story: '村に熱病が入った。咳と高い熱が続く。', art: 'disaster.plague',
    left: { title: '家族を看病する', art: 'choice.nurse', stake: riskBody(2), odds: 3, win: { text: '家族は持ち直した。' }, lose: { text: '看病のうちに自分も倒れた。', die: true } },
    right: { title: '家族を連れて、離れた畑の小屋へ移る', art: 'choice.separate', stake: risk('kind:家族'), odds: 4, win: { text: '小屋で数日を過ごし、皆助かった。' }, lose: { text: '小屋で、家族を亡くした。' } } },
  { id: 'dis.fire', frame: 'disaster', disaster: true, repeat: true, omen: '乾いた風が続く', title: '葦ぶきの火', story: '隣の葦ぶきの屋根から火が出た。', art: 'disaster.fire',
    left: { title: '水路から水を運んで消す', art: 'choice.firefight', stake: riskBody(), odds: 4, win: { text: '舟で水を運び続け、火は隣で止まった。', add: ['villagetrust'] }, lose: { text: '火傷を負った。', add: ['wound'] } },
    right: { title: '家財を舟に積んで逃がす', art: 'choice.rescue', stake: risk('kind:家'), odds: 3, win: { text: '舟が間に合い、家は焼けずに済んだ。', store: 1 }, lose: { text: '家は焼け落ちた。' } } },

  // ── 争い
  // メモ 6: 1 人捕えて一人前。捕虜は殺さず生け捕りにする。平民の戦士は髪を伸ばして通い、捕えて切る。
  { id: 'sr.firstcaptive', frame: 'fight', ages: [16, 32], axis: 'strength', title: 'はじめての捕虜', story: '花の戦に、若者たちが荷を背負って加わる。敵を殺さず生け捕りにしたとき、はじめて一人前だ。背の髪はまだ長い。', art: 'scene.battle',
    left: { title: '二人がかりで敵の戦士を生け捕りにする', art: 'choice.battle', stake: riskBody(3), odds: 3, win: { text: '黒曜石の刃の下をくぐって、縄をかけた。背の髪を切る日が来た。', add: ['merit.captive'], rank: 1 }, lose: { text: '捕えようとして、黒曜石の刃に倒れた。', die: true } },
    right: { title: '荷を背負って後ろを歩く', art: 'choice.supply', stake: body(), odds: 5, win: { text: '戦の後ろで荷を守り、日暮れの飯を一番に配られた。', store: 1 }, lose: { text: '荷を担ぎ疲れて、帰りの道で膝をついた。' } } },
  { id: 'fi.thief', frame: 'fight', ages: [18, 55], repeat: true, title: '舟どろぼう', story: '夜、舟着き場で櫂の音がする。舟が一艘、勝手に岸を離れようとしている。', art: 'scene.bandits',
    left: { title: '飛びかかって取り押さえる', art: 'choice.fight', stake: riskBody(2), odds: 3, win: { text: '泥棒を水に落として縛り上げ、カルプリの人々が朝に引き取りに来た。', add: ['villagetrust'] }, lose: { text: '暗がりで刃物に突かれ、動けなくなった。', die: true } },
    right: { title: '大声で近所を起こす', art: 'choice.guard', stake: body(), odds: 5, win: { text: '大声に家々の灯がつき、泥棒は舟を捨てて逃げた。', store: 1 }, lose: { text: '起きた近所に怒られ、舟着き場の見張りは翌日から自分の役になった。' } } },

  // ── 求め（断ると代償。右は毎年のくじの札）
  { id: 'dm.coatequitl', frame: 'demand', ages: [16, 60], repeat: true, demand: true, ignore: { label: 'カルプリの信頼を失う', effect: { text: '労役に出ず、陰口をたたかれた。', remove: ['villagetrust'], add: ['shirk'] } }, title: '労役の割り当て', story: '堤や水路の普請に、家ごとに人を出せという。順番は、くじではなくカルプリの長老が決める。', art: 'scene.fushin',
    left: { title: '人足に出る', art: 'choice.work', stake: body(2), odds: 6, win: { text: '泥と石を運ぶ日が続いた。終わったとき、周りの顔がちがっていた。', add: ['villagetrust'] } },
    right: { title: 'その年のくじの札', art: 'choice.skip', stake: store(1), odds: 5, win: { text: '' }, lose: { text: '' } } },
  { id: 'dm.tribute1', frame: 'demand', ages: [18, 60], years: [1484, 1520], repeat: true, cooldown: 6, demand: true, ignore: { label: '貢ぎ物の取り立て役ににらまれる', effect: { text: '納めを遅らせ、取り立て役ににらまれた。', add: ['shirk'] } }, title: '王への貢ぎ物', story: '都の取り立て役が来た。綿布と豆、トウモロコシを、決めた数だけ納めるのが、村の決まりだ。', art: 'scene.goyokin',
    left: { title: '数を揃えて納める', art: 'choice.pay', stake: store(3), odds: 6, win: { text: '数を数える役人の前で、袋が一つずつ開かれた。ひとつの不足もなかった。', add: ['villagetrust'] } },
    right: { title: 'その年のくじの札', art: 'choice.skip', stake: store(1), odds: 5, win: { text: '' }, lose: { text: '' } } },
  { id: 'dm.tribute2', frame: 'demand', ages: [18, 65], years: [1522, 1560], repeat: true, cooldown: 6, demand: true, ignore: { label: '新しい領主の取り立てににらまれる', effect: { text: '納めを遅らせ、領主の使いににらまれた。', add: ['shirk'] } }, title: '新しい領主への貢ぎ物', story: '新しい領主の使いが、村の長に貢ぎ物を割り当てた。トウモロコシ、綿布、それに小麦と豚。小麦も豚も、村ははじめて聞く。', art: 'scene.goyokin',
    left: { title: '決められた分を納める', art: 'choice.pay', stake: store(3), odds: 6, win: { text: '見たことのない豚が、領主の使いに引かれていった。村で誰も、豚の鳴き声に慣れなかった。', add: ['villagetrust'] } },
    right: { title: 'その年のくじの札', art: 'choice.skip', stake: store(1), odds: 5, win: { text: '' }, lose: { text: '' } } },
  { id: 'dm.festival', frame: 'demand', ages: [20, 70], repeat: true, demand: true, ignore: { label: 'カルプリの信頼を失う', effect: { text: '祭りの費えを出さず、老人たちに眉をひそめられた。', remove: ['villagetrust'] } }, title: '祭りの費え', story: 'カルプリの祭りの日が近い。家ごとに、トウモロコシと豆と花を持ち寄る。', art: 'scene.kishin',
    left: { title: '費えを出す', art: 'choice.donate', stake: store(2), odds: 6, win: { text: '祭りの日、広場にあふれるほどの花とタマルが並んだ。', add: ['villagetrust'] } },
    right: { title: 'その年のくじの札', art: 'choice.skip', stake: store(1), odds: 5, win: { text: '' }, lose: { text: '' } } },
  { id: 'dm.debt', frame: 'demand', ages: [16, 75], repeat: true, needs: ['debt'], demand: true, ignore: { label: '借りがふくらむ', effect: { text: '催促を放っておき、カカオの借りがふくらんだ。', add: ['debt'] } }, title: 'カカオの取り立て', story: '貸し主が来た。数えるのは、豆の一粒ずつだ。', art: 'scene.debt',
    left: { title: '畑の収穫で返す', art: 'choice.payland', stake: spend('kind:畑'), odds: 6, win: { text: '貸し主は一粒ずつ数え直して、帳を閉じた。', remove: ['debt'] } },
    right: { title: '貸し主の家で働いて返す', art: 'choice.paylabor', stake: riskBody(2), odds: 4, win: { text: '約束の年が終わる日、貸し主は黙って頭を下げた。', remove: ['debt'] }, lose: { text: '働いている最中に倒れた。' } } },
  // メモ 1: 水路は舟が通れる幅。畑の境は柳の杭で決める。
  { id: 'ie.water', frame: 'demand', ages: [15, 75], repeat: true, demand: true, needs: ['neighborhouse'], title: '水路の順番', story: '畑に水を入れる順番をめぐり、隣の家と争いになった。', art: 'scene.irrigation', contest: 'water', ignore: { label: '水を譲る。畑の段が一つ下がる', effect: { text: '水を譲り、畑の段が一つ下がった。', levelDown: 'paddy' } },
    left: { title: '順番を争う', art: 'choice.water', odds: 3, win: { text: '長老の前で順番を認められ、隣の家の力が落ちた。' }, lose: { text: '争いに負け、畑の段が一つ下がった。' } },
    right: { title: '水を譲る', art: 'choice.water', odds: 6, win: { text: '水を譲った。' } } },
  { id: 'ie.boundary', frame: 'demand', ages: [18, 75], repeat: true, demand: true, needs: ['neighborhouse'], title: '柳の境', story: '畑の境の柳の杭を、隣の家が一尺だけ動かした。', art: 'scene.neighbor', contest: 'boundary', ignore: { label: '境を譲る。畑を一枚失う', effect: { text: '境を譲り、畑を一枚失った。', remove: ['paddy'] } },
    left: { title: '境を争う', art: 'choice.enlist', odds: 3, win: { text: '杭の古い根が見つかり、隣の畑を取って新しいチナンパにした。' }, lose: { text: '境を失い、畑を一枚失った。' } },
    right: { title: '境を譲る', art: 'choice.cultivate', odds: 6, win: { text: '境を譲った。' } } },

  // ── 家族の節目
  // メモ 8: 仲人が新郎のマントと新婦のスカートの端を結ぶ（四日間の婚礼）。
  { id: 'fam.sister', frame: 'family', ages: [17, 22], needs: ['sister'], title: '妹の嫁入り', story: '妹に、仲人を通して縁談が来た。二度目の訪問で、母が「ええ」と答えた。結ぶのは、新郎のマントと妹のスカートの端だ。', art: 'scene.wedding.sister',
    always: { remove: ['sister'], add: ['inlaw'] },
    left: { title: '綿布を一枚持たせる', art: 'choice.dowry', stake: store(2), odds: 6, win: { text: '妹は綿布の包みを胸に抱えて、仲人の背で運ばれていった。相手の村に縁ができた。', add: ['villagetrust'] } },
    right: { title: '婚礼の歌を歌う', art: 'choice.sing', stake: body(), odds: 4, win: { text: '四日続く祝いの最後の夜、妹の名の歌を歌った。歌がうまいと評判になった。', add: ['songlearn'] }, lose: { text: '声が裏返って、妹が泣きながら笑った。' } } },
  // 推測: 死者に犬を添えて死後の道を導かせる習いは確かめられなかった。ここでは言い伝えとして一言だけ置く。
  { id: 'fam.father', frame: 'family', ages: [28, 42], needsAny: ['father', 'oldfather'], title: '父の最期', story: '父が床について、畑の泥の話ばかりする。犬を一匹、あの世の道連れにつけるのが昔からの習いだという。', art: 'scene.father.end',
    always: { remove: ['father', 'oldfather'] },
    left: { title: 'そばで話を聞く', art: 'choice.watch', stake: lock('kind:畑', 1), odds: 6, win: { text: '父は、どの水路が何年ごとに詰まるかを話して逝った。', add: ['oldtales'] } },
    right: { title: '弔いの費えを稼ぎに湖へ出る', art: 'choice.work', stake: body(2), odds: 6, win: { text: '舟を出して荷を運び、立派な葬いを出した。', store: 2 } } },
  { id: 'fam.mother', frame: 'family', ages: [33, 50], needs: ['mother'], title: '母の最期', story: '母が寝床で、石臼でトウモロコシを挽く手つきをしている。生涯、毎朝のトルティーヤを作った手だ。', art: 'scene.mother.end',
    always: { remove: ['mother'] },
    left: { title: '母の石臼を家の庭に据える', art: 'choice.flowers', stake: body(), odds: 6, win: { text: '石臼を庭に据え、毎年の命日にトウモロコシを供えた。', add: ['garden'] } },
    right: { title: '近所を集めて弔う', art: 'choice.memorial', stake: store(2), odds: 6, win: { text: '母を覚えている人が集まって、朝までタマルを分け合った。', add: ['villagetrust'] } } },
  { id: 'ie.succession', frame: 'family', family: true, ages: [28, 75], title: '家を継ぐ者', story: '縁者が、家と畑の行く末について話しに来た。', art: 'scene.family', contest: 'succession',
    left: { title: '跡取りの分を守る', art: 'choice.enlist', odds: 3, win: { text: '話をまとめ、家を継いだ。' }, lose: { text: '畑の一部を譲り、家を継いだ。' } },
    right: { title: '相手を跡取りに替える', art: 'choice.cultivate', odds: 6, win: { text: '相手を跡取りに替えた。' } } },
  { id: 'lo.meet', frame: 'path', ages: [16, 50], repeat: true, axis: 'love', title: '出会い', story: '見知らぬ人と目が合った。', art: 'scene.meet',
    left: { title: '声をかける', art: 'choice.approach', stake: store(1), odds: 5, win: { text: 'また会う約束をした。', add: ['lover.canal'] }, lose: { text: '相手にされなかった。' } },
    right: { title: '祭りの世話役を買って出る', art: 'choice.festival', stake: body(), odds: 5, win: { text: '祭りを仕切り、カルプリの人々に頼られた。', add: ['villagetrust'] }, lose: { text: '段取りを誤り、長老に叱られた。' } } },
  { id: 'lo.visit', frame: 'path', axis: 'love', ages: [16, 50], repeat: true, needsAny: LOVERS, title: '会いに行く', story: '縁を結んだ人のもとへ、舟を漕いで行く。', art: 'scene.visit',
    left: { title: '贈り物を持って行く', art: 'choice.gift', stake: store(1), odds: 4, win: { text: '話に花が咲き、縁が深まった。' }, lose: { text: '留守だった。' } },
    right: { title: '仕事を切り上げて行く', art: 'choice.back', stake: body(), odds: 5, win: { text: '顔を見せ、縁をつないだ。' }, lose: { text: '行き違いになった。' } } },
  { id: 'lo.marry', frame: 'family', ages: [18, 60], repeat: true, axis: 'love', needsAny: LOVERS, title: '添う相手', story: '想い人と所帯を持つか、家が勧める相手と添うか。', art: 'scene.marry',
    left: { title: '想い人と添う', art: 'choice.lovematch', stake: risk('neighbors'), odds: 4, win: { text: '仲人がマントとスカートの端を結んだ。二人は同じ敷物に座り、一緒にタマルを食べた。', add: ['spouse'] }, lose: { text: '近所とは気まずくなったが、夫婦になった。', add: ['spouse'] } },
    right: { title: '縁談の相手と添う', art: 'choice.arranged', stake: store(1), odds: 6, win: { text: '縁談の相手と夫婦になった。畑が一枚、増えた。', add: ['arrangedspouse', 'newfield'] } } },
  // メモ 8: 仲人が申し込み、女の親は受けても断ってもよい。
  { id: 'lo.arranged', frame: 'family', ages: [20, 60], repeat: true, title: '仲人の訪い', story: '仲人の老婆が家に来た。二度目の訪問だ。一度目は断るのが礼儀で、二度目の返事に話の本気がかかっている。', art: 'scene.arranged',
    left: { title: '承知すると答える', art: 'choice.accept', stake: store(1), odds: 6, win: { text: '夫婦になった。婚礼は四日続いた。', add: ['arrangedspouse'] } },
    right: { title: '断って、歌の家へ想い人を探しに行く', art: 'choice.seek', stake: riskBody(), odds: 3, win: { text: '歌の家の夕べで、出会いがあった。', meet: true }, lose: { text: '仲人の老婆に叱られ、縁談は宙に浮いた。' } } },
  // メモ 8: 産婆が付き、四日ごろに沐浴と命名がある。
  { id: 'lo.child', frame: 'family', ages: [19, 42], repeat: true, needsAny: ['spouse', 'arrangedspouse', 'mistress'], title: '産婆が来る', story: '妻が身ごもった。産婆が家に来て、お産までの家事を引き受けた。', art: 'scene.childbirth',
    left: { title: '命名の祝いに犬の肉を用意する', art: 'choice.celebrate', stake: store(2), odds: 6, win: { text: '四日目、沐浴と命名の祝い。近所が集まった。', add: ['child', 'villagetrust'] } },
    right: { title: '静かに産婆に任せる', art: 'choice.quietbirth', stake: body(), odds: 5, win: { text: '産婆が「この子は戦士だ」と声をかけた。元気な子が生まれた。', add: ['child'] }, lose: { text: 'お産は難しく、子は育たなかった。' } } },
  { id: 'ch.seven', frame: 'family', ages: [20, 75], repeat: true, title: '子の手習い', story: '子が七つになった。そろそろ、家の仕事を覚える歳だ。', art: 'scene.child.seven',
    left: { title: '神殿の人に頼んで、絵文書を習わせる', art: 'choice.temple', stake: store(1), odds: 5, win: { text: '子が、絵と印の読み方を覚えはじめた。', add: ['childletters'] }, lose: { text: '神殿になじめず、戻ってきた。' } },
    right: { title: '泥あげを教える', art: 'choice.rice', stake: body(), odds: 6, win: { text: '小さな手が、水路の泥をすくうようになった。', add: ['childhands'] } } },
  { id: 'ch.fifteen', frame: 'family', ages: [20, 75], repeat: true, title: '子の行く末', story: '子が十五になった。', art: 'scene.child.fifteen',
    left: { title: '畑を分けて、家に残す', art: 'choice.paddy', stake: store(2), odds: 5, win: { text: '畑を分け、家のそばに住まわせた。', add: ['branchhouse'] }, lose: { text: '分ける畑が足りず、話は先送りになった。' } },
    right: { title: '都の工房へ奉公に出す', art: 'choice.migrate', stake: body(), odds: 4, win: { text: '子は都の工房に預けられた。', sendChild: true, add: ['childaway'] }, lose: { text: '奉公先になじまず、戻ってきた。' } } },
  { id: 'ie.retire', frame: 'family', family: true, ages: [55, 65], needsAny: ['grownchild', 'heir'], title: '家を譲る日', story: '育った子らに、畑を任せる頃合いになった。', art: 'scene.hermit',
    left: { title: '長子に家を譲る', art: 'choice.inherit', odds: 6, win: { text: '家を長子に譲り、隠居した。', retire: 'inherit' } },
    right: { title: '子らに畑を分ける', art: 'choice.inherit', odds: 6, win: { text: '畑を子らに分け、分家ができた。', retire: 'divide', houseDown: true, add: ['branchhouse'] } } },

  // ── 回復
  { id: 'rec.temazcal', frame: 'recovery', ages: [15, 75], repeat: true, tired: true, title: '蒸し風呂', story: '痛む体を蒸し風呂にあずけると、軽くなるという。', art: 'scene.hotspring',
    left: { title: '石を焼いて蒸し風呂に入る', art: 'choice.hotspring', stake: store(2), odds: 6, win: { text: '蒸気の中で汗を流し、体が軽くなった。', body: 3 } },
    right: { title: '働き続ける', art: 'choice.work', stake: body(), odds: 5, win: { text: '休まず畑に出て、蓄えが増えた。', store: 2 }, lose: { text: '無理がたたって寝込んだ。' } } },
  { id: 'rec.delegate', frame: 'recovery', ages: [30, 75], repeat: true, tired: true, needs: ['grownchild'], title: '仕事を任せる', story: '育った子が、舟と畑を見ると言っている。', art: 'scene.delegate',
    left: { title: '子に任せて休む', art: 'choice.delegate', stake: lock('grownchild', 2), odds: 6, win: { text: '子に畑を任せ、体を休めた。', body: 3 } },
    right: { title: '自分でやる', art: 'choice.work', stake: body(), odds: 6, win: { text: '畑は自分の手で守った。', store: 1 } } },
  { id: 'rec.healer', frame: 'recovery', ages: [15, 75], repeat: true, tired: true, title: '薬草売り', story: '市の隅で、薬草売りが草の束を並べている。', art: 'scene.medicine',
    left: { title: '自分の薬草を買う', art: 'choice.medicine', stake: store(), odds: 4, win: { text: '煎じた草が効き、体が軽くなった。', body: 2 }, lose: { text: '効かなかった。' } },
    right: { title: '薬草に頼らず働く', art: 'choice.work', stake: body(), odds: 6, win: { text: '薬を買わずに働き、蓄えが残った。', store: 1 } } },
  { id: 'old.back', frame: 'recovery', ages: [48, 75], repeat: true, title: '腰の痛み', story: '朝、舟の上で腰が伸びない。', art: 'scene.backpain',
    left: { title: '高い薬草を買う', art: 'choice.medicine', stake: store(2), odds: 5, win: { text: '薬が効いた。', body: 2 }, lose: { text: '効かなかった。' } },
    right: { title: '我慢して舟を漕ぐ', art: 'choice.bearit', stake: riskBody(), odds: 3, win: { text: 'なんとかなった。', store: 1 }, lose: { text: '寝込んだ。' } } },
  { id: 'old.grandchild', frame: 'family', ages: [46, 70], needsAny: ['child', 'grownchild'], title: '孫', story: '子に子が生まれた。', art: 'scene.grandchild',
    left: { title: '孫を舟に乗せて遊ぶ', art: 'choice.play', stake: body(), odds: 6, win: { text: '孫が懐いた。舟の上から、柳の列を指さした。', add: ['garden'] } },
    right: { title: '孫に昔の話をする', art: 'choice.tell', stake: store(1), odds: 6, win: { text: '新しい火の夜の話を、孫は目を丸くして聞いた。', add: ['oldtales'] } } },
  // メモ 2: 酒は孫のいる七十ごろ以上の老人だけが飲んでよい。
  { id: 'old.octli', frame: 'path', axis: 'slow', ages: [60, 75], needsAny: ['grownchild', 'grandchild', 'heir'], title: '老人の酒', story: '祭りの日、リュウゼツランの酒が回ってきた。孫のいる老人だけが、飲んでよい。', art: 'scene.festival',
    left: { title: '一杯だけ、ゆっくり飲む', art: 'choice.tea', stake: body(), odds: 5, win: { text: '孫に笑われながら、昔の唄を一節歌った。', add: ['riverbank'] }, lose: { text: '二杯目から記憶がなく、翌朝は舟の上で寝ていた。' } },
    right: { title: '飲まずに若い者の世話をする', art: 'choice.attend', stake: body(), odds: 5, win: { text: '酔った若者たちを家まで送り届けた。', add: ['villagetrust'] }, lose: { text: '若者たちに説教して、逆に煙たがられた。' } } },

  // ── 金と身分、恋、暮らし、武
  // 推測: 賭けごと（パトリ）は豆を賭ける遊び。庶民の賭博への罰は未確認。
  { id: 'mo.patolli', frame: 'path', ages: [16, 50], axis: 'money', repeat: true, title: '豆を賭ける遊び', story: '十字を描いた敷物の上で、豆を転がして駒を進める遊びがある。賭けるのは、カカオの豆だ。', art: 'scene.coin',
    left: { title: '一握りだけ賭ける', art: 'choice.hoard', stake: riskStore(1), odds: 3, win: { text: '駒が最後に揃い、豆が三倍になって返ってきた。', store: 3 }, lose: { text: '豆は全部、向かいの男の袋に入った。' } },
    right: { title: '見物して、親の手つきを覚える', art: 'choice.watchduel', stake: body(), odds: 5, win: { text: '親の手つきと賭けの癖を覚え、あとで別の場で役立った。', add: ['speech'] }, lose: { text: '徹夜で見て、翌日は舟の上で眠った。' } } },
  { id: 'st.recruit', frame: 'path', ages: [18, 35], axis: 'status', title: '戦士の募り', story: '都から、戦に出る者を募りに使いが来た。捕えた数で、位が決まる。', art: 'scene.recruit',
    left: { title: '戦の列に加わる', art: 'choice.enlist', stake: riskBody(2), odds: 4, win: { text: '戦の端で生け捕りの手伝いをし、捕えた者に数えられた。', rank: 1 }, lose: { text: '稽古で体を痛め、帰された。' } },
    right: { title: '畑を広げる', art: 'choice.expand', stake: body(2), odds: 4, win: { text: '泥を掘り上げて、新しいチナンパを築いた。', add: ['newfield'] }, lose: { text: '杭の根づかない土地で、築けなかった。' } } },
  { id: 'sl.fishing', frame: 'path', ages: [20, 70], axis: 'slow', repeat: true, title: '朝の舟', story: '朝もやの水路。魚が跳ねた。', art: 'scene.fishing',
    left: { title: '舟を出す', art: 'choice.fishing', stake: body(), odds: 5, win: { text: '小エビの網が重くなった。', add: ['riverbank'] }, lose: { text: '一匹も取れなかった。' } },
    right: { title: '畑の仕事を片づける', art: 'choice.chores', stake: body(), odds: 5, win: { text: '仕事がはかどった。', store: 1 }, lose: { text: '仕事は片づかなかった。' } } },
  { id: 'sr.train', frame: 'path', ages: [15, 40], axis: 'strength', repeat: true, title: '朝の稽古', story: '日の出前。若者の家の庭で、木の槍を振る時間はある。', art: 'scene.training',
    left: { title: '槍を振る', art: 'choice.drill', stake: riskBody(), odds: 4, win: { text: '体が締まった。', add: ['strongbody'] }, lose: { text: '筋を痛めた。' } },
    right: { title: '畑の水を見に行く', art: 'choice.water', stake: body(), odds: 5, win: { text: '畑は順調だ。', store: 1 }, lose: { text: '畦が崩れて、一日つぶれた。' } } },
  { id: 'lo.poem', frame: 'path', ages: [20, 50], axis: 'love', needs: ['songlearn'], title: '恋の歌をよこす人', story: '歌を知っていると知った人が、返歌を求めてきた。', art: 'scene.letter',
    left: { title: '返歌を作る', art: 'choice.reply', stake: store(1), odds: 3, win: { text: '歌のやりとりが続いた。', add: ['affair'] }, lose: { text: '歌が人の口に上り、噂になった。' } },
    right: { title: '歌い手に弟子入りする', art: 'choice.poetry', stake: store(1), odds: 5, win: { text: '祭りの歌い手の仲間に入れてもらった。', add: ['friend'] }, lose: { text: '笑われて、歌い手の輪から外れた。' } } },

  // ── 梯子の段の札。史実の手本はメモ 6・9。右は別の軸の同じ段の品へ寄る
  // ステータス
  rungCard('st.speech', 'status', 1, { title: 'カルプリの寄り合い', story: '水を入れる順番をめぐって、長老たちが言い争っている。末席の若者にも、一言だけ口をはさむ機会が来る。', art: 'scene.meeting',
    left: { title: '立って意見を述べる', art: 'choice.rhetoric', stake: body(), odds: 5, win: { text: '短く言い切ったら、長老のひとりがうなずいた。', add: ['villagetrust'] }, lose: { text: '緊張して舌がもつれ、笑い声が起きた。' } },
    right: { title: '寄り合い帰りの人々に、焼いた餅を売る', art: 'choice.market', stake: body(), odds: 5, win: { text: '帰り道の人々に、餅が飛ぶように売れた。豆の袋がふくらんだ。', add: ['cacaostash'] }, lose: { text: '餅は冷めて、売れ残りを自分で食べた。' } } }),
  rungCard('st.market', 'status', 2, { title: '市の見張り役', story: '市の秤や目方をごまかす者を見張る役が、欠けた。湖畔の村から選ぶという。', art: 'scene.market',
    left: { title: '見張り役に推される', art: 'choice.referee', stake: store(2), odds: 4, win: { text: '秤を持って市を歩くようになった。村の者は、あの人は見張り役だと言った。', add: ['marketwatch'] }, lose: { text: '都の別の村の者が選ばれた。' } },
    right: { title: '場所代を払って自分の売り場を得る', art: 'choice.shop', stake: store(2), odds: 4, win: { text: '市の端に、自分の敷物を広げる場所を得た。', add: ['stallright'] }, lose: { text: '場所代だけ取られて、場所は別の人のものだった。' } } }),
  // 平民が貢ぎ物の取り立て役を務めたかは確かめていない（推測）。
  rungCard('st.calpixqui', 'status', 3, { years: [1484, 1520], title: '貢ぎ物の取り立て役', story: '王の取り立て役が、湖畔の村々から貢ぎ物を集める者を探している。数を数えられる者、顔の通る者がいい。', art: 'rank.nanushi',
    left: { title: '取り立て役を引き受ける', art: 'choice.headman', stake: store(3), odds: 3, win: { text: '貢ぎ物の袋と数をすべて覚え、都の役人に名を覚えられた。', add: ['calpixqui'] }, lose: { text: '数が合わず、誰かが袋をすり替えたと疑われた。' } },
    right: { title: '遠い国へ向かう荷に、持ち分を出す', art: 'choice.market', stake: store(3), odds: 3, win: { text: '荷は南の海岸まで行き、カカオと羽根を持って戻った。持ち分がふくらんだ。', add: ['caravan'] }, lose: { text: '荷は戻らなかった。' } } }),
  // メモ 9: エンコミエンダ下で、ナワの町にカビルド（町会）が入った。
  rungCard('st.cabildo', 'status', 3, { years: [1525, 1560], title: '町会の席', story: '新しい領主の下で、町に町会が置かれることになった。席に先住民の者も座るという。', art: 'rank.nanushi',
    left: { title: '町会の席を願い出る', art: 'choice.headman', stake: store(3), odds: 3, win: { text: '見慣れない杖を持たされ、町会の席に座った。', add: ['cabildo'] }, lose: { text: '席は古い家柄に回った。' } },
    right: { title: '荷の持ち分に回す', art: 'choice.market', stake: store(3), odds: 3, win: { text: '荷は遠くまで行き、持ち分がふくらんだ。', add: ['caravan'] }, lose: { text: '荷は戻らなかった。' } } }),
  // メモ 6: 戦功は絵に描かれた。メンドーサ写本は征服後の編纂。
  rungCard('st.annals', 'status', 4, { ages: [28, 40], years: [1484, 1520], title: '年の絵', story: '都の書き手が、年ごとの出来事を絵にしている。ときに、手柄のあった者の名を、印にして描き込む。', art: 'scene.letters',
    left: { title: '手柄を語って、名を描き込んでもらう', art: 'choice.rhetoric', stake: body(), odds: 2, win: { text: '絵の隅に、自分の名の印が小さく描かれた。', add: ['codexname'] }, lose: { text: '書き手は、貴い家の手柄だけを描いた。' } },
    right: { title: '大きな荷の取引をまとめる', art: 'choice.shop', stake: store(5), odds: 2, win: { text: '荷は大きな取引に育ち、その身代は語り草になった。', add: ['fortune'] }, lose: { text: '取引相手に代金を持ち逃げされた。', add: ['debt'] } } }),
  rungCard('st.codex', 'status', 4, { years: [1535, 1560], title: '写本の絵', story: '副王のために、先住民の絵描きたちが昔の暮らしを絵にしている。村々の貢ぎ物の数も描き込むという。', art: 'scene.letters',
    left: { title: '村の貢ぎ物の数と、自分の名を伝える', art: 'choice.rhetoric', stake: body(), odds: 2, win: { text: '絵の隅に、自分の名の印と、貢ぎ物を納める村の絵が描かれた。', add: ['codexname'] }, lose: { text: '絵描きは、都の大きな町の貢ぎ物だけを描いた。' } },
    right: { title: '大きな取引をまとめる', art: 'choice.shop', stake: store(5), odds: 2, win: { text: '取引は大きく育ち、その身代は語り草になった。', add: ['fortune'] }, lose: { text: '取引相手に持ち逃げされた。', add: ['debt'] } } }),
  // マネー
  rungCard('mo.turkey', 'money', 1, { title: '七面鳥の雛', story: '市で、七面鳥の雛が売られている。育てば祝いの席に出る。', art: 'scene.coin',
    left: { title: '雛を数羽買って育てる', art: 'choice.hoard', stake: store(1), odds: 4, win: { text: '雛はよく育ち、祝いの前に高く売れた。', add: ['turkeys'] }, lose: { text: '犬が雛を追いかけ、一羽も残らなかった。' } },
    right: { title: '歌のうまい娘に一羽贈る', art: 'choice.gift', stake: store(1), odds: 4, win: { text: '娘は笑って、代わりに歌をひとつ教えてくれた。', add: ['songlearn'] }, lose: { text: '受け取った娘は、別の男の家へ行った。' } } }),
  rungCard('mo.trade', 'money', 2, { title: '市で売り買いする', story: '市の布売りが、湖畔の村の豆や魚をまとめて扱える者を探している。', art: 'scene.market',
    left: { title: '売り場の権利を買う', art: 'choice.shop', stake: store(2), odds: 4, win: { text: '敷物の一角が、自分の売り場になった。毎年、豆が少しずつ残る。', add: ['stallright'] }, lose: { text: '権利を売る男は、翌日いなくなった。' } },
    right: { title: '店先の布売りと話し込む', art: 'choice.approach', stake: store(1), odds: 4, win: { text: '二人で市を歩く姿が、噂になった。', add: ['townlove'] }, lose: { text: '忙しいと断られ、ひとりで帰った。' } } }),
  rungCard('mo.caravan', 'money', 3, { title: '遠い国への荷', story: '南の海岸まで荷を運ぶ商人が、仲間を募っている。羽根とカカオが、帰りの荷になる。', art: 'work.trade',
    left: { title: '荷を託して持ち分を得る', art: 'choice.market', stake: store(4), odds: 3, win: { text: '荷は無事に戻り、遠い国との商いに持ち分を得た。', add: ['caravan'] }, lose: { text: '道がふさがり、荷は戻らなかった。' } },
    right: { title: '荷の宿で出会った人に文を通わせる', art: 'choice.letter', stake: body(), odds: 3, win: { text: '遠い宿の主の娘と、歌の便りが続いた。噂は宮廷まで届いた。', add: ['courtlove'] }, lose: { text: '返事はなかった。' } } }),
  rungCard('mo.fortune', 'money', 4, { title: 'カカオの大荷', story: '遠い南の海岸から、カカオ豆の大荷が届く。まとめて買わないかと持ちかけられた。', art: 'work.trade',
    left: { title: '蓄えを出して、大荷を買う', art: 'choice.market', stake: store(5), odds: 2, win: { text: '大荷は市に流れ、その身代は語り草になった。', add: ['fortune'] }, lose: { text: '荷の半分は、殻に土を詰めた偽物だった。', add: ['debt'] } },
    right: { title: '宴で恋の歌を頼む', art: 'choice.celebrate', stake: body(), odds: 2, win: { text: '歌い手は二人の恋の歌を作った。歌は国をまたいで歌われた。', add: ['lovesong'] }, lose: { text: '歌い手は、別の恋を歌にした。' } } }),
  // ラブ
  rungCard('lo.song', 'love', 1, { title: '歌の家の夕べ', story: '歌の家で、同じ歳の人が輪の隣に立った。覚えた歌の続きを歌うのは、どちらだ。', art: 'scene.festival',
    left: { title: '輪に入って、恋の歌を覚える', art: 'choice.sing', stake: body(), odds: 5, win: { text: '歌の一節ずつ、足運びとともに覚えた。', add: ['songlearn'] }, lose: { text: '一番の歌詞を二番に歌ってしまった。' } },
    right: { title: '歌の輪を抜けて、家の庭の話をする', art: 'choice.garden', stake: body(), odds: 5, win: { text: '庭先に花と薬草を植えた。', add: ['garden'] }, lose: { text: '話が長引き、歌の家の門が閉まっていた。' } } }),
  rungCard('lo.market', 'love', 2, { title: '市の夕暮れ', story: '市が終わり、知り合った人がもう少し話そうと言う。', art: 'scene.festival',
    left: { title: '連れ立って歩く', art: 'choice.approach', stake: store(1), odds: 4, win: { text: '二人が歩く姿を、市の人々が覚えた。', add: ['townlove'] }, lose: { text: '人目が気になり、早々に別れた。' } },
    right: { title: '家に帰って、次の代の備えを数える', art: 'choice.home', stake: store(2), odds: 4, win: { text: '次の代のために、トウモロコシを取り分けた。', add: ['cornreserve'] }, lose: { text: '家の入り用で使ってしまった。' } } }),
  rungCard('lo.court', 'love', 3, { title: '歌の会', story: '湖の北の宮廷で、歌の会が開かれる。庶民の歌い手も、一晩だけ呼ばれることがあるという。', art: 'scene.festival',
    left: { title: '歌を携えて宮廷の会に出る', art: 'choice.sing', stake: store(2), odds: 3, win: { text: '会で出会った人との恋が、宮廷の噂になった。', add: ['courtlove'] }, lose: { text: '歌の番が来る前に、会は終わった。' } },
    right: { title: '村に残って、孫の代の木を植える', art: 'choice.plant', stake: body(2), odds: 3, win: { text: '自分が老いても実る木を、畑の端に植えた。', add: ['oldgrove'] }, lose: { text: '若木は根づかず、植え直しになった。' } } }),
  rungCard('lo.ballad', 'love', 4, { title: '旅の歌い手', story: '旅の歌い手が、村に宿を借りた。語るに足る恋の話を探しているという。', art: 'scene.festival',
    left: { title: '二人の恋を語って聞かせる', art: 'choice.tell', stake: body(), odds: 2, win: { text: '歌い手は二人の恋を歌にした。歌は、ほかの村の祭りでも歌われた。', add: ['lovesong'] }, lose: { text: '歌い手は、別の村の恋を歌にした。' } },
    right: { title: '家の来し方を子や孫に聞かせる', art: 'choice.tell', stake: body(), odds: 2, win: { text: '子らは孫に伝え、孫はその子に伝えた。', add: ['ancestor'] }, lose: { text: '子らは忙しく、話は聞かれなかった。' } } }),
  // スローライフ
  rungCard('sl.garden', 'slow', 1, { title: '家の庭', story: '家の脇に、空いた土地がある。', art: 'scene.garden',
    left: { title: '花と薬草を植える', art: 'choice.plant', stake: body(), odds: 5, win: { text: '季節ごとの花が咲き、薬草が家の台所に並んだ。', add: ['garden'] }, lose: { text: '根づかなかった。' } },
    right: { title: '庭の代わりに鴨猟の舟に乗る', art: 'choice.netting', stake: body(), odds: 5, win: { text: '槍器を握って舟べりに立ち、鴨を落とした。', add: ['atlatl'] }, lose: { text: '鴨はすべて飛び去った。' } } }),
  rungCard('sl.reserve', 'slow', 2, { title: '次の代のトウモロコシ', story: '今年の実りを使い切るか、次の代のために残しておくか。', art: 'place.storehouse',
    left: { title: '使わずに取り分ける', art: 'choice.hoard', stake: store(2), odds: 4, win: { text: '次の代へ渡せる備えができた。', add: ['cornreserve'] }, lose: { text: 'しまったトウモロコシに、虫が付いた。' } },
    right: { title: '荷舟の護衛に出る', art: 'choice.escort', stake: riskBody(), odds: 4, win: { text: '荷を守り抜き、湖畔の町で名を覚えられた。', add: ['guardwork'] }, lose: { text: '荷を狙われ、腕に傷を負った。', add: ['wound'] } } }),
  rungCard('sl.heirwed', 'slow', 3, { ages: [40, 70], needsAny: ['heir'], lacks: ['heirwed'], title: '跡取りの縁組', story: '跡取りが年頃になった。仲人の老婆が家に来ている。', art: 'family.child',
    left: { title: '長老の口利きの縁談', art: 'choice.accept', stake: store(2), odds: 3, win: { text: '長老の口利きで、良い家の娘を迎えた。', add: ['heirwed', 'villagetrust'] }, lose: { text: '婚礼の費えが足りず、借りをして迎えた。', add: ['heirwed', 'debt'] } },
    right: { title: '跡取りの想う相手と添わせる', art: 'choice.celebrate', stake: body(), odds: 3, win: { text: '跡取りは想う相手と添い、家が明るくなった。', add: ['heirwed', 'garden'] }, lose: { text: '長老の勧めを断った形になり、気まずくなった。', add: ['heirwed'] } } }),
  rungCard('sl.ancestor', 'slow', 4, { ages: [45, 75], needsAny: ['heir'], title: '囲炉裏端の話', story: '子や孫が、囲炉裏端で家の昔の話をせがむ。', art: 'place.house',
    left: { title: '家の来し方を語って聞かせる', art: 'choice.rest', stake: body(), odds: 2, win: { text: '話は子から孫へ、そのまた子へと語り継がれた。', add: ['ancestor'] }, lose: { text: '子も孫も、途中で寝てしまった。' } },
    right: { title: '古い戦の傷あとを孫に見せる', art: 'choice.oldmarch', stake: store(3), odds: 3, win: { text: '孫はそれを友に話し、武勇として伝わった。', add: ['valortale'] }, lose: { text: '孫は、傷あとを怖がった。' } } }),
  // ストレングス
  // 推測: ゴムの球を腰で打つ球技の場が湖畔にあったか。球技は都の儀式に結びつく。
  rungCard('sr.ballcourt', 'strength', 1, { title: '球技の場', story: '重いゴムの球を、腰で打ち合う遊びがある。膝も肘も使えない。', art: 'scene.sumo',
    left: { title: '腰で球を打つ', art: 'choice.sumo', stake: riskBody(), odds: 4, win: { text: '球は壁に当たって返り、観衆が歓声を上げた。', add: ['ballskill'] }, lose: { text: '球が腰に当たり、そのまま転がった。', add: ['wound'] } },
    right: { title: '審判役を買って出る', art: 'choice.referee', stake: body(), odds: 5, win: { text: '公平な審判だと言われた。', add: ['villagetrust'] }, lose: { text: 'えこひいきだと言われた。' } } }),
  rungCard('sr.guard', 'strength', 2, { title: '荷舟の護衛', story: '市へ向かう荷舟が、護衛の槍持ちを探している。', art: 'scene.market',
    left: { title: '槍を持って同乗する', art: 'choice.guard', stake: riskBody(), odds: 4, win: { text: '町まで荷を届け、また頼むと言われた。', add: ['guardwork'] }, lose: { text: '石を受けて傷を負った。', add: ['wound'] } },
    right: { title: '市の見張り役に顔を売る', art: 'choice.referee', stake: store(1), odds: 4, win: { text: '見張り役に覚えられ、秤の口を利いてもらえた。', add: ['marketwatch'] }, lose: { text: '話は流れた。' } } }),
  rungCard('sr.eagle', 'strength', 3, { years: [1484, 1520], title: '戦士団の誘い', story: '鷲とジャガーの戦士団が、手柄を重ねた平民を迎えることがあるという。捕虜の数が、問われる。', art: 'scene.battle',
    left: { title: '入団の試しを受ける', art: 'choice.dojo', stake: riskBody(2), odds: 3, win: { text: '鷲の羽根の兜を与えられ、戦士団の席に座った。', rank: 2 }, lose: { text: '試しの途中で傷を負い、席は別の者に回った。', add: ['wound'] } },
    right: { title: '戦功を理由に取り立て役を願う', art: 'choice.bribe', stake: store(3), odds: 3, win: { text: '戦功が認められ、取り立て役を任された。', add: ['calpixqui'] }, lose: { text: '願いは聞かれなかった。' } } }),
  rungCard('sr.legend', 'strength', 4, { title: '戦語りの夜', story: '若い戦士たちが、昔の戦の話を聞きに来た。語られた武勇は、長く伝わる。', art: 'scene.dojo',
    left: { title: '戦場の話を若い者に語る', art: 'choice.tell', stake: body(), odds: 2, win: { text: '話は若い戦士から、その子らへ伝わった。', add: ['valortale'] }, lose: { text: '若者たちは、途中で聞くのをやめた。' } },
    right: { title: '手柄を絵に描かせる', art: 'choice.rhetoric', stake: store(3), odds: 2, win: { text: '絵の隅に自分の名の印が描かれた。', add: ['codexname'] }, lose: { text: '絵描きは、別の戦士を描いた。' } } }),

  // ── 建てる・磨く
  { id: 'build.newfield', frame: 'build', ages: [16, 60], repeat: true, max: { fieldId: 'newfield', count: 3 }, title: '新しいチナンパ', story: '岸の浅瀬に、まだ誰の畑でもない水面がある。杭を打ち、泥を積めば、畑になる。', art: 'scene.market',
    left: { title: '杭を打って、泥を積む', art: 'choice.till', cost: { body: 2, store: 1 }, odds: 4, win: { text: '柳の杭が根づき、畑が水面から顔を出した。', add: ['newfield'] }, lose: { text: '杭が根づかず、泥は流れた。' } },
    right: { title: '葦で囲んだ小屋を建てる', art: 'choice.hermit', cost: { body: 1 }, odds: 5, win: { text: '舟で昼寝のできる小屋ができた。', add: ['riverbank'] }, lose: { text: '風で小屋が倒れた。' } } },
  { id: 'build.temazcal', frame: 'build', ages: [18, 60], repeat: true, lacks: ['temazcal'], title: '蒸し風呂の話', story: '蒸し風呂があれば、体の痛みも熱も、ずいぶん楽になる。', art: 'place.well',
    left: { title: '石と土で蒸し風呂を築く', art: 'choice.till', cost: { store: 2 }, odds: 4, win: { text: '小さな蒸し風呂が築け、冬の朝が楽になった。', add: ['temazcal'] }, lose: { text: '壁が崩れ、築き直しになった。' } },
    right: { title: '隣の蒸し風呂に通う', art: 'choice.water', cost: { body: 1 }, odds: 6, win: { text: '近所と並んで汗をかいた。', add: ['strongbody'] } } },
  { id: 'build.willows', frame: 'build', ages: [16, 60], repeat: true, needs: ['kind:畑'], lacks: ['willows'], title: '畑の縁の柳', story: '畑の縁に柳を植えておくと、風も霜も和らぐという。', art: 'place.pond',
    left: { title: '柳の列を植える', art: 'choice.plant', cost: { body: 2, store: 2 }, odds: 4, win: { text: '柳の列が根づき、風が畑の苗を倒さなくなった。', add: ['willows'] }, lose: { text: '柳は水に浸かりすぎて枯れた。' } },
    right: { title: '隣の家の杭打ちを手伝う', art: 'choice.attend', cost: { body: 1 }, odds: 5, win: { text: '杭打ちの礼に、柳の枝をもらった。', add: ['villagetrust'] }, lose: { text: '杭の頭で指をつぶした。' } } },
  { id: 'build.cuezcomatl', frame: 'build', ages: [18, 60], repeat: true, lacks: ['cuezcomatl'], title: '高床の穀倉', story: '雨の年に穀が湿るので、床を上げた穀倉がほしい。', art: 'place.storehouse',
    left: { title: '編んだ壁の穀倉を建てる', art: 'choice.build', cost: { body: 1, store: 3 }, odds: 4, win: { text: '粘土を塗った高床の穀倉が建った。', add: ['cuezcomatl'] }, lose: { text: '粘土が乾いてひびが入った。' } },
    right: { title: '穀を売って人を雇う', art: 'choice.hire', cost: { store: 3 }, odds: 5, win: { text: '畑を手伝う働き手が来た。', add: ['servant'] }, lose: { text: '働き手は、条件のよい家へ行った。' } } },
  { id: 'build.stall', frame: 'build', ages: [20, 60], repeat: true, needsAny: ['stallright'], lacks: ['stall'], title: '露店を構える', story: '売り場の権利を持つなら、屋根のついた露店が持てる。', art: 'work.shop',
    left: { title: '蓄えを出して露店を構える', art: 'choice.shop', cost: { store: 8 }, odds: 4, win: { text: '屋根と棚のある露店ができた。', add: ['stall'] }, lose: { text: '露店は続かず、元手を失った。' } },
    right: { title: '行商で顔を売る', art: 'choice.market', cost: { body: 1 }, odds: 5, win: { text: '行商先で名を覚えられた。', add: ['citysights'], store: 1 }, lose: { text: '売れ残った。' } } },
  { id: 'build.cargocanoe', frame: 'build', ages: [20, 60], repeat: true, needs: ['villagetrust'], lacks: ['cargocanoe'], title: '荷舟を持つ', story: '湖畔の町まで荷を運ぶ舟が、村にはまだ足りない。', art: 'work.ferry',
    left: { title: '大きな丸木舟を刳り貫く', art: 'choice.market', cost: { store: 8 }, odds: 5, win: { text: '何人も乗る荷舟ができた。', add: ['cargocanoe'] }, lose: { text: '舟は割れた。' } },
    right: { title: '渡し場の見張りをする', art: 'choice.guard', cost: { body: 1 }, odds: 4, win: { text: '荒くれを追い払い、腕を認められた。', add: ['strongbody'] }, lose: { text: '殴られて寝込んだ。' } } },
  { id: 'build.servant', frame: 'build', ages: [25, 70], repeat: true, lacks: ['servant'], title: '住み込みの働き手', story: '食い扶持に困った若者が、置いてくれと頼みに来た。', art: 'place.servant',
    left: { title: '働き手として抱える', art: 'choice.hire', cost: { store: 3 }, odds: 6, win: { text: '働き手が増えた。', add: ['servant'] } },
    right: { title: '神殿に口をきいてやる', art: 'choice.temple', cost: { body: 1 }, odds: 6, win: { text: '若者は神殿の下働きになり、神官に礼を言われた。', add: ['priest', 'villagetrust'] } } },

  // ── 静かな年
  { id: 'q.season', frame: 'quiet', quiet: true, repeat: true, ages: [7, 75], title: '静かな一年', story: '大きなことのない一年だった。', art: 'scene.quiet',
    left: { title: '畑を耕す', art: 'choice.till', stake: body(), odds: 6, win: { text: 'トウモロコシが少し余った。', store: 1 } },
    right: { title: '家でくつろぐ', art: 'choice.rest', stake: store(1), odds: 6, win: { text: '体が休まった。', body: 2 } } },
  { id: 'q.neighbors', frame: 'quiet', quiet: true, repeat: true, ages: [15, 75], title: '寄り合い', story: 'カルプリの寄り合いがある。', art: 'scene.meeting',
    left: { title: '顔を出す', art: 'choice.attend', stake: body(), odds: 6, win: { text: '水の順番の話がまとまった。', add: ['villagetrust'] } },
    right: { title: '休んで舟で昼寝する', art: 'choice.skip', stake: body(), odds: 6, win: { text: '舟の上でよく眠った。', body: 2 } } },
  ...VIGNETTES.map(([id, ages, title, text, extra = {}]) => ({ id, frame: 'quiet', quiet: true, ages, title, story: text, art: 'scene.quiet', ...extra,
    left: { title, art: 'choice.rest', odds: 6, win: { text } }, right: { title, art: 'choice.rest', odds: 6, win: { text } } })),
];

// 生まれ。メモ 8: 産婆が「戦士だ」と声をかけ、男の子のへその緒は戦場に埋めるとされる（要確認）。家の格ときょうだいの割合は未確認（推測）。
const BIRTH = {
  houses: [
    { id: 'plain', weight: 2 },
    { id: 'modest', weight: 1, houseLevel: 2, houseStore: 3, patch: { 1: { prepend: '家には少しカカオと綿布の蓄えがあり、父は柳の列を数え直している。' } } },
    { id: 'poor', weight: 1, add: ['debt'], patch: { 1: { prepend: '家はカカオを借りて冬を越した。次の実りから返さねばならない。' } } },
  ],
  siblingModel: { born: [1, 2, 3, 3, 3, 2, 2, 1, 1], elderShare: 0.5, deathRate: 0.45, youngerAges: [2, 4, 6], replaceAge: 3, elderAge: 3,
    plainEvent: { title: '畦をひとりで', story: '畑の畦を、ひとりで歩いて行けるようになった。', cards: [], art: 'event.walk' },
    elderStory: '上には、{list}いる。', only: 'きょうだいは、いない。', birthLines: { 妹: '妹が生まれた。' },
    recallLines: { both: 'この六年で弟妹が{born}生まれ、きょうだいのうち{lost}が育たなかった。', born: 'この六年で弟妹が{born}生まれた。', lost: 'この六年で、きょうだいのうち{lost}が育たなかった。' },
  },
};
const CHILDHOOD = [
  { year: 1484, age: 0, title: '生まれた', story: 'テスココ湖の南、浮き畑（チナンパ）が並ぶ村に生まれた。産婆は「おまえは戦士だ」と最初の言葉をかけ、へその緒は戦に出る男に預けられた。前の世の記憶は、まだ眠っている。', cards: ['mother', 'house'], art: 'event.birth.mikawa' },
  { year: 1485, age: 1, title: '父と浮き畑', story: '父は朝いちばんに舟を出し、水路の泥を畑にかぶせる。畑は湖に浮かぶ泥の島で、柳の杭で囲ってある。', cards: ['father', 'paddy', 'ie'], art: 'event.father.field' },
  { year: 1486, age: 2, title: '舟で行き来する村', story: '家々のあいだは水路で、行き来は舟だ。近所の人が、舟の上から赤ん坊の顔をのぞきに来る。', cards: ['neighbors', 'elderhouse'], art: 'event.neighbors' },
  { year: 1487, age: 3, title: '大きな神殿', story: '北の都の大きな神殿が、直し終わったという。三日三晩、遠くから太鼓の音が聞こえた。', cards: [], art: 'event.walk' },
  { year: 1488, age: 4, title: '日の名', story: '日を読む人が、生まれた日の印から名と運を告げた。父が小さな丸木舟を削ってくれた。', cards: ['canoe', 'neighborhouse'], art: 'event.zori' },
  { year: 1489, age: 5, title: '遠い都の王', story: '北の都に、アウィツォトルという王がいる。村は王に貢ぎ物を納めるが、王の顔を見た者は村にいない。', cards: ['ahuitzotl'], art: 'history.imagawa.rule' },
  { year: 1490, age: 6, title: '雨の季節', story: '雨の季節が来た。苗床に種をまき、水路に泥を足す。一年のめぐりが分かってきた。', cards: ['spring'], art: 'event.seasons' },
];
const FAMILY_OMENS = {
  'fam.father': '父が畑のことばかり話すようになった', 'fam.mother': '母が石臼の前に座る日が減った', 'fam.sister': '妹に仲人が来た',
  'ie.succession': '縁者が家と畑を気にしている', 'ie.retire': '育った子に畑を任せる頃合いだ', 'lo.arranged': '仲人の老婆が家の前を通った',
  'lo.marry': '想い人との話が出ている', 'lo.child': '家に新しい命の気配がある',
};
const FAMILY_AGES = { 'fam.father': [28, 42], 'fam.mother': [33, 50], 'fam.sister': [17, 22], 'ie.succession': [28, 75], 'ie.retire': [55, 65], 'lo.arranged': [20, 30], 'lo.marry': [18, 60] };
const INITIAL_FAMILY_EVENTS = ['fam.father', 'fam.mother', 'fam.sister', 'lo.arranged'];
const KINSHIP_RELATIVES = [];
const DISASTER_TARGETS = { fire: ['house', 'stall'], flood: ['paddy', 'newfield', 'cargocanoe'], famine: ['paddy', 'newfield'] };
const TEXT = {
  demandSources: { 'dm.coatequitl': 'カルプリの長老より', 'dm.tribute1': '王の取り立て役より', 'dm.tribute2': '新しい領主の使いより' },
  houseNames: { own: '{name}の{layer}', neighbor: '隣の{name}の{layer}', branch: '{rel}の{name}の分家', patron: '長老の{name}の{layer}' },
  spouseLabel: '妻（{name}）', diedOfIt: 'それがもとで、助からなかった。',
  substitutes: { father: '父が「わしが行く」と言い出した。', grownchild: '子が「私が行きます」と言い出した。', fatherDemand: '父が「わしが行く」と', grownchildDemand: '子が「私が行きます」と', childChoice: '子の申し出を受ける', fatherChoice: '父の申し出を受ける', servantChoice: '働き手を出す', hireChoice: '人を雇って出す', noneChoice: '誰も出さない', call: '戦', noOne: '臆病者の噂が立つ', noOneResult: '誰も出さず、臆病者の噂が立った。', hireResult: '人を雇って荷を背負わせた。', result: '{name}は{outcome}', ignoreResult: '{name}が代わりに戦に出た。{outcome}', returned: '無事に戻った。', lost: '戻らなかった。' },
  contest: { lostField: '畑', surrender: '{rel}に家を譲り、別の所帯を持った。{result}', splitField: '畑を分けてもらった。', littleField: '畑はわずかしか残らなかった。', inherited: '{rel}を跡取りに替えた。{loss}', titleLoss: '家の格を失った。', noField: '{rel}を退けたが、畑と家の格を失った。' },
  succession: { title: '家を継ぐ者', selfStory: '父を見送った翌年、{rel}が家を継ぎたいと申し出た。', story: '{rel}が家を継ぎたいと申し出た。', fight: '{rel}と家の継承を争う', surrender: '{rel}に家を譲り、別の所帯を持つ', replace: '{rel}を跡取りに替える', noteSurrender: '{rel}に家を譲り、別の所帯を持った', noteWin: '{rel}と継承を争って家を継いだ', noteLose: '{rel}と継承を争い、畑を失いながら家を継いだ' },
  kinArrive: '{rel}の{name}が顔を見せに来た。', grandchildBorn: '跡取りに子が生まれた。孫だ。', childSpared: 'まだ子どもだったので、命までは取られなかった。',
  introduce: { mother: '母は{name}。', father: '父は{name}。', sister: '妹は{name}。', 兄: '兄は{name}。' },
  namedTitle: '{name}、生まれる', named: '日の名は{name}。', namedAfterFather: '',
  yearEnd: '今年の実り：', maintenanceTitle: '{target}をよくする話', maintenanceStory: '{target}を、もう一段よくできそうだ。',
  medicineSide: { head: '親の薬草', lead: '市の薬草を、父や母のために求める。' },
  partingTitle: '疎遠になった縁', partingChoice: '会わないまま三年が過ぎた', partingArt: 'bond.parting', partingText: 'とは疎遠になった。思い出の品が残った。',
  familyShift: { fatherDeath: ['父の顔色がよくなった。', '父がめっきり老け込んだ。'], motherDeath: ['母が庭へ出られるようになった。', '母が床に伏せる日が増えた。'], sisterMarriage: ['妹の縁談が先に延びた。', '妹の縁談が早まりそうだ。'], arrangedMarriage: ['仲人の話が遠のいた。', '仲人の話が近づいた。'], partnerMarriage: ['所帯を持つ話が先に延びた。', '所帯を持つ話が近づいた。'], divorce: ['夫婦の溝が少し埋まった。', '夫婦の溝が深まった。'], birth: ['子はまだ授からない。', '子を授かる兆しがある。'] },
  lifeRoles: { general: 'チナンパの農夫', rank1: '捕えた者', rank2: '戦士団の戦士', champion: '剃髪の者', knownVillageHead: '長老に頼られた顔役', villageHead: '村の顔役', storehouse: '穀倉持ち', merchant: '市の商人', martial: '槍持ち', hermit: '舟の昼寝の人' },
  lifeTitles: { status: '名の通った', money: '富を築いた', love: '浮名を流した', slow: '穏やかに暮らした', strength: '腕の立つ', loveless: '恋に縁のなかった', celebratedLove: '歌に恋を重ねた', plain: '名もなき', kantoPrefix: '' },
  houseEnding: { heading: '家の行く末：', inherited: '長子に譲った', divided: '子らに分けた', rival: 'と継承を争い、所帯を分けた', defended: 'と継承を争い、跡取りが家を守った', ended: '当主の代で終えた', heir: '跡取り', yes: 'あり', no: 'なし' },
};
const CARD_RULES = {
  'hist.nopala': 'battle', 'hist.atlixco': 'battle', 'hist.lake': 'battle', 'hist.mixton': 'battle',
  'lo.meet': 'partnerMeet', 'lo.visit': 'partnerVisit', 'lo.marry': 'partnerMarriage', 'lo.arranged': 'arrangedMarriage',
  'lo.child': 'birth', 'ch.seven': 'childSeven', 'ch.fifteen': 'childFifteen', 'fam.father': 'fatherDeath', 'fam.mother': 'motherDeath', 'fam.sister': 'sisterMarriage',
  'ie.succession': 'succession', 'ie.retire': 'retirement', 'ie.water': 'waterFeud', 'ie.boundary': 'boundaryFeud', 'rec.healer': 'medicine', 'maintenance': 'maintenance', 'q.season': 'quietCard',
  ...Object.fromEntries(VIGNETTES.map(([id]) => [id, 'quietCard'])), 'child.newcanoe': 'recoveryCard',
};
const CARDS_WITH_RULES = CARDS.map((card) => ({ ...card, kind: card.year ? 'history' : card.disaster ? 'disaster' : card.demand ? 'demand' : card.quiet ? 'upkeep' : card.family ? 'family' : 'event', category: card.id.startsWith('lo.') ? 'relationship' : card.id.startsWith('ch.') ? 'child' : null, role: CARD_RULES[card.id] || (card.id.startsWith('lo.') ? 'relationship' : card.id.startsWith('ch.') ? 'childMilestone' : null), disasterType: card.id.startsWith('dis.') ? card.id.slice(4) : null, disasterKey: card.disaster ? card.id : null, familyAge: FAMILY_AGES[card.id] || null }));
const CARD_IDS = Object.fromEntries(CARDS_WITH_RULES.filter((card) => card.role).map((card) => [card.role, card.id]));
const ABILITY_EFFECTS = {
  hygiene: ['dis.plague', 'hist.smallpox:left', 'hist.cocoliztli', 'rec.healer:left', 'lo.child'],
  soil: ['child.mud', 'child.seedbed', 'dis.famine', 'build.newfield', 'build.willows', 'sl.garden'],
  body: ['child.atlatl', 'sr.ballcourt', 'sr.train', 'sr.firstcaptive', 'hist.nopala:left', 'hist.atlixco:left', 'rec.temazcal:left'],
  foresight: ['hist.omens', 'hist.ships', 'hist.cortes', 'hist.smallpox'],
  numbers: ['child.market', 'mo.patolli', 'mo.turkey', 'mo.trade', 'mo.caravan', 'mo.fortune', 'hist.silver'],
  organizing: ['dm.coatequitl', 'dm.festival', 'st.market', 'st.calpixqui', 'st.cabildo', 'build.cargocanoe'],
  expression: ['child.elders', 'child.cuicacalli', 'st.speech', 'lo.song', 'lo.court', 'lo.ballad', 'st.annals', 'st.codex', 'hist.elders'],
  outdoors: ['child.canoe', 'dis.flood', 'hist.flood', 'sr.guard', 'sl.fishing'],
  cooking: ['child.axolotl', 'dis.famine:left', 'dm.festival', 'q.season'],
  making: ['child.newcanoe', 'build.temazcal', 'build.cuezcomatl', 'build.stall'],
  animals: ['child.atlatl:left', 'mo.turkey', 'fi.thief', 'sr.guard'],
  faith: ['fam.father:right', 'hist.newfire', 'hist.friars', 'hist.elders:right', 'dm.festival'],
};
const RANDOM_ABILITIES = Object.keys(ABILITY_EFFECTS);
const abilityStories = {
  hygiene: '水と布を清潔にし、病や傷を手当てする記憶が残っている。', soil: '泥と種の様子を見て、育ち方を考える癖が残っている。', body: '無理のない鍛え方と、重い物の運び方を覚えている。',
  foresight: '湖の向こうの王国が、これからどうなるかを、少しだけ知っている。', numbers: '豆と布の数を比べ、損得を読む感覚が残っている。', organizing: '人手と日取りを分け、仕事を回す知恵が残っている。',
  expression: '歌や絵や言葉で、人の心を動かした記憶がある。', outdoors: '水と天気を見て、舟や道を選ぶ知恵が残っている。', cooking: '粗い食べ物を食べやすくし、蓄える工夫を覚えている。',
  making: '身近な材料で、物を直した手つきが残っている。', animals: '獣や鳥の様子を見分ける感覚が残っている。', faith: '祭りの作法や唱え言に、自然と気を配る。',
};
const GLOSSARY = {
  チナンパ: '湖の浅瀬に杭を打ち、泥を積んで作る浮き畑。水路の泥で肥え、柳の列で風を防ぐ。', カルプリ: '村の区画。畑を割り当て、貢ぎ物の取りまとめや若者の学校を受け持つ。',
  長老: 'カルプリの寄り合いで物事を決める年長者。', 若者の家: '平民の若者が通う学校。槍の稽古と労役を習う。', 歌の家: '若者が夕べに集まり、決まった歌と踊りを習う家。',
  蒸し風呂: '石を焼いて蒸気を作る小屋。病や痛みの手当てに使った。', アトーリ: 'トウモロコシの粥。', タマル: 'トウモロコシの粉を蒸した包み。庶民には祝いの日の食べ物だったという説がある。',
  トルティーヤ: '石灰水で煮て挽いたトウモロコシを、手で叩いて焼いた薄い餅。', アホロートル: '手足のある、湖の小さな両生類。煮て食べた。', 産婆: 'お産を取り上げ、産後数日の世話もする女。',
  仲人: '縁談を取り次ぐ職業の老婆。二度目の訪問で本気の返事を聞く。', カカオ: '小さな買い物の銭になる豆。', 綿布: '大きな支払いに使う布。', 黒曜石: '火山のガラス。刃物や棍棒の刃に使う。',
  投げ槍器: '槍を遠くへ飛ばす道具。水鳥の猟や戦に使う。', 花の戦: '前もって取り決めた、捕虜を得るための戦。', 生け捕り: '殺さずに捕えること。捕えた数で身分が上がった。',
  捕えた者: '敵を一人生け捕りにした戦士の身分。', 鷲とジャガーの戦士団: '手柄のある戦士の組。平民も入れることがあったという。', 剃髪の者: '多くの捕虜を捕えた者に与えられる、最も高い戦士の位。',
  貢ぎ物: '王や領主に納める綿布、豆、トウモロコシなど。', 労役: '堤や水路の普請に、家ごとに人を出す務め。', 取り立て役: '貢ぎ物を集めて都へ届ける役目。', 市の見張り役: '市の秤や目方をごまかす者を見張る役。',
  荷舟: '荷を運ぶ大きな丸木舟。', 絵文書: '絵と印で記した書物。', 町会: '新しい領主の下で町に置かれた、先住民の者も座る会議。', 副王: 'スペイン王の代理として治める役人。', 領主: '町や村の貢ぎ物と労役を割り当てられたスペイン人。',
  修道士: '新しい神の教えを説く、粗い服の男たち。', 新しい火: '五十二年に一度、すべての火を消して新たに起こす祭り。', ココリストリ: '鼻から血を出して多くの人が死んだ、1545 年からの疫病。',
  アトリスコ: '東の山の国の町。ここでの戦で都の軍が大敗したという。', ノパラ: '南の遠い土地。新しい王の最初の戦の地。', 穀倉: '高床にした、トウモロコシの倉。',
};

export default { id: 'aztec', SCOPES, TEMPLATE_SKIP: {}, OPTION_RULES: {}, birthYear: 1484, yearLabel: (year) => `${year}年`, glossary: GLOSSARY, display: { title: 'アステカの農村 — 一年の札', heading: ['アステカ', 'の農村'], short: 'アステカ' }, settings, AXES, LAYERS, SURNAMES, FIELD, START_FIELD, CARDS: CARDS_WITH_RULES, cardById: new Map(CARDS_WITH_RULES.map((card) => [card.id, card])), CARD_IDS, RANDOM_ABILITIES, ABILITY_EFFECTS, abilityStories, NAMING, specialIds: { reconsider: 'goal.reconsider', parting: 'lo.parting', maintenance: 'maintenance' }, specialRoles: { maintenance: 'maintenance' }, CHILDHOOD, BIRTH, FAMILY_OMENS, FAMILY_AGES, INITIAL_FAMILY_EVENTS, KINSHIP_RELATIVES, partnerIds: LOVERS, disasterTargets: DISASTER_TARGETS, text: TEXT };
