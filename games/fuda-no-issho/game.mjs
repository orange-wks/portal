import { DEFAULT_STAGE, stageFor } from './stages/index.mjs';
import { ABILITIES, topAbilities } from './abilities.mjs';

export const MARKS = { status: '♛', money: '◉', love: '♥', slow: '❦', strength: '✊', art: '♪', faith: '✟' };
const getStage = (state) => state.stageData;
const fieldIdFor = (state, role) => {
  const primary = Object.keys(getStage(state).FIELD).find((id) => getStage(state).FIELD[id].role === role && getStage(state).FIELD[id].primary);
  return primary ? state.field.includes(primary) ? primary : undefined : state.field.find((id) => getStage(state).FIELD[id].role === role) || Object.keys(getStage(state).FIELD).find((id) => getStage(state).FIELD[id].role === role);
};
const hasPrimaryField = (state) => !!fieldIdFor(state, 'field');
const fieldIdsFor = (state, role) => state.field.filter((id) => getStage(state).FIELD[id].role === role);
const hasRole = (state, role) => state.field.some((id) => getStage(state).FIELD[id].role === role);
const fill = (template, values) => Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);
const AXIS_IDS = (state) => Object.keys(getStage(state).AXES);
const cardById = (state, id) => getStage(state).cardById.get(id);
const idFor = (state, role) => getStage(state).CARD_IDS[role];
const cardRole = (state, id) => cardById(state, id)?.role;
const DEFAULT_SUBSTITUTES = ['grownchild', 'father', 'servant'];
const rand = (state) => {
  let x = state.rng >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.rng = x >>> 0;
  return state.rng / 0x100000000;
};
const pick = (state, list) => list[Math.floor(rand(state) * list.length)];
const markAt = (state, id, index, axis) => ((fieldAt(state, index).marks || getStage(state).FIELD[id].marks)[axis] || 0) + (axis === 'love' && getStage(state).FIELD[id].role === 'lover' ? (state.partnerHearts[id] || 1) - 1 : 0);
// 生まれ持ったもの（innateMarks、誓いの時点で場にあった札の点）は一生の点に数えず、そこからの増分だけを数える
// 品の届く範囲（家と村・町・都…）。段ごとに持つ品は段の範囲を優先する。舞台の設定 scopeWeight があれば、範囲が 1 つ上がるごとに点をその倍にする（デノミ）
export const scopeAt = (state, index) => fieldAt(state, index).scope ?? getStage(state).FIELD[state.field[index]].scope ?? 1;
// 梯子の段（rung）。上の段の札の条件・勝つ目の上限・一生の挑戦の数に使う。点の重みには使わない。書いていない品は範囲と同じ段
// （スローライフのように代を重ねる梯子では、段が上がっても届く範囲は変わらない。2026-11-03 orange「孫の代なので 9 倍は明らかにおかしい」）
const rungOf = (field) => field?.rung ?? field?.scope ?? 1;
export const rungAt = (state, index) => { const level = fieldAt(state, index); return level.rung ?? level.scope ?? rungOf(getStage(state).FIELD[state.field[index]]); };
const scopeFactor = (state, index) => (getStage(state).settings.scopeWeight || 1) ** (scopeAt(state, index) - 1);
// 仕組みが年の締めに自分で置いた家族の品（生まれた子・育った子・孫、state.autoKeys）と、能力の品（ability: true）は点に数えない。段・実り・守りには効く
// （ローマで決めた「誰にでも来るものは選んだ側にだけ点」「能力と実績を分ける」を、舞台のデータでなく仕組みの決まりにした。2026-11-04 orange「その案で進めて」）
// 舞台の設定 stackOnce があれば、同じ品は 1 枚ぶんだけ数える（stacks の品は重ねて数える）
const totalMarks = (state) => Object.fromEntries(AXIS_IDS(state).map((axis) => { const seen = new Set(); return [axis, state.field.reduce((sum, id, index) => {
  if (state.autoKeys?.[state.fieldKeys[index]] || getStage(state).FIELD[id].ability) return sum;
  const value = (markAt(state, id, index, axis) - (state.innateMarks?.[state.fieldKeys[index]]?.[axis] || 0)) * scopeFactor(state, index);
  if (!value || !getStage(state).settings.stackOnce || getStage(state).FIELD[id].stacks) return sum + value;
  if (seen.has(id)) return sum; seen.add(id); return sum + value;
}, 0)]; }));
// 身分の段と軍功の札から昇進を読む。
const rankLevel = (state) => { const index = state.field.findIndex((id) => getStage(state).FIELD[id].role === 'rank'); return index >= 0 ? state.fieldLevels[index] : 0; };
const has = (state, id) => {
  if (id === 'lover') return hasRole(state, 'lover');
  if (id === 'spouse') return hasRole(state, 'spouse') || hasRole(state, 'concubine');
  const rank = getStage(state).settings.rankAliases?.[id];
  if (rank) return rankLevel(state) >= rank;
  const role = getStage(state).settings.roleAliases?.[id];
  return role ? hasRole(state, role) : state.field.includes(id);
};
const contains = (state, target) => target.startsWith('kind:') ? state.field.some((id) => getStage(state).FIELD[id].kind === target.slice(5)) : target.startsWith('role:') ? state.field.some((id) => getStage(state).FIELD[id].role === target.slice(5)) : has(state, target);
const targetIndex = (state, target) => target.startsWith('kind:')
  ? state.field.findLastIndex((id) => getStage(state).FIELD[id].kind === target.slice(5))
  : state.field.lastIndexOf(target);
