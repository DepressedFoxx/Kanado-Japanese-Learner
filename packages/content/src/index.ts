import { buildCoverageN3 } from "./plan-n3";
import { createRomajiConverter } from "./romaji";
import * as raw from "./raw";
import type {
  ClozeQuestion,
  ConfusablePair,
  ConjugationTable,
  CoverageRow,
  GrammarPoint,
  KanaChartSection,
  KanaEntry,
  KanaGroup,
  KanjiEntry,
  Level,
  PlanStep,
  Resource,
  VocabEntry,
  VocabGroup,
} from "./types";

export * from "./types";

/* ------------------------------------------------------------------ *
 * Bảng chữ
 * ------------------------------------------------------------------ */

const CHART_LABEL: Record<KanaGroup, string> = {
  gojuon: "Gojūon · 46 âm cơ bản",
  dakuten: "Dakuten & handakuten · ゛ ゜",
  yoon: "Yōon · âm ghép ャ ュ ョ",
  extended: "Mở rộng · chỉ có ở katakana",
};

function parseKanaTable(table: string[][], group: KanaGroup, columns: number) {
  const entries: KanaEntry[] = [];
  const rows: { entry: KanaEntry | null }[][] = [];

  for (const line of table) {
    const cells: { entry: KanaEntry | null }[] = [];
    for (let i = 1; i <= columns; i++) {
      const cellSource = line[i];
      if (!cellSource) {
        cells.push({ entry: null });
        continue;
      }
      const [chars, romaji] = cellSource.split(" ");
      const extendedOnly = group === "extended";
      const entry: KanaEntry = {
        group,
        row: line[0],
        hiragana: extendedOnly ? null : chars.slice(0, chars.length / 2),
        katakana: extendedOnly ? chars : chars.slice(chars.length / 2),
        romaji,
      };
      entries.push(entry);
      cells.push({ entry });
    }
    rows.push(cells);
  }

  return { entries, rows };
}

const gojuon = parseKanaTable(raw.gojuon, "gojuon", 5);
const dakuten = parseKanaTable(raw.dakuten, "dakuten", 5);
const yoon = parseKanaTable(raw.yoon, "yoon", 3);
const extended = parseKanaTable(raw.extended, "extended", 5);

export const kanaChart: KanaChartSection[] = [
  { group: "gojuon", label: CHART_LABEL.gojuon, columns: 5, rows: gojuon.rows },
  { group: "dakuten", label: CHART_LABEL.dakuten, columns: 5, rows: dakuten.rows },
  { group: "yoon", label: CHART_LABEL.yoon, columns: 3, rows: yoon.rows },
  { group: "extended", label: CHART_LABEL.extended, columns: 5, rows: extended.rows },
];

export const kana: KanaEntry[] = [
  ...gojuon.entries,
  ...dakuten.entries,
  ...yoon.entries,
  ...extended.entries,
];

export const confusablePairs: ConfusablePair[] = raw.CONFUSE;

/** Chữ katakana xuất hiện trong danh sách cặp dễ nhầm. */
export const confusableChars: string[] = Array.from(
  new Set(raw.CONFUSE.flatMap((p) => [p.a, p.b])),
);

/** Khóa định danh một ký tự trong bảng, dùng cho thống kê tiến độ. */
export function kanaKey(entry: KanaEntry, script: "hiragana" | "katakana"): string {
  return `${script}:${script === "hiragana" ? entry.hiragana : entry.katakana}`;
}

/* ------------------------------------------------------------------ *
 * Từ vựng
 * ------------------------------------------------------------------ */

const katakanaVocab: VocabEntry[] = raw.VOCAB.map(([word, romaji, meaning]) => ({
  word,
  reading: word,
  romaji,
  meaning,
  katakana: true,
}));

function toVocabGroups(source: [string, string[][]][], level: Level, prefix: string): VocabGroup[] {
  return source.map(([label, items], index) => ({
    id: `${prefix}-${index}`,
    label: `${level} · ${decodeEntities(label)}`,
    level,
    items: items.map(([word, reading, romaji, meaning]) => ({
      word,
      reading,
      romaji,
      meaning,
      katakana: false,
    })),
  }));
}

/** Dữ liệu gốc là HTML nên có &amp; — package này trả về text thuần. */
function decodeEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

