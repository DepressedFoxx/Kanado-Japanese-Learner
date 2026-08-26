/* Trích các mảng dữ liệu từ kana-do.html sang TypeScript, tránh chép tay sai sót. */
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "prototype", "kana-do.html");
const OUT = path.join(__dirname, "..", "packages", "content", "src", "raw.ts");

const html = fs.readFileSync(SRC, "utf8");

/** Cắt literal mảng của `const NAME=[` cho tới `]` khớp cặp, bỏ qua nội dung trong chuỗi. */
function grab(name) {
  const marker = "const " + name + "=[";
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("không tìm thấy " + name);
  let i = start + marker.length - 1; // đứng ngay tại '['
  let depth = 0, quote = null;
  for (; i < html.length; i++) {
    const c = html[i];
    if (quote) {
      if (c === "\\") { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "[") depth++;
    else if (c === "]") { depth--; if (depth === 0) return html.slice(start + marker.length - 1, i + 1); }
  }
  throw new Error("không đóng được mảng " + name);
}

const names = [
  "gojuon", "dakuten", "yoon", "extended", "CONFUSE", "VOCAB", "N5",
  "KANJI", "GBANK", "GRAMMAR4", "GBANK4", "N4V", "CONJ", "GRAMMAR", "PLAN", "RESOURCES",
];

const types = {
  gojuon: "string[][]", dakuten: "string[][]", yoon: "string[][]", extended: "string[][]",
  CONFUSE: "{ a: string; b: string; tip: string }[]",
  VOCAB: "string[][]",
  N5: "[string, string[][]][]",
  KANJI: "string[][]",
  GBANK: "(string | string[])[][]",
  GRAMMAR4: "(string | string[][])[][]",
  GBANK4: "(string | string[])[][]",
  N4V: "[string, string[][]][]",
  CONJ: "string[][]",
  GRAMMAR: "(string | string[][])[][]",
  PLAN: "string[][]",
  RESOURCES: "string[][]",
};

let out = `/* TỰ ĐỘNG SINH từ prototype kana-do.html — đừng sửa tay.
 * Sinh lại bằng: node tools/extract-content.js
 */\n\n`;

for (const n of names) {
  const literal = grab(n);
  out += `export const ${n}: ${types[n]} = ${literal};\n\n`;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, "utf8");

// kiểm tra nhanh bằng cách eval lại
const mod = out.replace(/export const (\w+): [^=]+=/g, "globalThis.$1 =");
eval(mod);
const counts = {};
for (const n of names) counts[n] = globalThis[n].length;
console.log("đã ghi", OUT);
console.log(JSON.stringify(counts, null, 0));
