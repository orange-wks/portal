import { DEFAULTS } from './defaults.mjs';
// 三河の一生（1550 生まれ）の札データ。文章と数値は Claude の仮置き（2026-10-31）。値は眺めてから直す。
//
// 型
//   FIELD[id] = { name, kind, marks, art, yearly?, guard?, levels?, pastLv3? }   場に置かれる札。marks は共通。levels の段ごとに name/yearly/guard/art が変わる
//   CARD = { id, title, story, art, left: BET, right: BET, ... }   1 年に 1 枚来る二択
//     ages: [min, max]   出てよい歳。year を持つ札はその年に必ず来る（史実）
//     axis: 'status' など   宣言した軸と同じなら出やすさを settings.goalWeight 倍
//     disaster: true      災い。成人後、年ごとに settings.disasterChance で引かれる
//     omen: '…'          この札が来る前の年、年表の伏せ札に出す兆し
//     needs: [fieldId]   場にその札があるときだけ出る。needsAny: [fieldId] はどれか 1 つ。lacks: [fieldId] は無いときだけ
//     past: [abilityId]  指定能力が 0.33 以上なら出る。max: { fieldId, count } は場の枚数上限
//     once: true が既定（同じ札は一生に 1 回）。repeat: true なら何度でも
//     tired: true   体が settings.tiredAt 以下のとき settings.tiredWeight 倍出やすい
//   BET = { title, art, cost, stake, odds, delay, win, lose }
//     cost: { body, store }   選んだ時点で払う建てる費用。蓄え不足分は体で払う
//     stake: { type, what, amount, years }
//       type: 'spend'（必ず払う） | 'risk'（負けたら失う） | 'lock'（years 年のあいだ場から外れ、その後戻る）
//       what: 'body' | 'store' | FIELD の id | 'substitute'     amount は body/store の量（既定 1）
//     odds: 6 面のうち勝つ目の数（6 = 必ず勝つ）。札の上にそのまま見せる
//     delay: 結果が出るまでの年数（既定 0）。出征など
//     win / lose: { text, add: [fieldId], remove: [fieldId], body, store, die: true }
//       lose は odds 6 なら不要。risk の掛け金は lose のとき自動で失う（remove に書かなくてよい）
//     what に 'kind:家族' のように書くと、その種類の札のうち一番新しく置かれた 1 枚を指す
//   払えないとき: store が足りない分は body で払う（1 につき 1）。掛け金の札が場に無い側は選べない
//   ABILITY_EFFECTS: 能力ごとの勝ち目補正先。id または id:left / id:right
//   state.abilities  前世の能力値。毎年の薄れ方は舞台設定で決める
//   always: { add, remove }   どちらを選んでも起きること（史実で場の歴史札が替わる等）
//   静かな年: 史実と災いの次の年は、settings.quietAfterBig なら quiet: true の札だけから引く。引ける札が無い年も quiet から引く

const settings = {
  ...DEFAULTS,
  staggeredReveal: true,
  houseMight: { rank: [0, 2, 4], field: 1, fieldLevel: 1, worker: 2, trust: 1 },
  maxConcubines: 2,
  buildPrice: { 2: 8, 3: 25, 4: 60 },
  claims: { heir: 5, '嫡子': 5, '庶子': 4, '妾腹の子': 3, '義理の子': 2, '兄': 4, '弟': 3, '異母兄弟': 3, '叔父': 3, '叔母の婿': 2, '甥': 2, '姪': 2, 'いとこ': 2 },
  expansionField: 'newfield',
  roleAliases: { heir: 'heir', villagetrust: 'villageTrust', nanushi: 'villageHead', waterwise: 'waterwise', feat: 'merit' },
  rankAliases: { ashigaru: 1, samurai: 2, favor: 2 },
  dangerEras: [{ from: 1550, to: 1584, chance: 0.18 }, { from: 1585, to: 1600, chance: 0.15 }, { from: 1601, to: 1650, chance: 0.1 }],
};

const AXES = {
  status: { name: 'ステータス', mark: '王冠', here: '偉くなる（殿様）', ladder: ['村の顔', '城下の名士', '殿に名を知られる', '天下に名を残す'] },
  money: { name: 'マネー', mark: '硬貨', here: '金持ちになる（長者）', ladder: ['村の蓄え', '城下の店', '国の御用商人', '語り草の豪商'] },
  love: { name: 'ラブ', mark: 'ハート', here: '恋愛に生きる（色好み）', ladder: ['村の恋', '城下の浮名', '国に聞こえた恋', '歌に残る恋'] },
  slow: { name: 'スローライフ', mark: '葉', here: '穏やかに暮らす', ladderBy: 'generation', ladder: ['自分の家', '子の代', '孫の代', '語り継がれるご先祖'] },
  strength: { name: 'ストレングス', mark: '拳', here: '最強を目指す（武芸者）', ladder: ['村の力自慢', '城下の道場', '家中の武功', '天下に名が残る'] },
};

const LAYERS = { village: { name: '家', ranks: ['小百姓', '本百姓', '村の旧家'] } };
const SURNAMES = ['松井', '鈴木', '石川', '加藤', '杉浦', '大野', '近藤', '村松'];
// 16 世紀の農村での通称・名字の使い方は未確認（推測）。同じ家の男は生まれ順で呼び分ける。
const NAMING = {
  male: ['太郎', '次郎', '三郎', '四郎', '五郎', '六郎', '七郎', '八郎', '新左衛門', '弥兵衛'],
  // 大人の通称（推測: 三河の村でどこまで名乗ったかは未確認）。父は生まれ順の幼い名でなく、こちらで呼ぶ
  adult: ['新左衛門', '弥兵衛', '又左衛門', '与兵衛', '源左衛門', '孫兵衛', '甚左衛門', '藤兵衛'],
  female: ['お松', 'お竹', 'お梅', 'お菊', 'お福', 'お糸', 'お縫'],
  given(order) { return NAMING.male[order - 1] || `${NAMING.male[(order - 1) % NAMING.male.length]}${Math.floor((order - 1) / NAMING.male.length) + 1}`; },
  nameOf(ctx, who, key) {
    const father = NAMING.adult[ctx.hash('father') % NAMING.adult.length];
    const brothers = ctx.siblings.filter((sib) => sib.male && ['兄', '弟'].includes(sib.rel));
    const selfOrder = brothers.filter((sib) => sib.elder).length + 1;
    const house = ctx.house;
    const femaleName = (tag) => NAMING.female[ctx.hash(tag) % NAMING.female.length];
    if (who === 'father') return `${house}${father}`;
    if (who === 'self') return `${house}${NAMING.given(selfOrder)}`;
    if (who === 'mother') return `${house}${femaleName('mother')}`;
    if (who === 'sister' || who === '姉' || who === '妹') return `${house}${femaleName(`sister${ctx.kinSlot(key)}`)}`;
    if (who === 'son') return `${house}${NAMING.given(Number(key))}`;
    if (who === 'daughter' || who === '姪') return `${house}${femaleName(`daughter${key}`)}`;
    if (who === 'spouse') {
      const others = ctx.surnames.filter((name) => name !== house), surname = others[ctx.hash(`spouse${key}`) % others.length];
      return `${surname}${femaleName(`spouse${key}`)}`;
    }
    if (who === '叔母の婿') return `${house}${NAMING.given(1 + ctx.hash(`uncleInLaw${key}`) % NAMING.male.length)}`;
    if (['兄', '弟'].includes(who)) {
      const slot = ctx.kinSlot(key), before = ctx.siblings.slice(0, slot + 1).filter((sib) => sib.male && sib.rel === who).length;
      const order = who === '兄' ? Math.max(1, before) : selfOrder + before;
      return `${house}${NAMING.given(order)}`;
    }
    if (who === '異母兄弟') return `${house}${NAMING.given(ctx.siblings.filter((sib) => sib.male).length + 1 + ctx.kinSlot(key))}`;
    if (['叔父', '甥', 'いとこ'].includes(who)) {
      const slot = ctx.kinSlot(key);
      const order = slot + 1;
      return `${house}${NAMING.given(order)}`;
    }
    return `${house}${NAMING.given(1 + ctx.hash(`${who}${ctx.kinSlot(key)}`) % NAMING.male.length)}`;
  },
  birthLine(sex, order, name) { return sex === 'son' ? `男の子で、${name}と名づけた。` : `女の子で、${name}と呼ぶ。`; },
};

