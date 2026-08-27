"use client";

import {
  clozeByLevel,
  kana,
  kanaKey,
  kanjiByLevel,
  vocabByLevel,
  type Level,
} from "@kanado/content";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProgress } from "@/lib/store";
import { formatDateTime, formatTime, shuffle, unique } from "@/lib/utils";

type TestType = "kana" | "vocab" | "kanji" | "grammar" | "mix";
type LevelFilter = Level | "both";

interface Question {
  kind: TestType;
  eyebrow: string;
  prompt: string;
  promptClass: string;
  /** câu ngữ pháp chứa thẻ <u> nên phải render bằng HTML */
  promptIsHtml?: boolean;
  answer: string;
  options: string[];
  optionClass: string;
  note: string;
  kanaKey?: string;
}

const TYPES: { id: TestType; label: string }[] = [
  { id: "kana", label: "Bảng chữ" },
  { id: "vocab", label: "Từ vựng" },
  { id: "kanji", label: "Kanji" },
  { id: "grammar", label: "Ngữ pháp" },
  { id: "mix", label: "Tổng hợp" },
];

const TYPE_NAME: Record<TestType, string> = {
  kana: "Bảng chữ",
  vocab: "Từ vựng",
  kanji: "Kanji",
  grammar: "Ngữ pháp",
  mix: "Tổng hợp",
};

const TYPE_DESC: Record<TestType, string> = {
  kana: "Nhận mặt chữ hiragana và katakana, hỏi cả hai chiều. Không phụ thuộc cấp độ.",
  vocab: "Hỏi nghĩa từ theo cả hai chiều Nhật → Việt và Việt → Nhật.",
  kanji: "Nghĩa của chữ, chữ theo nghĩa, và cách đọc từ ghép.",
  grammar: "Điền trợ từ và đuôi động từ vào câu.",
  mix: "Trộn đều bảng chữ, từ vựng, kanji và ngữ pháp — sát nhất với đề thi thật.",
};

function makeKanaQuestion(): Question {
  const list = kana;
  const entry = list[Math.floor(Math.random() * list.length)];
  const script: "hiragana" | "katakana" =
    entry.hiragana && Math.random() < 0.45 ? "hiragana" : "katakana";
  const char = script === "hiragana" ? entry.hiragana! : entry.katakana;
  const others = list.filter((e) => e.romaji !== entry.romaji);

  if (Math.random() < 0.5) {
    return {
      kind: "kana",
      eyebrow: `${script === "hiragana" ? "Hiragana" : "Katakana"} → romaji`,
      prompt: char,
      promptClass: "jp",
      answer: entry.romaji,
      options: [...shuffle(unique(others.map((e) => e.romaji))).slice(0, 3), entry.romaji],
      optionClass: "mono",
      note: `${char} đọc là ${entry.romaji}.`,
      kanaKey: kanaKey(entry, script),
    };
  }

  const pool = others
    .map((e) => (script === "hiragana" ? e.hiragana : e.katakana))
    .filter((c): c is string => !!c);

  return {
    kind: "kana",
    eyebrow: `Romaji → ${script === "hiragana" ? "hiragana" : "katakana"}`,
    prompt: entry.romaji,
    promptClass: "mono small",
    answer: char,
    options: [...shuffle(unique(pool)).slice(0, 3), char],
    optionClass: "jp",
    note: `${entry.romaji} viết là ${char}.`,
    kanaKey: kanaKey(entry, script),
  };
}

function makeVocabQuestion(level: LevelFilter): Question {
  const list = vocabByLevel(level);
  const item = list[Math.floor(Math.random() * list.length)];
  const others = list.filter((v) => v.meaning !== item.meaning && v.word !== item.word);
  const detail = `${item.word}${item.katakana ? "" : `（${item.reading}）`} — ${item.romaji} — ${item.meaning}.`;

  if (Math.random() < 0.55) {
    return {
      kind: "vocab",
      eyebrow: "Từ này nghĩa là gì?",
      prompt: item.word,
      promptClass: "jp",
      answer: item.meaning,
      options: [...shuffle(unique(others.map((v) => v.meaning))).slice(0, 3), item.meaning],
      optionClass: "",
      note: detail,
    };
  }

  return {
    kind: "vocab",
    eyebrow: "Từ nào mang nghĩa này?",
    prompt: item.meaning,
    promptClass: "vn",
    answer: item.word,
    options: [...shuffle(unique(others.map((v) => v.word))).slice(0, 3), item.word],
    optionClass: "jp",
    note: detail,
  };
}

