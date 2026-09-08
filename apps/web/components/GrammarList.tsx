"use client";

import { conjugation, foundations, type Level } from "@kanado/content";
import { useState } from "react";
import { ContentStatusNote, useGrammar } from "@/lib/content";

type Tab = "base" | Level;

type GrammarRoleId = "noun" | "verb" | "i-adjective" | "na-adjective" | "particle";

const GRAMMAR_ROLES: Record<
  GrammarRoleId,
  { symbol: string; label: string }
> = {
  noun: { symbol: "N", label: "Danh từ" },
  verb: { symbol: "V", label: "Động từ" },
  "i-adjective": { symbol: "Aい", label: "Tính từ い" },
  "na-adjective": { symbol: "Aな", label: "Tính từ な" },
  particle: { symbol: "助", label: "Trợ từ" },
};

const FORMULA_TOKEN_PATTERN = /(Aい|Aな|N|V)/g;
const JAPANESE_PUNCTUATION_PATTERN = /([。！？、]+)$/;
const EXAMPLE_PARTICLES = new Set([
  "から",
  "まで",
  "より",
  "を",
  "に",
  "で",
  "へ",
  "が",
  "は",
  "も",
  "と",
  "の",
  "や",
]);
const JAPANESE_WORD_SEGMENTER = new Intl.Segmenter("ja", {
  granularity: "word",
});

function AnnotatedPattern({ pattern }: { pattern: string }) {
  return pattern.split(FORMULA_TOKEN_PATTERN).map((part, index) => {
    const role = Object.entries(GRAMMAR_ROLES).find(
      ([, value]) => value.symbol === part,
    );

    if (!role) return <span key={index}>{part}</span>;

    return (
      <mark
        className={`grammar-formula-token grammar-role-${role[0]}`}
        title={role[1].label}
        key={index}
      >
        {part}
      </mark>
    );
  });
}

function inferGrammarRoles(pattern: string, note: string): GrammarRoleId[] {
  const text = `${pattern} ${note.replace(/<[^>]+>/g, "")}`;
  const roles: GrammarRoleId[] = [];

  if (/\bN\b|danh từ|名詞/.test(text)) roles.push("noun");
  if (/\bV\b|động từ|動詞|thể (?:て|た|ない|ます|từ điển)|Bỏ ます/i.test(text)) {
    roles.push("verb");
  }
  if (/Aい|tính từ い|い-?形容詞/i.test(text)) roles.push("i-adjective");
  if (/Aな|tính từ な|な-?形容詞/i.test(text)) roles.push("na-adjective");
  if (/trợ từ|助詞|[NAB](?:を|に|で|へ|が|は|も|と|の|や)|〜から〜まで/.test(text)) {
    roles.push("particle");
  }

  return [...new Set(roles)];
}

function GrammarRoleBadges({
  pattern,
  note,
  examples = [],
}: {
  pattern: string;
  note: string;
  examples?: string[];
}) {
  const roles = inferGrammarRoles(pattern, note);

  for (const sentence of examples) {
    const parts = splitExampleParts(sentence.replace(JAPANESE_PUNCTUATION_PATTERN, ""));

    parts.forEach((part, index) => {
      const role = classifyExamplePart(part, index, parts, roles);
      if (role && !roles.includes(role)) roles.push(role);
    });
  }

  if (roles.length === 0) return null;

  return (
    <div className="grammar-point-roles">
      <span>Thành phần trong mẫu</span>
      {roles.map((role) => (
        <span className={`grammar-role grammar-role-${role}`} key={role}>
          <b>{GRAMMAR_ROLES[role].symbol}</b>
          {GRAMMAR_ROLES[role].label}
        </span>
      ))}
    </div>
  );
}

function looksLikeJapaneseVerb(value: string) {
  if (/(?:です|でした|でしょう)$/.test(value)) return false;

  return /(?:ます|ません|ました|ませんでした|ましょう|ています|てください|たいです|なければなりません|てもいいです|てはいけません|ことができます|する|した|して|される|られる|ない|なかった|る|う|く|ぐ|す|つ|ぬ|ぶ|む)$/.test(
    value,
  );
}

