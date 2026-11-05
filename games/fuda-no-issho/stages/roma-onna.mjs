import roma from './roma.mjs';
import { composeLife } from './life.mjs';
// ローマの農家に女として生まれた一生。札と品の文は Claude の下書き（2026-11-05、llm）。
// 札のコメントの M1 などは docs/planning/2026-11-05-butai-roma-onna--wip.md の番号。「推測」は調べても確かめられなかった所。
// 男の一生との違いの芯（orange 2026-11-05）: 近代以前の女の一生の多くは子育てで占められる。子が増えるほど道の札に賭ける余力が減る。
// 戦は自分の体でなく、夫と息子を賭ける。後世に名が残る女は 4 段目の例外として描く。

const body = (amount = 1) => ({ type: 'spend', what: 'body', amount });
const riskBody = (amount = 1) => ({ type: 'risk', what: 'body', amount });
const store = (amount = 1) => ({ type: 'spend', what: 'store', amount });
const risk = (what) => ({ type: 'risk', what });
const spend = (what) => ({ type: 'spend', what });
const SUB = { type: 'risk', what: 'substitute' };

const HUSBANDS = ['spouse', 'husband.farm', 'husband.town', 'husband.old'];
const LOVERS = ['lover.shepherd', 'lover.smith', 'lover.soldier', 'lover.freed'];
// 嫁ぐと生家の畑と家を離れ、夫の畑と家に移る。法の上は生家の女のまま（M9）
const MOVE_OUT = { remove: ['paddy', 'newfield', 'house', 'hhouse', 'hfield', 'widow'], add: ['hhouse', 'hfield'] };
// 子は夫の家に残る（M13）。remove は 1 つ名前を書くと 1 人減るので、人数ぶん並べる
const KIDS_STAY = Array.from({ length: 8 }, () => ['child', 'toddler', 'helper', 'grownchild']).flat();

const keepItems = ['ie', 'neighborhouse', 'nanushiHouse', 'kinsman', 'mother', 'oldfather', 'sister', 'siblings', 'house', 'paddy', 'newfield', 'neighbors', 'villagetrust', 'friend', 'reading', 'strongbody', 'forumgossip', 'gods', 'republic', 'sulla', 'caesar', 'augustus', 'spring', 'affair', 'rumor', 'grownchild', 'childletters', 'childhands', 'heir', 'branchhouse', 'childaway', 'inlaw', 'wound', 'debt', 'cliens', 'patronfavor', 'netting', 'oddity', 'patrongrudge', 'servant', 'garden', 'singer', 'work.epitaph', 'past.memory', 'grandchild', 'heirwed', 'lover'];

const items = {
  father: { ...roma.FIELD.father, name: '父' },
  // ── 嫁ぎ先
  hhouse: { name: '嫁ぎ先の農家', kind: '家', marks: { slow: 1 }, art: 'onna.hhouse', levels: [
    { name: '嫁ぎ先の農家', yearly: { body: 1 }, guard: [], art: 'onna.hhouse.lv1' },
    { name: '瓦を葺いた嫁ぎ先', yearly: { body: 2 }, guard: [], art: 'onna.hhouse.lv2' },
    { name: '湯を沸かす嫁ぎ先', yearly: { body: 3 }, guard: ['dis.fever'], art: 'onna.hhouse.lv3' },
  ], pastLv3: ['hygiene'] },
  hfield: { name: '夫の麦畑', role: 'field', kind: '田', marks: { money: 1, slow: 1 }, art: 'onna.hfield', levels: [
    { name: '夫の麦畑', yearly: { store: 1 }, guard: [], art: 'onna.hfield.lv1' },
    { name: '休閑と厩肥の麦畑', yearly: { store: 2 }, guard: [], art: 'onna.hfield.lv2' },
    { name: '輪作と選種の麦畑', yearly: { store: 3 }, guard: [], art: 'onna.hfield.lv3' },
  ], pastLv3: ['soil'] },
  spouse: { name: '夫（想い合って添った）', role: 'spouse', partnerName: true, partnerPriority: 1, kind: '家族', marks: { love: 2, slow: 1 }, art: 'onna.husband', yearly: { body: 1 } },
  'husband.farm': { name: '夫（隣村の農夫）', role: 'spouse', partnerPriority: 2, kind: '家族', marks: { slow: 2, money: 1 }, art: 'onna.husband', yearly: { body: 1 } },
  'husband.town': { name: '夫（町の店主）', role: 'spouse', partnerPriority: 2, kind: '家族', marks: { money: 2, status: 1 }, scope: 2, art: 'onna.husband', yearly: { body: 1 } },
  // 年かさの夫は軍に取られないが、早く逝く（M3）
  'husband.old': { name: '夫（年かさの退役兵）', role: 'spouse', substitute: false, partnerPriority: 2, kind: '家族', marks: { strength: 1, slow: 1 }, art: 'onna.husband', yearly: { store: 1 } },
  'dowry.big': { name: '持参金（厚い）', kind: '品', marks: { status: 1, money: 1 }, art: 'onna.dowry' },
  'dowry.small': { name: '持参金（薄い）', kind: '品', marks: { money: 1 }, art: 'onna.dowry' },
  // ── 子。幼子は手がかかり、手伝える年になると働き手に変わる（orange の 3 層案の 3 層目）
  child: { name: '乳飲み子', kind: '家族', marks: {}, stacks: true, yearly: { body: -2, store: -1 }, art: 'onna.child' },
  toddler: { name: '幼子', kind: '家族', childLike: true, marks: {}, stacks: true, yearly: { body: -1, store: -1 }, art: 'onna.child' },
  helper: { name: '手伝う子', kind: '家族', childLike: true, marks: {}, stacks: true, art: 'onna.child.helper' },
  smallgrave: { name: '小さな墓', kind: '品', marks: {}, art: 'onna.smallgrave' },
  // ── 寡婦と法
  widow: { name: '寡婦', kind: '家族', marks: {}, art: 'onna.widow' },
  univira: { name: '一人の夫に添った誉れ（ウニウィラ）', kind: '縁', marks: { status: 1, slow: 1 }, art: 'onna.univira' },
  heldland: { name: '裁判で守った畑', kind: '田', marks: { money: 1, status: 1 }, yearly: { store: 1 }, art: 'onna.heldland' },
  share: { name: '父の遺した取り分', kind: '品', marks: { money: 1 }, yearly: { store: 1 }, art: 'onna.share' },
  tutor: { name: '後見人', kind: '縁', marks: {}, art: 'onna.tutor' },
  stepmother: { name: '継母', kind: '家族', marks: {}, art: 'onna.stepmother' },
  uncle: { name: '叔父（引き取り手）', kind: '家族', marks: {}, art: 'onna.uncle' },
  alumna: { name: '拾われ子の噂', kind: '重荷', marks: { status: -1 }, art: 'onna.alumna' },
  coward: { name: '男を差し出さなかった噂', kind: '重荷', marks: { status: -2 }, art: 'onna.coward' },
  // ── ステータス
  wisewoman: { name: '産婆の手ほどき', kind: '知恵', marks: { status: 1 }, guard: ['ob.first', 'ob.hard'], art: 'onna.wisewoman' },
  festwoman: { name: '女たちの祭りの世話役', kind: '縁', marks: { status: 2 }, scope: 2, art: 'onna.festwoman' },
  sacerdos: { name: '町の女神官', kind: '身分', marks: { status: 3 }, scope: 2, art: 'onna.sacerdos' },
  bonadea: { name: 'ボナ・デアの祭りの席', kind: '縁', marks: { status: 2 }, scope: 3, art: 'onna.bonadea' },
  matronvoice: { name: '広場に上げた婦人たちの声', kind: '品', marks: { status: 2, art: 1 }, scope: 3, art: 'onna.matronvoice' },
  statue: { name: '台座に名を刻んだ像', kind: '品', after: '像は倒れた。台座の名だけが、畑の隅に残った。', marks: { status: 3 }, scope: 4, art: 'onna.statue' },
  gategift: { name: '自分の名の町の門', kind: '品', after: '門は二千年のあいだ、彼女の名で呼ばれた。', marks: { status: 3 }, scope: 4, art: 'onna.gategift' },
  fountaingift: { name: '町の泉の寄進', kind: '品', marks: { status: 2 }, scope: 2, art: 'onna.fountain' },
  shrinegift: { name: '女神の社の寄進', kind: '品', marks: { status: 3 }, scope: 3, art: 'onna.shrine' },
  // ── マネー
  loom: { name: '機', role: 'building', kind: '仕事', marks: { money: 1 }, art: 'onna.loom', levels: [
    { name: '家の機', yearly: { store: 1 }, guard: [], art: 'onna.loom.lv1' },
    { name: '二台の機', yearly: { store: 1 }, guard: [], art: 'onna.loom.lv2' },
    { name: '織り子を置いた機', yearly: { store: 2 }, guard: [], art: 'onna.loom.lv3' },
  ], pastLv3: ['organizing'] },
  henyard: { name: '鶏と保存食', kind: '暮らし', marks: { money: 1 }, yearly: { store: 1 }, guard: ['dis.famine'], art: 'onna.henyard' },
  stall: { name: '市の屋台', kind: '仕事', marks: { money: 1 }, scope: 2, yearly: { store: 1 }, art: 'onna.stall' },
  shop: { name: '町の織物の店', role: 'building', kind: '仕事', marks: { money: 2 }, scope: 2, art: 'onna.shop', levels: [
    { name: '町の織物の店', yearly: { store: 1 }, guard: [], art: 'onna.shop.lv1' },
    { name: '品ぞろえの店', yearly: { store: 2 }, guard: [], art: 'onna.shop.lv2' },
    { name: '帳簿のある店', yearly: { store: 3 }, guard: [], art: 'onna.shop.lv3' },
  ], pastLv3: ['numbers'] },
  midwife: { name: '村の産婆', kind: '仕事', marks: { money: 1, status: 1 }, scope: 2, yearly: { store: 1 }, guard: ['ob.first', 'ob.hard'], art: 'onna.midwife' },
  vilica: { name: '大農場の女管理人（ウィリカ）', kind: '仕事', marks: { money: 2 }, scope: 3, yearly: { store: 1 }, art: 'onna.vilica' },
  moneybook: { name: '貸し金の帳面', kind: '仕事', marks: { money: 2 }, scope: 3, yearly: { store: 1 }, art: 'onna.moneybook' },
  busa: { name: '敗兵を養った女の語り', kind: '品', after: '敗兵を養った女の話は、街道沿いの村で長く語られた。', marks: { money: 3, status: 1 }, scope: 4, art: 'onna.busa' },
  legend: { name: '語り草の女富豪', kind: '品', after: '金の話は尾ひれをつけて、百年のちも語られていた。', marks: { money: 3 }, scope: 4, art: 'onna.legend' },
  press: { name: '油とワインの搾り場', kind: '仕事', marks: { money: 1 }, scope: 2, yearly: { store: 1 }, art: 'onna.press' },
  cistern: { name: '雨水の貯水槽', kind: '暮らし', marks: { slow: 1 }, guard: ['dis.fever'], art: 'onna.cistern' },
  // ── ラブ
  'lover.shepherd': { name: '羊飼いの若者', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'onna.lover' },
  'lover.smith': { name: '鍛冶の徒弟', role: 'lover', kind: '縁', marks: { love: 1 }, art: 'onna.lover' },
  'lover.soldier': { name: '帰ってきた兵', role: 'lover', kind: '縁', marks: { love: 1 }, scope: 2, art: 'onna.lover' },
  'lover.freed': { name: '解放奴隷の書記', role: 'lover', kind: '縁', marks: { love: 1 }, scope: 2, art: 'onna.lover' },
  'keep.shepherd': { name: '羊飼いの葦笛', kind: '品', marks: { love: 1 }, art: 'onna.keep' },
  'keep.smith': { name: '鍛冶の徒弟の留め金', kind: '品', marks: { love: 1 }, art: 'onna.keep' },
  'keep.soldier': { name: '兵の青銅の飾り', kind: '品', marks: { love: 1 }, scope: 2, art: 'onna.keep' },
  'keep.freed': { name: '書記の蝋板の手紙', kind: '品', marks: { love: 1 }, scope: 2, art: 'onna.keep' },
  springvow: { name: '泉のほとりの約束', kind: '縁', marks: { love: 1 }, art: 'onna.springvow' },
  feastlove: { name: '祭りの夜の浮名', kind: '縁', marks: { love: 2 }, scope: 2, art: 'onna.feastlove' },
  romelove: { name: '都で名の知れた恋', kind: '縁', marks: { love: 2 }, scope: 3, art: 'onna.romelove' },
  stonewords: { name: '夫が墓石に刻んだ言葉', kind: '品', after: '墓石は二千年のちに、街道の脇で見つかった。夫の言葉は、まだ読めた。', marks: { love: 3 }, scope: 4, art: 'onna.stonewords' },
  sunglove: { name: '詩に詠まれた恋', kind: '品', after: '詩の中の女が誰か、学者たちがいまも言い争っている。', marks: { love: 3 }, scope: 4, art: 'onna.sunglove' },
  // ── スローライフ（代で段を数える）
  hearth: { name: '炉の鍵', kind: '暮らし', marks: { slow: 1 }, art: 'onna.hearth' },
  daughterwed: { name: '嫁がせた娘', kind: '家族', marks: { slow: 2 }, rung: 2, art: 'onna.daughterwed' },
  jewels: { name: '「これが私の宝石」と語られた子ら', kind: '品', after: '「これが私の宝石」という話は、彼女の家で孫の孫まで語られた。', marks: { slow: 3 }, rung: 4, art: 'onna.jewels' },
  ancestor: { name: '語り継がれる母', kind: '品', after: '育たなかった子らの名まで、孫の孫が覚えていた。', marks: { slow: 3 }, rung: 4, art: 'onna.ancestor' },
  // ── ストレングス
  goatstaff: { name: '山羊追いの杖', kind: '品', marks: { strength: 1 }, art: 'onna.goatstaff' },
  sickle: { name: '麦刈りの鎌', kind: '品', marks: { strength: 1 }, art: 'onna.sickle' },
  drover: { name: '移牧の隊の女の外套', kind: '品', marks: { strength: 2 }, scope: 2, art: 'onna.drover' },
  knife: { name: '兵を追い返した包丁', kind: '品', marks: { strength: 2 }, scope: 2, art: 'onna.knife' },
  heldhouse: { name: '略奪者から守った家', kind: '品', marks: { strength: 2, slow: 1 }, scope: 3, art: 'onna.heldhouse' },
  camp: { name: '軍の後を行く女の荷車', kind: '品', marks: { strength: 2, money: 1 }, scope: 3, art: 'onna.camp' },
  vengeance: { name: '碑に刻まれた敵討ち', kind: '品', after: '碑は砕けた。欠片を、後の世の学者がつなぎ合わせた。', marks: { strength: 3 }, scope: 4, art: 'onna.vengeance' },
  slingname: { name: '敵の投石の弾に刻まれた名', kind: '品', after: '弾は二千年のちに畑から出た。刻まれた悪口は、いまも読める。', marks: { strength: 3 }, scope: 4, art: 'onna.slingname' },
  // ── アート
  naenia: { name: '村の挽歌', kind: '知恵', marks: { art: 1 }, art: 'onna.naenia' },
  praefica: { name: '葬列の泣き女（プラエフィカ）', kind: '仕事', marks: { art: 2 }, scope: 2, art: 'onna.praefica' },
  pattern: { name: '町で真似られた図柄', kind: '品', marks: { art: 2 }, scope: 2, art: 'onna.pattern' },
  portrait: { name: '婦人たちの肖像', kind: '品', marks: { art: 2 }, scope: 3, art: 'onna.portrait' },
  salon: { name: '貴人の娘たちに教えた歌', kind: '縁', marks: { art: 2 }, scope: 3, art: 'onna.salon' },
  copied: { name: '他人の巻に紛れて残った詩', kind: '品', after: '六篇は男の巻に紛れたまま、二千年先まで写され続けた。誰の詩か、もう誰も知らない。', marks: { art: 3 }, scope: 4, art: 'onna.copied' },
  selfportrait: { name: '鏡を見て描いた自画像', kind: '品', after: '自画像は残らなかった。話だけが、博物誌の一行に残った。', marks: { art: 3 }, scope: 4, art: 'onna.selfportrait' },
};
// 舞台の範囲の表と同じ扱い: 札をくれる段は scope か rung で決まる
const allItems = { ...Object.fromEntries(keepItems.map((id) => [id, roma.FIELD[id]])), ...items };
const LADDER = [{ ages: [7, 30] }, { ages: [15, 50] }, { ages: [25, 65] }, { ages: [35, 75] }];
const ladderNeeds = (axis, rung) => Object.entries(allItems).filter(([, f]) => (f.marks?.[axis] || 0) > 0 && (f.rung ?? f.scope ?? 1) >= rung - 1).map(([id]) => id);
const rungCard = (id, axis, scope, rest) => ({ id, frame: 'path', ages: LADDER[scope - 1].ages, axis, ...(scope > 1 ? { needsAny: ladderNeeds(axis, scope) } : {}), art: 'onna.scene', ...rest });
const buildCard = (id, ages, rest) => ({ id, frame: 'build', ages, lacks: [rest.gives], art: 'onna.scene', ...rest });
const family = (id, rest) => ({ id, frame: 'family', art: 'onna.scene', ...rest });