function makeKanjiQuestion(level: LevelFilter): Question {
  const list = kanjiByLevel(level);
  const item = list[Math.floor(Math.random() * list.length)];
  const others = list.filter((k) => k.char !== item.char);
  const detail = `${item.char} — ${item.meaning} · ON ${item.on || "—"} · KUN ${item.kun || "—"} · ${item.example.word}（${item.example.reading}）${item.example.meaning}.`;
  const roll = Math.random();

  if (roll < 0.4) {
    return {
      kind: "kanji",
      eyebrow: "Chữ này nghĩa là gì?",
      prompt: item.char,
      promptClass: "jp",
      answer: item.meaning,
      options: [...shuffle(unique(others.map((k) => k.meaning))).slice(0, 3), item.meaning],
      optionClass: "",
      note: detail,
    };
  }

  if (roll < 0.7) {
    return {
      kind: "kanji",
      eyebrow: "Chữ nào mang nghĩa này?",
      prompt: item.meaning,
      promptClass: "vn",
      answer: item.char,
      options: [...shuffle(unique(others.map((k) => k.char))).slice(0, 3), item.char],
      optionClass: "jp",
      note: detail,
    };
  }

  return {
    kind: "kanji",
    eyebrow: "Từ này đọc thế nào?",
    prompt: item.example.word,
    promptClass: "jp",
    answer: item.example.reading,
    options: [
      ...shuffle(unique(others.map((k) => k.example.reading))).slice(0, 3),
      item.example.reading,
    ],
    optionClass: "jp",
    note: `${item.example.word} đọc là ${item.example.reading} — ${item.example.meaning}.`,
  };
}

function makeGrammarQuestion(source: ReturnType<typeof clozeByLevel>[number]): Question {
  return {
    kind: "grammar",
    eyebrow: "Điền vào chỗ trống",
    prompt: source.sentence.replace("___", "<u>___</u>"),
    promptClass: "sentence jp",
    promptIsHtml: true,
    answer: source.answer,
    options: shuffle([...source.distractors, source.answer]),
    optionClass: "jp",
    note: `${source.note} → ${source.sentence.replace("___", source.answer)} (${source.translation})`,
  };
}

