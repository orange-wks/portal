// 舞台の中の「別の一生」（女として生まれる、別の立場に生まれるなど）を組み立てる。
// 一生は、本体の舞台から時代の土台（年表、軸、範囲、生まれのくじの家の格、使い回す品と札）を借り、札の大半を自分で持つ。
// 本体の舞台は変えない。一生は 1 つの舞台として登録するので、sim・ladder-check・stage-compare・画面がそのまま使える。
//
// keepItems / keepCards は残す品と札の一覧（書いていないものは持ち込まない。男の札が紛れないようにするため）。
// items / cards はこの一生の品と札。cardRoles は札 id と役の対応（仕組みが読む役。本体の舞台の CARD_RULES と同じもの）。
export function composeLife(base, life) {
  const { id, name, sex, forbid = [], keepItems = [], keepCards = [], items = {}, cards = [], cardRoles = {}, settings = {}, familyAges = {}, ...rest } = life;
  const FIELD = { ...Object.fromEntries(keepItems.map((key) => [key, base.FIELD[key]])), ...items };
  for (const key of keepItems) if (!base.FIELD[key]) throw new Error(`${id}: 本体に無い品 ${key}`);
  const kept = keepCards.map((key) => { const card = base.cardById.get(key); if (!card) throw new Error(`${id}: 本体に無い札 ${key}`); return card; });
  const FAMILY_AGES = { ...base.FAMILY_AGES, ...familyAges };
  const own = cards.map((card) => ({ ...card, kind: card.year ? 'history' : card.disaster ? 'disaster' : card.demand ? 'demand' : card.quiet ? 'upkeep' : card.family ? 'family' : 'event', category: card.id.startsWith('lo.') ? 'relationship' : card.id.startsWith('ch.') ? 'child' : null, role: cardRoles[card.id] || card.role || (card.quiet ? 'quietCard' : null), disasterType: card.id.startsWith('dis.') ? card.id.slice(4) : null, disasterKey: card.disaster ? card.id : null, familyAge: FAMILY_AGES[card.id] || null }));
  // 一生の札を先に置く（隠居の年は、最初の静かな札を読むので、一度きりの場面を繰り返さないようにする）
  const CARDS = [...own, ...kept];
  return {
    ...base, ...rest, id,
    life: { name, sex, base: base.id, forbid },
    settings: { ...base.settings, ...settings }, FIELD, CARDS,
    cardById: new Map(CARDS.map((card) => [card.id, card])),
    CARD_IDS: Object.fromEntries(CARDS.filter((card) => card.role).map((card) => [card.role, card.id])),
    FAMILY_AGES,
  };
}