// 暮らしの一場面（女の暮らしのぶん）。本体の札から借りるものは keepCards
const VIGNETTES = [
  ['life.spindle', [7, 20], '紡錘の音', '夜、炉の明かりで女たちが糸を紡ぐ。紡錘が回る音を聞きながら眠る。羊毛は女の仕事で、墓にまで褒め言葉として刻まれるという。'], // M14
  ['life.dolls', [12, 21], '人形を納める', '嫁入りが近い娘は、遊んだ人形を家の神々に納めるのだと、年上の女に教わった。'], // 推測（記憶）
  ['life.veil', [18, 40], 'オレンジ色のヴェール', '隣村で婚礼があった。花嫁のヴェールが、麦の間に遠くからでも見えた。「タラッシオ！」の掛け声が風で届く。'],
  ['life.matronalia', [18, 75], 'マトロナリア', '三月の朔日、お産の女神ユノ・ルキナの祭り。この日ばかりは、夫が妻に小さな贈り物をする。'], // M20
  ['life.naming', [19, 45], '八日目', '生まれて八日目。娘に名をつけ、魔除けの小袋を首にかけた。息子なら九日目だと、姑が言う。', { needsAny: ['child'] }], // M8 推測
  ['life.nurse', [19, 45], '乳母の墓', '町の外れに、乳母の墓がある。「育てた子らが建てた」と刻んであった。女の仕事を誇る石を、初めて見た。'], // M19
  ['life.preserve', [18, 75], '保存の季節', 'オリーブを塩に漬け、ブドウの汁を煮詰める。冬の味は秋のうちに決まる。'], // M16 M17
  ['life.garland', [18, 75], '炉の花輪', '朔日と祭りの日には、炉に花輪をかけて、家の神々に一家の無事を祈る。女の朝の仕事だ。'], // M16
  ['life.bonadea', [25, 75], '女だけの夜', '十二月、都の大きな家では、女だけでボナ・デアを祀るという。男は一人も入れない。夫は面白くなさそうに聞いていた。', { needsAny: HUSBANDS }], // M21
  ['life.gossip', [30, 75], '男と女の別れ話', '都の貴人は女のほうから別れを切り出すこともあると、市で聞いた。持参金を持って出ていくのだそうだ。'], // M13
];

