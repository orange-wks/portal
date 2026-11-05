import { DEFAULTS } from './defaults.mjs';

// 黒死病のころのイングランドの農村。場所と年は Claude が決めた（2026-11-05、orange から一任）。札と品の文はすべて LLM の下書き。
// 調査メモ: docs/planning/2026-11-05-butai-england--wip.md。札のコメントの W1 や B3 はメモの番号。番号の無い史実は記憶で、推測として扱う。
// 場所: サフォークのウォルシャム（Walsham le Willows）。1303〜99 年の荘園記録が 255 巻残る村（メモ 1）。ベリー・セント・エドマンズの近く。村の者が 1381 年に加わった証拠は無い（B8）。
// 生まれ年: 1330 年。クレシー 16 歳、大いなる死 19 歳、労働者規制法 21 歳、子どもの疫病 31 歳、人頭税 47 歳、蜂起 51 歳。
//       農奴の子が、一度飲まれかけ（1349）、持ち上げられ（空いた畑と賃金）、押し戻され（1351 の法）、火をつける（1381）までを、一人の一生で通せる年。
// 史実のギャップ（企画書 決めた点 10）: 大いなる死は、飲まれる側と持ち上げられる側が同じ札にある。死ななければ、畑が空き、賃金が上がり、農奴の身分がゆるむ。
const settings = {
  ...DEFAULTS,
  staggeredReveal: true,
  // DEFAULTS に無い家・普請・相続の値はローマ・三河と同じ（2026-11-05、Claude。釣り合いは型の数字で取る）
  houseMight: { rank: [0, 2, 4], field: 1, fieldLevel: 1, worker: 2, trust: 1 },
  buildPrice: { 2: 8, 3: 25, 4: 60 },
  claims: { heir: 5, '嫡子': 5, '庶子': 3, '妾腹の子': 2, '養子': 3, '兄': 4, '弟': 3, '異母兄弟': 3, '叔父': 3, '甥': 2, '姪': 2, 'いとこ': 2 },
  // 英国の農民に側室の習わしは無い（教会法が許さない）。オプションルールは使わない
  maxConcubines: 0,
  expansionField: 'newfield',
  roleAliases: { heir: 'heir', villagetrust: 'villageTrust', reeve: 'villageHead', waterwise: 'waterwise', feat: 'merit' },
  rankAliases: { archer: 1, vintenar: 2 },
  // 疫病がぶり返した年は外の死が来やすい（1361〜62、1369、1375 は史実。来やすさの数字は Claude の仮置き 2026-11-05）
  dangerEras: [{ from: 1330, to: 1347, chance: 0.12 }, { from: 1348, to: 1360, chance: 0.15 }, { from: 1361, to: 1362, chance: 0.3 }, { from: 1363, to: 1368, chance: 0.15 }, { from: 1369, to: 1369, chance: 0.3 }, { from: 1370, to: 1374, chance: 0.15 }, { from: 1375, to: 1375, chance: 0.3 }, { from: 1376, to: 1405, chance: 0.12 }],
};

const AXES = {
  status: { name: 'ステータス', mark: '王冠', here: '農奴の身分を抜け、名を上げる', ladder: ['荘園の村役', 'ベリーに通る名', '国の裁きに届く名', '年代記に残る名'] },
  money: { name: 'マネー', mark: '硬貨', here: '空いた畑と羊で、身代を築く', ladder: ['村の蓄え', 'ベリーの市の商い', 'カレーへ渡る羊毛', '羊毛で建てた塔'] },
  love: { name: 'ラブ', mark: 'ハート', here: '明日死ぬかもしれないから、恋に生きる', ladder: ['村の恋', '町の浮名', '国に聞こえた恋', '唄に残る恋'] },
  slow: { name: 'スローライフ', mark: '葉', here: '生き残って、畑と家を子に渡す', ladderBy: 'generation', ladder: ['自分の家', '子の代', '孫の代', '語り継がれるご先祖'] },
  strength: { name: 'ストレングス', mark: '拳', here: '弓と腕で、海の向こうまで行く', ladder: ['村の弓場', '町の力自慢', '海の向こうの戦場', '唄に残る腕'] },
  // ローマと高昌のアートの枠を、この舞台では祈りにした。大いなる死で司祭が足りなくなり、農夫の前に聖職の道が開くのがこの時代の差（史実: 1349 年に叙階が急増。農夫がどこまでかは推測）
  faith: { name: '祈り', mark: '十字', here: 'なぜ生き残ったのかを、神に問い続ける', ladder: ['村の教会', '町の僧院', '司教の教区', '後の世に残る祈り'] },
};

const SCOPES = ['家と村', 'ベリーの町', '王国と海の向こう', '天下と後世'];
const LAYERS = { village: { name: '家', ranks: ['小屋住みの家', '畑持ちの家', '村の旧家'] } };
// 名字: レーン、ランプリー、ロブウッドは村の記録にある（W5, W15）。クランマーとホーズは札の文に実名で出すので、主人公の名字には使わない。残りは推測
const SURNAMES = ['レーン', 'ランプリー', 'ロブウッド', 'アトウェル', 'テイラー', 'スミス', 'ミラー', 'ブルック'];
// 男の名は十数種しかなく、ジョンが飛び抜けて多い（史実）。親の名でなく名付け親の名をもらうのが普通で、同じ家に兄ジョンと弟ジョンがいる例もある（史実、頻度は推測）
const NAMING = {
  male: ['ジョン', 'ウィリアム', 'ロバート', 'トマス', 'リチャード', 'ヘンリー', 'アダム', 'ロジャー', 'ウォルター', 'サイモン', 'ジェフリー', 'ニコラス'],
  female: ['アグネス', 'アリス', 'ジョーン', 'モード', 'マージェリー', 'イザベル', 'エマ', 'セシリー', 'マーガレット', 'キャサリン'],
  nameOf(ctx, who, key) {
    const { male, female } = NAMING;
    const pickFrom = (pool, tag) => pool[ctx.hash(tag) % pool.length];
    const full = (given, house = ctx.house) => `${given}・${house}`;
    const otherHouse = (tag) => { const pool = ctx.surnames.filter((name) => name !== ctx.house); return pool[ctx.hash(tag) % pool.length]; };
    // 名付け親の名をもらう。ジョンが多いよう、半分はジョンにする
    const manName = (tag) => ctx.hash(`${tag}!`) % 2 ? 'ジョン' : pickFrom(male, tag);
    const slotOf = (rel) => { const slot = key === '' || key === undefined ? Math.max(0, ctx.siblings.findIndex((sib) => sib.rel === rel)) : ctx.kinSlot(key); return slot >= 200 ? slot - 200 : slot; };
    if (who === 'father') return full(manName('father'));
    if (who === 'self') return full(manName('self'));
    if (who === 'mother') return full(pickFrom(female, 'mother'), otherHouse('motherHouse'));
    if (who === 'spouse') return full(pickFrom(female, `spouse${key}`), otherHouse(`spouseHouse${key}`));
    if (who === 'son') return full(manName(`son${key}`));
    if (who === 'daughter') return full(pickFrom(female, `daughter${key}`));
    if (['sister', '姉', '妹', '姪'].includes(who)) return full(pickFrom(female, `sister${slotOf(who === 'sister' ? '妹' : who)}`));
    return full(manName(`${who}${slotOf(who)}`));
  },
  birthLine(sex, order, name) { return `${sex === 'son' ? '男の子で' : '女の子で'}、名付け親の名をもらって${name.split('・')[0]}と呼ぶ。`; },
};