const FIELD = {
  ie: { name: '家', role: 'house', kind: '家', marks: { status: 0 }, art: 'place.house', levels: LAYERS.village.ranks.map((name, i) => ({ name, marks: { status: i }, art: `place.house.lv${i + 1}` })) },
  neighborhouse: { name: '隣の家', role: 'rivalHouse', kind: '相手の家', marks: { status: 0 }, art: 'place.neighbors', levels: [1, 2, 3].map((level) => ({ name: `隣の家`, marks: { status: 0 }, art: 'place.neighbors' })) },
  nanushiHouse: { name: '名主の家', role: 'patronHouse', kind: '相手の家', marks: { status: 0 }, art: 'rank.nanushi', levels: [1, 2, 3].map((level) => ({ name: `名主の家`, marks: { status: 0 }, art: 'rank.nanushi' })) },
  kinsman: { name: '縁者', kind: '家族', marks: { slow: 1 }, art: 'place.father.old' },
  mother: { name: '母', role: 'mother', kind: '家族', marks: { slow: 1 }, art: 'place.mother' },
  father: { name: '父', role: 'father', kind: '家族', marks: { slow: 1 }, art: 'place.father' },
  sister: { name: '妹', role: 'sister', kind: '家族', marks: { slow: 1 }, art: 'place.sister' },
  siblings: { name: 'きょうだい', role: 'siblings', kind: '家族', marks: { slow: 1 }, art: 'place.sister' },
  house: { name: 'わらぶきの家', kind: '家', marks: { slow: 1 }, art: 'place.house', levels: [
    { name: 'わらぶきの家', yearly: { body: 1 }, guard: [], art: 'place.house.lv1' },
    { name: '板葺きの家', yearly: { body: 2 }, guard: [], art: 'place.house.lv2' },
    { name: 'かまどと風通しの家', yearly: { body: 3 }, guard: ['dis.plague'], art: 'place.house.lv3' },
  ], pastLv3: ['hygiene'] },
  paddy: { name: '村の田', role: 'field', primary: true, kind: '田', marks: { money: 1, slow: 1 }, art: 'place.paddy', levels: [
    { name: '村の田', yearly: { store: 1 }, guard: [], art: 'place.paddy.lv1' },
    { name: '刈敷を入れた田', yearly: { store: 2 }, guard: [], art: 'place.paddy.lv2' },
    { name: '塩水選と正条植えの田', yearly: { store: 3 }, guard: [], art: 'place.paddy.lv3' },
  ], pastLv3: ['soil'] },
  neighbors: { name: 'となり近所', kind: '里の人々', marks: { slow: 1 }, art: 'place.neighbors' },
  zori: { name: '草履', kind: '持ち物', marks: {}, art: 'goods.zori' },
  barefoot: { name: '裸足', kind: '持ち物', marks: {}, art: 'goods.barefoot' },
  oldfather: { name: '老いた父', role: 'father', substitute: false, kind: '家族', marks: { slow: 1 }, art: 'place.father.old' },
  grownchild: { name: '育った子', role: 'grownchild', kind: '家族', marks: { slow: 1, strength: 1 }, stacks: true, art: 'place.child.grown', yearly: { body: 1 } },
  coward: { name: '臆病者の噂', kind: '重荷', marks: { status: -2, love: -1 }, art: 'burden.coward' },
  inlaw: { name: '妹の嫁ぎ先', kind: '縁', marks: { slow: 1, money: 1 }, guard: ['dis.famine'], art: 'bond.inlaw' },
  arrangedspouse: { name: '連れ合い（縁談）', role: 'spouse', partnerPriority: 2, kind: '家族', marks: { slow: 2, money: 1 }, art: 'place.spouse.arranged', yearly: { body: 1 } },
  imagawa: { name: '今川の支配', kind: '遠くの歴史', marks: {}, art: 'history.imagawa.rule' },
  matsudaira: { name: '松平の独立', kind: '遠くの歴史', marks: {}, art: 'history.matsudaira' },
  takeda: { name: '武田の影', kind: '遠くの歴史', marks: {}, art: 'history.takeda' },
  kanto: { name: '殿さまは関東へ', kind: '遠くの歴史', marks: {}, art: 'history.kanto' },
  tokugawa: { name: '徳川の世', kind: '遠くの歴史', marks: {}, art: 'history.tokugawa' },
  spring: { name: '春', kind: '季節', marks: {}, art: 'season.spring' },

  waterwise: { name: '水路の知恵', role: 'waterwise', kind: '知恵', marks: { money: 1 }, art: 'skill.water' },
  sisterpromise: { name: '妹との約束', kind: '縁', marks: { slow: 1 }, art: 'bond.sister' },
  friend: { name: '幼なじみ', kind: '縁', marks: { love: 1 }, art: 'bond.friend' },
  oldtales: { name: '昔話', kind: '知恵', marks: { slow: 1 }, art: 'skill.tales' },
  sickle: { name: '研いだ鎌', kind: '持ち物', marks: { money: 1 }, art: 'goods.sickle' },
  villagetrust: { name: '里の信頼', role: 'villageTrust', kind: '縁', marks: { status: 1 }, art: 'bond.village' },
  citygossip: { name: '城下の噂', kind: '知恵', marks: { status: 1 }, art: 'skill.gossip' },
  strongbody: { name: '鍛えた体', kind: '体', marks: {}, ability: true, art: 'self.strong' },
  sumo: { name: '相撲の腕', kind: '体', marks: { strength: 1 }, art: 'self.sumo' },
  reading: { name: '読み書き', kind: '知恵', marks: { status: 1 }, art: 'skill.reading' },
  temple: { name: '寺の縁', kind: '縁', marks: { slow: 1 }, art: 'bond.temple' },
  firstlove: { name: '初恋', kind: '縁', marks: { love: 1 }, art: 'bond.firstlove' },
  riverbank: { name: '川辺の昼寝', kind: '暮らし', marks: { slow: 1 }, art: 'life.riverbank' },

  lover: { name: '想い人', kind: '縁', marks: { love: 1 }, art: 'bond.lover' },
  'lover.river': { name: '川辺の娘', kind: '縁', marks: { love: 1 }, art: 'bond.lover.river' },
  'lover.teahouse': { name: '茶屋の人', kind: '縁', marks: { love: 1 }, art: 'bond.lover.teahouse' },
  'lover.widow': { name: '後家どの', kind: '縁', marks: { love: 1 }, art: 'bond.lover.widow' },
  'lover.neighbor': { name: '隣村の人', kind: '縁', marks: { love: 1 }, art: 'bond.lover.neighbor' },
  'lover.traveler': { name: '旅の芸人', kind: '縁', marks: { love: 1 }, art: 'bond.lover.traveler' },
  'lover.singer': { name: '祭りの唄い手', kind: '縁', marks: { love: 1 }, art: 'bond.lover.singer' },
  'lover.weaver': { name: '機織りの人', kind: '縁', marks: { love: 1 }, art: 'bond.lover.weaver' },
  // 残す品: 離れた縁が場に残す品。勝利点の札と同じで、毎年は何も生まず、マークだけ持つ。
  'keep.river': { name: '川辺の娘の櫛', kind: '品', marks: { love: 1 }, art: 'keep.comb' },
  'keep.teahouse': { name: '茶屋の湯呑み', kind: '品', marks: { love: 1 }, art: 'keep.teacup' },
  'keep.widow': { name: '後家どのの文の束', kind: '品', marks: { love: 1 }, art: 'keep.letters' },
  'keep.neighbor': { name: '隣村の人の手ぬぐい', kind: '品', marks: { love: 1 }, art: 'keep.tenugui' },
  'keep.traveler': { name: '旅の芸人の笛', kind: '品', marks: { love: 1 }, art: 'keep.flute' },
  'keep.singer': { name: '唄い手の扇', kind: '品', marks: { love: 1 }, art: 'keep.fan' },
  'keep.weaver': { name: '機織りの人の帯', kind: '品', marks: { love: 1 }, art: 'keep.obi' },
  spouse: { name: '連れ合い', role: 'spouse', partnerName: true, partnerPriority: 1, kind: '家族', marks: { love: 2, slow: 1 }, art: 'place.spouse', yearly: { body: 1 } },
  sidewife: { name: '側室', role: 'concubine', partnerPriority: 3, kind: '家族', marks: { love: 1, status: 1 }, art: 'place.spouse.side', yearly: { body: 1, store: -1 } },
  mistress: { name: '妾', role: 'mistress', partnerPriority: 4, kind: '縁', marks: { love: 2 }, art: 'place.mistress', yearly: { store: -1 } },
  child: { name: '子', kind: '家族', marks: { slow: 1 }, stacks: true, art: 'place.child' },
  affair: { name: '浮名', kind: '縁', marks: { love: 2 }, art: 'bond.affair' },
  rumor: { name: '浮名の噂', kind: '縁', marks: { status: -1 }, art: 'bond.rumor' },
  familyjoy: { name: '家族の晴れ着', kind: '暮らし', marks: { love: 1, slow: 1 }, art: 'life.festive' },
  spear: { name: '槍', kind: '持ち物', marks: { strength: 1 }, art: 'goods.spear' },
  // 武家の身分は段の札一枚。足軽 → 侍 → 侍大将。手入れの年には上がらず、戦と取り立てで上がる。
  rank: { name: '足軽', role: 'rank', kind: '身分', marks: { status: 1, strength: 1 }, art: 'rank.ashigaru', noMaintain: true, levels: [
    { name: '足軽', marks: { status: 1, strength: 1 }, art: 'rank.ashigaru' },
    { name: '侍', marks: { status: 3, strength: 1 }, art: 'rank.samurai' },
    { name: '侍大将', marks: { status: 5, strength: 2 }, art: 'rank.taisho' }] },
  // 武功は残す品。戦や手柄ごとに一枚ずつ残る。
  'kanjo.anegawa': { name: '姉川の感状', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.kanjo' },
  'kanjo.mikatagahara': { name: '三方ヶ原の感状', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.kanjo' },
  'kanjo.nagashino': { name: '長篠の感状', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.kanjo' },
  'kanjo.iga': { name: '伊賀越えの感状', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.kanjo' },
  'kanjo.komaki': { name: '長久手の感状', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.kanjo' },
  'kanjo.sekigahara': { name: '関ヶ原の陣羽織', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.jinbaori' },
  'kanjo.dojo': { name: '道場破りの木刀', kind: '品', marks: { strength: 2 }, art: 'keep.bokuto' },
  'kanjo.bandits': { name: '山賊討伐の礼状', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.letter' },
  // 子の節目の札で残るもの。
  childletters: { name: '子の手習い', kind: '家族', marks: { status: 1 }, art: 'family.child.letters' },
  childhands: { name: '子の手伝い', kind: '家族', marks: { money: 1 }, yearly: { store: 1 }, art: 'family.child.hands' },
  heir: { name: '跡取り', role: 'heir', kind: '家族', marks: { slow: 2, status: 1 }, art: 'family.heir' },
  branchhouse: { name: '分家', kind: '家族', marks: { slow: 1, money: 1 }, art: 'family.branch' },
  childaway: { name: '奉公に出た子', kind: '縁', marks: { status: 1, money: 1 }, art: 'family.child.away' },
  lordgrudge: { name: '殿さまの不興', kind: '重荷', marks: { status: -2 }, art: 'burden.lordgrudge' },
  goyobook: { name: '御用金の帳面', kind: '品', marks: { status: 1 }, art: 'keep.goyobook' },
  kishinbook: { name: '寄進帳の名', kind: '品', marks: { slow: 1 }, art: 'keep.kishinbook' },
  grudge: { name: '奉行の恨み', kind: '重荷', marks: { status: -2 }, art: 'burden.grudge' },
  shirk: { name: '普請逃れの噂', kind: '重荷', marks: { status: -1 }, art: 'burden.shirk' },
  nanushi: { name: '名主の役', role: 'villageHead', kind: '身分', marks: { status: 2, money: 1 }, art: 'rank.nanushi' },
  edohouse: { name: '江戸の屋敷', kind: '家', marks: { status: 1, money: 1 }, art: 'place.edo' },
  master: { name: '武芸の師', kind: '縁', marks: { strength: 2 }, art: 'bond.master' },
  disciple: { name: '弟子', kind: '縁', marks: { strength: 1, status: 1 }, art: 'bond.disciple' },
  horse: { name: '馬', kind: '持ち物', marks: { strength: 1, money: 1 }, art: 'goods.horse' },
  trade: { name: '市の商い', kind: '仕事', marks: { money: 2 }, art: 'work.trade', yearly: { store: 1 } },
  storehouse: { name: '蔵', kind: '家', marks: { money: 2 }, art: 'place.storehouse', guard: ['dis.fire', 'dis.flood'] },
  newfield: { name: '新田', role: 'field', kind: '田', marks: { money: 1, slow: 1 }, stacks: true, art: 'place.newfield', levels: [
    { name: '新田', yearly: { store: 1 }, guard: [], art: 'place.newfield.lv1' },
    { name: '刈敷を入れた田', yearly: { store: 2 }, guard: [], art: 'place.newfield.lv2' },
    { name: '塩水選と正条植えの田', yearly: { store: 3 }, guard: [], art: 'place.newfield.lv3' },
  ], pastLv3: ['soil'] },
  pond: { name: 'ため池', role: 'building', kind: '田', marks: { slow: 1 }, art: 'place.pond', guard: ['dis.famine', 'dis.flood'] },
  well: { name: '井戸', role: 'building', kind: '家', marks: { slow: 1 }, art: 'place.well', levels: [
    { name: '井戸', yearly: { body: 1 }, guard: [], art: 'place.well.lv1' },
    { name: '石組みの井戸', yearly: { body: 1 }, guard: ['dis.fire'], art: 'place.well.lv2' },
    { name: '煮沸の井戸', yearly: { body: 2 }, guard: ['dis.fire', 'dis.plague'], art: 'place.well.lv3' },
  ], pastLv3: ['hygiene'] },
  shop: { name: '店', role: 'building', kind: '仕事', marks: { money: 2 }, art: 'work.shop', levels: [
    { name: '店', yearly: { store: 2 }, guard: [], art: 'work.shop.lv1' },
    { name: '品ぞろえの店', yearly: { store: 3 }, guard: [], art: 'work.shop.lv2' },
    { name: '帳面のある店', yearly: { store: 4 }, guard: [], art: 'work.shop.lv3' },
  ], pastLv3: ['numbers', 'expression'] },
  ferry: { name: '渡し舟', role: 'building', kind: '仕事', marks: { money: 2, status: 1 }, art: 'work.ferry', levels: [
    { name: '渡し舟', yearly: { store: 2 }, guard: [], art: 'work.ferry.lv1' },
    { name: '大きな舟', yearly: { store: 3 }, guard: [], art: 'work.ferry.lv2' },
    { name: '刻を決めた渡し', yearly: { store: 4 }, guard: [], art: 'work.ferry.lv3' },
  ], pastLv3: ['numbers'] },
  servant: { name: '下人', role: 'servant', kind: '家族', marks: { status: 1 }, art: 'place.servant', levels: [
    { name: '下人', yearly: { body: 1 }, guard: [], art: 'place.servant.lv1' },
    { name: '仕込んだ下人', yearly: { body: 2 }, guard: [], art: 'place.servant.lv2' },
    { name: '給金と休みを決めた奉公', yearly: { body: 2 }, guard: [], art: 'place.servant.lv3' },
  ], pastLv3: ['numbers', 'expression'] },
  debt: { name: '借金', kind: '重荷', marks: { money: -2 }, art: 'burden.debt' },
  wound: { name: '古傷', kind: '重荷', marks: { strength: -1, slow: -1 }, art: 'burden.wound' },
  tea: { name: '茶の湯', kind: '暮らし', marks: { slow: 1, status: 1 }, art: 'life.tea' },
  garden: { name: '庭', kind: '暮らし', marks: { slow: 1 }, art: 'life.garden' },
  hermitage: { name: '庵', kind: '家', marks: { slow: 2 }, art: 'place.hermitage' },
  'past.memory': { name: '前世の記憶', kind: '前世', marks: {}, art: 'past.teacher' },
};

// 品の届く範囲。1 家と村（書かない品はこれ）、2 城下（岡崎）、3 国（三河・徳川の家中）、4 天下と後世。点は範囲ごとに scopeWeight 倍で数える（2026-11-03、Claude 下書き）
const SCOPES = ['家と村', '城下', '国', '天下と後世'];
const SCOPE_OF = {
  2: ['citygossip', 'reading', 'childletters', 'childaway', 'nanushi', 'goyobook', 'tea', 'master', 'disciple', 'horse', 'trade', 'storehouse', 'shop', 'ferry', 'kanjo.dojo', 'kanjo.bandits', 'sidewife', 'mistress', 'affair'],
  3: ['kanjo.anegawa', 'kanjo.mikatagahara', 'kanjo.nagashino', 'kanjo.iga', 'kanjo.komaki', 'kanjo.sekigahara', 'edohouse'],
};
for (const [scope, ids] of Object.entries(SCOPE_OF)) for (const id of ids) FIELD[id].scope = Number(scope);
// 身分の段: 足軽は城下、侍と侍大将は家中（国）
FIELD.rank.levels.forEach((level, i) => { level.scope = [2, 3, 3][i]; });
// スローライフの品は代で段を数える。届く範囲は家と村のままなので、点は等倍
const RUNG_OF = { 2: ['grownchild', 'heir', 'branchhouse'] };
for (const [rung, ids] of Object.entries(RUNG_OF)) for (const id of ids) FIELD[id].rung = Number(rung);

const START_FIELD = ['ie', 'neighborhouse', 'nanushiHouse', 'mother', 'house', 'father', 'paddy', 'neighbors', 'sister', 'zori', 'imagawa', 'spring'];

const body = (amount = 1) => ({ type: 'spend', what: 'body', amount });
const riskBody = (amount = 1) => ({ type: 'risk', what: 'body', amount });
const store = (amount = 1) => ({ type: 'spend', what: 'store', amount });
const riskStore = (amount = 1) => ({ type: 'risk', what: 'store', amount });
const spend = (what) => ({ type: 'spend', what });
const risk = (what) => ({ type: 'risk', what });
const lock = (what, years) => ({ type: 'lock', what, years });

// 暮らしの場面（静かな年に一度ずつ出て、二択にせず流す。2026-11-03 orange「静かな一年など、ローマでブラッシュアップした型が三河にあらわれてない」。Claude 下書き）
// 推測（未確認）: 岡崎の市の立つ日、嫁入りの石打ちの習い、百姓の前髪落とし（元服）の作法、三河の検地の年（豊臣の検地は 1590 年代）。三河の一向宗の寺（本證寺・上宮寺・勝鬘寺）は史実。家康の鷹狩り好きは史実
const VIGNETTES = [
  ['life.taue', [7, 75], '田植え唄', '早乙女が並んで苗を植える。唄に合わせて、足を抜いては差す。'],
  ['life.mochi', [7, 75], '正月の餅つき', '暮れに餅をつき、年神様に供える。子らは臼のまわりで、つまみ食いを狙う。'],
  ['life.bon', [7, 75], '盆の迎え火', '七月、門口で麻幹を焚いて先祖を迎える。夜は村じゅうで踊った。'],
  ['life.hoonko', [7, 75], '寺の報恩講', '冬、一向宗の寺に村の者が集まる。念仏のあとに、みなで汁と飯をいただく。'],
  ['life.ichi', [10, 75], '六斎市', '月に六度、城下に市が立つ。塩と鉄の鍋を買い、帰りに噂を持ち帰る。'],
  ['life.kaji', [7, 40], '村の鍛冶屋', '鍛冶屋の火の前で、鎌が赤く焼かれては打たれる。子らは飽きずに眺めた。'],
  ['life.chinju', [7, 75], '鎮守の祭り', '秋、村の鎮守の祭り。幟が立ち、若い衆が神輿をかついで田の畦を練り歩く。'],
  ['life.amagoi', [10, 75], '雨乞い', '日照りが続き、村じゅうで山の上に火を焚いて雨を乞うた。'],
  ['life.taka', [10, 75], '殿さまの鷹狩り', '殿さまが鷹狩りに来た。村の者は勢子として野を追い立てた。'],
  ['life.teppo', [12, 60], 'はじめて見る鉄砲', '城下で、鉄砲の試し撃ちを見た。雷のような音に、みな耳をふさいだ。'],
  ['life.nengu', [15, 75], '年貢の納め', '秋、俵を担いで名主の家へ運ぶ。升で量られるのを、息をつめて見守った。'],
  ['life.gyoretsu', [12, 75], '出陣の行列', '殿さまの軍勢が村の外れを通る。旗指物が、どこまでも続いた。'],
  ['life.yomeiri', [15, 40], '隣家の嫁入り', '夕暮れ、提灯を連ねて嫁が来た。村の若い衆は、冷やかしに石を投げる真似をした。'],
  ['life.maegami', [14, 17], '前髪を落とす', '大人になったしるしに、前髪を落とした。'],
  ['life.kenchi', [40, 75], '検地', '役人が来て、田を縄で測っていった。この帳面で、年貢が決まる。', { needs: ['paddy'] }],
  ['life.ohaka', [20, 75], '父の墓参り', '盆に、父の墓に水をかけ、線香を立てた。', { lacks: ['father', 'oldfather'] }],
];

const CARDS = [
  // ── 子供（7〜14）。掛け金は小さい
  { id: 'child.seedling', frame: 'path', ages: [7, 9], title: '春の手伝い', story: '田植えの支度が始まった。今日はどちらを手伝おうか。', art: 'scene.spring.village',
    left: { title: '苗を運ぶ', art: 'choice.seedling', stake: body(), odds: 4, win: { text: '足腰が強くなり、田の仕事を覚えた。', maxBody: 1, add: ['waterwise'] }, lose: { text: '転んで苗を散らした。父に叱られた。' } },
    right: { title: '妹の手を引く', art: 'choice.sister', stake: risk('zori'), odds: 5, win: { text: '妹が笑い、母に礼を言われた。', add: ['sisterpromise'] }, lose: { text: 'ぬかるみで草履をなくした。母に叱られた。', add: ['barefoot'], body: -1 } } },
  { id: 'child.waterway', frame: 'path', ages: [7, 10], title: '水路のほとり', story: '水路に小魚が集まっている。父は田の水を見ている。', art: 'scene.irrigation',
    left: { title: '父のそばで水を見る', art: 'choice.water.father', stake: body(), odds: 5, win: { text: '水の流れと田の様子を覚えた。', add: ['waterwise'] }, lose: { text: '水音を聞くうちに、眠ってしまった。' } },
    right: { title: '魚をすくって遊ぶ', art: 'choice.fish', stake: risk('zori'), odds: 4, win: { text: '近所の子と遊び、魚を一匹持ち帰った。', add: ['friend'] }, lose: { text: '草履を流された。母に叱られた。', add: ['barefoot'], body: -1 } } },
  { id: 'child.harvest', frame: 'path', ages: [8, 11], title: '稲刈りの日', story: '穂が色づき、村の人たちが田へ出ている。', art: 'scene.harvest',
    left: { title: '束を運ぶ', art: 'choice.rice', stake: body(), odds: 5, win: { text: '重い束を運び、体が慣れてきた。', maxBody: 1, add: ['strongbody'] }, lose: { text: '束を落として、腰を痛めた。' } },
    right: { title: '幼い子を見守る', art: 'choice.children', stake: body(), odds: 5, win: { text: '里の人が安心して刈り取りに戻れた。', add: ['villagetrust'] }, lose: { text: '子が泣きやまず、日が暮れた。' } } },
  { id: 'child.hearth', frame: 'path', ages: [8, 12], title: '囲炉裏の夜', story: '冷たい風の日。母は薪を足し、祖母は昔話を始めた。', art: 'scene.hearth',
    left: { title: '薪を割る', art: 'choice.firewood', stake: body(), odds: 5, win: { text: '腕に力がつき、家の薪が増えた。', maxBody: 1, store: 1 }, lose: { text: '斧で手を切った。' } },
    right: { title: '夜更けまで話を聞く', art: 'choice.grandmother', stake: body(), odds: 5, win: { text: '隣村の道と、昔の水争いを知った。', add: ['oldtales'] }, lose: { text: '話の途中で眠ってしまった。' } } },
  { id: 'child.neighbor', frame: 'path', ages: [10, 13], title: '里の頼まれごと', story: '隣の家から、畑の種まきを手伝ってほしいと頼まれた。隣の子は熱を出している。', art: 'scene.neighbor',
    left: { title: '畑を耕す', art: 'choice.garden', stake: body(), odds: 5, win: { text: '畑仕事を覚え、礼に米をもらった。', maxBody: 1, store: 1 }, lose: { text: '鍬が重くて、畝が曲がった。' } },
    right: { title: '病の子のそばにいる', art: 'choice.care', stake: riskBody(), odds: 4, win: { text: '看病を手伝い、その子と仲良くなった。', add: ['friend'] }, lose: { text: '熱がうつった。' } } },
  { id: 'child.news', frame: 'path', ages: [11, 14], title: '遠くの知らせ', story: '市から戻った人が、遠い国の戦の話をしている。', art: 'scene.news',
    left: { title: '鎌を研ぐ', art: 'choice.tools', stake: body(), odds: 5, win: { text: '鎌を研ぎ、家の道具が整った。', add: ['sickle'] }, lose: { text: '研ぎすぎて、刃をこぼした。' } },
    right: { title: '話を聞きに市へ行く', art: 'choice.news', stake: risk('zori'), odds: 4, win: { text: '城下の話を覚え、大人と話す種ができた。', add: ['citygossip'] }, lose: { text: '人混みで草履を踏まれ、なくした。母に叱られた。', add: ['barefoot'], body: -1 } } },
  { id: 'child.sumo', frame: 'path', ages: [8, 14], axis: 'strength', title: '村の相撲', story: '鎮守の森で、子供の相撲が始まった。', art: 'scene.sumo',
    left: { title: '年上に挑む', art: 'choice.sumo', stake: riskBody(), odds: 2, win: { text: '年上を投げた。村の子に一目置かれた。', add: ['sumo'] }, lose: { text: '投げ飛ばされ、肩を打った。' } },
    right: { title: '行司をする', art: 'choice.referee', stake: body(), odds: 5, win: { text: '公平な行司だと言われた。', add: ['villagetrust'] }, lose: { text: 'えこひいきだと言われた。' } } },
  { id: 'child.temple', frame: 'path', ages: [8, 13], axis: 'status', title: '寺の手習い', story: '寺の和尚が、子供に字を教えるという。', art: 'scene.temple',
    left: { title: '字を習いに通う', art: 'choice.reading', stake: body(), odds: 5, win: { text: '名前と数が書けるようになった。', add: ['reading'] }, lose: { text: '田仕事の合間で、身が入らなかった。' } },
    right: { title: '寺の掃除をして菓子をもらう', art: 'choice.sweep', stake: body(), odds: 5, win: { text: '和尚に可愛がられた。', add: ['temple'] }, lose: { text: '仏具を倒して叱られた。' } } },
  { id: 'child.festival', frame: 'path', ages: [9, 14], axis: 'love', title: '村の祭り', story: '夏祭りの夜。太鼓が鳴っている。', art: 'scene.festival',
    left: { title: '隣の家の子と踊る', art: 'choice.dance', stake: risk('zori'), odds: 4, win: { text: '手が触れて、胸が鳴った。', add: ['firstlove'] }, lose: { text: '草履の鼻緒が切れて、踊れなかった。母に叱られた。', add: ['barefoot'], body: -1 } },
    right: { title: '神輿を担ぐ', art: 'choice.mikoshi', stake: riskBody(), odds: 4, win: { text: '大人に混じって担ぎ切った。', add: ['strongbody'] }, lose: { text: '神輿の下で足を踏まれた。' } } },
  { id: 'child.coin', frame: 'path', ages: [8, 14], axis: 'money', title: '落ちていた銭', story: '道端に、穴の空いた銭が一枚落ちていた。', art: 'scene.coin',
    left: { title: '名主に届ける', art: 'choice.honest', stake: body(), odds: 5, win: { text: '名主に褒められた。', add: ['villagetrust'] }, lose: { text: '自分で拾ったのかと疑われた。' } },
    right: { title: 'こっそり貯めておく', art: 'choice.hoard', stake: body(), odds: 4, win: { text: '初めての蓄えができた。', store: 1 }, lose: { text: '母に見つかって叱られた。' } } },
  { id: 'child.newzori', frame: 'path', ages: [7, 20], repeat: true, needs: ['barefoot'], title: '新しい草履', story: '裸足で一年を過ごした。', art: 'event.zori',
    left: { title: '母に編んでもらう', art: 'choice.sister', stake: body(), odds: 5, win: { text: '母が黙って新しい草履を編んでくれた。', add: ['zori'], remove: ['barefoot'] }, lose: { text: '母は忙しくて、手が回らなかった。' } },
    right: { title: '自分で編んでみる', art: 'choice.seedling', stake: body(), odds: 3, win: { text: '不格好だが、自分の草履ができた。', add: ['zori'], remove: ['barefoot'] }, lose: { text: '藁がほどけた。まだ裸足だ。' } } },
  { id: 'child.river', frame: 'path', ages: [7, 12], axis: 'slow', title: '川で泳ぐ', story: '暑い日。村の子たちが川に飛び込んでいる。', art: 'scene.river',
    left: { title: '深みまで泳ぐ', art: 'choice.swim', stake: riskBody(2), odds: 4, win: { text: '息が長く続くようになった。', add: ['strongbody'] }, lose: { text: '溺れかけて、水をたくさん飲んだ。' } },
    right: { title: '岸で昼寝する', art: 'choice.nap', stake: body(), odds: 5, win: { text: '川の音を聞きながら、よく眠った。', add: ['riverbank'] }, lose: { text: '寝ているあいだに、日に焼けて痛んだ。' } } },

  // ── 史実（その年に必ず来る）
  { id: 'hist.okehazama', frame: 'path', year: 1560, omen: '駿河の大軍が西へ動く気配', title: '桶狭間の知らせ', story: '今川の殿さまが尾張で討たれた。岡崎の若殿が城に戻るという。', art: 'history.okehazama',
    always: { remove: ['imagawa'], add: ['matsudaira'] },
    left: { title: '城下へ行列を見に行く', art: 'choice.procession', stake: risk('zori'), odds: 5, win: { text: '若殿の行列を見た。偉い人というものを初めて見た。', add: ['citygossip'] }, lose: { text: '人に押されて草履をなくした。母に叱られた。', add: ['barefoot'], body: -1 } },
    right: { title: '村に残って田を見張る', art: 'choice.guard', stake: riskBody(), odds: 5, win: { text: '騒ぎの間も、田は無事だった。', store: 1 }, lose: { text: '雨の中で見張って熱を出した。' } } },
  { id: 'hist.ikko', frame: 'fight', year: 1563, omen: '寺と殿さまの仲が悪いという噂', title: '三河一向一揆', story: '村の寺が殿さまに逆らい、一揆が起きた。父も寺の門徒だ。', art: 'history.ikko',
    left: { title: '寺の側につく', art: 'choice.ikko.temple', stake: riskBody(2), odds: 3, win: { text: '寺は和睦にこぎつけた。門徒の仲間ができた。', add: ['temple'] }, lose: { text: '一揆は負けた。寺は焼かれ、家は責められた。', die: true } },
    right: { title: '殿さまの側につく', art: 'choice.ikko.lord', stake: risk('neighbors'), odds: 5, win: { text: '殿さまの側の勝ちだった。村役に目をかけられた。', add: ['villagetrust'] }, lose: { text: '門徒の近所と口をきかなくなった。' } } },
  { id: 'hist.genpuku', frame: 'path', year: 1565, title: '一人前', story: '十五になった。村の男として名を改める。', art: 'scene.genpuku',
    left: { title: '槍を手に取る', art: 'choice.spear', stake: riskBody(), odds: 5, win: { text: '父の古い槍を譲られた。', add: ['spear'] }, lose: { text: '稽古で足をくじいた。' } },
    right: { title: '田を一枚任される', art: 'choice.paddy', stake: risk('paddy'), odds: 5, win: { text: '任された田が実り、蓄えができた。', store: 2 }, lose: { text: '水の加減を誤り、田を荒らした。' } } },
  { id: 'hist.anegawa', frame: 'demand', year: 1570, demand: true, ignore: { substitute: true, odds: 3 }, omen: '殿さまが北近江へ兵を集めている', title: '姉川', story: '殿さまが織田の加勢で北近江へ出る。村からも足軽を出す。', art: 'history.anegawa',
    left: { title: '足軽として出陣する', art: 'choice.march', stake: riskBody(2), odds: 3, delay: 1, win: { text: '姉川で生き延び、手柄を立てて帰った。', add: ['kanjo.anegawa'], rank: 1, store: 2 }, lose: { text: '槍傷を負って帰った。', add: ['wound'] } },
    right: { title: '村に残る', art: 'choice.stay', stake: { type: 'risk', what: 'substitute' }, odds: 3, win: { text: '雇った者は無事に帰ってきた。' }, lose: { text: '雇った者は帰らなかった。' } } },
  { id: 'hist.mikatagahara', frame: 'demand', year: 1572, demand: true, ignore: { substitute: true, odds: 2 }, omen: '甲斐の武田が西へ来る', title: '三方ヶ原', story: '武田の大軍が遠江に来た。殿さまは城を出て戦うという。', art: 'history.mikatagahara',
    always: { add: ['takeda'] },
    left: { title: '戦に加わる', art: 'choice.battle', stake: riskBody(3), odds: 2, win: { text: '大敗の中を生き延び、殿さまを逃がす一団にいた。', add: ['kanjo.mikatagahara'], rank: 2 }, lose: { text: '三方ヶ原で討たれた。', die: true } },
    right: { title: '村に残る', art: 'choice.flee', stake: { type: 'risk', what: 'substitute' }, odds: 2, win: { text: '雇った者は無事に帰ってきた。' }, lose: { text: '雇った者は帰らなかった。' } } },
  { id: 'hist.nagashino', frame: 'demand', year: 1575, demand: true, ignore: { substitute: true, odds: 4 }, omen: '殿さまが鉄砲を集めているという', title: '長篠', story: '武田との決戦が近い。鉄砲足軽と、兵糧を運ぶ者を集めている。', art: 'history.nagashino',
    always: { remove: ['takeda'] },
    left: { title: '鉄砲足軽に志願する', art: 'choice.musket', stake: riskBody(2), odds: 4, win: { text: '柵の内から撃ち続け、生きて帰った。', add: ['kanjo.nagashino'], rank: 1, store: 1 }, lose: { text: '暴発で手を焼いた。', add: ['wound'] } },
    right: { title: '村に残る', art: 'choice.supply', stake: { type: 'risk', what: 'substitute' }, odds: 4, win: { text: '雇った者は無事に帰ってきた。' }, lose: { text: '雇った者は帰らなかった。' } } },
  { id: 'hist.iga', frame: 'fight', year: 1582, omen: '京で何か起きるという胸騒ぎ', title: '伊賀越え', story: '京で信長が討たれた。堺にいた殿さまが、伊賀の山を越えて逃げ帰るという。', art: 'history.iga',
    left: { title: '迎えの一団に加わる', art: 'choice.escort', stake: riskBody(2), odds: 3, win: { text: '殿さまを三河まで送り届けた。名を覚えられた。', add: ['kanjo.iga'], rank: 2 }, lose: { text: '山中で落ち武者狩りに遭い、討たれた。', die: true } },
    right: { title: '国で留守を固める', art: 'choice.defend', stake: store(1), odds: 6, win: { text: '村の守りを固め、里の者に頼られた。', add: ['villagetrust'] } } },
  { id: 'hist.komaki', frame: 'demand', year: 1584, demand: true, ignore: { substitute: true, odds: 4 }, omen: '羽柴と殿さまが睨み合っている', title: '小牧・長久手', story: '羽柴秀吉の大軍と、殿さまが尾張で睨み合う。', art: 'history.komaki',
    left: { title: '出陣する', art: 'choice.march', stake: riskBody(2), odds: 4, win: { text: '長久手の追い討ちで手柄を立てた。', add: ['kanjo.komaki'], rank: 1 }, lose: { text: '深手を負った。', add: ['wound'] } },
    right: { title: '村に残る', art: 'choice.collect', stake: { type: 'risk', what: 'substitute' }, odds: 4, win: { text: '雇った者は無事に帰ってきた。' }, lose: { text: '雇った者は帰らなかった。' } } },
  { id: 'hist.kanto', frame: 'path', year: 1590, omen: '殿さまが遠い関東へ移るという', title: '関東移封', story: '殿さまは関東へ移ることになった。家臣はついていく。百姓は残ってよい。', art: 'history.kanto',
    always: { remove: ['matsudaira'], add: ['kanto'] },
    left: { title: 'ついて関東へ行く', art: 'choice.migrate', stake: spend('kind:田'), odds: 4, win: { text: '江戸の町づくりに加わり、屋敷をもらった。', add: ['edohouse'] }, lose: { text: '関東の湿地で苦労し、里の縁も切れた。', remove: ['neighbors'] } },
    right: { title: '三河に残る', art: 'choice.remain', stake: store(1), odds: 5, win: { text: '新しい領主のもとで、三河の田を守った。', add: ['newfield'] }, lose: { text: '新しい領主の役人に、田の境を問い詰められた。' } } },
  { id: 'hist.sekigahara', frame: 'demand', year: 1600, demand: true, ignore: { substitute: true, odds: 4 }, omen: '天下が二つに割れる気配', title: '関ヶ原', story: '天下分け目の戦が来る。五十の身にも声がかかった。', art: 'history.sekigahara',
    left: { title: '老いて従軍する', art: 'choice.oldmarch', stake: riskBody(2), odds: 4, win: { text: '陣中を生き延び、若い者に語り草ができた。', add: ['kanjo.sekigahara'] }, lose: { text: '行軍で倒れた。', add: ['wound'] } },
    right: { title: '村に残る', art: 'choice.seeoff', stake: { type: 'risk', what: 'substitute' }, odds: 4, win: { text: '雇った者は無事に帰ってきた。' }, lose: { text: '雇った者は帰らなかった。' } } },
  { id: 'hist.edo', frame: 'path', year: 1603, title: '徳川の世', story: '殿さまが将軍になった。戦の世が終わるらしい。', art: 'history.edo',
    always: { remove: ['kanto'], add: ['tokugawa'] },
    left: { title: '江戸へ商いに出る', art: 'choice.edotrade', stake: store(3), odds: 3, win: { text: '江戸の普請景気に乗った。', add: ['storehouse'] }, lose: { text: '江戸の物価に負けて、蓄えを失った。' } },
    right: { title: '村で茶を楽しむ', art: 'choice.tea', stake: body(), odds: 5, win: { text: '戦の無い世の茶はうまい。', add: ['tea'] }, lose: { text: '茶葉が湿気ていた。' } } },

  // ── 災い（成人後に引かれる。何度でも）
  { id: 'dis.famine', frame: 'disaster', disaster: true, repeat: true, omen: '夏が寒い', title: '凶作', story: '冷たい夏で、稲が実らなかった。', art: 'disaster.famine',
    left: { title: '田を手放して食いつなぐ', art: 'choice.sellpaddy', stake: spend('kind:田'), odds: 6, win: { text: '田を売った金で冬を越した。', store: 2 } },
    right: { title: '体で耐える', art: 'choice.endure', stake: riskBody(2), odds: 3, win: { text: '飢えをしのいだ。' }, lose: { text: '飢えで体を壊した。' } } },
  { id: 'dis.plague', frame: 'disaster', disaster: true, repeat: true, omen: '隣村で熱病が出た', title: '流行り病', story: '村に熱病が入ってきた。', art: 'disaster.plague',
    left: { title: '家族を看病する', art: 'choice.nurse', stake: riskBody(2), odds: 3, win: { text: '家族は持ち直した。' }, lose: { text: '看病のうちに自分も倒れた。', die: true } },
    right: { title: '家族を寺に預けて離れる', art: 'choice.separate', stake: risk('kind:家族'), odds: 4, win: { text: '寺で手当てを受け、皆助かった。', add: ['temple'] }, lose: { text: '預けた家族を亡くした。' } } },
  { id: 'dis.flood', frame: 'disaster', disaster: true, repeat: true, omen: '長雨が続く', title: '大水', story: '川があふれそうだ。', art: 'disaster.flood',
    left: { title: '堤を守りに出る', art: 'choice.levee', stake: riskBody(), odds: 3, win: { text: '堤は持ちこたえた。村の者に頼られた。', add: ['villagetrust'] }, lose: { text: '流されかけて、足を傷めた。', add: ['wound'] } },
    right: { title: '米を高台へ運ぶ', art: 'choice.highground', stake: store(1), odds: 5, win: { text: '米は守れた。', store: 2 }, lose: { text: '家に水が入り、住めなくなった。', remove: ['house'] } } },
  { id: 'dis.fire', frame: 'disaster', disaster: true, repeat: true, omen: '乾いた風が続く', title: '火事', story: '隣の家から火が出た。', art: 'disaster.fire',
    left: { title: '火を消しに走る', art: 'choice.firefight', stake: riskBody(), odds: 4, win: { text: '火は隣で止まった。', add: ['villagetrust'] }, lose: { text: '火傷を負った。', add: ['wound'] } },
    right: { title: '家財を持ち出す', art: 'choice.rescue', stake: risk('kind:家'), odds: 2, win: { text: '家は焼けずに済んだ。', store: 1 }, lose: { text: '家は焼け落ちた。' } } },

  // ── 家族の節目
  { id: 'fam.sister', frame: 'family', ages: [17, 22], needs: ['sister'], title: '妹の嫁入り', story: '妹が隣村へ嫁ぐことになった。', art: 'scene.wedding.sister',
    always: { remove: ['sister'], add: ['inlaw'] },
    left: { title: '持参金を出す', art: 'choice.dowry', stake: store(2), odds: 6, win: { text: '妹は胸を張って嫁いだ。隣村に縁ができた。', add: ['villagetrust'] } },
    right: { title: '祝いの席で歌う', art: 'choice.sing', stake: body(), odds: 4, win: { text: '歌がうまいと評判になった。', add: ['lover.neighbor'] }, lose: { text: '声が裏返って、笑われた。' } } },
  { id: 'fam.father', frame: 'family', ages: [28, 42], needsAny: ['father', 'oldfather'], title: '父の最期', story: '父が床についた。もう長くないという。', art: 'scene.father.end',
    always: { remove: ['father', 'oldfather'] },
    left: { title: 'そばで看取る', art: 'choice.watch', stake: lock('kind:田', 1), odds: 6, win: { text: '父は田の話をして逝った。', add: ['oldtales'] } },
    right: { title: '父の分まで働く', art: 'choice.work', stake: body(2), odds: 6, win: { text: '葬式の費えを稼いだ。', store: 2 } } },
  { id: 'ie.succession', frame: 'family', family: true, ages: [28, 75], title: '跡目争い', story: '縁者が家の跡目を求めた。', art: 'scene.family', contest: 'succession',
    left: { title: '跡取りを後押しする', art: 'choice.enlist', odds: 3, win: { text: '跡目を守り、相手は分家した。' }, lose: { text: '相手が跡目を継ぎ、こちらは分家した。' } },
    right: { title: '相手を跡取りに替える', art: 'choice.cultivate', odds: 6, win: { text: '相手を跡取りに替えた。' } } },
  { id: 'fam.mother', frame: 'family', ages: [33, 50], needs: ['mother'], title: '母の最期', story: '母が床につき、静かに息を引き取った。', art: 'scene.mother.end',
    always: { remove: ['mother'] },
    left: { title: '寺に供養を頼む', art: 'choice.memorial', stake: store(2), odds: 6, win: { text: '立派な供養をした。', add: ['temple'] } },
    right: { title: '母の好きな花を植える', art: 'choice.flowers', stake: body(), odds: 6, win: { text: '庭に母の花が咲いた。', add: ['garden'] } } },

  // ── ステータス
  { id: 'st.ashigaru', frame: 'path', ages: [16, 30], axis: 'status', lacks: ['ashigaru'], title: '足軽の募集', story: '殿さまが足軽を集めている。', art: 'scene.recruit',
    left: { title: '足軽になる', art: 'choice.enlist', stake: riskBody(2), odds: 4, win: { text: '足軽の身分を得た。', rank: 1 }, lose: { text: '稽古で体を痛め、帰された。' } },
    right: { title: '田を広げる', art: 'choice.expand', stake: body(2), odds: 4, win: { text: '荒れ地を起こし、新田にした。', add: ['newfield'] }, lose: { text: '石だらけで、田にならなかった。' } } },
  { id: 'st.retainer', frame: 'path', ages: [20, 40], axis: 'status', needs: ['feat'], lacks: ['favor'], title: '取り立ての話', story: '手柄を聞いた侍が、家来にならぬかと言う。', art: 'scene.retainer',
    left: { title: '家来になる', art: 'choice.retainer', stake: spend('kind:田'), odds: 4, win: { text: '田を返し、殿さまの家中に入った。侍に取り立てられた。', rank: 2 }, lose: { text: '話は流れ、田だけ失った。' } },
    right: { title: '手柄を元手に新田を開く', art: 'choice.till', stake: riskBody(2), odds: 4, win: { text: '褒美の銭で荒れ地を開き、新田ができた。', add: ['newfield'] }, lose: { text: '石だらけで、田にならなかった。' } } },
  { id: 'ie.water', frame: 'demand', ages: [15, 75], repeat: true, demand: true, needs: ['neighborhouse'], title: '水論', story: '水路の分け前をめぐり、隣の家と争いになった。', art: 'scene.irrigation', contest: 'water', ignore: { label: '水を譲る。田の段が一つ下がる', effect: { text: '水を譲り、田の段が一つ下がった。', levelDown: 'paddy' } },
    left: { title: '水利を争う', art: 'choice.water', odds: 3, win: { text: '水利の札を得て、隣の家の力が落ちた。' }, lose: { text: '争いに敗れ、田の段が一つ下がった。' } },
    right: { title: '水を譲る', art: 'choice.water', odds: 6, win: { text: '水を譲った。' } } },
  { id: 'ie.boundary', frame: 'demand', ages: [18, 75], repeat: true, demand: true, needs: ['neighborhouse'], title: '境界の争い', story: '畦の境をめぐり、隣の家が田を広げようとしている。', art: 'scene.neighbor', contest: 'boundary', ignore: { label: '境を譲る。田を一枚失う', effect: { text: '境を譲り、田を一枚失った。', remove: ['paddy'] } },
    left: { title: '境界を争う', art: 'choice.enlist', odds: 3, win: { text: '隣の田を取り、新田を得た。' }, lose: { text: '境界を失い、田を一枚失った。' } },
    right: { title: '境を譲る', art: 'choice.cultivate', odds: 6, win: { text: '境を譲った。' } } },
  { id: 'ie.nanushi', frame: 'family', family: true, ages: [30, 75], axis: 'status', needs: ['villagetrust', 'nanushiHouse'], lacks: ['nanushi'], title: '名主の座', story: '名主の座が空き、里の信頼を得た家が候補に挙がった。', art: 'scene.nanushi', contest: 'patron',
    left: { title: '名主の座を争う', art: 'choice.enlist', odds: 3, win: { text: '名主の役を得た。' }, lose: { text: '争いに敗れ、里の信頼を失った。' } },
    right: { title: '田を守り、役を辞退する', art: 'choice.cultivate', odds: 6, win: { text: '役を辞退し、田を守った。' } } },
  { id: 'st.nanushi', frame: 'path', ages: [25, 45], axis: 'status', needs: ['villagetrust'], lacks: ['nanushi'], title: '名主の跡目', story: '名主が年老い、跡を頼みたいという。', art: 'scene.nanushi',
    left: { title: '名主を引き受ける', art: 'choice.headman', stake: store(2), odds: 4, win: { text: '村をまとめる役に就いた。', add: ['nanushi'], shift: { 'lo.arranged': -2 } }, lose: { text: '反対の家が多く、話がまとまらなかった。' } },
    right: { title: '若い者に譲る', art: 'choice.yield', stake: spend('villagetrust'), odds: 5, win: { text: '肩の荷のない暮らしを選んだ。', add: ['riverbank'] }, lose: { text: '若い者に譲ったが、陰で文句を言われた。' } } },
  { id: 'st.letters', frame: 'path', ages: [16, 35], axis: 'status', lacks: ['reading'], title: '手習いの誘い', story: '寺で大人にも読み書きを教えるという。', art: 'scene.letters',
    left: { title: '読み書きを習う', art: 'choice.study', stake: store(1), odds: 5, win: { text: '証文が読めるようになった。', add: ['reading'] }, lose: { text: '仕事が忙しく、続かなかった。' } },
    right: { title: '畑を広げる', art: 'choice.expand', stake: body(2), odds: 4, win: { text: '新田を起こした。', add: ['newfield'] }, lose: { text: '腰を痛めた。' } } },
  { id: 'st.gift', frame: 'demand', ages: [25, 50], axis: 'status', needs: ['favor'], demand: true, ignore: { label: '奉行ににらまれる', effect: { text: '付け届けの催促を放っておき、奉行ににらまれた。', add: ['grudge'] } }, title: '付け届けの催促', story: '奉行の使いが、付け届けを催促しに来た。', art: 'scene.bribe',
    left: { title: '付け届けをする', art: 'choice.bribe', stake: store(3), odds: 3, win: { text: '代官の役に取り立てられた。', add: ['nanushi'] }, lose: { text: '贈り物だけ取られた。' } },
    right: { title: '同じ銭を市の商いに回す', art: 'choice.market', stake: riskStore(3), odds: 4, win: { text: '商いが当たり、銭が増えて戻った。', store: 6 }, lose: { text: '荷が売れず、銭は消えた。' } } },

  // ── マネー
  { id: 'mo.market', frame: 'path', ages: [16, 40], axis: 'money', lacks: ['trade'], title: '市で商う', story: '城下の市に、空いた店がある。', art: 'scene.market',
    left: { title: '田を担保に店を出す', art: 'choice.shop', stake: risk('kind:田'), odds: 3, win: { text: '商いが当たった。', add: ['trade'], store: 2 }, lose: { text: '店はつぶれ、田も取られた。', add: ['debt'] } },
    right: { title: '市の茶屋で人に会う', art: 'choice.approach', stake: store(1), odds: 4, win: { text: '茶屋で出会いがあった。', meet: true }, lose: { text: '茶代だけ払って帰った。' } } },
  { id: 'mo.horse', frame: 'path', ages: [18, 45], axis: 'money', lacks: ['horse'], title: '馬の売り物', story: '博労が良い馬を連れてきた。', art: 'scene.horse',
    left: { title: '馬を買う', art: 'choice.buyhorse', stake: store(2), odds: 5, win: { text: '馬で荷を運び、稼ぎが増えた。', add: ['horse'] }, lose: { text: '病気の馬をつかまされた。' } },
    right: { title: '祭りに寄付する', art: 'choice.donate', stake: store(1), odds: 5, win: { text: '祭りが賑わい、名が上がった。', add: ['villagetrust'] }, lose: { text: '寄付は、雨で流れた祭りに消えた。' } } },
  { id: 'mo.storehouse', frame: 'path', ages: [25, 50], axis: 'money', needs: ['trade'], lacks: ['storehouse'], title: '蔵を建てる話', story: '商いの儲けで、蔵が建てられそうだ。', art: 'scene.storehouse',
    left: { title: '蔵を建てる', art: 'choice.build', stake: store(3), odds: 4, win: { text: '白壁の蔵が建った。', add: ['storehouse'] }, lose: { text: '大工に逃げられた。' } },
    right: { title: '家族に晴れ着を買う', art: 'choice.kimono', stake: store(2), odds: 5, win: { text: '家族が喜んだ。', add: ['familyjoy'] }, lose: { text: '晴れ着は、丈が合わなかった。' } } },
  { id: 'mo.lend', frame: 'path', ages: [25, 55], axis: 'money', needs: ['storehouse'], title: '金貸しの頼み', story: '隣村の者が、米を貸してほしいと来た。', art: 'scene.lend',
    left: { title: '高い利子で貸す', art: 'choice.usury', stake: riskStore(2), odds: 3, win: { text: '利子で蔵が満ちた。', store: 5 }, lose: { text: '踏み倒された。' } },
    right: { title: '利子なしで貸す', art: 'choice.kindloan', stake: store(1), odds: 5, win: { text: '恩を感じた者が増えた。', add: ['villagetrust'] }, lose: { text: '貸した相手は、村から消えた。' } } },
  { id: 'mo.debt', frame: 'demand', ages: [16, 75], repeat: true, needs: ['debt'], demand: true, ignore: { label: '借金がふくらむ', effect: { text: '取り立てを放っておき、借金がふくらんだ。', add: ['debt'] } }, title: '借金の取り立て', story: '借金取りが来た。', art: 'scene.debt',
    left: { title: '田を渡して返す', art: 'choice.payland', stake: spend('kind:田'), odds: 6, win: { text: '借金は消えた。', remove: ['debt'] } },
    right: { title: '体で働いて返す', art: 'choice.paylabor', stake: riskBody(2), odds: 4, win: { text: '働き抜いて返した。', remove: ['debt'] }, lose: { text: '働きすぎて倒れた。' } } },

  // ── ラブ
  { id: 'lo.meet', frame: 'path', ages: [16, 50], repeat: true, axis: 'love', title: '出会い', story: '見知らぬ人と目が合った。', art: 'scene.meet',
    left: { title: '声をかける', art: 'choice.approach', stake: store(1), odds: 5, win: { text: 'また会う約束をした。', add: ['lover.river'] }, lose: { text: '相手にされなかった。' } },
    right: { title: '祭りの世話役を買って出る', art: 'choice.festival', stake: body(), odds: 5, win: { text: '祭りを仕切り、村の者に頼られた。', add: ['villagetrust'] }, lose: { text: '段取りを誤り、年寄りに叱られた。' } } },
  { id: 'lo.visit', frame: 'path', axis: 'love', ages: [16, 50], repeat: true, needsAny: ['lover.river', 'lover.teahouse', 'lover.widow', 'lover.neighbor', 'lover.traveler', 'lover.singer', 'lover.weaver'], title: '会いに行く', story: '縁を結んだ人のもとへ、足を運ぶ。', art: 'scene.visit',
    left: { title: '贈り物を持って行く', art: 'choice.approach', stake: store(1), odds: 4, win: { text: '話に花が咲き、縁が深まった。' }, lose: { text: '留守だった。' } },
    right: { title: '仕事を切り上げて行く', art: 'choice.back', stake: body(), odds: 5, win: { text: '顔を見せ、縁をつないだ。' }, lose: { text: '行き違いになった。' } } },
  { id: 'lo.marry', frame: 'family', ages: [18, 60], repeat: true, axis: 'love', needsAny: ['lover.river', 'lover.teahouse', 'lover.widow', 'lover.neighbor', 'lover.traveler', 'lover.singer', 'lover.weaver'], title: '添う相手', story: '家から、想い人か縁談の相手と添うよう話が来た。', art: 'scene.marry',
    left: { title: '想い人と添う', art: 'choice.lovematch', stake: risk('neighbors'), odds: 4, win: { text: '想い人と夫婦になった。', add: ['spouse'] }, lose: { text: '近所とは気まずくなったが、夫婦になった。', add: ['spouse'] } },
    right: { title: '縁談の相手と添う', art: 'choice.arranged', stake: store(1), odds: 6, win: { text: '縁談の相手と夫婦になった。', add: ['arrangedspouse', 'newfield'] } } },
  { id: 'lo.arranged', frame: 'family', ages: [20, 60], repeat: true, title: '縁談', story: '名主が縁談を持ってきた。', art: 'scene.arranged',
    left: { title: '受ける', art: 'choice.accept', stake: store(1), odds: 6, win: { text: '夫婦になった。', add: ['arrangedspouse'] } },
    right: { title: '断って城下へ想い人を探しに出る', art: 'choice.seek', stake: riskBody(), odds: 3, win: { text: '城下で出会いがあった。', meet: true }, lose: { text: '家の者にたしなめられ、縁談は宙に浮いた。' } } },
  { id: 'lo.concubine', frame: 'family', ages: [22, 50], repeat: true, needsAny: ['samurai', 'nanushi'], title: '側室を迎える', story: '身分のある家には、側室を迎える話が持ち上がる。', art: 'scene.concubine',
    left: { title: '側室を迎える', art: 'choice.accept', stake: store(2), odds: 4, win: { text: '側室を迎えた。', add: ['sidewife'] }, lose: { text: '家の者が反対した。' } },
    right: { title: '同じ扶持で若党を抱える', art: 'choice.hire', stake: store(2), odds: 5, win: { text: '腕の立つ若党が家に来た。', add: ['servant'] }, lose: { text: '若党は居着かなかった。' } } },
  // 妾は身分を問わず、蓄えがあれば来る。側室は身分で来る。両方あれば両方来る。どちらも毎年蓄えを食い、払えなければ離れていく。
  { id: 'lo.mistress', frame: 'family', ages: [22, 60], repeat: true, title: '妾を囲う話', story: '蓄えがあると、囲ってほしいという人が現れた。', art: 'scene.mistress',
    left: { title: '囲う', art: 'choice.accept', stake: store(2), odds: 5, win: { text: '妾を囲った。', add: ['mistress'] }, lose: { text: '噂が先に立ち、話は流れた。' } },
    right: { title: '同じ蓄えで蔵を建てる', art: 'choice.build', stake: riskStore(3), odds: 4, win: { text: '蔵が建った。', add: ['storehouse'] }, lose: { text: '大工に銭を持ち逃げされた。' } } },
  // 深まった想い人（段 2 以上）を、金で囲って固定する道。
  { id: 'lo.keeplover', frame: 'path', ages: [20, 60], repeat: true, axis: 'love', title: '想い人を囲う', story: '想い人が、そばに置いてほしいと言う。', art: 'scene.mistress',
    left: { title: '囲う', art: 'choice.accept', stake: store(2), odds: 5, win: { text: '想い人を囲った。もう通わなくてよい。', add: ['mistress'] }, lose: { text: '家の者に知られ、話は流れた。' } },
    right: { title: '囲う銭を商いに回す', art: 'choice.market', stake: riskStore(2), odds: 4, win: { text: '商いが当たった。', store: 5 }, lose: { text: '銭は戻らなかった。' } } },
  { id: 'lo.affair', frame: 'path', ages: [22, 50], repeat: true, axis: 'love', needsAny: ['spouse', 'arrangedspouse', 'sidewife'], title: '祭りの夜の誘い', story: '祭りの夜、色っぽい人に誘われた。', art: 'scene.affair',
    left: { title: '誘いに乗る', art: 'choice.affair', stake: riskStore(1), odds: settings.affairOdds, win: { text: '浮名が立った。', add: ['affair'] }, lose: { text: '正妻の実家と揉め、里に噂が立った。', add: ['rumor'], conflict: true } },
    right: { title: '夜祭の相撲に出る', art: 'choice.sumo', stake: riskBody(), odds: 4, win: { text: '大関を投げ飛ばし、村の誉れになった。', add: ['sumo', 'villagetrust'] }, lose: { text: '土俵の外まで投げ飛ばされた。' } } },
  { id: 'lo.divorce', frame: 'family', ages: [22, 60], repeat: true, title: '離縁の話', story: '浮名の揉め事が重なり、夫婦の間に溝ができた。', art: 'scene.divorce',
    left: { title: '家の者と話し合う', art: 'choice.home', stake: store(2), odds: 4, win: { text: '話をつけ、夫婦の縁を保った。', remove: ['rumor'], settle: true }, lose: { text: '話し合いはまとまらなかった。', remove: ['rumor'], settle: true } },
    right: { title: '離縁する', art: 'choice.seek', stake: riskBody(), odds: 4, win: { text: '連れ合いが去り、家は別れた。', divorce: true }, lose: { text: '離縁はひとまず思いとどまった。' } } },
  // 子の節目。生まれるのは年の締めの出来事で、札になるのは跡取りとくじで選ばれた子の七つと十五だけ。
  { id: 'ch.seven', frame: 'family', ages: [20, 75], repeat: true, title: '子の手習い', story: '子が七つになった。', art: 'scene.child.seven',
    left: { title: '寺に預けて字を習わせる', art: 'choice.temple', stake: store(1), odds: 5, win: { text: '子が字を覚えはじめた。', add: ['childletters'] }, lose: { text: '寺になじめず、戻ってきた。' } },
    right: { title: '家で田を手伝わせる', art: 'choice.rice', stake: body(), odds: 6, win: { text: '小さな手が田仕事を覚えた。', add: ['childhands'] } } },
  { id: 'ch.fifteen', frame: 'family', ages: [20, 75], repeat: true, title: '子の行く末', story: '子が十五になった。', art: 'scene.child.fifteen',
    left: { title: '田を分けて家に残す', art: 'choice.paddy', stake: store(2), odds: 5, win: { text: '田を分け、家のそばに住まわせた。', add: ['branchhouse'] }, lose: { text: '分ける田が足りず、話は先送りになった。' } },
    right: { title: '城下へ奉公に出す', art: 'choice.migrate', stake: body(), odds: 4, win: { text: '子は城下の店に奉公に出た。', sendChild: true, add: ['childaway'] }, lose: { text: '奉公先になじまず、戻ってきた。' } } },
  { id: 'lo.child', frame: 'family', ages: [19, 42], repeat: true, needsAny: ['spouse', 'arrangedspouse', 'sidewife', 'mistress'], title: '子が生まれる', story: '連れ合いが身ごもった。', art: 'scene.childbirth',
    left: { title: '盛大に祝う', art: 'choice.celebrate', stake: store(2), odds: 6, win: { text: '村中で祝った。', add: ['child', 'villagetrust'] } },
    right: { title: '静かに迎える', art: 'choice.quietbirth', stake: body(), odds: 5, win: { text: '元気な子が生まれた。', add: ['child'] }, lose: { text: 'お産は難しく、子は育たなかった。' } } },
  { id: 'lo.poem', frame: 'path', ages: [20, 50], axis: 'love', needs: ['reading'], title: '恋文', story: '読み書きができると知った人が、文をよこした。', art: 'scene.letter',
    left: { title: '返事を書く', art: 'choice.reply', stake: store(1), odds: 3, win: { text: '文のやりとりが続いた。', add: ['affair'] }, lose: { text: '文が人目に触れ、噂になった。' } },
    right: { title: '歌を学ぶ', art: 'choice.poetry', stake: store(1), odds: 5, win: { text: '茶と歌の集まりに呼ばれるようになった。', add: ['tea'] }, lose: { text: '歌の集まりで、笑われた。' } } },

  // ── スローライフ
  { id: 'sl.garden', frame: 'path', ages: [25, 55], axis: 'slow', lacks: ['garden'], title: '庭の話', story: '家の脇に、空いた土地がある。', art: 'scene.garden',
    left: { title: '花を植える', art: 'choice.plant', stake: body(), odds: 5, win: { text: '季節の花が咲く庭になった。', add: ['garden'] }, lose: { text: '花は根づかなかった。' } },
    right: { title: '田にする', art: 'choice.cultivate', stake: body(2), odds: 4, win: { text: '小さな新田になった。', add: ['newfield'] }, lose: { text: '水が来なかった。' } } },
  { id: 'sl.tea', frame: 'path', ages: [30, 60], axis: 'slow', lacks: ['tea'], title: '茶の湯の誘い', story: '寺の和尚が、茶を教えようと言う。', art: 'scene.teaschool',
    left: { title: '茶を習う', art: 'choice.learntea', stake: store(2), odds: 5, win: { text: '静かな時間を覚えた。', add: ['tea'] }, lose: { text: '作法を覚えきれなかった。' } },
    right: { title: '同じ月謝で剣術を習う', art: 'choice.apprentice', stake: store(2), odds: 4, win: { text: '道場に通い、師を得た。', add: ['master'] }, lose: { text: '稽古についていけなかった。' } } },
  { id: 'ie.retire', frame: 'family', family: true, ages: [55, 65], needsAny: ['grownchild', 'heir'], title: '家を譲る日', story: '跡取りも育ち、家を任せる頃合いになった。', art: 'scene.hermit',
    left: { title: '長子に家を譲る', art: 'choice.inherit', odds: 6, win: { text: '家を長子に譲り、隠居した。', retire: 'inherit' } },
    right: { title: '子らに田を分ける', art: 'choice.inherit', odds: 6, win: { text: '田を子らに分け、分家ができた。', retire: 'divide', houseDown: true, add: ['branchhouse'] } } },
  { id: 'sl.fishing', frame: 'path', ages: [20, 70], axis: 'slow', repeat: true, title: '釣りの朝', story: '朝もやの川。魚が跳ねた。', art: 'scene.fishing',
    left: { title: '釣りに出る', art: 'choice.fishing', stake: body(), odds: 5, win: { text: '大きな鮒が釣れた。', add: ['riverbank'] }, lose: { text: '一匹も釣れなかった。' } },
    right: { title: '仕事を片づける', art: 'choice.chores', stake: body(), odds: 5, win: { text: '仕事がはかどった。', store: 1 }, lose: { text: '仕事は片づかなかった。' } } },

  // ── ストレングス
  { id: 'sr.master', frame: 'path', ages: [16, 30], axis: 'strength', lacks: ['master'], title: '旅の武芸者', story: '村に旅の武芸者が泊まっている。', art: 'scene.swordsman',
    left: { title: '弟子入りする', art: 'choice.apprentice', stake: lock('kind:田', 2), odds: 4, delay: 2, win: { text: '二年の修行で、技を授かった。', add: ['master'] }, lose: { text: '修行についていけず、帰ってきた。' } },
    right: { title: '見物だけする', art: 'choice.watchduel', stake: body(), odds: 5, win: { text: '城下の話を聞いた。', add: ['citygossip'] }, lose: { text: '人垣で何も見えなかった。' } } },
  { id: 'sr.duel', frame: 'fight', ages: [20, 40], axis: 'strength', needs: ['master'], title: '腕試し', story: '隣国の道場が、腕自慢を募っている。', art: 'scene.dojo',
    left: { title: '道場破りに行く', art: 'choice.dojo', stake: riskBody(3), odds: 3, win: { text: '名のある使い手を破った。', add: ['kanjo.dojo'] }, lose: { text: '打ちのめされて、起き上がらなかった。', die: true } },
    right: { title: '師の型を磨く', art: 'choice.kata', stake: body(), odds: 6, win: { text: '型が体に染みた。', add: ['strongbody'] } } },
  { id: 'sr.bandits', frame: 'fight', ages: [18, 45], axis: 'strength', title: '山賊の噂', story: '峠に山賊が出るという。', art: 'scene.bandits',
    left: { title: '討伐に加わる', art: 'choice.hunt', stake: riskBody(2), odds: 3, win: { text: '山賊を追い払った。', add: ['kanjo.bandits', 'villagetrust'] }, lose: { text: '山賊の刃に倒れた。', die: true } },
    right: { title: '峠を避けて商いの道を変える', art: 'choice.market', stake: body(), odds: 5, win: { text: '遠回りの道で、かえって良い客をつかんだ。', store: 2 }, lose: { text: '遠回りがたたり、損をした。' } } },
  { id: 'sr.disciple', frame: 'path', ages: [30, 55], axis: 'strength', needs: ['master'], lacks: ['disciple'], title: '弟子入り志願', story: '若者が、技を教えてほしいと来た。', art: 'scene.disciple',
    left: { title: '弟子を取る', art: 'choice.teach', stake: store(1), odds: 5, win: { text: '弟子ができた。', add: ['disciple'] }, lose: { text: '弟子は三日で逃げた。' } },
    right: { title: '断って川辺に庵を結ぶ', art: 'choice.refuse', stake: body(), odds: 5, win: { text: '静かな暮らしを守った。', add: ['riverbank'] }, lose: { text: '川辺の庵は、大水で流された。' } } },
  { id: 'sr.train', frame: 'path', ages: [15, 40], axis: 'strength', repeat: true, title: '朝の稽古', story: '夜明け前。槍を振る時間はある。', art: 'scene.training',
    left: { title: '槍を振る', art: 'choice.drill', stake: riskBody(), odds: 4, win: { text: '体が締まった。', add: ['strongbody'] }, lose: { text: '筋を痛めた。' } },
    right: { title: '田の水を見に行く', art: 'choice.water', stake: body(), odds: 5, win: { text: '田は順調だ。', store: 1 }, lose: { text: '畦が崩れて、一日つぶれた。' } } },

  // ── 晩年
  { id: 'old.grandchild', frame: 'family', ages: [46, 70], needsAny: ['child', 'grownchild'], title: '孫', story: '子に子が生まれた。', art: 'scene.grandchild',
    left: { title: '孫と遊ぶ', art: 'choice.play', stake: body(), odds: 6, win: { text: '孫が懐いた。', add: ['familyjoy'] } },
    right: { title: '孫に昔話をする', art: 'choice.tell', stake: store(1), odds: 6, win: { text: '戦の世の話を、孫は目を丸くして聞いた。', add: ['oldtales'] } } },
  { id: 'old.pilgrimage', frame: 'path', axis: 'slow', ages: [50, 70], title: '伊勢参り', story: '村の講で、伊勢参りに行くという。', art: 'scene.ise',
    left: { title: '参る', art: 'choice.pilgrim', stake: riskBody(2), odds: 4, win: { text: '伊勢の海を見た。', add: ['riverbank'] }, lose: { text: '旅の途中で倒れた。' } },
    right: { title: '村に残って講を仕切る', art: 'choice.organize', stake: store(1), odds: 5, win: { text: '講の世話役として慕われた。', add: ['villagetrust'] }, lose: { text: '講の銭勘定が合わず、責められた。' } } },
  { id: 'old.will', frame: 'family', ages: [55, 75], title: '遺言', story: '先のことを考える年になった。', art: 'scene.will',
    left: { title: '財を子らに分ける', art: 'choice.inherit', stake: store(3), odds: 6, win: { text: '子らは揉めずに済んだ。', add: ['familyjoy'] } },
    right: { title: '寺に寄進する', art: 'choice.offering', stake: store(3), odds: 6, win: { text: '寺に名が残った。', add: ['temple', 'villagetrust'] } } },
  { id: 'old.back', frame: 'recovery', ages: [48, 75], repeat: true, title: '腰の痛み', story: '朝、腰が伸びない。', art: 'scene.backpain',
    left: { title: '高い薬を買う', art: 'choice.medicine', stake: store(2), odds: 5, win: { text: '薬が効いた。', body: 2 }, lose: { text: '効かなかった。' } },
    right: { title: '我慢して働く', art: 'choice.bearit', stake: riskBody(), odds: 3, win: { text: 'なんとかなった。', store: 1 }, lose: { text: '寝込んだ。' } } },

  // 求める札: 片側に来て、もう片側はその年のくじの札。もう片側を選ぶと ignore が起きる。
  { id: 'dm.fushin', frame: 'demand', ages: [16, 60], repeat: true, demand: true, ignore: { label: '里の信頼を失う', effect: { text: '普請に出ず、陰口をたたかれた。', remove: ['villagetrust'], add: ['shirk'] } }, title: '村の普請', story: '堤の普請に、家ごとに人足を出せと言われた。', art: 'scene.fushin',
    left: { title: '人足に出る', art: 'choice.work', stake: body(2), odds: 6, win: { text: '堤の普請に出た。村の者に頼られた。', add: ['villagetrust'] } },
    right: { title: 'その年のくじの札', art: 'choice.skip', stake: store(1), odds: 5, win: { text: '' }, lose: { text: '' } } },
  { id: 'dm.goyokin', frame: 'demand', ages: [20, 60], repeat: true, needsAny: ['ashigaru', 'nanushi', 'storehouse', 'shop'], demand: true, ignore: { label: '殿さまの不興を買う', effect: { text: '御用金を出し渋り、殿さまに疎まれた。', add: ['lordgrudge'] } }, title: '御用金', story: '殿さまの戦支度に、御用金を納めよとのお達しが来た。', art: 'scene.goyokin',
    left: { title: '御用金を納める', art: 'choice.pay', stake: store(3), odds: 6, win: { text: '御用金を納めた。帳面に名が載った。', add: ['goyobook'] } },
    right: { title: 'その年のくじの札', art: 'choice.skip', stake: store(1), odds: 5, win: { text: '' }, lose: { text: '' } } },
  { id: 'dm.temple', frame: 'demand', ages: [20, 70], repeat: true, needs: ['temple'], demand: true, ignore: { label: '寺の縁を失う', effect: { text: '寄進の頼みを聞き流し、寺の縁が遠のいた。', remove: ['temple'] } }, title: '寺の寄進', story: '寺の和尚が、本堂の修繕に寄進を頼みに来た。', art: 'scene.kishin',
    left: { title: '寄進する', art: 'choice.memorial', stake: store(2), odds: 6, win: { text: '寄進帳に名が残った。', add: ['kishinbook'] } },
    right: { title: 'その年のくじの札', art: 'choice.skip', stake: store(1), odds: 5, win: { text: '' }, lose: { text: '' } } },
  { id: 'dm.inlaw', frame: 'demand', ages: [22, 60], repeat: true, needsAny: ['spouse', 'arrangedspouse'], demand: true, ignore: { label: '正妻の実家と揉める', effect: { text: '無心を断り、正妻の実家と揉めた。', conflict: true } }, title: '実家の無心', story: '連れ合いの実家から、銭を工面してほしいと頼まれた。', art: 'scene.inlaw',
    left: { title: '無心に応じる', art: 'choice.pay', stake: store(2), odds: 6, win: { text: '実家に銭を送った。連れ合いが喜んだ。', add: ['familyjoy'] } },
    right: { title: 'その年のくじの札', art: 'choice.skip', stake: store(1), odds: 5, win: { text: '' }, lose: { text: '' } } },
  // ── 回復
  // 回復の手（湯治・薬売り・任せて休む）はローマ（浴場 1 枚）より多い。湯治や薬売りが村まで来る時代の性格として、わざと違えている（2026-11-04 orange 了承）。
  { id: 'rec.hotspring', frame: 'recovery', ages: [20, 75], repeat: true, tired: true, title: '湯治の誘い', story: '山の湯に浸かれば、体の痛みが抜けるという。', art: 'scene.hotspring',
    left: { title: '湯治に行く', art: 'choice.hotspring', stake: store(2), odds: 6, win: { text: '湯に浸かり、体が軽くなった。', body: 3 } },
    right: { title: '働き続ける', art: 'choice.work', stake: body(), odds: 5, win: { text: '休まず働き、蓄えが増えた。', store: 2 }, lose: { text: '無理がたたって寝込んだ。' } } },
  { id: 'rec.delegate', frame: 'recovery', ages: [30, 75], repeat: true, tired: true, needs: ['grownchild'], title: '仕事を任せる', story: '育った子が、田を見ると言っている。', art: 'scene.delegate',
    left: { title: '子に任せて休む', art: 'choice.delegate', stake: lock('grownchild', 2), odds: 6, win: { text: '子に田を任せ、体を休めた。', body: 3 } },
    right: { title: '自分でやる', art: 'choice.work', stake: body(), odds: 6, win: { text: '田は自分の手で守った。', store: 1 } } },
  { id: 'rec.medicine', frame: 'recovery', ages: [15, 75], repeat: true, tired: true, title: '薬売り', story: '旅の薬売りが村に来た。', art: 'scene.medicine',
    left: { title: '自分の薬を買う', art: 'choice.medicine', stake: store(), odds: 4, win: { text: '薬が効き、体が軽くなった。', body: 2 }, lose: { text: '効かなかった。' } },
    right: { title: '薬に頼らず働く', art: 'choice.work', stake: body(), odds: 6, win: { text: '薬に頼らず働いた。', store: 1 } } },

  // ── 建てる・磨く
  { id: 'build.newfield', frame: 'build', ages: [16, 60], repeat: true, max: { fieldId: 'newfield', count: 3 }, title: '荒れ地', story: '村はずれに、誰も手を付けない荒れ地がある。', art: 'scene.market',
    left: { title: '開いて新田にする', art: 'choice.till', cost: { body: 2, store: 1 }, odds: 4, win: { text: '石を除け、新田が開けた。', add: ['newfield'] }, lose: { text: '石が多く、開ききれなかった。' } },
    right: { title: '荒れ地に庵を結ぶ', art: 'choice.hermit', cost: { body: 1 }, odds: 5, win: { text: '小さな庵ができた。静かな場所が一つ増えた。', add: ['hermitage'] }, lose: { text: '雨で庵が流れた。' } } },
  { id: 'build.pond', frame: 'build', ages: [18, 60], repeat: true, needs: ['kind:田'], lacks: ['pond'], title: 'ため池の話', story: '日照りの年に備えて、ため池を掘ろうという話が出た。', art: 'place.pond',
    left: { title: 'ため池を掘る', art: 'choice.till', cost: { body: 2, store: 2 }, odds: 4, win: { text: 'ため池ができた。', add: ['pond'] }, lose: { text: '水が溜まらなかった。' } },
    right: { title: '村の普請に人足を出す', art: 'choice.attend', cost: { body: 1 }, odds: 5, win: { text: '普請を手伝い、頼られた。', add: ['villagetrust'] }, lose: { text: '土を運んで腰を痛めた。' } } },
  { id: 'build.well', frame: 'build', ages: [15, 60], repeat: true, lacks: ['well'], title: '井戸の話', story: '川まで水を汲みに行くのが毎日の仕事だ。', art: 'place.well',
    left: { title: '井戸を掘る', art: 'choice.till', cost: { store: 2 }, odds: 4, win: { text: '井戸から水が出た。', add: ['well'] }, lose: { text: '掘っても水が出なかった。' } },
    right: { title: '川へ汲みに通う', art: 'choice.water', cost: { body: 1 }, odds: 6, win: { text: '水汲みで足腰が強くなった。', add: ['strongbody'] } } },
  { id: 'build.shop', frame: 'build', ages: [20, 60], repeat: true, needs: ['trade'], lacks: ['shop'], title: '店を構える話', story: '市の隅に、空いた店がある。', art: 'work.shop',
    left: { title: '田を担保に店を構える', art: 'choice.market', cost: { store: 8 }, stake: risk('kind:田'), odds: 4, win: { text: '店を構えた。', add: ['shop'] }, lose: { text: '店は続かず、担保の田を取られた。' } },
    right: { title: '行商で城下に顔を売る', art: 'choice.market', cost: { body: 1 }, odds: 5, win: { text: '城下で名を覚えられた。', add: ['citygossip'], store: 1 }, lose: { text: '売れ残った。' } } },
  { id: 'build.ferry', frame: 'build', ages: [20, 60], repeat: true, needs: ['villagetrust'], lacks: ['ferry'], title: '渡しの話', story: '川の渡しを任せる者を、村が探している。', art: 'work.ferry',
    left: { title: '渡し舟を出す', art: 'choice.market', cost: { store: 8 }, stake: spend('villagetrust'), odds: 5, win: { text: '渡しを任された。', add: ['ferry'] }, lose: { text: '舟が流された。' } },
    right: { title: '渡し場の用心棒をする', art: 'choice.guard', cost: { body: 1 }, odds: 4, win: { text: '荒くれを追い払い、腕を認められた。', add: ['strongbody'] }, lose: { text: '殴られて寝込んだ。' } } },
  { id: 'build.servant', frame: 'build', ages: [25, 70], repeat: true, lacks: ['servant'], title: '奉公人', story: '食い扶持に困った若者が、置いてくれと頼みに来た。', art: 'place.servant',
    left: { title: '下人として抱える', art: 'choice.hire', cost: { store: 3 }, odds: 6, win: { text: '働き手が増えた。', add: ['servant'] } },
    right: { title: '寺に口をきいてやる', art: 'choice.temple', cost: { body: 1 }, odds: 6, win: { text: '若者は寺男になり、和尚に礼を言われた。', add: ['temple', 'villagetrust'] } } },
  // ── 静かな年（大きな年のあと、引ける札が無い年）
  { id: 'q.season', frame: 'quiet', quiet: true, repeat: true, ages: [7, 75], title: '静かな一年', story: '大きなことのない一年だった。', art: 'scene.quiet',
    left: { title: '田を耕す', art: 'choice.till', stake: body(), odds: 6, win: { text: '米が少し余った。', store: 1 } },
    right: { title: '家でくつろぐ', art: 'choice.rest', stake: store(1), odds: 6, win: { text: '体が休まった。', body: 2 } } },
  { id: 'q.neighbors', frame: 'quiet', quiet: true, repeat: true, ages: [15, 75], title: '寄り合い', story: '村の寄り合いがある。', art: 'scene.meeting',
    left: { title: '顔を出す', art: 'choice.attend', stake: body(), odds: 6, win: { text: '村の話がまとまった。', add: ['villagetrust'] } },
    right: { title: '休んで川へ行く', art: 'choice.skip', stake: body(), odds: 6, win: { text: '気持ちよく昼寝した。', body: 2 } } },
  ...VIGNETTES.map(([id, ages, title, text, extra = {}]) => ({ id, frame: 'quiet', quiet: true, ages, title, story: text, art: 'scene.quiet', ...extra,
    left: { title, art: 'choice.rest', odds: 6, win: { text } }, right: { title, art: 'choice.rest', odds: 6, win: { text } } })),
];

// 梯子の上の段の札（2026-11-03 orange「三河に型を当てはめて」「書いて」。Claude 下書き。史実で裏を取っていないところは「推測」）。
// 上の段の札は、その軸で一つ下の段以上の品を持っていると来る。右は別の軸の、一つ下の段（国）の品を取りに行く
Object.assign(FIELD, {
  founderline: { name: '家譜に載った家の祖', kind: '品', marks: { status: 3 }, scope: 4, art: 'rank.taisho' },
  namedrecord: { name: '家中の記録に残った名', kind: '品', marks: { status: 3 }, scope: 4, art: 'rank.taisho' },
  goyosho: { name: '城の御用の鑑札', kind: '仕事', marks: { money: 2 }, scope: 3, art: 'place.shop' },
  fortune: { name: '語り草の身代', kind: '品', marks: { money: 3 }, scope: 4, art: 'place.storehouse' },
  famedlove: { name: '国に聞こえた恋', kind: '縁', marks: { love: 2 }, scope: 3, art: 'bond.lover' },
  famedblade: { name: '国に聞こえた剣', kind: '品', marks: { strength: 2 }, scope: 3, art: 'keep.spear' },
  songlove: { name: '唄に残った恋', kind: '品', marks: { love: 3 }, scope: 4, art: 'bond.lover' },
  heirwed: { name: '跡取りの縁組', kind: '家族', marks: { slow: 1 }, rung: 3, art: 'family.child' },
  grandchild: { name: '孫', kind: '家族', marks: {}, rung: 3, stacks: true, art: 'family.child' },
  inkyo: { name: '隠居所', kind: '家', marks: { slow: 1 }, rung: 3, art: 'place.hermitage' },
  ancestor: { name: '語り継がれるご先祖', kind: '品', marks: { slow: 3 }, rung: 4, art: 'place.house' },
  meiyu: { name: '名の残る武勇', kind: '品', marks: { strength: 3 }, scope: 4, art: 'keep.spear' },
  ryuha: { name: '名の残る流派', kind: '品', marks: { strength: 3 }, scope: 4, art: 'keep.spear' },
});
// その段の札が来る条件: 挙げた軸のどれかで、一つ下の段以上の品を持っている
const ladderNeeds = (axes, rung) => Object.entries(FIELD).filter(([, f]) => axes.some((axis) => (f.marks?.[axis] || 0) > 0) && (f.rung ?? f.scope ?? 1) >= rung - 1).map(([id]) => id);
const RUNG_AGES = { 3: [25, 65], 4: [35, 75] };
const rungCard = (id, axis, rung, rest) => ({ id, frame: 'path', ages: RUNG_AGES[rung], axis, needsAny: ladderNeeds([axis], rung), ...rest });
CARDS.push(
  // ステータス・天下に名を残す。旗本の家の系譜は、のちに幕府が家譜にまとめた（寛政重修諸家譜、史実）。推測: 百姓の出がどこまで旗本に取り立てられたかは未確認
  rungCard('st.hatamoto', 'status', 4, { title: '旗本の取り立て', story: '殿さまが、手柄のあった者を直の家来に取り立てるという。家を興せば、その名は家譜に残る。', art: 'rank.taisho',
    left: { title: '家を興すと願い出る', art: 'choice.rhetoric', stake: store(5), odds: 2, win: { text: '直の家来に取り立てられた。家の祖として、名が家譜に載った。', add: ['founderline'] }, lose: { text: '名家の次男に席を取られた。' } },
    right: { title: '取り立てを断り、槍で名を上げる', art: 'choice.march', stake: riskBody(2), odds: 3, win: { text: '次の戦で槍を振るい、国じゅうに名が聞こえた。', add: ['famedblade'] }, lose: { text: '槍傷を負って帰った。', add: ['wound'] } } }),
  // 家中の古老が戦と手柄を書き残した例は大久保忠教の『三河物語』（史実）。推測: 書かれた時期は 1620 年ごろで、この一生の晩年より後かもしれない
  rungCard('st.record', 'status', 4, { title: '家中の記録', story: '家中の古老が、これまでの戦と手柄を書き留めているという。', art: 'scene.letters',
    left: { title: '手柄を語って書き留めてもらう', art: 'choice.rhetoric', stake: body(), odds: 2, win: { text: '古老の記録に、名が書き込まれた。', add: ['namedrecord'] }, lose: { text: '古老は、名家の手柄だけを書いた。' } },
    right: { title: '同じ縁で城の御用を願い出る', art: 'choice.market', stake: store(3), odds: 3, win: { text: '城の御用を任された。', add: ['goyosho'] }, lose: { text: '御用は、ほかの商人に回った。' } } }),
  // マネー・国の御用商人
  rungCard('mo.goyo', 'money', 3, { title: '城の御用', story: '城が、米や塩を納める商人を探している。', art: 'scene.market',
    left: { title: '城の御用を引き受ける', art: 'choice.shop', stake: store(3), odds: 3, win: { text: '城の御用の鑑札をもらった。', add: ['goyosho'] }, lose: { text: '納めた米が湿っていて、叱られた。' } },
    right: { title: '城の奥の女中に文を通わせる', art: 'choice.letter', stake: body(), odds: 3, win: { text: '文の行き来が、国じゅうの噂になった。', add: ['famedlove'] }, lose: { text: '文は奥の役人に見つかった。' } } }),
  // マネー・語り草の豪商。家康の御用を務めた京の呉服商は茶屋四郎次郎（史実）
  rungCard('mo.chaya', 'money', 4, { title: '京の呉服', story: '京の呉服商が、殿さまの御用を務めて大きな身代を築いたという。', art: 'scene.market',
    left: { title: '京へ上って呉服を扱う', art: 'choice.shop', stake: store(5), odds: 2, win: { text: '京で店を構え、その身代は語り草になった。', add: ['fortune'] }, lose: { text: '京の商人に、仕入れの銭を騙し取られた。', add: ['debt'] } },
    right: { title: '京の娘と恋に落ちる', art: 'choice.letter', stake: body(), odds: 3, win: { text: '京の娘を連れて帰った。国じゅうの噂になった。', add: ['famedlove'] }, lose: { text: '娘は、京を離れなかった。' } } }),
  // 川を開いて舟を通し富を築いたのは角倉了以（史実、京・1600 年代）。推測: 三河の村の者がこの規模の普請に関われたかは未確認
  rungCard('mo.river', 'money', 4, { title: '川の開削', story: '川を掘り広げて舟を通せば、荷の運び賃で大きな富になるという。', art: 'scene.flood',
    left: { title: '川を開いて舟を通す', art: 'choice.build', stake: store(5), odds: 2, win: { text: '舟が通るようになり、運び賃の富は語り草になった。', add: ['fortune'] }, lose: { text: '大水で掘った川が埋まった。', add: ['debt'] } },
    right: { title: '江戸の町割りの普請を請け負う', art: 'choice.build', stake: store(3), odds: 3, win: { text: '江戸に屋敷を構えた。', add: ['edohouse'] }, lose: { text: '普請の銭が足りなくなった。' } } }),
  // ラブ・国に聞こえた恋
  rungCard('lo.castle', 'love', 3, { title: '城下の祭り', story: '城下の祭りで、城の奥に仕える娘と目が合った。', art: 'scene.festival',
    left: { title: '文を通わせる', art: 'choice.letter', stake: body(), odds: 3, win: { text: '二人の恋は、国じゅうに聞こえた。', add: ['famedlove'] }, lose: { text: '娘は、奥へ戻ったきりだった。' } },
    right: { title: '娘の伝手で城の御用を得る', art: 'choice.shop', stake: store(3), odds: 3, win: { text: '城の御用の鑑札をもらった。', add: ['goyosho'] }, lose: { text: '伝手は、途中で切れた。' } } }),
  rungCard('lo.elope', 'love', 3, { title: '許されない縁', story: '想う相手の家が、縁組を許さない。', art: 'bond.lover',
    left: { title: '手を取って村を出る', art: 'choice.march', stake: riskBody(2), odds: 3, win: { text: '二人で隣の国へ逃れた。その話は国じゅうに聞こえた。', add: ['famedlove'] }, lose: { text: '追手に連れ戻された。', add: ['wound'] } },
    right: { title: '恋敵と果たし合う', art: 'choice.dojo', stake: riskBody(2), odds: 3, win: { text: '恋敵を打ち負かした。その腕は国じゅうに聞こえた。', add: ['famedblade'] }, lose: { text: '打ち負かされた。', add: ['wound'] } } }),
  // ラブ・唄に残る恋。瞽女や琵琶法師が物語を語り歩いたのは史実。推測: 村の恋が唄になって残った例は未確認
  rungCard('lo.ballad', 'love', 4, { title: '旅の瞽女', story: '旅の瞽女が、村に宿を借りに来た。恋の唄を探しているという。', art: 'scene.festival',
    left: { title: '二人の恋を語って聞かせる', art: 'choice.rhetoric', stake: body(), odds: 2, win: { text: '瞽女は二人の恋を唄にした。唄は国を越えて歌い継がれた。', add: ['songlove'] }, lose: { text: '瞽女は、別の恋を唄にした。' } },
    right: { title: '瞽女の唄の評判で江戸に呼ばれる', art: 'choice.march', stake: store(3), odds: 3, win: { text: '江戸の屋敷に招かれ、そのまま屋敷を構えた。', add: ['edohouse'] }, lose: { text: '江戸の話は、立ち消えになった。' } } }),
  // 小歌が流行り、恋の歌が集められたのは史実（『閑吟集』1518 年）。推測: 三河の村の盆踊りの唄に残ったかは未確認
  rungCard('lo.kouta', 'love', 4, { title: '盆踊りの小歌', story: '盆踊りで、村の若い者が新しい小歌を作っている。', art: 'scene.festival',
    left: { title: '二人の恋を小歌にしてもらう', art: 'choice.celebrate', stake: body(), odds: 2, win: { text: '小歌は村から村へ広まり、いつまでも歌われた。', add: ['songlove'] }, lose: { text: '小歌は、その夏だけで忘れられた。' } },
    right: { title: '踊りの輪で恋敵と張り合う', art: 'choice.dojo', stake: riskBody(2), odds: 3, win: { text: '恋敵を投げ飛ばした。その腕は国じゅうに聞こえた。', add: ['famedblade'] }, lose: { text: '投げ飛ばされた。', add: ['wound'] } } }),
  // スローライフ・孫の代。どちらを選んでも跡取りは縁組する（選んだ道は必ず通る。サイコロは代償を決める）。孫は年の締めに生まれる
  rungCard('sl.heirwed', 'slow', 3, { ages: [40, 70], needsAny: ['heir'], lacks: ['heirwed'], title: '跡取りの嫁取り', story: '跡取りが年頃になった。嫁を迎える話が出ている。', art: 'family.child',
    left: { title: '名主の口利きの縁談', art: 'choice.accept', stake: store(2), odds: 3, win: { text: '名主の口利きで、良い家の娘を迎えた。', add: ['heirwed', 'villagetrust'] }, lose: { text: '結納の銭が足りず、借金をして嫁を迎えた。', add: ['heirwed', 'debt'] } },
    right: { title: '跡取りの想う相手と添わせる', art: 'choice.celebrate', stake: body(), odds: 3, win: { text: '跡取りは想う相手と添った。家が明るくなった。', add: ['heirwed', 'garden'] }, lose: { text: '名主の勧めを断った形になり、村で気まずくなった。', add: ['heirwed'] } } }),
  // 家を譲って隠居するのは、跡取りがいてこそ（推測: 百姓の隠居の作法は未確認）
  rungCard('sl.inkyo', 'slow', 3, { ages: [45, 70], needsAny: ['heir'], lacks: ['inkyo'], title: '隠居の話', story: '跡取りが一人前になった。家を譲る頃合いかもしれない。', art: 'place.hermitage',
    left: { title: '家を譲って隠居する', art: 'choice.rest', stake: body(), odds: 4, win: { text: '家を跡取りに譲り、庭の隅に隠居所を建てた。', add: ['inkyo'] }, lose: { text: '跡取りが、まだ早いと言った。' } },
    right: { title: '隠居せず陣触れに応じ続ける', art: 'choice.march', stake: riskBody(2), odds: 3, win: { text: '老いてなお槍を振るい、国じゅうに名が聞こえた。', add: ['famedblade'] }, lose: { text: '槍傷を負って帰った。', add: ['wound'] } } }),
  // スローライフ・語り継がれるご先祖
  rungCard('sl.ancestor', 'slow', 4, { ages: [45, 75], needsAny: ['heir'], title: '囲炉裏の昔話', story: '子や孫が囲炉裏端で、家の昔の話をせがむ。', art: 'place.house',
    left: { title: '家の来し方を語って聞かせる', art: 'choice.rest', stake: body(), odds: 2, win: { text: '話は子から孫へ、その子へと語り継がれた。すてきなご先祖様がいたと。', add: ['ancestor'] }, lose: { text: '子も孫も、途中で眠ってしまった。' } },
    right: { title: '蓄えを城の御用に回す', art: 'choice.shop', stake: store(3), odds: 3, win: { text: '城の御用の鑑札をもらった。', add: ['goyosho'] }, lose: { text: '御用は、ほかの家に回った。' } } }),
  // 新田を開いた者が村の開発の祖として祀られた例はある（推測: 三河のどの村かは未確認。新田開発が盛んになるのは江戸初期）
  rungCard('sl.kaihatsu', 'slow', 4, { ages: [40, 75], needsAny: ['heirwed', 'grandchild', 'inkyo'], title: '新田の祖', story: '村の者が、川向こうの荒れ地を田にしたいと相談に来た。', art: 'scene.flood',
    left: { title: '村の者を率いて新田を開く', art: 'choice.build', stake: body(2), odds: 2, win: { text: '新田が開け、村は家の名を祖として祀った。すてきなご先祖様がいたと。', add: ['ancestor'] }, lose: { text: '大水で、開いた田が流された。' } },
    right: { title: '江戸の普請に人を出す', art: 'choice.build', stake: store(3), odds: 3, win: { text: '普請の功で、江戸に屋敷を構えた。', add: ['edohouse'] }, lose: { text: '普請の銭が足りなくなった。' } } }),
  // ストレングス・天下に名が残る。一番槍の手柄は感状に書かれ、本多忠勝のように武勇が語り継がれた（史実）
  rungCard('sr.vanguard', 'strength', 4, { title: '一番槍', story: '大きな戦が始まる。先陣で一番に槍を合わせた者の名は、長く語られる。', art: 'scene.battle',
    left: { title: '一番槍をつける', art: 'choice.march', stake: riskBody(3), odds: 2, win: { text: '一番槍の名乗りを上げた。その武勇は天下に語り継がれた。', add: ['meiyu'] }, lose: { text: '槍を合わせる前に、矢を受けた。', add: ['wound'] } },
    right: { title: '手柄を殿に申し上げ、家中に入る', art: 'choice.rhetoric', stake: body(), odds: 3, win: { text: '殿の目にとまり、家中の侍に取り立てられた。', rank: 2 }, lose: { text: '殿は、振り向かなかった。' } } }),
  // 流派を開いた剣の使い手は塚原卜伝や上泉信綱（史実）
  rungCard('sr.kengo', 'strength', 4, { title: '流派を名乗る', story: '腕を磨いた末に、自分の剣の型ができた。名を付ければ、流派になる。', art: 'scene.dojo',
    left: { title: '流派を名乗って諸国を回る', art: 'choice.dojo', stake: riskBody(2), odds: 2, win: { text: '諸国の道場を破り、流派の名は後の世まで残った。', add: ['ryuha'] }, lose: { text: '名のある使い手に敗れた。', add: ['wound'] } },
    right: { title: '型を城下の商人の子らに教える', art: 'choice.teach', stake: body(), odds: 3, win: { text: '商人たちの伝手で、城の御用を任された。', add: ['goyosho'] }, lose: { text: '弟子は、すぐにやめていった。' } } }),
);

export const CHILDHOOD = [
  { year: 1550, age: 0, title: '生まれた', story: '三河の農村、田の多い村の家に生まれた。前の世の記憶は、まだ眠っている。', cards: ['house'], art: 'event.birth.mikawa' },
  { year: 1551, age: 1, title: '父の背', story: '父は田に出て、夕方に戻る。', cards: ['mother', 'father', 'paddy'], art: 'event.father.field' },
  { year: 1552, age: 2, title: '村の顔', story: '隣の家の人たちが、よく顔を見に来る。', cards: ['neighbors'], art: 'event.neighbors' },
  { year: 1553, age: 3, title: '妹が生まれた', story: '家に小さな声が増えた。', cards: ['sister'], art: 'event.sister.birth' },
  { year: 1554, age: 4, title: 'はじめての草履', story: '父が草履を編んでくれた。', cards: ['zori'], art: 'event.zori' },
  { year: 1555, age: 5, title: '遠い城の話', story: '岡崎の殿さまは、駿河の今川のもとにいるという。', cards: ['imagawa'], art: 'history.imagawa.rule' },
  { year: 1556, age: 6, title: '季節を覚える', story: '田植え、稲刈り、囲炉裏。一年のめぐりが分かってきた。', cards: ['spring'], art: 'event.seasons' },
];

// 家の格ときょうだいの割合は未確認（推測）。幼い年に出せる人数に絞る。
export const BIRTH = {
  houses: [
    { id: 'plain', weight: 2 },
    { id: 'modest', weight: 1, houseLevel: 2, houseStore: 3, patch: { 1: { prepend: '家は少し暮らしに余裕がある。瓦屋根で、蔵には蓄えがある。' } } },
    { id: 'poor', weight: 1, add: ['debt'], patch: { 1: { prepend: '家の暮らしは苦しい。父は借金を抱えている。' } } },
  ],
  siblingModel: {
    born: [1, 2, 3, 3, 2, 1], elderShare: 0.5, deathRate: 0.4, youngerAges: [2, 4, 6], replaceAge: 3, elderAge: 3,
    plainEvent: { title: 'ひとりで歩く', story: '田のあぜまで、ひとりで歩いて行けるようになった。', cards: [], art: 'event.walk' },
    elderStory: '上には、{list}いる。', only: 'きょうだいは、いない。', birthLines: { 妹: '妹が生まれた。' },
    recallLines: {
      both: '思い返せば、この六年で弟妹が{born}生まれ、きょうだいのうち{lost}が育たなかった。',
      born: '思い返せば、この六年で弟妹が{born}生まれた。',
      lost: '思い返せば、この六年で、きょうだいのうち{lost}が育たなかった。',
    },
  },
};

export const FAMILY_OMENS = { 'fam.father': '父が咳をするようになった', 'fam.mother': '母が少し弱ってきた', 'fam.sister': '妹に縁談の話が来た', 'ie.succession': '跡目を求める縁者がいる', 'ie.retire': '跡取りに家を譲る頃合いだ', 'lo.arranged': '縁談の噂が立っている', 'lo.marry': '想い人との縁談が立っている', 'lo.divorce': '離縁の話が出ている', 'lo.child': '家に新しい命が宿った' };

const FAMILY_AGES = { 'fam.father': [28, 42], 'fam.mother': [33, 50], 'fam.sister': [17, 22], 'ie.succession': [28, 75], 'ie.retire': [55, 65], 'lo.arranged': [20, 30], 'lo.marry': [18, 60], 'lo.divorce': [22, 60] };
const INITIAL_FAMILY_EVENTS = ['fam.father', 'fam.mother', 'fam.sister', 'lo.arranged'];
const KINSHIP_RELATIVES = ['兄', '弟', '異母兄弟', '叔父', '叔母の婿', '甥', '姪', 'いとこ'];
const DISASTER_TARGETS = { fire: ['house', 'shop'], flood: ['paddy', 'newfield', 'ferry'], famine: ['paddy', 'newfield'] };
const TEXT = {
  houseNames: { own: '{name}{layer}', neighbor: '隣の{name}{layer}', branch: '{rel}の{name}分家', patron: '名主の{name}{layer}' },
  spouseLabel: '連れ合い（{name}）',
  diedOfIt: 'それがもとで、助からなかった。',
  substitutes: { father: '父が「わしが行く」と言い出した。', grownchild: '子が「わたしが行きます」と言い出した。', fatherDemand: '父が「わしが行く」と', grownchildDemand: '子が「わたしが行きます」と', childChoice: '子の申し出を受ける', fatherChoice: '父の申し出を受ける', servantChoice: '下人を出す', hireChoice: '人を雇って出す', noneChoice: '誰も出さない', call: '陣', noOne: '臆病者の噂が立つ', noOneResult: '陣触れに誰も出さず、臆病者の噂が立った。', hireResult: '人を雇って陣に出した。', result: '{name}は{outcome}', ignoreResult: '陣触れには{name}が代わりに出た。{outcome}', returned: '無事に帰ってきた。', lost: '帰らなかった。' },
  contest: { lostField: '田', surrender: '{rel}に跡目を譲り、分家に出た。{result}', splitField: '田を分けてもらった。', littleField: '田はわずかしか残らなかった。', inherited: '{rel}を跡取りに替えた。{loss}', titleLoss: '家格を失った。', noField: '{rel}を退けたが、田と家格を失った。' },
  succession: { title: '跡目争い', selfStory: '父の葬儀を終えた翌年、{rel}が跡目を求めた。', story: '{rel}が跡目を求めた。', fight: '{rel}と跡目を争う', surrender: '{rel}に跡目を譲り、分家に出る', replace: '{rel}を跡取りに替える', noteSurrender: '{rel}に跡目を譲って分家に出た', noteWin: '{rel}と跡目を争って家を継いだ', noteLose: '{rel}と跡目を争い、田を失いながら家を継いだ' },
  yearEnd: '今年の実り：',
  maintenanceTitle: '{target}をよくする話', maintenanceStory: '{target}を、もう一段よくできそうだ。',
  partingTitle: '疎遠になった縁', partingChoice: '会わないまま三年が過ぎた', partingArt: 'bond.parting', partingText: 'とは疎遠になった。思い出の品が残った。',
  familyShift: { fatherDeath: ['父の具合が持ち直した。', '父がめっきり老け込んだ。'], motherDeath: ['母の顔色が少し良くなった。', '母が床に伏せる日が増えた。'], sisterMarriage: ['妹の縁談が先に延びた。', '妹の縁談が早まりそうだ。'], arrangedMarriage: ['縁談の話が遠のいた。', '縁談の話が近づいてきた。'], partnerMarriage: ['添う話が先に延びた。', '添う話が近づいてきた。'], divorce: ['夫婦の溝が少し埋まった。', '夫婦の溝が深まった。'], birth: ['子はまだ授からない。', '子を授かる兆しがある。'] },
  grandchildBorn: '跡取りに子が生まれた。孫だ。',
  childSpared: 'まだ子どもだったので、命までは取られなかった。',
  kinArrive: '{rel}の{name}が顔を見せに来た。',
  namedTitle: '{name}、生まれる',
  named: '{name}と名づけられた。',
  introduce: { mother: '母は{name}。', father: '父は{name}。', sister: '妹は{name}。', 兄: '兄は{name}。' },
  lifeRoles: { general: '三河の百姓', rank2: '侍', champion: '侍大将', knownVillageHead: '殿さまに名を覚えられた名主', villageHead: '名主', storehouse: '蔵持ち', merchant: '商人', rank1: '足軽', martial: '武芸者', hermit: '庵の主' },
  lifeTitles: { status: '名の通った', money: '富を築いた', love: '浮名を流した', slow: '穏やかに暮らした', strength: '腕の立つ', loveless: '恋に縁のなかった', celebratedLove: '浮名を流した', kantoPrefix: '関東へ渡った', plain: '名もなき' },
  houseEnding: { heading: '家の行く末：', inherited: '長子に譲った', divided: '子らに分けた', rival: 'と跡目を争い、家は二つに割れた', defended: 'と跡目を争い、跡取りが家を守った', ended: '当主の代で終えた', heir: '跡取り', yes: 'あり', no: 'なし' },
};
const CARD_RULES = {
  'lo.meet': 'partnerMeet', 'lo.visit': 'partnerVisit', 'lo.marry': 'partnerMarriage', 'lo.arranged': 'arrangedMarriage',
  'lo.concubine': 'concubine', 'lo.mistress': 'mistress', 'lo.keeplover': 'keepPartner', 'lo.divorce': 'divorce',
  'lo.child': 'birth', 'ch.seven': 'childSeven', 'ch.fifteen': 'childFifteen', 'fam.father': 'fatherDeath', 'fam.mother': 'motherDeath', 'fam.sister': 'sisterMarriage',
  'ie.succession': 'succession', 'ie.retire': 'retirement', 'ie.nanushi': 'villageHead', 'ie.water': 'waterFeud', 'ie.boundary': 'boundaryFeud',
  'rec.medicine': 'medicine', 'maintenance': 'maintenance', 'q.season': 'quietCard', ...Object.fromEntries(VIGNETTES.map(([id]) => [id, 'quietCard'])), 'child.newzori': 'recoveryCard',
  'hist.anegawa': 'battle', 'hist.mikatagahara': 'battle', 'hist.nagashino': 'battle', 'hist.komaki': 'battle', 'hist.sekigahara': 'battle',
};
const CARDS_WITH_RULES = CARDS.map((card) => ({ ...card, kind: card.year ? 'history' : card.disaster ? 'disaster' : card.demand ? 'demand' : card.quiet ? 'upkeep' : card.family ? 'family' : 'event', category: card.id.startsWith('lo.') ? 'relationship' : card.id.startsWith('ch.') ? 'child' : null, role: CARD_RULES[card.id] || (card.id.startsWith('lo.') ? 'relationship' : card.id.startsWith('ch.') ? 'childMilestone' : null), disasterType: card.id.startsWith('dis.') ? card.id.slice(4) : null, disasterKey: card.disaster ? card.id : null, familyAge: FAMILY_AGES[card.id] || null }));
for (const [id, field] of Object.entries(FIELD)) {
  if (id.startsWith('lover.')) field.role = 'lover';
  if (id.startsWith('kanjo.')) field.role = 'merit';
}
const CARD_IDS = Object.fromEntries(CARDS_WITH_RULES.filter((card) => card.role).map((card) => [card.role, card.id]));

const RANDOM_ABILITIES = ['numbers', 'hygiene', 'body', 'expression', 'soil'];
const ABILITY_EFFECTS = { numbers: ['mo.market', 'mo.horse', 'mo.lend', 'st.gift', 'child.coin'], hygiene: ['dis.plague', 'child.neighbor:right', 'rec.medicine:left'], body: ['child.sumo', 'sr.duel', 'sr.train', 'sr.bandits', 'hist.anegawa:left', 'hist.mikatagahara:left', 'hist.nagashino:left', 'hist.komaki:left', 'rec.hotspring:left'], expression: ['child.temple', 'st.letters', 'lo.poem', 'st.nanushi'], soil: ['child.seedling', 'child.harvest', 'dis.famine', 'dis.flood', 'sl.garden'] };
const abilityStories = {
  numbers: '数と帳面を扱い、損得を読む感覚が残っている。', hygiene: '手当てや病を遠ざける知恵が残っている。', body: '鍛え方と体の使い方を覚えている。',
  expression: '言葉や歌で人に伝える感覚が残っている。', soil: '種や土の手入れをする知恵が残っている。',
};
const GLOSSARY = {
  名主: '村の年貢や寄り合いを取りまとめる者。', 陣触れ: '殿や家中から、出陣の知らせと動員が届くこと。', 感状: '戦功を認めて出す書状。', 足軽: '武士に仕えて戦う歩兵。', 侍大将: '侍を束ねて戦場で指揮する者。',
  本百姓: '村に田畑と年貢の責任を持つ家。', 小百姓: '田畑の規模が小さい百姓。', 御用金: '殿の求めで納める臨時の金。', 人足: '普請や運搬に出る働き手。', 普請: '堤や道などを村人が共同で造ること。',
  下人: '家に住み込み、働く者。', 奉公: '家や店に仕えて働くこと。', 蔵持ち: '米や品を蓄える蔵を持つ家。', 蔵: '米や道具を保管する建物。',
  寄進: '寺社へ金や品を納めること。', 縁談: '結婚相手を家どうしで相談する話。', 側室: '正妻のほかに迎える妻。', 妾: '正妻とは別に関係を持つ女性。',
  跡目: '家や家業を継ぐ立場。', 分家: '本家から分かれて立てた家。', あぜ: '田と田を分ける細い土手。', 奉行: '殿に任じられて役目を取り仕切る者。',
};
// 型の部品のうち、わざと入れていないもの（ladder-check.mjs が理由ごと出す）
const TEMPLATE_SKIP = {};
// この舞台が使うオプションルール（一覧は ladder-check.mjs の OPTION_RULES）
const OPTION_RULES = { concubines: '戦国の村の有力者は妻のほかに側室を持てた（推測: 百姓身分でどこまでかは未確認）' };
export default { id: 'mikawa', SCOPES, TEMPLATE_SKIP, OPTION_RULES, birthYear: 1550, yearLabel: (year) => `${year}年`, glossary: GLOSSARY, display: { title: '三河の春 — 一年の札', heading: ['三河', 'の農村'] }, settings, AXES, LAYERS, SURNAMES, FIELD, START_FIELD, CARDS: CARDS_WITH_RULES, cardById: new Map(CARDS_WITH_RULES.map((card) => [card.id, card])), CARD_IDS, RANDOM_ABILITIES, ABILITY_EFFECTS, abilityStories, NAMING, specialIds: { reconsider: 'goal.reconsider', parting: 'lo.parting', maintenance: 'maintenance' }, specialRoles: { maintenance: 'maintenance' }, CHILDHOOD, BIRTH, FAMILY_OMENS, FAMILY_AGES, INITIAL_FAMILY_EVENTS, KINSHIP_RELATIVES, partnerIds: ['lover.river', 'lover.teahouse', 'lover.widow', 'lover.neighbor', 'lover.traveler', 'lover.singer', 'lover.weaver'], disasterTargets: DISASTER_TARGETS, text: TEXT };
export { settings, AXES, LAYERS, SURNAMES, FIELD, START_FIELD, CARDS_WITH_RULES as CARDS, FAMILY_AGES };
