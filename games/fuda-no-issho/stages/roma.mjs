import { DEFAULTS } from './defaults.mjs';
// 古代ローマの一生（紀元前 100 年、イタリアの小さな農家に生まれる）の骨。2 つ目の舞台で、型が通るかを試すためのもの。
// 文章と数値は Claude の仮置き（2026-11-02）。史実の年は Claude の記憶で、資料で確かめていない。
// 場の札は共通の役を持ち、ローマ固有の名前と効果をここに置く。
const settings = {
  ...DEFAULTS,
  staggeredReveal: true,
  houseMight: { rank: [0, 2, 4], field: 1, fieldLevel: 1, worker: 2, trust: 1 },
  maxConcubines: 0,
  // 普請の札で建てる側の、段ごとの最低の値段
  buildPrice: { 2: 8, 3: 25, 4: 60 },
  claims: { heir: 5, '嫡子': 5, '庶子': 3, '妾腹の子': 2, '養子': 4, '兄': 4, '弟': 3, '異母兄弟': 3, '叔父': 3, '甥': 2, 'いとこ': 2 },
  expansionField: 'newfield',
  roleAliases: { heir: 'heir', villagetrust: 'villageTrust', waterwise: 'waterwise' },
  dangerEras: [{ from: -91, to: -31, chance: 0.3 }, { from: -30, to: 100, chance: 0.12 }],
};

const AXES = {
  // ladder: その軸の梯子の 4 段の呼び名（範囲 1〜4 に当たる）。4 段目はどの軸も後世に残る形で、残り方が軸ごとに違う（2026-11-03 orange）
  status: { name: 'ステータス', mark: '王冠', here: '偉くなる（元老院）', ladder: ['村の顔', '町の名士', '騎士・元老院', '執政官の名簿に残る'] },
  money: { name: 'マネー', mark: '硬貨', here: '金持ちになる（エクイテスの富豪）', ladder: ['村の蓄え', '町の店', '都の富', '語り草の大富豪'] },
  love: { name: 'ラブ', mark: 'ハート', here: '恋愛に生きる', ladder: ['村の恋', '町の浮名', '都の浮名', '詩に詠まれて残る恋'] },
  // スローライフの梯子は場所ではなく代を重ねる時間。最上段は、子々孫々が栄えて、すてきなご先祖様がいたと語り継がれること
  slow: { name: 'スローライフ', mark: '葉', here: '土地に根付いて生きる', ladderBy: 'generation', ladder: ['自分の家', '子の代', '孫の代', '語り継がれるご先祖'] },
  strength: { name: 'ストレングス', mark: '拳', here: '最強を目指す（剣闘士・ケントゥリオ）', ladder: ['村の喧嘩', '町の闘技場', '都の軍功', '戦記に名が残る'] },
  // 芸の道はローマで試している 6 本目（2026-11-03 orange 了承）。手本は農家の子から詩人になったウェルギリウス
  art: { name: 'アート', mark: '竪琴', here: 'ムーサイの道を行く（詩人・絵描き）', ladder: ['村の祭り', '町の作品', '都の貴人', '書き写されて後世へ'] },
};

const LAYERS = { village: { name: '家', ranks: ['小農', '自作農', '土地持ちの旧家'] } };
const SURNAMES = ['ユリウス', 'コルネリウス', 'トゥッリウス', 'ポンペイウス', 'セルウィリウス', 'アエミリウス', 'ファビウス', 'リウィウス'];
// 人の名前（ローマ）: 男は個人名＋家の名、女は家の名の女の形。長男は父の個人名を継ぐことが多い
const NAMING = {
  male: ['ガイウス', 'マルクス', 'ルキウス', 'プブリウス', 'クィントゥス', 'ティトゥス', 'グナエウス', 'セクストゥス'],
  female: (nomen) => nomen.replace(/ウス$/, 'ア'),
  full: (praenomen, nomen) => `${praenomen}・${nomen}`,
  // 娘が二人目からは、生まれ順の呼び名を添える（セクンダ＝二番目）
  daughterOrder: ['', '・セクンダ', '・テルティア', '・クァルタ', '・クィンタ', '・セクスタ'],
  // ctx: hash(tag) 種から決まる数、house 家の名、surnames 家の名の部品、siblings きょうだいの一覧、kinSlot(key) 縁者の順
  nameOf(ctx, who, key) {
    const { male, female, full, daughterOrder } = NAMING;
    const father = male[ctx.hash('father') % male.length];
    // 長男は父の個人名を継ぐ。兄がいれば自分は別の名
    const self = ctx.siblings.some((sib) => sib.rel === '兄') ? male.filter((n) => n !== father)[ctx.hash('self') % (male.length - 1)] : father;
    const otherHouse = (tag) => { const others = ctx.surnames.filter((n) => n !== ctx.house); return others[ctx.hash(tag) % others.length]; };
    if (who === 'father' || who === '兄') return full(father, ctx.house);
    if (who === 'self') return full(self, ctx.house);
    if (who === 'mother') return female(otherHouse('mother'));
    if (who === 'spouse') return female(otherHouse(`spouse${key}`));
    // 息子は家の中で呼び分けるので、長男は自分の名、二人目からは自分とも兄たちとも違う名（尽きたら重ねる）
    if (who === 'son') { if (key === 1) return full(self, ctx.house); const used = [self]; let name = self; for (let k = 2; k <= key; k++) { const pool = male.filter((n) => !used.includes(n)); const list = pool.length ? pool : male; name = list[ctx.hash(`son${k}`) % list.length]; used.push(name); } return full(name, ctx.house); }
    if (who === 'daughter') return `${female(ctx.house)}${daughterOrder[key - 1] || ''}`;
    if (['妹', '姉', 'sister'].includes(who)) return female(ctx.house);
    // 同じ父の息子は家の中で呼び分けるので、父とも自分とも違う個人名。叔父・いとこは同名を許す
    if (['弟', '異母兄弟'].includes(who)) { const pool = male.filter((n) => ![father, self].includes(n)); return full(pool[ctx.hash(`kin${ctx.kinSlot(key)}`) % pool.length], ctx.house); }
    if (['叔父', 'いとこ'].includes(who)) return full(male[ctx.hash(`kin${ctx.kinSlot(key)}`) % male.length], ctx.house);
    return '';
  },
  birthLine(sex, order, name) {
    const given = name.split('・')[0];
    if (sex === 'son') return order === 1 ? `男の子で、九日目に自分と同じ${given}の名を継がせた。` : `男の子で、${given}と名づけた。`;
    return `女の子で、${name}と呼ぶ。`;
  },
};

const FIELD = {
  ie: { name: '家', role: 'house', kind: '家', marks: { status: 0 }, art: 'place.house', levels: LAYERS.village.ranks.map((name, i) => ({ name, marks: { status: i }, art: `roma.house.lv${i + 1}` })) },
  neighborhouse: { name: '隣の家', role: 'rivalHouse', kind: '相手の家', marks: { status: 0 }, art: 'roma.neighbors', levels: [1, 2, 3].map((level) => ({ name: `隣の家`, marks: { status: 0 }, art: 'roma.neighbors' })) },
  nanushiHouse: { name: 'パトロヌスの家', role: 'patronHouse', kind: '相手の家', marks: { status: 0 }, art: 'roma.patron', levels: [1, 2, 3].map((level) => ({ name: `パトロヌスの家`, marks: { status: 0 }, art: 'roma.patron' })) },
  kinsman: { name: '縁者', kind: '家族', marks: { slow: 1 }, art: 'roma.kin' },
  mother: { name: '母', role: 'mother', kind: '家族', marks: { slow: 1 }, art: 'roma.mother' },
  father: { name: '家長（パテル・ファミリアス）', role: 'father', kind: '家族', marks: { slow: 1 }, art: 'roma.father' },
  oldfather: { name: '老いた父', role: 'father', substitute: false, kind: '家族', marks: { slow: 1 }, art: 'roma.father.old' },
  sister: { name: '妹', role: 'sister', kind: '家族', marks: { slow: 1 }, art: 'roma.sister' },
  siblings: { name: 'きょうだい', role: 'siblings', kind: '家族', marks: { slow: 1 }, art: 'roma.siblings' },
  house: { name: '泥壁の農家', kind: '家', marks: { slow: 1 }, art: 'roma.farmhouse', levels: [
    { name: '泥壁の農家', yearly: { body: 1 }, guard: [], art: 'roma.farmhouse.lv1' },
    { name: '瓦屋根の農家', yearly: { body: 2 }, guard: [], art: 'roma.farmhouse.lv2' },
    { name: '湯を沸かす小さなウィッラ', yearly: { body: 3 }, guard: ['dis.fever'], art: 'roma.farmhouse.lv3' },
  ], pastLv3: ['hygiene'] },
  paddy: { name: '麦畑', role: 'field', primary: true, kind: '田', marks: { money: 1, slow: 1 }, art: 'roma.wheat', levels: [
    { name: '麦畑', yearly: { store: 1 }, guard: [], art: 'roma.wheat.lv1' },
    { name: '休閑と厩肥の麦畑', yearly: { store: 2 }, guard: [], art: 'roma.wheat.lv2' },
    { name: '輪作と選種の麦畑', yearly: { store: 3 }, guard: [], art: 'roma.wheat.lv3' },
  ], pastLv3: ['soil'] },
  newfield: { name: 'ブドウ畑', role: 'field', kind: '田', marks: { money: 1, slow: 1 }, art: 'roma.vineyard', levels: [
    { name: 'ブドウ畑', yearly: { store: 1 }, guard: [], art: 'roma.vineyard.lv1' },
    { name: '支柱を立てたブドウ畑', yearly: { store: 2 }, guard: [], art: 'roma.vineyard.lv2' },
    { name: '接ぎ木と剪定のブドウ畑', yearly: { store: 3 }, guard: [], art: 'roma.vineyard.lv3' },
  ], pastLv3: ['soil'] },
  neighbors: { name: '村の人々', kind: '里の人々', marks: { slow: 1 }, art: 'roma.villagers' },
  villagetrust: { name: '村の信頼', role: 'villageTrust', kind: '縁', marks: { status: 1 }, art: 'roma.trust' },
  friend: { name: '幼なじみ', kind: '縁', marks: { love: 1 }, guard: ['vi.tavern'], art: 'roma.friend' },
  reading: { name: '読み書き（ラテン語）', kind: '知恵', marks: { status: 1 }, art: 'roma.reading' },
  rhetoric: { name: '弁論の心得', kind: '知恵', marks: { status: 2 }, art: 'roma.rhetoric' },
  strongbody: { name: '鍛えた体', kind: '体', marks: {}, ability: true, guard: ['vi.tavern', 'vi.road'], art: 'roma.strong' },
  'kept.tavern': { name: '喧嘩の勝ち名乗り', kind: '品', marks: { strength: 1 }, art: 'roma.keep.rudis' },
  'kept.road': { name: '街道を越えた杖', kind: '品', marks: { strength: 1 }, art: 'roma.keep.rudis' },
  forumgossip: { name: 'フォルムの噂', kind: '知恵', marks: { status: 1 }, art: 'roma.forum' },
  gods: { name: '家の神々（ラレス）', kind: '縁', marks: { slow: 1 }, art: 'roma.lares' },
  republic: { name: '共和政の揺らぎ', kind: '遠くの歴史', marks: {}, art: 'roma.history.republic' },
  sulla: { name: 'スッラの独裁', kind: '遠くの歴史', marks: {}, art: 'roma.history.sulla' },
  caesar: { name: 'カエサルの内乱', kind: '遠くの歴史', marks: {}, art: 'roma.history.caesar' },
  augustus: { name: 'オクタウィアヌスの世', kind: '遠くの歴史', marks: {}, art: 'roma.history.augustus' },
  spring: { name: '春', kind: '季節', marks: {}, art: 'season.spring' },

  'lover.vine': { name: 'ブドウ摘みの娘', kind: '縁', marks: { love: 1 }, art: 'roma.lover.vine' },
  'lover.tavern': { name: '居酒屋の女主人', kind: '縁', marks: { love: 1 }, art: 'roma.lover.tavern' },
  'lover.widow': { name: '町の寡婦', kind: '縁', marks: { love: 1 }, art: 'roma.lover.widow' },
  'lover.freed': { name: '解放奴隷の人', kind: '縁', marks: { love: 1 }, art: 'roma.lover.freed' },
  'keep.vine': { name: 'ブドウ摘みの娘の髪紐', kind: '品', marks: { love: 1 }, art: 'roma.keep.ribbon' },
  'keep.tavern': { name: '居酒屋の杯', kind: '品', marks: { love: 1 }, art: 'roma.keep.cup' },
  'keep.widow': { name: '寡婦の蝋板の手紙', kind: '品', marks: { love: 1 }, art: 'roma.keep.tablet' },
  'keep.freed': { name: '解放奴隷の人の指輪', kind: '品', marks: { love: 1 }, art: 'roma.keep.ring' },
  lover: { name: '想い人', kind: '縁', marks: { love: 1 }, art: 'roma.lover' },
  spouse: { name: '妻', role: 'spouse', partnerName: true, partnerPriority: 1, kind: '家族', marks: { love: 2, slow: 1 }, art: 'roma.spouse', yearly: { body: 1 } },
  arrangedspouse: { name: '妻（家の取り決め）', role: 'spouse', partnerPriority: 2, kind: '家族', marks: { slow: 2, money: 1 }, art: 'roma.spouse.arranged', yearly: { body: 1 } },
  sidewife: { name: '側室', role: 'concubine', partnerPriority: 3, kind: '家族', marks: { love: 1, status: 1 }, art: 'roma.spouse', yearly: { body: 1, store: -1 } },
  mistress: { name: '内縁の人', role: 'mistress', partnerPriority: 4, kind: '縁', marks: { love: 2 }, art: 'roma.mistress', yearly: { store: -1 } },
  affair: { name: '浮名', kind: '縁', marks: { love: 2 }, art: 'roma.affair' },
  rumor: { name: '浮名の噂', kind: '縁', marks: { status: -1 }, art: 'roma.rumor' },
  // 子・育った子・孫は、生まれる・育つが選ばずに起きるので点を持たない（点は縁組や跡を継がせる選択の側に付く。2026-11-03 orange「共通の札は選んだ側にだけ点」）
  child: { name: '子', kind: '家族', marks: {}, art: 'roma.child' },
  grownchild: { name: '育った子', role: 'grownchild', kind: '家族', marks: {}, art: 'roma.child.grown', yearly: { body: 1 } },
  childletters: { name: '子の学び（文法教師）', kind: '家族', marks: { status: 1 }, art: 'roma.child.letters' },
  childhands: { name: '子の手伝い', kind: '家族', marks: { money: 1 }, yearly: { store: 1 }, art: 'roma.child.hands' },
  heir: { name: '跡取り', role: 'heir', kind: '家族', marks: { slow: 2, status: 1 }, art: 'roma.heir' },
  branchhouse: { name: '分家', kind: '家族', marks: { slow: 1, money: 1 }, art: 'roma.branch' },
  childaway: { name: '都へ出た子', kind: '縁', marks: { status: 1, money: 1 }, art: 'roma.child.away' },
  inlaw: { name: '妹の嫁ぎ先', kind: '縁', marks: { slow: 1, money: 1 }, guard: ['dis.famine'], art: 'roma.inlaw' },
  coward: { name: '徴兵逃れの噂', kind: '重荷', marks: { status: -2, love: -1 }, art: 'roma.coward' },
  wound: { name: '古傷', kind: '重荷', marks: { strength: -1, slow: -1 }, art: 'roma.wound' },
  debt: { name: '借金', kind: '重荷', marks: { money: -2 }, art: 'roma.debt' },
  cliens: { name: 'クリエンテス（パトロヌスに仕える家）', kind: '縁', marks: {}, art: 'roma.cliens' },
  patronfavor: { name: 'パトロヌスの覚え', kind: '縁', marks: { status: 2 }, guard: ['vi.sack', 'vi.feud'], art: 'roma.patron.favor' },
  netting: { name: '蚊よけの布と埋めた水たまり', kind: '暮らし', marks: { slow: 1 }, guard: ['dis.fever'], art: 'roma.netting' },
  oddity: { name: '変わり者の噂', kind: '重荷', marks: { status: -1 }, art: 'roma.oddity' },
  patrongrudge: { name: 'パトロヌスの不興', kind: '重荷', marks: { status: -2 }, art: 'roma.patron.grudge' },
  // 身分の段。軍団兵 → 百人隊長 → 騎士身分。戦と取り立てで上がる。
  rank: { name: '軍団兵（レギオの兵）', role: 'rank', kind: '身分', marks: { status: 1, strength: 1 }, art: 'roma.rank.legionary', noMaintain: true, levels: [
    { name: '軍団兵（レギオの兵）', marks: { status: 1, strength: 1 }, art: 'roma.rank.legionary' },
    { name: 'ケントゥリオ（百人隊長）', marks: { status: 3, strength: 2 }, art: 'roma.rank.centurion' },
    { name: 'エクイテス（騎士身分）', marks: { status: 5, money: 1 }, art: 'roma.rank.eques' }] },
  'kanjo.spartacus': { name: '反乱鎮圧の軍功章', kind: '品', marks: { status: 1, strength: 1 }, art: 'roma.keep.phalera' },
  'kanjo.pharsalus': { name: 'ファルサルスの軍功章', kind: '品', marks: { status: 1, strength: 1 }, art: 'roma.keep.phalera' },
  'kanjo.arena': { name: '闘技場の木剣', kind: '品', marks: { strength: 2 }, art: 'roma.keep.rudis' },
  veteranland: { name: '退役兵の土地', kind: '田', marks: { money: 1, status: 1 }, art: 'roma.veteranland', yearly: { store: 1 } },
  shop: { name: '街道の店（タベルナ）', role: 'building', kind: '仕事', marks: { money: 2 }, art: 'roma.taberna', levels: [
    { name: '街道の店', yearly: { store: 2 }, guard: [], art: 'roma.taberna.lv1' },
    { name: '品ぞろえの店', yearly: { store: 3 }, guard: [], art: 'roma.taberna.lv2' },
    { name: '帳簿のある店', yearly: { store: 4 }, guard: [], art: 'roma.taberna.lv3' },
  ], pastLv3: ['numbers'] },
  servant: { name: '奴隷', role: 'servant', kind: '家族', marks: { status: 1 }, art: 'roma.slave', levels: [
    { name: '奴隷', yearly: { body: 1 }, guard: ['vi.robbery'], art: 'roma.slave.lv1' },
    { name: '仕込んだ奴隷', yearly: { body: 2 }, guard: [], art: 'roma.slave.lv2' },
    { name: '解放を約束した奴隷', yearly: { body: 2 }, guard: [], art: 'roma.slave.lv3' },
  ], pastLv3: ['organizing'] },
  garden: { name: '庭', kind: '暮らし', marks: { slow: 1 }, art: 'roma.garden' },
  villa: { name: '農園の閑暇（オティウム）', kind: '暮らし', marks: { slow: 2 }, art: 'roma.otium' },
  // アートの札。作品は死んでも残る、が手触り
  singer: { name: '祭りの歌い手', kind: '知恵', marks: { art: 1 }, art: 'roma.singer' },
  meter: { name: '詩の拍子（韻律）', kind: '知恵', marks: { art: 1 }, art: 'roma.meter' },
  artpatron: { name: '詩を好む貴人', kind: '縁', marks: { art: 1, status: 1 }, art: 'roma.artpatron' },
  'work.fresco': { name: '食堂の壁画', kind: '品', marks: { art: 2 }, art: 'roma.work.fresco' },
  'work.verse': { name: '詩の巻物', kind: '品', marks: { art: 2 }, art: 'roma.work.verse' },
  'work.epitaph': { name: '墓に刻んだ詩', kind: '品', marks: { art: 1 }, art: 'roma.work.epitaph' },
  'work.copied': { name: '書き写されて広まった詩', kind: '品', marks: { art: 3 }, art: 'roma.work.copied' },
  'past.memory': { name: '前世の記憶', kind: '前世', marks: {}, art: 'past.teacher' },
};