const FIELD = {
  ie: { name: '家', role: 'house', kind: '家', marks: { status: 0 }, art: 'place.house', levels: LAYERS.village.ranks.map((name, i) => ({ name, marks: { status: i }, art: `place.house.lv${i + 1}` })) },
  neighborhouse: { name: '隣の家', role: 'rivalHouse', kind: '相手の家', marks: {}, art: 'place.neighbors', levels: [1, 2, 3].map(() => ({ name: '隣の家', marks: {}, art: 'place.neighbors' })) },
  manorhouse: { name: '荘役の家', role: 'patronHouse', kind: '相手の家', marks: {}, art: 'rank.nanushi', levels: [1, 2, 3].map(() => ({ name: '荘役の家', marks: {}, art: 'rank.nanushi' })) },
  father: { name: '父', role: 'father', kind: '家族', marks: { slow: 1 }, art: 'place.father' },
  oldfather: { name: '老いた父', role: 'father', substitute: false, kind: '家族', marks: { slow: 1 }, art: 'place.father.old' },
  mother: { name: '母', role: 'mother', kind: '家族', marks: { slow: 1 }, art: 'place.mother' },
  sister: { name: '妹', role: 'sister', kind: '家族', marks: { slow: 1 }, art: 'place.sister' },
  siblings: { name: 'きょうだい', role: 'siblings', kind: '家族', marks: { slow: 1 }, art: 'place.sister' },
  kinsman: { name: '縁者', kind: '家族', marks: { slow: 1 }, art: 'place.father.old' },
  // W6: 疫病の前は一軒の半分や四分の一に住む家族が多かった。段を上げるのは、壁の向こうが空くこと
  house: { name: '一軒の四分の一', kind: '家', marks: { slow: 1 }, art: 'place.house', levels: [
    { name: '一軒の四分の一', yearly: { body: 1 }, guard: [], art: 'place.house.lv1' },
    { name: '一軒の半分', yearly: { body: 2 }, guard: [], art: 'place.house.lv2' },
    { name: '丸ごと一軒', yearly: { body: 3 }, guard: ['dis.plague'], art: 'place.house.lv3' },
  ], pastLv3: ['hygiene'] },
  // W13: ミル・フィールドが主な開放耕地。W7: 保有地の 4 分の 3 は 10 エーカー未満。泥灰と豆の輪作は推測
  strips: { name: 'ミル・フィールドの細い畑', role: 'field', primary: true, kind: '田', marks: { money: 1, slow: 1 }, art: 'place.paddy', levels: [
    { name: 'ミル・フィールドの細い畑', yearly: { store: 1 }, guard: [], art: 'place.paddy.lv1' },
    { name: '泥灰を入れた畑', yearly: { store: 2 }, guard: [], art: 'place.paddy.lv2' },
    { name: '豆を挟んで回す畑', yearly: { store: 3 }, guard: [], art: 'place.paddy.lv3' },
  ], pastLv3: ['soil'] },
  neighbors: { name: '隣近所', kind: '里の人々', marks: { slow: 1 }, art: 'place.neighbors' },
  pig: { name: 'うちの豚', kind: '持ち物', marks: {}, art: 'goods.zori' },
  nopig: { name: '豚のいない囲い', kind: '持ち物', marks: {}, art: 'goods.barefoot' },
  // 農奴の身分。売り買いの札で外せる。結婚税と賦役の札は、これがある家にだけ来る
  bondage: { name: '農奴の身分', kind: '重荷', marks: {}, art: 'burden.lordgrudge' },
  coward: { name: '腰抜けの噂', kind: '重荷', marks: { status: -2, love: -1 }, art: 'burden.coward' },
  grownchild: { name: '育った子', role: 'grownchild', kind: '家族', marks: { slow: 1, strength: 1 }, stacks: true, art: 'place.child.grown', yearly: { body: 1 } },
  inlaw: { name: '妹の嫁ぎ先', kind: '縁', marks: { slow: 1, money: 1 }, guard: ['dis.famine'], art: 'bond.inlaw' },
  arrangedspouse: { name: '連れ合い（親の決めた縁）', role: 'spouse', partnerPriority: 2, kind: '家族', marks: { slow: 2, money: 1 }, art: 'place.spouse.arranged', yearly: { body: 1 } },
  // 遠くの歴史
  edward: { name: 'フランスと戦う王', kind: '遠くの歴史', marks: {}, art: 'history.imagawa.rule' },
  emptied: { name: '名字が三十消えた村', kind: '遠くの歴史', marks: {}, art: 'disaster.plague' },
  statute: { name: '労働者規制法', kind: '遠くの歴史', marks: {}, art: 'history.tokugawa' },
  richard: { name: '少年王の国', kind: '遠くの歴史', marks: {}, art: 'history.kanto' },
  spring: { name: '春', kind: '季節', marks: {}, art: 'season.spring' },

  waterwise: { name: '共有地の放牧の権利', role: 'waterwise', kind: '知恵', marks: { money: 1 }, art: 'skill.water' },
  sisterpromise: { name: '妹との約束', kind: '縁', marks: { slow: 1 }, art: 'bond.sister' },
  friend: { name: '森番の子', kind: '縁', marks: { love: 1 }, art: 'bond.friend' },
  oldtales: { name: '大飢饉の話', kind: '知恵', marks: { slow: 1 }, art: 'skill.tales' },
  sickle: { name: '研いだ鎌', kind: '持ち物', marks: { money: 1 }, art: 'goods.sickle' },
  villagetrust: { name: '十人組の信頼', role: 'villageTrust', kind: '縁', marks: { status: 1 }, art: 'bond.village' },
  citygossip: { name: 'ベリーの噂', kind: '知恵', marks: { status: 1 }, art: 'skill.gossip' },
  strongbody: { name: '鍛えた体', kind: '体', marks: {}, ability: true, art: 'self.strong' },
  wrestling: { name: '組み打ちの腕', kind: '体', marks: { strength: 1 }, art: 'self.sumo' },
  longbow: { name: 'イチイの長弓', kind: '持ち物', marks: { strength: 1 }, art: 'goods.spear' },
  reading: { name: '読み書き', kind: '知恵', marks: { status: 1 }, art: 'skill.reading' },
  aletaster: { name: 'エールの吟味役', kind: '身分', marks: { status: 1 }, art: 'rank.nanushi' },
  temple: { name: '教会の縁', kind: '縁', marks: { faith: 1 }, art: 'bond.temple' },
  bellrope: { name: '教会の鐘の綱', kind: '持ち物', marks: { faith: 1 }, art: 'bond.temple' },
  firstlove: { name: '初恋', kind: '縁', marks: { love: 1 }, art: 'bond.firstlove' },
  bees: { name: '蜜蜂の巣', kind: '暮らし', marks: { slow: 1 }, art: 'life.riverbank' },
  // 「隠れ小屋」は前世の先読みの札からだけ来る。1349 年の札と、ぶり返しの疫病の両方に効く
  refuge: { name: '森の奥の小屋', kind: '家', marks: { slow: 1 }, guard: ['hist.death', 'dis.plague'], art: 'place.hermitage' },

  lover: { name: '想い人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover' },
  'lover.alewife': { name: 'エール売りの後家', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.teahouse' },
  'lover.shepherd': { name: '羊飼いの娘', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.river' },
  'lover.widow': { name: '畑の残された人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.widow' },
  'lover.neighbor': { name: '隣村の人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.neighbor' },
  'lover.pilgrim': { name: '巡礼の人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.traveler' },
  'lover.minstrel': { name: '旅の唄い手', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.singer' },
  'lover.spinner': { name: '糸紡ぎの人', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'bond.lover.weaver' },
  'keep.alewife': { name: 'エール屋の木の杯', kind: '品', marks: { love: 1 }, art: 'keep.teacup' },
  'keep.shepherd': { name: '羊飼いの角笛', kind: '品', marks: { love: 1 }, art: 'keep.flute' },
  'keep.widow': { name: '死んだ人の指輪', kind: '品', marks: { love: 1 }, art: 'keep.comb' },
  'keep.neighbor': { name: '隣村の人の襟巻き', kind: '品', marks: { love: 1 }, art: 'keep.tenugui' },
  'keep.pilgrim': { name: '聖地の鉛のバッジ', kind: '品', marks: { love: 1 }, art: 'keep.letters' },
  'keep.minstrel': { name: '唄い手の縦笛', kind: '品', marks: { love: 1 }, art: 'keep.fan' },
  'keep.spinner': { name: '糸紡ぎの人の紡錘', kind: '品', marks: { love: 1 }, art: 'keep.obi' },
  spouse: { name: '連れ合い', role: 'spouse', partnerName: true, partnerPriority: 1, kind: '家族', marks: { love: 2, slow: 1 }, art: 'place.spouse', yearly: { body: 1 } },
  sidewife: { name: '二人目の連れ合い', role: 'concubine', partnerPriority: 3, kind: '家族', marks: { love: 1 }, art: 'place.spouse.side', yearly: { body: 1, store: -1 } },
  mistress: { name: '内縁の人', role: 'mistress', partnerPriority: 4, kind: '縁', marks: { love: 2 }, art: 'place.mistress', yearly: { store: -1 } },
  child: { name: '子', kind: '家族', marks: { slow: 1 }, stacks: true, art: 'place.child' },
  affair: { name: '浮名', kind: '縁', marks: { love: 2 }, art: 'bond.affair' },
  rumor: { name: '荘園裁判の罰金の噂', kind: '縁', marks: { status: -1 }, art: 'bond.rumor' },
  familyjoy: { name: '家族の晴れ着', kind: '暮らし', marks: { love: 1, slow: 1 }, art: 'life.festive' },
  // 弓兵の身分は段の札 1 枚。手入れの年には上がらず、戦と取り立てで上がる。二十人長・百人長は当時の呼び名 vintenar / centenar（史実）
  rank: { name: '弓兵', role: 'rank', kind: '身分', marks: { status: 1, strength: 1 }, art: 'rank.ashigaru', noMaintain: true, levels: [
    { name: '弓兵', marks: { status: 1, strength: 1 }, art: 'rank.ashigaru' },
    { name: '二十人長', marks: { status: 3, strength: 1 }, art: 'rank.samurai' },
    { name: '百人長', marks: { status: 5, strength: 2 }, art: 'rank.taisho' }] },
  'merit.crecy': { name: 'クレシーの矢羽根', role: 'merit', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.kanjo' },
  'merit.poitiers': { name: 'ポワティエの戦利品', role: 'merit', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.kanjo' },
  'merit.france': { name: 'フランス騎行の銀の杯', role: 'merit', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.jinbaori' },
  'merit.ram': { name: '賞の雄羊の角', role: 'merit', kind: '品', marks: { strength: 2 }, art: 'keep.bokuto' },
  'merit.outlaws': { name: '無法者を討った礼状', role: 'merit', kind: '品', marks: { status: 1, strength: 1 }, art: 'keep.letter' },
  childletters: { name: '子の手習い', kind: '家族', marks: { status: 1 }, art: 'family.child.letters' },
  childhands: { name: '子の手伝い', kind: '家族', marks: { money: 1 }, yearly: { store: 1 }, art: 'family.child.hands' },
  heir: { name: '跡取り', role: 'heir', kind: '家族', marks: { slow: 2, status: 1 }, art: 'family.heir' },
  branchhouse: { name: '分けた家', kind: '家族', marks: { slow: 1, money: 1 }, art: 'family.branch' },
  childaway: { name: '町へ徒弟に出た子', kind: '縁', marks: { status: 1, money: 1 }, art: 'family.child.away' },
  lordgrudge: { name: '領主の執事のにらみ', kind: '重荷', marks: { status: -2 }, art: 'burden.lordgrudge' },
  aidroll: { name: '援助金の帳の名', kind: '品', marks: { status: 1 }, art: 'keep.goyobook' },
  chantry: { name: '祈祷の寄進の名', kind: '品', marks: { faith: 1 }, art: 'keep.kishinbook' },
  grudge: { name: '密告の恨み', kind: '重荷', marks: { status: -2 }, art: 'burden.grudge' },
  shirk: { name: '賦役逃れの札付き', kind: '重荷', marks: { status: -1 }, art: 'burden.shirk' },
  reeve: { name: '荘役', role: 'villageHead', kind: '身分', marks: { status: 2, money: 1 }, art: 'rank.nanushi' },
  charter: { name: '解放状', kind: '身分', marks: { status: 2 }, art: 'keep.letter' },
  bailiffkey: { name: '伯の執事の鍵', kind: '身分', marks: { status: 2 }, art: 'rank.samurai' },
  juror: { name: '王の判事の陪審', kind: '身分', marks: { status: 2 }, art: 'rank.samurai' },
  burnedrolls: { name: '焼いた記録の灰', kind: '品', marks: { status: 2 }, art: 'keep.kanjo' },
  chronicle: { name: '年代記に残った名', kind: '品', marks: { status: 3 }, art: 'rank.taisho' },
  brass: { name: '教会の床の真鍮板', kind: '品', marks: { status: 3 }, art: 'rank.taisho' },
  master: { name: '老いた長弓兵の師', kind: '縁', marks: { strength: 2 }, art: 'bond.master' },
  disciple: { name: '弓の弟子', kind: '縁', marks: { strength: 1, status: 1 }, art: 'bond.disciple' },
  famedbow: { name: '国に聞こえた弓', kind: '品', marks: { strength: 2 }, art: 'keep.spear' },
  whitecompany: { name: 'イタリアに残る傭兵の名', kind: '品', marks: { strength: 3 }, art: 'keep.spear' },
  greenwood: { name: '森の無法者の唄', kind: '品', marks: { strength: 3 }, art: 'keep.spear' },
  horse: { name: '荷馬', kind: '持ち物', marks: { strength: 1, money: 1 }, art: 'goods.horse' },
  sheep: { name: '羊の群れ', kind: '仕事', marks: { money: 1 }, art: 'work.trade', yearly: { store: 1 } },
  brewing: { name: 'エールの竿', kind: '仕事', marks: { money: 2 }, art: 'work.shop' },
  trade: { name: 'ベリーの市の商い', kind: '仕事', marks: { money: 2 }, art: 'work.trade', yearly: { store: 1 } },
  storehouse: { name: '石の納屋', kind: '家', marks: { money: 2 }, art: 'place.storehouse', guard: ['dis.fire', 'dis.flood'] },
  stapler: { name: 'カレーの羊毛の鑑札', kind: '仕事', marks: { money: 2 }, art: 'place.shop' },
  woolchurch: { name: '羊毛で建てた教会の塔', kind: '品', marks: { money: 3 }, art: 'place.storehouse' },
  clothname: { name: '名の通った毛織物', kind: '品', marks: { money: 3 }, art: 'place.storehouse' },
  famedlove: { name: '国に聞こえた恋', kind: '縁', marks: { love: 2 }, art: 'bond.lover' },
  songlove: { name: '唄に残った恋', kind: '品', marks: { love: 3 }, art: 'bond.lover' },
  heirwed: { name: '跡取りの縁組', kind: '家族', marks: { slow: 1 }, art: 'family.child' },
  grandchild: { name: '孫', kind: '家族', marks: {}, stacks: true, art: 'family.child' },
  // 老いた親が畑を子に渡すとき、部屋と麦の量を裁判で取り決めた（史実の maintenance agreement）
  corrody: { name: '隠居の取り決め', kind: '家', marks: { slow: 1 }, art: 'place.hermitage' },
  ancestor: { name: '語り継がれるご先祖', kind: '品', marks: { slow: 3 }, art: 'place.house' },
  newfield: { name: '死んだ家の畑', role: 'field', kind: '田', marks: { money: 1, slow: 1 }, stacks: true, art: 'place.newfield', levels: [
    { name: '死んだ家の畑', yearly: { store: 1 }, guard: [], art: 'place.newfield.lv1' },
    { name: '泥灰を入れた畑', yearly: { store: 2 }, guard: [], art: 'place.newfield.lv2' },
    { name: '豆を挟んで回す畑', yearly: { store: 3 }, guard: [], art: 'place.newfield.lv3' },
  ], pastLv3: ['soil'] },
  fishpond: { name: '魚の池', role: 'building', kind: '田', marks: { slow: 1 }, art: 'place.pond', guard: ['dis.famine', 'dis.flood'] },
  well: { name: '井戸', role: 'building', kind: '家', marks: { slow: 1 }, art: 'place.well', levels: [
    { name: '井戸', yearly: { body: 1 }, guard: [], art: 'place.well.lv1' },
    { name: '石組みの井戸', yearly: { body: 1 }, guard: ['dis.fire'], art: 'place.well.lv2' },
    { name: '湯を沸かして飲む井戸', yearly: { body: 2 }, guard: ['dis.fire'], art: 'place.well.lv3' },
  ], pastLv3: ['hygiene'] },
  shop: { name: '毛織りの店', role: 'building', kind: '仕事', marks: { money: 2 }, art: 'work.shop', levels: [
    { name: '毛織りの店', yearly: { store: 2 }, guard: [], art: 'work.shop.lv1' },
    { name: '縮絨の桶のある店', yearly: { store: 3 }, guard: [], art: 'work.shop.lv2' },
    { name: '帳面のある店', yearly: { store: 4 }, guard: [], art: 'work.shop.lv3' },
  ], pastLv3: ['numbers', 'expression'] },
  mill: { name: '風車', role: 'building', kind: '仕事', marks: { money: 2, status: 1 }, art: 'work.ferry', levels: [
    { name: '風車', yearly: { store: 2 }, guard: [], art: 'work.ferry.lv1' },
    { name: '二つ石の風車', yearly: { store: 3 }, guard: [], art: 'work.ferry.lv2' },
    { name: '量りを公にした風車', yearly: { store: 4 }, guard: [], art: 'work.ferry.lv3' },
  ], pastLv3: ['numbers'] },
  servant: { name: '雇い人', role: 'servant', kind: '家族', marks: { status: 1 }, art: 'place.servant', levels: [
    { name: '雇い人', yearly: { body: 1 }, guard: [], art: 'place.servant.lv1' },
    { name: '仕込んだ雇い人', yearly: { body: 2 }, guard: [], art: 'place.servant.lv2' },
    { name: '賃金と休みを決めた雇い人', yearly: { body: 2 }, guard: [], art: 'place.servant.lv3' },
  ], pastLv3: ['numbers', 'expression'] },
  debt: { name: '借金', kind: '重荷', marks: { money: -2 }, art: 'burden.debt' },
  wound: { name: '古傷', kind: '重荷', marks: { strength: -1, slow: -1 }, art: 'burden.wound' },
  garden: { name: '菜園', kind: '暮らし', marks: { slow: 1 }, art: 'life.garden' },
  ordained: { name: '叙階された司祭の務め', kind: '身分', marks: { faith: 2 }, art: 'bond.temple' },
  guild: { name: '聖体のギルド', kind: '縁', marks: { faith: 1, status: 1 }, art: 'bond.temple' },
  walsingham: { name: 'ウォルシンガムの巡礼の札', kind: '品', marks: { faith: 1 }, art: 'keep.letters' },
  canterbury: { name: 'カンタベリーの巡礼の札', kind: '品', marks: { faith: 2 }, art: 'keep.letters' },
  hermitage: { name: '壁に囲まれた庵', kind: '家', marks: { faith: 3 }, art: 'place.hermitage' },
  englishbible: { name: '英語で写した聖書', kind: '品', marks: { faith: 3 }, art: 'skill.reading' },
  'past.memory': { name: '前世の記憶', kind: '前世', marks: {}, art: 'past.teacher' },
};

// 品の届く範囲。1 家と村（書かない品はこれ）、2 ベリーの町、3 王国と海の向こう、4 天下と後世。点は範囲ごとに scopeWeight 倍で数える
const SCOPE_OF = {
  2: ['citygossip', 'reading', 'childletters', 'childaway', 'reeve', 'charter', 'aidroll', 'master', 'disciple', 'horse', 'trade', 'brewing', 'storehouse', 'shop', 'mill', 'merit.ram', 'merit.outlaws', 'sidewife', 'mistress', 'affair', 'guild', 'walsingham'],
  3: ['merit.crecy', 'merit.poitiers', 'merit.france', 'bailiffkey', 'juror', 'burnedrolls', 'famedbow', 'stapler', 'famedlove', 'ordained', 'canterbury'],
  4: ['chronicle', 'brass', 'whitecompany', 'greenwood', 'woolchurch', 'clothname', 'songlove', 'hermitage', 'englishbible'],
};
for (const [scope, ids] of Object.entries(SCOPE_OF)) for (const id of ids) FIELD[id].scope = Number(scope);
// 身分の段: 弓兵は町、二十人長と百人長は海の向こう
FIELD.rank.levels.forEach((level, i) => { level.scope = [2, 3, 3][i]; });
// スローライフの品は代で段を数える。届く範囲は家と村のままなので、点は等倍
const RUNG_OF = { 2: ['grownchild', 'heir', 'branchhouse'], 3: ['heirwed', 'grandchild', 'corrody'], 4: ['ancestor'] };
for (const [rung, ids] of Object.entries(RUNG_OF)) for (const id of ids) FIELD[id].rung = Number(rung);

const START_FIELD = ['ie', 'neighborhouse', 'manorhouse', 'mother', 'house', 'father', 'strips', 'neighbors', 'sister', 'pig', 'edward', 'spring'];
const LOVERS = ['lover.alewife', 'lover.shepherd', 'lover.widow', 'lover.neighbor', 'lover.pilgrim', 'lover.minstrel', 'lover.spinner'];

const body = (amount = 1) => ({ type: 'spend', what: 'body', amount });
const riskBody = (amount = 1) => ({ type: 'risk', what: 'body', amount });
const store = (amount = 1) => ({ type: 'spend', what: 'store', amount });
const riskStore = (amount = 1) => ({ type: 'risk', what: 'store', amount });
const spend = (what) => ({ type: 'spend', what });
const risk = (what) => ({ type: 'risk', what });
const lock = (what, years) => ({ type: 'lock', what, years });
const SUB = { type: 'risk', what: 'substitute' };
// 求める札の右は、その年のくじの札に差し替わる
const LOTTERY = { title: 'その年のくじの札', art: 'choice.skip', stake: store(1), odds: 5, win: { text: '' }, lose: { text: '' } };

// 暮らしの場面（静かな年に一度ずつ流れる）。Y はメモ 5 の祭り。番号の無い細部は推測
const VIGNETTES = [
  ['life.plough', [7, 75], '鋤の月曜', '公現祭のあとの月曜、若者が鋤を引いて家々を回る。金を出さない家の前は、鋤で掘り返される。'],
  ['life.rogation', [7, 75], '境を歩く', '昇天祭の前、司祭を先頭に村の境を歩く。境の石のところで、子どもは頭を打ちつけられる。一生忘れないように。'],
  ['life.mayday', [10, 40], '五月の朝', '夜明け前に若い者が森へ入り、枝を抱えて帰ってくる。何人かは、昼まで帰ってこない。'],
  ['life.harvest', [10, 75], '収穫の終わり', '最後の一束を刈り、車に載せて歌いながら帰る。領主の納屋の前で、肉とエールが出る。この日だけは。'],
  ['life.michaelmas', [15, 75], '聖ミカエル祭', '九月の末、地代の日。銀貨に鶏に卵にからす麦。執事は鶏を持ち上げて重さを見る。'],
  ['life.martinmas', [7, 75], '豚をつぶす日', '十一月、冬を越せない家畜をつぶす。子らは膀胱をふくらませて蹴って遊ぶ。'],
  ['life.mill', [10, 75], '粉屋の親指', 'メルネミアの道を通って、領主の粉挽き場へ行く。粉屋は「黄金の親指」で量る、と村では言う。'],
  ['life.court', [15, 75], '荘園裁判の日', '三週間に一度の裁判。誰の豚が誰の麦を食ったか、誰の娘が誰の子を産んだか、全部が羊皮紙に書かれる。'],
  ['life.ale', [15, 75], 'エールの竿', '村の女がエールを仕込むと、家の前に竿を出す。今週はあの家だ。みなの足がそちらへ向く。'],
  ['life.churchale', [10, 75], '教会のエール', '教会の屋根を直す金を集めるため、墓地のそばで大きな樽を開ける。飲むことが信仰になる日だ。'],
  ['life.doom', [7, 75], '審判の絵', '教会の壁に、死人が墓から起き上がる絵がある。地獄の口に入っていくのは、なぜかいつも粉屋だ。'],
  ['life.friar', [12, 75], '托鉢の修道士', '裸足の修道士が来て、死の話をして、卵を持っていった。'],
  ['life.shear', [12, 75], '羊の毛刈り', '六月、小川で羊を洗い、二日乾かして刈る。脂で手が柔らかくなる、一年で唯一の日。'],
  // Y4: ベリーの聖体の祝日は行列、山車、競技で、周りの村からも人が来る
  ['life.corpus', [12, 75], 'ベリーの聖体の祝日', '六月、歩いてベリーへ行く。ギルドの行列のあとを山車が進む。町の者は僧院の悪口を、祭りの日だけ大声で言う。'],
  // Y1: 女が男を捕まえ、身代金を教会へ。記録の多くは後の時代
  ['life.hock', [14, 60], 'ホックの月曜', '復活祭の次の次の月曜、女たちが綱を持って道に立つ。捕まった男は銀貨を払って放してもらう。教会の屋根代だ。翌日は逆になる。'],
  // M2: どの町も聖霊降臨祭までに足かせを作れ
  ['life.stocks', [21, 60], '村の足かせ', '法の言うとおり、聖霊降臨祭までに足かせを作った。大工は、自分の足で穴の大きさを確かめた。', { years: [1351, 1365] }],
  // W6: 東の端とクランマー・グリーンから人が移った
  ['life.eastend', [20, 60], '東の端の空き家', 'イースト・エンドから、また一家が移っていった。壁で四つに仕切った家に、今は猫しかいない。', { years: [1350, 1375] }],
  // W12: ハイ・ホールは 1379 年に本荘へ吸収
  ['life.highhall', [40, 75], 'ハイ・ホールの終わり', '村の二つ目の領主の裁判がなくなった。ハイ・ホールは本荘に呑まれたという。罰金の行き先が一つ減っただけだ。', { years: [1379, 1388] }],
  // M3: 銭の賃金は上がったが物価も上がった
  ['life.prices', [20, 75], '倍の日当', '日当は倍になった。鉄も塩も靴も倍になった。計算が合わないと皆が言っている。', { years: [1352, 1370] }],
  ['life.christmas', [7, 75], '十二日の休み', '降誕祭から十二日、鋤は動かない。領主の館で薪を一本ずつもらう。太いものを選ぶのが腕だ。'],
  ['life.graves', [20, 75], '新しい墓地', 'あの春に掘った場所は、もう草で見えない。歩くと、土が少しだけ柔らかい。', { years: [1350, 1405], needs: ['emptied'] }],
  ['life.emptyhouse', [20, 60], '崩れた家', '村のはずれの家は屋根が落ちた。誰の家だったか、もう子どもは知らない。', { years: [1352, 1390], needs: ['emptied'] }],
  ['life.flagellant', [19, 40], '鞭打つ人々', '海の向こうから来た男たちが、背中を裂きながらロンドンを歩いたという。村の者は、見たくもあり見たくもなかった。', { years: [1349, 1352] }],
  // F3: 刈り入れの食事は大麦パンとベーコンから、小麦パンと牛肉とエールへ
  ['life.newwage', [25, 75], '刈り入れの昼', '領主の出す昼が、小麦のパンと牛肉になった。祖母の代は大麦パンとベーコンの端だった。誰も礼を言わない。人手が足りないから出ているのだ。', { years: [1370, 1405] }],
  ['life.ohaka', [20, 75], '父のために', '万霊節の夜、父の名を司祭に告げ、蝋燭を一本立てた。', { lacks: ['father', 'oldfather'] }],
];

const CARDS = [
  // ── 子供（7〜14）。掛け金は小さい
  { id: 'child.geese', frame: 'path', ages: [7, 9], title: 'がちょう番', story: '七つになると、共有地のがちょうを預けられる。狐はだいたい夕方に来る。', art: 'scene.spring.village',
    left: { title: '棒を持って狐を追う', art: 'choice.seedling', stake: body(), odds: 4, win: { text: '狐は逃げた。がちょうも逃げたが、夕方には全部帰ってきた。', maxBody: 1, add: ['strongbody'] }, lose: { text: 'がちょうに追われた。村の子たちは一週間そのことを話した。' } },
    right: { title: '妹に数の数え方を教える', art: 'choice.sister', stake: body(), odds: 5, win: { text: '二人で数えると、がちょうは十一羽だった。妹は「ぜんぶ名前がある」と言った。', add: ['sisterpromise'] }, lose: { text: '十まで数えたところで、一羽足りないことに気づいた。' } } },
  { id: 'child.pannage', frame: 'path', ages: [7, 10], title: 'どんぐりの森', story: '秋、豚を森へ連れていく。森番に一匹いくら払えば、どんぐりは食べ放題だ。', art: 'scene.irrigation',
    left: { title: '森の奥まで連れて行く', art: 'choice.fish', stake: risk('pig'), odds: 4, win: { text: '奥は実が多かった。森番の子に会い、罠の見方を教わった。', add: ['friend'] }, lose: { text: '豚が走った。夜まで探しても帰ってこなかった。父は何も言わなかった。それが一番つらかった。', add: ['nopig'], body: -1 } },
    right: { title: '森の端で薪を拾う', art: 'choice.firewood', stake: body(), odds: 5, win: { text: '落ちた枝なら領主も文句を言わない。冬の薪が増えた。', maxBody: 1, store: 1 }, lose: { text: '生えている枝を折ったところを森番に見られた。' } } },
  { id: 'child.glean', frame: 'path', ages: [8, 11], title: '落ち穂拾い', story: '刈り入れが終わり、教会の鐘が鳴った。これから日暮れまで、子どもと年寄りは落ちた穂を拾っていい。', art: 'scene.harvest',
    left: { title: '腰が折れるまで拾う', art: 'choice.rice', stake: body(), odds: 5, win: { text: '前掛けいっぱい拾った。母は黙って粉にした。', maxBody: 1, store: 1 }, lose: { text: '隣の家の子に、拾った束を蹴られた。' } },
    right: { title: '赤ん坊たちを見ている', art: 'choice.children', stake: body(), odds: 5, win: { text: '誰の子も泣かなかった。女たちが、よく見てくれたねと言った。', add: ['villagetrust'] }, lose: { text: '一人が堀に落ちかけた。そっちの家の母親に頭をはたかれた。' } } },
  // 大飢饉 1315〜17 は史実。人を食ったという噂も年代記にある
  { id: 'child.hearth', frame: 'path', ages: [8, 12], title: '祖母の飢饉の話', story: '冬の夜。祖母が、自分の若いころの七年の雨と、飢えの話を始めた。「犬は食べた。あとは聞くな」', art: 'scene.hearth',
    left: { title: '外で薪を割っている', art: 'choice.firewood', stake: body(), odds: 5, win: { text: '聞きたくなかった。腕に力がついた。', maxBody: 1, store: 1 }, lose: { text: '斧の柄で手を打った。' } },
    right: { title: '最後まで聞く', art: 'choice.grandmother', stake: body(), odds: 5, win: { text: '麦を隠す場所と、飢えた村が何をするかを知った。', add: ['oldtales'] }, lose: { text: '途中で寝てしまった。朝、祖母はもう話さなかった。' } } },
  { id: 'child.wrestle', frame: 'path', ages: [8, 14], axis: 'strength', title: '聖霊降臨祭の組み打ち', story: '教会の庭で、子どもの組み打ちが始まった。勝った者には、大人の組み打ちを最前列で見る権利がある。', art: 'scene.sumo',
    left: { title: '年上に挑む', art: 'choice.sumo', stake: riskBody(), odds: 2, win: { text: '腰を払うと、年上の子が空を見ていた。', add: ['wrestling'] }, lose: { text: '耳が半日聞こえなかった。' } },
    right: { title: '勝ち負けを見届ける', art: 'choice.referee', stake: body(), odds: 5, win: { text: '誰も文句を言わなかった。妙なことに、それで顔を覚えられた。', add: ['villagetrust'] }, lose: { text: '両方から殴られた。' } } },
  { id: 'child.priest', frame: 'path', ages: [8, 13], axis: 'faith', title: '司祭の手伝い', story: 'イクスワースの小修道院から来る司祭が、ミサの答えを覚える子を探している。ラテン語で、意味はだれも教えてくれない。', art: 'scene.temple',
    left: { title: '鐘の綱を任される', art: 'choice.sweep', stake: body(), odds: 5, win: { text: '綱にぶら下がると、体が浮いた。村じゅうの人が自分の手で起きる。', add: ['bellrope'] }, lose: { text: '葬式で、祝いの鳴らし方をしてしまった。' } },
    right: { title: '詩編の字を習う', art: 'choice.reading', stake: body(), odds: 4, win: { text: '自分の名と、数と、羊皮紙の読み方を覚えた。', add: ['reading'] }, lose: { text: '麦の刈り入れで三週間休むと、全部消えた。' } } },
  { id: 'child.may', frame: 'path', ages: [10, 14], axis: 'love', title: '花を取りに', story: '五月の夜明け。年上の子たちに混じって、白い花の枝を取りに森へ入った。', art: 'scene.festival',
    left: { title: '隣の家の子の手を引く', art: 'choice.dance', stake: body(), odds: 4, win: { text: '手を離すきっかけが、帰り道のあいだじゅう見つからなかった。', add: ['firstlove'] }, lose: { text: '手を引いた先に、茨があった。' } },
    right: { title: '五月柱を担ぐ', art: 'choice.mikoshi', stake: riskBody(), odds: 4, win: { text: '大人に混じって担ぎ上げた。肩の皮が剥けて、自慢になった。', add: ['strongbody'] }, lose: { text: '柱が足の上に来た。' } } },
  { id: 'child.miller', frame: 'path', ages: [8, 14], axis: 'money', title: '粉屋の枡', story: '父の代わりにメルネミアの道を通って、粉挽き場へ行った。粉屋が枡で量るとき、親指が中に入っているのが見えた。', art: 'scene.coin',
    left: { title: '大きな声で言う', art: 'choice.honest', stake: body(), odds: 4, win: { text: '並んでいた人がみんな笑った。粉屋も笑って、枡を一杯足した。', add: ['villagetrust'] }, lose: { text: '次からうちの粉だけ、砂が混じるようになった。' } },
    right: { title: '黙って数を覚える', art: 'choice.hoard', stake: body(), odds: 4, win: { text: '十袋で親指何本分か。数えれば分かる。家の麦の勘定が合い始めた。', store: 1 }, lose: { text: '数えているのを粉屋に見られ、肩をつかまれた。' } } },
  { id: 'child.bees', frame: 'path', ages: [7, 12], axis: 'slow', title: '野の蜜蜂', story: '古い柳のうろに、蜂が出入りしている。甘いものは、この村にはこれしかない。', art: 'scene.river',
    left: { title: '手を突っ込む', art: 'choice.swim', stake: riskBody(2), odds: 4, win: { text: '腕が倍に腫れたが、蜜はうまかった。', add: ['strongbody'] }, lose: { text: '顔が倍に腫れた。母は、自分の子かどうかしばらく確かめた。' } },
    right: { title: '父に教えて藁の巣へ移す', art: 'choice.nap', stake: body(), odds: 4, win: { text: '夕暮れに二人で移した。藁の巣が庭に一つ増えた。', add: ['bees'] }, lose: { text: '蜂は翌朝、全部どこかへ行った。' } } },
  { id: 'child.butts', frame: 'path', ages: [10, 14], axis: 'strength', title: '弓場の裏', story: '日曜のミサのあと、男たちが土手に向かって矢を放つ。矢を拾って走る子には、一本引かせてもらえることがある。', art: 'scene.training',
    left: { title: '弓を引かせてもらう', art: 'choice.spear', stake: riskBody(), odds: 3, win: { text: '弦が腕の内側を裂いた。それでも引ききれた。大人が笑って、古い弓をくれた。', add: ['longbow'] }, lose: { text: '半分も引けなかった。腕に青い線が残った。' } },
    right: { title: '矢を拾う駄賃をためる', art: 'choice.chores', stake: body(), odds: 5, win: { text: '矢一本につきパン一切れ。よく食べた。', maxBody: 1, store: 1 }, lose: { text: '走っていく先に、矢が来た。泥をかぶって帰った。' } } },
  { id: 'child.cart', frame: 'path', ages: [11, 14], title: '羊毛の荷車', story: '羊毛を積んだ荷車が、ベリーの市へ行く。荷を押す手が足りないらしい。', art: 'scene.news',
    left: { title: '鎌を研いで家に残る', art: 'choice.tools', stake: body(), odds: 5, win: { text: '父の鎌は髪の毛まで切れるようになった。', add: ['sickle'] }, lose: { text: '研ぎすぎて、刃がなくなりかけた。' } },
    right: { title: '豚を売りがてら付いていく', art: 'choice.news', stake: risk('pig'), odds: 4, win: { text: '僧院の塔が村三つ分の高さだった。町の話を腹いっぱい持って帰った。', add: ['citygossip'] }, lose: { text: 'よく知らない男が豚を買ってくれた。銀貨は鉛だった。', add: ['nopig'], body: -1 } } },
  { id: 'child.newpig', frame: 'path', ages: [7, 30], repeat: true, needs: ['nopig'], title: '空の囲い', story: '囲いが空いたまま、また一年がたった。残飯の行き場がない。', art: 'event.zori',
    left: { title: '隣から子豚を分けてもらう', art: 'choice.sister', stake: body(), odds: 5, win: { text: '刈り入れの手伝いと引きかえに、いちばん小さいのをもらった。', add: ['pig'], remove: ['nopig'] }, lose: { text: '今年の子豚は、みんな先約があった。' } },
    right: { title: '森で迷い豚を探す', art: 'choice.seedling', stake: body(), odds: 3, win: { text: '耳に印のない豚がいた。今日から、うちの豚だ。', add: ['pig'], remove: ['nopig'] }, lose: { text: '印のある豚しかいなかった。' } } },

  // ── 史実（その年に必ず来る）
  // 史実: 1340 年に議会が穀物・羊毛・羊の九分の一を王に認めた（Ninth）。村での取り立ての様子は推測
  { id: 'hist.ninth', frame: 'path', years: [1340, 1342], weight: 40, title: '九分の一', story: '王の役人が来た。羊も、羊毛も、麦も、九つにつき一つをフランスとの戦に出せという。父が納屋の前で、口を開けずに数えている。', art: 'history.okehazama',
    left: { title: '麦の袋を裏へ隠すのを手伝う', art: 'choice.guard', stake: risk('pig'), odds: 4, win: { text: '袋は三つ助かった。父はこの話を二度としなかった。', store: 1 }, lose: { text: '見つかった。隠した麦のかわりに、豚が荷車に載せられた。', add: ['nopig'] } },
    right: { title: '役人の数え方を見ている', art: 'choice.procession', stake: body(), odds: 5, win: { text: '刻み目の入った棒で数えるのを覚えた。', add: ['citygossip'] }, lose: { text: '「お前の父は何頭持っている」と聞かれた。' } } },
  // 12 歳で十人組に入り王の平和を誓う（史実。frankpledge）
  { id: 'hist.tithing', frame: 'path', years: [1342, 1345], weight: 40, title: '十人組の誓い', story: '十二を過ぎた。村の男は十人で組になり、誰かが罪を犯せば全員が責めを負う。今日から、あなたもその一人だ。', art: 'scene.genpuku',
    left: { title: '組の年長者に弓を習う', art: 'choice.spear', stake: riskBody(), odds: 4, win: { text: '手の皮と引きかえに、父の古い長弓を引けるようになった。', add: ['longbow'] }, lose: { text: '弦で指を裂いた。' } },
    right: { title: '畑の一筋を任される', art: 'choice.paddy', stake: risk('strips'), odds: 5, win: { text: '自分の鋤の跡がまっすぐ通った。父が一度だけうなずいた。', store: 2 }, lose: { text: '畔を隣の畑まで鋤いた。裁判で父が罰金を払った。' } } },
  // 史実: 1346 年クレシー。村ごとに弓兵を割り当てた（commission of array）。サフォーク伯ロバート・アフォードが従軍。この村から出たかは推測
  { id: 'hist.crecy', frame: 'demand', year: 1346, demand: true, ignore: { substitute: true, odds: 5 }, omen: '王が村々に弓兵を割り当てている', title: 'クレシー', story: '村から弓兵を二人出せとの命令が来た。王はノルマンディーへ渡るという。十六で、弦を引ける男は多くない。', art: 'history.anegawa',
    left: { title: '弓を担いで海を渡る', art: 'choice.march', stake: riskBody(2), odds: 3, delay: 1, win: { text: '丘の上から矢を放った。雨の中で、騎士たちが泥に沈んでいった。帰ると、村の男たちが席を空けた。', add: ['merit.crecy'], rank: 1, store: 2 }, lose: { text: 'カレーの包囲の泥で、足が腐りかけた。', add: ['wound'] } },
    right: { title: '村に残る', art: 'choice.stay', stake: SUB, odds: 5, win: { text: '代わりに出た者は帰ってきた。' }, lose: { text: '代わりに出た者は帰らなかった。' } } },
  // 史実: 1348 年の夏は雨が続いた（年代記）。ドーセットのメルカムに夏ごろ上陸（史実）
  { id: 'hist.rain', frame: 'path', year: 1348, omen: '海の向こうで町が丸ごと死んだという話', title: '雨の夏', story: '夏至からずっと雨だ。麦が畑で腐っていく。行商人が、南の港で何かがあったと話していった。みな、話を半分しか聞いていない。', art: 'scene.news',
    left: { title: '残りの麦を裏に隠しておく', art: 'choice.hoard', stake: body(), odds: 4, win: { text: '祖母のやり方で、屋根裏に袋を吊った。', store: 2 }, lose: { text: '吊った袋に、ねずみが住んだ。' } },
    right: { title: '行商人に詳しく聞く', art: 'choice.news', stake: store(1), odds: 4, win: { text: '聞くほど分からなかった。南では、人が三日で死ぬらしい。', add: ['citygossip'] }, lose: { text: '聞いたのは、値段の話だけだった。' } } },
  // 前世の先読みか衛生の知恵があると、1349 の前に一度だけ来る。前世の知識の一番の使いどころ（企画書 決めた点 10）
  { id: 'past.warning', frame: 'path', years: [1343, 1348], ages: [13, 18], weight: 40, past: ['foresight', 'hygiene'], title: '来年の春', story: '前の世の記憶が、なぜかはっきりする。千三百四十九年の春。ねずみと、のみと、腫れ。ここは、その村だ。', art: 'scene.news',
    left: { title: '森の奥に小屋を作っておく', art: 'choice.hermit', stake: body(2), odds: 4, win: { text: '誰にも言わず、炭焼きの跡に屋根を掛けた。麦を少しと、水がめと、猫を置いた。', add: ['refuge'] }, lose: { text: '森番に見つかり、壊された。「何のための小屋だ」に答えられなかった。' } },
    right: { title: '教会で村の者に話す', art: 'choice.rhetoric', stake: riskBody(), odds: 2, win: { text: '笑われた。ただ、司祭だけが翌日あなたを呼び、黙ってうなずいた。', add: ['temple'] }, lose: { text: '悪魔付きかと疑われ、教会の床を三日掃いた。' } } },
  // W1, W14, C1, C2: 春に来た。種まきは済んでいた。ノリッジ教区の聖職者は 2,000 人以上死んだ。司教は緊急時の俗人への告解を許した
  { id: 'hist.death', frame: 'fight', year: 1349, omen: '隣村の鐘が鳴りやまないという', title: '大いなる死', story: '三月。麦はもう蒔いてある。隣村で鐘が鳴りやまなくなり、ある日、ぴたりと止まった。首と腋に黒い腫れが出た者は三日で死ぬ。司祭がいなければ、誰にでも罪を告げてよいと、司教が書いたそうだ。', art: 'disaster.plague',
    always: { remove: ['neighbors'], add: ['emptied'] },
    left: { title: '家にとどまり、家の者を看る', art: 'choice.nurse', stake: riskBody(2), odds: 3, win: { text: '六月までに、隣の三人と向かいの家の全員を土に入れた。自分の首には何も出なかった。なぜかは分からない。', add: ['villagetrust'], shift: { 'fam.father': -8, 'fam.mother': -6 } }, lose: { text: '朝、腋の下が熱かった。隣の者に罪を告げた。三日目の鐘を鳴らす者は、もういなかった。', die: true } },
    right: { title: '全部置いて、森へ逃げる', art: 'choice.separate', stake: risk('kind:家族'), odds: 3, win: { text: '夏まで森で木の皮を噛んだ。戻ると、蒔いた麦が誰の手も借りずに熟れていた。家の者は生きていて、どこにいたかを聞かなかった。' }, lose: { text: '夏に戻ると、麦だけが熟れていた。家の戸に藁が詰めてあった。' } } },
  // W1, W2, W5, W7, M1: 書記は台帳を東の端から西へ、通りの順に読んだ。119 人。名字が 30 消えた。土地を持てなかった者に畑が回る
  { id: 'hist.vacant', frame: 'path', year: 1350, title: '東の端から西へ', story: '裁判の日。書記が借地人の台帳を、村の東の端から通りの順に読んでいく。「死んだ」「死んだ」「継ぐ者なし」。百十九人で読み終えて、水を飲んだ。去年まで四分の一の家に住み、畑を持てなかった男たちが、黙って立っている。', art: 'scene.market',
    left: { title: '手を挙げて、死んだ家の畑を取る', art: 'choice.till', stake: riskBody(2), odds: 5, win: { text: '去年までなら一生かかる広さが、昼前に自分のものになった。羊皮紙に、前の名前の隣に書かれた。', add: ['newfield'] }, lose: { text: '引き受けたが、耕す手がなかった。一年で草に戻した。' } },
    right: { title: '畑は取らず、日当で刈りに出る', art: 'choice.work', stake: body(2), odds: 5, win: { text: '隣の荘園の執事が、頭を下げて日当を積んだ。農夫の子に、である。', store: 3 }, lose: { text: '刈り入れの最中に、また誰かが倒れた。みな鎌を置いて帰った。' } } },
  // M1, M2: 上限の額と足かせは法の文のまま。焼き印は 1361 年の追加で記憶。押し戻す波
  { id: 'hist.statute', frame: 'path', year: 1351, title: '二ペンスの法', story: '教会の前で、王の法が読み上げられた。刈り入れは八月の第一週に二ペンス、次の週から三ペンス。誓いを拒めば足かせ。夏によそへ出てはならない。あの春に誰が麦を刈ったか、王はご存じないらしい。', art: 'history.edo',
    always: { add: ['statute'] },
    left: { title: '夜のうちに隣の州へ出る', art: 'choice.migrate', stake: riskBody(), odds: 4, win: { text: '名字を変えて雇われた。誰も何も聞かなかった。みな人手が欲しい。', store: 2, add: ['citygossip'] }, lose: { text: '捕まった。足かせで三日、教会の前に座らされた。子どもが見に来た。', add: ['lordgrudge'] } },
    right: { title: '帳面は二ペンス、袋に麦をもらう', art: 'choice.collect', stake: body(), odds: 4, win: { text: '帳面には二ペンス。袋には麦。執事も分かって目をそらした。', store: 2 }, lose: { text: '密告があった。罰金は日当のひと月分だった。' } } },
  // W9: 1353 年、35 人が冬の賦役を拒否。女 9 人は箕で麦を吹くのを拒み、11 人は「ほかの者のために銭で」刈った。罰金は「二度としなければ」と延期
  { id: 'hist.refuse', frame: 'path', year: 1353, title: '三十五人', story: '冬の賦役の鐘が鳴った。誰も行かない。女が九人、箕を持たずに立っている。男たちは、領主の麦を刈らずに、隣の者の麦を銭で刈ってきた。今度の裁判で読まれる名は三十五人。一人なら足かせだ。三十五人なら、どうなる。', art: 'scene.fushin',
    left: { title: '三十六人目になる', art: 'choice.refuse', stake: riskBody(), odds: 5, win: { text: '裁判で名が読まれた。執事は全員を見回して言った。「罰金は延ばす。二度とするな」。誰も返事をしなかった。誰も忘れなかった。', add: ['villagetrust'] }, lose: { text: '三十六人目だけ、見せしめに足かせに座らされた。', add: ['lordgrudge'] } },
    right: { title: 'ひとりだけ鐘に応える', art: 'choice.work', stake: body(2), odds: 4, win: { text: '領主の納屋で、ひとりで麦を吹いた。執事は覚えていて、畑を一筋まわした。その夜から誰も話しかけない。', add: ['newfield'] }, lose: { text: '執事は礼も言わなかった。村の者は覚えていた。', add: ['shirk'] } } },
  // 史実: 1356 年ポワティエ。サフォーク伯が従軍。主に黒太子の兵で、この村から出たかは推測
  { id: 'hist.poitiers', frame: 'demand', year: 1356, demand: true, ignore: { substitute: true, odds: 3 }, omen: '黒太子がガスコーニュで兵を集めている', title: 'ポワティエ', story: '黒太子の軍に弓兵が要る。サフォーク伯の者が、村々を回っている。今度の日当は、畑より良い。', art: 'history.mikatagahara',
    left: { title: '王太子の軍に加わる', art: 'choice.battle', stake: riskBody(3), odds: 3, win: { text: '矢が尽きて、死んだ者の矢を抜いた。フランスの王が捕まるのを、遠くから見た。戦利品は一生分だった。', add: ['merit.poitiers'], rank: 2, store: 3 }, lose: { text: '騎士の槍が来るのが、はっきり見えた。', die: true } },
    right: { title: '村に残る', art: 'choice.flee', stake: SUB, odds: 3, win: { text: '代わりに出た者は帰ってきた。' }, lose: { text: '代わりに出た者は帰らなかった。' } } },
  // D2: 子どもの疫病。若い男と子に重く、女に軽いと伝わる
  { id: 'hist.children', frame: 'fight', year: 1361, omen: '南の町の子らが死んでいるという', title: '子どもの疫病', story: '十二年前と同じ腫れが、また来た。今度は、あのとき生き残った者をよけて、あのあとに生まれた子と若い男のほうへ行く。女たちは倒れない。なぜかは、司祭にも分からない。', art: 'disaster.plague',
    left: { title: '子らのそばで看病する', art: 'choice.nurse', stake: riskBody(2), odds: 3, win: { text: '息の音を朝まで数えた。生き残った者は、生き残った。', maxBody: -1 }, lose: { text: '二度目は、大人もよけなかった。', die: true } },
    right: { title: '子らを荷車で遠い縁者へ送る', art: 'choice.separate', stake: risk('kind:家族'), odds: 4, win: { text: '秋に帰ってきた子は、背が伸びていた。' }, lose: { text: '荷車は、村のはずれから動かなかった。' } } },
  // メモ 10: 1362 年 1 月の大風。ノリッジ大聖堂の尖塔が倒れた
  { id: 'hist.wind', frame: 'path', years: [1362, 1368], weight: 40, title: '聖モールの大風', story: '一月の夜、経験したことのない風が来た。朝、教会の屋根の半分が畑にあった。ノリッジでは、大聖堂の尖塔が倒れたそうだ。', art: 'disaster.flood',
    left: { title: '自分の家の屋根から直す', art: 'choice.chores', stake: body(2), odds: 4, win: { text: '倒れた木の柱で、家をひとまわり強くした。', store: 1, maxBody: 1 }, lose: { text: '屋根から落ちた。', add: ['wound'] } },
    right: { title: '教会の屋根に先に上がる', art: 'choice.attend', stake: riskBody(), odds: 3, win: { text: '誰も頼まないのに上がった。司祭はあなたの名をミサで読んだ。', add: ['temple', 'villagetrust'] }, lose: { text: '滑った。残りの冬を寝て過ごした。' } } },
  // 史実: 1363 年の布告で日曜の弓の稽古を命じ、フットボールなどを禁じた
  { id: 'hist.archery', frame: 'path', years: [1363, 1368], weight: 40, title: '日曜の弓の布告', story: '王の布告が来た。日曜と祝日は弓を引け。石投げも、闘鶏も、フットボールも禁ずる。村の男たちは、布告を読む司祭の顔を見ている。', art: 'history.komaki',
    left: { title: '布告どおり弓場へ行く', art: 'choice.drill', stake: body(), odds: 5, win: { text: '腕がまだ覚えていた。若い者に引き方を教えた。', add: ['longbow'] }, lose: { text: '弦が切れて、頬を打った。' } },
    right: { title: '隣村とフットボールをする', art: 'choice.dojo', stake: riskBody(), odds: 3, win: { text: '球は隣村の教会の前まで転がった。誰の骨も折れなかった。珍しいことだ。', add: ['wrestling', 'villagetrust'] }, lose: { text: '骨を折った。自分のだった。', add: ['wound'] } } },
  // 史実: 1369 年の第三の疫病、同年に対仏戦の再開
  { id: 'hist.third', frame: 'demand', year: 1369, demand: true, ignore: { substitute: true, odds: 3 }, omen: 'また腫れが出たらしい。王は和約を破った', title: '三度目の春', story: 'また腫れが出た。三度目だ。そこへ王は和約を破り、フランスへの軍を集め始めた。疫病から逃げるなら、戦のほうがましかもしれない。', art: 'history.nagashino',
    left: { title: '騎行の軍に加わる', art: 'choice.musket', stake: riskBody(2), odds: 4, win: { text: 'フランスの村を焼いて歩いた。村の老婆が、母に似ていた。銀の杯を持って帰った。', add: ['merit.france'], rank: 1, store: 3 }, lose: { text: '軍の中にも腫れは来た。熱の中で荷車に積まれて帰った。', add: ['wound'] } },
    right: { title: '村に残る', art: 'choice.supply', stake: SUB, odds: 3, win: { text: '代わりに出た者は帰ってきた。' }, lose: { text: '代わりに出た者は帰らなかった。' } } },
  // 史実: 1377 年に老王が死に、10 歳のリチャード二世が即位。同年、14 歳以上一人 4 ペンスの人頭税
  { id: 'hist.polltax', frame: 'demand', year: 1377, demand: true, ignore: { label: '名簿から消えた家として、にらまれる', effect: { text: '家の者の数を少なく申し出た。役人の帳面の字が、一度止まった。', add: ['lordgrudge'] } }, omen: '老王が死んだ。次の王は十歳だという', title: '人頭税', story: '王が死に、十歳の少年が王になった。そして新しい税が来た。畑でも羊でもなく、頭に。十四歳を過ぎた者は、誰でも一人四ペンス。', art: 'scene.goyokin',
    always: { remove: ['edward'], add: ['richard'] },
    left: { title: '頭の数どおりに払う', art: 'choice.pay', stake: store(3), odds: 6, win: { text: '払った。隣の家は、婆さんが二人「いなくなって」いた。', add: ['aidroll'] } },
    right: LOTTERY },
  // B1, B3, B4, W11: 聖体の祝日のベリー。ウォルシャムの記録は 1380 年 9 月から 1383 年 12 月まで欠ける（焼けたかは推測）。村の者が加わった証拠は無く、ここは加わった場合の話
  { id: 'hist.rising', frame: 'fight', year: 1381, omen: 'エセックスで人が集まっている。三度目の人頭税は一人一シリング', title: '聖体の祝日', story: '六月、聖体の祝日。ベリーの行列の最中に、チャプレンの率いる一隊が町へ入った。翌日、判事カヴェンディッシュの首が通りを行った。レイクンヒースでは、女が舟を岸から突き放して、判事を逃がさなかったという。村の男たちが、裁判の箱の前に立っている。', art: 'history.ikko',
    left: { title: '箱を担ぎ出して火にくべる', art: 'choice.ikko.temple', stake: riskBody(2), odds: 3, win: { text: '羊皮紙はよく燃えた。祖父の名も父の名も、結婚税の額も灰になった。この村の記録は、今もここから三年分ない。', add: ['burnedrolls'], remove: ['bondage'] }, lose: { text: '七月、伯の裁判が来た。木は村の真ん中にあった。', die: true } },
    right: { title: '戸を閉めて畑を守る', art: 'choice.ikko.lord', stake: store(2), odds: 4, win: { text: '何も見なかった。煙は見た。裁判が来たとき、何も見なかったと言えたのはこの家だった。', add: ['villagetrust'] }, lose: { text: '夜、戸に炭で何か書かれた。読めなくても分かった。', add: ['coward'] } } },
  // B6: サフォーク伯ウィリアム・アフォードの裁判。ジョン・レイは他の者に不利な証言をして助かろうとした。恩赦から外す名簿
  { id: 'hist.assize', frame: 'path', year: 1382, title: '恩赦の名簿', story: '議会は恩赦を出したが、外す名の名簿も作った。サフォーク伯の裁判が村に来た。十人組の男が一人ずつ呼ばれる。あのチャプレンは、仲間の名を次々に言って助かろうとしたそうだ。', art: 'scene.bribe',
    left: { title: '誰の名も言わない', art: 'choice.refuse', stake: riskBody(), odds: 4, win: { text: '伯は疲れていた。この村の男たちは、それから何も言わずにあなたに麦を分けた。', add: ['villagetrust'] }, lose: { text: '牢の二週間で、歯を半分なくした。', add: ['wound'] } },
    right: { title: '死んだ男の名を言う', art: 'choice.bribe', stake: body(), odds: 4, win: { text: '死んだ者なら誰も困らない。書記は書き留めて、次の村へ行った。', store: 1 }, lose: { text: '死んだ男の息子が、柵の外で聞いていた。', add: ['grudge'] } } },
  // W10: 1391 年、ジョン・ホーズがエールつきの刈り入れと草刈りを拒み 1 ポンドの罰金。翌年は犂も拒む
  { id: 'hist.reapale', frame: 'path', years: [1391, 1398], weight: 40, title: 'エールつきの刈り入れ', story: 'ジョン・ホーズが、領主のエールつきの刈り入れを断って、一ポンドの罰金を食らった。一ポンド。祖父なら一生見ない金だ。ホーズは払った。翌年は犂も断るつもりらしい。若い者があなたを見ている。あの年を知っている者を。', art: 'scene.fushin',
    left: { title: '若い者に、断れと言う', art: 'choice.rhetoric', stake: body(), odds: 4, win: { text: '次の夏、領主の畑の鎌は半分しか来なかった。領主は銭で雇い始めた。', add: ['villagetrust'] }, lose: { text: '若い者は笑った。あの年の話は、もう昔話だ。' } },
    right: { title: 'エールを飲みに行ってやる', art: 'choice.tea', stake: store(1), odds: 5, win: { text: '鎌は持っていかなかった。エールは悪くない。この歳で、誰も文句は言わない。', add: ['familyjoy'] }, lose: { text: '酸っぱかった。ホーズの言うとおりだった。' } } },
  // 史実: 1399 年リチャード二世の廃位。ヘンリー四世
  { id: 'hist.henry', frame: 'path', years: [1399, 1402], weight: 40, title: '少年王の終わり', story: '十歳で王になり、火の夏を生き延びた少年が、四十前で王座を追われた。あなたは少年より長生きしたことになる。', art: 'history.edo',
    always: { remove: ['richard'] },
    left: { title: '孫たちに、火の夏の話をする', art: 'choice.tell', stake: body(), odds: 4, win: { text: '孫は信じなかった。領主の記録を燃やしたなんて。', add: ['oldtales'] }, lose: { text: '名前が、どうしても思い出せない者がいた。' } },
    right: { title: '新しい王のためにエールを開ける', art: 'choice.tea', stake: store(1), odds: 5, win: { text: '誰が王でも、麦は麦だ。エールは今年もうまい。', add: ['familyjoy'] }, lose: { text: '酸っぱかった。' } } },

  // ── 災い（成人後に引かれる。何度でも）
  { id: 'dis.famine', frame: 'disaster', disaster: true, repeat: true, omen: '夏が寒い', title: '不作', story: '麦が穂のまま黒くなった。地代の日は、麦の出来を待ってくれない。', art: 'disaster.famine',
    left: { title: '畑を手放して食いつなぐ', art: 'choice.sellpaddy', stake: spend('kind:田'), odds: 6, win: { text: '裁判で畑を隣へ渡した。羊皮紙一行で済んだ。', store: 2 } },
    right: { title: '木の実と根で耐える', art: 'choice.endure', stake: riskBody(2), odds: 3, win: { text: '祖母の話が役に立つとは思わなかった。' }, lose: { text: '春まで持たなかった者の数に、自分の体が入りかけた。' } } },
  { id: 'dis.plague', frame: 'disaster', disaster: true, repeat: true, omen: '隣村でまた腫れが出た', title: 'ぶり返し', story: 'また、誰かの首に腫れが出た。年寄りは騒がない。もう、どうするかを知っている。', art: 'disaster.plague',
    left: { title: '戸を閉めて、家の者を看る', art: 'choice.nurse', stake: riskBody(2), odds: 3, win: { text: '今度は、家の中では誰も死ななかった。' }, lose: { text: '看病のうちに、自分の腋が熱くなった。', die: true } },
    right: { title: '教会に寄進して、祈りを買う', art: 'choice.separate', stake: store(2), odds: 4, win: { text: '蝋燭の数だけ、気が楽になった。腫れは村を通り過ぎた。', add: ['temple'] }, lose: { text: '司祭が先に死んだ。寄進は戻らなかった。', body: -2 } } },
  { id: 'dis.flood', frame: 'disaster', disaster: true, repeat: true, omen: '長雨が続く', title: '低地の水', story: '小川があふれ、低い畑が湖になった。誰かが溝の掃除を怠ったのだ。裁判で誰の名が出るかは、もう分かっている。', art: 'disaster.flood',
    left: { title: '腰まで入って溝を切る', art: 'choice.levee', stake: riskBody(), odds: 3, win: { text: '水は夕方に引いた。村の者が、麦の袋を一つ置いていった。', add: ['villagetrust'] }, lose: { text: '冷えた足が、その年のうちに戻らなかった。', add: ['wound'] } },
    right: { title: '麦を高いところへ運ぶ', art: 'choice.highground', stake: store(1), odds: 5, win: { text: '麦は濡れずに済んだ。', store: 2 }, lose: { text: '泥壁が溶けた。文字どおり、溶けた。', remove: ['house'] } } },
  { id: 'dis.fire', frame: 'disaster', disaster: true, repeat: true, omen: '乾いた風が続く', title: '屋根の火', story: 'パンを焼く竈の火が、隣の藁屋根に移った。村の屋根は全部藁で、全部つながっている。', art: 'disaster.fire',
    left: { title: '鉤で燃える屋根を引き落とす', art: 'choice.firefight', stake: riskBody(), odds: 4, win: { text: '屋根一枚で止めた。', add: ['villagetrust'] }, lose: { text: '火の藁が背中に落ちた。', add: ['wound'] } },
    right: { title: '家の物を持ち出す', art: 'choice.rescue', stake: risk('kind:家'), odds: 2, win: { text: '自分の家は残った。', store: 1 }, lose: { text: '家は、柱だけになった。' } } },
  // 疫病のあと働き口を失った兵や逃げた農奴が野盗になった（史実、規模は推測）
  { id: 'dis.bandits', frame: 'disaster', disaster: true, repeat: true, omen: '森で旅人が消えた', title: '森の男たち', story: '戦から帰らなかった男たちと、荘園から逃げた男たちが、夜の道に立っている。市の帰り、前に三人。', art: 'scene.bandits',
    left: { title: '杖で殴りかかる', art: 'choice.hunt', stake: riskBody(2), odds: 4, win: { text: '一人の頭が割れ、残りは森に消えた。', add: ['strongbody'] }, lose: { text: '杖より、向こうの短刀が早かった。', die: true } },
    right: { title: '財布を投げて走る', art: 'choice.flee', stake: riskStore(3), odds: 4, win: { text: '財布はもう一つ持っていた。' }, lose: { text: '追われて、身ぐるみ置いていった。' } } },
  // 羊の疫は 1360 年代に記録がある（記憶、推測）
  { id: 'dis.murrain', frame: 'disaster', disaster: true, repeat: true, needs: ['sheep'], omen: '羊が咳をしている', title: '羊の疫', story: '朝、羊が立たない。囲いの全部が咳をしている。', art: 'disaster.famine',
    left: { title: '病んだのを全部つぶす', art: 'choice.collect', stake: spend('sheep'), odds: 6, win: { text: '毛皮だけ売った。来年は、一から。', store: 2 } },
    right: { title: '聖アントニウスに祈って様子を見る', art: 'choice.memorial', stake: riskStore(2), odds: 3, win: { text: '半分は立ち上がった。' }, lose: { text: '囲いは静かになった。' } } },

  // ── 家族の節目
  // W8: 結婚の許可料（merchet）
  { id: 'fam.sister', frame: 'family', ages: [16, 24], needs: ['sister'], title: '妹の結婚税', story: '妹が隣村の男に嫁ぐ。農奴の娘を領地の外へ出すには、領主に金を払う。執事は、持参金の額まで聞いてくる。', art: 'scene.wedding.sister',
    always: { remove: ['sister'], add: ['inlaw'] },
    left: { title: '結婚税を払って、堂々と送る', art: 'choice.dowry', stake: store(2), odds: 6, win: { text: '教会の戸の前で誓った。妹は、一度だけこっちを振り向いた。隣村に縁ができた。', add: ['villagetrust'] } },
    right: { title: '教会の前で唄って、皆の気を逸らす', art: 'choice.sing', stake: body(), odds: 4, win: { text: '執事も一緒に唄い始めた。結婚税の話は翌週になった。隣村の誰かが、あなたをじっと見ていた。', add: ['lover.neighbor'] }, lose: { text: '声が裏返った。執事は笑わなかった。' } } },
  // W8: 死亡税は「いちばん良い獣」
  { id: 'fam.father', frame: 'family', ages: [22, 42], needsAny: ['father', 'oldfather'], title: '父の死と死亡税', story: '父が床についた。あの春に見送った人たちの名を、うわごとで呼ぶ。息を引き取った翌朝、執事が家畜の囲いを見に来た。いちばん良いのを領主に、という決まりだ。', art: 'scene.father.end',
    always: { remove: ['father', 'oldfather'] },
    left: { title: 'そばで看取り、豚を差し出す', art: 'choice.watch', stake: spend('pig'), odds: 6, win: { text: '父は麦の話をして逝った。執事は、豚を連れていった。', add: ['oldtales', 'nopig'] } },
    right: { title: '葬式の費えを働いて稼ぐ', art: 'choice.work', stake: body(2), odds: 6, win: { text: '蝋燭が四本買えた。執事は、一番良い鍋を持っていった。', store: 2 } } },
  { id: 'ie.succession', frame: 'family', family: true, ages: [22, 75], title: '畑を継ぐ者', story: '縁者が裁判で畑を求めた。', art: 'scene.family', contest: 'succession',
    left: { title: '跡取りを押す', art: 'choice.enlist', odds: 3, win: { text: '畑を守り、相手は別の畑へ出た。' }, lose: { text: '裁判は相手の側についた。こちらが別の畑へ出た。' } },
    right: { title: '相手を跡取りに替える', art: 'choice.cultivate', odds: 6, win: { text: '相手を跡取りに替えた。' } } },
  { id: 'fam.mother', frame: 'family', ages: [24, 50], needs: ['mother'], title: '母の最期', story: '母が床についた。毎朝エールを沸かしていた手が、布団の上で何かを量っている。', art: 'scene.mother.end',
    always: { remove: ['mother'] },
    left: { title: '司祭に祈りを頼む', art: 'choice.memorial', stake: store(2), odds: 6, win: { text: '司祭は母の名を覚えていた。煉獄の日数が減ったかは、誰にも分からない。', add: ['temple'] } },
    right: { title: '母の種を菜園に蒔く', art: 'choice.flowers', stake: body(), odds: 6, win: { text: '春、母のねぎが生えた。', add: ['garden'] } } },

  // ── ステータス
  { id: 'st.tithing', frame: 'path', ages: [16, 35], axis: 'status', title: '十人組の見張り', story: '十人組の一人が、夜のうちに隣村の羊を連れてきたらしい。組の全員が責めを負う前に、誰かが話をつけなければならない。', art: 'scene.nanushi',
    left: { title: '自分が話をつけに行く', art: 'choice.rhetoric', stake: riskBody(), odds: 4, win: { text: '羊と一緒に謝りに行き、エールを一樽飲んで帰ってきた。', add: ['villagetrust'] }, lose: { text: '謝る前に殴られた。' } },
    right: { title: '羊の分け前をもらっておく', art: 'choice.hoard', stake: body(), odds: 4, win: { text: '冬の肉は、誰の羊でも同じ味だ。', store: 2 }, lose: { text: '耳の印が残っていた。' } } },
  // エールの吟味役（ale-taster）は村ごとの役（史実）
  { id: 'st.aletaster', frame: 'path', ages: [18, 40], axis: 'status', lacks: ['aletaster'], title: 'エールの吟味役', story: '死んだ男のかわりに、エールの吟味役がいる。村の女が仕込むたびに飲んで、薄ければ裁判に名を出す。女たち全員の敵になる、いい役目だ。', art: 'scene.teaschool',
    left: { title: '引き受ける', art: 'choice.headman', stake: body(), odds: 4, win: { text: '毎週、公務でエールを飲むことになった。', add: ['aletaster'] }, lose: { text: '最初の一杯を薄いと言った相手が、荘役の妻だった。' } },
    right: { title: '自分で仕込むほうに回る', art: 'choice.market', stake: store(2), odds: 4, win: { text: '家の前に竿を立てた。吟味役は一杯で帰った。', add: ['brewing'] }, lose: { text: '酸っぱくて、豚も飲まなかった。' } } },
  { id: 'st.letters', frame: 'path', ages: [16, 35], axis: 'status', lacks: ['reading'], title: '裁判の羊皮紙', story: '裁判の書記が、農夫に字を読まれて困ると笑っている。読める者が、自分の畑の行を確かめられる世の中になるかもしれない。', art: 'scene.letters',
    left: { title: '教区の書記に習いに通う', art: 'choice.study', stake: store(1), odds: 5, win: { text: '自分の家の行を読んだ。祖父の罰金が三回、誤字で二回増えていた。', add: ['reading'] }, lose: { text: 'ラテン語はやはりラテン語だった。' } },
    right: { title: '空いた畑を耕しに行く', art: 'choice.expand', stake: body(2), odds: 4, win: { text: '字より先に畑がある。よその畑を二年起こして、礼に麦をもらった。', store: 2 }, lose: { text: '二年放っておくと、畑は森に戻りかける。' } } },
  // 解放状と「町に 1 年と 1 日」は記憶（推測）。W8: 荘園を出るには許可料がいる
  { id: 'st.charter', frame: 'path', ages: [20, 55], axis: 'status', needs: ['bondage'], title: '解放状', story: '領主は人手が足らず、金も足らない。今なら、自分の身を買えるかもしれない。', art: 'scene.retainer',
    left: { title: '解放状を買う', art: 'choice.retainer', stake: store(8), odds: 4, win: { text: '封蝋のついた一枚の羊皮紙で、自分と子孫が自由の身になった。', add: ['charter'], remove: ['bondage'] }, lose: { text: '金は受け取られ、話は領主の息子の代へ持ち越された。' } },
    right: { title: 'ベリーに一年と一日隠れる', art: 'choice.migrate', stake: riskBody(2), odds: 3, win: { text: '町の空気は人を自由にする。一年と一日、染め物屋の裏で寝た。', add: ['citygossip'], remove: ['bondage'] }, lose: { text: '半年で荘園の者に見つかり、馬の後ろを歩いて帰った。', add: ['lordgrudge'] } } },
  { id: 'ie.water', frame: 'demand', ages: [15, 75], repeat: true, demand: true, needs: ['neighborhouse'], title: '共有地の争い', story: '隣の家が共有地に羊を入れすぎている。放牧の割り当てをめぐって、裁判になった。', art: 'scene.irrigation', contest: 'water', ignore: { label: '放牧を譲る。畑の段が一つ下がる', effect: { text: '放牧を譲った。堆肥が足りなくなり、畑の段が一つ下がった。', levelDown: 'strips' } },
    left: { title: '共有地の権利を争う', art: 'choice.water', odds: 3, win: { text: '放牧の権利を得て、隣の家の勢いが落ちた。' }, lose: { text: '裁判に負け、堆肥が足りなくなった。畑の段が一つ下がった。' } },
    right: { title: '放牧を譲る', art: 'choice.water', odds: 6, win: { text: '放牧を譲った。' } } },
  // 夜のうちに畔を一筋鋤き込むのは裁判記録によくある（史実）
  { id: 'ie.boundary', frame: 'demand', ages: [18, 75], repeat: true, demand: true, needs: ['neighborhouse'], title: '夜の畔', story: '朝行くと、畑の境の畔が一筋ぶん、こちらへ動いていた。隣の家の鋤の跡が、きれいに通っている。', art: 'scene.neighbor', contest: 'boundary', ignore: { label: '黙っている。畑を一枚失う', effect: { text: '黙っていた。翌年にはもう、そこが境だった。畑を一枚失った。', remove: ['strips'] } },
    left: { title: '裁判に出る', art: 'choice.enlist', odds: 3, win: { text: '十二人の陪審が畔を歩いた。向こうの畑が一筋、こちらのものになった。' }, lose: { text: '境は向こうのものと決まり、畑を一枚失った。' } },
    right: { title: '黙っている', art: 'choice.cultivate', odds: 6, win: { text: '黙っていた。' } } },
  { id: 'ie.nanushi', frame: 'family', family: true, ages: [26, 75], axis: 'status', needs: ['villagetrust', 'manorhouse'], lacks: ['reeve'], title: '荘役の選び', story: '聖ミカエル祭に、村の者が荘役を選ぶ。領主の側でもあり村の側でもあり、どちらからも恨まれる役目だ。', art: 'scene.nanushi', contest: 'patron',
    left: { title: '荘役の座を争う', art: 'choice.enlist', odds: 3, win: { text: '荘役に選ばれた。' }, lose: { text: '票は隣へ流れ、十人組の信頼も一緒に流れた。' } },
    right: { title: '畑を守り、役を辞退する', art: 'choice.cultivate', odds: 6, win: { text: '罰金を払って辞退した。安かった。' } } },
  // W3: 選ばれた荘役は二人とも 1349 年に死に、後任はうまく務まらなかった
  { id: 'st.reeve', frame: 'path', ages: [20, 50], axis: 'status', needs: ['villagetrust'], lacks: ['reeve'], title: '三人目の荘役', story: '選ばれた荘役は二人とも、あの春に死んだ。三人目は帳簿を投げ出した。執事が、農奴の子でも字が読めなくてもいいと言っている。', art: 'scene.nanushi',
    left: { title: '荘役を引き受ける', art: 'choice.headman', stake: store(2), odds: 4, win: { text: '領主の鍵束を渡された。数えきれない種麦と、死んだ者の借金も一緒に。', add: ['reeve'], shift: { 'lo.arranged': -2 } }, lose: { text: '反対の家が多かった。生き残った者は、みな声が大きい。' } },
    right: { title: '若い者に譲る', art: 'choice.yield', stake: spend('villagetrust'), odds: 5, win: { text: '肩が軽くなった。菜園に出る朝が増えた。', add: ['garden'] }, lose: { text: '譲った若い者に、あとで恨まれた。' } } },
  // 領主の臨時の取り立て（tallage）は農奴にかかる（史実）
  { id: 'st.audit', frame: 'demand', ages: [25, 55], axis: 'status', needs: ['reeve'], demand: true, ignore: { label: '執事ににらまれる', effect: { text: '帳簿の穴を放っておいた。執事の目が細くなった。', add: ['lordgrudge'] } }, title: '聖ミカエルの帳尻', story: '荘役の帳簿の締め日だ。領主の監査人が、種麦の数が合わないと言っている。死んだ者の分だと言っても、死人は証人にならない。', art: 'scene.bribe',
    left: { title: '自腹で埋める', art: 'choice.bribe', stake: store(3), odds: 4, win: { text: '帳尻は合った。監査人はあなたの名を覚えた。', add: ['aidroll'] }, lose: { text: '穴を埋めても、次の穴が開いていた。' } },
    right: LOTTERY },
  // 上の段
  { id: 'dm.array', frame: 'path', ages: [16, 40], axis: 'strength', lacks: ['archer'], title: '弓兵の募集', story: 'サフォーク伯の者が、日当六ペンスで弓兵を集めている。畑の十倍だ。帰ってこられればだが。', art: 'scene.recruit',
    left: { title: '名を書いてもらう', art: 'choice.enlist', stake: riskBody(2), odds: 4, win: { text: '弦を二本と、赤い頭巾をもらった。', rank: 1 }, lose: { text: '引いてみせた弓が半分だった。笑って帰された。' } },
    right: { title: '空いた畑に手をつける', art: 'choice.expand', stake: body(2), odds: 4, win: { text: '戦に行かない手が、よその畑を耕した。日当は弓兵より安いが、死なない。', store: 2 }, lose: { text: '石が多かった。誰も耕さない理由があった。' } } },
  { id: 'st.vintenar', frame: 'path', ages: [20, 45], axis: 'strength', needs: ['feat'], lacks: ['vintenar'], title: '二十人長の話', story: '戦から帰った隊長が、村まで来た。二十人を預けたいという。農奴の子に。', art: 'scene.retainer',
    left: { title: '二十人を預かる', art: 'choice.retainer', stake: spend('kind:田'), odds: 4, win: { text: '畑を親類に任せ、また海を渡った。二十人長と呼ばれるようになった。', rank: 2 }, lose: { text: '任せた畑は親類のものになり、隊長の話は消えた。' } },
    right: { title: '戦の金で畑を買い足す', art: 'choice.till', stake: riskBody(2), odds: 4, win: { text: '誰も聞かないので、戦の話はしないことにした。戦の金は麦に変えた。', store: 3 }, lose: { text: '夜になると腕が震えて、鋤が持てなかった。' } } },

  // ── マネー
  { id: 'mo.sheep', frame: 'path', ages: [16, 40], axis: 'money', lacks: ['sheep'], title: '羊を入れる', story: '畑を耕す手はない。羊なら、羊飼い一人で千頭だ。麦より羊毛のほうが値が崩れないと、町の者が言う。', art: 'scene.horse',
    left: { title: '畑の一部を囲って羊を入れる', art: 'choice.buyhorse', stake: store(2), odds: 4, win: { text: '死んだ家の畑に、柵と羊が入った。', add: ['sheep'] }, lose: { text: '狐と、隣の家の犬が、羊の数を合わせに来た。' } },
    right: { title: '教会エールに寄付する', art: 'choice.donate', stake: store(1), odds: 5, win: { text: '樽が開いて、皆の前で名が読まれた。', add: ['villagetrust'] }, lose: { text: '雨で流れた。樽だけ残った。' } } },
  // メモ 8: エールは村の女の仕事。罰金は実質の免許料。B4 のマーガレット・ライトも罰金を取られたエール売り
  { id: 'mo.brew', frame: 'path', ages: [16, 45], axis: 'money', lacks: ['brewing'], title: '家のエール', story: '連れ合いか母か、家の女たちのエールが評判だ。人が減って日当が上がってから、皆が飲むようになった。', art: 'scene.teaschool',
    left: { title: '竿を立てて売る', art: 'choice.shop', stake: store(2), odds: 4, win: { text: '吟味役に薄いと言われて罰金を払うのは、ほとんど税金だ。女たちは裁判の日、順に並んで払って帰る。それでも残る。', add: ['brewing'] }, lose: { text: '夏に全部酸っぱくなった。' } },
    right: { title: '村の女たちに混じって話を聞く', art: 'choice.approach', stake: store(1), odds: 4, win: { text: '台所は裁判より詳しい。どこの誰が独り身か、よく分かった。', meet: true }, lose: { text: '話の種にされただけだった。' } } },
  { id: 'mo.market', frame: 'path', ages: [16, 45], axis: 'money', lacks: ['trade'], title: 'ベリーの市', story: 'ベリーの市に、持ち主の死んだ屋台が空いている。町の者は僧院と百年喧嘩をしているが、僧院は地代が欲しいから、誰が来ても聞かない。', art: 'scene.market',
    left: { title: '畑を担保に屋台を出す', art: 'choice.shop', stake: risk('kind:田'), odds: 3, win: { text: '羊毛と塩を並べた。銀貨が、畑よりずっと早く増える。', add: ['trade'], store: 2 }, lose: { text: '屋台の下に置いた金ごと、夜に消えた。畑は取られた。', add: ['debt'] } },
    right: { title: '市の酒場で人に会う', art: 'choice.approach', stake: store(1), odds: 4, win: { text: '向かいの席の人と、三杯目で話が合った。', meet: true }, lose: { text: '勘定だけ合わなかった。' } } },
  // W7: サフォークは土地の売買が盛んで、半エーカー単位で動く。W9: ジョン・ロブウッドは家と 14 エーカーで死んだ
  { id: 'mo.acre', frame: 'path', ages: [18, 60], axis: 'money', repeat: false, title: '半エーカーの売り物', story: 'この土地では、畑は裁判の前で羊皮紙一行で動く。死んだ男の息子が、半エーカーを売りたいと立っている。今年は買い手のほうが少ない。', art: 'scene.market',
    left: { title: '買って畑をつなげる', art: 'choice.paddy', stake: store(6), odds: 4, win: { text: '十エーカーを超える者は、村でそう多くなかった。去年までは。', add: ['newfield'] }, lose: { text: '入る金を払ったところで、親類が出てきた。' } },
    right: { title: '買わずに裁判の書記に飲ませる', art: 'choice.tea', stake: store(1), odds: 4, win: { text: '誰の畑がいつ空くか、書記は全部知っていた。', store: 1 }, lose: { text: '飲むだけ飲んで、書記は何も言わなかった。' } } },
  { id: 'mo.horse', frame: 'path', ages: [18, 45], axis: 'money', lacks: ['horse'], title: '荷馬の売り物', story: '馬喰が、死んだ商人の馬を連れてきた。牛で畑を耕す村で、馬は贅沢だ。ただ、馬なら市まで半日で行ける。', art: 'scene.horse',
    left: { title: '馬を買う', art: 'choice.buyhorse', stake: store(2), odds: 5, win: { text: '馬で荷を運び、稼ぎが増えた。死亡税の的も増えた。', add: ['horse'] }, lose: { text: '歯を見るのを忘れた。歯がなかった。' } },
    right: { title: '教会の窓に寄付する', art: 'choice.donate', stake: store(1), odds: 5, win: { text: '窓の下に小さく名が入った。', add: ['temple'] }, lose: { text: '窓は大風で割れた。' } } },
  { id: 'mo.storehouse', frame: 'path', ages: [25, 55], axis: 'money', needs: ['trade'], lacks: ['storehouse'], title: '石の納屋', story: '商いの儲けで、火にも水にも強い石の納屋が建てられそうだ。隣の藁屋根が燃えても、中の羊毛は残る。', art: 'scene.storehouse',
    left: { title: '石の納屋を建てる', art: 'choice.build', stake: store(3), odds: 4, win: { text: '村で教会の次に硬い建物が、あなたのものになった。', add: ['storehouse'] }, lose: { text: '石工がノリッジの大聖堂へ行ってしまった。賃金が違う。' } },
    right: { title: '家族に染めた布を買う', art: 'choice.kimono', stake: store(2), odds: 5, win: { text: '赤い頭巾の女たちが、教会でうちの者を見た。', add: ['familyjoy'] }, lose: { text: '一度洗うと、灰色になった。' } } },
  { id: 'mo.lend', frame: 'path', ages: [25, 60], axis: 'money', needs: ['storehouse'], title: '麦を貸す', story: '隣村の者が、春の種麦を貸してほしいと来た。教会は利子を禁じている。「秋に一袋半」は利子ではない、と裁判の書記は言う。', art: 'scene.lend',
    left: { title: '秋に一袋半で貸す', art: 'choice.usury', stake: riskStore(2), odds: 3, win: { text: '納屋が満ちた。', store: 5 }, lose: { text: '借りた家は、秋にはもう、なかった。' } },
    right: { title: '秋に一袋で貸す', art: 'choice.kindloan', stake: store(1), odds: 5, win: { text: '恩というものは、麦より長持ちする。', add: ['villagetrust'] }, lose: { text: '借りた男は、村から消えた。' } } },
  { id: 'mo.debt', frame: 'demand', ages: [16, 75], repeat: true, needs: ['debt'], demand: true, ignore: { label: '借金がふくらむ', effect: { text: '次の裁判まで放っておいた。借金がふくらんだ。', add: ['debt'] } }, title: '裁判の借金', story: '裁判で、借金の件が読み上げられた。今年は三度目だ。', art: 'scene.debt',
    left: { title: '畑を渡して返す', art: 'choice.payland', stake: spend('kind:田'), odds: 6, win: { text: '羊皮紙一行で、借金と畑が消えた。', remove: ['debt'] } },
    right: LOTTERY },

  // ── ラブ
  { id: 'lo.meet', frame: 'path', ages: [16, 55], repeat: true, axis: 'love', title: '出会い', story: '見知らぬ人と目が合った。', art: 'scene.meet',
    left: { title: '声をかける', art: 'choice.approach', stake: store(1), odds: 5, win: { text: '次の市の日に、また会う約束をした。', add: ['lover.alewife'] }, lose: { text: 'エールを一杯おごって、それきりだった。' } },
    right: { title: '教会エールの世話役を買って出る', art: 'choice.festival', stake: body(), odds: 5, win: { text: '樽を二つ空にして、誰も死ななかった。頼られた。', add: ['villagetrust'] }, lose: { text: '樽の栓を閉め忘れて、年寄りに叱られた。' } } },
  { id: 'lo.visit', frame: 'path', axis: 'love', ages: [16, 55], repeat: true, needsAny: LOVERS, title: '会いに行く', story: '縁を結んだ人のもとへ、足を運ぶ。', art: 'scene.visit',
    left: { title: '贈り物を持って行く', art: 'choice.approach', stake: store(1), odds: 4, win: { text: '話が尽きなかった。死んだ人の話を、初めて笑ってできた。' }, lose: { text: '留守だった。' } },
    right: { title: '仕事を切り上げて行く', art: 'choice.back', stake: body(), odds: 5, win: { text: '顔を見せ、縁をつないだ。' }, lose: { text: '行き違いになった。' } } },
  // 教会の戸の前で互いに誓えば結婚が成立した（史実）。だから裁判にも「誓った」「誓っていない」の争いが多い
  { id: 'lo.marry', frame: 'family', ages: [18, 60], repeat: true, axis: 'love', needsAny: LOVERS, title: '教会の戸の前', story: '家の者は、畑のある家との縁談を勧める。だが戸の前で二人が誓えば、司祭でも止められない。', art: 'scene.marry',
    left: { title: '想い人と誓う', art: 'choice.lovematch', stake: store(1), odds: 4, win: { text: '想い人と夫婦になった。', add: ['spouse'] }, lose: { text: '親類とは気まずくなったが、夫婦になった。', add: ['spouse'] } },
    right: { title: '畑のある家と縁組する', art: 'choice.arranged', stake: store(1), odds: 6, win: { text: '向こうの家の畑が一筋、付いてきた。', add: ['arrangedspouse', 'newfield'] } } },
  { id: 'lo.arranged', frame: 'family', ages: [20, 60], repeat: true, title: '縁談', story: '荘役が縁談を持ってきた。夫を亡くして畑を一人で耕している人だ。畑に手がいる。あなたにも手はある。', art: 'scene.arranged',
    left: { title: '受ける', art: 'choice.accept', stake: store(1), odds: 6, win: { text: '夫婦になった。畑の話から始まった結婚にしては、よく笑う人だった。', add: ['arrangedspouse'] } },
    right: { title: '断って町へ想い人を探しに出る', art: 'choice.seek', stake: riskBody(), odds: 3, win: { text: 'ベリーで出会いがあった。', meet: true }, lose: { text: '町で財布を取られ、縁談も宙に浮いた。' } } },
  // 姦淫の罰金（leyrwite）は荘園裁判の定番で、女の側に課された（史実）。この札は主人公の側から書く
  { id: 'lo.mistress', frame: 'family', ages: [22, 60], repeat: true, title: '内縁の話', story: '蓄えがあると、人も寄ってくる。「結婚はできないが、納屋の二階なら空いている」と言ってみたくなる相手がいる。', art: 'scene.mistress',
    left: { title: '家を借りてやる', art: 'choice.accept', stake: store(2), odds: 5, win: { text: '裁判の書記が、書く手を止めずにあなたを見た。', add: ['mistress'] }, lose: { text: '噂が先に立ち、話は流れた。' } },
    right: { title: '同じ蓄えで納屋を建てる', art: 'choice.build', stake: riskStore(3), odds: 4, win: { text: '石の納屋が建った。', add: ['storehouse'] }, lose: { text: '石工に金を持ち逃げされた。' } } },
  { id: 'lo.keeplover', frame: 'path', ages: [20, 60], repeat: true, axis: 'love', title: '想い人を囲う', story: '想い人が、そばに置いてほしいと言う。', art: 'scene.mistress',
    left: { title: '家を借りてやる', art: 'choice.accept', stake: store(2), odds: 5, win: { text: 'もう通わなくてよくなった。', add: ['mistress'] }, lose: { text: '家の者に知られ、話は流れた。' } },
    right: { title: '同じ金を羊毛に回す', art: 'choice.market', stake: riskStore(2), odds: 4, win: { text: '羊毛が上がった。', store: 5 }, lose: { text: '銭は戻らなかった。' } } },
  // W4, W5: 1349 年 11 月に後家 8 人と相続した女 2 人が再婚。クランマー家の畑は姉妹オリーヴとヒラリーに渡り、ホーズ兄弟に嫁いだ
  { id: 'lo.widows', frame: 'path', years: [1350, 1360], ages: [20, 30], weight: 40, axis: 'love', title: '十一月の十人', story: 'あの年の十一月の裁判のころには、後家が八人と、畑を継いだ娘が二人、もう嫁いでいた。クランマーの姉妹はホーズの兄弟と話がついた。畑を持った女たちが、裁判の帰り道を歩いている。悲しむ暇を、誰も持っていない。', art: 'scene.meet',
    left: { title: '夫を亡くした人に声をかける', art: 'choice.approach', stake: body(), odds: 4, win: { text: '「畑を見に来る？」と言われた。畑の話ではなかった。', add: ['lover.widow'] }, lose: { text: '「三人目に言われたわ」と言われた。' } },
    right: { title: '手伝いの賃金で畑を分けてもらう', art: 'choice.till', stake: body(2), odds: 4, win: { text: '話は銭で済んだ。女の畑の端が、自分の畑になった。', add: ['newfield'] }, lose: { text: '向こうのほうが勘定が早かった。' } } },
  { id: 'lo.affair', frame: 'path', ages: [22, 55], repeat: true, axis: 'love', needsAny: ['spouse', 'arrangedspouse'], title: '五月の夜の誘い', story: '五月の夜、森へ向かう人の流れの中で、誰かが袖を引いた。', art: 'scene.affair',
    left: { title: '誘いに乗る', art: 'choice.affair', stake: riskStore(1), odds: settings.affairOdds, win: { text: '朝、頭に白い花びらがついていた。浮名が立った。', add: ['affair'] }, lose: { text: '次の裁判で名が読まれ、罰金を払った。連れ合いの実家が来た。', add: ['rumor'], conflict: true } },
    right: { title: '教会の庭の組み打ちに出る', art: 'choice.sumo', stake: riskBody(), odds: 4, win: { text: '賞の雄羊を担いで帰った。', add: ['wrestling', 'villagetrust'] }, lose: { text: '庭の外まで投げられた。' } } },
  { id: 'lo.divorce', frame: 'family', ages: [22, 60], repeat: true, title: '別れの話', story: '裁判で名が読まれるのが重なり、夫婦の間に溝ができた。教会は別れを認めない。だが別の家に住むことまでは止めない。', art: 'scene.divorce',
    left: { title: '家の者と話し合う', art: 'choice.home', stake: store(2), odds: 4, win: { text: '話をつけ、夫婦の縁を保った。', remove: ['rumor'], settle: true }, lose: { text: '話し合いはまとまらなかった。', remove: ['rumor'], settle: true } },
    right: { title: '別の家に住む', art: 'choice.seek', stake: riskBody(), odds: 4, win: { text: '連れ合いは実家へ帰った。', divorce: true }, lose: { text: '別れはひとまず思いとどまった。' } } },
  { id: 'ch.seven', frame: 'family', ages: [20, 75], repeat: true, title: '子の手習い', story: '子が七つになった。', art: 'scene.child.seven',
    left: { title: '司祭に預けて字を習わせる', art: 'choice.temple', stake: store(1), odds: 5, win: { text: '子が字を覚えはじめた。農奴の子を学校に入れるには領主の許しが要る。今はだれも来ない。', add: ['childletters'] }, lose: { text: '教会になじめず、戻ってきた。' } },
    right: { title: 'がちょう番をさせる', art: 'choice.rice', stake: body(), odds: 6, win: { text: '小さな手が畑仕事を覚えた。', add: ['childhands'] } } },
  { id: 'ch.fifteen', frame: 'family', ages: [20, 75], repeat: true, title: '子の行く末', story: '子が十五になった。', art: 'scene.child.fifteen',
    left: { title: '畑を分けて家に残す', art: 'choice.paddy', stake: store(2), odds: 5, win: { text: '畑を分け、家のそばに住まわせた。', add: ['branchhouse'] }, lose: { text: '分ける畑が足りず、話は先送りになった。' } },
    right: { title: 'ベリーの親方へ徒弟に出す', art: 'choice.migrate', stake: body(), odds: 4, win: { text: '子はベリーの親方に預けられた。七年の約束だ。', sendChild: true, add: ['childaway'] }, lose: { text: '親方が死んでいた。戻ってきた。' } } },
  { id: 'lo.child', frame: 'family', ages: [19, 42], repeat: true, needsAny: ['spouse', 'arrangedspouse', 'mistress'], title: '子が生まれる', story: '連れ合いが身ごもった。', art: 'scene.childbirth',
    left: { title: '盛大に祝う', art: 'choice.celebrate', stake: store(2), odds: 6, win: { text: '名付け親を三人頼み、村中で祝った。', add: ['child', 'villagetrust'] } },
    right: { title: '静かに迎える', art: 'choice.quietbirth', stake: body(), odds: 5, win: { text: '元気な子が生まれた。', add: ['child'] }, lose: { text: 'お産は難しく、子は育たなかった。' } } },
  { id: 'lo.poem', frame: 'path', ages: [20, 55], axis: 'love', needs: ['reading'], title: '代筆の恋文', story: '読み書きができると知った村の若者が、恋文の代筆を頼みに来た。相手の名を聞くと、あなたも知っている人だった。', art: 'scene.letter',
    left: { title: '自分の言葉で書いてしまう', art: 'choice.reply', stake: store(1), odds: 3, win: { text: '返事は、若者ではなくあなた宛てに来た。', add: ['affair'] }, lose: { text: '筆跡でばれて、若者に殴られた。' } },
    right: { title: '教区の書記に歌を習う', art: 'choice.poetry', stake: store(1), odds: 5, win: { text: '聖歌の席に呼ばれるようになった。', add: ['temple'] }, lose: { text: 'あなたの声は、ラテン語に向いていなかった。' } } },

  // ── スローライフ
  { id: 'sl.garden', frame: 'path', ages: [25, 60], axis: 'slow', lacks: ['garden'], title: '家の裏の土地', story: '家の裏の、死んだ隣人の土地が空いている。誰も文句を言う人がいない。', art: 'scene.garden',
    left: { title: 'ねぎとキャベツを植える', art: 'choice.plant', stake: body(), odds: 5, win: { text: '朝、ねぎを抜いて食べる。王より良い暮らしだ。', add: ['garden'] }, lose: { text: '隣の豚が全部知っていた。' } },
    right: { title: '畑に鋤き込む', art: 'choice.cultivate', stake: body(2), odds: 4, win: { text: '小さな畑になった。', add: ['newfield'] }, lose: { text: '掘ると、人の骨が出た。そのまま埋め戻した。' } } },
  { id: 'sl.hives', frame: 'path', ages: [20, 65], axis: 'slow', lacks: ['bees'], title: '藁の巣', story: '春、巣分かれした蜂が、庭の梨の枝に塊になっている。', art: 'scene.fishing',
    left: { title: '藁の巣に落とす', art: 'choice.fishing', stake: riskBody(), odds: 4, win: { text: '夕方、塊は巣の中に入った。今年は蜂蜜でエールが作れる。', add: ['bees'] }, lose: { text: 'まぶたに来た。' } },
    right: { title: '手を出さず、畑へ戻る', art: 'choice.chores', stake: body(), odds: 5, win: { text: '蜂は飛び去ったが、畑は進んだ。', store: 1 }, lose: { text: '畑は進まず、蜂は隣へ行った。' } } },
  { id: 'ie.retire', frame: 'family', family: true, ages: [55, 65], needsAny: ['grownchild', 'heir'], title: '家を譲る日', story: '跡取りも育ち、畑を任せる頃合いになった。', art: 'scene.hermit',
    left: { title: '長子に家を譲る', art: 'choice.inherit', odds: 6, win: { text: '裁判で家を長子に譲り、隠居した。', retire: 'inherit' } },
    right: { title: '子らに畑を分ける', art: 'choice.inherit', odds: 6, win: { text: '畑を子らに分け、家が増えた。', retire: 'divide', houseDown: true, add: ['branchhouse'] } } },
  { id: 'sl.eel', frame: 'path', ages: [20, 70], axis: 'slow', repeat: true, title: 'うなぎの朝', story: '朝もやの小川。夜のうちに沈めたかごを上げる。', art: 'scene.fishing',
    left: { title: 'かごを上げに行く', art: 'choice.fishing', stake: body(), odds: 5, win: { text: 'うなぎが三本。金曜日が楽しみになる。', add: ['bees'] }, lose: { text: 'かごごと、誰かが持っていった。' } },
    right: { title: '溝の掃除を片づける', art: 'choice.chores', stake: body(), odds: 5, win: { text: '裁判に名が出ないのが、一番の報酬だ。', store: 1 }, lose: { text: 'それでも名が出た。' } } },

  // ── ストレングス
  { id: 'sr.master', frame: 'path', ages: [16, 35], axis: 'strength', lacks: ['master'], title: '片目の長弓兵', story: 'クレシーから帰った片目の男が、エール一杯で弓の引き方を語っている。体ごと弓の中に入るのだという。', art: 'scene.swordsman',
    left: { title: '弟子入りする', art: 'choice.apprentice', stake: lock('kind:田', 2), odds: 4, delay: 2, win: { text: '二年で肩の骨の形が変わった。百歩で的の真ん中に立つ矢を覚えた。', add: ['master'] }, lose: { text: 'エールの代金だけ増えて、男は死んだ。' } },
    right: { title: '話だけ聞いて帰る', art: 'choice.watchduel', stake: body(), odds: 5, win: { text: 'ベリーの話も聞いた。', add: ['citygossip'] }, lose: { text: '同じ話を三度された。' } } },
  { id: 'sr.duel', frame: 'fight', ages: [20, 42], axis: 'strength', needs: ['longbow'], title: 'ベリーの雄羊', story: 'ベリーの聖エドマンドの祭りで、組み打ちの賞に雄羊が出る。去年の勝者は、相手の首を折った。', art: 'scene.dojo',
    left: { title: '土俵に上がる', art: 'choice.dojo', stake: riskBody(3), odds: 3, win: { text: '雄羊を担いで教会の前を歩いた。', add: ['merit.ram'] }, lose: { text: '首の音が、自分の中から聞こえた。', die: true } },
    right: { title: '弓場で矢を飛ばす', art: 'choice.kata', stake: body(), odds: 6, win: { text: '誰とも戦わない日も、弓は引ける。', add: ['strongbody'] } } },
  { id: 'sr.bandits', frame: 'fight', ages: [18, 45], axis: 'strength', title: '森の追捕', story: '人の悲鳴が聞こえたら、村の男は全員、追わなければならない。追わなければ村ごと罰金だ。今夜の相手は、弓を持っている。', art: 'scene.bandits',
    left: { title: '先頭で森に入る', art: 'choice.hunt', stake: riskBody(2), odds: 3, win: { text: '男は木に登っていた。州長官が礼状をよこした。', add: ['merit.outlaws', 'villagetrust'] }, lose: { text: '暗い森で、矢の音だけが聞こえた。', die: true } },
    right: { title: '罰金を出して家にいる', art: 'choice.market', stake: store(2), odds: 5, win: { text: '麦を売ってきた帰りだった。損はなかった。', store: 3 }, lose: { text: '翌日、人々の目が冷たかった。' } } },
  { id: 'sr.disciple', frame: 'path', ages: [30, 60], axis: 'strength', needs: ['master'], lacks: ['disciple'], title: '弓の弟子', story: '少年が、毎週日曜に弓場の裏にいる。かつての自分のように。', art: 'scene.disciple',
    left: { title: '古い弓を渡して教える', art: 'choice.teach', stake: store(1), odds: 5, win: { text: '少年の指に、同じ線ができた。', add: ['disciple'] }, lose: { text: '少年は、戦場の話だけ聞いて三日で消えた。' } },
    right: { title: '追い返して菜園に戻る', art: 'choice.refuse', stake: body(), odds: 5, win: { text: '戦を知る者は、戦を教えない。ねぎがよく育った。', add: ['garden'] }, lose: { text: '少年は次の日曜もいた。' } } },
  { id: 'sr.train', frame: 'path', ages: [15, 45], axis: 'strength', repeat: true, title: '朝の弦', story: '夜明け前。ミサの前に、十本は引ける。', art: 'scene.training',
    left: { title: '弓を引く', art: 'choice.drill', stake: riskBody(), odds: 4, win: { text: '左肩が一回り大きくなった。', add: ['strongbody'] }, lose: { text: '筋を痛めた。' } },
    right: { title: '畑の水を見に行く', art: 'choice.water', stake: body(), odds: 5, win: { text: '畑は順調だ。', store: 1 }, lose: { text: '溝が崩れて、一日つぶれた。' } } },

  // ── 祈り
  // C1: ノリッジ教区の聖職者は 2,000 人以上死に、司教は一度に 20 人を任命し、教皇は年齢に満たない 60 人の叙階を許した。寡夫の叙階は記憶
  { id: 'fa.clerk', frame: 'path', ages: [16, 45], axis: 'faith', lacks: ['temple'], title: '空いた席', story: 'イクスワースの小修道院が、代わりの司祭を送ってきた。十九歳で、ラテン語の綴りを間違える。ミサの返事ができる者が、もう村に何人もいない。', art: 'scene.temple',
    left: { title: '聖堂の手伝いを買って出る', art: 'choice.sweep', stake: body(), odds: 5, win: { text: '蝋燭の始末と、祈りの順番を覚えた。', add: ['temple'] }, lose: { text: '燭台を倒した。絵の聖人が少し焦げた。' } },
    right: { title: '手伝いの間に畑の話を聞く', art: 'choice.chores', stake: body(), odds: 4, win: { text: '司祭は、誰の畑が空いたかを全部知っていた。', store: 2 }, lose: { text: '聞かれていたのは、こっちの懐だった。' } } },
  { id: 'fa.guild', frame: 'path', ages: [20, 55], axis: 'faith', needsAny: ['temple', 'bellrope'], lacks: ['guild'], title: '聖体のギルド', story: '死ぬと誰も祈ってくれない。だから村の者が組を作り、死んだ仲間のために蝋燭を立て、年に一度エールを飲む。ベリーの本部の帳面に載る。', art: 'scene.kishin',
    left: { title: '組に入る', art: 'choice.memorial', stake: store(2), odds: 4, win: { text: '誰かが、自分の死んだあとも名前を読むことになった。', add: ['guild'] }, lose: { text: '組の金庫番が、金庫ごと疫病で死んだ。' } },
    right: { title: '組の宴の樽を引き受ける', art: 'choice.market', stake: store(1), odds: 4, win: { text: '町の宴に出したエールが評判になった。', add: ['brewing'] }, lose: { text: '酸っぱかった。信仰が試された。' } } },
  // ウォルシンガムは東イングランド最大の巡礼地（史実）
  { id: 'fa.walsingham', frame: 'path', ages: [18, 70], axis: 'faith', lacks: ['walsingham'], title: 'ウォルシンガムへ', story: '北へ五十マイル、聖母の家の写しがある。春の裏作の前なら、歩いて行って帰って来られる。', art: 'scene.ise',
    left: { title: '裸足で最後の一マイルを歩く', art: 'choice.pilgrim', stake: riskBody(2), odds: 4, win: { text: '鉛のバッジを帽子につけた。誰に許されたのかは分からないが、許された気がした。', add: ['walsingham'] }, lose: { text: '途中の宿で熱を出した。' } },
    right: { title: '巡礼の一行に羊毛を売る', art: 'choice.market', stake: store(1), odds: 4, win: { text: '聖地の近くでは、何でも二倍で売れる。', store: 3 }, lose: { text: '聖地の近くでは、何でも二倍で買わされる。' } } },
  { id: 'dm.tithe', frame: 'demand', ages: [20, 70], repeat: true, needs: ['temple'], demand: true, ignore: { label: '教会の縁を失う', effect: { text: '十分の一を聞き流し、次のミサの説教が自分の話だった。', remove: ['temple'] } }, title: '十分の一', story: '司祭が、麦の束の十本目を数えに来た。今年は屋根も直すという。', art: 'scene.kishin',
    left: { title: '束を差し出す', art: 'choice.memorial', stake: store(2), odds: 6, win: { text: '帳面に、祈祷を頼む名が載った。', add: ['chantry'] } },
    right: LOTTERY },

  // ── 晩年
  { id: 'old.grandchild', frame: 'family', ages: [46, 70], needsAny: ['child', 'grownchild'], title: '子の子', story: '子に子が生まれた。あなたの親の世代で、ここまで生きた者はいない。', art: 'scene.grandchild',
    left: { title: '抱いて歩く', art: 'choice.play', stake: body(), odds: 6, win: { text: '軽いものだ、と思った。', add: ['familyjoy'] } },
    right: { title: 'あの春の話をする', art: 'choice.tell', stake: store(1), odds: 6, win: { text: '話しはじめて、話せないことに気づいた。', add: ['oldtales'] } } },
  { id: 'old.will', frame: 'family', ages: [55, 75], title: '遺言', story: '読み書きができなくても、死の床で司祭に言えば遺言になる。先のことを考える年になった。', art: 'scene.will',
    left: { title: '財を子らに分ける', art: 'choice.inherit', stake: store(3), odds: 6, win: { text: '子らは揉めずに済んだ。今のところ。', add: ['familyjoy'] } },
    right: { title: '毎年の祈りを買う', art: 'choice.offering', stake: store(3), odds: 6, win: { text: '百年分の万霊節に、名が読まれることになった。', add: ['chantry', 'villagetrust'] } } },
  { id: 'old.back', frame: 'recovery', ages: [48, 75], repeat: true, title: '朝の腰', story: '朝、腰が伸びない。鋤が急に重くなった。', art: 'scene.backpain',
    left: { title: '町の薬屋の高い膏薬を買う', art: 'choice.medicine', stake: store(2), odds: 5, win: { text: '何が入っているかは聞かないことにした。効いた。', body: 2 }, lose: { text: '効かなかった。臭いだけ残った。' } },
    right: { title: '我慢して働く', art: 'choice.bearit', stake: riskBody(), odds: 3, win: { text: 'なんとかなった。', store: 1 }, lose: { text: '寝込んだ。' } } },

  // 求める札: 片側に来て、もう片側はその年のくじの札
  // 賦役（week-work、boon-work）は農奴の義務（史実）。疫病のあとで金に替える荘園が増えた
  { id: 'dm.boon', frame: 'demand', ages: [16, 65], repeat: true, needs: ['bondage'], demand: true, ignore: { label: '村の信頼を失う', effect: { text: '賦役に出ず、裁判で名を読まれた。', remove: ['villagetrust'], add: ['shirk'] } }, title: '賦役の鐘', story: '領主の麦が熟れた。自分の畑を置いて、明日から三日、領主の畑に出ろと鐘が言っている。今年は人が少ないので、三日では済まない。', art: 'scene.fushin',
    left: { title: '鎌を持って出る', art: 'choice.work', stake: body(2), odds: 6, win: { text: '領主の麦を刈った。最後の日に肉が出た。', add: ['villagetrust'] } },
    right: LOTTERY },
  // 裕福な農夫に、領主の臨時の金や王の税が集まる（史実の大筋）
  { id: 'dm.aid', frame: 'demand', ages: [20, 65], repeat: true, needsAny: ['archer', 'reeve', 'storehouse', 'shop'], demand: true, ignore: { label: '執事ににらまれる', effect: { text: '出し渋った。執事が、あなたの囲いの羊を数えて帰った。', add: ['lordgrudge'] } }, title: '領主の援助金', story: '領主の息子がフランスで捕まり、身代金が要るという。騎士の体面にも、値段がある。', art: 'scene.goyokin',
    left: { title: '金を出す', art: 'choice.pay', stake: store(5), odds: 6, win: { text: '帳面に名が載った。騎士の家は、農夫に借りを作るのが嫌いだが。', add: ['aidroll'] } },
    right: LOTTERY },
  // W8: 地代は銭、鶏、卵、からす麦。払えなければ畑が痩せる。持っている畑が多いほど払う話として、繰り返し来る銭の使い道にした（値は Claude の仮置き）
  { id: 'dm.rent', frame: 'demand', ages: [18, 75], repeat: true, cooldown: 2, needs: ['kind:田'], demand: true, ignore: { label: '鶏を隠して、畑の段が一つ下がる', effect: { text: '地代を値切った。執事は来年の種麦の話を、しなくなった。畑の段が一つ下がった。', levelDown: 'strips' } }, title: '銀貨と鶏と卵とからす麦', story: '聖ミカエル祭。執事が帳面を持って通りを東から西へ歩いてくる。銀貨はいくら、鶏は何羽、卵は何個、からす麦は何袋。鶏の首を持って重さを量っている。', art: 'scene.goyokin',
    left: { title: '全部そろえて差し出す', art: 'choice.pay', stake: store(4), odds: 6, win: { text: '今年の分が帳面で消えた。来年の分が帳面に書かれた。' } },
    right: LOTTERY },
  // W8: 畑に入るときの金。畑が増えるほど来る。蓄えの使い道（釣り合いのつまみとして値は Claude の仮置き）
  { id: 'dm.entry', frame: 'demand', ages: [20, 70], repeat: true, cooldown: 3, needs: ['newfield'], demand: true, ignore: { label: '死んだ家の畑を手放す', effect: { text: '入る金を払わなかった。畑は次の名前で羊皮紙に書かれた。', remove: ['newfield'] } }, title: '入る金', story: '死んだ家の畑に入ったとき、誰も入る金の話をしなかった。人が戻ってきたので、執事が思い出したらしい。', art: 'scene.goyokin',
    left: { title: '入る金を払う', art: 'choice.pay', stake: store(8), odds: 6, win: { text: '羊皮紙の名が、やっと自分のものになった。', add: ['aidroll'] } },
    right: LOTTERY },
  // 労働者規制法の取り締まりは、平和判事の裁判として実際に数千件ある（史実）
  { id: 'dm.fine', frame: 'demand', ages: [20, 65], repeat: true, years: [1352, 1395], needs: ['statute'], demand: true, ignore: { label: '足かせに座る', effect: { text: '足かせで二日、教会の前に座った。子どもたちが見に来た。', add: ['shirk'] } }, title: '労働者の裁判', story: '法の裁判が村に来た。今年の刈り入れで、誰がいくらもらったかを問うている。問うている側の領主も、裏で三倍払っている。', art: 'scene.bribe',
    left: { title: '罰金を払う', art: 'choice.pay', stake: store(3), odds: 6, win: { text: '罰金は日当より安かった。みな計算に入れている。', add: ['villagetrust'] } },
    right: LOTTERY },
  { id: 'dm.inlaw', frame: 'demand', ages: [22, 60], repeat: true, needsAny: ['spouse', 'arrangedspouse'], demand: true, ignore: { label: '連れ合いの実家と揉める', effect: { text: '無心を断り、連れ合いの実家と揉めた。', conflict: true } }, title: '実家の無心', story: '連れ合いの実家から、死亡税の金を工面してほしいと頼まれた。死ぬたびに金がかかる世だ。', art: 'scene.inlaw',
    left: { title: '無心に応じる', art: 'choice.pay', stake: store(2), odds: 6, win: { text: '実家に銀貨を送った。連れ合いが、夜に何も言わなかった。それが礼だ。', add: ['familyjoy'] } },
    right: LOTTERY },
  // ── 回復
  { id: 'rec.well', frame: 'recovery', ages: [20, 75], repeat: true, tired: true, title: '聖なる泉', story: '山のふもとに、聖女の泉がある。足の悪い者が歩いて帰ってきたと、歩いて帰ってきた者が言っている。', art: 'scene.hotspring',
    left: { title: '泉まで行く', art: 'choice.hotspring', stake: store(2), odds: 6, win: { text: '水は冷たく、体が軽くなった。', body: 3 } },
    right: { title: '働き続ける', art: 'choice.work', stake: body(), odds: 5, win: { text: '休まず働いた。日当がいいうちに。', store: 2 }, lose: { text: '無理がたたって寝込んだ。' } } },
  { id: 'rec.delegate', frame: 'recovery', ages: [30, 75], repeat: true, tired: true, needs: ['grownchild'], title: '仕事を任せる', story: '育った子が、畑を見ると言っている。', art: 'scene.delegate',
    left: { title: '子に任せて休む', art: 'choice.delegate', stake: lock('grownchild', 2), odds: 6, win: { text: '子に畑を任せ、体を休めた。', body: 3 } },
    right: { title: '自分でやる', art: 'choice.work', stake: body(), odds: 6, win: { text: '畑は自分の手で守った。', store: 1 }, lose: { text: '' } } },
  { id: 'rec.medicine', frame: 'recovery', ages: [15, 75], repeat: true, tired: true, title: '薬草の老婆', story: '村はずれの老婆が、薬草と祈りを混ぜたものを売っている。司祭は眉をひそめ、司祭の母は買いに来る。', art: 'scene.medicine',
    left: { title: '自分の薬を買う', art: 'choice.medicine', stake: store(), odds: 4, win: { text: '苦かった。効いた。', body: 2 }, lose: { text: '苦かった。' } },
    right: { title: '薬に頼らず働く', art: 'choice.work', stake: body(), odds: 6, win: { text: '薬に頼らず働いた。', store: 1 } } },

  // ── 建てる・磨く
  { id: 'build.newfield', frame: 'build', ages: [16, 60], repeat: true, max: { fieldId: 'newfield', count: 2 }, title: '誰も来ない畑', story: '村はずれに、耕す者のいなくなった畑が草に沈んでいる。', art: 'scene.market',
    left: { title: '草を起こして耕す', art: 'choice.till', cost: { body: 2, store: 1 }, odds: 4, win: { text: '死んだ家の畑が、また畑になった。', add: ['newfield'] }, lose: { text: '二年放った草は、鋤より強い。' } },
    right: { title: '畑の隅に小屋を結ぶ', art: 'choice.hermit', cost: { body: 1 }, odds: 5, win: { text: '夕方ひとりでいられる場所が一つできた。', add: ['garden'] }, lose: { text: '雨で流れた。' } } },
  { id: 'build.pond', frame: 'build', ages: [18, 60], repeat: true, needs: ['kind:田'], lacks: ['fishpond'], title: '魚の池', story: '不作の年に備えて、低い畑を掘って魚を入れようという話が出た。金曜に肉を食えないのだから、魚はいつでも売れる。', art: 'place.pond',
    left: { title: '池を掘る', art: 'choice.till', cost: { body: 2, store: 2 }, odds: 4, win: { text: '鯉の池ができた。', add: ['fishpond'] }, lose: { text: '水が溜まらなかった。' } },
    right: { title: '溝掃除に人手を出す', art: 'choice.attend', cost: { body: 1 }, odds: 5, win: { text: '溝がきれいになり、頼られた。', add: ['villagetrust'] }, lose: { text: '泥を運んで腰を痛めた。' } } },
  { id: 'build.well', frame: 'build', ages: [15, 60], repeat: true, lacks: ['well'], title: '井戸の話', story: '小川まで水を汲みに行くのが毎朝の仕事だ。上流で誰かが羊を洗っている。', art: 'place.well',
    left: { title: '井戸を掘る', art: 'choice.till', cost: { store: 2 }, odds: 4, win: { text: '井戸から水が出た。', add: ['well'] }, lose: { text: '掘っても水が出なかった。' } },
    right: { title: '小川へ汲みに通う', art: 'choice.water', cost: { body: 1 }, odds: 6, win: { text: '水汲みで足腰が強くなった。', add: ['strongbody'] } } },
  { id: 'build.shop', frame: 'build', ages: [20, 60], repeat: true, needs: ['trade'], lacks: ['shop'], title: '毛織りの店', story: 'フランドルの織工が、ベリーの近くに逃れてきている。羊毛を売るより、布にして売るほうが手元に残る。', art: 'work.shop',
    left: { title: '畑を担保に織機を入れる', art: 'choice.market', cost: { store: 8 }, stake: risk('kind:田'), odds: 4, win: { text: '織機が二台、音を立て始めた。', add: ['shop'] }, lose: { text: '織工が別の親方へ行った。担保の畑を取られた。' } },
    right: { title: '行商でベリーに顔を売る', art: 'choice.market', cost: { body: 1 }, odds: 5, win: { text: '町で名を覚えられた。', add: ['citygossip'], store: 1 }, lose: { text: '売れ残った。' } } },
  // 荘園の粉挽きは領主の権利（史実）。農夫が風車を持てるのは、領主から借りる形（推測）
  { id: 'build.mill', frame: 'build', ages: [20, 60], repeat: true, needs: ['villagetrust'], lacks: ['mill'], title: '風車の借り手', story: '領主の風車の粉屋が死んだ。「黄金の親指」のあとを継ぐ者を、領主が探している。', art: 'work.ferry',
    left: { title: '風車を借り受ける', art: 'choice.market', cost: { store: 8 }, stake: spend('villagetrust'), odds: 5, win: { text: '村じゅうの麦がここを通る。あなたの親指は黄金か。', add: ['mill'] }, lose: { text: '大風で羽根が飛んだ。' } },
    right: { title: '風車の用心棒をする', art: 'choice.guard', cost: { body: 1 }, odds: 4, win: { text: '酔った男を堀に投げ込んだ。', add: ['strongbody'] }, lose: { text: '投げ込まれた。' } } },
  { id: 'build.servant', frame: 'build', ages: [25, 70], repeat: true, lacks: ['servant'], title: '雇い人', story: '両親を失った若者が、飯と寝床があれば働くと言う。規制法の額より多く払わないと、よそへ行くだろう。', art: 'place.servant',
    left: { title: '雇う', art: 'choice.hire', cost: { store: 3 }, odds: 6, win: { text: '働き手が増えた。', add: ['servant'] } },
    right: { title: '司祭に口をきいてやる', art: 'choice.temple', cost: { body: 1 }, odds: 6, win: { text: '若者は教会の下働きになった。', add: ['temple', 'villagetrust'] } } },
  // ── 静かな年
  { id: 'q.season', frame: 'quiet', quiet: true, repeat: true, ages: [7, 75], title: '静かな一年', story: '大きなことのない一年だった。死んだ者の数を、誰も数えなかった。', art: 'scene.quiet',
    left: { title: '畑を耕す', art: 'choice.till', stake: body(), odds: 6, win: { text: '麦が少し余った。', store: 1 } },
    right: { title: '家でくつろぐ', art: 'choice.rest', stake: store(1), odds: 6, win: { text: '体が休まった。', body: 2 } } },
  { id: 'q.neighbors', frame: 'quiet', quiet: true, repeat: true, ages: [15, 75], title: 'エールの席', story: '裁判のあと、皆がエールの竿の家に集まる。', art: 'scene.meeting',
    left: { title: '顔を出す', art: 'choice.attend', stake: body(), odds: 6, win: { text: '誰の畑の話か、聞けば分かった。', add: ['villagetrust'] } },
    right: { title: '休んで小川へ行く', art: 'choice.skip', stake: body(), odds: 6, win: { text: '気持ちよく昼寝した。', body: 2 } } },
  ...VIGNETTES.map(([id, ages, title, text, extra = {}]) => ({ id, frame: 'quiet', quiet: true, ages, title, story: text, art: 'scene.quiet', ...extra,
    left: { title, art: 'choice.rest', odds: 6, win: { text } }, right: { title, art: 'choice.rest', odds: 6, win: { text } } })),
];

// 上の段の札。上の段の札は、その軸で一つ下の段以上の品を持っていると来る。右は別の軸の、一つ下の段の品を取りに行く
const ladderNeeds = (axes, rung) => Object.entries(FIELD).filter(([, f]) => axes.some((axis) => (f.marks?.[axis] || 0) > 0) && (f.rung ?? f.scope ?? 1) >= rung - 1).map(([id]) => id);
const RUNG_AGES = { 3: [25, 65], 4: [35, 75] };
const rungCard = (id, axis, rung, rest) => ({ id, frame: 'path', ages: RUNG_AGES[rung], axis, needsAny: ladderNeeds([axis], rung), ...rest });
CARDS.push(
  // ── ステータス
  // 地主や有力農が陪審を務めた（史実）。農奴出身がどこまでかは推測
  rungCard('st.juror', 'status', 3, { title: '王の判事の陪審', story: '巡回の判事が、地元の事情を知る十二人を探している。王の裁きの席に、去年まで農奴だった男が座れる世になった。', art: 'scene.nanushi',
    left: { title: '陪審を引き受ける', art: 'choice.rhetoric', stake: store(3), odds: 3, win: { text: '判事はあなたの名を書き留めた。隣の州の裁判にも呼ばれるようになった。', add: ['juror'] }, lose: { text: '名家の次男に席を取られた。' } },
    right: { title: '同じ金で羊毛を押さえる', art: 'choice.shop', stake: store(3), odds: 3, win: { text: 'カレーへ渡す羊毛の札を手に入れた。', add: ['stapler'] }, lose: { text: '羊毛は、値が決まる前に湿った。' } } }),
  rungCard('st.bailiff', 'status', 3, { title: '伯の執事の鍵', story: 'サフォーク伯の荘園をいくつも回る執事が死んだ。帳簿が読めて、死者の畑の勘定ができる者は、今どこにもいない。', art: 'scene.retainer',
    left: { title: '鍵束を受け取る', art: 'choice.retainer', stake: body(), odds: 3, win: { text: '荘園を七つ歩いて回る。かつて自分の家を調べに来た男の、あの役目だ。', add: ['bailiffkey'] }, lose: { text: '伯の家中は、出自を調べるのが早かった。' } },
    right: { title: '弓兵の隊長になる話に乗る', art: 'choice.march', stake: riskBody(2), odds: 3, win: { text: '次の遠征で、国じゅうに弓の名が聞こえた。', add: ['famedbow'] }, lose: { text: '腕に矢が刺さったまま帰ってきた。', add: ['wound'] } } }),
  // 真鍮の墓板は 14 世紀後半から裕福な農夫・商人にも広がる（史実）
  rungCard('st.brass', 'status', 4, { title: '床の真鍮板', story: '教会の床に、自分の姿を彫った真鍮板を埋められる。騎士だけのものだったが、値段さえ払えば、という世の中になってきた。', art: 'rank.taisho',
    left: { title: '板を注文する', art: 'choice.rhetoric', stake: store(8), odds: 2, win: { text: '毛皮の外套を着た自分の姿の下に、「この者の魂に神の憐れみを」。農奴の子の孫が、それを踏んで祈る。', add: ['brass'] }, lose: { text: '彫り師はノリッジで死に、前金だけが消えた。' } },
    right: { title: '同じ金で国の裁判に顔を出す', art: 'choice.market', stake: store(3), odds: 3, win: { text: '判事に顔を覚えられ、陪審の席をもらった。', add: ['juror'] }, lose: { text: '門番に払って終わった。' } } }),
  // 蜂起の記録は年代記（ウォルシンガムのトマスなど、史実）に残る。農夫の名がどう残るかは推測
  rungCard('st.chronicle', 'status', 4, { title: '年代記の修道士', story: 'ベリーの僧院の修道士が、この世の出来事を書き留めている。疫病も、蜂起も。修道士に話が届く者の名だけが、後の世に残る。', art: 'scene.letters',
    left: { title: '修道士に、あの年の話をしに行く', art: 'choice.rhetoric', stake: body(), odds: 2, win: { text: '修道士は眉をひそめてから、書いた。「村の者某」のあとに、あなたの名を。', add: ['chronicle'] }, lose: { text: '修道士は、騎士の話だけを書いた。' } },
    right: { title: '僧院に畑の権利を頼みに行く', art: 'choice.market', stake: store(3), odds: 3, win: { text: '話がついた。カレーの羊毛の札が、一緒についてきた。', add: ['stapler'] }, lose: { text: '僧院は誰の話も聞かない。' } } }),
  // ── マネー
  // カレーの羊毛の指定市は 1363 年から（記憶、推測）。F6: 村の羊の比重は未確認
  rungCard('mo.staple', 'money', 3, { title: 'カレーの羊毛', story: '王は羊毛の税を取るため、全部カレーを通せと決めた。組に入れば、町の商人に負けない。農夫の羊毛も、海を渡る。', art: 'scene.market',
    left: { title: '組の札を買う', art: 'choice.shop', stake: store(6), odds: 3, win: { text: 'カレーの羊毛の鑑札をもらった。', add: ['stapler'] }, lose: { text: '船が海賊に取られた。羊毛は戻らなかった。' } },
    right: { title: '商人の娘に手紙を書く', art: 'choice.letter', stake: body(), odds: 3, win: { text: '文の行き来が、国じゅうの噂になった。', add: ['famedlove'] }, lose: { text: '娘の父が読んだ。' } } }),
  // フランドルの織工の移住は記憶（推測）。F5: サフォークの毛織物が大きくなるのは 1500 年までの話で、この一生では早い
  rungCard('mo.cloth', 'money', 4, { title: 'フランドルの織工', story: 'フランドルの織工の親方が、あなたの羊毛を見て言った。「これを海の向こうに売るな。ここで織れ」', art: 'scene.market',
    left: { title: 'サフォーク中の毛を集めて布を織る', art: 'choice.shop', stake: store(10), odds: 2, win: { text: 'あなたの村の名のついた布が、ロンドンで値を付けた。', add: ['clothname'] }, lose: { text: '織工は、ノリッジへ行った。', add: ['debt'] } },
    right: { title: '親方の娘と恋に落ちる', art: 'choice.letter', stake: body(), odds: 3, win: { text: '言葉の分からない二人の話が、国じゅうに聞こえた。', add: ['famedlove'] }, lose: { text: '親方はフランドル語で何か言った。分からなくても分かった。' } } }),
  rungCard('mo.tower', 'money', 4, { title: '教会の塔', story: '教会の塔が大風のあと、半分のままだ。金を出す者の紋章を、新しい塔に刻むという。農夫に紋章はないが、羊毛の刈り鋏なら彫れる。', art: 'scene.flood',
    left: { title: '塔を建てる金を出す', art: 'choice.build', stake: store(12), odds: 2, win: { text: '遠くからでも見える。どの村からも見える。刈り鋏が四百年、雨に打たれる。', add: ['woolchurch'] }, lose: { text: '石工が賃金を二度上げ、塔は半分のまま金が尽きた。', add: ['debt'] } },
    right: { title: '同じ金で伯の執事の口を買う', art: 'choice.build', stake: store(3), odds: 3, win: { text: '鍵束が手に入った。', add: ['bailiffkey'] }, lose: { text: '金は誰かの袖に消えた。' } } }),
  // ── ラブ
  rungCard('lo.manor', 'love', 3, { title: '荘館の下女', story: '領主の館の奥で働く人と、毎週の裁判で目が合う。領主の家の女が農奴の家に来るなど、聞いたことがない。去年までは。', art: 'scene.festival',
    left: { title: '文を通わせる', art: 'choice.letter', stake: body(), odds: 3, win: { text: '話は領主の耳に入り、隣の伯の耳にも入った。国じゅうで笑われ、国じゅうに聞こえた。', add: ['famedlove'] }, lose: { text: 'その人は、館の奥へ戻ったきりだった。' } },
    right: { title: '館の伝手で羊毛の札をもらう', art: 'choice.shop', stake: store(3), odds: 3, win: { text: 'カレーの羊毛の鑑札をもらった。', add: ['stapler'] }, lose: { text: '伝手は、途中で切れた。' } } }),
  rungCard('lo.elope', 'love', 3, { title: '村を出る二人', story: '想う相手の親が、許さない。ただ今なら、村を出ても誰も追ってこない。どの村も人が足りない。', art: 'bond.lover',
    left: { title: '手を取って夜に出る', art: 'choice.march', stake: riskBody(2), odds: 3, win: { text: '二人で三つ先の州まで歩いた。その話は、唄うたいの耳に入った。', add: ['famedlove'] }, lose: { text: '追手に連れ戻された。', add: ['wound'] } },
    right: { title: '恋敵と弓で決める', art: 'choice.dojo', stake: riskBody(2), odds: 3, win: { text: '百歩の的で勝った。その腕は国じゅうに聞こえた。', add: ['famedbow'] }, lose: { text: '恋敵の的は、よく見えた。', add: ['wound'] } } }),
  // 英語の叙情詩（「夏が来た」など）は 13〜14 世紀に残る（史実）。村の恋が残った例は推測
  rungCard('lo.ballad', 'love', 4, { title: '旅の唄うたい', story: '旅の唄うたいが、泊まる家を探している。新しい恋の唄を探しているという。', art: 'scene.festival',
    left: { title: '二人の恋を語って聞かせる', art: 'choice.rhetoric', stake: body(), odds: 2, win: { text: '唄うたいは名前を変えて唄にした。あなたの村を知らない人が、四百年先で口ずさむ。', add: ['songlove'] }, lose: { text: '唄うたいは、別の恋を唄にした。もっと悲しいほうを。' } },
    right: { title: '唄の評判でロンドンの親方に呼ばれる', art: 'choice.march', stake: store(3), odds: 3, win: { text: 'ロンドンで、カレーの羊毛の札を得た。', add: ['stapler'] }, lose: { text: 'ロンドンの話は立ち消えになった。' } } }),
  rungCard('lo.carol', 'love', 4, { title: '五月の輪唄', story: '五月の朝、若い者が新しい輪唄を作っている。あの春に死んだ恋人に歌う、という歌詞だ。', art: 'scene.festival',
    left: { title: '死んだ人の名を歌に入れる', art: 'choice.celebrate', stake: body(), odds: 2, win: { text: '歌は村から村へ。誰も意味を知らないまま、子どもの遊び歌になった。', add: ['songlove'] }, lose: { text: '歌は、その夏だけで忘れられた。' } },
    right: { title: '踊りの輪で恋敵と張り合う', art: 'choice.dojo', stake: riskBody(2), odds: 3, win: { text: '恋敵を投げ飛ばした。その腕は国じゅうに聞こえた。', add: ['famedbow'] }, lose: { text: '投げ飛ばされた。', add: ['wound'] } } }),
  // ── スローライフ
  rungCard('sl.heirwed', 'slow', 3, { ages: [40, 70], needsAny: ['heir'], lacks: ['heirwed'], title: '跡取りの嫁取り', story: '跡取りが年頃になった。嫁を迎える話が出ている。農奴でなければ、結婚税はもう要らない。', art: 'family.child',
    left: { title: '荘役の口利きの縁談', art: 'choice.accept', stake: store(2), odds: 3, win: { text: '畑の続きの家の娘を迎えた。', add: ['heirwed', 'villagetrust'] }, lose: { text: '持参の麦が足りず、借金をして嫁を迎えた。', add: ['heirwed', 'debt'] } },
    right: { title: '跡取りの想う相手と添わせる', art: 'choice.celebrate', stake: body(), odds: 3, win: { text: '戸の前で二人は誓った。家が明るくなった。', add: ['heirwed', 'garden'] }, lose: { text: '荘役の勧めを断った形になり、村で気まずくなった。', add: ['heirwed'] } } }),
  // 隠居の取り決め（maintenance agreement）は荘園裁判に多数残る（史実）。「冬に麦 3 クォーターと、炉端の部屋」の類
  rungCard('sl.corrody', 'slow', 3, { ages: [45, 70], needsAny: ['heir'], lacks: ['corrody'], title: '隠居の取り決め', story: '跡取りが一人前になった。裁判で書かせれば、畑を渡すかわりに、毎年の麦と、炉のそばの部屋が羊皮紙に載る。子を信じないわけではない。', art: 'place.hermitage',
    left: { title: '取り決めを書いて畑を渡す', art: 'choice.rest', stake: body(), odds: 4, win: { text: '麦三袋と、炉のそば。羊皮紙一行で、老後が決まった。', add: ['corrody'] }, lose: { text: '跡取りが、まだ早いと言った。' } },
    right: { title: '渡さず弓を持ち続ける', art: 'choice.march', stake: riskBody(2), odds: 3, win: { text: '老いてなお百歩で的に立てた。国じゅうに名が聞こえた。', add: ['famedbow'] }, lose: { text: '弦に引かれて肩が外れた。', add: ['wound'] } } }),
  rungCard('sl.ancestor', 'slow', 4, { ages: [45, 75], needsAny: ['heir'], title: '炉端の話', story: '子や孫が炉端で、家の昔の話をせがむ。「ひいじいさんは、あの春を生き残ったんでしょう」', art: 'place.house',
    left: { title: '家の来し方を語って聞かせる', art: 'choice.rest', stake: body(), odds: 2, win: { text: '話は子から孫へ、その子へと語り継がれた。五百年先の誰かが、羊皮紙であなたの名を見つけて、ああ、と言う。', add: ['ancestor'] }, lose: { text: '子も孫も、途中で眠ってしまった。' } },
    right: { title: '蓄えを羊毛の札に回す', art: 'choice.shop', stake: store(3), odds: 3, win: { text: 'カレーの羊毛の札をもらった。', add: ['stapler'] }, lose: { text: '札は、ほかの家に回った。' } } }),
  rungCard('sl.resettle', 'slow', 4, { ages: [40, 75], needsAny: ['heirwed', 'grandchild', 'corrody'], title: '村をもう一度', story: '死んだ家の畑が、まだ半分残っている。屋根の落ちた家の並びに、もう一度人を入れられないか、と誰かが言った。', art: 'scene.flood',
    left: { title: '流れ者を集めて畑を分ける', art: 'choice.build', stake: body(2), odds: 2, win: { text: '十年後、村はまた村らしくなった。村の者はあなたの家の名で畑を呼ぶようになった。', add: ['ancestor'] }, lose: { text: '人は来なかった。草だけが増えた。' } },
    right: { title: '国の裁判に人を出す', art: 'choice.build', stake: store(3), odds: 3, win: { text: '縁で陪審の席をもらった。', add: ['juror'] }, lose: { text: '話は立ち消えた。' } } }),
  // ── ストレングス
  rungCard('sr.famous', 'strength', 3, { title: '百歩の的', story: '王の布告の弓場を、州ごとに競わせるという。サフォークでいちばんの弓が、誰か決まる。', art: 'scene.training',
    left: { title: '的の前に立つ', art: 'choice.drill', stake: riskBody(2), odds: 3, win: { text: '百歩で、矢が矢を割った。隣の州から見に来る者が出た。', add: ['famedbow'] }, lose: { text: '弦が切れて、指が二本動かなくなった。', add: ['wound'] } },
    right: { title: '賭けの胴元をする', art: 'choice.market', stake: store(3), odds: 3, win: { text: '弓より賭けのほうが儲かる。羊毛の札を買った。', add: ['stapler'] }, lose: { text: '百歩の的に矢が矢を割った。賭け金は向こう側だった。' } } }),
  // メモ 6: ホークウッドの壁画はフィレンツェ大聖堂に残る。皮なめしの息子という話は記憶（推測）
  rungCard('sr.hawkwood', 'strength', 4, { title: '白衣団', story: 'エセックスの皮なめしの息子が、イタリアで傭兵団を率いて、教皇と金の話をしているという。腕のいい弓なら、誰でも雇うそうだ。', art: 'scene.battle',
    left: { title: 'アルプスを越える', art: 'choice.march', stake: riskBody(3), odds: 2, win: { text: '名はイタリア語になまって残った。あなたの村では誰も知らない。ピサとフィレンツェの帳面には、ある。', add: ['whitecompany'] }, lose: { text: '峠で病にかかり、荷車で帰された。', add: ['wound'] } },
    right: { title: '家にとどまり、取り立ての話を受ける', art: 'choice.rhetoric', stake: body(), odds: 3, win: { text: 'サフォーク伯の隊の二十人長に取り立てられた。', rank: 2 }, lose: { text: '伯は、振り向かなかった。' } } }),
  // メモ 6: ロビン・フッドの唄は『農夫ピアズ』に出る
  rungCard('sr.outlaw', 'strength', 4, { title: '緑の森', story: '法は日当を下げ、執事は印をつける。森に入れば、誰の農奴でもない。酒場では、そういう男の唄が流行り始めている。', art: 'scene.dojo',
    left: { title: '弓を持って森に入る', art: 'choice.dojo', stake: riskBody(2), odds: 2, win: { text: '誰の家にも帰らなかった。伯の家令の財布を三つ取った。酒場の唄の名は、あなたの名ではない。けれど、矢の話はあなたの話だ。', add: ['greenwood'] }, lose: { text: '州長官の猟犬は、唄より速かった。', add: ['wound'] } },
    right: { title: '型を町の若者に教える', art: 'choice.teach', stake: body(), odds: 3, win: { text: '弟子の親の伝手で、羊毛の札が手に入った。', add: ['stapler'] }, lose: { text: '弟子は、すぐにやめていった。' } } }),
  // ── 祈り
  // 司祭の足りなさは史実。寡夫の叙階の話もある（史実、頻度は推測）
  rungCard('fa.ordain', 'faith', 3, { title: '連れ合いを亡くした男たち', story: 'ノリッジの司教は、一度に二十人を任命している。年の足りない若者でも、妻を亡くした者でも構わないという。祈りを唱えられるなら、司祭にする。死者が多すぎる。', art: 'scene.temple',
    left: { title: '頭を剃る', art: 'choice.memorial', stake: store(3), odds: 3, win: { text: '司教の手が頭に載った。翌週から、昨日まで一緒に畑にいた男の告解を聞く。', add: ['ordained'] }, lose: { text: 'ラテン語の試験で、「主」の綴りを誤った。' } },
    right: { title: '司教の家令の用心棒を引き受ける', art: 'choice.guard', stake: riskBody(2), odds: 3, win: { text: '弓の名が司教区じゅうに聞こえた。', add: ['famedbow'] }, lose: { text: '腕を折られた。', add: ['wound'] } } }),
  // カンタベリーの巡礼は史実。チョーサーの『カンタベリー物語』は 1390 年代
  rungCard('fa.canterbury', 'faith', 3, { title: 'カンタベリーの道', story: '一行は、騎士から粉屋まで。道中、誰かが話を始めると止まらない。聖トマスの墓まで、南へ十日。', art: 'scene.ise',
    left: { title: '一行に入る', art: 'choice.pilgrim', stake: riskBody(2), odds: 3, win: { text: '墓の前で、言葉が出なかった。帰り道、粉屋が何の話をしたかは全部覚えている。', add: ['canterbury'] }, lose: { text: '途中の宿で、粉屋の話を最後まで聞けずに倒れた。' } },
    right: { title: '一行の宿にエールを売りに出す', art: 'choice.market', stake: store(3), odds: 3, win: { text: '巡礼は喉が渇く。羊毛の札まで買えた。', add: ['stapler'] }, lose: { text: '巡礼は値切る。' } } }),
  // ノリッジのジュリアンとその言葉は記憶（推測）。メモ 6
  rungCard('fa.anchor', 'faith', 4, { title: '壁の中の祈り', story: 'ノリッジの教会の脇に、女が一人、壁に塗り込められて祈っている。外に開いた窓は一つ。「すべては良くなる」と言うらしい。なぜそう言えるのか、聞いてみたい。', art: 'place.hermitage',
    left: { title: '自分も壁の中へ入る', art: 'choice.rest', stake: body(), odds: 2, win: { text: '司教が戸を塞いだ。人の声は窓からだけ来る。あの春からずっと聞きたかったことを、ようやく一人で聞ける。村の者が、あなたの名で井戸を呼び始めた。', add: ['hermitage'] }, lose: { text: '七日で出してくれと叫んだ。戸はまだ塞がれていなかった。' } },
    right: { title: '町で巡礼の世話役になる', art: 'choice.organize', stake: store(3), odds: 3, win: { text: 'カンタベリーまでの道を、百人連れて歩いた。', add: ['canterbury'] }, lose: { text: '百人の不満を聞いて帰った。' } } }),
  // ウィクリフの英語聖書は記憶（推測）。メモ 6
  rungCard('fa.wyclif', 'faith', 4, { ages: [50, 75], title: '英語の福音書', story: 'オックスフォードから来た貧しい説教者が、古い写本を見せた。神の言葉が、英語で書いてある。司祭に聞かなくても、読める。読めてしまう。', art: 'skill.reading',
    left: { title: '夜に写し始める', art: 'choice.reading', stake: riskBody(2), odds: 2, win: { text: '百年の後、誰かが焼け残りの紙を見つける。「主は羊飼い」。あなたの字だった。', add: ['englishbible'] }, lose: { text: '司祭に見られた。手は、もう写せない形になった。', add: ['wound'] } },
    right: { title: '説教者を司教に引き渡す', art: 'choice.bribe', stake: body(), odds: 3, win: { text: '司教の家令が、あなたに頭を下げた。そのまま鍵束を預かった。', add: ['bailiffkey'] }, lose: { text: '引き渡した先で、自分も疑われた。', add: ['lordgrudge'] } } }),
);

const CHILDHOOD = [
  { year: 1330, age: 0, title: '生まれた', story: 'サフォークの村の東の端に生まれた。壁の向こうにも、その向こうにも別の家族がいる。煙は屋根から勝手に出ていく。前の世の記憶は、まだ眠っている。', cards: ['mother', 'house'], art: 'event.birth.mikawa' },
  { year: 1331, age: 1, title: '父の背', story: '父はミル・フィールドの細い畑に出て、夕方に戻る。肩に担がれると、隣の畑まで見える。', cards: ['father', 'strips', 'ie'], art: 'event.father.field' },
  { year: 1332, age: 2, title: '村の顔', story: '裁判の日、荘役が父の名を読む。隣の家の者は、こちらの畔の話になると声が大きくなる。', cards: ['neighbors', 'neighborhouse', 'manorhouse'], art: 'event.neighbors' },
  { year: 1333, age: 3, title: '妹が生まれた', story: '家に小さな声が増えた。藁に包まれて、よく寝る。', cards: ['sister'], art: 'event.sister.birth' },
  { year: 1334, age: 4, title: 'うちの豚', story: '囲いに子豚が来た。名前を付けるなと母が言う。いずれ食べるからだ。付けた。', cards: ['pig'], art: 'event.zori' },
  { year: 1335, age: 5, title: '遠い王の話', story: '王は若くて戦が好きらしい。スコットランドにも、海の向こうにも行くという。麦の値段に関係があるそうだ。', cards: ['edward'], art: 'history.imagawa.rule' },
  { year: 1336, age: 6, title: '季節を覚える', story: '鋤の月曜、五月の朝、刈り入れ、豚をつぶす日。一年のめぐりが分かってきた。', cards: ['spring'], art: 'event.seasons' },
];

// 家の格ときょうだいの割合は推測。サフォークは自由民の割合が高い地方だった（史実、割合は推測）
const BIRTH = {
  houses: [
    { id: 'villein', weight: 2, add: ['bondage'], patch: { 1: { prepend: 'あなたの家は領主の農奴だ。畑も、娘の結婚も、領主の許しの中にある。' } } },
    { id: 'free', weight: 1, houseLevel: 2, houseStore: 3, patch: { 1: { prepend: 'あなたの家は自由民だ。畑の持ち主の名が、羊皮紙に書いてある。少しだけ、隣より胸を張れる。' } } },
    { id: 'poor', weight: 1, add: ['bondage', 'debt'], patch: { 1: { prepend: 'あなたの家は農奴で、しかも借りた麦を返せていない。父は裁判の日、最後まで立っている。' } } },
  ],
  siblingModel: {
    born: [1, 2, 3, 3, 2, 1], elderShare: 0.5, deathRate: 0.4, youngerAges: [2, 4, 6], replaceAge: 3, elderAge: 3,
    plainEvent: { title: 'ひとりで歩く', story: '畑の畔まで、ひとりで歩いて行けるようになった。', cards: [], art: 'event.walk' },
    elderStory: '上には、{list}いる。', only: 'きょうだいは、いない。', birthLines: { 妹: '妹が生まれた。' },
    recallLines: {
      both: '思い返せば、この六年で弟妹が{born}生まれ、きょうだいのうち{lost}が育たなかった。',
      born: '思い返せば、この六年で弟妹が{born}生まれた。',
      lost: '思い返せば、この六年で、きょうだいのうち{lost}が育たなかった。',
    },
  },
};

const FAMILY_OMENS = { 'fam.father': '父が咳をするようになった', 'fam.mother': '母が少し弱ってきた', 'fam.sister': '妹に縁談の話が来た', 'ie.succession': '畑を求める縁者がいる', 'ie.retire': '跡取りに畑を渡す頃合いだ', 'lo.arranged': '縁談の噂が立っている', 'lo.marry': '想い人との話が立っている', 'lo.divorce': '別れの話が出ている', 'lo.child': '家に新しい命が宿った' };
// 父母の死は 1349 のあとに来るよう、三河より少し若い歳から（父は 22 歳＝1352 年が最短）
const FAMILY_AGES = { 'fam.father': [22, 42], 'fam.mother': [24, 50], 'fam.sister': [16, 24], 'ie.succession': [22, 75], 'ie.retire': [55, 65], 'lo.arranged': [20, 30], 'lo.marry': [18, 60], 'lo.divorce': [22, 60] };
const INITIAL_FAMILY_EVENTS = ['fam.father', 'fam.mother', 'fam.sister', 'lo.arranged'];
const KINSHIP_RELATIVES = ['兄', '弟', '異母兄弟', '叔父', '甥', '姪', 'いとこ'];
const DISASTER_TARGETS = { fire: ['house', 'shop', 'mill'], flood: ['strips', 'newfield', 'mill'], famine: ['strips', 'newfield'] };
const TEXT = {
  demandSources: { 'hist.crecy': '王の使いより', 'hist.poitiers': 'サフォーク伯の者より', 'hist.third': 'サフォーク伯の者より', 'hist.polltax': '王の税の役人より', 'dm.boon': '領主の鐘より', 'dm.aid': '領主の執事より', 'dm.fine': '法の判事より', 'dm.tithe': '司祭より', 'st.audit': '領主の監査人より' },
  houseNames: { own: '{name}{layer}', neighbor: '隣の{name}{layer}', branch: '{rel}の{name}分家', patron: '荘役の{name}{layer}' },
  spouseLabel: '連れ合い（{name}）',
  diedOfIt: 'それがもとで、助からなかった。',
  substitutes: { father: '父が「わしが行く」と言い出した。', grownchild: '子が「わたしが行きます」と言い出した。', fatherDemand: '父が「わしが行く」と', grownchildDemand: '子が「わたしが行きます」と', childChoice: '子の申し出を受ける', fatherChoice: '父の申し出を受ける', servantChoice: '雇い人を出す', hireChoice: '人を雇って出す', noneChoice: '誰も出さない', call: '戦', noOne: '腰抜けの噂が立つ', noOneResult: '割り当てに誰も出さず、腰抜けの噂が立った。', hireResult: '人を雇って戦に出した。', result: '{name}は{outcome}', ignoreResult: '戦には{name}が代わりに出た。{outcome}', returned: '無事に帰ってきた。', lost: '帰らなかった。' },
  contest: { lostField: '畑', surrender: '{rel}に畑を譲り、別の家を立てた。{result}', splitField: '畑を分けてもらった。', littleField: '畑はわずかしか残らなかった。', inherited: '{rel}を跡取りに替えた。{loss}', titleLoss: '家の格を失った。', noField: '{rel}を退けたが、畑と家の格を失った。' },
  succession: { title: '畑を継ぐ者', selfStory: '父の葬儀を終えた翌年、{rel}が裁判で畑を求めた。', story: '{rel}が裁判で畑を求めた。', fight: '{rel}と畑を争う', surrender: '{rel}に畑を譲り、別の家を立てる', replace: '{rel}を跡取りに替える', noteSurrender: '{rel}に畑を譲って別の家を立てた', noteWin: '{rel}と畑を争って家を継いだ', noteLose: '{rel}と畑を争い、畑を失いながら家を継いだ' },
  yearEnd: '今年の実り：',
  maintenanceTitle: '{target}をよくする話', maintenanceStory: '{target}を、もう一段よくできそうだ。',
  medicineSide: { head: '親の薬', lead: '老婆の薬を、父や母のために求める。' },
  partingTitle: '疎遠になった縁', partingChoice: '会わないまま三年が過ぎた', partingArt: 'bond.parting', partingText: 'とは疎遠になった。思い出の品が残った。',
  familyShift: { fatherDeath: ['父の具合が持ち直した。', '父がめっきり老け込んだ。'], motherDeath: ['母の顔色が少し良くなった。', '母が床に伏せる日が増えた。'], sisterMarriage: ['妹の縁談が先に延びた。', '妹の縁談が早まりそうだ。'], arrangedMarriage: ['縁談の話が遠のいた。', '縁談の話が近づいてきた。'], partnerMarriage: ['戸の前に立つ話が先に延びた。', '戸の前に立つ話が近づいてきた。'], divorce: ['夫婦の溝が少し埋まった。', '夫婦の溝が深まった。'], birth: ['子はまだ授からない。', '子を授かる兆しがある。'] },
  grandchildBorn: '跡取りに子が生まれた。孫だ。',
  childSpared: 'まだ子どもだったので、命までは取られなかった。',
  kinArrive: '{rel}の{name}が顔を見せに来た。',
  namedTitle: '{name}、洗礼を受ける',
  named: '生まれたその日に、教会で{name}と名づけられた。',
  namedAfterFather: '',
  introduce: { mother: '母は{name}。', father: '父は{name}。', sister: '妹は{name}。', 兄: '兄は{name}。' },
  lifeRoles: { general: 'ウォルシャムの農夫', rank1: '長弓兵', rank2: '二十人長', champion: '百人長', knownVillageHead: '国に名の届いた荘役', villageHead: '荘役', storehouse: '石の納屋の主', merchant: '羊毛の商人', martial: '弓の師匠', hermit: '壁の中の隠修者' },
  lifeTitles: { status: '名の通った', money: '富を築いた', love: '浮名を流した', slow: '土に根づいた', strength: '腕の立つ', faith: '祈りに生きた', loveless: '恋に縁のなかった', celebratedLove: '浮名を流した', kantoPrefix: '海を渡った', plain: '名もなき' },
  houseEnding: { heading: '家の行く末：', inherited: '長子に譲った', divided: '子らに分けた', rival: 'と畑を争い、家は二つに割れた', defended: 'と畑を争い、跡取りが家を守った', ended: '当主の代で終えた', heir: '跡取り', yes: 'あり', no: 'なし' },
};
const CARD_RULES = {
  'lo.meet': 'partnerMeet', 'lo.visit': 'partnerVisit', 'lo.marry': 'partnerMarriage', 'lo.arranged': 'arrangedMarriage',
  'lo.mistress': 'mistress', 'lo.keeplover': 'keepPartner', 'lo.divorce': 'divorce',
  'lo.child': 'birth', 'ch.seven': 'childSeven', 'ch.fifteen': 'childFifteen', 'fam.father': 'fatherDeath', 'fam.mother': 'motherDeath', 'fam.sister': 'sisterMarriage',
  'ie.succession': 'succession', 'ie.retire': 'retirement', 'ie.nanushi': 'villageHead', 'ie.water': 'waterFeud', 'ie.boundary': 'boundaryFeud',
  'rec.medicine': 'medicine', maintenance: 'maintenance', 'q.season': 'quietCard', ...Object.fromEntries(VIGNETTES.map(([id]) => [id, 'quietCard'])), 'child.newpig': 'recoveryCard',
  'hist.crecy': 'battle', 'hist.poitiers': 'battle', 'hist.third': 'battle',
};
const CARDS_WITH_RULES = CARDS.map((card) => ({ ...card, kind: card.year ? 'history' : card.disaster ? 'disaster' : card.demand ? 'demand' : card.quiet ? 'upkeep' : card.family ? 'family' : 'event', category: card.id.startsWith('lo.') ? 'relationship' : card.id.startsWith('ch.') ? 'child' : null, role: CARD_RULES[card.id] || (card.id.startsWith('lo.') ? 'relationship' : card.id.startsWith('ch.') ? 'childMilestone' : null), disasterType: card.id.startsWith('dis.') ? card.id.slice(4) : null, disasterKey: card.disaster ? card.id : null, familyAge: FAMILY_AGES[card.id] || null }));
const CARD_IDS = Object.fromEntries(CARDS_WITH_RULES.filter((card) => card.role).map((card) => [card.role, card.id]));

const ABILITY_EFFECTS = {
  hygiene: ['hist.death:left', 'hist.children:left', 'dis.plague:left', 'lo.child', 'rec.medicine:left'],
  soil: ['child.glean', 'dis.famine:right', 'build.newfield', 'hist.vacant:left', 'sl.garden'],
  body: ['child.wrestle', 'hist.crecy:left', 'hist.poitiers:left', 'hist.third:left', 'sr.duel', 'sr.train', 'sr.bandits'],
  foresight: ['hist.rain', 'hist.vacant', 'hist.statute', 'hist.rising', 'hist.assize'],
  numbers: ['child.miller', 'mo.sheep', 'mo.market', 'mo.lend', 'st.audit', 'mo.staple'],
  organizing: ['st.reeve', 'ie.nanushi', 'build.servant', 'dm.boon', 'sl.resettle'],
  expression: ['child.priest', 'st.letters', 'lo.poem', 'lo.ballad', 'lo.carol', 'st.chronicle'],
  outdoors: ['child.pannage', 'dis.flood', 'dis.bandits:left', 'hist.death:right', 'fa.walsingham'],
  cooking: ['mo.brew', 'st.aletaster', 'dis.famine:right', 'sl.eel'],
  making: ['hist.wind', 'build.well', 'build.mill', 'build.shop', 'mo.cloth'],
  animals: ['child.geese', 'child.newpig', 'mo.horse', 'mo.sheep', 'dis.murrain:right'],
  faith: ['child.priest', 'fa.clerk', 'fa.guild', 'fa.ordain', 'fa.anchor', 'fa.wyclif', 'rec.well:left'],
};
const RANDOM_ABILITIES = Object.keys(ABILITY_EFFECTS);
const abilityStories = {
  hygiene: 'ねずみと、のみと、煮沸のことを覚えている。誰にも説明できないが。', soil: '豆を挟むと畑が休まることを覚えている。', body: '鍛え方と、肉の食べ方を覚えている。',
  foresight: 'この時代に何が起きるか、教科書の一行くらいは覚えている。', numbers: '数と帳簿の感覚が残っている。粉屋の親指が読める。', organizing: '人手と日取りを分けて回す知恵が残っている。',
  expression: '言葉で人を動かした記憶がある。', outdoors: '森と天気の読み方が残っている。', cooking: '発酵の加減を覚えている。エールが違う。',
  making: '身近な材料で物を直した手つきが残っている。', animals: '家畜の具合を見分ける目が残っている。', faith: '祈りの作法に、自然と体が動く。',
};
const GLOSSARY = {
  農奴: '領主の許しなく村を離れたり娘を嫁がせたりできない身分の農民。villein。', 荘園: '領主が持つ土地と、そこに住む者の単位。村とほぼ重なることが多い。', 荘役: '村人の中から選ばれ、領主のために畑と帳簿を預かる役。reeve。',
  執事: '領主に代わって荘園を取り仕切る者。bailiff。', 荘園裁判: '領主の裁判。誰の畑か、誰の罰金かを羊皮紙に書き残す。', 羊皮紙: '羊の皮を薄くした書き物の材料。裁判の記録に使う。',
  十人組: '十人を組にして互いの罪に責任を負わせる決まり。frankpledge。', 賦役: '農奴が領主の畑で働く義務。', 結婚税: '農奴の娘の結婚に領主へ払う金。merchet。', 死亡税: '借地人が死ぬと、いちばん良い家畜を領主に差し出す決まり。heriot。',
  解放状: '農奴の身分を解くと書いた文書。manumission。', 労働者規制法: '1351 年の法。賃金を疫病の前に戻し、雇いを断ることを禁じた。', 人頭税: '頭数で取る税。1377、79、80 年。三度目が蜂起の引き金になった。',
  弓場: '村の土手に作った矢の的。', 二十人長: '弓兵二十人の組頭。vintenar。', 百人長: '百人の隊長。centenar。', 共有地: '村の者が羊や牛を放す土地。',
  ベリー: 'ベリー・セント・エドマンズ。村から一番近い大きな町で、大僧院がある。', カレー: '1347 年からイングランドが持つ海の向こうの港。羊毛の指定市。', 隠修者: '壁に囲まれた小部屋で一生祈って過ごす人。anchorite。',
  エールの竿: 'その家でエールを売っているしるしの竿。', 煉獄: '死者の魂が清められるとされた場所。祈りで日数が減ると信じられた。',
};
// この舞台が使うオプションルールは無い（側室は使わない）
const OPTION_RULES = {};
const TEMPLATE_SKIP = {};

export default { id: 'england', SCOPES, TEMPLATE_SKIP, OPTION_RULES, birthYear: 1330, yearLabel: (year) => `${year}年`, glossary: GLOSSARY, display: { title: 'ウォルシャムの春 — 一年の札', heading: ['黒死病のころの', 'イングランドの農村'], short: 'イングランド' }, settings, AXES, LAYERS, SURNAMES, FIELD, START_FIELD, CARDS: CARDS_WITH_RULES, cardById: new Map(CARDS_WITH_RULES.map((card) => [card.id, card])), CARD_IDS, RANDOM_ABILITIES, ABILITY_EFFECTS, abilityStories, NAMING, specialIds: { reconsider: 'goal.reconsider', parting: 'lo.parting', maintenance: 'maintenance' }, specialRoles: { maintenance: 'maintenance' }, CHILDHOOD, BIRTH, FAMILY_OMENS, FAMILY_AGES, INITIAL_FAMILY_EVENTS, KINSHIP_RELATIVES, partnerIds: LOVERS, disasterTargets: DISASTER_TARGETS, text: TEXT };
export { settings, AXES, LAYERS, SURNAMES, FIELD, START_FIELD, CARDS_WITH_RULES as CARDS, FAMILY_AGES };