const cards = [
  // ── 子ども（7〜14 歳）
  { id: 'c.spindle', frame: 'path', ages: [7, 12], axis: 'money', title: '小さな紡錘', story: '七つになると、小さな紡錘を手に握らされた。羊毛は、撚れば売れる。', art: 'onna.scene', // M14
    left: { title: '夜まで糸を紡ぐ', stake: body(), odds: 5, win: { text: 'きれいな糸が引けるようになった。隣で紡いでいた女が、黙ってうなずいた。', add: ['loom'] }, lose: { text: '糸が切れてばかりで、指に血がにじんだ。' } },
    right: { title: '糸を放り出して外で遊ぶ', stake: body(), odds: 5, win: { text: '村の子らと、日が暮れるまで駆け回った。', add: ['friend'] }, lose: { text: '転んで膝を割り、家に帰って叱られた。' } } },
  { id: 'c.letters', frame: 'path', ages: [8, 12], axis: 'status', title: '兄の蝋板', story: '町の文法教師のところへは、男の子が通う。兄の蝋板を、そっと借りることはできる。', art: 'onna.scene', // 推測: 農家の娘の読み書き
    left: { title: '蝋板で文字を覚える', stake: body(), odds: 4, win: { text: '自分の家の名を書けるようになった。', add: ['reading'] }, lose: { text: '蝋板を割ってしまい、兄に殴られた。' } },
    right: { title: '家の神々への供えを手伝う', stake: body(), odds: 5, win: { text: '家の女たちと並んで、炉に塩と麦粉を置いた。', add: ['gods'] }, lose: { text: '供えの火が、すぐに消えた。' } } },
  { id: 'c.hearth', frame: 'path', ages: [7, 13], axis: 'slow', title: '炉の番', story: '大人が畑に出るあいだ、小さい子らと炉を任された。', art: 'onna.scene', // M16
    left: { title: '小さい子を背負って火を守る', stake: body(), odds: 5, win: { text: '夕方、大人が帰るまで、誰も火傷をしなかった。', add: ['hearth'] }, lose: { text: '粥を焦がした。夕飯は薄かった。' } },
    right: { title: '鶏の卵を集めて歩く', stake: body(), odds: 5, win: { text: '卵を市へ持っていくと、銅貨になった。', store: 1 }, lose: { text: '卵をいくつか割った。' } } },
  { id: 'c.goat', frame: 'path', ages: [9, 14], axis: 'strength', title: '山羊追い', story: '山羊が丘の向こうへ逃げた。日が暮れる前に連れ戻さないと、狼が出る。', art: 'onna.scene', // M18
    left: { title: '杖を持って一人で追う', stake: riskBody(), odds: 4, win: { text: '暗くなる前に、全部連れ帰った。', add: ['goatstaff', 'strongbody'], maxBody: 1 }, lose: { text: '崖で足をひねり、這って帰った。' } },
    right: { title: '大人を呼びに戻る', stake: body(), odds: 5, win: { text: '大人たちと探しに出て、村の人に顔を覚えられた。', add: ['villagetrust'] }, lose: { text: '戻るうちに山羊が一頭いなくなった。' } } },
  { id: 'c.song', frame: 'path', ages: [7, 12], axis: 'art', title: '収穫の歌', story: '麦刈りの女たちは歌いながら鎌を振る。一番高い声の子を、女たちが呼んだ。', art: 'onna.scene',
    left: { title: '前へ出て歌う', stake: body(), odds: 5, win: { text: '次の畑でも歌ってくれと言われた。', add: ['singer'] }, lose: { text: '声が裏返って、笑われた。' } },
    right: { title: '落ち穂を拾って回る', stake: body(), odds: 5, win: { text: '落ち穂は、一冬ぶんの粥になった。', store: 1 }, lose: { text: '畑の主に追い払われた。' } } },
  { id: 'c.midwife', frame: 'path', ages: [10, 14], axis: 'status', title: '産婆の荷物持ち', story: '村の産婆の老女が、夜道の荷物持ちを探している。お産の家に入れるのは女だけだ。', art: 'onna.scene', // M6
    left: { title: '荷を持ってついて行く', stake: body(), odds: 4, win: { text: '何度か見るうちに、老女が手順を教えてくれた。', add: ['wisewoman'] }, lose: { text: '血を見て倒れ、次からは呼ばれなかった。' } },
    right: { title: '家に残って麦を挽く', stake: body(), odds: 5, win: { text: '腕が太くなった。', add: ['strongbody'], maxBody: 1 }, lose: { text: '石臼に指を挟んだ。' } } },

  // ── 史実（その年に必ず来る）。男は自分の体を賭けるが、女は夫と息子を賭ける
  { id: 'hist.socialwar', frame: 'path', year: -91, omen: 'イタリアの同盟市が市民権を求めて騒いでいる', title: '同盟市戦争', story: 'ローマとイタリアの町々が戦になった。村の若い男が取られていき、畑には女と年寄りが残った。', art: 'onna.scene',
    left: { title: '女たちと麦を刈る', stake: body(), odds: 5, win: { text: '男のいない畑を、女たちで刈り終えた。', store: 1, add: ['strongbody'] }, lose: { text: '兵に麦を持っていかれた。' } },
    right: { title: '町へ噂を聞きに行く', stake: riskBody(), odds: 4, win: { text: '自分たちもローマ市民になれるらしい、と聞いた。', add: ['forumgossip'] }, lose: { text: '人混みで転んで足を傷めた。' } } },
  { id: 'hist.sulla', frame: 'path', year: -82, omen: 'スッラの軍がローマへ向かっている', title: 'スッラの粛清', story: '敵の名を書いた板が広場に貼り出された。村の土地も奪われ、退役兵に配られるという。', art: 'onna.scene', always: { remove: ['republic'], add: ['sulla'] },
    left: { title: 'パトロヌスの奥方に頼みに行く', stake: store(1), odds: 4, win: { text: '奥方が夫に口をきいてくれた。畑は取られずに済んだ。', add: ['patronfavor'] }, lose: { text: 'パトロヌスの名も札に載っていた。頼る先を失った。' } },
    right: { title: '黙って畑を耕す', stake: risk('kind:田'), odds: 4, win: { text: '嵐は村を通り過ぎた。', store: 1 }, lose: { text: '畑は退役兵のものになった。' } } },
  { id: 'hist.spartacus', frame: 'demand', year: -73, demand: true, ignore: { substitute: true, odds: 3 }, omen: 'カプアの剣闘士が逃げたという', title: 'スパルタクスの反乱', story: '反乱軍を追う軍が村に来て、麦か男を出せと言う。', art: 'onna.scene',
    left: { title: '麦を差し出して男を残す', stake: store(3), odds: 5, win: { text: '蓄えの麦を荷車に積んだ。軍は麦だけで去った。' }, lose: { text: '足りないと殴られ、麦だけ持って行かれた。', body: -1 } },
    right: { title: '男を送り出す', stake: SUB, odds: 3, win: { text: '代わりに出た者は無事に帰ってきた。' }, lose: { text: '代わりに出た者は帰らなかった。' } } },
  { id: 'hist.civilwar', frame: 'demand', year: -49, demand: true, ignore: { substitute: true, odds: 3 }, omen: 'カエサルとポンペイウスの仲が裂けた', title: 'ルビコン', story: 'カエサルが川を渡り、内乱が始まった。徴募の役人が村を回って、男の数を数えている。', art: 'onna.scene',
    left: { title: '銭を握らせて名を外してもらう', stake: store(4), odds: 4, win: { text: '役人は帳面から名を消した。' }, lose: { text: '銭だけ取られた。役人の顔を恨んだ。', add: ['patrongrudge'] } },
    right: { title: '送り出す', stake: SUB, odds: 3, win: { text: '代わりに出た者は無事に帰ってきた。' }, lose: { text: '代わりに出た者は帰らなかった。' } } },
  { id: 'hist.idus', frame: 'path', year: -44, omen: 'カエサルが終身の独裁官になった', title: 'カエサルの死', story: '三月の十五日、カエサルが元老院で刺された。女たちが葬儀で泣き、都が燃えたという。', art: 'onna.scene', always: { add: ['caesar'] },
    left: { title: '町の女たちと供え物に行く', stake: store(1), odds: 4, win: { text: '町の女たちに顔を覚えられた。', add: ['forumgossip'] }, lose: { text: '人に押され、供え物を落とした。' } },
    right: { title: '家の神々に家族の無事を祈る', stake: body(), odds: 5, win: { text: '炉に花輪をかけた。今年も家族は欠けなかった。', add: ['gods'] }, lose: { text: '花輪が炉に落ちて燃えた。悪い兆しだと年寄りが言う。' } } },
  { id: 'hist.hortensia', frame: 'path', year: -42, omen: '都で金持ちの女にも税をかけるという噂がある', title: '女への課税', story: '三頭政治が裕福な女千四百人に税をかけた。ホルテンシアという女が広場で「決める場に声の無い者に、なぜ税をかける」と言ったという。', art: 'onna.scene', // M27
    left: { title: '町の女たちを集めて話を伝える', stake: store(1), odds: 3, win: { text: '話を聞いた女たちが、市の日に集まるようになった。', add: ['matronvoice'] }, lose: { text: '男たちに、黙っていろと追い払われた。', add: ['oddity'] } },
    right: { title: '税の話より今年の麦を売る', stake: body(), odds: 5, win: { text: '戦で麦の値が上がっていた。', store: 3 }, lose: { text: '買い手がつかなかった。' } } },
  { id: 'hist.landgrant', frame: 'path', year: -41, omen: '退役兵に土地を配る話が進んでいる', title: '土地配りの測量人', story: '内乱の退役兵に配る土地を測りに、役人が村へ来た。フルウィアという女が、土地配りに口を出しているという。', art: 'onna.scene', // M32
    left: { title: '戸口に立ちはだかって追い返す', stake: riskBody(1), odds: 3, win: { text: '測量人は別の畑へ行った。村の女たちが、遠巻きに見ていた。', add: ['heldhouse'] }, lose: { text: '突き飛ばされた。測量人は畑に杭を打って帰った。', store: -2 } },
    right: { title: '畑の端を譲って話をつける', stake: store(2), odds: 5, win: { text: '端の畑だけで済んだ。' }, lose: { text: '端だけでは済まなかった。', store: -1 } } },
  { id: 'hist.actium', frame: 'path', year: -31, omen: 'オクタウィアヌスとアントニウスが争っている', title: 'アクティウム', story: 'アクティウムの海戦で内乱が終わった。もう息子を取られないのかと、村の女たちが顔を見合わせた。', art: 'onna.scene', always: { add: ['augustus'] },
    left: { title: '戦のあとの布を売りに行く', stake: store(2), odds: 4, win: { text: '帰ってくる男たちが、新しい衣を欲しがった。', store: 4 }, lose: { text: '売れ残った布を背負って帰った。', body: -1 } },
    right: { title: '帰らなかった者の名を炉で呼ぶ', stake: body(), odds: 5, win: { text: '名を呼び終えると、少し眠れた。', add: ['gods'] }, lose: { text: '声が出なかった。' } } },

  // ── 嫁ぎ先と持参金
  family('lo.arranged', { ages: [18, 60], repeat: true, lacks: ['widow'], title: '嫁ぎ先', story: '縁談が来た。持参金をいくら積むかで、行き先が変わる。積めば生家の蓄えは消えるが、嫁ぎ先での扱いも変わる。', // M1 M2
    always: MOVE_OUT,
    left: { title: '持参金を厚く積んで町の家へ', stake: store(8), minStore: 8, odds: 4, win: { text: '町の店主に嫁いだ。姑は持参金の額を二度数えて、席を譲った。', add: ['husband.town', 'dowry.big'] }, lose: { text: '町の話は流れ、積んだ銭で年かさの退役兵の後妻に収まった。', add: ['husband.old', 'dowry.big'] } },
    right: { title: '手堅く隣村の農家へ', stake: store(2), odds: 5, win: { text: '隣村の農家に嫁いだ。畑の広さは家とそう変わらない。', add: ['husband.farm', 'dowry.small'] }, lose: { text: '話がこじれ、年の離れた退役兵のところへ行くことになった。', add: ['husband.old', 'dowry.small'] } } }),
  family('lo.marry', { ages: [18, 60], repeat: true, axis: 'love', needsAny: LOVERS, title: '添う相手', story: '家は縁談を進めている。けれど、想う人がいる。', always: MOVE_OUT,
    left: { title: '想い人と添う', stake: risk('neighbors'), odds: 4, win: { text: '想い人と夫婦になった。持参金は薄いが、家に笑い声がある。', add: ['spouse', 'dowry.small'] }, lose: { text: '村とは気まずくなったが、夫婦になった。', add: ['spouse', 'dowry.small'] } },
    right: { title: '家の決めた相手に嫁ぐ', stake: store(2), odds: 6, win: { text: '家の決めた農家に嫁いだ。想い人の顔は、見ないようにした。', add: ['husband.farm', 'dowry.small'] } } }),
  { id: 'lo.meet', frame: 'path', ages: [18, 50], repeat: true, axis: 'love', title: '出会い', story: '見知らぬ人と目が合った。', art: 'onna.scene',
    left: { title: '水を汲むふりをして声をかける', stake: store(1), odds: 5, win: { text: 'また会う約束をした。', add: ['lover.shepherd'] }, lose: { text: '相手にされなかった。' } },
    right: { title: '目を伏せて家の用を片づける', stake: body(), odds: 5, win: { text: '真面目な女だと、村の女たちが言った。', add: ['villagetrust'] }, lose: { text: '用を間違えて、家の者に叱られた。' } } },
  { id: 'lo.visit', frame: 'path', axis: 'love', ages: [18, 50], repeat: true, needsAny: LOVERS, title: '会いに行く', story: '縁を結んだ人のもとへ、足を運ぶ。', art: 'onna.scene',
    left: { title: '手織りの帯を持って行く', stake: store(1), odds: 4, win: { text: '縁が深まった。' }, lose: { text: '留守だった。' } },
    right: { title: '水汲みの帰りに寄る', stake: body(), odds: 5, win: { text: '縁をつないだ。' }, lose: { text: '行き違いになった。' } } },
  // M13 離婚は妻からもできる。妻が出て持参金を取り戻す。子は夫の家に残る
  family('lo.divorce', { ages: [20, 60], title: '夫の言い渡し', story: '噂が夫の耳に入り、「家を出ろ」と言い渡された。子は置いていけ、と言う。',
    left: { title: '争わずに出ていく', stake: body(), odds: 6, win: { text: '生家へ戻った。あの家の声は、もう聞こえない。', divorce: true, remove: ['hhouse', 'hfield', 'dowry.big', 'dowry.small', ...KIDS_STAY], add: ['house'] } },
    right: { title: '持参金を返せと父の縁者に訴える', stake: store(2), odds: 3, win: { text: '持参金は戻った。ほかは、何も戻らなかった。', divorce: true, store: 6, remove: ['hhouse', 'hfield', 'dowry.big', 'dowry.small', ...KIDS_STAY], add: ['house'] }, lose: { text: '噂は村じゅうに広がり、持参金も戻らなかった。', divorce: true, add: ['house', 'rumor'], remove: ['hhouse', 'hfield', 'dowry.big', 'dowry.small', ...KIDS_STAY] } } }),
  family('lo.leave', { family: true, ages: [20, 50], weight: 1, axis: 'love', needsAny: HUSBANDS, title: '夫の家を出る', story: '夫との間は冷えきった。都の女は自分から出ていくというが、この村で聞いたことはない。', // M13 農村でどこまであったかは推測
    left: { title: '持参金を持って家を出る', stake: riskBody(), odds: 4, win: { text: '夫の家を出た。子は残った。振り返らなかった。', divorce: true, store: 3, remove: ['hhouse', 'hfield', 'dowry.big', 'dowry.small', ...KIDS_STAY], add: ['house', 'springvow'] }, lose: { text: '姑に戸口で止められ、村じゅうに知れた。', add: ['rumor'] } },
    right: { title: '子のために踏みとどまる', stake: body(), odds: 5, win: { text: '朝になると、また炉に火を入れた。', add: ['hearth'] }, lose: { text: '夜のあいだ泣いて、起きられなかった。' } } }),

  // ── お産（orange の 3 層案の 2 層目）。どちらを選んでも産む。サイコロは代償を決める
  // 手を洗い布を煮るのは現代人の知恵（`modern`）。「衛生と手当て」の能力が効く。M5 M6
  family('ob.first', { repeat: true, ages: [16, 50], title: '初めてのお産', story: '陣痛が来た。家の者が産婆を呼ぶかと聞く。呼べば銭がかかる。自分の知っている手当ては、この家の誰も知らない。',
    left: { title: '産婆を呼ぶ', stake: store(2), odds: 5, win: { text: '産婆の手で子が生まれた。泣き声が家じゅうに響いた。', deliver: 'alive' }, lose: { text: '丸一日かかった。血が止まらなかった。', die: true, deliver: 'lost' } },
    right: { title: '手を洗わせ、布を煮てもらう', modern: true, stake: body(), odds: 4, win: { text: '家の者は呆れ顔で手を洗った。熱も出ず、子は乳を吸った。', deliver: 'alive', add: ['oddity'] }, lose: { text: '子は助かった。けれど熱が引かず、体は元に戻らなかった。', body: -3, maxBody: -1, deliver: 'alive', add: ['oddity'] } } }),
  family('ob.hard', { repeat: true, ages: [16, 50], title: '難産の前ぶれ', story: '産婆が腹に手を当てて、首を振った。子の向きが悪い。自分を助けるか、子を助けるか、どちらかに賭けるしかない。',
    left: { title: '産婆の手に任せて、子を引き出してもらう', stake: store(3), odds: 3, win: { text: '子は生まれた。産婆が初めて笑った。', deliver: 'alive' }, lose: { text: '血が止まらなかった。子の泣き声を聞いて、目を閉じた。', die: true, deliver: 'alive' } },
    right: { title: '手を洗わせ、布を煮て、無理に引かせない', modern: true, stake: body(), odds: 3, win: { text: '時間はかかったが、子も自分も生きていた。村の女たちは首をかしげた。', deliver: 'alive', add: ['oddity'] }, lose: { text: '命は助かった。子は息をしなかった。', body: -2, maxBody: -1, deliver: 'lost', add: ['oddity'] } } }),
  // 年の締めの出来事のための役。この札そのものは出ない
  family('lo.child', { ages: [16, 42], repeat: true, title: '身ごもる', story: '腹に子が宿った。',
    left: { title: '産む', odds: 6, win: { text: '子が生まれた。' } }, right: { title: '産む', odds: 6, win: { text: '子が生まれた。' } } }),
  // M4 M7 子の札。娘を学ばせる金は、息子に比べて出しにくかったはず（推測）
  family('ch.seven', { ages: [20, 75], repeat: true, title: '子の学び', story: '子が七つになった。もう目を離しても、火に手を入れない。',
    left: { title: '町の文法教師に通わせる', stake: store(2), odds: 5, win: { text: '子が文字を覚えはじめた。自分より上手に書く。', add: ['childletters'] }, lose: { text: '教師になじめず、戻ってきた。' } },
    right: { title: '糸と畑を教え込む', stake: body(), odds: 6, win: { text: '小さな手が仕事を覚えた。夕方、少し座っていられるようになった。', add: ['childhands'] } } }),
  family('ch.fifteen', { ages: [20, 75], repeat: true, title: '子の行く末', story: '子が大人になる年だ。この先を決めるのは家の男たちだが、男たちを動かすのは自分だ。',
    left: { title: '畑を分けてそばに置く', stake: store(2), odds: 5, win: { text: '子は隣の畑に住むことになった。煙が見える。', add: ['branchhouse'] }, lose: { text: '分ける畑が足りず、話は先送りになった。' } },
    right: { title: '都へ出す', stake: body(), odds: 4, win: { text: '子は都へ出た。手紙は来ない。読める者もいない。', sendChild: true, add: ['childaway'] }, lose: { text: '都になじまず、戻ってきた。' } } }),
  family('ie.retire', { family: true, ages: [55, 65], needsAny: ['grownchild', 'heir'], title: '鍵を渡す日', story: '炉の鍵を腰に下げて、何十年になるか。息子の嫁が、こちらの手元を見ている。',
    left: { title: '鍵を息子の嫁に渡す', odds: 6, win: { text: '鍵を渡した。朝、誰より遅く起きてよくなった。起きてしまうが。', retire: 'inherit' } },
    right: { title: '子らに分けて、身を引く', odds: 6, win: { text: '畑を子らに分けた。煙が三つ立つようになった。', retire: 'divide', houseDown: true, add: ['branchhouse'] } } }),

  // ── 親の死とお金の法
  family('fam.sister', { ages: [15, 20], needs: ['sister'], title: '妹の持参金', story: '妹に縁談が来た。家の蓄えをどう割るかの話になった。自分のぶんも、妹のぶんも、同じ麦から出る。', always: { remove: ['sister'], add: ['inlaw'] },
    left: { title: '自分のぶんを削って妹に回す', stake: store(2), odds: 6, win: { text: '妹は胸を張って嫁いだ。村の女たちが見ていた。', add: ['villagetrust'] } },
    right: { title: '婚礼の行列で歌う', stake: body(), odds: 4, win: { text: '歌がうまいと評判になった。', add: ['singer'] }, lose: { text: '声が裏返って、笑われた。' } } }),
  // M9 M10 M12: 自由な結婚なら、嫁いでも父の相続人のまま。遺言が無ければ男女同分。父が死ぬと後見人が付く
  family('fam.father', { ages: [28, 42], needsAny: ['father', 'oldfather'], title: '父の死', story: '父が死んだ。嫁いでいても、娘は父の相続人だ。遺言は無い。兄弟と同じ分をもらえるはずだが、畑は兄弟が耕している。', always: { remove: ['father', 'oldfather'], add: ['tutor'] },
    left: { title: '同じ分をよこせと言う', stake: store(1), odds: 4, win: { text: '叔父が後見人として同意し、畑の一部が自分の名になった。', add: ['share'] }, lose: { text: '話し合いはこじれ、兄弟と口をきかなくなった。', add: ['patrongrudge'] } },
    right: { title: '取り分を兄弟に任せて葬列を出す', stake: store(2), odds: 6, win: { text: '父の面を掲げた葬列に、村中が並んだ。兄弟は頭を下げた。', add: ['villagetrust'] } } }),
  family('fam.mother', { ages: [33, 50], needs: ['mother'], title: '母の死', story: '母が静かに息を引き取った。枕元に紡錘が残っていた。', always: { remove: ['mother'] },
    left: { title: '墓碑に「羊毛を作った」と刻ませる', stake: store(2), odds: 6, win: { text: '街道沿いに、母の名を刻んだ墓が建った。家を守り、羊毛を作った、と。', add: ['villagetrust'] } }, // M14
    right: { title: '母の紡錘を受け継ぐ', stake: body(), odds: 6, win: { text: '母の紡錘は、手によく馴染んだ。', add: ['loom'] } } }),
  family('ie.succession', { family: true, ages: [28, 75], title: '生家の跡目', story: '生家で跡目の話が出ている。', contest: 'succession',
    left: { title: '口を出す', odds: 3, win: { text: '話はまとまった。' }, lose: { text: '話はこじれた。' } }, right: { title: '任せる', odds: 6, win: { text: '任せた。' } } }),

  // ── 夫の死と寡婦（M3 M24 M25 M26）
  family('fam.husband', { family: true, ages: [25, 75], repeat: true, cooldown: 4, needsAny: HUSBANDS, title: '夫の死', story: '夫が床についた。夫は自分より十ほど上で、この家では誰も驚かない。', always: { remove: HUSBANDS },
    left: { title: 'そばで看取り、次の日には畑に出る', stake: body(), odds: 5, win: { text: '夫は畑の話をして逝った。次の朝、自分が鋤を握った。', add: ['strongbody'] }, lose: { text: '看病の疲れで、自分も寝ついた。', body: -1 } },
    right: { title: '泣き女を雇って葬列を出す', stake: store(2), odds: 6, win: { text: '泣き女の声が村の外れまで届いた。あの声は、仕事にできるのだと思った。', add: ['villagetrust'] } } }),
  family('fam.husband.old', { family: true, ages: [22, 60], repeat: true, weight: 3, cooldown: 4, needs: ['husband.old'], title: '年かさの夫の死', story: '退役兵の夫は、古傷から熱を出した。もう歳だった。', always: { remove: HUSBANDS },
    left: { title: '夫が軍で得た土地を守る手続きをする', stake: store(1), odds: 4, win: { text: '夫の仲間が口をきき、土地はこちらに残った。', add: ['heldland'] }, lose: { text: '土地の話は宙に浮いた。' } },
    right: { title: '静かに送る', stake: body(), odds: 6, win: { text: '墓に夫の青銅の飾りを入れた。', add: ['gods'] } } }),
  family('wd.land', { family: true, ages: [20, 75], needs: ['widow', 'hfield'], title: '夫の兄弟', story: '夫の兄弟が来て、畑はこの家のものだと言う。持参金は返すから生家へ戻れ、と言う。', // M2 M26
    left: { title: '裁きの場へ出て畑を争う', stake: store(2), odds: 4, win: { text: '子の後見を自分の縁者に頼み、畑は守られた。男たちが、声を落とした。', add: ['heldland'] }, lose: { text: '畑は夫の兄弟のものになった。', remove: ['hfield'], add: ['patrongrudge'] } },
    right: { title: '持参金を受け取って畑を渡す', stake: body(), odds: 6, win: { text: '持参金が戻った。元手としては悪くない。', store: 5, remove: ['hfield'] } } }),
  family('wd.remarry', { family: true, ages: [20, 55], repeat: true, cooldown: 4, weight: 2, needs: ['widow'], lacks: ['spouse'], title: '再婚の話', story: '寡婦のままでいるのはもったいないと、村の女たちが言う。男手のある家の話が来た。', // M24
    left: { title: '持参金を持って再婚する', stake: store(2), odds: 5, win: { text: '再び嫁いだ。夫の子と自分の子が、同じ炉を囲んだ。', ...MOVE_OUT, add: ['hhouse', 'hfield', 'husband.farm'] }, lose: { text: '話がまとまらなかった。' } },
    right: { title: '亡き夫の墓を守って独りでいる', stake: body(), odds: 4, win: { text: '一人の夫にだけ添った女だと、墓の前で言われるようになった。', add: ['univira'] }, lose: { text: '寂しさで体を崩した。' } } }),
  { id: 'wd.trade', frame: 'path', ages: [20, 70], axis: 'money', needs: ['widow'], title: '寡婦の小商い', story: '夫がいなくなると、銭の話を直にできるようになった。誰も止めない。', art: 'onna.scene', // M24
    left: { title: '布を背負って町へ出る', stake: store(2), odds: 4, win: { text: '市の端に屋台を構えた。', add: ['stall'] }, lose: { text: '買い叩かれて帰った。' } },
    right: { title: '山の放牧へついて行く', stake: riskBody(), odds: 4, win: { text: '羊飼いの女たちと、夏を山で過ごした。', add: ['drover'] }, lose: { text: '山道で足を傷めた。', add: ['wound'] } } },

  // ── 求め
  { id: 'dm.spin', frame: 'demand', demand: true, repeat: true, ages: [20, 70], cooldown: 6, needs: ['cliens'], ignore: { label: 'パトロヌスの奥方の不興を買う', effect: { text: '奥方の使いは黙って帰った。次の頼みは聞いてもらえない。', add: ['patrongrudge'] } }, title: 'パトロヌスの奥方の求め', story: 'パトロヌスの奥方が、娘の婚礼に手織りの布を出せと言ってきた。男に票があるように、女には女の奉公がある。', art: 'onna.scene', // 推測: 女同士の庇護の形
    left: { title: '夜を削って布を織る', stake: body(), odds: 5, win: { text: '布は喜ばれた。奥方が名を覚えてくれた。', add: ['patronfavor'] }, lose: { text: '目が飛んだ布を出して、顔をしかめられた。' } },
    right: { title: '断る', stake: store(1), odds: 5, win: { text: '断った。' }, lose: { text: '断った。' } } },

  // ── 外の死（女の側）。死ぬのは、かならず画面に出た札の結果として
  { id: 'f.road', frame: 'fight', ages: [16, 60], repeat: true, cooldown: 10, axis: 'money', title: '夜道の市帰り', story: '市で布が売れて、帰りが遅くなった。街道の木陰に、男が二人立っている。', art: 'onna.scene',
    left: { title: '銭を抱えて走り抜ける', stake: riskBody(2), odds: 4, win: { text: '息が切れるまで走った。銭は無事だった。', store: 3 }, lose: { text: '追いつかれて、背中に刃が入った。街道の土が頬に冷たかった。', die: true } },
    right: { title: '銭を投げ出して逃げる', stake: store(2), odds: 5, win: { text: '男たちは銭を拾った。命は残った。' }, lose: { text: '殴られて、歯を失った。', body: -1 } } },
  { id: 'f.soldier', frame: 'fight', ages: [16, 60], years: [-91, -31], axis: 'strength', title: '戸口の兵', story: '男たちが畑に出ている時に、はぐれた兵が戸口に立った。小さい子らが後ろにいる。', art: 'onna.scene',
    left: { title: '包丁を取って立つ', stake: riskBody(2), odds: 3, win: { text: '兵は舌打ちをして去った。手の震えは夜まで止まらなかった。', add: ['knife'], maxBody: 1 }, lose: { text: '子らの前で斬られた。', die: true } },
    right: { title: '麦を渡して子らを裏から逃がす', stake: store(3), odds: 5, win: { text: '子らは丘の上で無事だった。', add: ['hearth'] }, lose: { text: '麦を取られ、殴られた。', body: -2 } } },

  // ── 梯子 1 段目
  rungCard('st.women', 'status', 1, { ages: [15, 40], title: '女たちの寄り合い', story: '泉のほとりで女たちが相談している。誰の娘をどこへやるか、ここで大方が決まる。', // M20
    left: { title: '口を開いて場をまとめる', stake: body(), odds: 5, win: { text: '次の相談から、自分の顔を見て話が始まるようになった。', add: ['villagetrust'] }, lose: { text: '若いくせに、と言われた。' } },
    right: { title: '聞き役に回り、夜は機に向かう', stake: body(), odds: 5, win: { text: '織り上げた布で、機がもう一台ほしくなった。', add: ['loom'] }, lose: { text: '聞き役のまま夜が更けた。' } } }),
  rungCard('mo.preserve', 'money', 1, { ages: [18, 40], title: '鶏と保存食', story: '卵は市で銭になる。オリーブと干し肉は、不作の冬に命になる。', // M16
    left: { title: '鶏を増やし、瓶を並べる', stake: store(1), odds: 5, win: { text: '納屋に瓶が並んだ。', add: ['henyard'] }, lose: { text: '鼬に鶏をやられた。' } },
    right: { title: '余った卵で隣の若者を釣る', stake: body(), odds: 5, win: { text: '泉のほとりで会う約束ができた。', add: ['springvow'] }, lose: { text: '卵だけ取られた。' } } }),
  rungCard('lo.spring', 'love', 1, { ages: [18, 30], title: '泉のほとり', story: '朝の水汲みの列に、見慣れた顔がある。',
    left: { title: '水瓶を置いて話しかける', stake: body(), odds: 5, win: { text: '水汲みの時間が、少し長くなった。', add: ['springvow'] }, lose: { text: '水瓶を割って、走って帰った。' } },
    right: { title: '水を運んで炉へ急ぐ', stake: body(), odds: 5, win: { text: '家の者が、火の扱いを任せてくれた。', add: ['hearth'] }, lose: { text: '水をこぼして、もう一度行った。' } } }),
  rungCard('sl.keys', 'slow', 1, { needsAny: HUSBANDS, ages: [18, 40], title: '姑の鍵', story: '姑が、納屋の鍵を腰から外して手の上で重さを量っている。任せるかどうかを考えている顔だ。', // M16
    left: { title: '何年でも待つ構えで働く', stake: body(), odds: 5, win: { text: 'ある朝、鍵が炉の上に置いてあった。', add: ['hearth'] }, lose: { text: '鍵は、また姑の腰に戻った。' } },
    right: { title: '鍵より麦刈りで認めさせる', stake: riskBody(), odds: 5, win: { text: '男と同じ幅を刈った。女たちは何も言わなかった。', add: ['sickle'] }, lose: { text: '腰を痛めた。', add: ['wound'] } } }),
  rungCard('sr.harvest', 'strength', 1, { ages: [15, 40], title: '麦刈りの列', story: '刈り入れは人手が足りない。女も子も列に入る。男と同じ幅を刈れば、噂になる。', // M18
    left: { title: '男の列に入る', stake: riskBody(), odds: 5, win: { text: '夕方、男たちが黙って水を回してきた。', add: ['sickle'] }, lose: { text: '鎌で脛を切った。', add: ['wound'] } },
    right: { title: '女の列で歌って調子を取る', stake: body(), odds: 5, win: { text: '歌の調子で、列の全部が速くなった。', add: ['singer'] }, lose: { text: '息が続かなかった。' } } }),
  rungCard('ar.lament', 'art', 1, { ages: [15, 40], title: '村の挽歌', story: '村の年寄りが死んだ。挽歌を歌う女が足りない。節は誰かに習うものだ。', // M34
    left: { title: '節を習って歌う', stake: body(), odds: 5, win: { text: '歌い終えると、遺族が麦を一袋くれた。', add: ['naenia'] }, lose: { text: '節を間違え、老女に袖を引かれた。' } },
    right: { title: '葬式の段取りを女たちに割り振る', stake: body(), odds: 5, win: { text: '葬式のたびに呼ばれるようになった。', add: ['villagetrust'] }, lose: { text: '段取りを誤り、年寄りに叱られた。' } } }),

  // ── 梯子 2 段目
  rungCard('st.festival', 'status', 2, { title: '女たちの祭りの世話役', story: '町の女たちの祭りに、世話役の空きが出た。金は出すものであって、もらうものではない。',
    left: { title: '金を出して世話役になる', stake: store(2), odds: 4, win: { text: '町の女たちの列の、前の方を歩いた。', add: ['festwoman'] }, lose: { text: '金だけ受け取られた。' } },
    right: { title: '祭りの布を織って売り込む', cost: { store: 3 }, odds: 4, win: { text: '布が評判になり、町に小さな店を持った。', add: ['shop'] }, lose: { text: '売れ残った。' } } }),
  rungCard('st.priest', 'status', 2, { ages: [25, 60], title: '町の女神官', story: '町のウェヌスの女神官の席が空いた。家の格と金のある女が就く席だ。農家の女が手を挙げれば、笑われるところから始まる。', // M23 共和政末の例は未確認。推測
    left: { title: '持参金の全部を動かして手を挙げる', stake: store(5), odds: 3, win: { text: '神官の白い帯を受け取った。笑った女たちが、道を空けた。', add: ['sacerdos'] }, lose: { text: '笑われて終わった。銭も戻らなかった。', add: ['oddity'] } },
    right: { title: '祭りの世話役に回って足場を作る', stake: store(2), odds: 4, win: { text: '次の祭りでは前の列にいた。', add: ['festwoman'] }, lose: { text: '話は別の女に回った。' } } }),
  rungCard('mo.weave', 'money', 2, { needsAny: ['loom', 'henyard', 'hfield', 'stall'], title: '布を町へ', story: '自分の家で着るぶんより、機が多く織れるようになった。町の市に持っていけば、銭になる。', // M14 M15 M19
    left: { title: '町に小さな店を構える', cost: { store: 3 }, odds: 4, win: { text: '店を持った。看板は男の名だが、値を決めるのは自分だ。', add: ['shop'] }, lose: { text: '店賃だけ払って閉めた。' } },
    right: { title: '町で書記の男と知り合う', stake: store(1), odds: 5, win: { text: '帳面を教わるうちに、別の話もするようになった。', add: ['lover.freed'] }, lose: { text: '話だけの男だった。' } } }),
  rungCard('mo.stall', 'money', 2, { title: '市の屋台', story: '八日ごとの市に、女の屋台が並ぶ。場所取りは夜明け前からだ。', // M19
    left: { title: '夜明け前に場所を取る', stake: body(), odds: 4, win: { text: '毎回同じ場所に立てるようになった。', add: ['stall'] }, lose: { text: '男に場所を蹴散らされた。' } },
    right: { title: '市の女たちの祭りの金を集める', stake: store(1), odds: 4, win: { text: '集めた金を預かる役になった。', add: ['festwoman'] }, lose: { text: '集めた金が合わなくて、自腹を切った。' } } }),
  rungCard('mo.midwife', 'money', 2, { needsAny: ['wisewoman'], ages: [25, 65], title: '産婆の代替わり', story: '村の産婆の老女が、目が見えなくなってきた。誰かが継がないと、女たちが困る。', // M6 M19
    left: { title: '次のお産から自分が手を出す', stake: body(), odds: 4, win: { text: '夜中に戸を叩かれる暮らしになった。麦と鶏が届く。', add: ['midwife'] }, lose: { text: '最初のお産で子を死なせた。戸を叩く者がいなくなった。', add: ['oddity'] } },
    right: { title: '町の女たちに手順を教える', stake: store(1), odds: 4, win: { text: '町の女たちに呼ばれるようになった。', add: ['festwoman'] }, lose: { text: '町の産婆に睨まれた。' } } }),
  rungCard('lo.feast', 'love', 2, { ages: [18, 50], title: 'フロラリアの夜', story: '春の花の祭りの夜。町は遅くまで浮かれている。家の者は先に寝た。',
    left: { title: '花の冠のまま踊りの輪に入る', stake: store(1), odds: 4, win: { text: '誰と踊ったかを、町の女たちが翌朝には知っていた。', add: ['feastlove'] }, lose: { text: '人に押されて、冠だけ失くした。' } },
    right: { title: '帰り道に酔った男を突き飛ばす', stake: riskBody(), odds: 4, win: { text: '男は泥に落ちた。翌日、町で噂になった。', add: ['knife'] }, lose: { text: '腕をつかまれて、痣になった。', body: -1 } } }),
  rungCard('sl.daughter', 'slow', 2, { repeat: true, cooldown: 5, ages: [30, 65], needsAny: ['helper', 'grownchild', 'heir'], title: '娘の持参金', story: '娘に話が来た。十何年前、自分の縁談のときに家の者がしていた顔を、いま自分がしている。', // M2
    left: { title: '蓄えから厚く持たせる', stake: store(8), minStore: 8, odds: 4, win: { text: '娘は隣の村で大事にされている。', add: ['daughterwed'] }, lose: { text: '話が流れ、銭だけが減った。' } },
    right: { title: '葬列の歌で稼いで持たせる', stake: body(), odds: 4, win: { text: '泣き女の声がよく通ると、町に呼ばれるようになった。', add: ['praefica'] }, lose: { text: '喉を潰した。' } } }),
  family('sl.adopt', { needsAny: HUSBANDS, ages: [35, 60], axis: 'slow', lacks: ['heir', 'grownchild', 'helper'], title: '跡取りのいない家', story: '子が育たなかった。夫の家を継ぐ者がいない。子ができないのを女の咎にする者もいる。', // M26 離婚の申し出の話。養子は本体の札と同じく推測
    left: { title: '夫の親族の子を迎える', stake: store(2), odds: 4, win: { text: '親族の子を迎え、自分の子として育てることにした。', add: ['heir'] }, lose: { text: '親族は、子を手放さなかった。' } },
    right: { title: '村の孤児を引き取る', stake: body(), odds: 4, win: { text: '孤児を引き取った。夜泣きが聞こえると、体が先に起きた。', add: ['heir'] }, lose: { text: '孤児は、ほかの家に引き取られた。' } } }),
  rungCard('sr.drover', 'strength', 2, { title: '移牧の隊', story: '夏になると羊の群れが山へ上がる。羊飼いの隊には、火と食事を預かる女が付いていく。', // M18
    left: { title: '家を空けて山へ上がる', stake: riskBody(2), odds: 3, win: { text: '夏の間に、狼も雷も一通り見た。', add: ['drover'], store: 2, maxBody: 1 }, lose: { text: '崖で足を折った。', add: ['wound'] } },
    right: { title: '山の羊毛を買いつけて市へ下ろす', stake: store(2), odds: 4, win: { text: '市で、羊毛の女と呼ばれるようになった。', add: ['stall'] }, lose: { text: '虫のついた毛をつかまされた。' } } }),
  rungCard('ar.praefica', 'art', 2, { title: '葬列の泣き女', story: '町の金持ちの葬列に、泣き女の口がかかった。よく稼げるが、村の女たちは眉をひそめる。', // M34
    left: { title: '葬列の先頭で歌う', stake: body(), odds: 4, win: { text: '町じゅうが自分の声を聞いた。麦ではなく銭をもらった。', add: ['praefica'], store: 2 }, lose: { text: '声が出ず、半金で帰された。', add: ['oddity'] } },
    right: { title: '声の代わりに機の図柄で勝負する', stake: body(), odds: 4, win: { text: '自分の図柄を、町の女が真似しはじめた。', add: ['pattern'] }, lose: { text: '糸が足りなかった。' } } }),
  rungCard('ar.pattern', 'art', 2, { title: '機の図柄', story: '縁取りの図柄を思いついた。町の女が着ているものより、ずっといい。', // M14
    left: { title: '夜を削って織り出す', stake: body(), odds: 4, win: { text: '市で「あの女の図柄」と呼ばれるようになった。', add: ['pattern'] }, lose: { text: '目が飛んで、ほどき直した。' } },
    right: { title: '図柄を売って銭にする', stake: body(), odds: 5, win: { text: '町の店が買っていった。', store: 2 }, lose: { text: '真似だけされた。' } } }),

  // ── 梯子 3 段目
  rungCard('st.bonadea', 'status', 3, { title: 'ボナ・デアの夜の招き', story: '都の奥方から、十二月の女だけの祭りの手伝いの声がかかった。男は入れない。手伝いでも、座れば顔を覚えてもらえる。', // M21 農家の女に声がかかるかは推測
    left: { title: '都へ上がって席に着く', stake: store(3), odds: 3, win: { text: '都の奥方たちの間で、田舎の女が一人、名を覚えられた。', add: ['bonadea'] }, lose: { text: '台所から出してもらえなかった。' } },
    right: { title: '奥方に金を貸す話を持ちかける', stake: store(4), odds: 3, win: { text: '奥方は困っていた。帳面が一冊増えた。', add: ['moneybook'] }, lose: { text: '貸した金は戻らなかった。', add: ['debt'] } } }),
  rungCard('mo.vilica', 'money', 3, { title: '大農場の女管理人', story: '畑を耕してきた腕を見て、町の金持ちが農場を任せたいと言う。ワインと油と人手の面倒を見る仕事だ。', // M16 M17 実際のウィリカは奴隷が多いはず（推測）
    left: { title: '搾り場の帳面まで引き受ける', stake: store(3), odds: 3, win: { text: '農場の女たちが、自分を見て動くようになった。', add: ['vilica'] }, lose: { text: '一年目の油が腐って、話は流れた。' } },
    right: { title: '都から来た客と親しくなる', stake: store(2), odds: 3, win: { text: '農場の客の話が、町を越えて都まで届いた。', add: ['romelove'] }, lose: { text: '主人に知れて、追い出された。', add: ['rumor'] } } }),
  rungCard('mo.lend', 'money', 3, { title: '貸し金の帳面', story: '金を借りに来るのは男ばかりだが、貸す側に女がいても、銭の色は変わらない。キケロにも金を貸した女がいるという。', // M33 推測
    left: { title: '利息を決めて貸す', stake: store(4), odds: 3, win: { text: '帳面が一冊埋まった。後見人は同意の印を押すだけだ。', add: ['moneybook'] }, lose: { text: '借り手が夜逃げした。', add: ['debt'] } }, // M12
    right: { title: '貸すより荷車で軍の後を行く', stake: riskBody(2), odds: 3, win: { text: '兵たちは、女の荷車から麦と酒を買った。', add: ['camp'] }, lose: { text: '戦の後始末に巻き込まれて、荷車を失った。', add: ['wound'] } } }),
  rungCard('lo.rome', 'love', 3, { ages: [25, 65], title: '都の詩人', story: '都から来た若い詩人が、町の宿に逗留している。田舎の女を歌にしたいのだそうだ。',
    left: { title: '夜の話し相手になる', stake: store(2), odds: 3, win: { text: '都でその詩が読まれ、誰のことかと噂になった。', add: ['romelove'] }, lose: { text: '噂が村に届いた。', add: ['rumor'] } },
    right: { title: '詩人の顔を描かせてもらう', stake: body(), odds: 3, win: { text: '詩人は自分の顔より絵を褒めた。絵の注文が来るようになった。', add: ['portrait'] }, lose: { text: '似ていないと笑われた。' } } }),
  rungCard('lo.actor', 'love', 3, { ages: [25, 65], title: '都の一座', story: '都の一座が町の仮設の舞台にかかった。看板の役者が、客席の女を探している。役者は法の上では不名誉な身分だ。', // M19
    left: { title: '楽屋へ花を届けに行く', stake: store(2), odds: 3, win: { text: '次の町でも、次の町でも、その話がついて回った。', add: ['romelove'] }, lose: { text: '楽屋口で村の者に見つかった。', add: ['rumor'] } },
    right: { title: '一座の女たちに挽歌を教える', stake: body(), odds: 3, win: { text: '一座が都へ戻ると、都の貴人の娘が節を習いに来た。', add: ['salon'] }, lose: { text: '節は舞台に向かないと断られた。' } } }),
  // 嫁取りは、姑の側の賭け。自分がされたことを、今度は自分がする
  rungCard('sl.heirwed', 'slow', 3, { ages: [40, 70], needsAny: ['heir'], lacks: ['heirwed'], title: '息子の嫁', story: '跡取りが年頃になった。嫁を選ぶのは家長の役目だが、持参金の額を二度数えるのは自分の役目だ。',
    left: { title: '持参金の厚い嫁を取る', stake: store(2), odds: 3, win: { text: '格上の家から嫁が来た。自分の座る席は変わらなかった。', add: ['heirwed', 'patronfavor'] }, lose: { text: '持参金の話が折り合わず、借金で婚礼を出した。', add: ['heirwed', 'debt'] } },
    right: { title: '息子の想う娘を迎える', stake: body(), odds: 3, win: { text: '家が明るくなった。嫁は鍵のことをまだ知らない。', add: ['heirwed', 'garden'] }, lose: { text: 'パトロヌスの奥方の勧めを断った形になった。', add: ['heirwed', 'patrongrudge'] } } }),
  rungCard('sr.defend', 'strength', 3, { title: '略奪者', story: '男たちが都へ逃げ、家には自分しかいない。徒党が門を破ろうとしている。', // M26
    left: { title: '家の者を集めて門を守る', stake: riskBody(2), odds: 3, win: { text: '徒党は引き上げた。あの家には女がいる、と噂になった。', add: ['heldhouse'] }, lose: { text: '門は破られた。自分は生きていた。', add: ['wound'] } },
    right: { title: '広場へ行って役人の前で声を上げる', stake: store(2), odds: 3, win: { text: '女の訴えが広場の話の種になった。', add: ['matronvoice'] }, lose: { text: '引きずり出されて痣だらけになった。', body: -1 } } }),
  rungCard('sr.camp', 'strength', 3, { title: '軍の後を行く', story: '軍が動くと、その後ろに荷車が続く。酒と麦と布を売る女たちだ。将軍によっては追い払われる。', // 推測
    left: { title: '荷車を出して軍について行く', stake: riskBody(2), odds: 3, win: { text: '一年で、村の十年分を見て帰った。', add: ['camp'], store: 3 }, lose: { text: '荷車ごと焼かれた。', add: ['wound'] } },
    right: { title: '町に残って帰還兵に貸す', stake: store(4), odds: 3, win: { text: '帰還兵の土地の一部が、帳面の上で自分のものになった。', add: ['moneybook'] }, lose: { text: '借り手は戻らなかった。', add: ['debt'] } } }),
  rungCard('ar.iaia', 'art', 3, { title: '女の肖像', story: 'キュジコスから来た女の絵師が、都で男の絵師より稼いでいるという。婦人たちは、男に顔を見られたくないのだ。', // M30
    left: { title: '板と絵具を買って描きはじめる', stake: store(2), odds: 3, win: { text: '町の婦人の肖像が、都の婦人の耳に入った。', add: ['portrait'] }, lose: { text: '絵具だけが減った。' } },
    right: { title: '貴人の娘たちに歌を教えに行く', stake: body(), odds: 3, win: { text: '娘たちが都で歌った。誰に習ったのかと聞かれたという。', add: ['salon'] }, lose: { text: '田舎の節だと笑われた。' } } }),
  rungCard('ar.salon', 'art', 3, { title: '貴人の家の歌', story: '貴人の娘が、挽歌の節を習いたいと言ってきた。泣き女に習うのは恥だと、母親は思っている。', // M34
    left: { title: '夜に裏口から通う', stake: body(), odds: 3, win: { text: '貴人の家の宴で、自分の節が歌われた。', add: ['salon'] }, lose: { text: '母親に見つかり、裏口が閉じた。' } },
    right: { title: '都のボナ・デアの夜に歌を奉じる', stake: store(3), odds: 3, win: { text: '女たちだけの夜に、自分の声が通った。', add: ['bonadea'] }, lose: { text: '田舎の節は、呼ばれなかった。' } } }),

  // ── 梯子 4 段目（後世に名が残る女。ごく僅かな例外）
  rungCard('st.statue', 'status', 4, { title: '町の広場の像', story: '町の者たちが、女の像を立てる話をしている。都にはコルネリアの像があるという。女の像など、見たことのない者のほうが多い。', // M28
    left: { title: '町への寄進を重ねて、話を押し切る', stake: store(5), odds: 2, win: { text: '広場に像が立った。台座に自分の名がある。読めない子どもが、字をなぞっている。', add: ['statue'] }, lose: { text: '男たちが「女の像は」と言い出して、立ち消えた。' } },
    right: { title: '像の金で飢えた兵を養う', stake: store(5), odds: 2, win: { text: '敗れた軍の兵に麦と衣と路銀を配った。カヌシウムのブサのようだと語られた。', add: ['busa'] }, lose: { text: '麦は配った。誰も覚えなかった。' } } }), // M29
  rungCard('mo.busa', 'money', 4, { title: '敗兵の列', story: '敗れた軍の兵が、街道を歩いて来る。昔、カヌシウムのブサという女が、敗兵一万に麦と衣を配って元老院に讃えられたという。', // M29
    left: { title: '蔵を開ける', stake: store(5), odds: 2, win: { text: '麦と衣と路銀を配った。兵たちの故郷で、自分の名が話されているという。', add: ['busa'] }, lose: { text: '蔵は空になった。感謝の声は、街道の向こうへ消えた。', add: ['debt'] } },
    right: { title: '帳面の貸し金を一手に集める', stake: store(4), odds: 2, win: { text: '町の土地の半分に、自分の帳面が絡むようになった。語り草になった。', add: ['legend'] }, lose: { text: '貸し手が多すぎた。取り立てに出た男が戻らなかった。', add: ['debt'] } } }),
  rungCard('lo.stone', 'love', 4, { needs: ['role:spouse'], title: '墓石の言葉', story: '長く添った夫が、自分の墓石に刻む言葉を考えている。子ができなくて離婚を申し出た妻の墓に、四十一年の礼を刻んだ夫が都にいたという。', // M26
    left: { title: '夫に、言葉を任せる', stake: store(4), odds: 2, win: { text: '石工が刻んだ言葉を読んで、夫の言葉を初めて褒めた。', add: ['stonewords'] }, lose: { text: '「羊毛を作った」とだけ刻まれた。悪くはない。' } },
    right: { title: '歌に残してもらう', stake: body(), odds: 2, win: { text: '都の詩人が、古い恋の歌を拾っていった。', add: ['sunglove'] }, lose: { text: '名前を間違えられた。' } } }),
  rungCard('lo.poem', 'love', 4, { title: '恋の詩を探す詩人', story: '都の詩人が、本当にあった恋の話を探している。あの頃の話をしてもいい歳になった。',
    left: { title: '名を伏せて、全部話す', stake: body(), odds: 2, win: { text: '名を変えて、詩に残った。あれが誰か、知っているのは自分だけだ。', add: ['sunglove'] }, lose: { text: '詩人は話を別の女に変えた。' } },
    right: { title: '話す代わりに書いて渡す', stake: body(), odds: 2, win: { text: '自分の書いた短い詩が、詩人の巻に紛れ込んだ。', add: ['copied'] }, lose: { text: '蝋板は返ってこなかった。' } } }), // M31
  rungCard('sl.jewels', 'slow', 4, { title: '宝石の話', story: '町の婦人が、指輪を見せて「あなたの宝石は」と言った。十二人産んで三人育てた都の母が、息子たちを指して「これが私の宝石」と答えた話を思い出した。', // M7 M28
    left: { title: '育った子らを呼ぶ', stake: body(), odds: 2, win: { text: '子らが並んだ。その話は、婦人から婦人へ、町じゅうに広まった。', add: ['jewels'] }, lose: { text: '子らは畑に出ていて、誰も来なかった。' } },
    right: { title: '小さな墓の話を、子どもたちにする', stake: body(), odds: 2, win: { text: '育たなかった子らの名まで、子どもたちが覚えた。もっと小さい子に、同じ話をしていた。', add: ['ancestor'] }, lose: { text: '子どもたちは途中で眠った。' } } }),
  rungCard('sl.founder', 'slow', 4, { ages: [45, 75], title: '炉ばたの昔話', story: '村の子らが炉ばたで、昔の話をせがむ。もうその歳だ。',
    left: { title: '全部話す', stake: body(), odds: 2, win: { text: 'あの家のおばあさんの話は、村の話になった。', add: ['ancestor'] }, lose: { text: '半分しか信じてもらえなかった。' } },
    right: { title: '話さず、墓碑を頼む', stake: store(3), odds: 3, win: { text: '家を守り、羊毛を作った、と刻ませた。', add: ['work.epitaph'] }, lose: { text: '石工が字を間違えた。' } } }),
  rungCard('sr.avenge', 'strength', 4, { title: '親の仇', story: '親を殺した男たちの名が、ついに分かった。男たちは「役人に任せろ」と言う。都の女が親の仇を討って、碑に刻まれたという。', // M26
    left: { title: '自分で裁きの場へ引きずり出す', stake: riskBody(2), odds: 2, win: { text: '男たちは裁かれた。その話は、のちに碑に刻まれた。', add: ['vengeance'] }, lose: { text: '夜道で返り討ちにあいかけた。', add: ['wound'] } },
    right: { title: '土地を争う女の話を広場へ持っていく', stake: store(3), odds: 2, win: { text: '自分の話が広場の種になった。', add: ['statue'] }, lose: { text: '話は広場で笑い話になった。' } } }),
  rungCard('sr.sling', 'strength', 4, { title: '包囲の町', story: '戦が町を囲んだ。フルウィアという女が軍を動かし、敵の投石の弾に名を刻まれたという。町の女たちが、自分の方を見ている。', // M32
    left: { title: '城壁で石と煮湯を指図する', stake: riskBody(2), odds: 2, win: { text: '敵の投石の弾に、自分の悪口が刻まれていた。読んで、笑った。', add: ['slingname'] }, lose: { text: '石を受けて、片目を失った。', add: ['wound'] } },
    right: { title: '女たちの歌で夜を持たせる', stake: body(), odds: 2, win: { text: 'あの夜の歌を、書記が書きとめていった。', add: ['copied'] }, lose: { text: '歌う喉が先に尽きた。' } } }),
  rungCard('ar.copied', 'art', 4, { title: '他人の巻', story: '自分の短い詩を、友人の男の詩集の写字生が預かると言う。後には、男の名で読まれるかもしれない。', // M31
    left: { title: 'それでいいと渡す', stake: store(3), odds: 2, win: { text: '男の巻に、自分の六篇が紛れ込んだ。誰の詩とも、書かれていない。', add: ['copied'] }, lose: { text: '写字生は別の詩を選んだ。' } },
    right: { title: '字ではなく顔を残す', stake: store(2), odds: 2, win: { text: '自画像の話を、書物を書く男が書きとめていった。', add: ['selfportrait'] }, lose: { text: '板が割れた。' } } }),
  rungCard('ar.self', 'art', 4, { title: '鏡', story: '老いた女の絵を頼まれた。老女の肖像を描きたがる絵師はいない。手元の鏡に、ちょうどいい顔が映っている。', // M30
    left: { title: '鏡を見て、自分を描く', stake: body(), odds: 2, win: { text: '絵の話が都まで届いた。', add: ['selfportrait'] }, lose: { text: '似ていなかった。似ていなくて、安心した。' } },
    right: { title: '絵は諦め、村の娘に手を教える', stake: body(), odds: 3, win: { text: '娘の手の方が速かった。', add: ['salon'] }, lose: { text: '娘は機に戻った。' } } }),

  // ── 普請
  buildCard('build.cistern', [16, 60], { gives: 'cistern', title: '雨水の貯水槽', story: '泉まで日に何度も往復している。庭に貯水槽があれば、その分だけ機に向かえる。',
    left: { title: '石工を頼む', stake: store(3), odds: 4, win: { text: '水汲みの時間が消えた。', add: ['cistern'] }, lose: { text: '水が漏れた。' } },
    right: { title: '石を自分で運ぶ', stake: body(), odds: 4, win: { text: '腕が太くなった。', add: ['strongbody'] }, lose: { text: '腰を痛めた。' } } }),
  buildCard('build.press', [20, 60], { gives: 'press', needs: ['kind:田'], title: '搾り場', story: 'オリーブを人の搾り場へ持っていくと、油の三分の一を取られる。自分の搾り場があれば。', // M17
    left: { title: '搾り石を据える', stake: store(8), odds: 4, win: { text: '近所の女たちが、油を搾りに来るようになった。', add: ['press'] }, lose: { text: '石が割れた。' } },
    right: { title: '借りて回す', stake: store(1), odds: 4, win: { text: '借りた搾り場の女主人に顔を覚えられた。', add: ['forumgossip'] }, lose: { text: '順番を飛ばされた。' } } }),
  buildCard('build.fountain', [15, 50], { gives: 'fountaingift', axis: 'status', title: '町の泉の寄進', story: '町の泉の石が崩れている。女たちが毎日使う泉だ。男たちは街道のほうばかり直す。', // M23 推測
    left: { title: '石の泉を寄進する', stake: store(10), odds: 4, win: { text: '泉の縁に自分の名が刻まれた。女たちが毎日、名の上に水瓶を置く。', add: ['fountaingift'] }, lose: { text: '工事が途中で止まった。' } },
    right: { title: '女たちと石を積む', stake: body(), odds: 4, win: { text: '夏の間に、女たちの顔が揃った。', add: ['villagetrust'] }, lose: { text: '手を挟んだ。', add: ['wound'] } } }),
  buildCard('build.shrine', [25, 65], { gives: 'shrinegift', axis: 'status', title: '女神の社の寄進', story: 'お産で死んだ女たちの名を預ける場所が、村には無い。ユノ・ルキナの小さな社を建てられるだけの銭が、帳面にある。', // M20 M23 推測
    left: { title: '社を建てる', stake: store(25), odds: 3, win: { text: '身重の女たちが、遠くの村からも来るようになった。', add: ['shrinegift'] }, lose: { text: '神官たちが許さなかった。' } },
    right: { title: '町の女たちに分けて配る', stake: store(2), odds: 3, win: { text: '町の女たちの席を一つ、もらった。', add: ['festwoman'] }, lose: { text: '配っただけで終わった。' } } }),
  buildCard('build.gate', [35, 75], { gives: 'gategift', axis: 'status', title: '町の門', story: '町の門を、女の名で建て替える話を町の役人に持ちかける。まず笑われる。次に金額を聞かれる。', // M23 推測
    left: { title: '金額を言う', stake: store(60), odds: 1, win: { text: '門の上に自分の名がある。町の者は、道を教えるのに門の名で呼びはじめた。', add: ['gategift'] }, lose: { text: '役人たちは、金だけ受け取る方法を考えはじめた。' } },
    right: { title: '門はやめて村の娘たちに分ける', stake: store(3), odds: 3, win: { text: '娘たちの家の帳面に、自分の銭が入った。', add: ['moneybook'] }, lose: { text: '娘の家の者に使い込まれた。' } } }),

  // ── 回復
  { id: 'rec.medicine', frame: 'recovery', ages: [15, 75], repeat: true, cooldown: 8, tired: true, title: '女たちの湯', story: '町の浴場には女の刻限がある。家のことを人に任せれば、半日は自分の体でいられる。', art: 'onna.scene', // 推測: 農村の女がどこまで通えたか
    left: { title: '家を空けて湯に行く', stake: store(1), odds: 6, win: { text: '湯から上がると、肩が軽かった。', body: 2, remove: ['wound'] } },
    right: { title: '湯で町の女たちと話し込む', stake: body(), odds: 4, win: { text: '誰の家に何があったか、半日で全部分かった。', add: ['forumgossip'] }, lose: { text: '話が合わなかった。' } } },
  { id: 'rec.rest', frame: 'recovery', ages: [20, 60], repeat: true, cooldown: 8, tired: true, needsAny: ['grownchild', 'helper'], title: '上の子に任せる', story: '上の子が幼子を背負って、裏で歌っている。この子がいれば、今日は横になれる。', art: 'onna.scene', // orange の 3 層案の 3 層目
    left: { title: '半日、横になる', stake: body(0), odds: 5, win: { text: '夕方まで眠った。何年かぶりに。', body: 2 }, lose: { text: '泣き声で、すぐ起きた。' } },
    right: { title: '上の子に糸も任せて市へ行く', stake: body(), odds: 4, win: { text: '市で布が売れて、帰りに飴を買った。', store: 2 }, lose: { text: '帰ったら、糸がもつれていた。' } } },
  // 静かな年
  { id: 'q.season', frame: 'quiet', quiet: true, repeat: true, ages: [7, 75], title: '静かな一年', story: '大きなことのない一年だった。紡いだ糸の山だけが、増えた。', art: 'onna.scene',
    left: { title: '一年が過ぎる', odds: 6, win: { text: '大きなことのない一年だった。紡いだ糸の山だけが、増えた。' } }, right: { title: '一年が過ぎる', odds: 6, win: { text: '大きなことのない一年だった。紡いだ糸の山だけが、増えた。' } } },
  ...VIGNETTES.map(([id, ages, title, text, gate]) => ({ id, frame: 'quiet', quiet: true, ages, title, story: text, ...gate, art: 'onna.life', left: { title, odds: 6, win: { text } }, right: { title, odds: 6, win: { text } } })),
];

