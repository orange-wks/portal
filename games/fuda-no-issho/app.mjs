import { artFor } from './art.mjs';
import { MARKS, afterLines, scopeAt, acceptRoll, advanceAutoYear, advanceChildhood, advanceYear, answerReconsider, demandNote, fieldLabel, fieldTouches, birthOrderLabels, betTitle, volunteerLine, canChoose, childhoodOf, choose, currentCard, isQuietYear, declareGoal, fieldAt, houseEnding, isAutoYear, lifeTitle, livedAxis, axisReach, meters, personName, nextCard, oddsFor, reroll, skipChildhood, start, substituteFor } from './game.mjs';
import { DEFAULT_STAGE, STAGES } from './stages/index.mjs';
import { COMMON_GLOSSARY, glossaryParts } from './glossary.mjs';
import { ABILITIES, topAbilities } from './abilities.mjs';
import { AUTHOR_LABELS, cardAuthor, itemAuthor } from './authors.mjs';
const currentStage = () => state.stageData;
const yearLabel = (year) => currentStage().yearLabel(year);
const fill = (template, values) => Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);

// 版が替わって読み直しても、選んでいた舞台のままにする
const rememberedStage = () => { try { const id = localStorage.getItem('stage'); return STAGES[id] ? id : null; } catch { return null; } };
let stageParam = new URLSearchParams(location.search).get('stage') || rememberedStage() || DEFAULT_STAGE;
// 開くたびに別の一生にする。?seed= を付ければ同じ一生をやり直せる
const seedParam = Number(new URLSearchParams(location.search).get('seed'));
// 一生は舞台ごとに保存し、読み直しても続きから遊べるようにする。?seed= を付けたときは保存を読まない
const lifeKey = (stage) => `life:${stage}`;
const saveLife = () => { try { const { stageData, ...rest } = state; localStorage.setItem(lifeKey(rest.stage), JSON.stringify(rest)); } catch { /* 保存できなくても遊べる */ } };
const savedLife = (stage) => { try { const saved = JSON.parse(localStorage.getItem(lifeKey(stage))); return saved && { ...saved, stageData: STAGES[stage] }; } catch { return null; } };
const newLife = (stage) => start((Math.floor(Math.random() * 0xfffffffe) + 1) >>> 0, { stage });
let state = Number.isInteger(seedParam) && seedParam > 0 ? start(seedParam, { stage: stageParam }) : savedLife(stageParam) || newLife(stageParam);
let timer;
let glossarySeen;
const $ = (id) => document.getElementById(id);
const esc = (value) => { const node = document.createElement('span'); node.textContent = value ?? ''; return node.innerHTML; };
const g = (value) => glossaryParts(String(value ?? ''), { ...COMMON_GLOSSARY, ...currentStage().glossary }, glossarySeen).map(({ text, explanation }) => `${esc(text)}${explanation ? `<span class="glossary-term"><span class="glossary-info" role="button" tabindex="0" aria-label="${esc(text)}の説明" aria-expanded="false">ⓘ</span><span class="glossary-tip" hidden>${esc(text)}：${esc(explanation)}</span></span>` : ''}`).join('');
function wireGlossary(root) {
  root.querySelectorAll('.glossary-info').forEach((info) => {
    const tip = info.nextElementSibling;
    const toggle = (event) => {
      event.preventDefault(); event.stopPropagation();
      const opening = tip.hidden;
      document.querySelectorAll('.glossary-tip:not([hidden])').forEach((open) => { open.hidden = true; open.previousElementSibling.setAttribute('aria-expanded', 'false'); });
      if (!opening) return;
      tip.hidden = false; info.setAttribute('aria-expanded', 'true');
      const rect = info.getBoundingClientRect();
      tip.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - 248))}px`;
      const top = rect.bottom + 6;
      tip.style.top = `${top + tip.offsetHeight <= innerHeight - 8 ? top : Math.max(8, rect.top - tip.offsetHeight - 6)}px`;
    };
    info.addEventListener('click', toggle);
    info.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') toggle(event); });
  });
}
document.addEventListener('click', () => document.querySelectorAll('.glossary-tip:not([hidden])').forEach((tip) => { tip.hidden = true; tip.previousElementSibling.setAttribute('aria-expanded', 'false'); }));
// 舞台の切り替え。画面のいちばん上にいつも出す。押すと、その舞台で新しい一生を 0 歳から始める（Artifact では URL の ?stage= が使えないため）
function showStageHeading() {
  document.title = currentStage().display.title;
  const tabs = Object.values(STAGES).map((stage) => `<button type="button" data-stage="${esc(stage.id)}"${stage.id === currentStage().id ? ' class="now" aria-pressed="true"' : ''}>${esc(stage.display.short || stage.display.heading[0])}</button>`).join('');
  document.querySelector('.place-mark').innerHTML = `<span class="stage-tabs">${tabs}</span>`;
  document.querySelectorAll('.stage-tabs [data-stage]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.stage === currentStage().id) return;
    stageParam = button.dataset.stage;
    try { localStorage.setItem('stage', stageParam); } catch { /* 保存できなくても遊べる */ }
    state = savedLife(stageParam) || newLife(stageParam);
    showStageHeading(); render();
  }));
}
showStageHeading();
function image(id, title, cls = '') {
  const path = artFor(id);
  return path ? `<div class="art ${cls}"><img src="${esc(path)}" alt="${esc(title)}"></div>` : `<div class="art ${cls}" data-art-id="${esc(id)}" role="img" aria-label="${esc(title)}">${esc(title)}</div>`;
}
// 札を押すと、横の欄に詳しいことを出す。場の札は効き目と来歴、年表の札はその年に何が起きたか。
const fieldName = (id) => currentStage().FIELD[id]?.name || id;
const guardName = (id) => ({ 'dis.fire': '火事', 'dis.flood': '洪水', 'dis.famine': '凶作', 'dis.plague': '熱病', 'dis.fever': '熱病' }[id] || currentStage().cardById?.get(id)?.title || id);
const when = (year) => `${yearLabel(year)}（${year - currentStage().birthYear}歳）`;
const dots = (value) => { const level = value > 0.67 ? 3 : value >= 0.33 ? 2 : 1; return `${'●'.repeat(level)}${'○'.repeat(3 - level)}`; };
function showDetail(html) {
  const panel = $('detail');
  panel.innerHTML = `<button class="detail-close" type="button" aria-label="閉じる">×</button>${html}`;
  panel.hidden = false; wireGlossary(panel);
  panel.querySelector('.detail-close').addEventListener('click', hideDetail);
}
function hideDetail() { $('detail').hidden = true; }
function sourceOf(index) {
  const id = state.field[index], year = state.fieldYears[index];
  if (id === state.pastId) return `${when(year)}の終わりに、前の世の記憶が戻った。`;
  const row = state.history.find((h) => h.year === year && (h.changes?.add || []).includes(id));
  if (row) return `${when(year)}、「${row.title}」で「${row.choice}」を選んで得た。`;
  const child = state.childhoodHistory.find((h) => h.year === year);
  return child ? `${when(year)}、「${child.title}」の年から。` : `${when(year)}から。`;
}
function siblingRows() {
  const birth = currentStage().birthYear; let elderBrothers = 0;
  const order = birthOrderLabels(state);
  return (state.siblings?.list || []).map((sib, i) => ({ sib, i })).filter(({ sib }) => sib.elder || sib.bornAge <= state.age).map(({ sib, i }) => {
    const name = sib.rel === '兄' && !elderBrothers++ ? personName(state, '兄') : personName(state, sib.male ? '弟' : '妹', { slot: 200 + i });
    const born = sib.elder ? '上の子' : `${yearLabel(birth + sib.bornAge)}生まれ`;
    const died = sib.dies && sib.deathAge <= state.age ? `・${yearLabel(birth + sib.deathAge)}に亡くなった` : '';
    return `<li><b>${esc(sib.rel)}</b> ${name ? `${esc(name)}（${order[i]}）` : order[i]}　<small>${born}${died}</small></li>`;
  }).join('');
}
// 誓いの時点で場にあった札は、一生の点に数えない（舞台の設定 scoreGainsOnly）
const isInnate = (index) => Boolean(state.innateMarks && state.fieldKeys[index] in state.innateMarks);
// メーターの棒。点を範囲で何倍にもする舞台（scopeWeight）では、いちばん高い軸を端にして比べる
const meterWidth = (values, axis) => Math.max(0, Math.min(100, currentStage().settings.scopeWeight ? values[axis] * 100 / Math.max(10, ...Object.values(values)) : values[axis] * 10));
function fieldDetail(index) {
  const id = state.field[index], field = currentStage().FIELD[id], stage = fieldAt(state, index), level = field.levels ? state.fieldLevels[index] : 0;
  const marks = Object.entries(field.marks).filter(([, n]) => n).map(([axis, n]) => `${MARKS[axis]} ${esc(currentStage().AXES[axis]?.name || axis)} ${n > 0 ? '+' : ''}${n}`);
  const yearly = Object.entries(stage.yearly || field.yearly || {}).map(([key, n]) => `毎年 ${key === 'store' ? '蓄え' : '体'} ${n > 0 ? '+' : ''}${n}`);
  const guards = [...new Set([...(field.guard || []), ...(stage.guard || [])])].map((guard) => `「${esc(guardName(guard))}」に強い`);
  const innate = isInnate(index) && marks.length;
  const scopes = currentStage().SCOPES, scope = scopeAt(state, index), weight = (currentStage().settings.scopeWeight || 1) ** (scope - 1);
  const reach = scopes && marks.length ? [`届く範囲：${scopes[scope - 1]}${weight > 1 ? `（点は ${weight} 倍で数える）` : ''}`] : [];
  const effects = [...reach, ...marks.map((line) => innate ? `<span class="innate">${line}</span>` : line), ...(innate ? ['生まれ持ったもの。この札の点は一生の点に数えない（ここからの段上がりは数える）'] : []), ...yearly, ...guards];
  const levels = field.levels ? `<h3>段</h3><ol class="detail-levels">${field.levels.map((lv, i) => `<li${i + 1 === level ? ' class="now"' : ''}>${esc(lv.name)}${lv.yearly ? `　<small>${Object.entries(lv.yearly).map(([k, n]) => `毎年${k === 'store' ? '蓄え' : '体'}+${n}`).join(' ')}</small>` : ''}</li>`).join('')}</ol>` : '';
  let extra = '';
  if (field.role === 'siblings' && state.siblings) extra = `<h3>きょうだい</h3><ul class="detail-list">${siblingRows() || '<li>いない</li>'}</ul>`;
  if (field.kind === '前世') extra = `<h3>前世の能力</h3><ul class="detail-list">${Object.keys(ABILITIES).filter((a) => state.abilities[a] > 0).sort((a, b) => state.abilities[b] - state.abilities[a]).map((a) => `<li>${ABILITIES[a].icon} <b>${esc(ABILITIES[a].name)}</b> ${dots(state.abilities[a])}<br><small>${esc(ABILITIES[a].description)}</small></li>`).join('')}</ul>${state.pastText ? `<p>${esc(state.pastText)}</p>` : ''}`;
  if (id === 'kinsman') { const kin = state.kinship[state.fieldKeys[index]]; if (kin) extra = `<h3>跡目</h3><p>筋 ${kin.claim}（跡目を名乗れる近さ）・後ろ盾 ${kin.support}（味方の多さ）</p>`; }
  if (field.role === 'lover') { const hearts = state.partnerHearts[id] || 1; extra = `<p>想い ${'♥'.repeat(hearts)}${'♡'.repeat(3 - hearts)}</p>`; }
  showDetail(`<p class="eyebrow">${esc(field.kind)}</p><h2>${g(fieldLabel(state, index))}</h2>${image(stage.art || field.art, stage.name)}${effects.length ? `<h3>効き目</h3><ul class="detail-list">${effects.map((e) => `<li>${e}</li>`).join('')}</ul>` : ''}${levels}${extra}<h3>来歴</h3><p>${esc(sourceOf(index))}</p><p class="detail-author">書き手：${esc(AUTHOR_LABELS[itemAuthor(currentStage(), state.field[index])])}</p>`);
}
function yearDetail(row) {
  if (row.child) return showDetail(`<p class="eyebrow">${when(row.year)}</p><h2>${esc(row.title)}</h2>${image(row.art, row.title)}${row.story ? `<p>${esc(row.story)}</p>` : ''}`);
  const changes = [...(row.changes?.add || []).map((id) => `得た：${esc(fieldName(id))}`), ...(row.changes?.remove || []).map((id) => `失った：${esc(fieldName(id))}`), ...[row.rankChange, row.heartChange, row.vowChange].filter(Boolean).map(esc)];
  const roll = row.odds ? `<p class="detail-roll">勝つ目 1〜${row.odds}、出目 ${row.roll}：${row.won ? '勝ち' : '負け'}</p>` : '';
  showDetail(`<p class="eyebrow">${when(row.year)}</p><h2>${esc(row.cardTitle || row.title)}</h2>${image(row.art, row.title)}<p>選んだ：<b>${esc(row.choice)}</b></p>${roll}${row.text ? `<p>${esc(row.text)}</p>` : ''}${changes.length ? `<ul class="detail-list">${changes.map((c) => `<li>${c}</li>`).join('')}</ul>` : ''}${currentStage().cardById?.has(row.id) ? `<p class="detail-author">書き手：${esc(AUTHOR_LABELS[cardAuthor(currentStage(), row.id)])}</p>` : ''}`);
}
function renderTimeline() {
  const root = $('timeline'); root.replaceChildren();
  const rows = [
    ...state.childhoodHistory.map((h) => ({ ...h, child: true })),
    ...state.history.map((h) => ({ ...h, cardTitle: h.title, title: h.choice, art: h.art })),
  ];
  for (let year = state.stageData.birthYear; year <= state.year + (state.goal ? 1 : 0); year++) {
    const row = rows.find((item) => item.year === year), current = year === state.year;
    const card = document.createElement('div');
    card.className = `year-card${current ? ' current' : ''}${row ? ' past' : ''}${!row && !current ? ' face-down' : ''}`;
    if (row) { card.innerHTML = `<strong>${yearLabel(year)}</strong><small>${row.age}歳</small>${image(row.art, row.title, 'stamp')}<b class="past-title">${esc(row.title)}</b>`; card.classList.add('clickable'); card.addEventListener('click', () => yearDetail(row)); }
    else if (current) card.innerHTML = `<strong>${yearLabel(year)}</strong><small>${state.age}歳</small><b class="past-title">${state.result ? esc(state.result.choice) : ''}</b>`;
    else {
      const family = state.familyTimeline.find((item) => item.year === year);
      const omen = family ? currentStage().FAMILY_OMENS[family.id] : nextCard(state)?.omen;
      card.innerHTML = `<strong>${year === state.year + 1 ? yearLabel(year) : '…'}</strong><small>${year === state.year + 1 ? `${state.age + 1}歳` : ''}</small>${family ? '<i class="family-mark" aria-label="家族の節目">家</i>' : ''}<b class="past-title">${year === state.year + 1 && omen ? esc(omen) : 'この先'}</b>`;
    }
    root.append(card);
  }
}
// 場の札の区分。札の種類（kind）を 5 つにまとめる。知らない種類は「その他」
const FIELD_GROUPS = [
  ['people', '人', ['家族', '縁', '相手の家', '里の人々']],
  ['house', '家と土地', ['家', '田', '暮らし', '仕事', '身分']],
  ['self', '自分', ['前世', '体', '知恵', '品', '持ち物']],
  ['burden', '重荷', ['重荷']],
  ['world', '世の中', ['遠くの歴史', '季節']],
];
let fieldTab = 'all';
const groupOf = (id) => FIELD_GROUPS.find(([, , kinds]) => kinds.includes(currentStage().FIELD[id].kind))?.[0] || 'other';
function renderFieldTabs() {
  const counts = {}; for (const id of state.field) counts[groupOf(id)] = (counts[groupOf(id)] || 0) + 1;
  const tabs = [['all', 'すべて', state.field.length], ...FIELD_GROUPS.map(([key, name]) => [key, name, counts[key] || 0]), ...(counts.other ? [['other', 'その他', counts.other]] : [])];
  $('field-tabs').innerHTML = tabs.map(([key, name, n]) => `<button type="button" class="field-tab${key === fieldTab ? ' selected' : ''}" data-tab="${key}"${n ? '' : ' disabled'}>${name}<small>${n}</small></button>`).join('');
  $('field-tabs').querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { fieldTab = button.dataset.tab; renderTableau(); }));
}
function renderTableau() {
  const root = $('tableau'); root.replaceChildren();
  root.setAttribute('aria-label', '暮らし');
  const values = meters(state);
  const self = document.createElement('article'); self.className = 'state-card self-card';
  self.innerHTML = `<header><b>${esc(personName(state, 'self') || '自分')}</b><strong>${state.age}歳 · 体 ${state.body}${currentStage().settings.bodyCeiling ? ` / ${state.bodyMax}` : ''} · 蓄え ${state.store}</strong></header>${state.age < currentStage().settings.adultFrom ? `<small>家の蓄え ${state.houseStore}</small>` : ''}<div class="meters">${Object.entries(currentStage().AXES).map(([axis, info]) => `<span class="meter${axis === state.goal ? ' selected' : ''}" title="${esc(info.name)}"><i>${MARKS[axis]}</i><b class="meter-track"><u style="width:${meterWidth(values, axis)}%"></u></b><small>${values[axis]}</small></span>`).join('')}</div><small class="vow">${g('誓い')} ${MARKS[state.goal] || ''}　${g('前世の勘')} ${'●'.repeat(state.intuition)}${'○'.repeat(Math.max(0, currentStage().settings.intuitionMax - state.intuition))}</small>`;
  root.append(self);
  // 今年の札に関わる札と、今年来た札は、どの区分を開いていても前に出す
  const pinned = [...new Set([...(state.goal && !state.dead ? fieldTouches(state) : []), ...state.field.flatMap((id, i) => state.fresh.includes(id) ? [i] : [])])];
  const order = [...pinned, ...state.field.map((_, i) => i).filter((i) => !pinned.includes(i) && (fieldTab === 'all' || groupOf(state.field[i]) === fieldTab))];
  renderFieldTabs();
  for (const index of order) {
    const id = state.field[index];
    if (pinned.length && index === order[pinned.length]) { const gap = document.createElement('span'); gap.className = 'pinned-gap'; root.append(gap); }
    const field = currentStage().FIELD[id], stage = fieldAt(state, index), level = field.levels ? state.fieldLevels[index] : 0;
    const card = document.createElement('article');
    card.className = `state-card field-card clickable${state.fresh.includes(id) ? ' fresh' : ''}${pinned.includes(index) && !state.fresh.includes(id) ? ' touched' : ''}`;
    card.addEventListener('click', (event) => { if (!event.target.closest('.glossary-term')) fieldDetail(index); });
    const yearly = Object.entries(stage.yearly || field.yearly || {}).map(([key, n]) => `毎年 ${key === 'store' ? '蓄え' : '体'} ${n > 0 ? '+' : ''}${n}`).join(' ');
    const guards = [...new Set([...(field.guard || []), ...(stage.guard || [])])].map((id) => ({ 'dis.fire': '火事', 'dis.flood': '洪水', 'dis.famine': '凶作', 'dis.plague': '熱病', 'dis.fever': '熱病' }[id] || id).slice(0, 2));
    const label = fieldLabel(state, index).replace(/（力([1-3])）$/, (_, n) => `・勢い ${'●'.repeat(Number(n))}${'○'.repeat(3 - Number(n))}`);
    const abilityLine = field.kind === '前世' ? abilityBadges(true) : '';
    card.innerHTML = `<header><span class="token">${index + 1}</span><b>${g(label)}</b>${level ? `<i class="field-level" title="段">${g('段')} ${'●'.repeat(level)}${'○'.repeat(3 - level)}</i>` : ''}</header>${image(stage.art || field.art, stage.name)}<p${isInnate(index) && Object.values(field.marks).some(Boolean) ? ' class="innate" title="生まれ持ったもの（一生の点に数えない）"><small>生得</small> ' : '>'}${Object.entries(field.marks).map(([axis, n]) => `${MARKS[axis]}${n > 0 ? '+' : ''}${n}`).join(' ')}${field.role === 'lover' ? `　${'♥'.repeat(state.partnerHearts[id] || 1)}` : ''}</p>${abilityLine}${yearly || guards.length ? `<small class="field-yield">${[yearly, ...guards.map((name) => `${name}に強い`)].filter(Boolean).join('　')}</small>` : ''}`;
    root.append(card);
  }
  for (const item of state.locked) {
    const card = document.createElement('article'); card.className = 'state-card field-card locked-card';
    card.innerHTML = `<header><b>${esc(item.id && currentStage().FIELD[item.id].name)}</b></header><p>${item.until - state.year}年後に戻る</p>`; root.append(card);
  }
  wireGlossary(root);
}
function stakeText(bet) {
  if (!bet.stake) return '';
  const stake = bet.stake || {}, amount = stake.amount ?? 1;
  if (stake.what === 'substitute') return '家の者が代わりに出る';
  const what = stake.what === 'body' ? `体${amount}` : stake.what === 'store' ? `蓄え${amount}` : stake.what?.startsWith('kind:') ? `${stake.what.slice(5)}札` : stake.what ? `${currentStage().FIELD[stake.what]?.name || stake.what}` : 'なし';
  if (stake.type === 'risk') return bet.lose?.die ? '' : `負ければ${what}を失う`;
  if (stake.type !== 'spend') return `${what}が${stake.years}年使えない`;
  return `${what}・払う`;
}
function shortfallText(bet) {
  const need = (bet.stake?.what === 'store' && bet.stake.type === 'spend' ? bet.stake.amount ?? 1 : 0) + (bet.cost?.store || 0);
  const lack = need - Math.max(state.store, 0);
  return need && lack > 0 ? `足りない分は体${lack}` : '';
}
function costText(bet) {
  return Object.entries(bet.cost || {}).filter(([, n]) => n).map(([key, n]) => `${key === 'body' ? '体' : '蓄え'} ${n}`).join('・');
}
function renderGoal() {
  $('event').innerHTML = `<p class="eyebrow">${yearLabel(currentStage().birthYear + 6)} · 6歳</p>${image('event.awakening', '今生の誓い', 'scene-stamp')}<h1>今生の誓い</h1><p class="story">今生では、何を目指す？</p><div class="goal-options">${Object.entries(currentStage().AXES).map(([axis, info]) => `<button data-axis="${axis}"><b>${MARKS[axis]} ${esc(info.name)}</b><span>${esc(info.here)}</span></button>`).join('')}</div>`;
  $('event').querySelectorAll('[data-axis]').forEach((button) => button.addEventListener('click', () => { state = declareGoal(state, button.dataset.axis); render(); }));
}
// 前世の能力は題名に混ぜず、アイコン付きの札として別の欄に並べる。
function abilityBadges(compact = false) {
  return `<span class="ability-badges">${topAbilities(state.abilities).map((ability) => { const value = state.abilities[ability], level = value > 0.67 ? 3 : value >= 0.33 ? 2 : 1; return `<span class="ability-badge${compact ? ' compact' : ''}" title="${esc(ABILITIES[ability].name)}"><i>${ABILITIES[ability].icon}</i>${compact ? '' : `${g(ABILITIES[ability].name)} `}<b>${'●'.repeat(level)}${'○'.repeat(3 - level)}</b></span>`; }).join('')}</span>`;
}
function renderPastIntro() {
  const field = currentStage().FIELD[state.pastId];
  $('event').innerHTML = `<p class="eyebrow">${yearLabel(currentStage().birthYear + 6)} · 6歳</p>${image(field.art, field.name, 'scene-stamp')}<h1>${esc(state.pastName || field.name)}</h1>${abilityBadges()}<p class="story">前の世の記憶が戻った。</p>${state.siblings?.recall ? `<p class="story">${esc(state.siblings.recall)}</p>` : ''}<p class="story">${esc(state.pastText || field.habit || field.name)}</p><p class="story">その記憶が、今生のあなたに力を添える。</p><button id="past-continue" class="next-year">今生の誓いを立てる</button>`;
  $('past-continue').addEventListener('click', () => { state.pastIntro = false; render(); });
}
function renderCard() {
  const card = currentCard(state), root = $('event');
  if (state.pendingRoll) {
    root.innerHTML = `<h1>負けの目が出た</h1><p class="story">${g('前世の勘')}で振り直すか、この結果を受け入れる。</p><div class="roll-options"><button id="reroll" class="next-year">${g('前世の勘')}で振り直す（残り ${state.intuition}）</button><button id="accept-roll" class="next-year">受け入れる</button></div>`;
    wireGlossary(root);
    $('reroll').addEventListener('click', () => { state = reroll(state); render(); });
    $('accept-roll').addEventListener('click', () => { state = acceptRoll(state); render(); });
    return;
  }
  const twoCards = card.scene || card.left.head || card.right.head;
  const ignoreSource = card.demand && substituteFor(state), sourceIndex = state.field.findIndex((id) => currentStage().FIELD[id].role === ignoreSource), certain = ignoreSource === 'hire' || sourceIndex >= 0 && ignoreSource === 'servant' && state.fieldLevels[sourceIndex] === 3;
  root.classList.toggle('two-card', !!twoCards);
  root.innerHTML = `<p class="eyebrow">${yearLabel(state.year)} · ${state.age}歳</p>${twoCards ? `<p class="scene">${g(card.scene || card.story)}</p>${card.scene && (card.year || card.disaster || card.family || card.familyAge) ? `<p class="story">${g(card.story)}</p>` : ''}` : `${image(card.art, card.title, 'scene-stamp')}<h1>${g(card.title)}</h1><p class="story">${g([card.story, volunteerLine(state, card)].filter(Boolean).join(''))}</p>`}<div class="bets">${['left', 'right'].map((side, i) => {
    const bet = card[side], enabled = canChoose(state, i);
    const odds = oddsFor(state, card, side, bet.odds), stakeId = bet.stake?.what;
    const unavailable = !enabled && bet.minStore > state.store ? `蓄え ${bet.minStore} が要る` : !enabled && stakeId && !['body', 'store', 'substitute'].includes(stakeId) ? `${currentStage().FIELD[stakeId]?.name || stakeId.replace("kind:", "")}が無い` : !enabled ? '体の余力が無い' : '';
    const guarded = card.disaster && state.field.some((id, index) => [...(currentStage().FIELD[id].guard || []), ...(fieldAt(state, index).guard || [])].includes(card.id));
    const label = currentStage().text.demandSources?.[card.id];
    const ignoreOdds = card.ignore?.odds;
    return `<button class="bet bet-${side}${card.demand && i === 0 ? ' demand-side' : ''}" data-side="${i}" ${enabled ? '' : 'disabled'}>${unavailable ? `<small class="unavailable">${g(unavailable)}</small>` : ''}${twoCards ? `${card.demand && i === 0 && label ? `<small class="from">${g(label)}</small>` : ''}${bet.modern ? `<small class="from modern">${g('現代の知恵')}</small>` : ''}<b class="side-head">${g(bet.head || bet.from || bet.title)}</b>${bet.lead ? `<small class="side-lead">${g(bet.lead)}</small>` : ''}<b class="bet-title">${g(betTitle(state, i))}</b>${image(bet.art, betTitle(state, i))}` : `${bet.from ? `<small class="from">${g(bet.from)}</small>` : ''}<b class="bet-title">${g(betTitle(state, i))}</b>${image(bet.art, betTitle(state, i))}`}<small>${g([costText(bet), stakeText(bet), shortfallText(bet)].filter(Boolean).join('　'))}</small><div class="odds" role="img" aria-label="勝つ目 ${odds}/6">${[1,2,3,4,5,6].map((n) => `<i class="${n <= odds ? 'hit' : ''} ${n > bet.odds && n <= odds ? guarded ? 'guard-boosted' : 'boosted' : ''}">${n}</i>`).join('')}</div>${i === 0 && card.demand ? `<span class="ignore-band"><small class="ignore">選ばなければ：${g(demandNote(state, card).replace(/^選ばなければ：/, ''))}</small>${card.ignore.substitute && ignoreSource && ignoreSource !== 'hire' && !certain ? `<small class="ignore-die" role="img" aria-label="無事に帰る目 ${ignoreOdds}/6">${[1,2,3,4,5,6].map((n) => `<i class="${n <= ignoreOdds ? 'hit' : ''}">${n}</i>`).join('')}</small>` : ''}</span>` : ''}${bet.lose?.die ? `<small class="lethal">負ければ死ぬ</small>` : ''}${bet.delay ? `<small>${bet.delay}年後</small>` : ''}</button>`;
  }).join('')}</div><p class="keys">← 左に賭ける　 · 　右に賭ける →</p>`;
  wireGlossary(root);
  root.querySelectorAll('[data-side]').forEach((button) => button.addEventListener('click', () => { state = choose(state, Number(button.dataset.side)); render(); }));
}
function renderResult() {
  const row = state.result;
  const changes = row.changes || {}, gained = changes.add.map((id) => `${currentStage().FIELD[id].name} ${Object.entries(currentStage().FIELD[id].marks).map(([axis, value]) => `${MARKS[axis]}${value > 0 ? '+' : ''}${value}`).join(' ')}`).join('、') || 'なし', lost = changes.remove.map((id) => currentStage().FIELD[id]?.name || id).join('、') || 'なし';
  const yearly = row.yearly || {};
  const yearlyText = [yearly.store && `${row.age < currentStage().settings.adultFrom ? '家の蓄え' : '蓄え'} +${yearly.store}`, yearly.body && `体 ${yearly.body > 0 ? '+' : ''}${yearly.body}`].filter(Boolean).join('、');
  const bodyMaxText = (row.bodyMaxChanges || []).join('、');
  // 年表の札が動いたことは、年を出さずに暮らしの言葉で伝える（父母の最期の年を見せない）。
  const familyShifts = (row.familyShifts || []).map(({ id, before, after }) => (currentStage().text.familyShift[currentStage().cardById.get(id)?.role] || ['', ''])[after > before ? 0 : 1]).filter(Boolean).join('');
  const quietRow = currentStage().settings.quietAuto && currentStage().cardById.get(row.id)?.role === 'quietCard';
  if (quietRow) {
    $('event').innerHTML = `<p class="eyebrow">${yearLabel(row.year)} · ${row.age}歳</p>${(() => { const c = currentStage().cardById.get(row.id); return `${c.art ? image(c.art, c.title, 'scene-stamp') : ''}<h1>${g(c.title)}</h1>`; })()}<p class="story">${g(row.text)}</p>${yearlyText ? `<p class="change-summary">${g(`${currentStage().text.yearEnd} ${yearlyText}`)}</p>` : ''}${bodyMaxText ? `<p class="change-summary">${g(bodyMaxText)}</p>` : ''}${row.unpaid ? `<p class="change-summary">${g(row.unpaid)}</p>` : ''}<button id="next-year" class="next-year">次の年へ</button>`;
    wireGlossary($('event'));
    $('next-year').addEventListener('click', () => { state = advanceYear(state); render(); });
    return;
  }
  $('event').innerHTML = `<p class="eyebrow">${yearLabel(row.year)} · ${row.age}歳</p>${image(row.art, row.choice, 'scene-stamp')}<h1>${g(row.choice)} · ${row.won ? 'うまくいった' : 'うまくいかなかった'}</h1><p class="story">${g(row.text || '静かな一年だった。')}${row.delayed ? `（結果は${row.delay}年後に分かる）` : ''}</p><p class="change-summary">得た：${g(gained)} ／ 失った：${g(lost)}</p>${changes.becomes ? `<p class="change-summary">変わった：${g(currentStage().FIELD[changes.becomes.from].name)} → ${g(currentStage().FIELD[changes.becomes.to].partnerName ? fill(currentStage().text.spouseLabel, { name: currentStage().FIELD[changes.becomes.from].name }) : currentStage().FIELD[changes.becomes.to].name)} ${Object.entries(currentStage().FIELD[changes.becomes.to].marks).map(([axis, value]) => `${MARKS[axis]}${value > 0 ? '+' : ''}${value}`).join(' ')}</p>` : ''}${row.heartChange ? `<p class="change-summary">${g(row.heartChange)}</p>` : ''}${familyShifts ? `<p class="change-summary">${g(familyShifts)}</p>` : ''}<p class="change-summary">体 ${changes.body > 0 ? '+' : ''}${changes.body || 0} · 蓄え ${changes.store > 0 ? '+' : ''}${changes.store || 0}</p>${bodyMaxText ? `<p class="change-summary">${g(bodyMaxText)}</p>` : ''}${row.inheritance ? `<p class="change-summary">${g(row.inheritance)}</p>` : ''}${row.unpaid ? `<p class="change-summary">${g(row.unpaid)}</p>` : ''}${row.upkeep ? `<p class="change-summary">${g(row.upkeep)}</p>` : ''}${row.vowChange ? `<p class="change-summary">${g(row.vowChange)}</p>` : ''}${row.rankChange ? `<p class="change-summary">${g(row.rankChange)}</p>` : ''}${row.birth ? `<p class="change-summary">${g(row.birth)}</p>` : ''}${row.ignoreText ? `<p class="change-summary">${g(row.ignoreText)}</p>` : ''}${yearlyText ? `<p class="change-summary">${g(`${currentStage().text.yearEnd} ${yearlyText}`)}</p>` : ''}${state.reconsider ? `<div class="reconsider"><p class="story">${g(state.reconsider.story)}</p><button id="reconsider-yes" class="next-year">${esc(currentStage().AXES[state.reconsider.axis].here)}を目指す</button></div>` : ''}<button id="next-year" class="next-year">次の年へ</button>`;
  wireGlossary($('event'));
  $('next-year').addEventListener('click', () => { state = advanceYear(state); render(); });
  $('reconsider-yes')?.addEventListener('click', () => { answerReconsider(state, true); render(); });
}
const RESTART_BUTTON = '<button id="restart" class="next-year">もう一度</button>';
function renderRecap() {
  const top = meters(state), high = livedAxis(state), reach = axisReach(state);
  $('event').innerHTML = `<p class="eyebrow">走馬灯 · ${yearLabel(state.year)}</p><h1>${state.age}歳まで</h1><p class="life-title">${personName(state, 'self') ? `${esc(personName(state, 'self'))}、` : ''}${g(lifeTitle(state))}</p><p class="story">死因：${g(state.cause)}</p><p class="change-summary">${g(houseEnding(state))}</p><p>${state.goals.map((g) => `宣言：${esc(currentStage().AXES[g.axis].name)}（${g.age}歳）`).join(' → ')}</p><h2>宣言は${esc(currentStage().AXES[state.goal].name)}、生きた道は${esc(currentStage().AXES[high].name)}${reach && currentStage().AXES[high].ladder && reach[high] ? `（${esc(currentStage().AXES[high].ladder[reach[high] - 1])}まで）` : ''}</h2><div class="recap-meters">${Object.entries(currentStage().AXES).map(([axis, info]) => `<span class="meter${axis === high ? ' selected' : ''}"><i>${MARKS[axis]}</i><b class="meter-track"><u style="width:${meterWidth(top, axis)}%"></u></b><small>${top[axis]}</small></span>`).join('')}</div>${afterLines(state).length ? '<button id="after" class="next-year">後世</button>' : RESTART_BUTTON}<div class="recap"></div>`;
  const recap = $('event').querySelector('.recap');
  state.history.forEach((row) => { const item = document.createElement('article'); item.className = 'recap-card'; item.innerHTML = `${image(row.art, row.choice)}<div><small>${yearLabel(row.year)} · ${g(row.title)}</small><b>${g(row.choice)}</b><p>${g(row.text)}${row.delayed ? `（結果は${row.delay}年後に分かる）` : ''}</p></div>`; recap.append(item); });
  wireGlossary($('event'));
  $('after')?.addEventListener('click', renderAfter);
  wireRestart();
}
// 走馬灯の先。後世に語られる品を持って死んだ一生にだけある
function renderAfter() {
  $('event').innerHTML = `<p class="eyebrow">後世</p>${afterLines(state).map((line) => `<p class="story">${g(line)}</p>`).join('')}${RESTART_BUTTON}`;
  wireGlossary($('event'));
  wireRestart();
}
function wireRestart() {
  $('restart')?.addEventListener('click', () => { state = start((state.seed + 1) >>> 0, { stage: stageParam }); render(); });
}
function render() {
  saveLife();
  glossarySeen = new Set(); hideDetail();
  clearTimeout(timer); renderTimeline();
  if (state.dead) { renderRecap(); renderTableau(); return; }
  if (state.childhoodIndex < childhoodOf(state).length) {
    const event = childhoodOf(state)[state.childhoodIndex];
    const relatives = event.age === 0 ? state.field.map((id, i) => id === 'kinsman' ? state.kinship[state.fieldKeys[i]].rel : '').filter(Boolean) : [];
    const story = relatives.length ? `${event.story} ${relatives.join('、')}がいると知った。` : event.story;
    $('event').innerHTML = `<div class="auto-stage"><button class="auto-event" type="button"><p class="eyebrow">${yearLabel(event.year)} · ${event.age}歳</p>${image(event.art, event.title, 'scene-stamp')}<h1>${esc(event.title)}</h1><p class="story">${esc(story)}</p><span class="keys">札を押す / Space / → で次へ</span></button><button id="skip" class="skip">7歳まで飛ばす</button></div>`;
    $('event').querySelector('.auto-event').addEventListener('click', () => { state = advanceChildhood(state); render(); });
    $('skip').addEventListener('click', () => { state = skipChildhood(state); render(); });
    timer = setTimeout(() => { state = advanceChildhood(state); render(); }, 60000); renderTableau(); return;
  }
  if (state.pastIntro) { renderPastIntro(); renderTableau(); return; }
  if (!state.goal) { renderGoal(); renderTableau(); return; }
  if (state.result) { renderResult(); renderTableau(); return; }
  if (isAutoYear(state)) {
    $('event').innerHTML = `<p class="eyebrow">${yearLabel(state.year)} · ${state.age}歳</p><h1>家を譲ったあとの暮らし</h1><p class="story">史実や家族の節目が来るまで、日々が過ぎていく。</p>`;
    timer = setTimeout(() => { state = advanceAutoYear(state); render(); }, 1200); renderTableau(); return;
  }
  if (isQuietYear(state)) { state = choose(state, 0); render(); return; }
  renderCard(); renderTableau();
}
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { hideDetail(); return; }
  if (state.childhoodIndex < childhoodOf(state).length && [' ', 'ArrowRight'].includes(event.key)) { event.preventDefault(); state = advanceChildhood(state); render(); return; }
  if (event.key === ' ' && state.result) { state = advanceYear(state); render(); return; }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    const side = event.key === 'ArrowLeft' ? 0 : 1;
    if (state.result) { state = advanceYear(state); render(); }
    else if (state.pendingRoll) { state = side === 0 ? reroll(state) : acceptRoll(state); render(); }
    else if (state.goal && canChoose(state, side)) { state = choose(state, side); render(); }
  }
});
// 保存した一生が今の札と合わなくなっていたら、新しい一生で始める
try { render(); } catch { state = newLife(stageParam); render(); }