function classifyExamplePart(
  part: string,
  index: number,
  parts: string[],
  roles: GrammarRoleId[],
): GrammarRoleId | null {
  if (EXAMPLE_PARTICLES.has(part)) {
    return "particle";
  }

  const lastMeaningfulIndex = parts.findLastIndex((value) => value.trim());
  const isLastPart = index === lastMeaningfulIndex;

  if (isLastPart && roles.includes("i-adjective")) return "i-adjective";
  if (isLastPart && roles.includes("na-adjective")) return "na-adjective";
  if (looksLikeJapaneseVerb(part) || (isLastPart && roles.includes("verb"))) {
    return "verb";
  }

  const nextPart = parts.slice(index + 1).find((value) => value.trim());
  if (EXAMPLE_PARTICLES.has(nextPart ?? "")) {
    return "noun";
  }

  return null;
}

function splitExampleParts(sentence: string) {
  const parts: string[] = [];
  let phrase = "";

  const pushPhrase = () => {
    if (phrase) parts.push(phrase);
    phrase = "";
  };

  for (const item of JAPANESE_WORD_SEGMENTER.segment(sentence)) {
    let segment = item.segment;

    if (/^\s+$/.test(segment)) {
      pushPhrase();
      parts.push(segment);
      continue;
    }

    if (EXAMPLE_PARTICLES.has(segment)) {
      if (segment === "で" && phrase.endsWith("ん")) {
        phrase += segment;
        continue;
      }

      pushPhrase();
      parts.push(segment);
      continue;
    }

    const endingParticle = [...EXAMPLE_PARTICLES]
      .sort((a, b) => b.length - a.length)
      .find((particle) => segment.length > particle.length && segment.endsWith(particle));

    if (endingParticle) {
      phrase += segment.slice(0, -endingParticle.length);
      pushPhrase();
      parts.push(endingParticle);
      continue;
    }

    const startingParticle = [...EXAMPLE_PARTICLES]
      .sort((a, b) => b.length - a.length)
      .find(
        (particle) =>
          phrase && segment.length > particle.length && segment.startsWith(particle),
      );

    if (startingParticle) {
      pushPhrase();
      parts.push(startingParticle);
      segment = segment.slice(startingParticle.length);
    }

    phrase += segment;
  }

  pushPhrase();
  return parts;
}

function AnnotatedExample({
  sentence,
  pattern,
  note,
}: {
  sentence: string;
  pattern: string;
  note: string;
}) {
  const roles = inferGrammarRoles(pattern, note);
  const punctuation = sentence.match(JAPANESE_PUNCTUATION_PATTERN)?.[1] ?? "";
  const sentenceBody = punctuation ? sentence.slice(0, -punctuation.length) : sentence;
  const parts = splitExampleParts(sentenceBody);

  return (
    <span className="j jp grammar-example-sentence">
      {parts.map((part, index) => {
        const role = classifyExamplePart(part, index, parts, roles);

        if (!role) return <span key={`${part}-${index}`}>{part}</span>;

        return (
          <span
            className={`grammar-example-part grammar-role-${role}`}
            title={GRAMMAR_ROLES[role].label}
            key={`${part}-${index}`}
          >
            <b>{GRAMMAR_ROLES[role].symbol}</b>
            <span>{part}</span>
          </span>
        );
      })}
      {punctuation}
    </span>
  );
}