function buildTest(type: TestType, count: number, level: LevelFilter): Question[] {
  const questions: Question[] = [];
  const seen = new Set<string>();
  const grammarBag = shuffle(clozeByLevel(level));
  let guard = 0;

  while (questions.length < count && guard++ < 600) {
    const kind: TestType =
      type === "mix" ? (["kana", "vocab", "kanji", "grammar"] as TestType[])[questions.length % 4] : type;

    let question: Question;
    if (kind === "kana") question = makeKanaQuestion();
    else if (kind === "vocab") question = makeVocabQuestion(level);
    else if (kind === "kanji") question = makeKanjiQuestion(level);
    else {
      const source = grammarBag.pop();
      if (!source) break;
      question = makeGrammarQuestion(source);
    }

    const key = `${question.kind}|${question.prompt}|${question.answer}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let options = shuffle(unique(question.options)).slice(0, 4);
    if (!options.includes(question.answer)) {
      options[Math.floor(Math.random() * options.length)] = question.answer;
    }
    questions.push({ ...question, options });
  }

  return questions;
}

export function TestRunner() {
  const { attempts, addAttempt, recordKana } = useProgress();

  const [type, setType] = useState<TestType>("kana");
  const [level, setLevel] = useState<LevelFilter>("N5");
  const [count, setCount] = useState(10);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [phase, setPhase] = useState<"setup" | "running" | "result">("setup");
  const [elapsed, setElapsed] = useState(0);

  const startedAt = useRef(0);
  const wrongRef = useRef<Question[]>([]);

  useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [phase]);

  const start = useCallback(
    (preset?: Question[]) => {
      const built = preset ?? buildTest(type, count, level);
      if (!built.length) return;
      setQuestions(built.map((q) => ({ ...q, options: shuffle(q.options) })));
      setIndex(0);
      setAnswers([]);
      setElapsed(0);
      startedAt.current = Date.now();
      setPhase("running");
    },
    [type, count, level],
  );

  function choose(option: string) {
    const question = questions[index];
    const nextAnswers = [...answers, option];
    setAnswers(nextAnswers);

    if (question.kanaKey) recordKana(question.kanaKey, option === question.answer);

    if (index + 1 >= questions.length) {
      finish(nextAnswers);
    } else {
      setIndex(index + 1);
    }
  }

  function finish(finalAnswers: string[]) {
    const seconds = Math.floor((Date.now() - startedAt.current) / 1000);
    const correct = questions.filter((q, i) => finalAnswers[i] === q.answer).length;
    wrongRef.current = questions.filter((q, i) => finalAnswers[i] !== q.answer);

    addAttempt({
      type,
      level,
      total: questions.length,
      correct,
      seconds,
      createdAt: new Date().toISOString(),
    });

    setElapsed(seconds);
    setPhase("result");
  }

  const correctCount = useMemo(
    () => questions.filter((q, i) => answers[i] === q.answer).length,
    [questions, answers],
  );
  const percent = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  const poolSize =
    type === "grammar"
      ? `${clozeByLevel(level).length} câu trong ngân hàng đề.`
      : type === "kanji"
        ? `${kanjiByLevel(level).length} chữ trong bộ.`
        : type === "vocab"
          ? `${vocabByLevel(level).length} từ trong bộ.`
          : "";

  const best = useMemo(() => {
    const map: Record<string, number> = {};
    for (const attempt of attempts) {
      const pct = Math.round((attempt.correct / attempt.total) * 100);
      if (!map[attempt.type] || pct > map[attempt.type]) map[attempt.type] = pct;
    }
    return map;
  }, [attempts]);

  return (
    <>
      {phase === "setup" && (
        <div className="card">
          <h3>Chọn đề</h3>
          <div className="toolbar">
            {TYPES.map((item) => (
              <button
                key={item.id}
                className="chip"
                aria-pressed={type === item.id}
                onClick={() => setType(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <h3>Cấp độ</h3>
          <div className="toolbar">
            {(["N5", "N4", "N3", "both"] as LevelFilter[]).map((item) => (
              <button
                key={item}
                className="chip"
                aria-pressed={level === item}
                onClick={() => setLevel(item)}
              >
                {item === "both" ? "Tất cả" : item}
              </button>
            ))}
          </div>

          <h3>Số câu</h3>
          <div className="toolbar">
            {[10, 20, 30].map((value) => (
              <button
                key={value}
                className="chip"
                aria-pressed={count === value}
                onClick={() => setCount(value)}
              >
                {value} câu
              </button>
            ))}
          </div>

          <div className="toolbar">
            <button className="btn" onClick={() => start()}>
              Bắt đầu làm bài
            </button>
            <span style={{ fontSize: "13px", color: "var(--ink-3)" }}>
              {TYPE_DESC[type]} {poolSize}
            </span>
          </div>
        </div>
      )}

      {phase === "running" && questions[index] && (
        <>
          <div className="trow">
            <span>
              Câu {index + 1}/{questions.length}
            </span>
            <span className="mono">{formatTime(elapsed)}</span>
          </div>
          <div className="pbar">
            <i style={{ width: `${(index / questions.length) * 100}%` }} />
          </div>

          <div className="quizcard" style={{ minHeight: 300 }}>
            <div className="qeyebrow">{questions[index].eyebrow}</div>
            {questions[index].promptIsHtml ? (
              <div
                className={`qtext ${questions[index].promptClass}`}
                dangerouslySetInnerHTML={{ __html: questions[index].prompt }}
              />
            ) : (
              <div className={`qtext ${questions[index].promptClass}`}>
                {questions[index].prompt}
              </div>
            )}
            <div className="opts">
              {questions[index].options.map((option) => (
                <button
                  key={option}
                  className={`opt ${questions[index].optionClass}`}
                  onClick={() => choose(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar" style={{ justifyContent: "center" }}>
            <button className="chip" onClick={() => setPhase("setup")}>
              Dừng bài
            </button>
          </div>
        </>
      )}

      {phase === "result" && (
        <>
          <div className="card result">
            <div className={`rscore ${percent >= 80 ? "pass" : percent >= 50 ? "" : "fail"}`}>
              {percent}%
            </div>
            <div style={{ textAlign: "center", fontSize: 14 }}>
              Đúng{" "}
              <b>
                {correctCount}/{questions.length}
              </b>{" "}
              câu · {formatTime(elapsed)} ·{" "}
              {percent >= 90
                ? "Rất tốt, tăng độ khó hoặc chuyển đề khác đi."
                : percent >= 70
                  ? "Ổn rồi. Xem lại các câu sai bên dưới là chắc."
                  : "Chưa vững — quay lại Flashcard và Luyện bảng chữ trước khi thi lại."}
            </div>
            <div className="toolbar" style={{ justifyContent: "center" }}>
              <button className="btn" onClick={() => start()}>
                Làm lại đề này
              </button>
              <button
                className="chip"
                onClick={() => wrongRef.current.length && start(wrongRef.current)}
              >
                Làm lại câu sai
              </button>
              <button className="chip" onClick={() => setPhase("setup")}>
                Chọn đề khác
              </button>
            </div>
          </div>

          <div className="card">
            <h3>Câu sai</h3>
            <div className="wrongs">
              {wrongRef.current.length ? (
                wrongRef.current.map((question, i) => {
                  const given = answers[questions.indexOf(question)];
                  return (
                    <div className="wrong" key={i}>
                      {question.promptIsHtml ? (
                        <div
                          className="wq jp"
                          dangerouslySetInnerHTML={{ __html: question.prompt }}
                        />
                      ) : (
                        <div className="wq jp">{question.prompt}</div>
                      )}
                      <div className="wa">
                        Bạn chọn <s>{given || "—"}</s> · Đáp án <b>{question.answer}</b>
                      </div>
                      <div className="wn">{question.note}</div>
                    </div>
                  );
                })
              ) : (
                <p style={{ fontSize: 13 }}>
                  Không sai câu nào. Đề tiếp theo nên tăng số câu hoặc đổi sang Tổng hợp.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="card">
        <h3>Lịch sử làm bài</h3>
        {attempts.length ? (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="htable">
                <tbody>
                  <tr>
                    <th>Lúc</th>
                    <th>Đề</th>
                    <th>Cấp</th>
                    <th style={{ textAlign: "right" }}>Đúng</th>
                    <th style={{ textAlign: "right" }}>Điểm</th>
                    <th style={{ textAlign: "right" }}>Thời gian</th>
                  </tr>
                  {[...attempts]
                    .slice(-10)
                    .reverse()
                    .map((attempt, i) => {
                      const pct = Math.round((attempt.correct / attempt.total) * 100);
                      return (
                        <tr key={i}>
                          <td>{formatDateTime(attempt.createdAt)}</td>
                          <td>{TYPE_NAME[attempt.type as TestType] ?? attempt.type}</td>
                          <td>{attempt.level === "both" ? "Tất cả" : attempt.level}</td>
                          <td className="n">
                            {attempt.correct}/{attempt.total}
                          </td>
                          <td className={`n${pct === best[attempt.type] ? " hbest" : ""}`}>
                            {pct}%
                          </td>
                          <td className="n">{formatTime(attempt.seconds)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12 }}>
              Điểm cao nhất —{" "}
              {Object.entries(best)
                .map(([key, value]) => `${TYPE_NAME[key as TestType] ?? key} ${value}%`)
                .join(" · ")}
            </p>
          </>
        ) : (
          <p style={{ fontSize: 13 }}>Chưa làm bài nào. Chọn đề phía trên và bắt đầu.</p>
        )}
      </div>
    </>
  );
}