// 品の届く範囲。1 家と村（書かない品はこれ）、2 町、3 都（ローマ）、4 天下と後世。点は範囲ごとに scopeWeight 倍で数える
const SCOPES = ['家と村', '町', '都', '天下と後世'];
const SCOPE_OF = {
  2: ['reading', 'rhetoric', 'forumgossip', 'kept.road', 'lover.tavern', 'keep.tavern', 'lover.widow', 'keep.widow', 'lover.freed', 'keep.freed', 'childletters', 'shop', 'patronfavor', 'patrongrudge', 'kanjo.arena', 'veteranland', 'meter', 'work.fresco', 'work.epitaph', 'work.verse'],
  3: ['childaway', 'kanjo.spartacus', 'kanjo.pharsalus', 'artpatron'],
  4: ['work.copied'],
};
for (const [scope, ids] of Object.entries(SCOPE_OF)) for (const id of ids) FIELD[id].scope = Number(scope);
// スローライフの品は代で段を数える。届く範囲は家と村のままなので、点は等倍（段 rung だけを持たせる）
const RUNG_OF = { 2: ['grownchild', 'heir', 'branchhouse'] };
for (const [rung, ids] of Object.entries(RUNG_OF)) for (const id of ids) FIELD[id].rung = Number(rung);
// 身分の段は段ごとに範囲が違う。軍団兵は町、ケントゥリオと騎士身分は都
FIELD.rank.levels.forEach((level, i) => { level.scope = [2, 3, 3][i]; });

const START_FIELD = ['ie', 'neighborhouse', 'nanushiHouse', 'mother', 'house', 'father', 'paddy', 'neighbors', 'sister', 'gods', 'republic', 'spring'];

const body = (amount = 1) => ({ type: 'spend', what: 'body', amount });
const riskBody = (amount = 1) => ({ type: 'risk', what: 'body', amount });
const store = (amount = 1) => ({ type: 'spend', what: 'store', amount });
const risk = (what) => ({ type: 'risk', what });
const spend = (what) => ({ type: 'spend', what });
const lock = (what, years) => ({ type: 'lock', what, years });
const SUB = { type: 'risk', what: 'substitute' };
const LOVERS = ['lover.vine', 'lover.tavern', 'lover.widow', 'lover.freed'];
for (const id of Object.keys(FIELD)) if (id.startsWith('kanjo.')) FIELD[id].role = 'merit';
for (const id of LOVERS) FIELD[id].role = 'lover';

// 用語集。画面は、文の中にこの言葉があれば最初の 1 回だけ ⓘ を付け、押すと説明を出す。
// 暮らしの一場面: 静かな年に二択の代わりに出す。一生に一度ずつ。[id, 歳, 題, 文, 条件]
const VIGNETTES = [
  ['life.nundinae', [7, 75], '市の日（ヌンディナエ）', '八日ごとに町に市が立つ。野菜と鶏を背負って出かけ、帰りに噂話を持ち帰る。'],
  ['life.saturnalia', [7, 75], 'サトゥルナリア祭', '冬至の祭り。この数日ばかりは奴隷も主人と同じ卓につき、人々は「イオ、サトゥルナリア！」と呼び合う。'],
  ['life.lares', [7, 20], 'ラレスへの朝の供え', '毎朝、炉ばたの小さな祠に、ひとつまみの塩と麦粉を供える。家を守る神々への挨拶だ。'],
  ['life.puls', [7, 40], '麦粥と魚醤', '食卓はたいてい麦粥（プルス）。祝いの日には、魚を発酵させたガルムを垂らす。'],
  ['life.vestalia', [8, 75], 'ウェスタリア', '六月、炉の女神ウェスタの祭り。粉をひくロバが花の冠をかぶって休む。'],
  ['life.toga', [14, 17], '大人のトガ', '三月のリベラリア祭の日、子供の縁取りのある衣を脱ぎ、白いトガ・ウィリリスを着た。'],
  ['life.lupercalia', [15, 30], 'ルペルカリア祭', '二月、若者たちが山羊の革ひもを手に駆け回る。打たれた女は子を授かるという。'],
  ['life.floralia', [15, 75], 'フロラリア', '春、花の女神の祭り。芝居と踊りがあり、町は夜まで浮かれる。'],
  ['life.thermae', [15, 75], '公衆浴場（テルマエ）', '湯、ぬるま湯、冷水と巡る。町の男たちは、ここで一日の噂を交わす。'],
  ['life.wedding', [15, 40], '隣家の婚礼', '花嫁がオレンジ色のヴェールで行列する。「タラッシオ！」の掛け声に、村じゅうが冷やかしに出た。'],
  ['life.road', [12, 75], '街道の里程標', '石畳の街道に、千歩ごとに里程標が立つ。都まであと何里と刻んである。'],
  ['life.munus', [12, 75], '剣闘士の見世物（ムヌス）', '有力者が亡き父を弔って見世物を開いた。ただで見られる代わりに、選挙ではその名を覚えておけということだ。'],
  ['life.census', [17, 75], '戸口調査（ケンスス）', '五年ごとの調査。家の者と財産を役人に申し出る。この申告で、属する階級が決まる。'],
  ['life.vintage', [15, 75], '葡萄の収穫', '村じゅうが桶を踏み、甘い新酒を味見する。酒の神リベルに初物を供えた。', { needs: ['newfield'] }],
  ['life.naming', [18, 60], '名づけの日', '生まれて九日目、子に名をつけ、魔除けのお守り（ブッラ）を首にかけた。', { needsAny: ['child'] }],
  ['life.parentalia', [20, 75], 'パレンタリア', '二月、死者をしのぶ九日間。父の墓に花と葡萄酒とパンを供えた。', { lacks: ['father', 'oldfather'] }],
];
const GLOSSARY = {
  'ヌンディナエ': '八日ごとの市の日。農民が町へ出て売り買いし、子供の学校も休みになった。',
  'サトゥルナリア': '十二月の農耕神サトゥルヌスの祭り。贈り物を交わし、主人と奴隷の立場が一時ゆるむ。',
  'ガルム': '魚を塩漬けにして発酵させた調味料。いまの魚醤に近い。',
  'ムーサイ': '学芸の女神たち。詩人は作品の初めに、ムーサイに霊感を願った。',
  'ウェスタ': '炉とかまどの女神。都の神殿では、ウェスタの巫女が聖なる火を絶やさず守った。',
  'トガ・ウィリリス': '成人の男が着る白いトガ。十五歳前後で子供の衣から着替えた。',
  'ルペルカリア': '二月の古い祭り。豊穣と浄めの儀式で、若者が革ひもを手に走る。',
  'フロラリア': '花の女神フローラの春祭り。芝居や見世物でにぎわった。',
  'テルマエ': '公衆浴場。安い入浴料で誰でも入れ、運動場や話の場でもあった。',
  'ムヌス': '有力者が死者の弔いとして開く見世物。剣闘士の試合はここから始まった。',
  'ケンスス': '五年ごとの戸口調査。財産の申告で、市民の階級と軍役が決まった。',
  'ブッラ': '子供が首にかけるお守りの小袋。成人のときに家の神々に納めた。',
  'パレンタリア': '二月の、亡き親族をしのぶ祭り。墓に供え物をした。',
  'パトロヌス': '有力者。クリエンテスを守り、口をきいてやる代わりに、選挙の票や朝の挨拶を求める。',
  'クリエンテス': 'パトロヌスに守ってもらう側の人や家。票や奉仕で仕え、困ったときに頼る。',
  'エクイテス': '騎士身分。元は馬を持って戦う者だったが、このころは財産で決まる富裕な身分。',
  'ケントゥリオ': '百人隊長。軍団の中で、百人ほどの兵を率いる古参の兵。',
  'レギオ': 'ローマの軍団。数千人の重装歩兵からなる。',
  'パテル・ファミリアス': '家長。家の財産と家族の生き死にまで、強い権限を持つ。',
  'ラレス': '家を守る小さな神々。炉の前に祀り、毎日供え物をする。',
  'ウィッラ': '農地の中に建てた家や屋敷。',
  'トガ': 'ローマ市民の正装。成人するとまとう。',
  '同盟市戦争': 'ローマ市民権を求めたイタリアの町々と、ローマとの戦争（前 91〜前 88 年）。',
  'スッラ': 'ローマの将軍。独裁官になり、敵の名を広場に貼り出して財産を奪った。',
  'スパルタクス': '剣闘士の奴隷。前 73 年、仲間と逃げ出して大きな反乱を起こした。',
  'ルビコン': 'イタリア本土の境の川。軍を率いて渡れば、ローマへの反逆になる。',
};