const add = (state, ids = []) => {
  state.field.push(...ids); state.fieldYears.push(...ids.map(() => state.year)); state.fieldLevels.push(...ids.map(() => 1)); state.fieldKeys.push(...ids.map(() => state.nextFieldKey++));
  for (const id of ids) if (id === 'wound') changeBodyMax(state, -2, '古傷が残った。体の器 −2');
};
// 生まれのくじがある舞台は、一生ごとの幼い日の並びを持つ
export const childhoodOf = (state) => state.childhood || getStage(state).CHILDHOOD;
// 縁者は生まれた時に全部置かず、幼い日の年に 1 人ずつ顔を見せる（staggeredReveal の舞台だけ）
function revealKin(state, stageData, pendingKin) {
  if (!state.childhood) state.childhood = stageData.CHILDHOOD.map((event) => ({ ...event }));
  const sibling = state.childhood.find((event) => event.kin)?.kin;
  const kins = pendingKin.filter((kin) => kin.rel !== sibling);
  const slots = state.childhood.filter((event) => event.age >= 1 && !event.kin && !event.kins && (event.cards || []).length < 3);
  kins.forEach((kin, i) => {
    const event = slots[i % slots.length];
    event.kins = [...(event.kins || []), kin];
    event.story = `${event.story}${fill(stageData.text.kinArrive, { rel: kin.rel, name: personName(state, kin.rel, { slot: kin.slot }) })}`;
  });
}
// きょうだいを人数で引く舞台（siblingModel）。場には「きょうだい」の札 1 枚と、跡目に関わる兄・ゆかりの妹だけを置く
function drawSiblings(state, stageData, house, rnd) {
  const model = { ...stageData.BIRTH.siblingModel, ...house.siblingModel }, total = model.born.reduce((sum, w) => sum + w, 0);
  let n = rnd() * total, drawn = 0; while ((n -= model.born[drawn]) >= 0) drawn++;
  let list = Array.from({ length: drawn }, () => ({ elder: rnd() < model.elderShare, male: rnd() < 0.5, dies: rnd() < model.deathRate }));
  // 年下は 0〜6 歳のあいだに 2 年おきくらいでしか生まれない。入りきらない分は引かない（7 歳より後の誕生はまだ扱わない）
  const youngerAges = model.youngerAges || [2, 4, 6];
  list = [...list.filter((sib) => sib.elder), ...list.filter((sib) => !sib.elder).slice(0, youngerAges.length)];
  let y = 0;
  list.forEach((sib, slot) => {
    sib.slot = slot;
    sib.rel = sib.elder ? (sib.male ? '兄' : '姉') : (sib.male ? '弟' : '妹');
    sib.bornAge = sib.elder ? model.elderAge ?? 0 : youngerAges[y++];
    const span = 6 - sib.bornAge;
    sib.deathAge = sib.dies && span > 0 ? sib.bornAge + 1 + Math.floor(rnd() * span) : null;
    if (sib.dies && !sib.deathAge) sib.dies = false;
  });
  const heirBrother = list.find((sib) => sib.rel === '兄' && !sib.dies), closeSister = list.find((sib) => sib.rel === '妹' && !sib.dies);
  state.siblings = { born: 0, lost: 0, list };
  state.birth = { house: house.id, siblings: `${list.length}`, houseLevel: house.houseLevel || 1, houseStore: house.houseStore || 0, add: house.add || [] };
  const word = (k) => ['', 'ひとり', 'ふたり', '三人', '四人', '五人', '六人', '七人', '八人'][k] || `${k}人`;
  const bornCount = list.filter((sib) => !sib.elder).length, lostCount = list.filter((sib) => sib.dies).length;
  if (model.recallLines && (bornCount || lostCount)) state.siblings.recall = fill(model.recallLines[bornCount && lostCount ? 'both' : bornCount ? 'born' : 'lost'], { born: word(bornCount), lost: word(lostCount) });
  state.childhood = stageData.CHILDHOOD.map((event) => { const { prepend = '', ...patch } = house.patch?.[event.age] || {}; const merged = { ...event, ...patch, ...(event.age === model.replaceAge ? model.plainEvent : {}) }; return { ...merged, story: `${prepend}${merged.story}` }; });
  const elder = list.filter((sib) => sib.elder);
  if (elder.length) {
    const at = state.childhood.findIndex((event) => event.age === (model.elderAge ?? 0)), first = state.childhood[at], count = (rel) => elder.filter((sib) => sib.rel === rel).length;
    const parts = ['兄', '姉'].filter((rel) => count(rel)).map((rel) => `${rel}が${count(rel)}人`);
    state.childhood[at] = { ...first, story: `${first.story}${fill(model.elderStory, { list: parts.join('、') })}`, cards: [...first.cards, ...(list.some((sib) => !sib.elder && sib.bornAge < (model.elderAge ?? 0)) ? [] : ['siblings'])], kins: heirBrother ? [{ rel: '兄', claim: stageData.settings.claims['兄'], support: 1, slot: heirBrother.slot }] : [], siblingBirths: elder.length };
  }
  for (const event of state.childhood) {
    const born = list.filter((sib) => !sib.elder && sib.bornAge === event.age), dead = list.filter((sib) => sib.dies && sib.deathAge === event.age);
    // 生き死には一人ずつ見出しにしない。その年に書くのは場に札が出る妹の誕生だけで、ほかは 6 歳で記憶が戻るときにまとめる
    const lines = born.filter((sib) => sib === closeSister).map((sib) => model.birthLines[sib.rel]);
    if (!born.length && !dead.length) continue;
    const firstShown = born.length && !list.some((sib) => sib.bornAge < event.age);
    if (lines.length) event.story = `${lines.join('')}${event.story}`;
    event.cards = [...(event.cards || []), ...(firstShown ? ['siblings'] : []), ...(born.includes(closeSister) ? ['sister'] : [])];
    event.siblingBirths = (event.siblingBirths || 0) + born.length; event.siblingDeaths = dead.length;
  }
  if (!list.length) state.childhood[0] = { ...state.childhood[0], story: `${state.childhood[0].story}${model.only}` };
}
// 家族の形は家の格の上に重ねる。同じ年の差し替えは家族の形が勝ち、前置きの文はつなぐ
function mergeForm(house, form) {
  const patch = { ...house.patch };
  for (const [age, change] of Object.entries(form.patch || {})) patch[age] = { ...patch[age], ...change, prepend: `${patch[age]?.prepend || ''}${change.prepend || ''}` };
  return { ...house, patch, add: [...(house.add || []), ...(form.add || [])], siblingModel: form.siblingModel };
}
function drawBirth(state, stageData) {
  if (!stageData.BIRTH) return;
  let x = state.seed ^ 0x2545f491;
  const roll = (list) => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; const total = list.reduce((sum, item) => sum + (item.weight || 1), 0); let n = (x >>> 0) % total; return list.find((item) => (n -= item.weight || 1) < 0); };
  const drawn = roll(stageData.BIRTH.houses), form = stageData.BIRTH.forms ? roll(stageData.BIRTH.forms) : null;
  const house = form ? mergeForm(drawn, form) : drawn;
  if (form) state.birthForm = form.id;
  if (stageData.BIRTH.siblingModel) { drawSiblings(state, stageData, house, () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }); return; }
  const siblings = roll(stageData.BIRTH.siblings);
  state.birth = { house: house.id, siblings: siblings.id, houseLevel: house.houseLevel || 1, houseStore: house.houseStore || 0, add: house.add || [] };
  state.childhood = stageData.CHILDHOOD.map((event) => ({ ...event, ...(house.patch?.[event.age] || {}), ...(siblings.patch?.[event.age] || {}) }));
  const death = stageData.BIRTH.siblingDeath, who = { sister: '妹', younger: '弟', elder: '兄', twoElder: '兄' }[siblings.id];
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  if (death && who && (x >>> 0) % 1000 < death.rate * 1000) {
    const event = state.childhood.find((item) => item.age === death.age);
    if (event) { event.story = `${death.lines[who]}${event.story}`; event.loseSibling = who; state.birth.siblingDied = who; }
  }
}
function remove(state, ids = []) {
  for (const id of ids) { const index = state.field.indexOf(id); if (index >= 0) removeAt(state, index); }
}
function changeBodyMax(state, amount, text) {
  if (!getStage(state).settings.bodyCeiling || !amount) return;
  state.bodyMax += amount;
  state.body = Math.min(state.body, state.bodyMax);
  state.bodyMaxEvents.push(`${text}（上限 ${state.bodyMax}）`);
}
function removeAt(state, index) {
  const [id] = state.field.splice(index, 1); state.fieldYears.splice(index, 1); state.fieldLevels.splice(index, 1); state.fieldKeys.splice(index, 1);
  if (id === 'wound') changeBodyMax(state, 2, '古傷が癒えた。体の器 +2');
  return id;
}
// 想い人と添った連れ合いは、誰と添ったかを札の名に残す。
// 人の名前は、くじの種と札の鍵から決める（ゲームのくじは消費しない）
function nameHash(state, tag) { let h = (state.seed ^ 0x9e3779b9) >>> 0; for (const ch of tag) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; h = (h ^ (h >>> 16)) >>> 0; h = Math.imul(h, 0x45d9f3b) >>> 0; return (h ^ (h >>> 16)) >>> 0; }
// 名前の決め方（部品・組み立て方・継ぎ方）は舞台が持つ。仕組みは「この人の名前は」と聞くだけ
// 名の言い方がわからないときの控え: 父の子のうち何番目の男・女か（自分を含めて数える）
export function birthOrderLabels(state) {
  const list = state.siblings?.list || [], order = [...list.filter((sib) => sib.elder), { self: true, male: getStage(state).life?.sex !== 'female' }, ...list.filter((sib) => !sib.elder).sort((a, b) => a.bornAge - b.bornAge)];
  const counts = { male: 0, female: 0 }, labels = new Map();
  for (const sib of order) { const sex = sib.male ? 'male' : 'female', n = ++counts[sex]; labels.set(sib, `${n === 1 ? '長' : n === 2 ? '二' : ['三', '四', '五', '六', '七', '八', '九', '十'][n - 3] || n}${sib.male ? '男' : '女'}`); }
  return list.map((sib) => labels.get(sib));
}
// 今年の札が使う・守る・争う場の札（どの区分を開いていても前に出す）
export function fieldTouches(state, card = currentCard(state)) {
  if (!card) return [];
  const stage = getStage(state), touched = new Set();
  for (const bet of [card.left, card.right].filter(Boolean)) {
    const stake = stakeInfo(state, bet);
    if (stake.index >= 0) touched.add(stake.index);
    if (stake.what === 'substitute') { const role = substituteFor(state); state.field.forEach((id, i) => { if (stage.FIELD[id].role === role) touched.add(i); }); }
  }
  const key = card.disaster ? card.disasterKey : card.id;
  state.field.forEach((id, i) => { if ((stage.FIELD[id].guard || []).includes(key) || (fieldAt(state, i).guard || []).includes(key)) touched.add(i); });
  if (card.role === 'maintenance') touched.add(state.fieldKeys.indexOf(card.targetKey));
  if (card.contest) { const role = card.contest === 'patron' ? 'patronHouse' : 'rivalHouse'; state.field.forEach((id, i) => { if (stage.FIELD[id].role === role) touched.add(i); }); }
  const past = Object.entries(stage.ABILITY_EFFECTS || {}).some(([ability, cards]) => state.abilities[ability] > 0 && cards.some((entry) => entry === card.id || entry.startsWith(`${card.id}:`)));
  if (past && state.pastId) touched.add(state.field.indexOf(state.pastId));
  touched.delete(-1);
  return [...touched].sort((a, b) => a - b);
}
export function personName(state, who, key = '') {
  const naming = getStage(state).NAMING; if (!naming) return '';
  return naming.nameOf({
    hash: (tag) => nameHash(state, tag), spouseKey: state.fieldKeys[state.field.findLastIndex((id) => getStage(state).FIELD[id]?.role === 'spouse')], house: state.houseName, surnames: getStage(state).SURNAMES, siblings: state.siblings?.list || [],
    kinSlot: (k) => k?.slot ?? state.kinship[k]?.slot ?? Math.max(0, Object.keys(state.kinship).indexOf(String(k))),
  }, who, key);
}
const named = (base, name) => name ? `${base}：${name}` : base;
// 同じ名の人が場に並んだら、後から来た人に「もう一人の」と添えて見分ける
export function fieldLabel(state, index) {
  const label = rawFieldLabel(state, index);
  if (!getStage(state).NAMING || !label.includes('：')) return label;
  const head = (text) => { const [rel, name = ''] = text.split('：'); return `${rel.replace(/（[^）]*）/g, '')}：${name.replace(/（.*$/, '')}`; };
  const same = state.field.slice(0, index).filter((_, i) => head(rawFieldLabel(state, i)) === head(label)).length;
  return same ? label.replace('：', `：${same === 1 ? 'もう一人の' : `${['', '', '三', '四', '五'][same] || same + 1}人目の`}`) : label;
}
function rawFieldLabel(state, index) {
  const id = state.field[index];
  if (getStage(state).NAMING && ['father', 'mother', 'sister'].includes(getStage(state).FIELD[id]?.role || id)) return named(fieldAt(state, index).name, personName(state, getStage(state).FIELD[id]?.role || id));
  if (id === state.pastId && state.pastName) return state.pastName;
  if (getStage(state).FIELD[id].role === 'siblings' && state.siblings) { const alive = state.siblings.born - state.siblings.lost; return `きょうだい（${alive}人${state.siblings.lost ? `、${state.siblings.lost}人は幼くして亡くした` : ''}）`; }
  if (getStage(state).FIELD[id].role === 'house') return `${fill(getStage(state).text.houseNames.own, { name: state.houseName, layer: getStage(state).LAYERS.village.name })}（${getStage(state).LAYERS.village.ranks[state.fieldLevels[index] - 1]}）`;
  if (getStage(state).FIELD[id].role === 'rivalHouse') return `${state.rivalHouse ? fill(getStage(state).text.houseNames.branch, { rel: state.rivalRel || '縁者', name: state.houseName }) : fill(getStage(state).text.houseNames.neighbor, { name: state.neighborName, layer: getStage(state).LAYERS.village.name })}（力${state.fieldLevels[index]}）`;
  if (id === 'kinsman') return `${named(state.kinship[state.fieldKeys[index]]?.rel || getStage(state).FIELD[id].name, personName(state, state.kinship[state.fieldKeys[index]]?.rel, state.fieldKeys[index]))}（筋${state.kinship[state.fieldKeys[index]]?.claim}・後ろ盾${state.kinship[state.fieldKeys[index]]?.support}）`;
  if ((['child', 'grownchild', 'heir'].includes(id) || getStage(state).FIELD[id].childLike) && state.children[state.fieldKeys[index]]) { const child = state.children[state.fieldKeys[index]]; return named(`${child.rel}（${getStage(state).FIELD[id].name}）`, child.name); }
  if (id === 'heir' && state.children[state.heirKey]?.name) { const child = state.children[state.heirKey]; return named(`${child.rel}（${getStage(state).FIELD[id].name}）`, child.name); }
  if (getStage(state).FIELD[id].role === 'patronHouse') return `${fill(getStage(state).text.houseNames.patron, { name: state.patronName, layer: getStage(state).LAYERS.village.name })}（力${state.fieldLevels[index]}）`;
  const label = getStage(state).FIELD[id].partnerName && state.spouseOf ? fill(getStage(state).text.spouseLabel, { name: getStage(state).FIELD[state.spouseOf].name }) : fieldAt(state, index).name;
  return getStage(state).NAMING && ['spouse', 'concubine', 'lover'].includes(getStage(state).FIELD[id].role) ? named(label, personName(state, 'spouse', state.fieldKeys[index])) : label;
}
export function fieldAt(state, index) { const field = getStage(state).FIELD[state.field[index]]; return field.levels?.[state.fieldLevels[index] - 1] || field; }
export function houseMight(state) {
  const tune = getStage(state).settings.houseMight, own = state.field.findIndex((id) => getStage(state).FIELD[id].role === 'house');
  return (own < 0 ? 0 : tune.rank[state.fieldLevels[own] - 1])
    + state.field.reduce((sum, id, index) => sum + (getStage(state).FIELD[id].role === 'field' ? tune.field + (state.fieldLevels[index] - 1) * tune.fieldLevel : 0), 0)
    + state.field.filter((id) => ['grownchild', 'servant'].includes(getStage(state).FIELD[id].role)).length * tune.worker
    + (hasRole(state, 'villageTrust') ? tune.trust : 0);
}
function successionSupport(state) { return houseMight(state) + (hasRole(state, 'spouse') ? 1 : 0); }
function stepLevel(state, id, amount) {
  const index = getStage(state).FIELD[id]?.role ? state.field.lastIndexOf(id) : id === 'field' ? state.field.indexOf(fieldIdFor(state, id)) : state.field.findLastIndex((item) => getStage(state).FIELD[item].role === id);
  if (index >= 0) state.fieldLevels[index] = Math.max(1, Math.min(3, state.fieldLevels[index] + amount));
}
function applyHouseEffect(state, effect) {
  if (effect.levelDown) stepLevel(state, effect.levelDown, -1);
  if (effect.houseDown) stepLevel(state, 'house', -1);
  if (effect.rivalDown) { const index = getStage(state).FIELD[effect.rivalDown]?.role ? state.field.lastIndexOf(effect.rivalDown) : state.field.findLastIndex((id) => getStage(state).FIELD[id].role === effect.rivalDown); if (index >= 0) state.fieldLevels[index] = Math.max(0, state.fieldLevels[index] - 1); }
  if (effect.branchOpponent) { state.rivalHouse = true; state.rivalRel = effect.rel; const index = state.field.findIndex((id) => getStage(state).FIELD[id].role === 'rivalHouse'); if (index >= 0) state.fieldLevels[index] = Math.max(1, Math.min(3, effect.support)); }
  if (effect.retire) { state.retired = true; state.succession = effect.retire; if (effect.retire !== 'rival') { const rival = successionCandidate(state, ['child']); if (rival) { const event = { id: idFor(state, 'succession'), year: state.year + 1, key: rival.key, side: 'retired' }; state.familyTimeline.push(event); setNext(state, successionCard(state, cardById(state, event.id), event)); } } }
}
function promoteHouse(state) {
  const index = state.field.findIndex((id) => getStage(state).FIELD[id].role === 'house');
  if (hasRole(state, 'villageHead') && hasRole(state, 'waterwise')) state.fieldLevels[index] = 3;
  else if (hasRole(state, 'villageHead') || hasRole(state, 'waterwise')) state.fieldLevels[index] = Math.max(2, state.fieldLevels[index]);
}
function dangerChance(state) {
  const era = (getStage(state).settings.dangerEras || []).find((item) => state.year >= item.from && state.year <= item.to);
  return era ? era.chance : getStage(state).settings.disasterChance;
}
function guards(state, disasterId) { return state.field.some((id, index) => (getStage(state).FIELD[id].guard || []).includes(disasterId) || (fieldAt(state, index).guard || []).includes(disasterId)); }
// 札や出来事が直に場へ置いた子に、続柄と名前を記録する
function recordChild(state, key) {
  const stage = getStage(state), n = ++state.childCount, sex = nameHash(state, `sex${n}`) % 2 ? 'son' : 'daughter', rel = n === 1 ? '嫡子' : '庶子';
  const order = Object.values(state.children).filter((child) => child.sex === sex).length + 1;
  const mother = state.field.findLast((field) => ['spouse', 'concubine', 'mistress'].includes(stage.FIELD[field]?.role));
  return state.children[key] = { rel, claim: stage.settings.claims[rel], support: mother && stage.FIELD[mother].role === 'spouse' ? 2 : 1, mother, sex, name: personName(state, sex, order) };
}
function alter(state, effect = {}) {
  remove(state, effect.remove);
  add(state, effect.add);
  const stage = getStage(state), namedChildren = [];
  if (stage.NAMING) for (const [offset, id] of (effect.add || []).entries()) if (id === 'child') namedChildren.push(recordChild(state, state.fieldKeys[state.fieldKeys.length - (effect.add.length - offset)]));
  for (const id of effect.add || []) if (getStage(state).FIELD[id]?.role === 'lover') { state.metPartners.push(id); state.partnerHearts[id] ||= 1; }
  if (effect.conflict) { state.affairConflicts++; if (!has(state, 'rumor')) add(state, ['rumor']); if (state.affairConflicts >= getStage(state).settings.affairConflictsForDivorce) scheduleFamily(state, idFor(state, 'divorce'), state.year + 1); }
  if (effect.settle) state.affairConflicts = 0;
  if (effect.divorce) { remove(state, fieldIdsFor(state, 'spouse')); state.spouseOf = null; state.affairConflicts = 0; scheduleMarriage(state); }
  if ((effect.add || []).some((id) => getStage(state).FIELD[id]?.role === 'lover')) {
    const arranged = state.familyTimeline.find((event) => cardRole(state, event.id) === 'arrangedMarriage');
    if (arranged) arranged.id = idFor(state, 'partnerMarriage');
    else if (!has(state, 'spouse')) scheduleFamily(state, idFor(state, 'partnerMarriage'), state.year + 1, Math.min(state.year + 3, state.year - state.age + Math.max(getStage(state).settings.firstMarriageAges[1], state.age + 1)));
  }
  if (effect.rank && effect.rank > rankLevel(state)) {
    const before = rankLevel(state);
    const rankId = fieldIdFor(state, 'rank');
    if (!before) add(state, [rankId]);
    state.fieldLevels[state.field.findIndex((id) => getStage(state).FIELD[id].role === 'rank')] = effect.rank;
    const row = state.history.at(-1); if (row) row.rankChange = `身分：${before ? getStage(state).FIELD[rankId].levels[before - 1].name : '百姓'} → ${getStage(state).FIELD[rankId].levels[effect.rank - 1].name}`;
  }
  if (effect.maxBody) changeBodyMax(state, effect.maxBody, effect.maxBody > 0 ? '鍛えて体の器が広がった' : '病で、体の器が小さくなった');
  const bodyMax = getStage(state).settings.bodyCeiling ? state.bodyMax : getStage(state).settings.maxBody;
  state.body = Math.min(bodyMax, state.body + (effect.body || 0));
  state.store += effect.store || 0;
  if (effect.die) { state.dead = true; state.cause = effect.text || 'ベットの結果'; }
  return namedChildren;
}
function stakeInfo(state, bet) {
  const stake = bet.stake || {};
  return { ...stake, amount: stake.amount ?? 1, index: stake.what && !['body', 'store'].includes(stake.what) ? targetIndex(state, stake.what) : -1 };
}
function pay(state, stake) {
  if (stake.what === 'body') state.body -= stake.amount;
  else if (stake.what === 'store') {
    const paid = Math.min(state.store, stake.amount);
    state.store -= paid;
    state.body -= stake.amount - paid;
  } else if (stake.type === 'spend') removeAt(state, stake.index);
  else if (stake.type === 'lock') {
    const level = state.fieldLevels[stake.index];
    const id = removeAt(state, stake.index);
    state.locked.push({ id, level, until: state.year + (stake.years || 1) });
  }
}
// 札の片側が取りに行く品の届く範囲（いちばん高いもの）
const sideReach = (state, side) => Math.max(1, ...(side?.win?.add || []).map((id) => rungOf(getStage(state).FIELD[id])));
// 舞台の設定 reachTries: { 範囲: 回数 }。その範囲の品を取りに行く側を、一生でその回数だけ選べる。使い切ると、その範囲の品をくれる札はもう来ない
const reachSpent = (state, card) => Object.entries(getStage(state).settings.reachTries || {}).some(([reach, tries]) => (state.reachTried?.[reach] || 0) >= tries && [card.left, card.right].some((side) => sideReach(state, side) >= Number(reach)));
// 普請の札で建てる側の銭の値段。足りない分を体で払うと高い普請で即死するので、銭が足りるときにだけ札が来る
export const buildPrice = (bet) => (bet?.cost?.store || 0) + (bet?.stake?.type === 'spend' && bet.stake.what === 'store' ? bet.stake.amount || 1 : 0);
export function eligible(state, card, age) {
  return !reachSpent(state, card) && (card.frame !== 'build' || state.store >= buildPrice(card.left)) && (!card.ages || (age >= card.ages[0] && age <= card.ages[1]))
    && (!card.years || (state.year >= card.years[0] && state.year <= card.years[1]))
    && (card.repeat || !state.used.includes(card.id))
    && (!card.cooldown || !state.history.some((row) => row.id === card.id && state.year - row.year < card.cooldown))
    && (card.needs || []).every((id) => contains(state, id))
    && (!card.needsAny || card.needsAny.some((id) => has(state, id)))
    && (!card.past || card.past.some((ability) => (state.abilities[ability] || 0) >= 0.33))
    && (card.lacks || []).every((id) => !has(state, id))
    && (!card.max || state.field.filter((id) => id === card.max.fieldId).length < card.max.count)
    && (card.role !== 'partnerMeet' || getStage(state).partnerIds.some((id) => !state.metPartners.includes(id)))
    && (card.role !== 'concubine' || has(state, 'spouse') && state.field.filter((id) => getStage(state).FIELD[id].role === 'concubine').length < getStage(state).settings.maxConcubines)
    && (card.role !== 'keepPartner' || state.field.some((id) => getStage(state).FIELD[id].role === 'lover' && (state.partnerHearts[id] || 1) >= getStage(state).settings.keepLoverHearts) && state.field.filter((id) => getStage(state).FIELD[id].role === 'mistress').length < getStage(state).settings.maxMistresses)
    && (card.role !== 'mistress' || state.store >= getStage(state).settings.concubineStore && state.field.filter((id) => getStage(state).FIELD[id].role === 'mistress').length < getStage(state).settings.maxMistresses)
    && (card.role !== 'divorce' || state.affairConflicts >= 2)
    && (card.role !== 'arrangedMarriage' || !has(state, 'spouse'))
    && (card.role !== 'partnerMarriage' || !has(state, 'spouse') && has(state, 'lover'))
    && (card.role !== 'villageHead' || age >= 30 && hasRole(state, 'villageTrust') && !state.retired)
    && (card.role !== 'boundaryFeud' || hasPrimaryField(state))
    // 隣の家との争いは間を置いて来る。相手の力が尽きていれば来ない。隠居したら家の争いは跡取りのもの。
    && (!['waterFeud', 'boundaryFeud'].includes(card.role) || !state.retired && state.fieldLevels[state.field.findIndex((id) => getStage(state).FIELD[id].role === 'rivalHouse')] >= 1 && state.year - (state.lastFeud ?? -99) >= getStage(state).settings.feudGap)
    && (!card.demand || card.year || !state.retired);
}
// 舞台の設定 bodyGuard: 払うと体が尽きる側は選べない。余力が無い年は道の札に賭けられない（賭けて負けるかどうかは別で、掛け金の risk は止めない）
function spent(state, card, bet) {
  if (!getStage(state).settings.bodyGuard) return false;
  const lack = Math.max(0, buildPrice(bet) - Math.max(state.store, 0)); // 足りない銭は体で払う
  const need = (bet?.stake?.what === 'body' && bet.stake.type === 'spend' ? bet.stake.amount ?? 1 : 0) + (bet?.cost?.body || 0) + lack;
  return need > 0 && need >= state.body;
}
function playable(state, card) {
  return ['left', 'right'].some((side) => {
    if (spent(state, card, card[side]) || card[side].minStore > state.store) return false;
    const what = card[side].stake?.what;
    if (what === 'substitute') return true;
    return !what || ['body', 'store'].includes(what) || contains(state, what);
  });
}
function maintenanceCard(state) {
  const choices = state.field.map((id, index) => ({ id, index, level: state.fieldLevels[index] })).filter(({ id, level }) => getStage(state).FIELD[id].levels && !getStage(state).FIELD[id].noMaintain && !['house', 'rivalHouse', 'patronHouse'].includes(getStage(state).FIELD[id].role) && level < 3);
  if (!choices.length) return null;
  const target = pick(state, choices), next = getStage(state).FIELD[target.id].levels[target.level];
  const text = getStage(state).text;
  const targetName = fieldAt(state, target.index).name;
  return { id: getStage(state).specialIds.maintenance, role: 'maintenance', targetKey: state.fieldKeys[target.index], level: target.level + 1, title: fill(text.maintenanceTitle || '{target}をよくする話', { target: targetName }), story: fill(text.maintenanceStory || '{target}を、もう一段よくできそうだ。', { target: targetName }), art: next.art,
    left: { title: `職人に頼んで ${next.name} にする`, art: next.art, cost: { store: getStage(state).settings.polishStore[target.level + 1] }, odds: getStage(state).settings.polishOddsPaid[target.level + 1], win: { text: `${next.name}になった。` }, lose: { text: 'うまくいかなかった。' } },
    right: { title: `自分の手で ${next.name} にする`, art: next.art, cost: { body: getStage(state).settings.polishBody[target.level + 1] }, odds: getStage(state).settings.polishOddsSelf[target.level + 1], win: { text: `${next.name}になった。` }, lose: getStage(state).settings.diyInjury ? { text: '足場から落ちて、古傷が残った。', add: [getStage(state).settings.diyInjury] } : { text: 'うまくいかなかった。' } } };
}
export function drawCard(state, year, age, previousBig = false) {
  // 舞台に無い役の札（離縁など）は年表から落とす。舞台ごとに持つ仕組みが違ってよい。
  state.familyTimeline = state.familyTimeline.filter((event) => event.id && getStage(state).cardById.get(event.id));
  const historical = getStage(state).CARDS.filter((card) => card.year === year && playable(state, card));
  if (historical.length) {
    for (const event of state.familyTimeline) if (event.year === year) event.year++;
    return customizeCard(state, pick(state, historical));
  }
  const family = state.familyTimeline.find((event) => event.year <= year && cardRole(state, event.id) !== 'birth');
  if (family) {
    if (cardRole(state, family.id) === 'arrangedMarriage' && has(state, 'lover')) family.id = idFor(state, 'partnerMarriage');
    if (cardRole(state, family.id) === 'partnerMarriage' && !has(state, 'lover')) family.id = idFor(state, 'arrangedMarriage');
    const card = cardById(state, family.id);
    if (['childSeven', 'childFifteen'].includes(card.role)) { if (state.fieldKeys.includes(family.key)) return childCard(state, card, family); }
    else if (eligible(state, card, age) && playable(state, card)) return card.role === 'succession' ? successionCard(state, card, family) : customizeCard(state, card);
    state.familyTimeline = state.familyTimeline.filter((event) => event !== family);
  }
  const newZori = getStage(state).CARDS.find((card) => card.role === 'recoveryCard');
  if (newZori && eligible(state, newZori, age) && playable(state, newZori)) return newZori;
  const quietAll = getStage(state).CARDS.filter((card) => card.quiet && eligible(state, card, age) && playable(state, card));
  // 暮らしの場面（一度きりの静かな札）が残っていれば、そちらを先に出す
  const fresh = getStage(state).settings.quietAuto ? quietAll.filter((card) => !card.repeat) : [];
  const quiet = fresh.length ? fresh : quietAll;
  if (previousBig && getStage(state).settings.quietAfterBig && quiet.length) return age >= getStage(state).settings.adultFrom && !(fresh.length && rand(state) < 0.5) && maintenanceCard(state) || pick(state, quiet);
  if (age >= getStage(state).settings.adultFrom && rand(state) < dangerChance(state)) {
    const disasters = getStage(state).CARDS.filter((card) => card.disaster && eligible(state, card, age) && playable(state, card));
    if (disasters.length) return pick(state, disasters);
  }
  const eligibleCards = getStage(state).CARDS.filter((card) => !card.quiet && !card.disaster && !card.year && !card.familyAge && card.role !== 'birth' && card.category !== 'child' && eligible(state, card, age) && playable(state, card));
  // 誓いの効き方（舞台の設定 goalShare）。毎年のくじのうちこの割合は、誓った軸の札から引く
  const goalShare = getStage(state).settings.goalShare;
  if (goalShare && state.goal && rand(state) < goalShare) { const goalCards = eligibleCards.filter((card) => card.axis === state.goal); if (goalCards.length) return customizeCard(state, pick(state, goalCards)); }
  // 求める札は蓄えと身分に応じて出やすくする。
  const demandWeight = 1 + Math.floor(Math.max(0, state.store) / getStage(state).settings.demandPerStore) + rankLevel(state) + (hasRole(state, 'villageHead') ? 1 : 0);
  const weighted = eligibleCards.flatMap((card) => Array((card.weight || 1) * (card.demand ? demandWeight : 1) * (card.role === 'partnerMeet' ? (state.goal === 'love' ? getStage(state).settings.meetingWeight * getStage(state).settings.goalWeight : 1) * (has(state, 'affair') ? getStage(state).settings.affairMeetBoost : 1) : card.role === 'partnerVisit' ? getStage(state).settings.visitWeight * (card.axis === state.goal ? getStage(state).settings.goalWeight : 1) : card.axis === state.goal ? getStage(state).settings.goalWeight : 1) * (card.tired && state.body <= getStage(state).settings.tiredAt ? getStage(state).settings.tiredWeight : 1)).fill(card));
  return customizeCard(state, weighted.length ? pick(state, weighted) : pick(state, quiet));
}
// 子の節目の札は、どの子の話かを札に書き込む。長子は十五で跡を継ぐかどうかの札になる。
function childCard(state, card, event) {
  const who = `${event.n === 1 ? '長子' : `${event.n}番目の子`}${state.children[event.key]?.name ? `の${state.children[event.key].name.split('・')[0]}` : ''}`;
  const base = { ...card, childKey: event.key, title: `${who}の${card.title.replace('子の', '')}`, story: card.story.replace('子が', `${who}が`) };
  if (card.role === 'childFifteen' && event.n === 1) return { ...base, left: { ...card.left, title: getStage(state).text.heirChoice || '跡を継がせる', stake: { type: 'spend', what: 'store', amount: 1 }, odds: 6, win: { text: getStage(state).text.heirChosen || '長子を跡取りと決めた。', add: ['heir'] } } };
  return base;
}
// 求める札の右側は、その年のくじから引いた別の札の片側にする。
function pairDemand(state, card) {
  const age = state.age + (state.result ? 1 : 0);
  const pool = getStage(state).CARDS.filter((item) => !item.quiet && !item.disaster && !item.year && !item.demand && !item.family && !item.familyAge && item.category !== 'relationship' && item.category !== 'child' && item.role !== 'medicine' && eligible(state, item, age) && playable(state, item));
  const other = pool.length ? pick(state, pool) : getStage(state).CARDS.find((item) => item.role === 'quietCard');
  const usable = ['left', 'right'].filter((side) => { if (spent(state, other, other[side])) return false; const what = other[side].stake?.what; return !what || ['body', 'store'].includes(what) || contains(state, what); });
  const side = usable.length ? pick(state, usable) : 'left';
  return { ...card, pairedId: other.id, right: { ...other[side], from: other.title } };
}
export function demandNote(state, card = currentCard(state)) {
  if (!card?.demand) return '';
  if (!card.ignore.substitute) return `選ばなければ：${card.ignore.label}`;
  const who = substituteFor(state);
  const text = getStage(state).text.substitutes;
  return who === 'hire' ? `選ばなければ：${text.hireChoice}（蓄え ${getStage(state).settings.hireCost}）` : who ? `選ばなければ：${text[`${who}Demand`] || `${getStage(state).FIELD[fieldIdFor(state, who)].name}が`}代わりに${text.call}に出る（無事に帰る目 ${card.ignore.odds}）` : `選ばなければ：${text.noOne}`;
}
function resolveIgnore(state, card, row) {
  if (!card.ignore.substitute) { const effect = card.ignore.effect; if (effect.conflict && !has(state, 'rumor')) row.changes.add.push('rumor'); const removable = (effect.remove || []).filter((id) => state.field.includes(id)); applyHouseEffect(state, effect); alter(state, effect); row.ignoreText = effect.text; row.changes.add.push(...(effect.add || [])); row.changes.remove.push(...removable); return; }
  const who = substituteFor(state);
  const text = getStage(state).text.substitutes;
  if (!who) { add(state, ['coward']); row.changes.add.push('coward'); row.ignoreText = text.noOneResult; return; }
  if (who === 'hire') { state.store -= getStage(state).settings.hireCost; row.ignoreText = text.hireResult; return; }
  const id = fieldIdFor(state, who), index = state.field.indexOf(id), safe = 1 + Math.floor(rand(state) * 6) <= card.ignore.odds || who === 'servant' && state.fieldLevels[index] === 3;
  if (!safe) { removeAt(state, index); row.changes.remove.push(id); }
  if (safe && who === 'father') { const event = state.familyTimeline.find((item) => cardRole(state, item.id) === 'fatherDeath'); if (event) event.year = Math.max(state.year + 1, event.year - 1); }
  row.ignoreText = fill(text.ignoreResult, { name: getStage(state).FIELD[id].name, outcome: safe ? text.returned : text.lost });
}
function customizeCard(state, card) {
  if (card.demand) return pairDemand(state, card);
  if (card.role === 'partnerMeet') {
    const target = pick(state, getStage(state).partnerIds.filter((id) => !state.metPartners.includes(id)));
    return { ...card, title: `${getStage(state).FIELD[target].name}との出会い`, story: `${getStage(state).FIELD[target].name}と目が合った。`, art: getStage(state).FIELD[target].art, left: { ...card.left, win: { ...card.left.win, add: [target] } } };
  }
  // 薬売りの右は、生きている親がいればその親の薬を買う側になる（年表の最期が先へ延びる）。
  if (card.role === 'medicine') {
    const parents = [has(state, 'father') || has(state, 'oldfather') ? '父' : '', has(state, 'mother') ? '母' : ''].filter(Boolean);
    if (!parents.length) return card;
    const who = parents.join('と');
    return { ...card, right: { ...(getStage(state).text.medicineSide || {}), title: `${who}の薬を買う`, art: 'choice.medicine', stake: { type: 'spend', what: 'store', amount: 1 }, odds: 4, win: { text: `${who}に薬が効いた。`, shift: { [idFor(state, 'fatherDeath')]: 2, [idFor(state, 'motherDeath')]: 2 } }, lose: { text: '効かなかった。' } } };
  }
  if (card.role === 'keepPartner') {
    const target = state.field.filter((id) => getStage(state).FIELD[id].role === 'lover').sort((x, y) => (state.partnerHearts[y] || 1) - (state.partnerHearts[x] || 1))[0];
    return { ...card, title: `${getStage(state).FIELD[target].name}を囲う`, story: `${getStage(state).FIELD[target].name}が、そばに置いてほしいと言う。`, left: { ...card.left, win: { ...card.left.win, remove: [target] } } };
  }
  if (card.role === 'partnerVisit') {
    const target = pick(state, state.field.filter((id) => getStage(state).FIELD[id].role === 'lover'));
    return { ...card, visitTarget: target, story: `${getStage(state).FIELD[target].name}のもとへ足を運ぶ。`, left: { ...card.left, title: `${getStage(state).FIELD[target].name}へ贈り物を持って行く` }, right: has(state, 'spouse')
      // 内緒で深めるか、表に出して浮名を流すか。連れ合いがいなければ、表に出す側は添う約束になる。
      ? { ...card.right, title: `${getStage(state).FIELD[target].name}と連れ立って祭りへ出る`, art: 'choice.festival', odds: 3, win: { text: getStage(state).text.visitPublicWin || '連れ立って歩き、浮名が立った。', add: has(state, 'affair') ? [] : ['affair'], visitBoost: 2 }, lose: { text: getStage(state).text.visitPublicLose || '人目に付き、正妻の実家と揉めた。', add: ['rumor'], conflict: true } }
      : { ...card.right, title: `${getStage(state).FIELD[target].name}と添う約束をする`, art: 'choice.lovematch', odds: 4, win: { text: '添う約束をした。家に話す日も近い。', betroth: true }, lose: { text: 'まだ早いと言われた。' } } };
  }
  if (card.role === 'partnerMarriage' && has(state, 'lover')) {
    const target = state.field.includes(state.betrothed) ? state.betrothed : state.field.find((id) => getStage(state).FIELD[id].role === 'lover');
    return { ...card, marryTarget: target, left: { ...card.left, title: `${getStage(state).FIELD[target].name}と添う`, win: { ...card.left.win, remove: [target] }, lose: { ...card.left.lose, remove: [target] } } };
  }
  return card;
}
function scheduleFamily(state, id, from, to = from) {
  if (state.familyTimeline.some((event) => event.id === id)) return;
  const first = Math.max(state.year + 1, from), last = Math.max(first, to);
  state.familyTimeline.push({ id, year: first + Math.floor(rand(state) * (last - first + 1)) });
}
function successionCandidate(state, kinds = ['kinsman']) {
  return state.field.map((id, index) => ({ id, key: state.fieldKeys[index], ...(state.kinship[state.fieldKeys[index]] || state.children[state.fieldKeys[index]] || {}) }))
    .filter((item) => (kinds.includes(item.id) || kinds.includes('child') && state.children[item.key]) && item.key !== state.heirKey && Math.abs(item.claim - state.heirClaim) <= getStage(state).settings.claimGap)
    .sort((a, b) => Math.abs(a.claim - state.heirClaim) - Math.abs(b.claim - state.heirClaim))[0];
}
function successionCard(state, card, event) {
  const rival = state.kinship[event.key] || state.children[event.key];
  if (!rival) return card;
  state.contestant = { ...rival, key: event.key };
  const text = getStage(state).text.succession;
  return { ...card, successionKey: event.key, successionSide: event.side, title: text.title, story: fill(event.side === 'self' ? text.selfStory : text.story, { rel: rival.rel }), left: { ...card.left, title: fill(text.fight, { rel: rival.rel }), lose: { ...card.left.lose, text: fill(getStage(state).text.contest.noField, { rel: rival.rel }) } }, right: { ...card.right, title: fill(event.side === 'self' ? text.surrender : text.replace, { rel: rival.rel }), win: { ...card.right.win, promoteRival: true } } };
}
function scheduleChild(state) {
  const age = getStage(state).settings.childbearingUntil;
  if (has(state, 'spouse') && state.age < age) scheduleFamily(state, idFor(state, 'birth'), state.year + 1, Math.min(state.year + 3, state.year + age - state.age));
}
function scheduleMarriage(state) {
  if (has(state, 'spouse') || state.age > 60) return;
  const id = idFor(state, has(state, 'lover') ? 'partnerMarriage' : 'arrangedMarriage');
  if (state.familyTimeline.some((event) => ['arrangedMarriage', 'partnerMarriage'].includes(cardRole(state, event.id)))) return;
  scheduleFamily(state, id, state.year + 1, Math.min(state.year + 3, state.year - state.age + getStage(state).settings.marriageUntil));
}
function setCurrent(state, card) {
  state.familyTimeline = state.familyTimeline.filter((event) => card.childKey !== undefined ? !(event.id === card.id && event.key === card.childKey) : event.id !== card.id);
  state.cardId = card.id;
  if (['waterFeud', 'boundaryFeud'].includes(card.role)) state.lastFeud = state.year;
  state.cardOverride = cardById(state, card.id) === card ? null : card;
  if (!state.used.includes(card.id)) state.used.push(card.id);
}
function setNext(state, card) { state.nextCardId = card.id; state.nextCardOverride = cardById(state, card.id) === card ? null : card; }
export function substituteFor(state) {
  const role = (getStage(state).settings.substituteOrder || DEFAULT_SUBSTITUTES).find((candidate) => state.field.some((id) => getStage(state).FIELD[id].role === candidate && getStage(state).FIELD[id].substitute !== false));
  if (role) return role;
  return state.store >= getStage(state).settings.hireCost ? 'hire' : null;
}
export function betTitle(state, side) {
  const bet = currentCard(state)?.[side ? 'right' : 'left'];
  if (bet?.stake?.what !== 'substitute') return bet?.title;
  const substitute = substituteFor(state);
  const text = getStage(state).text.substitutes;
  return text[`${substitute}Choice`] || (substitute === 'grownchild' ? text.childChoice : substitute === 'father' ? text.fatherChoice : substitute === 'servant' ? text.servantChoice : substitute === 'hire' ? text.hireChoice : text.noneChoice);
}
// 家族は自分から申し出て、働き手や雇い人は主人公が選ぶ。
export function volunteerLine(state, card = currentCard(state)) {
  if (card?.demand || ![card?.left, card?.right].some((bet) => bet?.stake?.what === 'substitute')) return '';
  return getStage(state).text.substitutes[substituteFor(state)] || '';
}
export function oddsFor(state, card, side, odds) {
  if (card.contest === 'succession') return Math.max(1, Math.min(5, 3 + (side === 'left' ? state.heirClaim + successionSupport(state) - state.contestant.claim - state.contestant.support : state.contestant.claim + state.contestant.support - state.heirClaim - successionSupport(state))));
  if (card.contest && side === 'left') { const role = card.contest === 'patron' ? 'patronHouse' : 'rivalHouse', index = state.field.findIndex((id) => getStage(state).FIELD[id].role === role), other = state.fieldLevels[index]; return Math.max(1, Math.min(5, 3 + houseMight(state) - other)); }
  // 届く範囲が高い品を取りに行く側は、勝つ目に上限がある（舞台の設定 reachOdds: { 範囲: 上限 }）。札ごとに勝つ目を書き分けなくても、梯子の上ほど難しくなる
  const reach = sideReach(state, card[side]), cap = getStage(state).settings.reachOdds?.[reach];
  if (cap) odds = Math.min(odds, cap);
  const effects = getStage(state).ABILITY_EFFECTS || {};
  const matchesPast = Object.entries(effects).reduce((best, [ability, cards]) => cards.some((entry) => entry === card.id || entry === `${card.id}:${side}`) ? Math.max(best, Math.round((state.abilities[ability] || 0) * getStage(state).settings.pastBoost)) : best, 0);
  const maintenanceIndex = card.role === 'maintenance' ? state.fieldKeys.indexOf(card.targetKey) : -1;
  const pastLv3 = maintenanceIndex >= 0 && card.level === 3 && getStage(state).FIELD[state.field[maintenanceIndex]]?.pastLv3?.some((ability) => (state.abilities[ability] || 0) > getStage(state).settings.lv3Threshold);
  const guarded = card.disaster ? guards(state, card.disasterKey) : guards(state, card.id);
  return Math.min(6, odds + (pastLv3 ? getStage(state).settings.pastLv3Boost : matchesPast) + (guarded ? getStage(state).settings.guardBoost : 0));
}
function finishIfDead(state, cause) {
  if (!state.dead && state.body <= 0) { state.dead = true; state.cause = cause || '働きすぎで倒れた'; }
  if (!state.dead && state.age >= getStage(state).settings.maxAge) { state.dead = true; state.cause = '老衰'; }
  return state;
}

