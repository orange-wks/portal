export const ABILITIES = {
  hygiene: { name: '衛生と手当て', icon: '🩹', layer: 'body', description: '煮沸や傷の手当て、お産と乳児の世話。' },
  soil: { name: '土と作物', icon: '🌱', layer: 'body', description: '種選び、輪作、堆肥、接ぎ木。' },
  body: { name: '体づくり', icon: '💪', layer: 'body', description: '鍛え方と食べ方を知っている。' },
  foresight: { name: '先読み', icon: '👁', layer: 'head', description: 'この時代に起きることを知っている。' },
  numbers: { name: '数と帳簿', icon: '🧮', layer: 'head', description: '相場や利息を読み、帳面をつける。' },
  organizing: { name: '組織づくり', icon: '🗂', layer: 'head', description: '人の分業や給金、休みを決めて回す。' },
  expression: { name: '表現', icon: '🎨', layer: 'head', description: '文章や絵、歌で人に伝え、評判を作る。' },
  outdoors: { name: '野外と水辺', icon: '🏕', layer: 'body', description: '火や水、野営、防災、釣りの知恵。' },
  cooking: { name: '料理', icon: '🍲', layer: 'body', description: '味付けや保存、発酵の工夫。' },
  making: { name: 'ものづくり', icon: '🔨', layer: 'body', description: '道具や石鹸、紙などを作る。' },
  animals: { name: '動物と暮らす', icon: '🐎', layer: 'body', description: '世話やしつけ、体調の見方、騎乗。' },
  faith: { name: '信仰としきたり', icon: '🕯', layer: 'head', description: '寺社や祭り、作法を知っている。' },
};

export function topAbilities(abilities, limit = 3) {
  return Object.keys(ABILITIES).filter((id) => abilities[id] > 0).sort((a, b) => abilities[b] - abilities[a]).slice(0, limit);
}
