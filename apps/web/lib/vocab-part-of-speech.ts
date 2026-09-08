import { type VocabEntry } from "@kanado/content";

export type VocabPartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "other";
export type VocabPartOfSpeechFilter = VocabPartOfSpeech | "all";

export const VOCAB_PARTS_OF_SPEECH: {
  id: VocabPartOfSpeechFilter;
  label: string;
}[] = [
  { id: "all", label: "Tất cả" },
  { id: "noun", label: "Danh từ" },
  { id: "verb", label: "Động từ" },
  { id: "adjective", label: "Tính từ" },
  { id: "adverb", label: "Trạng từ / liên từ" },
  { id: "other", label: "Khác" },
];

const COMMON_ADVERBS = new Set([
  "あまり",
  "いつも",
  "かなり",
  "きっと",
  "すぐ",
  "ずっと",
  "そうして; そして",
  "それから",
  "それでは",
  "たくさん",
  "たぶん",
  "ちょっと",
  "ちゃんと",
  "どうぞ",
  "どうも",
  "とても",
  "ほぼ",
  "まだ",
  "また",
  "まっすぐ",
  "もう",
  "もっと",
  "もちろん",
  "やっと",
  "ゆっくりと",
  "よく",
  "一緒",
  "余り",
  "別に",
  "初めて",
  "多分",
  "大勢",
  "急に",
  "時々",
  "段々",
  "沢山",
  "特に",
  "色々",
  "非常に",
]);

const COMMON_NA_ADJECTIVES = new Set([
  "にぎやか",
  "りっぱ",
  "上手",
  "下手",
  "便利",
  "元気",
  "大丈夫",
  "大切",
  "大変",
  "大好き",
  "好き",
  "嫌",
  "嫌い",
  "有名",
  "暇",
  "簡単",
  "綺麗",
  "親切",
  "静か",
]);

const I_ADJECTIVE_EXCEPTIONS = new Set(["買い", "思い", "願い"]);

export function classifyVocabPartOfSpeech(
  item: VocabEntry,
  groupLabel: string,
): VocabPartOfSpeech {
  const label = groupLabel.toLowerCase();
  const meaning = item.meaning.toLowerCase();

  if (label.includes("động từ")) return "verb";
  if (label.includes("tính từ")) return "adjective";
  if (label.includes("trạng từ") || label.includes("liên từ")) return "adverb";

  if (
    item.word.includes("～") ||
    meaning.includes("particle") ||
    meaning.includes("honorific") ||
    meaning.includes("used to") ||
    meaning.includes("suffix") ||
    meaning.includes("prefix")
  ) {
    return "other";
  }

  if (
    COMMON_ADVERBS.has(item.word) ||
    COMMON_ADVERBS.has(item.reading) ||
    meaning.includes("adverb") ||
    meaning.includes("conjunction")
  ) {
    return "adverb";
  }

  const looksLikeIAdjective =
    !I_ADJECTIVE_EXCEPTIONS.has(item.word) &&
    (/^\p{Script=Han}+い$/u.test(item.word) ||
      /(?:しい|ない|たい|かい|すい|るい|よい|いい)$/.test(item.word));

  if (
    COMMON_NA_ADJECTIVES.has(item.word) ||
    item.word.endsWith("な") ||
    looksLikeIAdjective ||
    meaning.includes("adjective")
  ) {
    return "adjective";
  }

  if (
    /(^|[;,]\s*)to\s+[a-z]/.test(meaning) ||
    /\(v\.[it]\./.test(meaning) ||
    item.word.endsWith("する")
  ) {
    return "verb";
  }

  return "noun";
}

export function vocabPartOfSpeechLabel(category: VocabPartOfSpeech) {
  return VOCAB_PARTS_OF_SPEECH.find((item) => item.id === category)?.label ?? "Khác";
}