// 名前（M8 M9）。女は家の名の女の形で、姉妹は同じ名。生まれ順の呼び名で見分ける。子は夫の家の名を名乗る
const { male, female, full, daughterOrder } = roma.NAMING;
const NAMING = {
  ...roma.NAMING,
  nameOf(ctx, who, key) {
    const otherHouse = (tag) => { const others = ctx.surnames.filter((n) => n !== ctx.house); return others[ctx.hash(tag) % others.length]; };
    const husbandHouse = () => otherHouse(`spouse${ctx.spouseKey}`), husbandGiven = () => male[ctx.hash(`spousegiven${ctx.spouseKey}`) % male.length];
    if (who === 'self') return `${female(ctx.house)}${daughterOrder[ctx.siblings.filter((sib) => sib.rel === '姉').length] || ''}`;
    if (who === 'spouse') return full(male[ctx.hash(`spousegiven${key}`) % male.length], otherHouse(`spouse${key}`));
    if (who === 'son') { if (key === 1) return full(husbandGiven(), husbandHouse()); const pool = male.filter((n) => n !== husbandGiven()); return full(pool[ctx.hash(`son${key}`) % pool.length], husbandHouse()); }
    if (who === 'daughter') return `${female(husbandHouse())}${daughterOrder[key - 1] || ''}`;
    return roma.NAMING.nameOf(ctx, who, key);
  },
  birthLine(sex, order, name) {
    const given = name.split('・')[0];
    if (sex === 'son') return order === 1 ? `男の子で、九日目に夫と同じ${given}の名がついた。夫の家の子だ。` : `男の子で、九日目に${given}と名がついた。`;
    return `女の子で、八日目に${name}の名がついた。夫の家の名だ。`;
  },
};