const CARDS = [
  // ── 子供
  { id: 'child.vintage', frame: 'path', ages: [7, 11], title: '村のブドウ摘み', story: '秋。家中で、村中で、ブドウを摘む。', art: 'roma.scene.vintage',
    left: { title: '籠を運ぶ', art: 'choice.carry', stake: body(), odds: 5, win: { text: '重い籠を運び、体が慣れた。', body: 2, maxBody: 1, add: ['strongbody'] }, lose: { text: '籠をひっくり返して叱られた。' } },
    right: { title: 'ブドウを踏む', art: 'choice.tread', stake: body(), odds: 5, win: { text: '村の子らと桶で踊るように踏んだ。', add: ['friend'] }, lose: { text: '桶で足を滑らせて、笑われた。' } } },
  { id: 'child.grammar', frame: 'path', ages: [7, 12], axis: 'status', title: '町の文法教師', story: '町に、子供に読み書きを教える教師がいる。月謝がいる。', art: 'roma.scene.school',
    left: { title: '通わせてもらう', art: 'choice.reading', stake: store(1), odds: 4, win: { text: '文字と数を覚えた。', add: ['reading'] }, lose: { text: '鞭で打たれて、通うのが嫌になった。' } },
    right: { title: '家の神々に供物をささげる', art: 'choice.lares', stake: body(), odds: 5, win: { text: '父と並んで炉に供物を置いた。', add: ['gods'] }, lose: { text: '供物の火が、すぐに消えた。' } } },
  { id: 'child.road', frame: 'path', ages: [9, 14], axis: 'strength', title: '街道の軍団', story: '街道を、軍団が隊列を組んで通っていく。', art: 'roma.scene.legion',
    left: { title: '後を追いかける', art: 'choice.follow', stake: riskBody(), odds: 4, win: { text: '兵に槍の握り方を教わった。', add: ['strongbody'] }, lose: { text: '馬に蹴られかけた。' } },
    right: { title: '兵に水を売る', art: 'choice.sell', stake: body(), odds: 5, win: { text: '銅貨を何枚か手に入れた。', store: 1 }, lose: { text: '代金を踏み倒された。' } } },

  // ── 史実（その年に必ず来る）
  { id: 'hist.socialwar', frame: 'path', year: -91, omen: 'イタリアの同盟市が市民権を求めて騒いでいる', title: '同盟市戦争', story: 'ローマとイタリアの町々が戦になった。村の若者も取られていく。', art: 'roma.history.socialwar',
    left: { title: '父と畑を守る', art: 'choice.guard', stake: body(), odds: 5, win: { text: '戦の間も、畑は無事だった。', store: 1 }, lose: { text: '兵に麦を持っていかれた。' } },
    right: { title: '町へ噂を聞きに行く', art: 'choice.news', stake: riskBody(), odds: 4, win: { text: 'イタリア人もローマ市民になれるらしい、と聞いた。', add: ['forumgossip'] }, lose: { text: '人混みで転んで足を傷めた。' } } },
  { id: 'hist.sulla', frame: 'path', year: -82, omen: 'スッラの軍がローマへ向かっている', title: 'スッラの粛清', story: 'スッラが独裁官になり、敵の名を書いた札が広場に貼り出された。村の土地も奪われ、退役兵に配られるという。', art: 'roma.history.sulla',
    always: { remove: ['republic'], add: ['sulla'] },
    left: { title: 'パトロヌスの家に身を寄せる', art: 'choice.patron', stake: store(1), odds: 4, win: { text: 'パトロヌスが口をきき、畑は取られずに済んだ。', add: ['patronfavor'] }, lose: { text: 'パトロヌスも名簿に載り、頼る先を失った。' } },
    right: { title: '黙って畑を耕す', art: 'choice.till', stake: risk('paddy'), odds: 4, win: { text: '嵐は村を通り過ぎた。', store: 1 }, lose: { text: '麦畑は退役兵のものになった。' } } },
  { id: 'hist.spartacus', frame: 'demand', year: -73, demand: true, ignore: { substitute: true, odds: 3 }, omen: 'カプアの剣闘士が逃げたという', title: 'スパルタクスの反乱', story: '剣闘士と奴隷の反乱が、イタリアを荒らしている。村にも兵の募集が来た。', art: 'roma.history.spartacus',
    left: { title: '軍団に加わる', art: 'choice.march', stake: riskBody(2), odds: 3, delay: 1, win: { text: '反乱を鎮める軍の中で生き延びた。', add: ['kanjo.spartacus'], rank: 1, store: 1, maxBody: 1 }, lose: { text: '剣闘士の刃を受けて帰った。', add: ['wound'] } },
    right: { title: '村に残る', art: 'choice.stay', stake: SUB, odds: 3, win: { text: '代わりに出た者は無事に帰ってきた。' }, lose: { text: '代わりに出た者は帰らなかった。' } } },
  { id: 'hist.civilwar', frame: 'demand', year: -49, demand: true, ignore: { substitute: true, odds: 3 }, omen: 'カエサルとポンペイウスの仲が裂けた', title: 'ルビコン', story: 'カエサルが軍を率いてルビコン川を渡った。内乱が始まる。パトロヌスはポンペイウスについた。', art: 'roma.history.rubicon',
    always: { remove: ['sulla'], add: ['caesar'] },
    left: { title: 'カエサルの軍に加わる', art: 'choice.march', stake: riskBody(2), odds: 3, delay: 1, win: { text: 'ファルサルスの勝ち戦にいた。退役の土地を約束された。', add: ['kanjo.pharsalus', 'veteranland'], rank: 1, maxBody: 1 }, lose: { text: '五十の身で戦に出て、倒れた。', die: true } },
    right: { title: '村に残る', art: 'choice.stay', stake: SUB, odds: 3, win: { text: '代わりに出た者は無事に帰ってきた。' }, lose: { text: '代わりに出た者は帰らなかった。' } } },
  { id: 'hist.idus', frame: 'path', year: -44, omen: '三月の半ばに気をつけろという占いの噂', title: 'カエサルの死', story: 'カエサルが元老院で刺された。ローマはまた割れる。', art: 'roma.history.idus',
    left: { title: 'パトロヌスのもとへ駆けつける', art: 'choice.patron', stake: riskBody(), odds: 4, win: { text: '混乱の中でパトロヌスを守り、信を得た。', add: ['patronfavor'] }, lose: { text: '暴徒に巻き込まれ、傷を負った。', add: ['wound'] } },
    right: { title: '家の神々に祈る', art: 'choice.lares', stake: body(), odds: 5, win: { text: '炉の前で、家族の無事を祈った。', add: ['gods'] }, lose: { text: '祈っても、胸のざわつきは消えなかった。' } } },
  { id: 'hist.actium', frame: 'path', year: -31, omen: 'オクタウィアヌスとアントニウスが睨み合っている', title: 'アクティウム', story: 'アクティウムの海戦で、オクタウィアヌスが勝った。長い内乱が終わるらしい。', art: 'roma.history.actium',
    always: { remove: ['caesar'], add: ['augustus'] },
    left: { title: '都の祝いに出かける', art: 'choice.procession', stake: store(2), odds: 4, win: { text: '凱旋式を見た。都は浮かれていた。', add: ['forumgossip'] }, lose: { text: '旅の途中で体を壊した。', body: -1 } },
    right: { title: '畑で静かに迎える', art: 'choice.rest', stake: body(), odds: 5, win: { text: '戦の無い世のワインはうまい。', add: ['villa'] }, lose: { text: '祝いの声が遠くて、鍬が重かった。' } } },

  // ── 災い
  { id: 'dis.famine', frame: 'disaster', disaster: true, repeat: true, omen: '雨が降らない', title: '不作', story: '日照りで、麦が実らなかった。', art: 'roma.disaster.famine',
    left: { title: '畑を売って食いつなぐ', art: 'choice.sellpaddy', stake: spend('kind:田'), odds: 6, win: { text: '畑を売った金で冬を越した。', store: 2 } },
    right: { title: '体で耐える', art: 'choice.endure', stake: riskBody(2), odds: 3, win: { text: '飢えをしのいだ。' }, lose: { text: '飢えで体を壊した。' } } },
  { id: 'dis.fever', frame: 'disaster', disaster: true, repeat: true, omen: '沼地から悪い空気が来る', title: '熱病', story: '夏の熱病（マラリア）が村に入ってきた。', art: 'roma.disaster.fever',
    left: { title: '家族を看病する', art: 'choice.nurse', stake: riskBody(2), odds: 3, win: { text: '家族は持ち直した。' }, lose: { text: '看病のうちに自分も倒れた。', maxBody: -1 } },
    // 現代人なら誰でも知っている常識の手（前世の職を問わない）。効くが、村からは変わり者に見える。
    right: { title: '水たまりを埋め、寝床を布で覆う', art: 'choice.netting', modern: true, stake: body(), odds: 5, win: { text: '村の者は首をかしげたが、家から熱が引いていった。', add: ['netting', 'oddity'] }, lose: { text: '間に合わず、熱は家族を襲った。村の者には笑われた。', add: ['oddity'] } } },

  // ── 外の死（病・戦・暴力・犯罪・事故）。死ぬのは、かならず画面に出た札の結果として
  { id: 'dis.plague', frame: 'disaster', disaster: true, repeat: true, omen: '都で疫病がはやっているという', title: '疫病', story: '都から疫病が広がってきた。村でも人が死にはじめた。', art: 'roma.disaster.plague',
    left: { title: '戸を閉ざして家に籠る', art: 'choice.shut', stake: store(2), odds: 4, win: { text: '疫病は家の前を通り過ぎた。' }, lose: { text: '疫病が家に入り、体を壊した。', body: -2, maxBody: -1 } },
    right: { title: '畑に出続ける', art: 'choice.till', stake: riskBody(2), odds: 3, win: { text: '倒れずに、畑を守りきった。', store: 1 }, lose: { text: '疫病に倒れた。', die: true } } },
  { id: 'dis.wound', frame: 'disaster', disaster: true, repeat: true, needs: ['wound'], omen: '古傷がうずく', title: '傷の膿み', story: '古傷が膿んで、熱が出た。', art: 'roma.disaster.wound',
    left: { title: '煮た湯で傷を洗い、焼いて塞ぐ', art: 'choice.clean', modern: true, stake: body(), odds: 5, win: { text: '熱が引き、傷はふさがった。村の者は気味悪がった。', remove: ['wound'], add: ['oddity'] }, lose: { text: '傷の熱で死んだ。', die: true } },
    right: { title: '神々に祈って耐える', art: 'choice.lares', stake: body(), odds: 3, win: { text: '熱は引いた。' }, lose: { text: '傷の熱で死んだ。', die: true } } },
  { id: 'vi.sack', frame: 'disaster', disaster: true, repeat: true, years: [-91, -31], omen: '近くを軍が通るという', title: '兵の押し入り', story: '通りがかりの兵の一隊が、村に押し入ってきた。', art: 'roma.violence.sack',
    left: { title: '蓄えを差し出す', art: 'choice.yield', stake: store(3), odds: 5, win: { text: '兵は蓄えを持って去った。' }, lose: { text: '足りないと殴られた。', body: -2 } },
    right: { title: '家族を連れて丘へ逃げる', art: 'choice.flee', stake: riskBody(2), odds: 4, win: { text: '兵が去るまで、丘に隠れた。' }, lose: { text: '逃げ遅れて、兵に斬られた。', die: true } } },
  { id: 'vi.robbery', frame: 'disaster', disaster: true, repeat: true, needsAny: ['shop', 'villa', 'veteranland'], omen: '近ごろ夜盗が出るという', title: '夜盗', story: '夜、盗賊が家に押し入った。', art: 'roma.violence.robbery',
    left: { title: '棒を取って立ち向かう', art: 'choice.fight', stake: riskBody(2), odds: 3, win: { text: '盗賊を追い払った。村で評判になった。', add: ['villagetrust'] }, lose: { text: '盗賊の刃に倒れた。', die: true } },
    right: { title: '蓄えを渡して命を守る', art: 'choice.yield', stake: store(4), odds: 6, win: { text: '命は助かった。蓄えは消えた。' } } },
  { id: 'vi.road', frame: 'fight', ages: [16, 60], repeat: true, weight: 2, axis: 'money', title: '街道の荷運び', story: '町までの荷運びの仕事がある。街道には追い剥ぎが出るという。', art: 'roma.violence.road',
    left: { title: '一人で荷を運んで稼ぐ', art: 'choice.carry', stake: riskBody(2), odds: 4, win: { text: '荷を届け、駄賃を手にした。', store: 3, add: ['kept.road'] }, lose: { text: '街道で追い剥ぎに殺された。', die: true } },
    right: { title: '酒場で仲間を誘う', art: 'choice.tavern', stake: store(1), odds: 5, win: { text: '気のいい仲間ができた。', add: ['friend'] }, lose: { text: '誘った相手に財布を盗まれた。' } } },
  { id: 'vi.tavern', frame: 'fight', ages: [16, 55], repeat: true, title: '居酒屋の喧嘩', story: '居酒屋で、酔った男が絡んできた。', art: 'roma.violence.tavern',
    left: { title: '殴り返す', art: 'choice.fight', stake: riskBody(2), odds: 3, win: { text: '男をのした。腕っぷしの評判が立った。', add: ['strongbody', 'kept.tavern'], maxBody: 1 }, lose: { text: '頭を打って、起き上がらなかった。', die: true } },
    right: { title: '銭を置いて店を出る', art: 'choice.back', stake: store(1), odds: 6, win: { text: '面倒を避けた。' } } },
  { id: 'vi.feud', frame: 'fight', ages: [18, 65], repeat: true, needs: ['patrongrudge'], title: '待ち伏せ', story: '恨みを買った相手が、手下を連れて待ち伏せている。', art: 'roma.violence.feud',
    left: { title: '正面から迎え撃つ', art: 'choice.fight', stake: riskBody(3), odds: 3, win: { text: '相手を退けた。恨みは晴れないまま残った。' }, lose: { text: '待ち伏せの刃に倒れた。', die: true } },
    right: { title: '畑を預けて町を離れる', art: 'choice.migrate', stake: lock('kind:田', 2), odds: 5, win: { text: '二年、町に身を隠した。', remove: ['patrongrudge'] }, lose: { text: '隠れ先も見つかり、畑に戻った。' } } },

  // ── 家族の節目
  { id: 'fam.sister', frame: 'family', ages: [15, 20], needs: ['sister'], title: '妹の嫁入り', story: '父が、妹を隣町の家へ嫁がせると決めた。', art: 'roma.scene.wedding',
    always: { remove: ['sister'], add: ['inlaw'] },
    left: { title: '持参金を出す', art: 'choice.dowry', stake: store(2), odds: 6, win: { text: '妹は胸を張って嫁いだ。', add: ['villagetrust'] } },
    right: { title: '婚礼の行列で歌う', art: 'choice.sing', stake: body(), odds: 4, win: { text: '歌がうまいと評判になった。', add: ['lover.vine'] }, lose: { text: '声が裏返って、笑われた。' } } },
  { id: 'fam.father', frame: 'family', ages: [28, 42], needsAny: ['father', 'oldfather'], title: '家長の死', story: '父が床についた。家長の権は、これからこちらに移る。', art: 'roma.scene.father.end',
    always: { remove: ['father', 'oldfather'] },
    left: { title: 'そばで看取る', art: 'choice.watch', stake: lock('kind:田', 1), odds: 6, win: { text: '父は家の神々の話をして逝った。', add: ['gods'] } },
    right: { title: '立派な葬列を出す', art: 'choice.funeral', stake: store(2), odds: 6, win: { text: '父の蝋の面を掲げた葬列に、村中が並んだ。', add: ['villagetrust'] } } },
  { id: 'ie.succession', frame: 'family', family: true, ages: [28, 75], title: '跡目争い', story: '縁者が家の跡目を求めた。', art: 'roma.scene.family', contest: 'succession',
    left: { title: '跡取りを後押しする', art: 'choice.enlist', odds: 3, win: { text: '跡目を守り、相手は分家した。' }, lose: { text: '相手が跡目を継ぎ、こちらは分家した。' } },
    right: { title: '相手を跡取りに替える', art: 'choice.cultivate', odds: 6, win: { text: '相手を跡取りに替えた。' } } },
  { id: 'fam.mother', frame: 'family', ages: [33, 50], needs: ['mother'], title: '母の死', story: '母が静かに息を引き取った。', art: 'roma.scene.mother.end',
    always: { remove: ['mother'] },
    left: { title: '墓碑を刻ませる', art: 'choice.memorial', stake: store(2), odds: 6, win: { text: '街道沿いに、母の名を刻んだ墓が建った。', add: ['villagetrust'] } },
    right: { title: '母の好きな花を植える', art: 'choice.flowers', stake: body(), odds: 6, win: { text: '庭に母の花が咲いた。', add: ['garden'] } } },

  // ── ラブ
  { id: 'lo.meet', frame: 'path', ages: [16, 50], repeat: true, axis: 'love', title: '出会い', story: '見知らぬ人と目が合った。', art: 'roma.scene.meet',
    left: { title: '声をかける', art: 'choice.approach', stake: store(1), odds: 5, win: { text: 'また会う約束をした。', add: ['lover.vine'] }, lose: { text: '相手にされなかった。' } },
    right: { title: '村の祭りを取り仕切る', art: 'choice.festival', stake: body(), odds: 5, win: { text: '祭りを仕切り、頼られた。', add: ['villagetrust'] }, lose: { text: '段取りを誤り、年寄りに叱られた。' } } },
  { id: 'lo.visit', frame: 'path', axis: 'love', ages: [16, 50], repeat: true, needsAny: LOVERS, title: '会いに行く', story: '縁を結んだ人のもとへ、足を運ぶ。', art: 'roma.scene.visit',
    left: { title: '贈り物を持って行く', art: 'choice.approach', stake: store(1), odds: 4, win: { text: '縁が深まった。' }, lose: { text: '留守だった。' } },
    right: { title: '仕事を切り上げて行く', art: 'choice.back', stake: body(), odds: 5, win: { text: '縁をつないだ。' }, lose: { text: '行き違いになった。' } } },
  { id: 'lo.marry', frame: 'family', ages: [18, 60], repeat: true, axis: 'love', needsAny: LOVERS, title: '添う相手', story: '家から、想い人か取り決めの相手と添うよう話が来た。', art: 'roma.scene.marry',
    left: { title: '想い人と添う', art: 'choice.lovematch', stake: risk('neighbors'), odds: 4, win: { text: '想い人と夫婦になった。', add: ['spouse'] }, lose: { text: '村とは気まずくなったが、夫婦になった。', add: ['spouse'] } },
    right: { title: '取り決めの相手と添う', art: 'choice.arranged', stake: store(1), odds: 6, win: { text: '取り決めの相手と夫婦になった。持参金に畑が付いた。', add: ['arrangedspouse', 'newfield'] } } },
  { id: 'lo.arranged', frame: 'family', ages: [20, 60], repeat: true, title: '縁組の話', story: 'パトロヌスが、自分の縁者の娘との縁組を持ちかけてきた。', art: 'roma.scene.arranged',
    left: { title: '受ける', art: 'choice.accept', stake: store(1), odds: 6, win: { text: '夫婦になった。パトロヌスとの縁が深まった。', add: ['arrangedspouse', 'patronfavor'] } },
    right: { title: '断って町へ想い人を探しに出る', art: 'choice.seek', stake: riskBody(), odds: 3, win: { text: '町で出会いがあった。', meet: true }, lose: { text: 'パトロヌスの機嫌を損ねた。', add: ['patrongrudge'] } } },
  { id: 'lo.child', frame: 'family', ages: [19, 42], repeat: true, needsAny: ['spouse', 'arrangedspouse', 'mistress'], title: '子が生まれる', story: '妻が身ごもった。', art: 'roma.scene.childbirth',
    left: { title: '盛大に祝う', art: 'choice.celebrate', stake: store(2), odds: 6, win: { text: '村中で祝った。', add: ['child', 'villagetrust'] } },
    right: { title: '静かに迎える', art: 'choice.quietbirth', stake: body(), odds: 5, win: { text: '元気な子が生まれた。', add: ['child'] }, lose: { text: 'お産は難しく、子は育たなかった。' } } },
  { id: 'ch.seven', frame: 'family', ages: [20, 75], repeat: true, title: '子の学び', story: '子が七つになった。', art: 'roma.scene.child.seven',
    left: { title: '文法教師に通わせる', art: 'choice.reading', stake: store(1), odds: 5, win: { text: '子が文字を覚えはじめた。', add: ['childletters'] }, lose: { text: '教師になじめず、戻ってきた。' } },
    right: { title: '畑を手伝わせる', art: 'choice.carry', stake: body(), odds: 6, win: { text: '小さな手が畑仕事を覚えた。', add: ['childhands'] } } },
  { id: 'ch.fifteen', frame: 'family', ages: [20, 75], repeat: true, title: '子の行く末', story: '子が成人の衣（トガ）を着る年になった。', art: 'roma.scene.child.fifteen',
    left: { title: '畑を分けて家に残す', art: 'choice.paddy', stake: store(2), odds: 5, win: { text: '畑を分け、家のそばに住まわせた。', add: ['branchhouse'] }, lose: { text: '分ける畑が足りず、話は先送りになった。' } },
    right: { title: '都へ出す', art: 'choice.migrate', stake: body(), odds: 4, win: { text: '子は都のパトロヌスのもとへ出た。', sendChild: true, add: ['childaway'] }, lose: { text: '都になじまず、戻ってきた。' } } },
  { id: 'ie.retire', frame: 'family', family: true, ages: [55, 65], needsAny: ['grownchild', 'heir'], title: '家を譲る日', story: '跡取りも育ち、家を任せる頃合いになった。', art: 'roma.scene.retire',
    left: { title: '長子に家を譲る', art: 'choice.inherit', odds: 6, win: { text: '家を長子に譲り、身を引いた。', retire: 'inherit' } },
    right: { title: '子らに畑を分ける', art: 'choice.inherit', odds: 6, win: { text: '畑を子らに分け、分家ができた。', retire: 'divide', houseDown: true, add: ['branchhouse'] } } },

  // ── 軸の札
  { id: 'st.rhetoric', frame: 'path', ages: [16, 40], axis: 'status', needs: ['reading'], title: '弁論の師', story: '町に、弁論を教えるギリシア人の師がいる。', art: 'roma.scene.rhetoric',
    left: { title: '弁論を学ぶ', art: 'choice.rhetoric', stake: store(2), odds: 4, win: { text: '人前で話す術を身につけた。', add: ['rhetoric'] }, lose: { text: '月謝だけ払って、身につかなかった。' } },
    right: { title: '同じ銭で奴隷を買う', art: 'choice.slave', stake: store(2), odds: 5, win: { text: '働き手が一人増えた。', add: ['servant'] }, lose: { text: '買った奴隷は逃げた。' } } },
  { id: 'mo.market', frame: 'path', ages: [16, 60], axis: 'money', title: '町の市', story: '週ごとの市の日。ワインが高く売れている。', art: 'roma.scene.market',
    left: { title: '街道沿いに店を出す', art: 'choice.shop', cost: { store: 3 }, odds: 4, win: { text: '街道の店ができた。旅人が立ち寄る。', add: ['shop'] }, lose: { text: '盗賊に荷を奪われた。' } },
    right: { title: '市の居酒屋で人に会う', art: 'choice.tavern', stake: store(1), odds: 5, win: { text: '居酒屋の女主人と話し込んだ。', add: ['lover.tavern'] }, lose: { text: '飲みすぎて財布を落とした。' } } },
  { id: 'sr.arena', frame: 'fight', ages: [18, 35], axis: 'strength', title: '剣闘の誘い', story: '剣闘士の養成所の主が、腕の立つ自由人を探している。', art: 'roma.scene.arena',
    left: { title: '闘技場に立つ', art: 'choice.arena', stake: riskBody(3), odds: 3, win: { text: '観衆が名を叫んだ。木剣を与えられた。', add: ['kanjo.arena'], store: 3 }, lose: { text: '砂の上で倒れた。', die: true } },
    right: { title: '同じ腕で軍団に志願する', art: 'choice.march', stake: riskBody(2), odds: 4, win: { text: '軍団兵になった。', rank: 1, maxBody: 1 }, lose: { text: '行軍で足を壊した。', add: ['wound'] } } },
  { id: 'build.vineyard', frame: 'build', ages: [16, 60], repeat: true, max: { fieldId: 'newfield', count: 3 }, title: '丘の斜面', story: '村はずれの丘の斜面が空いている。', art: 'roma.scene.slope',
    left: { title: 'ブドウを植える', art: 'choice.till', cost: { body: 2, store: 1 }, odds: 4, win: { text: '斜面にブドウ畑が開けた。', add: ['newfield'] }, lose: { text: '苗が根づかなかった。' } },
    right: { title: '斜面に小さな庭を作る', art: 'choice.garden', cost: { body: 1 }, odds: 5, win: { text: '眺めのいい庭ができた。', add: ['villa'] }, lose: { text: '雨で土が流れた。' } } },

  { id: 'child.festival', frame: 'path', ages: [7, 12], axis: 'art', title: '収穫の祭り', story: '収穫の祭り。笛と歌で、村が夜まで踊る。', art: 'roma.scene.festival',
    left: { title: '歌の輪に入る', art: 'choice.sing', stake: body(), odds: 5, win: { text: '大人に混じって歌い、声をほめられた。', add: ['singer'] }, lose: { text: '声が裏返って、笑われた。' } },
    right: { title: '屋台を手伝う', art: 'choice.sell', stake: body(), odds: 5, win: { text: '駄賃に銅貨をもらった。', store: 1 }, lose: { text: '皿を割って、駄賃が消えた。' } } },
  { id: 'ar.copyist', frame: 'path', ages: [14, 35], axis: 'art', needs: ['reading'], title: '写字の仕事', story: '町の本屋が、書物を書き写す手を探している。', art: 'roma.scene.copyist',
    left: { title: '詩を書き写す', art: 'choice.reading', stake: body(), odds: 4, win: { text: '写しながら、詩の拍子を体で覚えた。', add: ['meter'] }, lose: { text: '写し損じが多くて、暇を出された。' } },
    right: { title: '帳簿を写す', art: 'choice.sell', stake: body(), odds: 5, win: { text: '手間賃をもらった。', store: 2 }, lose: { text: '手間賃を値切られた。' } } },
  { id: 'ar.fresco', frame: 'path', ages: [16, 50], axis: 'art', title: '壁を塗る仕事', story: '町の金持ちの家が、食堂の壁に絵を描かせる職人を探している。', art: 'roma.scene.fresco',
    left: { title: '絵筆をとる', art: 'choice.paint', stake: body(2), odds: 4, win: { text: '壁一面に、ブドウ摘みの村を描いた。', add: ['work.fresco'], store: 1 }, lose: { text: '漆喰が早く乾きすぎて、絵が割れた。' } },
    right: { title: '漆喰塗りだけ請け負う', art: 'choice.till', stake: body(), odds: 5, win: { text: '手間賃をもらった。', store: 2 }, lose: { text: '足場から落ちかけた。' } } },
  { id: 'ar.recital', frame: 'path', ages: [20, 60], axis: 'art', title: '朗読の会', story: '浴場の広間で、詩の朗読の会が開かれる。', art: 'roma.scene.recital',
    left: { title: '自作を読む', art: 'choice.rhetoric', stake: body(), odds: 4, win: { text: '最後の一行で、広間が静まった。', add: ['work.verse'] }, lose: { text: '途中で野次に負けた。', add: ['oddity'] } },
    right: { title: '聞き手に回る', art: 'choice.rest', stake: body(), odds: 5, win: { text: '人の詩を聴いて、拍子を盗んだ。', add: ['meter'] }, lose: { text: '途中で眠ってしまった。' } } },
  { id: 'ar.patron', frame: 'path', ages: [20, 45], axis: 'art', title: '詩を好む貴人', story: 'ローマの貴人が、若い詩人や絵描きを屋敷に集めているという。', art: 'roma.scene.patron',
    left: { title: '作品を携えて訪ねる', art: 'choice.patron', stake: store(2), odds: 3, win: { text: '貴人が、暮らしの面倒を見てくれることになった。', add: ['artpatron'], store: 2 }, lose: { text: 'ひと目見ただけで、帰された。' } },
    right: { title: '宴で給仕する', art: 'choice.network', stake: body(), odds: 5, win: { text: '客の噂話を聞いた。', add: ['forumgossip'] }, lose: { text: '酒をこぼして叱られた。' } } },
  { id: 'ar.epitaph', frame: 'path', ages: [25, 70], axis: 'art', title: '墓碑銘の注文', story: '村の家が、亡くなった父の墓に刻む詩を頼みに来た。', art: 'roma.scene.epitaph',
    left: { title: '心を込めて書く', art: 'choice.reading', stake: body(), odds: 5, win: { text: '家の者が、刻まれた詩の前で泣いた。', add: ['work.epitaph'] }, lose: { text: '石工に字を間違えられた。' } },
    right: { title: 'ありきたりの文で済ませる', art: 'choice.sell', stake: body(), odds: 5, win: { text: '礼の銭をもらった。', store: 2 }, lose: { text: '遺族に、つまらない文だと値切られた。' } } },
  { id: 'ar.spread', frame: 'path', ages: [35, 75], axis: 'art', needs: ['artpatron'], title: '口にのぼる詩', story: '自分の詩が、町の子らの口にのぼっているらしい。', art: 'roma.scene.spread',
    left: { title: '写本を作らせて配る', art: 'choice.reading', stake: store(3), odds: 2, win: { text: '写本が、遠くの町まで渡っていった。', add: ['work.copied'] }, lose: { text: '写字生が勝手に書き換えた。' } },
    right: { title: 'そっとしておく', art: 'choice.rest', odds: 5, win: { text: '畑で、自分の詩を口ずさむ声を聞いた。' }, lose: { text: '誰かが、詩の文句を変えて歌っていた。' } } },

  // ── 求める札
  // パトロヌスの求めは、クリエンテスの家にだけ来る義務。抜ければもう来ない
  { id: 'cl.leave', frame: 'path', ages: [25, 60], needs: ['cliens'], title: 'パトロヌスとの縁', story: '朝の挨拶に通う日々が続く。挨拶通いをやめて、独り立ちする家もある。', art: 'roma.scene.salutatio',
    left: { title: '挨拶に通い続ける', art: 'choice.patron', stake: body(), odds: 5, win: { text: 'パトロヌスが、名を覚えてくれた。', add: ['patronfavor'] }, lose: { text: 'パトロヌスは、顔も見なかった。' } },
    right: { title: 'クリエンテスを抜ける', art: 'choice.skip', stake: store(2), odds: 3, win: { text: '挨拶通いをやめた。これからは、自分の家の主だ。', remove: ['cliens'], add: ['villagetrust'] }, lose: { text: '挨拶通いをやめたが、パトロヌスの不興を買った。', remove: ['cliens'], add: ['patrongrudge'] } } },
  { id: 'dm.vote', frame: 'demand', ages: [20, 70], needs: ['cliens'], repeat: true, demand: true, ignore: { label: 'パトロヌスの不興を買う', effect: { text: 'パトロヌスの朝の挨拶に行かず、選挙でも票を入れなかった。', add: ['patrongrudge'] } }, title: 'パトロヌスの求め', story: 'パトロヌスが選挙に出る。朝の挨拶に通い、票を入れろという。', art: 'roma.scene.salutatio',
    left: { title: '朝の挨拶に通って票を入れる', art: 'choice.patron', stake: body(2), odds: 6, win: { text: 'パトロヌスは当選した。覚えがよくなった。', add: ['patronfavor'] } },
    right: { title: 'その年のくじの札', art: 'choice.skip', stake: store(1), odds: 5, win: { text: '' }, lose: { text: '' } } },

  // ── 回復と静かな年
  { id: 'rec.medicine', frame: 'recovery', ages: [15, 75], repeat: true, cooldown: 10, tired: true, title: '浴場', story: '町の公衆浴場が新しくなった。', art: 'roma.scene.baths',
    left: { title: '浴場で体を休める', art: 'choice.baths', stake: store(1), odds: 6, win: { text: '湯と蒸し風呂で体がほぐれた。', body: 2, remove: ['wound'] } },
    right: { title: '浴場で人脈を作る', art: 'choice.network', stake: body(), odds: 4, win: { text: '町の顔役と知り合った。', add: ['forumgossip'] }, lose: { text: '話が合わなかった。' } } },
  { id: 'q.season', frame: 'quiet', quiet: true, repeat: true, ages: [7, 75], title: '静かな一年', story: '大きなことのない一年だった。', art: 'roma.scene.quiet',
    left: { title: '一年が過ぎる', art: 'choice.rest', odds: 6, win: { text: '大きなことのない一年だった。' } },
    right: { title: '一年が過ぎる', art: 'choice.rest', odds: 6, win: { text: '大きなことのない一年だった。' } } },
  ...VIGNETTES.map(([id, ages, title, text, extra = {}]) => ({ id, frame: 'quiet', quiet: true, ages, title, story: text, art: `roma.life.${id.slice(5)}`, ...extra,
    left: { title, art: 'choice.rest', odds: 6, win: { text } }, right: { title, art: 'choice.rest', odds: 6, win: { text } } })),
];