export function GrammarList() {
  const [tab, setTab] = useState<Tab>("base");
  const { data: grammar, status } = useGrammar();

  const counts = {
    N5: grammar.filter((g) => g.level === "N5").length,
    N4: grammar.filter((g) => g.level === "N4").length,
    N3: grammar.filter((g) => g.level === "N3").length,
  };

  return (
    <>
      <div className="toolbar">
        <button className="chip" aria-pressed={tab === "base"} onClick={() => setTab("base")}>
          Nền tảng · {foundations.length} mục
        </button>
        {(["N5", "N4", "N3"] as Level[]).map((level) => (
          <button
            key={level}
            className="chip"
            aria-pressed={tab === level}
            onClick={() => setTab(level)}
          >
            {level} · {counts[level]} mẫu
          </button>
        ))}
        <ContentStatusNote status={status} />
      </div>

      <div className="grammar-key" aria-label="Chú thích ký hiệu từ loại">
        <div>
          <strong>Cách đọc công thức</strong>
          <span>Ví dụ: Nを V = danh từ + trợ từ を + động từ</span>
        </div>
        <div className="grammar-key-items">
          {(Object.keys(GRAMMAR_ROLES) as GrammarRoleId[]).map((role) => (
            <span className={`grammar-role grammar-role-${role}`} key={role}>
              <b>{GRAMMAR_ROLES[role].symbol}</b>
              {GRAMMAR_ROLES[role].label}
            </span>
          ))}
        </div>
      </div>

      {tab === "base" && (
        <>
          <p className="lede" style={{ fontSize: 13.5 }}>
            Trật tự từ và hệ thống thì — phần lẽ ra phải học trước mọi mẫu câu, nhưng giáo trình
            thường dạy thẳng vào mẫu nên hay bị bỏ qua. Nắm tám mục này rồi thì các mẫu N5, N4, N3 bên
            cạnh không còn là học thuộc lòng.
          </p>
          <div className="glist">
            {foundations.map((topic) => (
              <details className="gitem" key={topic.title} open={topic === foundations[0]}>
                <summary>
                  <span className="pat" style={{ fontFamily: "inherit", fontSize: 15 }}>
                    {topic.title}
                  </span>
                  <span className="gl">{topic.gloss}</span>
                </summary>
                <div className="gbody">
                  <p style={{ fontSize: "13.5px" }}>{topic.body}</p>
                  <GrammarRoleBadges
                    pattern={`${topic.title} ${topic.gloss}`}
                    note={topic.body}
                    examples={topic.examples.map((example) => example.jp)}
                  />
                  {topic.examples.map((example, index) => (
                    <div className="ex" key={index}>
                      <AnnotatedExample
                        sentence={example.jp}
                        pattern={`${topic.title} ${topic.gloss}`}
                        note={topic.body}
                      />
                      <span className="vn">{example.vn}</span>
                    </div>
                  ))}
                  {topic.table && (
                    <div style={{ overflowX: "auto" }}>
                      <table className="htable conj">
                        <tbody>
                          <tr>
                            {topic.table.header.map((cell, index) => (
                              <th key={index}>{cell}</th>
                            ))}
                          </tr>
                          {topic.table.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </>
      )}

      {tab === "N4" && (
        <div className="card">
          <h3>Bảng chia động từ — học thuộc bảng này trước mọi mẫu N4</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="htable conj">
              <tbody>
                <tr>
                  {conjugation.header.map((cell) => (
                    <th key={cell}>{cell}</th>
                  ))}
                </tr>
                {conjugation.rows.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: "12.5px" }}>
            Nhóm I: đuôi trước ます thuộc い-đoạn (書きます). Nhóm II: bỏ ます thêm る (食べます).
            Nhóm III chỉ có する và 来る.
          </p>
        </div>
      )}

      {tab !== "base" && (
        <div className="glist">
          {grammar
            .filter((point) => point.level === tab)
            .map((point) => (
              <details className="gitem" key={`${point.level}-${point.pattern}`}>
                <summary>
                  <span className="pat jp">
                    <AnnotatedPattern pattern={point.pattern} />
                  </span>
                  <span className="gl">{point.gloss}</span>
                </summary>
                <div className="gbody">
                  <p
                    style={{ fontSize: "13.5px" }}
                    dangerouslySetInnerHTML={{ __html: point.note }}
                  />
                  <GrammarRoleBadges pattern={point.pattern} note={point.note} />
                  {point.examples.map((example, index) => (
                    <div className="ex" key={index}>
                      <AnnotatedExample
                        sentence={example.jp}
                        pattern={point.pattern}
                        note={point.note}
                      />
                      <span className="vn">{example.vn}</span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
        </div>
      )}
    </>
  );
}