const CHILDHOOD = [
  { year: -100, age: 0, title: '生まれた', story: 'イタリアの小さな農家に、女の子として生まれた。産婆が足もとに置くと、父が抱き上げた。育てる、ということだ。', cards: ['mother', 'house'], art: 'onna.event.birth' }, // 推測: 父が抱き上げる作法
  { year: -99, age: 1, title: '母の背', story: '母の背に負われて、麦畑の端まで揺られていく。母は草を取る。父の声より先に、母の息を覚えた。', cards: ['father', 'paddy', 'ie'], art: 'onna.event.back' },
  { year: -98, age: 2, title: '村の顔', story: '女たちが代わるがわる顔を見に来る。父は朝ごとに、パトロヌスの家へ挨拶に出かける。', cards: ['neighbors', 'cliens', 'nanushiHouse'], art: 'onna.event.neighbors' },
  { year: -97, age: 3, title: '妹が生まれた', story: '家に小さな声が増えた。母の腹が膨らんで、また平らになるのを、初めて見ていた。', cards: ['sister'], art: 'onna.event.sister' },
  { year: -96, age: 4, title: '炉の神々', story: '毎朝、母が炉の前の小さな神々に塩と麦粉を置く。隣の家とは、水の引き方でときどき揉める。', cards: ['gods', 'neighborhouse'], art: 'onna.event.lares' },
  { year: -95, age: 5, title: '遠い都の話', story: 'ローマの元老院では、偉い人たちが争っているという。女たちの話は、もっと近い。誰が死に、誰が産んだかの話だ。', cards: ['republic'], art: 'onna.event.far' },
  { year: -94, age: 6, title: '羊毛の匂い', story: '母の手の脂の匂いが、羊毛の匂いだと分かった。種まき、麦刈り、ブドウ摘み、そして毎晩の糸。', cards: ['spring'], art: 'onna.event.wool' },
];

