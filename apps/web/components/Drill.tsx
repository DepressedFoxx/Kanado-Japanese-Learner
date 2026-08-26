"use client";

import {
  confusableChars,
  kana,
  kanaKey,
  type KanaEntry,
  type KanaGroup,
} from "@kanado/content";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speak } from "@/lib/speech";
import { isMastered, isWeak, useProgress, type KanaStat } from "@/lib/store";
import { normalizeRomaji, shuffle, unique } from "@/lib/utils";

type Script = "hiragana" | "katakana";
type GroupFilter = KanaGroup | "confuse";
type Mode = "k2r" | "r2k" | "type";

interface Question {
  entry: KanaEntry;
  script: Script;
  char: string;
  key: string;
}

const GROUPS: { id: GroupFilter; label: string }[] = [
  { id: "gojuon", label: "Cơ bản (46)" },
  { id: "dakuten", label: "Dakuten ゛゜" },
  { id: "yoon", label: "Âm ghép ャュョ" },
  { id: "extended", label: "Mở rộng ファ ヴ" },
  { id: "confuse", label: "Chỉ cặp dễ nhầm" },
];

const MODES: { id: Mode; label: string }[] = [
  { id: "k2r", label: "Chữ → romaji" },
  { id: "r2k", label: "Romaji → chữ" },
  { id: "type", label: "Gõ romaji" },
];