// 二択の左右を、それぞれ 1 枚の札として見せるための文（無くても動く）。
// scene: 真ん中の場面に添える、左右が取り合うもの。head / lead: 左右の札の名と一行。
const SIDES = {
  'dis.plague': { scene: '疫病が来た', left: { head: '閉ざした戸', lead: '蓄えを食いながら、家に籠る。' }, right: { head: '実りかけの麦', lead: '畑を放っておけば、冬に困る。' } },
  'dis.wound': { scene: '傷が膿んだ', left: { head: '煮た湯', lead: '傷は洗って、熱で塞ぐ。前の世では誰でも知っていた。' }, right: { head: '炉の神々', lead: '祈って、熱が引くのを待つ。' } },
  'vi.sack': { scene: '兵が来た', left: { head: '家の蓄え', lead: '差し出せば、命までは取られないかもしれない。' }, right: { head: '丘の茂み', lead: '逃げ切れば、何も渡さずに済む。' } },
  'vi.robbery': { scene: '夜盗が来た', left: { head: '戸口の棒', lead: '追い払えば評判になる。負ければ死ぬ。' }, right: { head: '蓄えの壺', lead: '渡せば、命は助かる。' } },
  'vi.road': { scene: '街道の仕事', left: { head: '荷車', lead: '駄賃はいい。街道には追い剥ぎが出る。' }, right: { head: '酒場の仲間', lead: '一人で行かずに済む仲間を探す。' } },
  'vi.tavern': { scene: '酔った男が絡んできた', left: { head: '握った拳', lead: '殴り返せば名が立つ。打ちどころが悪ければ死ぬ。' }, right: { head: '店の戸口', lead: '銭を置いて、黙って出る。' } },
  'vi.feud': { scene: '恨みを買った', left: { head: '待ち伏せの道', lead: '迎え撃てば、片がつくかもしれない。' }, right: { head: '町の隠れ家', lead: '畑を預けて、しばらく身を隠す。' } },
  'child.vintage': { scene: '秋の手は足りない', left: { head: '籠運び', lead: '大人に混じって、重い籠を担ぐ。' }, right: { head: '桶踏み', lead: '子らが桶に入って、ブドウを踏む。' } },
  'child.grammar': { scene: '月謝と供え物、どちらに使うか', left: { head: '町の文法教師', lead: '月謝を払えば、読み書きを教えてくれる。' }, right: { head: '炉の神々', lead: '父が、家の祭りを手伝えという。' } },
  'child.road': { scene: '街道を軍団が通る', left: { head: '軍団の隊列', lead: '槍と盾が、日に光っている。' }, right: { head: '喉の渇いた兵', lead: '兵たちは水を欲しがっている。' } },
  'hist.socialwar': { scene: 'イタリアが割れた', left: { head: '父の畑', lead: '畑に張りつけば、兵に麦を持っていかれずに済むかもしれない。' }, right: { head: '町の噂', lead: '町へ出れば、この戦が何をもたらすか分かる。道中は危ない。' } },
  'hist.sulla': { scene: '名簿が貼り出された', left: { head: 'パトロヌスの家', lead: 'パトロヌスに頼めば、畑の没収を止めてくれるかもしれない。' }, right: { head: '麦畑', lead: '黙っていれば、見逃されるかもしれない。見逃されなければ麦畑を失う。' } },
  'hist.spartacus': { scene: '体はひとつ', left: { head: '兵の募集', lead: '反乱を鎮める軍団が、人を集めている。' }, right: { head: 'いつもの暮らし', lead: '村に残り、家を守る。' } },
  'hist.civilwar': { scene: '体はひとつ', left: { head: 'カエサルの軍', lead: '川を渡った軍が、兵を集めている。' }, right: { head: 'いつもの暮らし', lead: '村に残り、家を守る。' } },
  'hist.idus': { scene: 'ローマがまた割れる', left: { head: 'パトロヌスの家', lead: 'パトロヌスの屋敷に駆けつければ、恩を売れる。暴徒に巻き込まれるかもしれない。' }, right: { head: '炉の神々', lead: '家にこもって、嵐が過ぎるのを待つ。' } },
  'hist.actium': { scene: '内乱が終わる', left: { head: '都の凱旋式', lead: '都では、勝者の行列が出るという。' }, right: { head: '戦の無い畑', lead: '今年のワインは、ゆっくり飲める。' } },
  'dis.famine': { scene: '冬を越す蓄えがない', left: { head: '畑の買い手', lead: '畑を手放せば、確かに冬を越せる。' }, right: { head: '空の穀物庫', lead: '食べる量を減らして春を待つ。体がもつかは分からない。' } },
  'dis.fever': { scene: '熱が家に入ってきた', left: { head: '寝床の家族', lead: 'そばで看病すれば、家族は持ち直すかもしれない。自分もうつるかもしれない。' }, right: { head: '沼の蚊', lead: '熱は悪い空気ではなく、蚊が運ぶ。前の世では誰でも知っていた。' } },
  'fam.sister': { scene: '妹が嫁ぐ', left: { head: '持参金', lead: '持参金が多いほど、嫁ぎ先で大事にされる。' }, right: { head: '婚礼の行列', lead: '若者たちが、行列で歌う。' } },
  'fam.father': { scene: '父が床についた', left: { head: '父の枕元', lead: '父のそばに、ついていられるのは今だけだ。' }, right: { head: '葬列', lead: '先祖の蝋の面を掲げて、村を練り歩く。' } },
  'ie.succession': { scene: '家の跡目', left: { head: '跡目を争う', lead: '縁者が、家長の座を求めている。' }, right: { head: '跡目を譲る', lead: '譲れば、争いは起きない。' } },
  'fam.mother': { scene: '母を見送った', left: { head: '墓碑', lead: '街道沿いに、名を刻んだ墓を建てる。' }, right: { head: '母の庭', lead: '母が好きだった花がある。' } },
  'lo.meet': { scene: '祭りの日', left: { head: '見知らぬ人', lead: '人混みの向こうで、目が合った。' }, right: { head: '祭りの段取り', lead: '年寄りたちが、仕切り役を探している。' } },
  'lo.visit': { scene: '縁を結んだ人がいる', left: { head: '贈り物', lead: '小さな贈り物を持って、会いに行く。' }, right: { head: '連れ立つ', lead: '人目のある所へ、二人で出る。' } },
  'lo.marry': { scene: '添う話が来た', left: { head: '想い人', lead: '家の決めた相手ではない。' }, right: { head: '取り決めの相手', lead: '家どうしで決めた相手だ。' } },
  'lo.arranged': { scene: 'パトロヌスから縁組の話', left: { head: 'パトロヌスの縁者の娘', lead: '受ければ、パトロヌスとの縁が深まる。' }, right: { head: '町の人混み', lead: '自分で相手を探しに出る。' } },
  'lo.child': { scene: '子が生まれる', left: { head: '祝いの宴', lead: '村中を呼んで祝う。' }, right: { head: '静かな産室', lead: '家の者だけで迎える。' } },
  'ch.seven': { scene: '子が七つになった', left: { head: '文法教師', lead: '月謝を払えば、字を習える。' }, right: { head: '畑の手伝い', lead: '小さな手でも、畑では役に立つ。' } },
  'ch.fifteen': { scene: '子が成人の衣を着る', left: { head: '分ける畑', lead: '畑を分ければ、子は家のそばに残る。' }, right: { head: '都のパトロヌス', lead: '都へ出せば、子は自分の道を行く。' } },
  'ie.retire': { scene: '家を譲る頃合い', left: { head: '長子', lead: '家をひとつのまま、長子に任せる。' }, right: { head: '子ら', lead: '畑を分けて、子らそれぞれに家を持たせる。' } },
  'st.rhetoric': { scene: '銭の使い道', left: { head: 'ギリシア人の師', lead: '弁論を学べば、人前で話せるようになる。' }, right: { head: '奴隷市', lead: '同じ銭で、働き手が一人買える。' } },
  'mo.market': { scene: '市の日', left: { head: '街道の空き地', lead: '旅人が通る道に、店を出せる。' }, right: { head: '市の居酒屋', lead: '女主人が、客の話をよく聞いてくれる。' } },
  'sr.arena': { scene: '腕を見込まれた', left: { head: '剣闘士の養成所', lead: '勝てば名が上がる。負ければ死ぬ。' }, right: { head: '軍団の募集', lead: '同じ腕で、兵として志願できる。' } },
  'build.vineyard': { scene: '丘の斜面が空いている', left: { head: 'ブドウの苗', lead: '斜面に植えれば、何年か後に実る。' }, right: { head: '眺めのいい斜面', lead: '小さな庭を作って、休む場所にする。' } },
  'dm.vote': { scene: '体はひとつ', left: { head: 'パトロヌスの求め', lead: '朝の挨拶に通い、票を入れろという。' } },
  'rec.medicine': { scene: '浴場が新しくなった', left: { head: '蒸し風呂', lead: '湯に浸かれば、体がほぐれる。' }, right: { head: '浴場の顔役', lead: '湯の中では、町の顔役とも話せる。' } },
  'q.season': { scene: '静かな一年', left: { head: '麦畑', lead: '耕せば、麦が少し余る。' }, right: { head: '炉ばた', lead: '家で体を休める。' } },
};
for (const card of CARDS) {
  const side = SIDES[card.id];
  if (!side) continue;
  if (side.scene) card.scene = side.scene;
  for (const k of ['left', 'right']) if (side[k] && card[k]) Object.assign(card[k], side[k]);
}

