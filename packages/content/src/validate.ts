/**
 * Kiểm tra dữ liệu ngay lúc nạp module.
 *
 * Dữ liệu học được viết tay nên rất dễ lọt dòng hỏng: thiếu cột, lẫn ký tự
 * không phải tiếng Nhật vào ô chữ viết, câu hỏi thiếu chỗ trống. Những lỗi đó
 * mà lọt xuống giao diện thì người học nhìn thấy chữ rác, nên chặn ngay từ
 * lúc build: import package mà dữ liệu hỏng thì ném lỗi luôn.
 */

/** Kana, kanji, và các dấu dùng trong từ điển (／ ・ ー 〜 dấu câu Nhật). */
const JAPANESE_TEXT =
  /^[぀-ヿ㐀-䶿一-鿿々〆ー／（）、。〜～→\s/-]+$/;

export function isJapaneseText(value: string): boolean {
  return JAPANESE_TEXT.test(value);
}

export class ContentDataError extends Error {
  constructor(source: string, problems: string[]) {
    super(
      `Dữ liệu ${source} có ${problems.length} dòng hỏng:\n` +
        problems.map((p) => `  - ${p}`).join("\n"),
    );
    this.name = "ContentDataError";
  }
}

/**
 * Kanji: [chữ, nghĩa, On, Kun, "từ|đọc|nghĩa", cấp]
 * Chữ phải là đúng một ký tự Hán, ví dụ phải đủ ba phần.
 */
export function validateKanjiRows(rows: string[][], source: string): string[][] {
  const problems: string[] = [];

  rows.forEach((row, index) => {
    const where = `dòng ${index + 1}`;
    if (row.length !== 6) {
      problems.push(`${where}: cần 6 cột, có ${row.length} — ${JSON.stringify(row).slice(0, 60)}`);
      return;
    }

    const [char, meaning, on, kun, example, level] = row;

    if (!/^[㐀-䶿一-鿿]$/.test(char)) {
      problems.push(`${where}: cột chữ phải là một kanji, đang là "${char}"`);
    }
    if (!meaning.trim()) problems.push(`${where} (${char}): thiếu nghĩa`);
    if (on && !isJapaneseText(on)) problems.push(`${where} (${char}): âm On lạ "${on}"`);
    if (kun && !isJapaneseText(kun)) problems.push(`${where} (${char}): âm Kun lạ "${kun}"`);

    const parts = example.split("|");
    if (parts.length !== 3 || parts.some((p) => !p.trim())) {
      problems.push(`${where} (${char}): ví dụ phải có dạng "từ|đọc|nghĩa", đang là "${example}"`);
    } else {
      if (!isJapaneseText(parts[0])) problems.push(`${where} (${char}): từ ví dụ lạ "${parts[0]}"`);
      if (!isJapaneseText(parts[1])) problems.push(`${where} (${char}): cách đọc lạ "${parts[1]}"`);
    }

    if (!["N5", "N4", "N3"].includes(level)) {
      problems.push(`${where} (${char}): cấp độ lạ "${level}"`);
    }
  });

  if (problems.length) throw new ContentDataError(source, problems);
  return rows;
}

/** Từ vựng: [chữ viết, cách đọc, romaji, nghĩa] */
export function validateVocabGroups(
  groups: [string, string[][]][],
  source: string,
): [string, string[][]][] {
  const problems: string[] = [];

  groups.forEach(([label, items]) => {
    items.forEach((item, index) => {
      const where = `${label} dòng ${index + 1}`;
      if (item.length !== 4) {
        problems.push(`${where}: cần 4 cột, có ${item.length}`);
        return;
      }
      const [word, reading, romaji, meaning] = item;
      if (!isJapaneseText(word)) problems.push(`${where}: chữ viết lạ "${word}"`);
      if (!isJapaneseText(reading)) problems.push(`${where}: cách đọc lạ "${reading}"`);
      if (!romaji.trim()) problems.push(`${where} (${word}): thiếu romaji`);
      if (!meaning.trim()) problems.push(`${where} (${word}): thiếu nghĩa`);
    });
  });

  if (problems.length) throw new ContentDataError(source, problems);
  return groups;
}

/** Câu hỏi điền chỗ trống: [câu có ___, đáp án, [3 lựa chọn sai], giải thích, dịch] */
export function validateClozeRows(
  rows: (string | string[])[][],
  source: string,
): (string | string[])[][] {
  const problems: string[] = [];

  rows.forEach((row, index) => {
    const where = `dòng ${index + 1}`;
    const [sentence, answer, distractors, note, translation] = row as [
      string,
      string,
      string[],
      string,
      string,
    ];

    if (typeof sentence !== "string" || !sentence.includes("___")) {
      problems.push(`${where}: câu thiếu chỗ trống ___`);
    }
    if (!answer) problems.push(`${where}: thiếu đáp án`);
    if (!Array.isArray(distractors) || distractors.length !== 3) {
      problems.push(`${where}: cần đúng 3 lựa chọn sai`);
    } else {
      if (distractors.includes(answer)) {
        problems.push(`${where}: đáp án "${answer}" nằm trong lựa chọn sai`);
      }
      if (new Set(distractors).size !== 3) {
        problems.push(`${where}: các lựa chọn sai trùng nhau`);
      }
    }
    if (!note) problems.push(`${where}: thiếu giải thích`);
    if (!translation) problems.push(`${where}: thiếu bản dịch`);
  });

  if (problems.length) throw new ContentDataError(source, problems);
  return rows;
}

/** Ngữ pháp: [mẫu, nghĩa, ghi chú, [[câu Nhật, dịch]]] */
export function validateGrammarRows(
  rows: (string | string[][])[][],
  source: string,
): (string | string[][])[][] {
  const problems: string[] = [];

  rows.forEach((row, index) => {
    const where = `dòng ${index + 1}`;
    const [pattern, gloss, note, examples] = row as [string, string, string, string[][]];

    if (!pattern) problems.push(`${where}: thiếu mẫu câu`);
    if (!gloss) problems.push(`${where} (${pattern}): thiếu nghĩa`);
    if (!note) problems.push(`${where} (${pattern}): thiếu ghi chú`);
    if (!Array.isArray(examples) || examples.length === 0) {
      problems.push(`${where} (${pattern}): phải có ít nhất một ví dụ`);
      return;
    }
    examples.forEach((example, exampleIndex) => {
      if (example.length !== 2 || !example[0] || !example[1]) {
        problems.push(`${where} (${pattern}): ví dụ ${exampleIndex + 1} phải có câu Nhật và dịch`);
      }
    });
  });

  if (problems.length) throw new ContentDataError(source, problems);
  return rows;
}
