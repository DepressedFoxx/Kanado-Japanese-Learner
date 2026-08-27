import type { KanaEntry } from "./types";

/**
 * Chuyển kana sang romaji.
 *
 * Cố ý dùng romaji "gõ được" chứ không phải Hepburn có dấu ngang (ō, ū):
 * mục đích là người học nhìn vào biết gõ gì trên bàn phím tiếng Nhật.
 * Ví dụ おとうさん ra "otousan" (đúng phím phải bấm), không phải "otōsan".
 */

/** Bảng tra dựng từ chính dữ liệu bảng chữ, để không có hai nguồn sự thật. */
function buildTable(kana: KanaEntry[]): Map<string, string> {
  const table = new Map<string, string>();
  for (const entry of kana) {
    if (entry.hiragana) table.set(entry.hiragana, entry.romaji);
    table.set(entry.katakana, entry.romaji);
  }
  return table;
}

const SMALL_TSU = new Set(["っ", "ッ"]);
const LONG_MARK = "ー";

/** Nguyên âm đứng một mình, dùng cho các kana nhỏ hiếm gặp. */
const SMALL_VOWELS: Record<string, string> = {
  ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o",
  ァ: "a", ィ: "i", ゥ: "u", ェ: "e", ォ: "o",
};

export function createRomajiConverter(kana: KanaEntry[]) {
  const table = buildTable(kana);

  return function toRomaji(input: string): string {
    if (!input) return "";

    let out = "";
    let i = 0;

    while (i < input.length) {
      const char = input[i];

      // Dấu gạch ngăn phần đuôi biến đổi trong âm Kun: あ-う → a-u
      if (char === "-" || char === "／" || char === "/" || char === " ") {
        out += char;
        i++;
        continue;
      }

      // っ nhỏ: gấp đôi phụ âm của âm tiếp theo (きって → kitte)
      if (SMALL_TSU.has(char)) {
        const rest = toRomaji(input.slice(i + 1));
        const consonant = rest.match(/^[a-z]/)?.[0];
        out += consonant && !"aiueo".includes(consonant) ? consonant + rest : rest;
        return out;
      }

      // Dấu kéo dài của katakana: lặp lại nguyên âm liền trước
      if (char === LONG_MARK) {
        const lastVowel = out.match(/[aiueo](?!.*[aiueo])/)?.[0];
        out += lastVowel ?? "";
        i++;
        continue;
      }

      // Âm ghép chiếm hai ký tự (きゃ, シュ…) nên thử cặp trước
      const pair = input.slice(i, i + 2);
      if (pair.length === 2 && table.has(pair)) {
        out += table.get(pair);
        i += 2;
        continue;
      }

      const single = table.get(char);
      if (single) {
        out += single;
        i++;
        continue;
      }

      const smallVowel = SMALL_VOWELS[char];
      if (smallVowel) {
        out += smallVowel;
        i++;
        continue;
      }

      // Ký tự không phải kana (kanji lẫn trong từ, dấu câu…) giữ nguyên
      out += char;
      i++;
    }

    return out;
  };
}
