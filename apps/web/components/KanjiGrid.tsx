"use client";

import { type Level } from "@kanado/content";
import { useMemo, useState } from "react";
import { ContentStatusNote, useKanji } from "@/lib/content";
import { speak } from "@/lib/speech";
import { useProgress } from "@/lib/store";

type Filter = Level | "all";

export function KanjiGrid() {
  const { srs } = useProgress();
  const { data: kanji, status } = useKanji();
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
        (item.hanViet ?? "").toLowerCase().includes(needle) ||
        item.on.includes(query.trim()) ||
        item.kun.includes(query.trim()) ||
        item.example.word.includes(query.trim()) ||
        item.example.reading.includes(query.trim()) ||
        item.example.meaning.toLowerCase().includes(needle)
      );
    });
  }, [filter, query, kanji]);

  const importedCount = list.filter((k) => k.source === "imported").length;

  return (
    <>
      <div className="toolbar">
        {(["N5", "N4", "N3", "all"] as Filter[]).map((item) => (
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
          placeholder="tìm chữ, nghĩa, hoặc âm Hán Việt…"
          onChange={(event) => setQuery(event.target.value)}
          style={{ maxWidth: 260, fontFamily: "inherit", fontSize: 14 }}
        />
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
          {list.length} chữ
          {importedCount > 0 && ` · ${importedCount} chữ nghĩa tiếng Anh`}
        </span>
        <ContentStatusNote status={status} />
      </div>

      <div className="kgrid">
        {list.map((item) => {
          const deckId =
            item.level === "N5" ? "k5" : item.level === "N4" ? "k4" : "k3";
          const state = srs[`${deckId}|${item.char}`];
          return (
            <button
              key={item.char}
              className={`kc${state && state.box >= 4 ? " mastered" : ""}`}
              onClick={() => speak(item.example.reading)}
            >
              <div className="top">
                <span className="ch jp">{item.char}</span>
                <span className="mean">
                  {item.meaning}
                  {item.source === "imported" && <span className="entag">EN</span>}
                </span>
                <span className="lv">{item.level}</span>
              </div>

              {item.hanViet && (
                <div className="hanviet">
                  Hán Việt: <b>{item.hanViet}</b>
                  {item.strokes ? <span className="strokes"> · {item.strokes} nét</span> : null}
                </div>
              )}

              <div className="yomi">
                <b>ON</b> {item.on || "—"}
                {item.onRomaji && <span className="rj"> {item.onRomaji}</span>}
              </div>
              <div className="yomi">
                <b>KUN</b> {item.kun || "—"}
                {item.kunRomaji && <span className="rj"> {item.kunRomaji}</span>}
              </div>

              {item.source === "vi" && (
                <div className="ex">
                  <span className="exw jp">{item.example.word}</span> {item.example.reading}
                  <span className="rj"> {item.example.readingRomaji}</span>
                  <br />
                  {item.example.meaning}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