// 生まれのくじ: 家の格ときょうだい。CHILDHOOD の該当の年を差し替える（重みは仮置き）
export const BIRTH = {
  houses: [
    { id: 'plain', weight: 2 },
    { id: 'modest', weight: 1, houseLevel: 2, houseStore: 3, patch: { 1: { prepend: '家は少しばかり暮らしに余裕がある。屋根は瓦で、納屋には麦の蓄えがある。' } } },
    { id: 'poor', weight: 1, add: ['debt'], patch: { 1: { prepend: '家の暮らしは苦しい。父は町の金貸しに借りがある。' } } },
  ],
  siblings: [
    { id: 'sister', weight: 2 },
    { id: 'younger', weight: 1, patch: { 3: { title: '弟が生まれた', story: '家に小さな声が増えた。父は、男の子だと喜んだ。', cards: ['kinsman'], kin: '弟', art: 'roma.event.brother' } } },
    { id: 'elder', weight: 1, patch: { 3: { title: '兄の背中', story: '四つ上の兄が、どこへでも連れて歩いてくれる。家を継ぐのは兄だと、誰もが思っている。', cards: ['kinsman'], kin: '兄', art: 'roma.event.brother' } } },
    { id: 'twoElder', weight: 1, patch: { 3: { title: '兄たち', story: '兄が二人いる。上の兄は父について畑へ出て、下の兄はいつも喧嘩の相手だ。', cards: [], kins: [{ rel: '兄', claim: 4, support: 1 }, { rel: '兄', claim: 4, support: 0 }], art: 'roma.event.brother' } } },
    { id: 'only', weight: 1, patch: { 3: { title: '一人っ子', story: '弟妹は生まれなかった。母は「お前ひとりで十分だよ」と笑う。', cards: [], art: 'roma.event.only' } } },
  ],
  // きょうだいを人数で引く（時代と場所で変える。仮置き）。born は 0 人〜8 人の重み
  siblingModel: { born: [1, 2, 3, 3, 3, 2, 2, 1, 1], elderShare: 0.5, deathRate: 0.45, youngerAges: [2, 4, 6], replaceAge: 3, elderAge: 3,
    plainEvent: { title: 'ひとりで歩く', story: '畑の端まで、ひとりで歩いて行けるようになった。', cards: [], art: 'roma.event.walk' },
    elderStory: '上には、{list}いる。いつも後ろをついて歩く。', only: 'きょうだいは、いない。',
    birthLines: { 妹: '妹が生まれた。' },
    // 6 歳で記憶が戻ったとき、現代の目で数え直す 1 行
    recallLines: {
      both: '思い返せば、この六年で弟妹が{born}生まれ、きょうだいのうち{lost}が育たなかった。村では、誰も珍しがらない。',
      born: '思い返せば、この六年で弟妹が{born}生まれた。',
      lost: '思い返せば、この六年で、きょうだいのうち{lost}が育たなかった。村では、誰も珍しがらない。',
    } },
  // 幼いきょうだいを亡くす率（時代と場所で変える。仮置き）。亡くすのは 5 歳の年に知らされる
  siblingDeath: { rate: 0.4, age: 5, lines: { 妹: '妹は、三つめの冬を越せなかった。', 弟: '弟は、熱を出して二日で逝った。', 兄: '兄のひとりが、川で溺れて戻らなかった。' } },
};
export const CHILDHOOD = [
  { year: -100, age: 0, title: '生まれた', story: 'イタリアの小さな農家に生まれた。', cards: ['mother', 'house'], art: 'roma.event.birth' },
  { year: -99, age: 1, title: '父の背', story: '父は麦畑に出て、夕方に戻る。この家の名を、背中で覚えた。', cards: ['father', 'paddy', 'ie'], art: 'roma.event.father' },
  { year: -98, age: 2, title: '村の顔', story: '近所の人たちが、よく顔を見に来る。父は朝ごとに、パトロヌスの家へ挨拶に出かける。', cards: ['neighbors', 'cliens', 'nanushiHouse'], art: 'roma.event.neighbors' },
  { year: -97, age: 3, title: '妹が生まれた', story: '家に小さな声が増えた。', cards: ['sister'], art: 'roma.event.sister' },
  { year: -96, age: 4, title: '炉の神々', story: '毎朝、炉の前の小さな神々に供物が置かれる。隣の家とは、水の引き方でときどき揉める。', cards: ['gods', 'neighborhouse'], art: 'roma.event.lares' },
  { year: -95, age: 5, title: '遠い都の話', story: 'ローマの元老院では、偉い人たちが争っているという。', cards: ['republic'], art: 'roma.history.republic' },
  { year: -94, age: 6, title: '季節を覚える', story: '種まき、麦刈り、ブドウ摘み。一年のめぐりが分かってきた。', cards: ['spring'], art: 'roma.event.seasons' },
];

export const FAMILY_OMENS = { 'fam.father': '父が咳をするようになった', 'fam.mother': '母が少し弱ってきた', 'fam.sister': '妹に縁組の話が来た', 'ie.succession': '跡目を求める縁者がいる', 'ie.retire': '跡取りに家を譲る頃合いだ', 'lo.arranged': '縁組の噂が立っている', 'lo.marry': '想い人との縁組が立っている', 'lo.divorce': '離縁の話が出ている', 'lo.child': '家に新しい命が宿った' };