// 家族の形（koko-made の控え）。枠は全舞台で共通、中身は舞台ごと。重みは仮置き
// 母をお産で失うこと、父を戦で失うことは M4 M5 の延長（推測）。拾われ子は M4 の周辺の記憶で確かめていない（推測）
const BIRTH = {
  ...roma.BIRTH,
  houses: roma.BIRTH.houses.map((house) => house.id === 'modest' ? { ...house, patch: { 1: { prepend: '屋根は瓦で、納屋には麦の蓄えがある。' } } } : house.id === 'poor' ? { ...house, patch: { 1: { prepend: '家の暮らしは苦しかった。町の金貸しに借りがあった。' } } } : house),
  forms: [
    { id: 'plain', weight: 6 },
    { id: 'fatherless', weight: 2, siblingModel: { youngerAges: [] }, patch: {
      1: { title: '父のいない家', story: '父の顔は知らない。軍から戻らなかったのだと、母が言う。麦畑の端で、母が一人で草を取る。', cards: ['paddy', 'ie'] },
      2: { story: '女たちが代わるがわる顔を見に来る。朝のパトロヌスへの挨拶には、母が叔父に頼んで行ってもらっている。' } } },
    { id: 'motherless', weight: 2, add: ['stepmother'], patch: {
      4: { story: '毎朝、継母が炉の前の小さな神々に塩と麦粉を置く。隣の家とは、水の引き方でときどき揉める。' },
      6: { story: '継母の手の脂の匂いが、羊毛の匂いだと分かった。種まき、麦刈り、ブドウ摘み、そして毎晩の糸。' },
      0: { story: 'イタリアの小さな農家に、女の子として生まれた。母はそのお産で死んだ。父が抱き上げて、しばらく動かなかった。', cards: ['house'] },
      1: { title: '継母', story: '父が後添いを迎えた。乳は隣の女にもらった。継母の手を、しばらく母の手だと思っていた。' } } },
    { id: 'orphan', weight: 1, siblingModel: { youngerAges: [] }, add: ['uncle'], patch: {
      4: { story: '毎朝、叔母が炉の前の小さな神々に塩と麦粉を置く。隣の家とは、水の引き方でときどき揉める。' },
      6: { story: '叔母の手の脂の匂いが、羊毛の匂いだと分かった。種まき、麦刈り、ブドウ摘み、そして毎晩の糸。' },
      0: { story: 'イタリアの小さな農家に、女の子として生まれた。母はそのお産で死んだ。', cards: ['house'] },
      1: { title: '叔父の家', story: '父も熱病で死んだ。叔父が麦畑ごと引き取った。嫁入りの銭は、畑から出ることになっている。', cards: ['paddy', 'ie'] },
      2: { story: '叔父は朝ごとに、パトロヌスの家へ挨拶に出かける。女たちが、あの子は痩せていると話している。' } } },
    { id: 'foundling', weight: 1, add: ['alumna'], patch: {
      0: { title: '拾われた', story: '市の外れに捨てられていたところを、子のない農家の女が拾って帰った。生まれた日を知る者はいない。' } } },
  ],
  siblingModel: { ...roma.BIRTH.siblingModel,
    plainEvent: { title: 'ひとりで歩く', story: '畑の端まで、ひとりで歩いて行けるようになった。誰かの背から降りた最初の年だ。', cards: [], art: 'onna.event.walk' } },
};