export function start(seed = 1, { stage = DEFAULT_STAGE } = {}) {
  const stageData = stageFor(stage);
  if (!stageData) throw new Error(`舞台がありません: ${stage}`);
  const { settings, SURNAMES } = stageData;
  const state = {
    stage: stageData.id, stageData, seed: seed >>> 0 || 1, rng: seed >>> 0 || 1, age: 0, year: stageData.birthYear, childhoodIndex: 0,
    childhoodHistory: [], goal: null, goals: [], goalChanges: 0, field: [], fieldYears: [], fieldLevels: [], fieldKeys: [], nextFieldKey: 1, autoKeys: {}, body: settings.bodyCeiling ? Math.min(settings.startBody, settings.bodyMaxStart) : settings.startBody,
    ...(settings.bodyCeiling ? { bodyMax: settings.bodyMaxStart, bodyMaxGrowth: settings.bodyMaxStart, bodyMaxEvents: [] } : {}),
    store: settings.startStore, houseStore: 0, houseInherited: false, intuition: settings.intuitionStart, intuitionUsed: 0, locked: [], used: [], history: [], pending: [], dead: false, cause: '',
    pendingRoll: null, childCount: 0, featuredChildren: 0, familyTimeline: [], metPartners: [], partnerHearts: {}, affairConflicts: 0,
    houseName: SURNAMES[(seed >>> 0) % SURNAMES.length], neighborName: SURNAMES[((seed >>> 0) + 1) % SURNAMES.length], patronName: SURNAMES[((seed >>> 0) + 2) % SURNAMES.length],
    kinship: {}, children: {}, heirKey: null, heirClaim: stageData.settings.claims.heir, contestant: null, head: false, retired: false, succession: '', rivalHouse: false, rivalRel: '',
    cardId: null, nextCardId: null, result: null, fresh: [], pastIntro: false, reconsider: null, pastId: null, abilities: Object.fromEntries(Object.keys(ABILITIES).map((id) => [id, 0])),
  };
  const reveal = stageData.settings.staggeredReveal;
  if (!reveal) add(state, stageData.START_FIELD.slice(0, 3));
  const pendingKin = [];
  let x = state.seed ^ 0xa511e9b3; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  const relatives = stageData.KINSHIP_RELATIVES;
  const count = relatives.length ? (x >>> 0) % 5 : 0;
  for (let i = 0; i < count; i++) {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    const rel = relatives[(x >>> 0) % relatives.length], kin = { rel, claim: stageData.settings.claims[rel], support: (x >>> 8) % 4 };
    if (reveal) { pendingKin.push({ ...kin, slot: pendingKin.length }); continue; }
    add(state, ['kinsman']); state.kinship[state.fieldKeys.at(-1)] = kin;
  }
  state.houseLevels = { rivalHouse: 1 + ((seed >>> 0) % 2), patronHouse: 3 };
  if (!reveal) for (const role of ['rivalHouse', 'patronHouse']) state.fieldLevels[state.field.findIndex((id) => stageData.FIELD[id].role === role)] = state.houseLevels[role];
  for (const id of stageData.INITIAL_FAMILY_EVENTS) { const [from, to] = stageData.FAMILY_AGES[id]; scheduleFamily(state, id, stageData.birthYear + from, stageData.birthYear + to); }
  drawBirth(state, stageData);
  if (reveal) revealKin(state, stageData, pendingKin);
  if (stageData.NAMING && stageData.text.named) {
    if (!state.childhood) state.childhood = stageData.CHILDHOOD.map((event) => ({ ...event }));
    const first = state.childhood[0], name = personName(state, 'self');
    state.childhood[0] = { ...first, title: fill(stageData.text.namedTitle, { name }), story: `${first.story}${fill(stageData.text.named, { name, given: name.split('・')[0] })}${name === personName(state, 'father') ? stageData.text.namedAfterFather || '' : ''}` };
    const intro = stageData.text.introduce || {};
    state.childhood = state.childhood.map((event) => {
      const lines = [...(event.cards || []).filter((id) => intro[stageData.FIELD[id]?.role || id]).map((id) => { const role = stageData.FIELD[id]?.role || id, many = role === 'sister' && intro.sisters && (state.siblings?.list || []).filter((sib) => ['妹', '姉'].includes(sib.rel)).length > 1; return fill(many ? intro.sisters : intro[role], { name: personName(state, role) }); }),
        ...(event.kins || []).filter((kin) => intro[kin.rel]).map((kin) => fill(intro[kin.rel], { name: personName(state, kin.rel, { slot: kin.slot }) }))];
      return lines.length ? { ...event, story: `${event.story}${lines.join('')}` } : event;
    });
  }
  state.rng = state.seed;
  return state;
}