const FAMILY_AGES = { 'fam.father': [28, 42], 'fam.mother': [33, 50], 'fam.sister': [15, 20], 'ie.succession': [28, 75], 'ie.retire': [55, 65], 'lo.arranged': [20, 30], 'lo.marry': [18, 60], 'lo.divorce': [22, 60] };
const INITIAL_FAMILY_EVENTS = ['fam.father', 'fam.mother', 'fam.sister', 'lo.arranged'];
// きょうだいは生まれのくじ（BIRTH.siblings）だけで決める。外の縁者（異母兄弟・叔父・いとこ）は子ども時代には出さない。
// 出したのに使われない人が増えるだけなので、相手として使う直前に出す形を相続の形と一緒に決める（2026-11-03 orange 了承）
const KINSHIP_RELATIVES = [];
const DISASTER_TARGETS = { fire: ['house', 'shop'], flood: ['paddy', 'newfield'], famine: ['paddy', 'newfield'] };
const TEXT = {
  demandSources: { 'dm.vote': 'パトロヌスより', 'hist.spartacus': '軍役', 'hist.civilwar': '軍役' },
  houseNames: { own: '{name}{layer}', neighbor: '隣の{name}{layer}', branch: '{rel}の{name}分家', patron: 'パトロヌスの{name}{layer}' },
  spouseLabel: '妻（{name}）',
  diedOfIt: 'それがもとで、助からなかった。',
  substitutes: { father: '父が「私が行こう」と申し出た。', grownchild: '子が「私が行きます」と申し出た。', fatherDemand: '父が「私が行こう」と', grownchildDemand: '子が「私が行きます」と', childChoice: '子の申し出を受ける', fatherChoice: '父の申し出を受ける', servantChoice: '奴隷を出す', hireChoice: '代わりの者を雇う', noneChoice: '誰も出さない', call: '軍役', noOne: '臆病者の噂が立つ', noOneResult: '軍役に誰も出さず、臆病者の噂が立った。', hireResult: '代わりの者を雇って軍役に出した。', result: '{name}は{outcome}', ignoreResult: '{name}が代わりに軍役へ出た。{outcome}', returned: '無事に戻った。', lost: '戻らなかった。' },
  contest: { lostField: '畑', surrender: '{rel}に家を譲り、別の家を立てた。{result}', splitField: '畑を分けてもらった。', littleField: '畑はわずかしか残らなかった。', inherited: '{rel}を家長に替えた。{loss}', titleLoss: '家の格を失った。', noField: '{rel}を退けたが、畑と家の格を失った。' },
  succession: { title: '家の継承争い', selfStory: '父の葬儀を終えた翌年、{rel}が家の継承を求めた。', story: '{rel}が家の継承を求めた。', fight: '{rel}と家の継承を争う', surrender: '{rel}に家を譲り、別の家を立てる', replace: '{rel}を家長に替える', noteSurrender: '{rel}に家を譲り、別の家を立てた', noteWin: '{rel}と家の継承を争って家長になった', noteLose: '{rel}と家の継承を争い、畑を失いながら家長になった' },
  kinArrive: '{rel}の{name}が顔を見せに来た。',
  grandchildBorn: '跡取りに子が生まれた。孫だ。',
  childSpared: 'まだ子どもだったので、命までは取られなかった。',
  introduce: { mother: '母の名は{name}。', father: '父は{name}。', sister: '妹は{name}と呼ばれる。', sisters: '妹は{name}と呼ばれる。この家の娘はみな同じ名で、大きい{name}、小さい{name}と呼び分ける。', 兄: '兄は{name}。' },
  namedTitle: '{name}、生まれる',
  namedAfterFather: '父と同じ名だ。',
  named: '九日目に、{name}と名づけられた。',
  yearEnd: '今年の実り：',
  maintenanceTitle: '{target}をよくする話', maintenanceStory: '{target}を、もう一段よくできそうだ。',
  medicineSide: { head: '薬売り', lead: '旅の薬売りが、親の病に効く薬を持っている。' },
  partingTitle: '疎遠になった縁', partingChoice: '会わないまま三年が過ぎた', partingArt: 'bond.parting', partingText: 'とは疎遠になった。思い出の品が残った。',
  familyShift: { fatherDeath: ['父の具合が持ち直した。', '父がめっきり老け込んだ。'], motherDeath: ['母の顔色が少し良くなった。', '母が床に伏せる日が増えた。'], sisterMarriage: ['妹の縁組が先に延びた。', '妹の縁組が早まりそうだ。'], arrangedMarriage: ['縁組の話が遠のいた。', '縁組の話が近づいてきた。'], partnerMarriage: ['添う話が先に延びた。', '添う話が近づいてきた。'], divorce: ['夫婦の溝が少し埋まった。', '夫婦の溝が深まった。'], birth: ['子はまだ授からない。', '子を授かる兆しがある。'] },
  lifeRoles: { general: 'イタリアの農夫', rank2: 'ケントゥリオ', champion: 'エクイテス', knownVillageHead: 'パトロヌスに重んじられた村の顔役', villageHead: '村の顔役', storehouse: '倉持ち', merchant: '商人', rank1: '軍団兵', martial: '剣闘士', hermit: '農村の隠者' },
  lifeTitles: { status: '名の通った', money: '富を築いた', love: '浮名を流した', slow: '土地に根付いた', strength: '腕の立つ', art: '名を残した', loveless: '恋に縁のなかった', celebratedLove: '浮名を流した', plain: '名もなき', kantoPrefix: '都へ出た' },
  houseEnding: { heading: '家の行く末：', inherited: '長子に譲った', divided: '子らに分けた', rival: 'と跡目を争い、家は二つに割れた', defended: 'と跡目を争い、跡取りが家を守った', ended: '当主の代で終えた', heir: '跡取り', yes: 'あり', no: 'なし' },
};
const CARD_RULES = {
  'lo.meet': 'partnerMeet', 'lo.visit': 'partnerVisit', 'lo.marry': 'partnerMarriage', 'lo.arranged': 'arrangedMarriage',
  'lo.child': 'birth', 'ch.seven': 'childSeven', 'ch.fifteen': 'childFifteen', 'fam.father': 'fatherDeath', 'fam.mother': 'motherDeath', 'fam.sister': 'sisterMarriage',
  'ie.succession': 'succession', 'ie.retire': 'retirement',
  'rec.medicine': 'medicine', 'maintenance': 'maintenance', 'q.season': 'quietCard', ...Object.fromEntries(VIGNETTES.map(([id]) => [id, 'quietCard'])),
  'hist.spartacus': 'battle', 'hist.civilwar': 'battle',
};
// 山札の型（2026-11-03 orange「ブランクカードでもいいのでまずカードを置いてみるのが筋」、範囲 × 軸で組み直し）。
// どの軸にも「家と村 → 町 → 都 → 天下と後世」の梯子を 1 段 1 枚ずつ置く。上の段の札は、その軸で一つ下の範囲以上の品を持っていると来る。
// 空き札で型を試し、2026-11-03 にすべての段を本物の札に置き換えた。二択に安全な側は無い（koko-made の決定）。右は別の軸の品を取りに行く。
const LADDER = [
  { ages: [7, 30], odds: 5 },
  { ages: [15, 50], odds: 4 },
  { ages: [25, 65], odds: 3 },
  { ages: [35, 75], odds: 2 },
];

