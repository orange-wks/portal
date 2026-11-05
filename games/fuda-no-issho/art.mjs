// 絵を追加するときは scene/choice/history の札 ID を画像パスへ結ぶ。
export const ART = {};

export function artFor(id) {
  return ART[id] ?? null;
}
