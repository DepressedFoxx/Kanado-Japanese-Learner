export type Level = "N5" | "N4" | "N3";
export type Script = "hiragana" | "katakana";
export type KanaGroup = "gojuon" | "dakuten" | "yoon" | "extended";

export interface KanaEntry {
  group: KanaGroup;
  row: string;
  /** null với nhóm mở rộng (ファ, ヴ…) vì chỉ tồn tại ở katakana */
  hiragana: string | null;
  katakana: string;
  romaji: string;
}

export interface KanaChartCell {
  entry: KanaEntry | null;
}

export interface KanaChartSection {
  group: KanaGroup;
  label: string;
  columns: number;
  rows: KanaChartCell[][];
}

export interface ConfusablePair {
  a: string;
  b: string;
  tip: string;
}

export interface VocabEntry {
  /** nguồn của nghĩa */
  source: ContentSource;
  /** dạng viết (kanji hoặc katakana) */
  word: string;
  /** cách đọc kana */
  reading: string;
  romaji: string;
  meaning: string;
  /** true nếu là từ katakana thuần (word === reading) */
  katakana: boolean;
}

export interface VocabGroup {
  id: string;
  label: string;
  level: Level | "kana";
  items: VocabEntry[];
}

export interface KanjiExample {
  word: string;
  reading: string;
  /** romaji gõ được — chính là chuỗi phím bấm trên bàn phím tiếng Nhật */
  readingRomaji: string;
  meaning: string;
}

export type ContentSource = "vi" | "imported";

export interface KanjiEntry {
  char: string;
  /** nghĩa — tiếng Việt nếu soạn tay, tiếng Anh nếu nhập từ từ điển */
  meaning: string;
  /** nguồn của nghĩa, để giao diện báo cho người học biết */
  source: ContentSource;
  /** âm Hán Việt, lấy từ KANJIDIC2 — rất hữu ích để đoán nghĩa chữ mới */
  hanViet?: string;
  /** số nét */
  strokes?: number;
  /** thứ hạng độ thường gặp, càng nhỏ càng hay gặp */
  frequency?: number;
  /** âm On, viết bằng katakana theo quy ước từ điển */
  on: string;
  /** âm On dạng romaji, để đọc và để gõ */
  onRomaji: string;
  /** âm Kun, viết bằng hiragana */
  kun: string;
  /** âm Kun dạng romaji */
  kunRomaji: string;
  example: KanjiExample;
  level: Level;
}

export interface GrammarExample {
  jp: string;
  vn: string;
}

export interface GrammarPoint {
  pattern: string;
  gloss: string;
  note: string;
  examples: GrammarExample[];
  level: Level;
}

export interface ClozeQuestion {
  /** câu có ___ cần điền */
  sentence: string;
  answer: string;
  distractors: string[];
  note: string;
  translation: string;
  level: Level;
}

export interface ConjugationTable {
  header: string[];
  rows: string[][];
}

export interface PlanStep {
  milestone: string;
  title: string;
  body: string;
  criteria: string;
}

export interface Resource {
  area: string;
  items: string;
  note: string;
}

export interface CoverageRow {
  label: string;
  have: number;
  need: number;
  note?: string;
}