// 梯子の上の段の本物の品（2026-11-03、Claude 下書き。史実で裏を取っていないところは「推測」）
Object.assign(FIELD, {
  senator: { name: '元老院議員', kind: '身分', marks: { status: 2 }, scope: 3, art: 'roma.senator' },
  consul: { name: '執政官の名簿（ファスティ）', kind: '品', marks: { status: 3 }, scope: 4, art: 'roma.consul' },
  publicani: { name: '徴税請負の組合の持ち分', kind: '仕事', marks: { money: 2 }, scope: 3, art: 'roma.publicani' },
  fortune: { name: '語り草の財産', kind: '品', marks: { money: 3 }, scope: 4, art: 'roma.fortune' },
  romelover: { name: '都で名の知れた恋', kind: '縁', marks: { love: 2 }, scope: 3, art: 'roma.romelover' },
  sunglove: { name: '詩に詠まれた恋', kind: '品', marks: { love: 3 }, scope: 4, art: 'roma.sunglove' },
  // スローライフの梯子は血筋でなく家が続くことで数える。跡取りは実子でも養子でもよい（2026-11-03 orange「家基準の世界だと養子は普通よね」）
  heirwed: { name: '跡取りの縁組', kind: '家族', marks: { slow: 1 }, rung: 3, art: 'roma.heirwed' },
  grandchild: { name: '孫', kind: '家族', marks: {}, rung: 3, stacks: true, art: 'roma.grandchild' },
  ancestor: { name: '語り継がれるご先祖', kind: '品', marks: { slow: 3 }, rung: 4, art: 'roma.ancestor' },
  chronicle: { name: '戦記に書かれた武勇', kind: '品', marks: { strength: 3 }, scope: 4, art: 'roma.chronicle' },
  triumph: { name: '凱旋式', kind: '品', marks: { status: 2, strength: 2 }, scope: 4, art: 'roma.triumph' },
});
// その段の札が来る条件: 挙げた軸のどれかで、一つ下の範囲以上の品を持っている
const ladderNeeds = (axes, rung) => Object.entries(FIELD).filter(([, f]) => axes.some((axis) => (f.marks?.[axis] || 0) > 0) && (f.rung ?? f.scope ?? 1) >= rung - 1).map(([id]) => id);
const rungCard = (id, axis, scope, rest) => ({ id, frame: 'path', ages: LADDER[scope - 1].ages, axis, needsAny: ladderNeeds([axis], scope), ...rest });
// 梯子の下の段（家と村・町）の本物の札で残す品。右側は空き札と同じく、軸の並びで隣の軸の同じ段に寄る
Object.assign(FIELD, {
  springvow: { name: '泉の約束', kind: '縁', marks: { love: 1 }, art: 'roma.keep.vine' },
  jar: { name: '床下の銀貨壺', kind: '暮らし', marks: { money: 1 }, art: 'roma.jar' },
  feastlove: { name: '宴の夜の浮名', kind: '縁', marks: { love: 2 }, scope: 2, art: 'roma.feast' },
  feastwrestle: { name: '力比べの冠', kind: '品', marks: { strength: 1 }, scope: 2, art: 'roma.keep.rudis' },
  winetrade: { name: '町の酒屋との取引', kind: '仕事', marks: { money: 2 }, scope: 2, yearly: { store: 1 }, art: 'roma.winetrade' },
  // 子の代の段（スローライフは代を重ねる梯子なので、範囲は家と村のまま）
  dowry: { name: '子の支度金', kind: '暮らし', marks: { slow: 1 }, rung: 2, art: 'roma.jar' },
});
const lowRung = (id, axis, rest) => ({ id, frame: 'path', ages: LADDER[0].ages, axis, ...rest });
CARDS.push(
  lowRung('lo.spring', 'love', { ages: [12, 30], title: '泉のほとり', story: '村の泉で、水を汲みに来る娘と毎朝顔を合わせる。', art: 'roma.scene.spring',
    left: { title: '野の花を渡す', art: 'choice.gift', stake: body(), odds: 5, win: { text: '娘は花を髪に挿した。夏の祭りの夜に会う約束をした。', add: ['springvow'] }, lose: { text: '娘は笑って、花を受け取らなかった。' } },
    right: { title: '泉の水を引いて庭をつくる', art: 'choice.rest', stake: body(), odds: 5, win: { text: '水路を掘り、家の庭に豆と香草を植えた。', add: ['garden'] }, lose: { text: '水路が崩れて、苗が流れた。' } } }),
  lowRung('mo.jar', 'money', { ages: [12, 30], title: '手元に残った銭', story: '駄賃とブドウを売った銭が、少しだけ手元に残った。', art: 'roma.scene.market',
    left: { title: '床下の壺に貯める', art: 'choice.sell', stake: store(1), odds: 5, win: { text: '壺の底で、銀貨が鳴った。', add: ['jar'] }, lose: { text: '壺を隠した場所を、弟に見つけられた。' } },
    right: { title: '祭りで娘に髪飾りを買う', art: 'choice.gift', stake: store(1), odds: 5, win: { text: '髪飾りを受け取った娘と、夏の祭りの夜に会う約束をした。', add: ['springvow'] }, lose: { text: '髪飾りは、ほかの若者のものより安かった。' } } }),
  // サトゥルナリアの宴では主人も奴隷も同じ卓につく（用語集のとおり）。宴の力比べは推測
  rungCard('lo.feast', 'love', 2, { title: 'サトゥルナリアの宴', story: '町の知り合いの家で、冬至の祭りの宴に招かれた。', art: 'roma.scene.feast',
    left: { title: '隣の席の人と夜通し語らう', art: 'choice.tavern', stake: store(1), odds: 4, win: { text: '宴のあと、二人のことが町の噂になった。', add: ['feastlove'] }, lose: { text: '酔って眠ってしまい、朝には誰もいなかった。' } },
    right: { title: '宴の力比べに出る', art: 'choice.wrestle', stake: body(), odds: 4, win: { text: '町の若者を次々に投げ、力比べの冠をもらった。', add: ['feastwrestle'] }, lose: { text: '最初の相手に投げられて、皆に笑われた。' } } }),
  rungCard('mo.wine', 'money', 2, { title: '町の酒屋', story: '町の酒屋が、村のワインを毎年まとめて買いたいという。', art: 'roma.scene.market',
    left: { title: '毎年卸す約束をする', art: 'choice.sell', stake: store(2), odds: 4, win: { text: '酒屋との取引が決まった。毎年、銀貨が入る。', add: ['winetrade'] }, lose: { text: '酒屋は、隣村のもっと安いワインに乗り換えた。' } },
    right: { title: '銭を子の支度に取り分ける', art: 'choice.rest', stake: store(2), odds: 4, win: { text: '子の嫁入りや婿入りの支度に、銭を取り分けた。', add: ['dowry'] }, lose: { text: '取り分けた銭は、凶作の年に消えた。' } } }),
);
// ステータスとストレングスの下の段（2026-11-03、Claude 下書き）。右側は軸の並びで隣の軸の同じ段に寄る
Object.assign(FIELD, {
  arbiter: { name: '寄り合いの仲裁役', kind: '役', marks: { status: 1 }, art: 'roma.keep.vine' },
  festmaster: { name: '町の祭りの世話役', kind: '役', marks: { status: 2 }, scope: 2, art: 'roma.feast' },
  wolfpelt: { name: '狼の毛皮', kind: '品', marks: { strength: 1 }, art: 'roma.keep.rudis' },
  caestus: { name: '拳闘の革帯', kind: '品', marks: { strength: 2 }, scope: 2, art: 'roma.keep.rudis' },
  cheers: { name: '都の闘技場の喝采', kind: '品', marks: { strength: 2 }, scope: 3, art: 'roma.keep.rudis' },
  ludusshare: { name: '剣闘士養成所の持ち分', kind: '仕事', marks: { money: 2 }, scope: 3, art: 'roma.jar' },
});
CARDS.push(
  lowRung('st.village', 'status', { title: '畑の境の争い', story: '隣どうしの二軒が、畑の境の石をめぐって言い争っている。', art: 'roma.scene.market',
    left: { title: '間に入って仲裁する', art: 'choice.patron', stake: body(), odds: 5, win: { text: '境の石を据え直し、両家に手を打たせた。村の寄り合いで、意見を聞かれるようになった。', add: ['arbiter'] }, lose: { text: '両家から、余計な口出しだと言われた。' } },
    right: { title: '争う一軒に銭を貸す', art: 'choice.sell', stake: store(1), odds: 5, win: { text: '貸した銭が、利息をつけて返ってきた。', add: ['jar'] }, lose: { text: '貸した相手は、境の争いに負けて返せなくなった。' } } }),
  // 推測: イタリアの町の祭りを、地元の有力者が世話役として費用を出して開いた形（碑文に例はあるが、農民出がどこまで加われたかは未確認）
  rungCard('st.town', 'status', 2, { title: '町の祭りの世話役', story: '町の祭りの世話役が一人足りない。費用を出せる者を探している。', art: 'roma.scene.feast',
    left: { title: '費用を出して世話役になる', art: 'choice.celebrate', stake: store(2), odds: 4, win: { text: '祭りは盛り上がった。町の名士の列に、名が加わった。', add: ['festmaster'] }, lose: { text: '祭りの日に雨が降り、出した銭のわりに人が来なかった。' } },
    right: { title: '祭りの夜、踊りの輪に入る', art: 'choice.tavern', stake: body(), odds: 4, win: { text: '輪の中で手を取った人と、町の噂になった。', add: ['feastlove'] }, lose: { text: '足を踏んでばかりで、輪から外された。' } } }),
  lowRung('sr.wolf', 'strength', { title: '狼が出た', story: '冬の夜、村の羊の囲いに狼が出るようになった。', art: 'roma.scene.spring',
    left: { title: '棒を持って待ち伏せる', art: 'choice.wrestle', stake: riskBody(1), odds: 5, win: { text: '狼を打ち倒した。毛皮は家の戸口に掛けた。', add: ['wolfpelt'] }, lose: { text: '狼に腕を噛まれた。', add: ['wound'] } },
    right: { title: '夜通し笛を吹いて群れを守る', art: 'choice.rest', stake: body(), odds: 5, win: { text: '狼は寄らなかった。夜の笛の節は、村の祭りで歌われるようになった。', add: ['singer'] }, lose: { text: '眠り込み、羊を一頭取られた。' } } }),
  // 町の体育場（パラエストラ）はポンペイなどイタリアの町にあった
  rungCard('sr.palaestra', 'strength', 2, { title: '町の体育場', story: '町の体育場で、拳闘の稽古をつける者がいる。', art: 'roma.scene.feast',
    left: { title: '拳闘の稽古に通う', art: 'choice.wrestle', stake: riskBody(1), odds: 4, win: { text: '町の若者で、かなう者がいなくなった。', add: ['caestus'] }, lose: { text: '鼻を折られた。', add: ['wound'] } },
    right: { title: '名士の子に稽古をつける', art: 'choice.patron', stake: body(), odds: 4, win: { text: '名士の父が、目をかけてくれるようになった。', add: ['patronfavor'] }, lose: { text: '名士の子に怪我をさせ、出入りを止められた。' } } }),
  // 自由人が自ら契約して剣闘士になること（アウクトラティ）はあった
  rungCard('sr.ludus', 'strength', 3, { title: '剣闘士養成所の誘い', story: '都の剣闘士養成所の主が、腕の立つ者を探して町に来た。', art: 'roma.scene.troupe',
    left: { title: '契約して都の闘技場に立つ', art: 'choice.march', stake: riskBody(2), odds: 3, win: { text: '都の闘技場で勝ち、群衆の喝采を浴びた。', add: ['cheers'] }, lose: { text: '深手を負って、闘技場を運び出された。', add: ['wound'] } },
    right: { title: '養成所に出資する', art: 'choice.sell', stake: store(3), odds: 3, win: { text: '興行は当たり、持ち分の銭が入るようになった。', add: ['ludusshare'] }, lose: { text: '看板の剣闘士が死に、興行は打ち切られた。' } } }),
);
// 空き札を外して細くなった上がり口を 1 枚ずつ足す（2026-11-03 orange「両方1枚ずつ足して」）
// 都の本屋が詩の写本を売ったのは史実（ホラティウスの詩を売ったソシウス兄弟）
Object.assign(FIELD, {
  bookshop: { name: '都の本屋に並んだ詩', kind: '品', marks: { art: 2 }, scope: 3, art: 'roma.keep.vine' },
});
CARDS.push(
  rungCard('ar.bookshop', 'art', 3, { title: '都の本屋', story: '都の本屋が、写字生に詩を書き写させて売っている。新しい詩を探しているという。', art: 'roma.scene.poet',
    left: { title: '詩の巻物を売り込む', art: 'choice.reading', stake: store(2), odds: 3, win: { text: '本屋は詩を書き写させ、店先に並べた。都の誰かが読んでいる。', add: ['bookshop'] }, lose: { text: '本屋は、地方の詩は売れないと言った。' } },
    right: { title: '本屋の娘に詩を贈る', art: 'choice.gift', stake: body(), odds: 3, win: { text: '娘は詩を読み、返事をくれた。二人の恋は都で噂になった。', add: ['romelover'] }, lose: { text: '詩は、父親の手に渡った。' } } }),
  { id: 'sl.split', frame: 'path', ages: [35, 65], axis: 'slow', needsAny: ['grownchild'], lacks: ['branchhouse'], title: '子に畑を分ける', story: '育った子が、所帯を持ちたいと言う。畑の一画を分けてやれば、家が二つになる。', art: 'roma.scene.adopt',
    left: { title: '畑を分けて家を建てさせる', art: 'choice.rest', stake: store(2), odds: 4, win: { text: '子は分けた畑に家を建てた。煙が二つ上がるようになった。', add: ['branchhouse'] }, lose: { text: '分けた畑は痩せていて、子は都へ働きに出た。' } },
    right: { title: '子の新しい家の壁に絵を描く', art: 'choice.memorial', stake: body(), odds: 4, win: { text: '壁の絵は、近所の評判になった。町からも見に来る人がいた。', add: ['work.fresco'] }, lose: { text: '漆喰が乾かず、絵は流れた。' } } },
);
CARDS.push(
  rungCard('st.senate', 'status', 3, { title: '元老院の空席', story: '元老院の席が増やされ、騎士身分や町の名士から議員を選ぶという。', art: 'roma.scene.senate',
    left: { title: '名乗りを上げる', art: 'choice.patron', stake: store(3), odds: 3, win: { text: '元老院の議員になった。トゥニカに太い紫の縞が入る。', add: ['senator'] }, lose: { text: '名乗った者が多すぎて、選ばれなかった。' } },
    right: { title: '同じ銭で徴税請負に加わる', art: 'choice.sell', stake: store(3), odds: 3, win: { text: '属州の税を請け負う組合に、持ち分を得た。', add: ['publicani'] }, lose: { text: '組合の帳簿は赤字だった。' } } }),
  rungCard('st.consul', 'status', 4, { title: '執政官選挙', story: '名家の出でない者が執政官に立つ。百年に何人もいない。', art: 'roma.scene.consul',
    left: { title: '執政官に立つ', art: 'choice.rhetoric', stake: store(5), odds: 2, win: { text: '執政官に選ばれた。名が執政官の名簿に刻まれ、その年は自分の名で呼ばれる。', add: ['consul'] }, lose: { text: '名家の候補に敗れた。' } },
    right: { title: '将軍の副官として東方へ', art: 'choice.march', stake: riskBody(2), odds: 2, win: { text: '東方の戦で働き、将軍の戦記に名が書かれた。', add: ['chronicle'] }, lose: { text: '東方の熱病に倒れかけた。', add: ['wound'] } } }),
  rungCard('mo.publicani', 'money', 3, { title: '徴税請負の組合', story: '属州の税を前払いで請け負う組合が、出資者を集めている。', art: 'roma.scene.publicani',
    left: { title: '出資する', art: 'choice.sell', stake: store(4), odds: 3, win: { text: '属州の税が入り、持ち分が膨らんだ。', add: ['publicani'] }, lose: { text: '属州で反乱が起き、出資は消えた。' } },
    right: { title: '都の宴に通う', art: 'choice.tavern', stake: store(2), odds: 3, win: { text: '都の宴で、名の知れた人と恋に落ちた。', add: ['romelover'] }, lose: { text: '宴の銭だけが消えた。' } } }),
  // 燃える家を安く買い叩いて富を築いたのはクラッススの逸話（プルタルコス）。銭で票を集めて執政官になるのも、同じ時代の道筋
  rungCard('mo.fortune', 'money', 4, { title: '都の火事', story: '都で火事が起きた。燃えている家を、持ち主から安く買い叩く者がいるという。', art: 'roma.scene.fire',
    left: { title: '燃える家を買い叩く', art: 'choice.shop', stake: store(5), odds: 2, win: { text: '都の家々を買い集めた。その富は語り草になった。', add: ['fortune'] }, lose: { text: '火が回り、買った家も焼け落ちた。', add: ['debt'] } },
    right: { title: '焼け出された人に手を差しのべる', art: 'choice.rest', stake: store(3), odds: 3, win: { text: '焼け出された一家を養った。その家の娘と、恋に落ちた。', add: ['romelover'] }, lose: { text: '施しは、すぐに尽きた。' } } }),
  // 都の一座の踊り子が貴人の恋人として知られた例はある（キュテリスとアントニウス）。推測: 一座が地方の町まで巡業したかは未確認
  rungCard('lo.rome', 'love', 3, { title: '都の一座', story: '都から来た一座の、名の知れた踊り子が町に来ている。', art: 'roma.scene.troupe',
    left: { title: '楽屋を訪ねる', art: 'choice.tavern', stake: store(2), odds: 3, win: { text: '踊り子と恋に落ちた。噂は都まで届いた。', add: ['romelover'] }, lose: { text: '門番に追い返された。' } },
    right: { title: '一座に台詞を書いて渡す', art: 'choice.reading', stake: body(), odds: 3, win: { text: '書いた台詞が舞台にかかった。客席の貴人が目をとめた。', add: ['artpatron'] }, lose: { text: '台詞は使われなかった。' } } }),
  // 恋人が名を変えて詩に残った例はカトゥルスのレスビア
  rungCard('lo.sung', 'love', 4, { title: '恋の詩を探す詩人', story: '都の詩人が、恋の詩の題材を探していると聞いた。', art: 'roma.scene.poet',
    left: { title: '二人の恋を語る', art: 'choice.rhetoric', stake: body(), odds: 2, win: { text: '詩人は二人の恋を詠んだ。名を変えて、詩は後世まで残った。', add: ['sunglove'] }, lose: { text: '詩人は、別の恋を詠んだ。' } },
    right: { title: '自分で恋の詩を書く', art: 'choice.reading', stake: body(), odds: 2, win: { text: '自分で書いた恋の詩が、書き写されて広まった。', add: ['work.copied'] }, lose: { text: '詩は、誰の目にも触れなかった。' } } }),
  // 跡取りの縁組は、どちらを選んでも跡取りは縁組する（選んだ道は必ず通る。サイコロは代償を決める）。そのあと孫が年の締めに生まれる
  rungCard('sl.heirwed', 'slow', 3, { ages: [40, 70], needsAny: ['heir'], lacks: ['heirwed'], title: '跡取りの縁組', story: '跡取りが年頃になった。嫁を迎える話が出ている。', art: 'roma.scene.heirwed',
    left: { title: '家どうしで決めた縁組', art: 'choice.accept', stake: store(2), odds: 3, win: { text: 'パトロヌスの口ききで、格上の家の娘を迎えた。', add: ['heirwed', 'patronfavor'] }, lose: { text: '持参金の折り合いがつかず、借金をして縁組をまとめた。', add: ['heirwed', 'debt'] } },
    right: { title: '跡取りの想う相手と添わせる', art: 'choice.celebrate', stake: body(), odds: 3, win: { text: '跡取りは想う相手と添った。家が明るくなった。', add: ['heirwed', 'garden'] }, lose: { text: 'パトロヌスの勧めた縁組を断った形になり、不興を買った。', add: ['heirwed', 'patrongrudge'] } } }),
  // 子が育たなかった家は、養子で跡取りを立てる。ローマの名家では普通（スキピオ・アエミリアヌス、オクタウィアヌス）。推測: 農民の家でどこまでしたかは未確認
  { id: 'sl.adopt', frame: 'family', ages: [35, 60], axis: 'slow', lacks: ['heir', 'grownchild'], title: '跡取りのいない家', story: '家を継ぐ子がいない。このままでは、家が絶える。', art: 'roma.scene.adopt',
    left: { title: '親族の子を養子に迎える', art: 'choice.accept', stake: store(2), odds: 4, win: { text: '親族の子を養子に迎え、跡取りにした。', add: ['heir'] }, lose: { text: '親族は、子を手放さなかった。' } },
    right: { title: '村の孤児を引き取る', art: 'choice.rest', stake: body(), odds: 4, win: { text: '村の孤児を引き取り、跡取りに育てることにした。', add: ['heir'] }, lose: { text: '孤児は、ほかの家に引き取られた。' } } },
  // 炉端の昔話は、家が次の代に渡っていれば来る（孫は条件にしない）
  rungCard('sl.ancestor', 'slow', 4, { ages: [45, 80], needsAny: ['heir'], title: '炉端の昔話', story: '子や孫が炉端で、家の昔の話をせがむ。', art: 'roma.scene.hearth',
    left: { title: '家の来し方を語って聞かせる', art: 'choice.lares', stake: body(), odds: 2, win: { text: '話は子から孫へ、その子へと語り継がれた。すてきなご先祖様がいたと。', add: ['ancestor'] }, lose: { text: '子も孫も、途中で眠ってしまった。' } },
    right: { title: '街道沿いに家の墓碑を建てる', art: 'choice.memorial', stake: store(3), odds: 3, win: { text: '墓碑に刻んだ詩は、街道を行く人に読まれた。', add: ['work.epitaph'] }, lose: { text: '石工が字を間違えた。' } } }),
  // 将軍の戦記に百人隊長の名が書かれた例は『ガリア戦記』のプッロとウォレヌス
  rungCard('sr.chronicle', 'strength', 4, { ages: [25, 60], title: '将軍の戦記', story: '将軍が戦の記録を書いている。勇敢な兵の名も書き込むという。', art: 'roma.scene.chronicle',
    left: { title: '最前列で盾を構える', art: 'choice.march', stake: riskBody(2), odds: 2, win: { text: '戦記に名が書き込まれた。', add: ['chronicle'] }, lose: { text: '矢を受けて倒れた。', add: ['wound'] } },
    right: { title: '将軍に取り入る', art: 'choice.patron', stake: body(), odds: 3, win: { text: '将軍の推薦で、元老院に席を得た。', add: ['senator'] }, lose: { text: '将軍は振り向かなかった。' } } }),
);
// 後世の段の上がり口が 1 本だった 3 軸に、もう 1 本ずつ足す（2026-11-03 orange「Aで足して」、ladder-check.mjs で見つけた）。右は別の軸の都の段に寄る
// 穀物船: 都の穀物はエジプトやシチリアからの船で運ばれた（史実）。石に刻まれた夫婦の誓い: 妻を讃える長い墓碑（いわゆるトゥリアの讃辞）が残っている（史実）。
// 推測: 農家の畑が家の名で呼ばれ続けたかは未確認（ローマの地所に持ち主の名が付いた例はある）
Object.assign(FIELD, {
  lovestone: { name: '石に刻まれた夫婦の誓い', kind: '品', marks: { love: 3 }, scope: 4, art: 'roma.sunglove' },
});
CARDS.push(
  rungCard('mo.grainship', 'money', 4, { title: '穀物船の出資', story: '海の向こうから都へ穀物を運ぶ船が、出資者を探している。嵐に遭えば、すべてが沈む。', art: 'roma.scene.publicani',
    left: { title: '船に出資する', art: 'choice.sell', stake: store(5), odds: 2, win: { text: '船は無事に着き、都の穀物の値は上がった。その富は語り草になった。', add: ['fortune'] }, lose: { text: '船は嵐で沈んだ。', add: ['debt'] } },
    right: { title: '船に乗って東方の書物を持ち帰る', art: 'choice.reading', stake: riskBody(2), odds: 3, win: { text: '持ち帰った書物を写させると、都の本屋に並んだ。', add: ['bookshop'] }, lose: { text: '船酔いに倒れ、書物は海に落ちた。' } } }),
  rungCard('lo.vowstone', 'love', 4, { title: '夫婦の誓いを石に', story: '都の石工が、夫婦の思い出を長い碑文に刻む仕事を請け負っている。', art: 'roma.scene.hearth',
    left: { title: '二人の誓いを石に刻ませる', art: 'choice.memorial', stake: store(4), odds: 2, win: { text: '碑文は二人の日々を語り、後の世の人にも読まれた。', add: ['lovestone'] }, lose: { text: '石が割れ、碑文は途中で終わった。' } },
    right: { title: '碑文の詩を自分で書く', art: 'choice.reading', stake: body(), odds: 3, win: { text: '碑文の詩が、詩を好む貴人の目にとまった。', add: ['artpatron'] }, lose: { text: '石工は、詩を短く削った。' } } }),
  rungCard('sl.founder', 'slow', 4, { ages: [45, 80], needsAny: ['heirwed', 'grandchild'], title: '家の名で呼ばれる畑', story: '村の人が、この畑を家の名で呼ぶようになった。', art: 'roma.scene.adopt',
    left: { title: '境の石に家の名を刻む', art: 'choice.lares', stake: body(), odds: 2, win: { text: '境の石は代々守られ、畑は今も家の名で呼ばれる。すてきなご先祖様がいたと。', add: ['ancestor'] }, lose: { text: '石は、次の洪水で流された。' } },
    right: { title: '畑を担保に都の組合へ出資する', art: 'choice.sell', stake: store(3), odds: 3, win: { text: '属州の税を請け負う組合に、持ち分を得た。', add: ['publicani'] }, lose: { text: '組合は傾き、畑の一画を手放した。', add: ['debt'] } } }),
);
// ステータスとストレングスが重なる 4 段目（2026-11-03 orange「時代や時期によってはステータスとストレングスは同じ場所にいる」）。
// 凱旋式は両方のマークを持つ品で、どちらの誓いからも上がれる合流点。札は誓いごとに 1 枚ずつ置き、品は同じなので 1 枚ぶんに数える。
// 凱旋を諦めて執政官に立ったのは、前 60 年のカエサル
for (const axis of ['status', 'strength']) {
  CARDS.push({ frame: 'path', id: `rung.triumph.${axis}`, ages: LADDER[3].ages, axis, needsAny: ladderNeeds(['status', 'strength'], 4), title: '凱旋式の願い', story: '勝った戦の凱旋式を許すかどうか、元老院が議論している。', art: 'roma.scene.triumph',
    left: { title: '凱旋式を求める', art: 'choice.march', stake: store(4), odds: 2, win: { text: '月桂冠をかぶり、四頭立ての戦車で都を行進した。', add: ['triumph'] }, lose: { text: '元老院は凱旋式を認めなかった。' } },
    right: axis === 'status'
      ? { title: '凱旋を諦めて執政官に立つ', art: 'choice.rhetoric', stake: store(4), odds: 2, win: { text: '凱旋式を諦めて都に入り、執政官に選ばれた。', add: ['consul'] }, lose: { text: '凱旋も執政官も、手に入らなかった。' } }
      : { title: '兵とともに次の戦へ', art: 'choice.march', stake: riskBody(2), odds: 2, win: { text: '次の戦でも先頭に立ち、戦記に名が書かれた。', add: ['chronicle'] }, lose: { text: '次の戦で深手を負った。', add: ['wound'] } } });
}
// 普請の札（2026-11-04、Claude 下書き）。ローマは建設と建築の帝国なので、三河より多く置く（orange）。上の段ほど値段が上がり、貯めた銭の使い道になる（settings.buildPrice）
// 富裕な市民が町に公共建築を寄進して名を残す習慣は史実（エウエルゲティズム）。推測: 農家の出がどこまで届いたかは未確認
Object.assign(FIELD, {
  cistern: { name: '石積みの貯水槽', role: 'building', kind: '家', marks: { slow: 1 }, guard: ['dis.famine'], art: 'roma.scene.slope' },
  mill: { name: '粉ひき小屋', role: 'building', kind: '仕事', marks: { money: 1 }, yearly: { store: 1 }, art: 'roma.scene.market' },
  channel: { name: '畑へ引いた用水路', role: 'building', kind: '田', marks: { money: 1 }, scope: 2, yearly: { store: 2 }, art: 'roma.scene.slope' },
  kiln: { name: '瓦の窯', role: 'building', kind: '仕事', marks: { money: 2 }, scope: 2, yearly: { store: 1 }, art: 'roma.scene.market' },
  roadgift: { name: '街道の修繕の銘', kind: '品', marks: { status: 2 }, scope: 2, art: 'roma.scene.senate' },
  bathgift: { name: '町の浴場の寄進', kind: '品', marks: { status: 2 }, scope: 3, art: 'roma.scene.senate' },
  theatregift: { name: '町の劇場の寄進', kind: '品', marks: { status: 1, art: 1 }, scope: 3, art: 'roma.scene.troupe' },
  namedbridge: { name: '自分の名の橋', kind: '品', marks: { status: 3 }, scope: 4, art: 'roma.scene.senate' },
});
const buildCard = (id, ages, rest) => ({ id, frame: 'build', ages, lacks: [rest.gives], ...rest });
const giftCard = (id, scope, rest) => ({ ...rungCard(id, 'status', scope, rest), frame: 'build', lacks: [rest.gives] });
CARDS.push(
  buildCard('build.cistern', [16, 60], { gives: 'cistern', title: '雨水の貯水槽', story: '夏になると、井戸の水が細くなる。', art: 'roma.scene.slope',
    left: { title: '石を積んで貯水槽を造る', art: 'choice.till', stake: store(3), odds: 4, win: { text: '貯水槽に雨水が溜まった。日照りの年も、畑に水をやれる。', add: ['cistern'] }, lose: { text: '漆喰がひび割れ、水が抜けた。' } },
    right: { title: '甕を担いで隣村まで水を分ける', art: 'choice.attend', stake: body(), odds: 4, win: { text: '水を分けて回り、村の者に頼られた。', add: ['villagetrust'] }, lose: { text: '坂道で甕を割った。' } } }),
  buildCard('build.mill', [18, 60], { gives: 'mill', title: '粉ひき小屋', story: '村の麦は、町まで運んで粉にしている。', art: 'roma.scene.market',
    left: { title: '石臼とロバを入れて小屋を建てる', art: 'choice.till', stake: store(4), odds: 4, win: { text: '村の麦が集まるようになった。毎年、挽き賃が入る。', add: ['mill'] }, lose: { text: '石臼が割れた。銭だけが消えた。' } },
    right: { title: '粉ひきの娘に花を渡す', art: 'choice.approach', stake: body(), odds: 4, win: { text: '娘が笑った。泉のほとりで会う約束をした。', add: ['springvow'] }, lose: { text: '粉まみれの手を見て、笑われた。' } } }),
  buildCard('build.channel', [20, 60], { gives: 'channel', needs: ['kind:田'], title: '用水路の分水', story: '町の水道から、畑へ水を分けてもらえるかもしれない。', art: 'roma.scene.slope',
    left: { title: '町に願い出て水路を掘る', art: 'choice.till', stake: store(8), odds: 4, win: { text: '水が畑まで来た。実りが増える。', add: ['channel'] }, lose: { text: '許しが下りなかった。役人への礼金だけが消えた。' } },
    right: { title: '水の役人と顔をつなぐ', art: 'choice.tavern', stake: store(1), odds: 4, win: { text: '町の広場で、名を覚えられた。', add: ['forumgossip'] }, lose: { text: '役人は別の客と話していた。' } } }),
  buildCard('build.kiln', [20, 60], { gives: 'kiln', title: '瓦の窯', story: '町では屋根を瓦に替える家が増えている。', art: 'roma.scene.market',
    left: { title: '土を選んで窯を築く', art: 'choice.till', stake: store(8), odds: 4, win: { text: '自分の刻印の入った瓦が焼き上がった。', add: ['kiln'] }, lose: { text: '窯が割れ、瓦は全部焼けすぎた。' } },
    right: { title: '町の宴に瓦を納めに行く', art: 'choice.tavern', stake: body(), odds: 4, win: { text: '納めたついでに宴に招かれ、町で噂になった。', add: ['feastlove'] }, lose: { text: '門前で追い返された。' } } }),
  giftCard('build.roadgift', 2, { gives: 'roadgift', title: '街道の修繕', story: '町の前の街道が荒れている。修繕の費用を出す者を募っている。', art: 'roma.scene.senate',
    left: { title: '費用を出して名を刻ませる', art: 'choice.rhetoric', stake: store(10), odds: 4, win: { text: '里程標に自分の名が刻まれた。', add: ['roadgift'] }, lose: { text: '石工が銭を持って逃げた。' } },
    right: { title: '石運びの競べに出る', art: 'choice.wrestle', stake: body(), odds: 4, win: { text: '町の男たちと石運びを競い、冠をもらった。', add: ['feastwrestle'] }, lose: { text: '石を足に落とした。', add: ['wound'] } } }),
  giftCard('build.bath', 3, { gives: 'bathgift', title: '町の浴場の寄進', story: '町の浴場が古くなった。建て直す者の名は、入口に刻まれるという。', art: 'roma.scene.senate',
    left: { title: '自分の名で建て直す', art: 'choice.rhetoric', stake: store(25), odds: 3, win: { text: '入口の石に名が刻まれ、都の客にまで知られた。', add: ['bathgift'] }, lose: { text: '工事の途中で壁が崩れ、名は刻まれなかった。' } },
    right: { title: '浴場に来た都の女優と語らう', art: 'choice.tavern', stake: store(2), odds: 3, win: { text: '都に戻った女優が、自分の話をしているらしい。', add: ['romelover'] }, lose: { text: '湯気の向こうで、もう別の客と話していた。' } } }),
  giftCard('build.theatre', 3, { gives: 'theatregift', title: '町の劇場の寄進', story: '町に石造りの劇場を、という話が出ている。', art: 'roma.scene.troupe',
    left: { title: '自分の名で劇場を建てる', art: 'choice.rhetoric', stake: store(30), odds: 3, win: { text: '舞台の幕開けに、町じゅうが自分の名を呼んだ。', add: ['theatregift'] }, lose: { text: '資金が尽き、石の座席だけが残った。' } },
    right: { title: '同じ銭で徴税請負に加わる', art: 'choice.sell', stake: store(5), odds: 3, win: { text: '都の組合に、持ち分を得た。', add: ['publicani'] }, lose: { text: '組合の帳簿は、自分に不利に書かれていた。' } } }),
  giftCard('build.bridge', 4, { gives: 'namedbridge', title: '自分の名の橋', story: '川に石橋を架ければ、その名は何百年も残るだろう。', art: 'roma.scene.senate',
    left: { title: '石の橋を架ける', art: 'choice.rhetoric', stake: store(60), odds: 1, win: { text: '橋に自分の名が刻まれた。後の世の旅人も、その名を読むだろう。', add: ['namedbridge'] }, lose: { text: '洪水が、仮橋ごと資材を流した。' } },
    right: { title: '橋の完成祝いに都の本屋へ詩を送る', art: 'choice.reading', stake: store(3), odds: 3, win: { text: '詩が都の本屋に並んだ。', add: ['bookshop'] }, lose: { text: '本屋は返事もよこさなかった。' } } }),
);
// 同じ品は何枚重ねても 1 枚ぶんに数える（settings.stackOnce）。人や畑のように、数そのものに意味がある品だけ重ねて数える
for (const id of ['child', 'grownchild', 'newfield', 'servant']) FIELD[id].stacks = true;

