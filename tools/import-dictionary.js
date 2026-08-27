/**
 * Nhập dữ liệu từ điển mở về thành nội dung học.
 *
 *   node tools/import-dictionary.js
 *
 * Hai nguồn, cả hai đều cho phép dùng lại kèm ghi công:
 *
 *   KANJIDIC2 — EDRDG, giấy phép CC BY-SA 4.0
 *     http://www.edrdg.org/kanjidic/kanjidic2.xml.gz
 *     Cho: âm On, âm Kun, nghĩa tiếng Anh, số nét, độ thường gặp, và — thứ
 *     quý nhất với người Việt — ÂM HÁN VIỆT (thân, kinh, tế...).
 *
 *   open-anki-jlpt-decks — Jamie Sinclair, giấy phép MIT
 *     https://github.com/jamsinclair/open-anki-jlpt-decks
 *     Cho: danh sách từ vựng đã gắn cấp JLPT, kèm cách đọc và nghĩa tiếng Anh.
 *
 * Nghĩa nhập về là TIẾNG ANH. Nội dung soạn tay bằng tiếng Việt luôn được ưu
 * tiên; phần nhập chỉ lấp chỗ trống. Xem packages/content/src/index.ts.
 *
 * KANJIDIC2 dùng thang JLPT cũ (1-4) chứ không phải thang mới (N1-N5), và kỳ
 * thi mới không công bố danh sách kanji chính thức. Quy đổi ở đây:
 *   cũ 4 → N5, cũ 3 → N4, cũ 2 → N3 (lấy theo độ thường gặp cho tới khi đủ
 *   khoảng 650 chữ cộng dồn, đúng mức thường được coi là yêu cầu N3).
 * Đây là phép xấp xỉ, không phải danh sách chính thức.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const https = require("https");
const http = require("http");

const OUT_DIR = path.join(__dirname, "..", "packages", "content", "src");
const CACHE_DIR = path.join(__dirname, ".cache");

const KANJIDIC_URL = "http://www.edrdg.org/kanjidic/kanjidic2.xml.gz";
const VOCAB_URL = (level) =>
  `https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/main/src/${level}.csv`;

/** Số kanji cộng dồn tương ứng mỗi mức, dùng để cắt danh sách cũ-mức-2. */
const KANJI_TARGET = { N5: 103, N4: 284, N3: 650 };

/* ------------------------------------------------------------------ */

function download(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          resolve(download(response.headers.location));
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`${url} trả về ${response.statusCode}`));
          return;
        }
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function fetchCached(url, filename) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cached = path.join(CACHE_DIR, filename);
  if (fs.existsSync(cached)) {
    console.log(`  dùng bản đã tải: ${filename}`);
    return fs.readFileSync(cached);
  }
  console.log(`  đang tải ${url}`);
  const data = await download(url);
  fs.writeFileSync(cached, data);
  return data;
}

/* ------------------------------------------------------------------ *
 * KANJIDIC2
 * ------------------------------------------------------------------ */

function textOf(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
  return match ? decodeXml(match[1]) : "";
}

