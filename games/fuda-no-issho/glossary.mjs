import { ABILITIES } from './abilities.mjs';

export const COMMON_GLOSSARY = {
  '段': '場の札は 3 段までよくできる。●が今の段。',
  '前世の勘': '一生に何度か、負けの目が出たときにサイコロを振り直せる。誓いに沿った札で勝つと戻る。',
  '今年の実り': '場の札が毎年もたらすもの。年の終わりに足される。',
  '体の器': '体の上限。育つ・鍛える・治すで大きくなり、古傷・病・老いで小さくなる。',
  '勢い': '相手の家の強さ。争いになったとき、勝ちやすさが変わる。',
  '誓い': '記憶が戻ったときに決めた、今生で目指すもの。',
  '現代の知恵': '前の世の常識。この時代では効くが、変わり者に見られる。',
  '前世の能力': '前の世の経験から残った力。札の勝ちやすさを上げるが、年とともに薄れる。',
  ...Object.fromEntries(Object.values(ABILITIES).map(({ name, description }) => [name, description])),
};

// カタカナの語は、前後にカタカナが続くなら別の語の途中（ウェスタリアの中のウェスタ）とみなす。中黒は語の切れ目
const kana = (char) => /[ァ-ヺー]/.test(char || '');
const wholeWord = (text, i, term) => !(kana(term[0]) && kana(text[i - 1])) && !(kana(term.at(-1)) && kana(text[i + term.length]));

export function glossaryParts(text, glossary, seen = new Set()) {
  const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
  const parts = [];
  for (let i = 0; i < text.length;) {
    const term = terms.find((item) => text.startsWith(item, i) && wholeWord(text, i, item));
    if (term) {
      parts.push({ text: term, explanation: seen.has(term) ? '' : glossary[term] });
      seen.add(term);
      i += term.length;
    } else {
      const last = parts.at(-1);
      if (last && !last.explanation) last.text += text[i];
      else parts.push({ text: text[i], explanation: '' });
      i++;
    }
  }
  return parts;
}