export function advanceChildhood(state) {
  if (state.childhoodIndex >= childhoodOf(state).length || state.dead) return state;
  const event = childhoodOf(state)[state.childhoodIndex];
  state.age = event.age; state.year = event.year;
  add(state, event.cards);
  if (event.kin) state.kinship[state.fieldKeys.at(-1)] = { rel: event.kin, claim: getStage(state).settings.claims[event.kin], support: 1 };
  for (const kin of event.kins || []) { add(state, ['kinsman']); state.kinship[state.fieldKeys.at(-1)] = kin; }
  if (state.siblings) { state.siblings.born += event.siblingBirths || 0; state.siblings.lost += event.siblingDeaths || 0; }
  if (event.loseSibling) {
    const index = event.loseSibling === '妹' ? state.field.indexOf('sister') : state.field.findIndex((id, i) => id === 'kinsman' && state.kinship[state.fieldKeys[i]]?.rel === event.loseSibling);
    if (index >= 0) { delete state.kinship[state.fieldKeys[index]]; removeAt(state, index); }
  }
  for (const role of ['rivalHouse', 'patronHouse']) if (event.cards.some((id) => getStage(state).FIELD[id]?.role === role)) state.fieldLevels[state.field.findIndex((id) => getStage(state).FIELD[id].role === role)] = state.houseLevels[role];
  if (state.birth && state.childhoodIndex === 0) {
    const houseIndex = state.field.indexOf('house'); if (houseIndex >= 0) state.fieldLevels[houseIndex] = state.birth.houseLevel;
    state.houseStore += state.birth.houseStore; add(state, state.birth.add);
  }
  state.childhoodHistory.push({ year: event.year, age: event.age, title: event.title, art: event.art, story: event.story });
  state.childhoodIndex++;
  state.fresh = event.cards.length ? state.field.slice(-event.cards.length) : [];
  if (state.childhoodIndex >= childhoodOf(state).length && !state.dead) recallPast(state);
  return state;
}
export function skipChildhood(state) {
  while (state.childhoodIndex < childhoodOf(state).length) advanceChildhood(state);
  return state;
}