function allText(block, regex) {
  const out = [];
  let match;
  while ((match = regex.exec(block)) !== null) out.push(decodeXml(match[1]));
  return out;
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseKanjidic(xml) {
  const entries = [];
  const blocks = xml.split("<character>").slice(1);

  for (const raw of blocks) {
    const block = raw.split("</character>")[0];
    const char = textOf(block, "literal");
    if (!char) continue;

    const jlptOld = Number(textOf(block, "jlpt")) || 0;
    if (!jlptOld || jlptOld < 2) continue; // chỉ lấy tới mức tương đương N3

    // Nghĩa tiếng Anh: chỉ lấy thẻ meaning không có m_lang (mặc định là tiếng Anh)
    const meanings = allText(block, /<meaning>([^<]+)<\/meaning>/g).slice(0, 4);
    const on = allText(block, /<reading r_type="ja_on">([^<]+)<\/reading>/g);
    const kun = allText(block, /<reading r_type="ja_kun">([^<]+)<\/reading>/g);
    const hanViet = allText(block, /<reading r_type="vietnam">([^<]+)<\/reading>/g);

    entries.push({
      char,
      meanings,
      on: on.slice(0, 3),
      kun: kun.slice(0, 3),
      hanViet: hanViet.slice(0, 2),
      strokes: Number(textOf(block, "stroke_count")) || 0,
      freq: Number(textOf(block, "freq")) || 9999,
      jlptOld,
    });
  }

  return entries;
}

/** Quy đổi thang JLPT cũ sang mới, cắt theo độ thường gặp cho mức N3. */
function assignLevels(entries) {
  const byLevel = { N5: [], N4: [], N3: [] };

  for (const entry of entries) {
    if (entry.jlptOld === 4) byLevel.N5.push(entry);
    else if (entry.jlptOld === 3) byLevel.N4.push(entry);
  }

  // Mức cũ 2 tương ứng cả N3 lẫn N2. Lấy phần hay gặp nhất làm N3.
  const oldTwo = entries.filter((e) => e.jlptOld === 2).sort((a, b) => a.freq - b.freq);
  const roomForN3 = KANJI_TARGET.N3 - byLevel.N5.length - byLevel.N4.length;
  byLevel.N3 = oldTwo.slice(0, Math.max(roomForN3, 0));

  for (const level of Object.keys(byLevel)) {
    byLevel[level].forEach((entry) => {
      entry.level = level;
    });
  }

  return [...byLevel.N5, ...byLevel.N4, ...byLevel.N3];
}

/* ------------------------------------------------------------------ *
 * Từ vựng
 * ------------------------------------------------------------------ */

/** CSV có ô chứa dấu phẩy trong ngoặc kép nên phải tách bằng tay. */
function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function parseVocabCsv(text, level) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const [header, ...rows] = lines;
  const columns = parseCsvLine(header).map((c) => c.trim());

  const iWord = columns.indexOf("expression");
  const iReading = columns.indexOf("reading");
  const iMeaning = columns.indexOf("meaning");
  if (iWord < 0 || iReading < 0 || iMeaning < 0) {
    throw new Error(`CSV ${level} thiếu cột bắt buộc, có: ${columns.join(", ")}`);
  }

  const out = [];
  for (const row of rows) {
    const cells = parseCsvLine(row);
    const word = (cells[iWord] || "").trim();
    const reading = (cells[iReading] || "").trim() || word;
    const meaning = (cells[iMeaning] || "").trim();
    if (!word || !meaning) continue;
    out.push({ word, reading, meaning, level });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Sinh file
 * ------------------------------------------------------------------ */

const BANNER = `/* TỰ ĐỘNG SINH — đừng sửa tay.
 * Sinh lại bằng: node tools/import-dictionary.js
 *
 * Nguồn:
 *   KANJIDIC2 — Electronic Dictionary Research and Development Group,
 *   dùng theo giấy phép Creative Commons BY-SA 4.0.
 *   http://www.edrdg.org/kanjidic/kanjidic2.xml.gz
 *
 *   Danh sách từ vựng JLPT — open-anki-jlpt-decks (Jamie Sinclair), giấy phép MIT.
 *   https://github.com/jamsinclair/open-anki-jlpt-decks
 *
 * Nghĩa ở đây là TIẾNG ANH. Nội dung soạn tay bằng tiếng Việt được ưu tiên
 * hơn, phần này chỉ lấp chỗ trống.
 */`;

function writeKanji(entries) {
  const rows = entries.map((e) => ({
    c: e.char,
    m: e.meanings.join(", "),
    o: e.on.join(" / "),
    k: e.kun.join(" / "),
    v: e.hanViet.join(", "),
    s: e.strokes,
    f: e.freq,
    l: e.level,
  }));

  const file = `${BANNER}

export interface ImportedKanji {
  /** chữ */
  c: string;
  /** nghĩa tiếng Anh */
  m: string;
  /** âm On */
  o: string;
  /** âm Kun */
  k: string;
  /** âm Hán Việt */
  v: string;
  /** số nét */
  s: number;
  /** thứ hạng độ thường gặp, càng nhỏ càng hay gặp */
  f: number;
  /** cấp JLPT (quy đổi xấp xỉ từ thang cũ) */
  l: string;
}

export const IMPORTED_KANJI: ImportedKanji[] = ${JSON.stringify(rows, null, 0)};
`;
  fs.writeFileSync(path.join(OUT_DIR, "imported-kanji.ts"), file, "utf8");
  return rows.length;
}

function writeVocab(entries) {
  const rows = entries.map((e) => ({ w: e.word, r: e.reading, m: e.meaning, l: e.level }));

  const file = `${BANNER}

export interface ImportedVocab {
  /** chữ viết */
  w: string;
  /** cách đọc bằng kana */
  r: string;
  /** nghĩa tiếng Anh */
  m: string;
  /** cấp JLPT */
  l: string;
}

export const IMPORTED_VOCAB: ImportedVocab[] = ${JSON.stringify(rows, null, 0)};
`;
  fs.writeFileSync(path.join(OUT_DIR, "imported-vocab.ts"), file, "utf8");
  return rows.length;
}

/* ------------------------------------------------------------------ */

async function main() {
  console.log("Nhập dữ liệu từ điển mở\n");

  console.log("KANJIDIC2:");
  const gz = await fetchCached(KANJIDIC_URL, "kanjidic2.xml.gz");
  const xml = zlib.gunzipSync(gz).toString("utf8");
  const parsed = parseKanjidic(xml);
  console.log(`  đọc được ${parsed.length} chữ có gắn cấp JLPT`);
  const leveled = assignLevels(parsed);
  const kanjiCount = writeKanji(leveled);
  const perLevel = leveled.reduce((acc, e) => {
    acc[e.level] = (acc[e.level] || 0) + 1;
    return acc;
  }, {});
  console.log(`  ghi ${kanjiCount} chữ —`, JSON.stringify(perLevel));
  const withHanViet = leveled.filter((e) => e.hanViet.length).length;
  console.log(`  trong đó ${withHanViet} chữ có âm Hán Việt`);

  console.log("\nTừ vựng JLPT:");
  const vocab = [];
  for (const level of ["n5", "n4", "n3"]) {
    const csv = await fetchCached(VOCAB_URL(level), `${level}.csv`);
    const rows = parseVocabCsv(csv.toString("utf8"), level.toUpperCase());
    console.log(`  ${level.toUpperCase()}: ${rows.length} từ`);
    vocab.push(...rows);
  }
  const vocabCount = writeVocab(vocab);
  console.log(`  ghi ${vocabCount} từ`);

  console.log("\nXong. Chạy `npm run build:content` để biên dịch lại.");
}

main().catch((error) => {
  console.error("Lỗi khi nhập:", error.message);
  process.exit(1);
});