export const vocabGroups: VocabGroup[] = [
  { id: "kata", label: "Katakana thường gặp", level: "kana", items: katakanaVocab },
  ...toVocabGroups(raw.N5, "N5", "n5"),
  ...toVocabGroups(raw.N4V, "N4", "n4"),
];

export const vocab: VocabEntry[] = vocabGroups.flatMap((g) => g.items);

export function vocabByLevel(level: Level | "both"): VocabEntry[] {
  return vocabGroups
    .filter((g) => (level === "both" ? true : g.level === level || g.level === "kana"))
    .flatMap((g) => g.items);
}

/* ------------------------------------------------------------------ *
 * Kanji
 * ------------------------------------------------------------------ */

/** Chuyển kana sang romaji gõ được — dùng chung cho kanji và các chỗ khác. */
export const toRomaji = createRomajiConverter(kana);

export const kanji: KanjiEntry[] = (() => {
  const seen = new Set<string>();
  const list: KanjiEntry[] = [];
  for (const [char, meaning, on, kun, example, level] of raw.KANJI) {
    if (seen.has(char)) continue;
    seen.add(char);
    const [word, reading, exMeaning] = example.split("|");
    list.push({
      char,
      meaning,
      on,
      onRomaji: toRomaji(on),
      kun,
      kunRomaji: toRomaji(kun),
      example: {
        word,
        reading,
        readingRomaji: toRomaji(reading),
        meaning: exMeaning,
      },
      level: level as Level,
    });
  }
  return list;
})();

export function kanjiByLevel(level: Level | "both"): KanjiEntry[] {
  return level === "both" ? kanji : kanji.filter((k) => k.level === level);
}

/* ------------------------------------------------------------------ *
 * Ngữ pháp
 * ------------------------------------------------------------------ */

function toGrammar(source: (string | string[][])[][], level: Level): GrammarPoint[] {
  return source.map((row) => ({
    pattern: row[0] as string,
    gloss: row[1] as string,
    note: row[2] as string,
    examples: (row[3] as string[][]).map(([jp, vn]) => ({ jp, vn })),
    level,
  }));
}

export const grammar: GrammarPoint[] = [
  ...toGrammar(raw.GRAMMAR, "N5"),
  ...toGrammar(raw.GRAMMAR4, "N4"),
];

export function grammarByLevel(level: Level | "both"): GrammarPoint[] {
  return level === "both" ? grammar : grammar.filter((g) => g.level === level);
}

export const conjugation: ConjugationTable = {
  header: raw.CONJ[0],
  rows: raw.CONJ.slice(1),
};

/* ------------------------------------------------------------------ *
 * Ngân hàng câu hỏi điền chỗ trống
 * ------------------------------------------------------------------ */

function toCloze(source: (string | string[])[][], level: Level): ClozeQuestion[] {
  return source.map((row) => ({
    sentence: row[0] as string,
    answer: row[1] as string,
    distractors: row[2] as string[],
    note: row[3] as string,
    translation: row[4] as string,
    level,
  }));
}

export const clozeQuestions: ClozeQuestion[] = [
  ...toCloze(raw.GBANK, "N5"),
  ...toCloze(raw.GBANK4, "N4"),
];

export function clozeByLevel(level: Level | "both"): ClozeQuestion[] {
  return level === "both" ? clozeQuestions : clozeQuestions.filter((q) => q.level === level);
}

/* ------------------------------------------------------------------ *
 * Lộ trình
 * ------------------------------------------------------------------ */

export const planSteps: PlanStep[] = raw.PLAN.map(([milestone, title, body, criteria]) => ({
  milestone,
  title,
  body,
  criteria: criteria ?? "",
}));

export const resources: Resource[] = raw.RESOURCES.map(([area, items, note]) => ({
  area: decodeEntities(area),
  items: decodeEntities(items),
  note: decodeEntities(note),
}));

/** Mục tiêu JLPT N4 để so với lượng nội dung app đang có. */
export const N4_TARGET = { kanji: 300, vocab: 1500, grammar: 150, listening: 60 } as const;

export { N3_TARGET, planStepsN3, resourcesN3 } from "./plan-n3";
export { foundations, type FoundationTopic } from "./foundations";

