"use client";

import { type Level } from "@kanado/content";
import { useMemo, useState } from "react";
import { HighlightedTerm } from "@/components/HighlightedTerm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useKanji } from "@/lib/content";
import {
  classifyKanji,
  KANJI_CATEGORIES,
  kanjiCategoryLabel,
  type KanjiCategory,
  type KanjiCategoryFilter,
} from "@/lib/kanji-category";
import { speak } from "@/lib/speech";
import { useProgress } from "@/lib/store";

type LevelFilter = Level | "all";

function buildKanjiExampleSentence(
  word: string,
  meaning: string,
  category: KanjiCategory,
) {
  switch (category) {
    case "people":
      return { japanese: `${word}と話します。`, meaning: `Tôi nói chuyện với ${meaning}.` };
    case "place":
      return { japanese: `${word}へ行きます。`, meaning: `Tôi đi đến ${meaning}.` };
    case "nature":
      return { japanese: `${word}を見ます。`, meaning: `Tôi nhìn ${meaning}.` };
    case "study-work":
      return { japanese: `${word}を勉強します。`, meaning: `Tôi học về ${meaning}.` };
    case "body-health":
      return { japanese: `${word}を大切にします。`, meaning: `Tôi chăm sóc ${meaning}.` };
    case "number-time":
      return { japanese: `${word}を覚えます。`, meaning: `Tôi ghi nhớ ${meaning}.` };
    default:
      return { japanese: `${word}について話します。`, meaning: `Tôi nói về ${meaning}.` };
  }
}

export function KanjiGrid() {
  const { srs } = useProgress();
  const { data: kanji } = useKanji();
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("N5");
  const [categoryFilter, setCategoryFilter] = useState<KanjiCategoryFilter>("all");
  const [query, setQuery] = useState("");

  const categorizedKanji = useMemo(
    () =>
      kanji
        .filter((item) => levelFilter === "all" || item.level === levelFilter)
        .map((item) => ({ item, category: classifyKanji(item) })),
    [kanji, levelFilter],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<KanjiCategory, number> = {
      "number-time": 0,
      people: 0,
      place: 0,
      nature: 0,
      action: 0,
      "study-work": 0,
      "body-health": 0,
      "abstract-other": 0,
    };

    for (const entry of categorizedKanji) {
      counts[entry.category]++;
    }

    return counts;
  }, [categorizedKanji]);

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return categorizedKanji.filter(({ item, category }) => {
      if (categoryFilter !== "all" && category !== categoryFilter) return false;
      if (!needle) return true;

      return (
        item.char.includes(query.trim()) ||
        item.meaning.toLowerCase().includes(needle) ||
        (item.hanViet ?? "").toLowerCase().includes(needle) ||
        item.on.includes(query.trim()) ||
        item.kun.includes(query.trim()) ||
        item.example.word.includes(query.trim()) ||
        item.example.reading.includes(query.trim()) ||
        item.example.meaning.toLowerCase().includes(needle) ||
        kanjiCategoryLabel(category).toLowerCase().includes(needle)
      );
    });
  }, [categorizedKanji, categoryFilter, query]);

  return (
    <>
      <div className="toolbar">
        {(["N5", "N4", "N3", "all"] as LevelFilter[]).map((item) => (
          <Button
            key={item}
            size="sm"
            variant={levelFilter === item ? "default" : "outline"}
            aria-pressed={levelFilter === item}
            onClick={() => {
              setLevelFilter(item);
              setCategoryFilter("all");
            }}
          >
            {item === "all" ? "Tất cả" : item}
          </Button>
        ))}
        <Input
          id="k-search"
          type="text"
          value={query}
          placeholder="tìm chữ, nghĩa, hoặc âm Hán Việt…"
          onChange={(event) => setQuery(event.target.value)}
          style={{ maxWidth: 260, fontFamily: "inherit", fontSize: 14 }}
        />
      </div>

      <div className="vocab-filter">
        <label className="vocab-filter-label" htmlFor="kanji-category">
          Chủ đề Kanji
        </label>
        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value as KanjiCategoryFilter)}
        >
          <SelectTrigger id="kanji-category" className="filter-select">
            <SelectValue>
              {KANJI_CATEGORIES.find((category) => category.id === categoryFilter)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {KANJI_CATEGORIES.map((category) => {
              const count =
                category.id === "all"
                  ? categorizedKanji.length
                  : categoryCounts[category.id];

              return (
                <SelectItem key={category.id} value={category.id}>
                  {category.label} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="vocab-result-count">
        Hiển thị <b>{list.length}</b> chữ
      </div>

      <div className="kgrid">
        {list.map(({ item, category }) => {
          const deckId =
            item.level === "N5" ? "k5" : item.level === "N4" ? "k4" : "k3";
          const state = srs[`${deckId}|${item.char}`];
          const exampleSentence = buildKanjiExampleSentence(
            item.example.word,
            item.example.meaning,
            category,
          );

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

              <span className={`kanji-category kanji-category-${category}`}>
                {kanjiCategoryLabel(category)}
              </span>

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
                  <span className="kanji-example-sentence example-sentence-jp jp">
                    <HighlightedTerm text={exampleSentence.japanese} term={item.example.word} />
                  </span>
                  <span className="example-sentence-meaning">{exampleSentence.meaning}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {list.length === 0 && <div className="vocab-empty">Không có kanji nào trong bộ lọc này.</div>}
    </>
  );
}