const TEXT = {
  ...roma.text,
  demandSources: { 'dm.spin': '奥方より', 'hist.spartacus': '軍の徴発', 'hist.civilwar': '徴募' },
  houseNames: { own: '{name}の生家', neighbor: '隣の{name}{layer}', branch: '{rel}の{name}分家', patron: 'パトロヌスの{name}{layer}' },
  spouseLabel: '夫（{name}）',
  // 男の札は自分の体を賭ける。女の札では、夫と息子の命が賭け金になる
  substitutes: { ...roma.text.substitutes, spouse: '夫が「俺が行く」と言った。', spouseDemand: '夫が', spouseChoice: '夫を送り出す', grownchild: '息子が「私が行きます」と言った。', grownchildDemand: '息子が', childChoice: '息子を送り出す', fatherDemand: '老いた父が', fatherChoice: '父を送り出す', servantChoice: '奴隷を出す', hireChoice: '銭で代わりの者を雇う', noneChoice: '出す男がいない', call: '軍', noOne: '出す男がいないと役人に言う', noOneResult: '出す男がいないと言うと、役人は納屋の麦を指さした。男を差し出さなかった家だと噂が立った。', hireResult: '銭で代わりの者を雇って出した。', result: '{name}は{outcome}', ignoreResult: '{name}が軍へ出た。{outcome}', returned: '無事に戻った。', lost: '戻らなかった。' },
  kinArrive: '{rel}の{name}が顔を見せに来た。',
  grandchildBorn: '息子の嫁に子が生まれた。孫だ。自分が取り上げた。',
  introduce: { mother: '母の名は{name}。', father: '父は{name}。', sister: '妹も{name}と呼ばれる。', sisters: '妹も{name}と呼ばれる。この家の娘はみな同じ名で、大きい{name}、小さい{name}と呼び分ける。', 兄: '兄は{name}。' },
  namedTitle: '{name}、生まれる',
  namedAfterFather: '',
  named: '八日目に、{name}と名づけられた。父の家の名の、女の形だ。',
  inheritance: '嫁入りの支度にと、家の蓄え {n} が取り分けられた。',
  inheritanceNone: '一人前の女として扱われるようになった。',
  visitPublicWin: '連れ立って歩き、村じゅうの女の口にのぼった。',
  visitPublicLose: '人目に付き、噂になった。',
  heirChoice: '跡を継がせる',
  heirChosen: '長子を跡取りと決めさせた。',
  childRel: '夫の家の子',
  conceivedFirst: '身ごもった。初めてのお産になる。姑が腹を見て、来年だと言った。',
  conceivedHard: '身ごもった。腹の張りがいつもと違う。産婆が来年の話をするとき、目をそらした。',
  birthLost: 'お産は重く、子は育たなかった。名をつける前だった。',
  infantLost: '{name}が熱を出して、三日で逝った。村の外れに小さな墓を掘った。',
  medicineSide: { head: '薬売り', lead: '旅の薬売りが、親の病に効く薬を持っている。' },
  familyShift: { ...roma.text.familyShift, birth: ['子はまだ授からない。', '子を授かる兆しがある。'] },
  lifeRoles: { ...roma.text.lifeRoles, general: 'イタリアの農家の女' },
  // 一生の呼び名は、持っているものの早い順に決まる
  lifeRoleOf: [['sacerdos', '町の女神官'], ['statue', '像の立った女'], ['midwife', '村の産婆'], ['vilica', '大農場の女管理人'], ['moneybook', '貸し金の女'], ['shop', '町の織物の店の女主人'], ['praefica', '葬列の泣き女'], ['portrait', '女の絵師'], ['drover', '移牧の女'], ['univira', '一人の夫に添った女'], ['widow', '農家の寡婦'], ['stall', '市の女']],
  lifeTitles: { status: '名の通った', money: '財を成した', love: '恋に生きた', slow: '家を守り抜いた', strength: '誰にも屈しなかった', art: '声と手を残した', loveless: '恋に縁のなかった', celebratedLove: '浮名を流した', plain: '名もなき', kantoPrefix: '' },
  houseEnding: { heading: '生家の格：', inherited: '炉の鍵を息子の嫁に渡した', divided: '子らに畑を分けた', rival: 'と争った', defended: 'と争った', ended: '炉の鍵を持ったまま逝った', heir: '夫の家の跡取り', yes: 'あり', no: 'なし' },
};