const CARDS_WITH_RULES = CARDS.map((card) => ({ ...card, kind: card.year ? 'history' : card.disaster ? 'disaster' : card.demand ? 'demand' : card.quiet ? 'upkeep' : card.family ? 'family' : 'event', category: card.id.startsWith('lo.') ? 'relationship' : card.id.startsWith('ch.') ? 'child' : null, role: CARD_RULES[card.id] || (card.id.startsWith('lo.') ? 'relationship' : card.id.startsWith('ch.') ? 'childMilestone' : null), disasterType: card.id.startsWith('dis.') ? card.id.slice(4) : null, disasterKey: card.disaster ? card.id : null, familyAge: FAMILY_AGES[card.id] || null }));
const CARD_IDS = Object.fromEntries(CARDS_WITH_RULES.filter((card) => card.role).map((card) => [card.role, card.id]));

const RANDOM_ABILITIES = ['hygiene', 'soil', 'body', 'foresight', 'numbers', 'organizing', 'expression', 'outdoors', 'animals'];
const ABILITY_EFFECTS = {
  hygiene: ['dis.fever', 'dis.plague', 'dis.wound', 'rec.medicine', 'rec.medicine:left', 'lo.child'],
  soil: ['child.vintage', 'dis.famine'],
  body: ['sr.arena', 'vi.road', 'vi.tavern', 'hist.socialwar:left', 'hist.sulla:left', 'hist.spartacus:left', 'hist.civilwar:left', 'hist.idus:left', 'hist.actium:left'],
  foresight: ['hist.socialwar:left', 'hist.sulla:left', 'hist.spartacus:left', 'hist.civilwar:left', 'hist.idus:left', 'hist.actium:left'],
  numbers: ['mo.market', 'dm.vote:left'],
  expression: ['child.grammar', 'st.rhetoric', 'child.festival', 'ar.copyist', 'ar.fresco', 'ar.recital', 'ar.patron', 'ar.epitaph'],
  outdoors: ['vi.road'],
};
const abilityStories = {
  hygiene: '湯を沸かし、傷や熱を手当てする知恵が残っている。', soil: '種や土の手入れを、畑で試す知恵が残っている。', body: '鍛え方と食べ方を、体が覚えている。',
  foresight: 'この時代に何が起きるかを、少しだけ知っている。', numbers: '帳面と数を使い、損得を読む癖が残っている。', organizing: '人の仕事を分け、順番を決める知恵が残っている。',
  expression: '言葉や絵で、人の心を動かした記憶がある。', outdoors: '火や水を扱い、野外で身を守る知恵が残っている。', cooking: '食材をおいしく保ち、無駄なく使う知恵が残っている。',
  making: '身近な材料から道具を作った手つきが残っている。', animals: '動物の様子を見て、世話をする感覚が残っている。', faith: '祭りや作法に、自然と手が動く。',
};

const castRules = [{ name: '恋', re: /娘に髪飾り|夜に会う|恋/, minAge: 12 }];

export default { id: 'roma', castRules, SCOPES, birthYear: -100, yearLabel: (year) => year < 0 ? `前${-year}年` : `${year}年`, glossary: GLOSSARY, display: { title: 'ローマの春 — 一年の札', heading: ['イタリア', 'の農村'], short: 'ローマ' }, settings, AXES, LAYERS, SURNAMES, FIELD, START_FIELD, CARDS: CARDS_WITH_RULES, cardById: new Map(CARDS_WITH_RULES.map((card) => [card.id, card])), CARD_IDS, RANDOM_ABILITIES, ABILITY_EFFECTS, abilityStories, NAMING, specialIds: { reconsider: 'goal.reconsider', parting: 'lo.parting', maintenance: 'maintenance' }, specialRoles: { maintenance: 'maintenance' }, CHILDHOOD, BIRTH, FAMILY_OMENS, FAMILY_AGES, INITIAL_FAMILY_EVENTS, KINSHIP_RELATIVES, partnerIds: LOVERS, disasterTargets: DISASTER_TARGETS, text: TEXT };