export const coverage: CoverageRow[] = [
  {
    label: "Bảng chữ hiragana + katakana",
    have: kana.filter((k) => k.hiragana).length + kana.length,
    need: kana.filter((k) => k.hiragana).length + kana.length,
    note: "đủ dùng",
  },
  { label: "Kanji", have: kanji.length, need: N4_TARGET.kanji },
  { label: "Từ vựng", have: vocab.length, need: N4_TARGET.vocab },
  { label: "Mẫu ngữ pháp", have: grammar.length, need: N4_TARGET.grammar },
  {
    label: "Luyện nghe",
    have: 0,
    need: N4_TARGET.listening,
    note: "điểm nghe — app không dạy được, phải dùng tài liệu ngoài",
  },
];

/** Cùng cách đo nhưng theo mục tiêu N3 — chặng sau khi đã có N4. */
export const coverageN3: CoverageRow[] = buildCoverageN3(
  kanji.length,
  vocab.length,
  grammar.filter((g) => (g.level as string) === "N3").length,
);

/* ------------------------------------------------------------------ *
 * Bộ thẻ flashcard
 * ------------------------------------------------------------------ */

export type DeckKind = "vocab" | "kanji" | "grammar";

export interface DeckMeta {
  id: string;
  label: string;
  kind: DeckKind;
  level: Level | "kana";
  size: number;
}

export const decks: DeckMeta[] = [
  { id: "kata", label: "Từ katakana", kind: "vocab", level: "kana", size: katakanaVocab.length },
  {
    id: "k5",
    label: "Kanji N5",
    kind: "kanji",
    level: "N5",
    size: kanji.filter((k) => k.level === "N5").length,
  },
  {
    id: "k4",
    label: "Kanji N4",
    kind: "kanji",
    level: "N4",
    size: kanji.filter((k) => k.level === "N4").length,
  },
  ...vocabGroups
    .filter((g) => g.id !== "kata")
    .map<DeckMeta>((g) => ({
      id: g.id,
      label: g.label,
      kind: "vocab",
      level: g.level,
      size: g.items.length,
    })),
  {
    id: "gr",
    label: "Ngữ pháp N5",
    kind: "grammar",
    level: "N5",
    size: grammar.filter((g) => g.level === "N5").length,
  },
  {
    id: "gr4",
    label: "Ngữ pháp N4",
    kind: "grammar",
    level: "N4",
    size: grammar.filter((g) => g.level === "N4").length,
  },
];

export interface DeckCard {
  /** id ổn định, dùng làm khóa tiến độ SRS */
  id: string;
  deckId: string;
  kind: DeckKind;
  /** mặt tiếng Nhật */
  front: string;
  /** cách đọc để phát âm */
  reading: string;
  /** nghĩa tiếng Việt */
  meaning: string;
  romaji?: string;
  on?: string;
  kun?: string;
  note?: string;
  examples?: { jp: string; vn: string }[];
}

export function deckCards(deckId: string): DeckCard[] {
  if (deckId === "gr" || deckId === "gr4") {
    const level: Level = deckId === "gr4" ? "N4" : "N5";
    return grammar
      .filter((g) => g.level === level)
      .map((g) => ({
        id: `${deckId}|${g.pattern}`,
        deckId,
        kind: "grammar" as const,
        front: g.pattern,
        reading: g.examples[0]?.jp ?? g.pattern,
        meaning: g.gloss,
        note: g.note,
        examples: g.examples,
      }));
  }

  if (deckId === "k5" || deckId === "k4") {
    const level: Level = deckId === "k5" ? "N5" : "N4";
    return kanji
      .filter((k) => k.level === level)
      .map((k) => ({
        id: `${deckId}|${k.char}`,
        deckId,
        kind: "kanji" as const,
        front: k.char,
        reading: k.example.reading,
        meaning: k.meaning,
        romaji: k.example.readingRomaji,
        on: k.on ? `${k.on}${k.onRomaji ? ` (${k.onRomaji})` : ""}` : "",
        kun: k.kun ? `${k.kun}${k.kunRomaji ? ` (${k.kunRomaji})` : ""}` : "",
        examples: [
          {
            jp: `${k.example.word}（${k.example.reading}）`,
            vn: `${k.example.readingRomaji} — ${k.example.meaning}`,
          },
        ],
      }));
  }

  const group = vocabGroups.find((g) => g.id === deckId);
  if (!group) return [];
  return group.items.map((v) => ({
    id: `${deckId}|${v.word}`,
    deckId,
    kind: "vocab" as const,
    front: v.word,
    reading: v.reading,
    meaning: v.meaning,
    romaji: v.romaji,
  }));
}