export function declareGoal(state, axis) {
  if (state.childhoodIndex < childhoodOf(state).length || !getStage(state).AXES[axis] || state.goal) throw new Error('目標を宣言できません');
  state.goal = axis;
  state.goals.push({ age: 6, axis });
  recallPast(state); state.pastIntro = false;
  if (getStage(state).settings.scoreGainsOnly) state.innateMarks = Object.fromEntries(state.field.map((id, index) => [state.fieldKeys[index], Object.fromEntries(AXIS_IDS(state).map((axis) => [axis, markAt(state, id, index, axis)]))]));
  state.age = 7; state.year = getStage(state).birthYear + 7;
  const card = drawCard(state, state.year, state.age);
  setCurrent(state, card);
  setNext(state, drawCard(state, state.year + 1, state.age + 1, !!(card.year || card.disaster)));
  return state;
}

// 6 歳の終わりに記憶が戻る。前世は誓いより先に引いて見せ、手札を知ってから誓いを選べるようにする。
export function recallPast(state) {
  if (state.pastId) return state;
  const stage = getStage(state), past = pick(state, Object.keys(stage.FIELD).filter((id) => stage.FIELD[id].kind === '前世'));
  state.pastId = past;
  if (stage.PAST_ABILITIES) Object.assign(state.abilities, stage.PAST_ABILITIES[past]);
  if (stage.RANDOM_ABILITIES) {
    const pool = stage.RANDOM_ABILITIES.slice(), count = 2 + Math.floor(rand(state) * 2);
    for (let i = 0; i < count; i++) { const ability = pool.splice(Math.floor(rand(state) * pool.length), 1)[0]; state.abilities[ability] = 0.2 + rand(state) * 0.8; }
    const top = topAbilities(state.abilities, 3);
    state.pastName = stage.FIELD[past].name;
    state.pastText = stage.abilityStories[top[0]];
  } else {
    state.pastName = stage.FIELD[past].name;
    state.pastText = stage.FIELD[past].habit;
  }
  state.initialAbilities = { ...state.abilities };
  add(state, [past]); state.pastIntro = true;
  return state;
}
// 誓いの見直しは年の札にしない。結果の画面で答え、答えずに次の年へ進めば今の誓いのまま。
export function answerReconsider(state, change) {
  if (state.reconsider && change) { changeGoal(state, state.reconsider.axis); const row = state.history.at(-1); if (row) row.vowChange = `今生の誓いを「${getStage(state).AXES[state.goal].here}」に改めた。`; }
  state.reconsider = null;
  return state;
}
export function changeGoal(state, axis) {
  if (!state.dead && state.age >= 15 && state.goalChanges < 1 && getStage(state).AXES[axis] && axis !== state.goal) {
    state.goal = axis; state.goalChanges++;
    state.goals.push({ age: state.age, axis });
  }
  return state;
}
export function currentCard(state) {
  const card = state.cardOverride || (state.cardId === getStage(state).specialIds.reconsider ? state.reconsiderCard : cardById(state, state.cardId));
  return card && !card.role && getStage(state).specialRoles[card.id] ? { ...card, role: getStage(state).specialRoles[card.id] } : card;
}
export function nextCard(state) { return state.nextCardOverride || cardById(state, state.nextCardId); }
export function canChoose(state, side) {
  const card = currentCard(state), bet = card?.[side === 0 ? 'left' : side === 1 ? 'right' : ''];
  return !!bet && !(bet.minStore > state.store) && !spent(state, card, bet) && (!(bet.stake?.what) || bet.stake.what === 'substitute' || ['body', 'store'].includes(bet.stake.what) || contains(state, bet.stake.what));
}
// 死んだあとも語られる品の、後世の文（品の after）
export const afterLines = (state) => [...new Set(state.field)].map((id) => getStage(state).FIELD[id]?.after).filter(Boolean);
export function isQuietYear(state) {
  const card = currentCard(state);
  return !!getStage(state).settings.quietAuto && !state.retired && !state.result && card?.role === 'quietCard';
}
// 主人公だけの決まり: 主人公が子どものうちに来る史実の札は、振り直しを挟まず決着し、負けても死なない（体は 1 で止まる）。家族やほかの登場人物には効かない
function childSafe(state, card) {
  return !!card?.year && state.age < getStage(state).settings.adultFrom;
}
export function choose(state, side) {
  if (isQuietYear(state)) side = 0;
  if (state.dead || state.result || state.pendingRoll || ![0, 1].includes(side) || !canChoose(state, side)) return state;
  const card = currentCard(state), chosenSide = side ? 'right' : 'left', bet = card[chosenSide];
  const beforeCost = { body: state.body, store: state.store };
  const cost = bet.cost || {};
  state.body -= cost.body || 0;
  const paid = Math.min(state.store, cost.store || 0);
  state.store -= paid;
  state.body -= (cost.store || 0) - paid;
  state.betBefore = beforeCost;
  const odds = oddsFor(state, card, chosenSide, bet.odds);
  for (const reach of Object.keys(getStage(state).settings.reachTries || {})) if (sideReach(state, bet) >= Number(reach)) state.reachTried = { ...state.reachTried, [reach]: (state.reachTried?.[reach] || 0) + 1 };
  const roll = 1 + Math.floor(rand(state) * 6);
  if (roll > odds && state.intuition > 0 && !childSafe(state, currentCard(state))) {
    state.pendingRoll = { side, odds, roll };
    return state;
  }
  return resolveBet(state, side, roll, odds);
}
// 子を場に置き、続柄と名前を記録して、年の締めの一行を書く
function deliverChild(state, row) {
  add(state, ['child']); state.autoKeys[state.fieldKeys.at(-1)] = true; row.changes.add.push('child');
  const n = ++state.childCount, key = state.fieldKeys.at(-1);
  const mother = pick(state, [...new Set(state.field.filter((id) => ['spouse', 'concubine', 'mistress'].includes(getStage(state).FIELD[id].role)))].sort((a, b) => getStage(state).FIELD[a].partnerPriority - getStage(state).FIELD[b].partnerPriority));
  const rel = getStage(state).text.childRel || (getStage(state).FIELD[mother]?.role === 'concubine' ? '庶子' : getStage(state).FIELD[mother]?.role === 'mistress' ? '妾腹の子' : n === 1 ? '嫡子' : '庶子');
  state.children[key] = { rel, claim: getStage(state).settings.claims[rel], support: getStage(state).FIELD[mother]?.role === 'spouse' ? 2 : 1, mother };
  row.birth = `${row.birth || ''}${n === 1 ? '長子' : `${n}番目の子`}（${rel}）が生まれた。`;
  if (getStage(state).NAMING) {
    const sons = Object.values(state.children).filter((child) => child.sex === 'son').length;
    const daughters = Object.values(state.children).filter((child) => child.sex === 'daughter').length;
    const sex = nameHash(state, `sex${n}`) % 2 ? 'son' : 'daughter', name = personName(state, sex, sex === 'son' ? sons + 1 : daughters + 1);
    Object.assign(state.children[key], { sex, name });
    row.birth += getStage(state).NAMING.birthLine(sex, sex === 'son' ? sons + 1 : daughters + 1, name);
  }
  if (n === 1 || state.featuredChildren < getStage(state).settings.featuredChildren && rand(state) < getStage(state).settings.featuredChance) {
    state.featuredChildren++;
    state.familyTimeline.push({ id: idFor(state, 'childSeven'), year: state.year + 7, key, n }, { id: idFor(state, 'childFifteen'), year: state.year + 15, key, n });
  }
}
function scheduleNextBirth(state) {
  if (state.age < 42) { const [near, far] = getStage(state).settings.birthGap || [2, 3]; scheduleFamily(state, idFor(state, 'birth'), state.year + near, Math.min(state.year + far, state.year + 42 - state.age)); }
}
function resolveBet(state, side, roll, odds) {
  const hadSpouse = has(state, 'spouse');
  const before = state.betBefore || { body: state.body, store: state.store };
  const bodyBefore = before.body, storeBefore = before.store;
  state.betBefore = null;
  const card = currentCard(state), chosenSide = side ? 'right' : 'left', bet = card[chosenSide], stake = stakeInfo(state, bet);
  const substitute = stake.what === 'substitute' ? substituteFor(state) : null;
  const guarded = card.disaster ? guards(state, card.disasterKey) : guards(state, card.id);
  const stakeFieldId = stake.index >= 0 ? state.field[stake.index] : stake.what;
  const title = betTitle(state, side);
  const won = roll <= odds;
  if (substitute === 'hire') state.store -= getStage(state).settings.hireCost;
  if (stake.type === 'spend' || stake.type === 'lock') pay(state, stake);
  if (card.always) alter(state, card.always);
  let effect = won ? bet.win : bet.lose;
  const childSpared = !!effect?.die && childSafe(state, card);
  if (childSpared) effect = { ...effect, die: false };
  if (card.contest && side === 0) {
    const rival = card.contest === 'patron' ? 'patronHouse' : 'rivalHouse';
    if (card.contest === 'water') effect = won
      ? { text: bet.win.text, add: ['waterwise'], rivalDown: rival }
      : { ...bet.lose, levelDown: 'field' };
    if (card.contest === 'boundary') effect = won
      ? { text: bet.win.text, add: [getStage(state).settings.expansionField], rivalDown: rival }
      : { ...bet.lose, remove: [fieldIdFor(state, 'field')] };
    if (card.contest === 'patron') effect = won
      ? { text: bet.win.text, add: [fieldIdFor(state, 'villageHead')], rivalDown: rival }
      : { ...bet.lose, remove: [fieldIdFor(state, 'villageTrust')] };
    if (card.contest === 'succession') effect = side === 0
      ? { text: won ? bet.win.text : fill(getStage(state).text.contest.noField, { rel: state.contestant.rel }), add: ['branchhouse'], branchOpponent: true, rel: state.contestant.rel, support: state.contestant.support, ...(!won ? { levelDown: 'field', houseDown: true } : {}) }
      : { text: fill(getStage(state).text.contest.inherited, { rel: state.contestant.rel, loss: won ? '' : getStage(state).text.contest.titleLoss }), add: ['branchhouse'], retire: 'rival', ...(!won ? { houseDown: true } : {}) };
  }
  if (card.contest === 'succession' && side === 1 && card.successionSide === 'self') effect = { text: fill(getStage(state).text.contest.surrender, { rel: state.contestant.rel, result: won ? getStage(state).text.contest.splitField : getStage(state).text.contest.littleField }), add: ['branchhouse'], houseDown: true, ...(!won ? { levelDown: 'field' } : {}) };
  else if (card.contest === 'succession' && side === 1) effect = { text: fill(getStage(state).text.contest.inherited, { rel: state.contestant.rel, loss: won ? '' : getStage(state).text.contest.titleLoss }), add: ['branchhouse'], retire: 'rival', ...(!won ? { houseDown: true } : {}) };
  applyHouseEffect(state, effect || {});
  if (effect?.conflict && has(state, 'inlaw')) effect = { ...effect, remove: [...(effect.remove || []), 'inlaw'] };
  if (effect?.meet) { const unmet = getStage(state).partnerIds.filter((id) => !state.metPartners.includes(id)); effect = unmet.length ? { ...effect, add: [...(effect.add || []), pick(state, unmet)] } : { ...effect, text: `${effect.text}けれど、心を動かす人はいなかった。` }; }
  if (won && card.role === 'maintenance') {
    const index = state.fieldKeys.indexOf(card.targetKey);
    if (index >= 0) state.fieldLevels[index]++;
  }
  if (stake.what === 'substitute' && !substitute) effect = { text: getStage(state).text.substitutes.noOneResult, add: ['coward'] };
  if (stake.what === 'substitute' && substitute && substitute !== 'hire') {
    const substituteId = fieldIdFor(state, substitute), index = state.field.indexOf(substituteId);
    const safe = won || substitute === 'servant' && index >= 0 && state.fieldLevels[index] === 3;
    effect = { text: fill(getStage(state).text.substitutes.result, { name: getStage(state).FIELD[substituteId].name, outcome: safe ? getStage(state).text.substitutes.returned : getStage(state).text.substitutes.lost }), remove: safe ? [] : [substituteId] };
  }
  if (stake.type === 'risk' && !won) {
    if (stake.what === 'body') state.body -= stake.amount;
    else if (stake.what === 'store') { const paid = Math.min(state.store, stake.amount); state.store -= paid; state.body -= stake.amount - paid; }
    else if (stake.what !== 'substitute') { const index = targetIndex(state, stake.what); if (index >= 0) removeAt(state, index); }
  }
  const row = { year: state.year, age: state.age, id: card.id, title: card.title, choice: title, art: bet.art, roll, won, text: effect?.text || '', delay: bet.delay || 0, delayed: (bet.delay || 0) > 0, odds, ...(card.role === 'maintenance' ? { targetId: state.field[state.fieldKeys.indexOf(card.targetKey)], targetLevel: card.level } : {}), changes: { add: bet.delay ? [] : [...(effect?.add || [])], remove: bet.delay ? [] : [...(effect?.remove || [])], body: 0, store: 0 } };
  if (card.contest === 'succession') { row.lineage = state.contestant.rel; row.successionSide = card.successionSide; }
  if (effect?.conflict && !row.changes.add.includes('rumor')) row.changes.add.push('rumor');
  if (effect?.divorce) row.changes.remove.push(...fieldIdsFor(state, 'spouse'));
  if (card.visitTarget && won) {
    const target = card.visitTarget, old = state.partnerHearts[target] || 1;
    state.partnerHearts[target] = Math.min(3, old + (effect?.visitBoost || 1));
    if (effect?.betroth) {
      state.betrothed = target;
      const marriage = state.familyTimeline.find((event) => ['arrangedMarriage', 'partnerMarriage'].includes(cardRole(state, event.id)));
      if (marriage) { marriage.id = idFor(state, 'partnerMarriage'); marriage.year = Math.min(marriage.year, state.year + 1); } else scheduleFamily(state, idFor(state, 'partnerMarriage'), state.year + 1);
    }
    row.heartChange = `${getStage(state).FIELD[target].name} ♥${state.partnerHearts[target]}`;
  }
  if ((stake.type === 'spend' || stake.type === 'risk' && !won) && stake.what !== 'body' && stake.what !== 'store' && stake.what !== 'substitute') row.changes.remove.unshift(stakeFieldId);
  state.history.push(row);
  if (card.demand && side === 1) resolveIgnore(state, card, row);
  if (effect) {
    if (bet.delay) state.pending.push({ due: state.year + bet.delay, effect, cardTitle: `${card.title}・${bet.title}` });
    else for (const child of alter(state, effect)) row.text += ` ${getStage(state).NAMING.birthLine(child.sex, Object.values(state.children).filter((item) => item.sex === child.sex).indexOf(child) + 1, child.name)}`;
  }
  if (card.contest === 'succession') {
    const index = state.fieldKeys.indexOf(card.successionKey);
    if (index >= 0) { const removed = removeAt(state, index); row.changes.remove.push(removed); }
    state.rivalHouse = true; state.rivalRel = state.contestant.rel;
    if (card.successionSide === 'self') state.inheritNote = fill(won ? side === 1 ? getStage(state).text.succession.noteSurrender : getStage(state).text.succession.noteWin : getStage(state).text.succession.noteLose, { rel: state.contestant.rel });
    else state.succession = side === 1 || !won ? 'rival' : 'defended';
  }
  if (card.role === 'childFifteen' && won && effect?.add?.includes('heir')) { state.heirKey = card.childKey; state.heirClaim = state.children[card.childKey]?.claim ?? getStage(state).settings.claims.heir; }
  if (won && effect?.add?.some((id) => ['villageHead', 'waterwise'].includes(getStage(state).FIELD[id]?.role))) promoteHouse(state);
  if (hadSpouse && !has(state, 'spouse')) {
    const widow = getStage(state).settings.widowItem;
    if (widow && !effect?.divorce && !state.dead && !has(state, widow)) { add(state, [widow]); row.changes.add.push(widow); }
    scheduleMarriage(state);
  }
  {
    const shifts = { ...(effect?.shift || {}) };
    if (won && card.kind === 'history' && stake.what === 'substitute' && substitute === 'father') shifts[idFor(state, 'fatherDeath')] = -1;
    row.familyShifts = [];
    for (const [id, amount] of Object.entries(shifts)) {
      const event = state.familyTimeline.find((item) => item.id === id);
      if (!event) continue;
      const before = event.year;
      event.year = Math.max(state.year + 1, event.year + amount);
      if (before !== event.year) row.familyShifts.push({ id, before, after: event.year });
    }
  }
  if (card.disaster && !won && !guarded) {
    const targets = getStage(state).disasterTargets[card.disasterType] || [];
    const index = state.field.map((id, i) => targets.includes(id) && getStage(state).FIELD[id].levels && state.fieldLevels[i] > 1 ? i : -1).filter((i) => i >= 0).sort((a, b) => state.fieldLevels[b] - state.fieldLevels[a])[0];
    if (index !== undefined) {
      const stage = fieldAt(state, index), from = stage.name;
      state.fieldLevels[index]--;
      const to = fieldAt(state, index).name;
      row.levelChange = ` ${card.title}で ${from} が ${to} に戻った`;
      row.text += row.levelChange;
    }
  }
  let inheritedStore = 0;
  if (state.age >= getStage(state).settings.adultFrom && !state.houseInherited) {
    inheritedStore = state.houseStore;
    state.store += inheritedStore;
    state.houseStore = 0;
    state.houseInherited = true;
    row.inheritance = inheritedStore ? fill(getStage(state).text.inheritance || '一人前になり、家の蓄え {n} を任された。', { n: inheritedStore }) : getStage(state).text.inheritanceNone || '一人前になった。';
  }
  const bodyBeforeYearly = state.body, storeBeforeYearly = state.store;
  if (getStage(state).settings.bodyCeiling) {
    const { bodyMaxStart, bodyMaxAdult, adultAge, bodyMaxGrowFrom, agingFrom, agingEvery } = getStage(state).settings;
    if (state.age >= bodyMaxGrowFrom) {
      const target = bodyMaxStart + Math.round((bodyMaxAdult - bodyMaxStart) * (Math.min(state.age, adultAge) - bodyMaxGrowFrom) / (adultAge - bodyMaxGrowFrom));
      const growth = target - state.bodyMaxGrowth;
      state.bodyMaxGrowth = target;
      changeBodyMax(state, growth, '体の器が育った');
    }
    if (state.age >= agingFrom && (state.age - agingFrom) % agingEvery === 0) changeBodyMax(state, -1, '老いで、体の器が少し小さくなった');
    row.bodyMaxChanges = state.bodyMaxEvents.splice(0);
  }
  const yearly = state.field.reduce((total, id, index) => {
    for (const [key, amount] of Object.entries(fieldAt(state, index).yearly || getStage(state).FIELD[id].yearly || {})) total[key] += amount;
    return total;
  }, { store: 0, body: 0 });
  const bodyLimit = getStage(state).settings.bodyCeiling ? state.bodyMax : getStage(state).settings.maxBody;
  yearly.body = Math.min(yearly.body, bodyLimit - state.body);
  const drainFloor = getStage(state).settings.yearlyDrainFloor;
  if (drainFloor && yearly.body < 0) yearly.body = Math.min(0, Math.max(yearly.body, drainFloor - state.body));
  if (state.age < getStage(state).settings.adultFrom) state.houseStore += yearly.store;
  else state.store += yearly.store;
  if (state.store < 0) {
    const index = state.field.findLastIndex((id) => ['mistress', 'concubine'].includes(getStage(state).FIELD[id].role));
    if (index >= 0) { const left = removeAt(state, index); row.changes.remove.push(left); row.unpaid = `養いきれず、${getStage(state).FIELD[left].name}が去った。`; }
    state.store = 0;
  }
  // 子が生まれるのは年の締めの出来事。札にせず、結果の画面に一行出す。
  const birth = state.familyTimeline.find((event) => cardRole(state, event.id) === 'birth' && event.year <= state.year);
  if (birth) {
    state.familyTimeline = state.familyTimeline.filter((event) => event !== birth);
    if (has(state, 'spouse') || has(state, 'mistress')) {
      const bed = getStage(state).settings.childbed, bedCard = bed && (!state.hadChildbed ? bed.first : rand(state) < bed.omenChance ? bed.hard : null);
      if (bedCard) {
        // 初めてのお産と、難産の前ぶれが来たお産だけは札にする。ここでは身ごもったと知らせ、翌年以降の札で産む
        row.birth = bedCard === bed.first ? getStage(state).text.conceivedFirst : getStage(state).text.conceivedHard;
        state.hadChildbed = true;
        state.familyTimeline.push({ id: bedCard, year: state.year + 1 });
      } else {
        if (rand(state) < getStage(state).settings.birthSurvive) deliverChild(state, row);
        else row.birth = getStage(state).text.birthLost || 'お産は難しく、子は育たなかった。';
        scheduleNextBirth(state);
      }
    }
  }
  if (effect?.deliver) {
    if (effect.deliver === 'alive') deliverChild(state, row);
    if (!state.dead) scheduleNextBirth(state);
  }
  // 幼くして亡くす子は、札にせず年の締めに知らせる（舞台の設定 infantLoss）
  const loss = getStage(state).settings.infantLoss;
  if (loss) for (let i = state.field.length - 1; i >= 0; i--) {
    if (!loss.items.includes(state.field[i]) || rand(state) >= loss.chance) continue;
    const key = state.fieldKeys[i], name = state.children[key]?.name?.split('・')[0] || '子';
    row.changes.remove.push(removeAt(state, i));
    row.birth = `${row.birth || ''}${fill(getStage(state).text.infantLost, { name })}`;
    if (loss.keep && !state.field.includes(loss.keep)) { add(state, [loss.keep]); row.changes.add.push(loss.keep); }
  }
  // 孫は札にせず、年の締めの出来事として生まれる（舞台の設定 grandchildren: { item, after, every, max }）。after の品（跡取りの縁組）があれば every 年ごとに 1 人、max 人まで
  const grand = getStage(state).settings.grandchildren;
  if (grand && has(state, grand.after) && (state.grandchildCount || 0) < grand.max) {
    state.nextGrandchild ??= state.year + grand.every;
    if (state.year >= state.nextGrandchild) {
      add(state, [grand.item]); state.autoKeys[state.fieldKeys.at(-1)] = true; row.changes.add.push(grand.item);
      state.grandchildCount = (state.grandchildCount || 0) + 1; state.nextGrandchild = state.year + grand.every;
      row.birth = `${row.birth || ''}${getStage(state).text.grandchildBorn}`;
    }
  }
  if (effect?.sendChild && card.childKey !== undefined) { const index = state.fieldKeys.indexOf(card.childKey); if (index >= 0) row.changes.remove.push(removeAt(state, index)); }
  // 想い人は通う縁: 段 3 の深い縁を除き、一人ごとに年の締めで蓄え 1 か体 1 を払う。払えない縁は離れ、品が残る。
  // 数と帳簿の値が閾値を超えると、贈り物は一人おきで済む。
  const owed = state.field.filter((id) => getStage(state).FIELD[id].role === 'lover' && (state.partnerHearts[id] || 1) < 3);
  if (owed.length && state.age >= getStage(state).settings.adultFrom) {
    let due = state.abilities.numbers > getStage(state).settings.lv3Threshold ? Math.ceil(owed.length / 2) : owed.length, paidStore = 0, paidBody = 0;
    const kept = [];
    for (const id of owed) {
      if (due <= 0) { kept.push(id); continue; }
      if (state.store >= 1) { state.store--; paidStore++; due--; kept.push(id); }
      else if (state.body > 1) { state.body--; paidBody++; due--; kept.push(id); }
    }
    const parted = owed.filter((id) => !kept.includes(id));
    for (const id of parted) {
      removeAt(state, state.field.indexOf(id)); delete state.partnerHearts[id]; row.changes.remove.push(id);
      const keep = id.replace('lover.', 'keep.'); if (getStage(state).FIELD[keep] && !state.field.includes(keep)) { add(state, [keep]); row.changes.add.push(keep); }
    }
    row.upkeep = [paidStore || paidBody ? `想い人への贈り物：${[paidStore ? `蓄え −${paidStore}` : '', paidBody ? `体 −${paidBody}` : ''].filter(Boolean).join('、')}` : '', parted.length ? `${parted.map((id) => getStage(state).FIELD[id].name).join('、')}とは通いきれず疎遠になった。思い出の品が残った。` : ''].filter(Boolean).join('　');
  }
  state.body = Math.min(bodyLimit, state.body + yearly.body);
  row.yearly = yearly;
  // 想い人と添ったときは、想い人を失ったのではなく連れ合いに変わったと見せる。
  if (card.marryTarget && row.changes.remove.includes(card.marryTarget)) {
    const to = row.changes.add.find((id) => getStage(state).FIELD[id].role === 'spouse');
    if (to) { if (getStage(state).FIELD[to].partnerName) state.spouseOf = card.marryTarget; row.changes.becomes = { from: card.marryTarget, to }; row.changes.remove = row.changes.remove.filter((id) => id !== card.marryTarget); row.changes.add = row.changes.add.filter((id) => id !== to); }
  }
  row.changes.levelUp = won && card.role === 'maintenance';
  row.changes.body = bodyBeforeYearly - bodyBefore;
  row.changes.store = storeBeforeYearly - storeBefore - inheritedStore;
  if (won && card.id !== getStage(state).specialIds.reconsider && card.axis && card.axis !== state.goal && state.age >= getStage(state).settings.adultFrom && state.goalChanges < 1 && rand(state) < getStage(state).settings.temptChance) state.reconsider = { axis: card.axis, story: `${card.title}のあと、前の世の自分が囁いた。` };
  if (state.dead) state.cause = effect?.die ? effect.text : !won && effect?.text ? `${effect.text}${getStage(state).text.diedOfIt}` : '働きすぎで倒れた';
  const added = (bet.delay ? 0 : (effect?.add || []).length) + (card.always?.add || []).length;
  state.fresh = added ? state.field.slice(-added) : [];
  if ((won || getStage(state).settings.childbed) && (effect?.add || []).some((id) => ['spouse', 'concubine'].includes(getStage(state).FIELD[id]?.role))) scheduleChild(state);
  if (['sisterMarriage', 'fatherDeath', 'motherDeath'].includes(card.role)) state.familyTimeline = state.familyTimeline.filter((item) => item.id !== card.id);
  if (card.role === 'fatherDeath') {
    state.head = true;
    state.familyTimeline = state.familyTimeline.filter((item) => cardRole(state, item.id) !== 'fatherDeath');
    const rival = successionCandidate(state);
    if (rival && !state.familyTimeline.some((item) => cardRole(state, item.id) === 'succession')) {
      const event = { id: idFor(state, 'succession'), year: state.year + 1, key: rival.key, side: 'self' };
      state.familyTimeline.push(event); setNext(state, successionCard(state, cardById(state, event.id), event));
    }
  }
  if (['succession', 'villageHead', 'retirement', 'arrangedMarriage', 'partnerMarriage', 'divorce'].includes(card.role)) state.familyTimeline = state.familyTimeline.filter((item) => item.id !== card.id);
  if (['arrangedMarriage', 'partnerMarriage'].includes(card.role) && !has(state, 'spouse')) scheduleMarriage(state);
  state.result = row;
  if (!state.nextCardId) setNext(state, drawCard(state, state.year + 1, state.age + 1, !!(card.year || card.disaster)));
  if (state.dead) state.cause ||= card.title;
  if (won && card.axis === state.goal) state.intuition = Math.min(getStage(state).settings.intuitionMax, state.intuition + 1);
  if (childSafe(state, card) && !state.dead && (state.body <= 0 || childSpared)) { state.body = Math.max(1, state.body); row.text = `${row.text || ''}${getStage(state).text.childSpared || ''}`; }
  finishIfDead(state, !won && effect?.text ? `${effect.text}${getStage(state).text.diedOfIt}` : '働きすぎで倒れた');
  return state;
}
export function reroll(state) {
  if (!state.pendingRoll || state.intuition < 1 || state.dead) return state;
  const { side, odds } = state.pendingRoll;
  state.pendingRoll = null; state.intuition--; state.intuitionUsed++;
  const roll = 1 + Math.floor(rand(state) * 6);
  if (roll > odds && state.intuition > 0) state.pendingRoll = { side, odds, roll };
  else resolveBet(state, side, roll, odds);
  return state;
}
export function acceptRoll(state) {
  if (!state.pendingRoll || state.dead) return state;
  const { side, odds, roll } = state.pendingRoll;
  state.pendingRoll = null;
  return resolveBet(state, side, roll, odds);
}
function scheduleRetirement(state) {
  if (state.retired || state.age < 55 || !has(state, 'grownchild') && !has(state, 'heir') || state.used.includes(idFor(state, 'retirement')) || state.familyTimeline.some((item) => cardRole(state, item.id) === 'retirement')) return;
  const last = Math.max(state.year, getStage(state).birthYear + 65);
  state.familyTimeline.push({ id: idFor(state, 'retirement'), year: state.year + Math.floor(rand(state) * (last - state.year + 1)) });
}
export function isAutoYear(state) {
  const card = currentCard(state);
  return !!state.retired && !!card && !card.year && !card.family && !card.familyAge && card.role !== 'birth' && card.category !== 'child';
}
export function advanceAutoYear(state) {
  if (!isAutoYear(state)) return state;
  state.intuition = 0;
  setCurrent(state, getStage(state).CARDS.find((card) => card.role === 'quietCard'));
  choose(state, 0);
  return state.dead ? state : advanceYear(state);
}
export function advanceYear(state) {
  if (state.dead || !state.result) return state;
  state.age++; state.year++; state.result = null; state.fresh = []; state.reconsider = null;
  if (getStage(state).settings.abilityDecay) for (const [id, ability] of Object.entries(ABILITIES)) state.abilities[id] = Math.max(0, state.abilities[id] - getStage(state).settings[ability.layer === 'head' ? 'decayHead' : 'decayBody']);
  const parted = [];
  if (parted.length) {
    for (const { id, index } of parted) { removeAt(state, index); const keep = id.replace('lover.', 'keep.'); if (getStage(state).FIELD[keep] && !state.field.includes(keep)) add(state, [keep]); }
    state.history.push({ year: state.year, age: state.age, id: getStage(state).specialIds.parting, title: getStage(state).text.partingTitle, choice: getStage(state).text.partingChoice, art: getStage(state).text.partingArt, roll: 0, won: false, text: `${parted.map(({ id }) => getStage(state).FIELD[id].name).join('、')}${getStage(state).text.partingText}`, changes: { add: [], remove: parted.map(({ id }) => id), body: 0, store: 0 } });
    for (const { id } of parted) delete state.partnerHearts[id];
  }
  for (const lock of state.locked.filter((item) => item.until <= state.year)) { add(state, [lock.id]); state.fieldLevels[state.fieldLevels.length - 1] = lock.level || 1; }
  state.locked = state.locked.filter((item) => item.until > state.year);
  const due = state.pending.filter((item) => item.due <= state.year);
  state.pending = state.pending.filter((item) => item.due > state.year);
  for (const item of due) {
    alter(state, item.effect);
    if (item.effect.die) state.cause = item.effect.text || `${item.cardTitle}の結果`;
  }
  state.field.forEach((id, index) => {
    const ageOf = state.year - state.fieldYears[index];
    if (getStage(state).NAMING && ['child', 'grownchild'].includes(id) && !state.children[state.fieldKeys[index]]) {
      const child = recordChild(state, state.fieldKeys[index]), row = state.history.at(-1);
      if (row) row.text += ` ${child.name}が家族に加わった。`;
    }
    const growUp = getStage(state).settings.growUp?.[id];
    if ((id === 'father' && state.age >= 30) || (growUp ? ageOf >= growUp.age : id === 'child' && ageOf >= 15)) {
      const grown = id === 'father' ? 'oldfather' : growUp?.to || 'grownchild';
      state.field[index] = grown; state.fieldYears[index] = state.year; state.fresh.push(grown);
    }
  });
  scheduleRetirement(state);
  if (state.familyTimeline.some((item) => cardRole(state, item.id) === 'retirement' && item.year <= state.year)) setNext(state, drawCard(state, state.year, state.age));
  const bodyBeforeAgeLoss = state.body;
  if (state.age >= getStage(state).settings.oldAgeFrom) state.body -= getStage(state).settings.oldAgeLoss;
  const cause = state.body <= 0 ? bodyBeforeAgeLoss > 0 ? '老いて体が尽きた' : '働きすぎで倒れた' : '老衰';
  finishIfDead(state, cause);
  if (state.dead) return state;
  let card = nextCard(state) || drawCard(state, state.year, state.age, !!(currentCard(state)?.year || currentCard(state)?.disaster));
  if (!card.year && !eligible(state, card, state.age)) card = drawCard(state, state.year, state.age);
  if (card.role === 'medicine') card = customizeCard(state, cardById(state, card.id));

  if (!playable(state, card)) card = pick(state, getStage(state).CARDS.filter((item) => item.quiet && eligible(state, item, state.age) && playable(state, item)));
  setCurrent(state, card);
  setNext(state, drawCard(state, state.year + 1, state.age + 1, !!(card.year || card.disaster)));
  return state;
}
export function meters(state) { return totalMarks(state); }
// 軸ごとに届いた梯子の段（増分として数える点のある品の、いちばん高い段）。範囲を持たない舞台では null
export function axisReach(state) {
  if (!getStage(state).SCOPES) return null;
  return Object.fromEntries(AXIS_IDS(state).map((axis) => [axis, Math.max(0, ...state.field.map((id, index) => markAt(state, id, index, axis) - (state.innateMarks?.[state.fieldKeys[index]]?.[axis] || 0) > 0 ? rungAt(state, index) : 0))]));
}
// 生きた道。範囲を持つ舞台は、点の大小ではなく届いた段で決める（軸ごとに点の大きさが揃わないため。2026-11-03 orange「同じ誓いの中の位置で測る」）。
// 同じ段なら誓った軸、次に点の多い軸
export function livedAxis(state) {
  const score = meters(state), reach = axisReach(state), ids = AXIS_IDS(state);
  if (!reach) return ids.reduce((best, current) => score[current] > score[best] ? current : best, ids[0]);
  return ids.reduce((best, current) => reach[current] > reach[best] || (reach[current] === reach[best] && best !== state.goal && (current === state.goal || score[current] > score[best])) ? current : best, ids[0]);
}
export function houseEnding(state) {
  const text = getStage(state).text.houseEnding;
  const index = state.field.findIndex((id) => getStage(state).FIELD[id].role === 'house'), rank = getStage(state).LAYERS.village.ranks[state.fieldLevels[index] - 1] || getStage(state).LAYERS.village.ranks[0];
  const heir = has(state, 'heir') || has(state, 'grownchild');
  const ending = { inherit: text.inherited, divide: text.divided, rival: `${state.rivalRel}${text.rival}`, defended: `${state.rivalRel}${text.defended}` }[state.succession] || text.ended;
  return `${text.heading}${rank}。${state.inheritNote ? `${state.inheritNote}。` : ''}${ending}。${text.heir}${heir ? text.yes : text.no}。`;
}
export function lifeTitle(state) {
  const text = getStage(state).text;
  const score = meters(state), axis = livedAxis(state), reach = axisReach(state);
  // 範囲を持つ舞台は、生きた道で町の段（titleRung）に届かなければ冠の言葉を付けない
  const plain = reach && reach[axis] < (getStage(state).settings.titleRung ?? 2);
  const crown = state.goal === 'love' && score.love <= 0 ? text.lifeTitles.loveless : state.goal === 'love' && state.metPartners.length >= 3 && score.love >= 5 ? text.lifeTitles.celebratedLove : plain ? text.lifeTitles.plain : text.lifeTitles[axis];
  const role = text.lifeRoleOf?.find(([id]) => has(state, id))?.[1] || (rankLevel(state) >= 3 ? text.lifeRoles.champion : rankLevel(state) >= 2 ? text.lifeRoles.rank2
    : rankLevel(state) >= 2 && hasRole(state, 'villageHead') ? text.lifeRoles.knownVillageHead
      : hasRole(state, 'villageHead') ? text.lifeRoles.villageHead
        : has(state, 'storehouse') ? text.lifeRoles.storehouse
          : has(state, 'trade') ? text.lifeRoles.merchant
            : hasRole(state, 'merit') || rankLevel(state) >= 1 ? text.lifeRoles.rank1
              : has(state, 'master') || has(state, 'disciple') ? text.lifeRoles.martial
                : has(state, 'hermitage') ? text.lifeRoles.hermit : text.lifeRoles.general);
  return `${crown}、${has(state, 'kanto') ? text.lifeTitles.kantoPrefix : ''}${role}`;
}