export function Drill() {
  const { kana: stats, recordKana, resetAll } = useProgress();

  const [scripts, setScripts] = useState<Script[]>(["katakana"]);
  const [groups, setGroups] = useState<GroupFilter[]>(["gojuon"]);
  const [mode, setMode] = useState<Mode>("k2r");

  const [current, setCurrent] = useState<Question | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [session, setSession] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);

  const lastChar = useRef<string | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  const pool = useMemo<Question[]>(() => {
    const out: Question[] = [];
    for (const script of scripts) {
      for (const entry of kana) {
        const char = script === "hiragana" ? entry.hiragana : entry.katakana;
        if (!char) continue;
        const inConfuse =
          groups.includes("confuse") && script === "katakana" && confusableChars.includes(char);
        if (inConfuse || groups.includes(entry.group)) {
          out.push({ entry, script, char, key: kanaKey(entry, script) });
        }
      }
    }
    return out;
  }, [scripts, groups]);

  const pick = useCallback(
    (available: Question[]): Question | null => {
      if (!available.length) return null;

      // Chữ hay sai được hỏi dày hơn, chữ đã thuộc thưa hẳn đi.
      const weighted = available.map((question) => {
        const stat: KanaStat | undefined = statsRef.current[question.key];
        let weight = 1;
        if (stat) {
          weight = 1 + stat.wrong * 2.5 - Math.min(stat.streak, 4) * 0.18;
          if (stat.streak >= 4) weight = 0.25;
        }
        if (lastChar.current === question.char && available.length > 1) weight = 0.01;
        return { question, weight: Math.max(weight, 0.05) };
      });

      const total = weighted.reduce((sum, w) => sum + w.weight, 0);
      let roll = Math.random() * total;
      for (const item of weighted) {
        roll -= item.weight;
        if (roll <= 0) return item.question;
      }
      return weighted[0].question;
    },
    [],
  );

  const next = useCallback(() => {
    setFeedback(null);
    setPicked(null);
    setLocked(false);
    setTyped("");

    const question = pick(pool);
    setCurrent(question);
    if (!question) {
      setOptions([]);
      return;
    }
    lastChar.current = question.char;

    if (mode === "type") {
      setOptions([]);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    if (mode === "k2r") {
      const wrong = shuffle(
        unique(pool.map((q) => q.entry.romaji).filter((r) => r !== question.entry.romaji)),
      ).slice(0, 3);
      setOptions(shuffle([question.entry.romaji, ...wrong]));
    } else {
      const wrong = shuffle(
        unique(pool.map((q) => q.char).filter((c) => c !== question.char)),
      ).slice(0, 3);
      setOptions(shuffle([question.char, ...wrong]));
    }
  }, [mode, pick, pool]);

  useEffect(() => {
    next();
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [next]);

  function answer(value: string) {
    if (locked || !current) return;
    setLocked(true);
    setPicked(value);

    const expected = mode === "k2r" ? current.entry.romaji : current.char;
    const ok =
      mode === "type"
        ? normalizeRomaji(value) === normalizeRomaji(current.entry.romaji)
        : value === expected;

    recordKana(current.key, ok);
    setSession((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    setStreak((s) => (ok ? s + 1 : 0));
    setFeedback({
      ok,
      text: ok
        ? `Đúng — ${current.char} = ${current.entry.romaji}`
        : `Sai. ${current.char} đọc là ${current.entry.romaji}`,
    });
    speak(current.char);

    timeout.current = setTimeout(next, ok ? 700 : 1600);
  }

  const masteredCount = Object.values(stats).filter((s) => isMastered(s)).length;
  const weak = Object.entries(stats)
    .filter(([, s]) => isWeak(s))
    .sort((a, b) => b[1].wrong - a[1].wrong)
    .slice(0, 24);

  const correctAnswer = current ? (mode === "k2r" ? current.entry.romaji : current.char) : "";

  return (
    <>
      <div className="card">
        <h3>Bảng chữ</h3>
        <div className="toolbar">
          {(["katakana", "hiragana"] as Script[]).map((script) => (
            <button
              key={script}
              className="chip"
              aria-pressed={scripts.includes(script)}
              onClick={() =>
                setScripts((prev) =>
                  prev.includes(script)
                    ? prev.length > 1
                      ? prev.filter((s) => s !== script)
                      : prev
                    : [...prev, script],
                )
              }
            >
              {script === "katakana" ? "Katakana" : "Hiragana"}
            </button>
          ))}
        </div>

        <h3>Nhóm</h3>
        <div className="toolbar">
          {GROUPS.map((group) => (
            <button
              key={group.id}
              className="chip"
              aria-pressed={groups.includes(group.id)}
              onClick={() =>
                setGroups((prev) =>
                  prev.includes(group.id)
                    ? prev.length > 1
                      ? prev.filter((g) => g !== group.id)
                      : prev
                    : [...prev, group.id],
                )
              }
            >
              {group.label}
            </button>
          ))}
        </div>

        <h3>Kiểu hỏi</h3>
        <div className="toolbar">
          {MODES.map((item) => (
            <button
              key={item.id}
              className="chip"
              aria-pressed={mode === item.id}
              onClick={() => setMode(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="quizcard">
        {!current ? (
          <div className="prompt msg">Chọn ít nhất một bảng chữ và một nhóm để bắt đầu.</div>
        ) : mode === "r2k" ? (
          <div className="prompt small mono">{current.entry.romaji}</div>
        ) : (
          <div className="prompt jp">{current.char}</div>
        )}

        {mode !== "type" && current && (
          <div className="opts">
            {options.map((option) => {
              const tone =
                locked && option === correctAnswer
                  ? " ok"
                  : locked && option === picked
                    ? " no"
                    : "";
              return (
                <button
                  key={option}
                  className={`opt ${mode === "k2r" ? "mono" : "jp"}${tone}`}
                  disabled={locked}
                  onClick={() => answer(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {mode === "type" && current && (
          <form
            className="typerow"
            onSubmit={(event) => {
              event.preventDefault();
              if (typed.trim()) answer(typed);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={typed}
              disabled={locked}
              placeholder="gõ romaji rồi Enter"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => setTyped(event.target.value)}
            />
            <button className="btn" type="submit" disabled={locked}>
              Kiểm tra
            </button>
          </form>
        )}

        <div className={`feedback${feedback ? (feedback.ok ? " ok" : " no") : ""}`}>
          {feedback?.text ?? ""}
        </div>

        <div className="scorebar">
          <div className="score">
            <div className="v">{streak}</div>
            <div className="l">Chuỗi đúng</div>
          </div>
          <div className="score">
            <div className="v">
              {session.correct}/{session.total}
            </div>
            <div className="l">Phiên này</div>
          </div>
          <div className="score">
            <div className="v">{masteredCount}</div>
            <div className="l">Đã thuộc</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Chữ cần ôn lại</h3>
        <div className="weaklist">
          {weak.length ? (
            weak.map(([key, stat]) => (
              <span className="weak-pill" key={key}>
                <span className="jp">{key.split(":")[1]}</span>
                <small>sai {stat.wrong}</small>
              </span>
            ))
          ) : (
            <p style={{ fontSize: "13px" }}>Chưa có chữ nào cần ôn lại. Luyện thêm vài lượt nhé.</p>
          )}
        </div>
        <div>
          <button
            className="btn ghost"
            onClick={() => {
              if (confirm("Xoá toàn bộ tiến độ đã lưu?")) void resetAll();
            }}
          >
            Xoá toàn bộ tiến độ
          </button>
        </div>
      </div>
    </>
  );
}