const AXES = {
  status: { ...roma.AXES.status, here: '女たちの中で重んじられる（町の女神官）', ladder: ['村の女たちの顔', '町の女神官', '都の婦人たちの声', '像に残る名'] },
  money: { ...roma.AXES.money, here: '自分の手で財を成す（機と店と貸し金）', ladder: ['機と鶏の銭', '町の店', '農場と貸し金', '語り草の女富豪'] },
  love: { ...roma.AXES.love, here: '恋に生きる', ladder: ['村の恋', '町の浮名', '都の浮名', '墓石と詩に残る恋'] },
  slow: { ...roma.AXES.slow, here: '家を守り、子を育てる', ladder: ['自分の炉', '子の代', '孫の代', '語り継がれる母'] },
  strength: { ...roma.AXES.strength, here: '誰にも屈しない（腕と胆力で生き抜く）', ladder: ['村の力持ち', '移牧の女', '略奪者から家を守る女', '語り草の女丈夫'] },
  art: { ...roma.AXES.art, here: '声と手で残す（泣き女・絵師・詩人）', ladder: ['村の挽歌', '町の泣き女と図柄', '都の絵師', '書き写されて後世へ'] },
};

const GLOSSARY = {
  ...roma.glossary,
  'ボナ・デア': '女だけで祀る女神。12 月に上層の家で夜の祭りがあり、男は入れない。',
  'マトロナリア': '3 月 1 日、お産の女神ユノ・ルキナの祭り。夫が妻に贈り物をする。',
  'ユノ・ルキナ': 'お産を見守る女神。',
  'ウニウィラ': '一人の夫にだけ添った女。墓碑で讃えられた。',
  'ウィリカ': '農場の女管理人。鶏、保存食、ワインと油、人手の食事を預かる。',
  'プラエフィカ': '雇われて葬列の先頭で挽歌を歌う女。役は大きいが、身分は低い。',
  'ホルテンシア': '前 42 年、裕福な女への課税に広場で反対した女。翌日、課税は減った。',
  'コルネリア': 'グラックス兄弟の母。十二人産み、三人が育った。死後に像が立った。',
  'フルウィア': '前 41 年、軍を動かした女。包囲戦で敵の投石の弾に名を刻まれた。',
  'ブサ': 'カンナエの敗兵に麦と衣を配り、元老院に讃えられた女。',
  'パトロヌス': '有力者。クリエンテスを守り、口をきいてやる代わりに、奉仕を求める。',
};

// 文の前提と盤面の照合（cast-check.mjs）
const KIDS = ['child', 'toddler', 'helper', 'grownchild', 'heir'];
const castRules = [
  { name: '夫', re: /(?<![農工])夫/, needs: [...HUSBANDS, 'widow'] },
  { name: '姑', re: /姑/, needs: [...HUSBANDS, 'widow'] },
  { name: '母', re: /(?<![乳祖継叔伯])母(?![親神])/, needs: ['mother'] },
  { name: '父', re: /(?<![祖叔伯])父(?!の墓)/, needs: ['father', 'oldfather'] },
  { name: '亡き父', re: /亡き父|父の墓/, lacks: ['father', 'oldfather'] },
  { name: '自分の子', re: /子を預け|子らを連れ|子らの声|息子|我が子|(?<![いの村女]|もう|小さ)子ら/, needs: KIDS },
  { name: '娘', re: /(?<!の)娘/, needs: KIDS },
  { name: '孫', re: /孫/, needs: ['grownchild', 'heir'] },
  { name: '恋', re: /恋|想い人|夫婦/, minAge: 15 },
  { name: '死後', re: /二千年|千年|後の世|後世/, never: true },
];
// 本人の家族の話ではないもの
const castOk = {
  'hist.sulla': ['夫'], // 奥方の夫
  'hist.actium': ['自分の子'], // 村の女たちの息子
  'life.munus': ['父', '亡き父'], // 有力者の父
  'life.dolls': ['娘'], // 世間の習わし
  'life.matronalia': ['夫'], // 世間の習わし
  'life.nurse': ['自分の子'], // 乳母の育てた子ら
  'dm.spin': ['娘'], // 奥方の娘
  'fam.father': ['娘'], // 女の相続の決まり
  'lo.divorce': ['父'], // 父が死んでも縁者はいる
  'sl.jewels': ['母', '自分の子'], // 都の母（コルネリア）の話
  'ar.iaia': ['娘'], // 貴人の娘
  'ar.self': ['娘'], // 村の娘
  'build.gate': ['娘'], // 村の娘
  'sl.keys': ['姑'], // 札を引いたあとに夫を失った年（まれ）
  'f.soldier': ['自分の子'], // 戸口の小さい子らは弟妹や他家の子でもよい
  '生い立ち0歳': ['父', '母'], // 札が来るより前の場面。お産で死ぬ母も語る
  '生い立ち1歳': ['父', '母'], // 継母が来る年、父を知らない年
};

export default composeLife(roma, {
  id: 'roma-onna', name: 'ローマの農家の女', sex: 'female',
  // 男の札の言葉がこの一生に混ざらないようにする。検査は ladder-check の lifeWordCheck
  forbid: ['妻を迎え', '妻が身ご', 'トガ', '軍団に加わる', '百人隊長', 'ケントゥリオ', '元老院議員', '執政官', '正妻', '家長の権', '妾', '側室', '嫁を取る側'],
  keepItems, items, cards, castRules, castOk,
  keepCards: ['dis.famine', 'dis.fever', 'dis.plague', 'dis.wound', 'vi.sack', 'vi.robbery', 'life.nundinae', 'life.saturnalia', 'life.lares', 'life.puls', 'life.vestalia', 'life.lupercalia', 'life.floralia', 'life.road', 'life.munus', 'life.census', 'life.vintage', 'life.parentalia'],
  cardRoles: { 'lo.meet': 'partnerMeet', 'lo.visit': 'partnerVisit', 'lo.marry': 'partnerMarriage', 'lo.arranged': 'arrangedMarriage', 'lo.divorce': 'divorce', 'lo.child': 'birth', 'ob.first': 'childbedFirst', 'ob.hard': 'childbedHard', 'ch.seven': 'childSeven', 'ch.fifteen': 'childFifteen', 'fam.father': 'fatherDeath', 'fam.mother': 'motherDeath', 'fam.sister': 'sisterMarriage', 'ie.succession': 'succession', 'ie.retire': 'retirement', 'rec.medicine': 'medicine', 'hist.spartacus': 'battle', 'hist.civilwar': 'battle' },
  familyAges: { 'lo.arranged': [18, 21], 'ob.first': [16, 50], 'ob.hard': [16, 50], 'lo.child': [16, 42] },
  settings: {
    firstMarriageAges: [18, 22], // M1 と、未成年の恋と妊娠の場面を書かない判断（Claude）
    marriageUntil: 55,
    claimGap: -1, // 生家の跡目は争わない。娘の相続は父の死の札で賭ける（M10）
    substituteOrder: ['grownchild', 'spouse', 'father', 'servant'],
    widowItem: 'widow',
    childbed: { first: 'ob.first', hard: 'ob.hard', omenChance: 0.3 }, // M5 率は未確認。一生の山場として遊べる回数で置いた（Claude）
    birthSurvive: 0.8, // M4 の 1 年目の死の一部をお産のときに、残りを infantLoss で出す
    birthGap: [2, 4],
    infantLoss: { items: ['child', 'toddler'], chance: 0.05, keep: 'smallgrave' }, // M4 幼子の間の 7 年で 3 割ほど
    growUp: { child: { age: 3, to: 'toddler' }, toddler: { age: 4, to: 'helper' }, helper: { age: 8, to: 'grownchild' } },
    yearlyDrainFloor: 3,
    bodyGuard: true,
    // 戦の死は男の札では自分に来るが、女の札では夫と息子に来る。外から来る死を男の舞台より少し減らす（Claude の判断）
    dangerEras: [{ from: -91, to: -31, chance: 0.22 }, { from: -30, to: 100, chance: 0.12 }],
  },
  OPTION_RULES: {
    childbed: '女の一生の山場。初産と難産の前ぶれだけを札にし、残りは年の締めに流す',
    childcare: '子が増えるほど道の札に賭ける余力が減る。近代以前の女の一生の多くを占めた',
    infantLoss: '乳児の死は当時ふつうのこと（M4）。選ばずに起きるので札にしない',
    widow: '夫婦の歳の差から寡婦は珍しくない（M3）。寡婦は女が財を動かせる立場でもある（M24）',
    familyForms: '女の一生では、父や母の不在が嫁ぎ先の賭けを変える',
  },
  // 男の一生の仕組みが読む役のうち、この一生に無いもの。仕組みは舞台に無い役を年表から落とす
  WIRING_SKIP: {
    '品 rank': '女は軍の身分を持たない。格は品の段で数える',
    '品の役 rank': '同上',
    '品の役 merit': '軍功の品は無い',
    '品 mistress': '養う側の役で、この一生には無い',
    '品の役 concubine': '同上',
    '品の役 mistress': '同上',
  },
  AXES, BIRTH, CHILDHOOD, NAMING, partnerIds: LOVERS, glossary: GLOSSARY, text: TEXT,
  disasterTargets: { fire: ['house', 'hhouse', 'shop'], flood: ['paddy', 'newfield', 'hfield'], famine: ['paddy', 'newfield', 'hfield'] },
  display: { ...roma.display, title: 'ローマの春 — 女の一生', heading: ['イタリア', 'の農家の女'], short: 'ローマ（女）' },
  ABILITY_EFFECTS: {
    hygiene: ['dis.fever', 'dis.plague', 'dis.wound', 'rec.medicine', 'rec.medicine:left', 'ob.first:right', 'ob.hard:right', 'mo.midwife:left', 'c.midwife:left'],
    soil: ['dis.famine', 'mo.preserve:left', 'build.press:left'],
    body: ['sr.harvest', 'sr.drover', 'f.road', 'f.soldier', 'sr.defend', 'sr.sling', 'c.goat', 'hist.socialwar:left', 'hist.landgrant:left'],
    foresight: ['hist.socialwar:left', 'hist.sulla:left', 'hist.spartacus:left', 'hist.civilwar:left', 'hist.idus:left', 'hist.hortensia:left', 'hist.landgrant:left', 'hist.actium:left'],
    numbers: ['mo.stall', 'mo.weave', 'mo.lend', 'mo.vilica', 'wd.trade', 'wd.land:left'],
    organizing: ['sl.keys', 'st.women', 'st.festival', 'mo.vilica', 'sr.defend:left'],
    expression: ['c.letters', 'c.song', 'ar.lament', 'ar.praefica', 'ar.pattern', 'ar.iaia', 'ar.salon', 'ar.copied', 'ar.self', 'lo.poem', 'hist.hortensia:left'],
    outdoors: ['c.goat', 'sr.drover', 'wd.trade:right'],
    animals: ['c.goat', 'mo.preserve:left', 'sr.drover'],
  },
});
