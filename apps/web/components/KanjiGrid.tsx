"use client";

import { kanji, type Level } from "@kanado/content";
import { useMemo, useState } from "react";
import { speak } from "@/lib/speech";
import { useProgress } from "@/lib/store";

type Filter = Level | "all";

export function KanjiGrid() {
  const { srs } = useProgress();
  const [filter, setFilter] = useState<Filter>("N5");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return kanji.filter((item) => {
      if (filter !== "all" && item.level !== filter) return false;
      if (!needle) return true;
      return (
        item.char.includes(query.trim()) ||
        item.meaning.toLowerCase().includes(needle) ||
        item.on.includes(query.trim()) ||
        item.kun.includes(query.trim()) ||
        item.example.word.includes(query.trim()) ||
        item.example.reading.includes(query.trim()) ||
        item.example.meaning.toLowerCase().includes(needle)
      );
    });
  }, [filter, query]);

  return (
    <>
      <div className="toolbar">
        {(["N5", "N4", "all"] as Filter[]).map((item) => (
          <button
            key={item}
            className="chip"
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
          >
            {item === "all" ? "Tất cả" : item}
          </button>
        ))}
        <input
          id="k-search"
          type="text"
          value={query}
          placeholder="tìm chữ hoặc nghĩa…"
          onChange={(event) => setQuery(event.target.value)}
          style={{ maxWidth: 220, fontFamily: "inherit", fontSize: 14 }}
        />
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{list.length} chữ</span>
      </div>

      <div className="kgrid">
        {list.map((item) => {
          const deckId = item.level === "N5" ? "k5" : "k4";
          const state = srs[`${deckId}|${item.char}`];
          return (
            <button
              key={item.char}
              className={`kc${state && state.box >= 4 ? " mastered" : ""}`}
              onClick={() => speak(item.example.reading)}
            >
              <div className="top">
                <span className="ch jp">{item.char}</span>
                <span className="mean">{item.meaning}</span>
                <span className="lv">{item.level}</span>
              </div>
              <div className="yomi">
                <b>ON</b> {item.on || "—"} &nbsp; <b>KUN</b> {item.kun || "—"}
              </div>
              <div className="ex">
                <span className="exw jp">{item.example.word}</span> {item.example.reading} —{" "}
                {item.example.meaning}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
