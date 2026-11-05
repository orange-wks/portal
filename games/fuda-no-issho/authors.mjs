// 札と品の書き手の印。LLM の手伝いをどこに、どれくらい入れたかを見えるようにする（2026-11-03 orange「どこにいれるのかどれくらいいれるのかは見えるようにしよう」）。
// 舞台は AUTHORS = { cards: { 札 id: 印 }, items: { 品 id: 印 } } を持てる。書いていない札と品は LLM の下書き。
export const AUTHOR_LABELS = { llm: 'LLM の下書き', passed: 'LLM の下書き・orange が通した', orange: 'orange が書いた' };
export const cardAuthor = (stage, id) => stage.AUTHORS?.cards?.[id] || 'llm';
export const itemAuthor = (stage, id) => stage.AUTHORS?.items?.[id] || 'llm';
export function authorCounts(stage) {
  const count = (ids, of) => ids.reduce((acc, id) => ({ ...acc, [of(stage, id)]: (acc[of(stage, id)] || 0) + 1 }), {});
  return { cards: count(stage.CARDS.map((card) => card.id), cardAuthor), items: count(Object.keys(stage.FIELD), itemAuthor) };
}
