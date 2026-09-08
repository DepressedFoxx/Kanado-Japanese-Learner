"use client";

import { type Level, type VocabEntry, type VocabGroup } from "@kanado/content";
import { useMemo, useState } from "react";
import { HighlightedTerm } from "@/components/HighlightedTerm";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentStatusNote, useVocabGroups } from "@/lib/content";
import { speak } from "@/lib/speech";
import {
  classifyVocabPartOfSpeech,
  VOCAB_PARTS_OF_SPEECH,
  vocabPartOfSpeechLabel,
  type VocabPartOfSpeech,
  type VocabPartOfSpeechFilter,
} from "@/lib/vocab-part-of-speech";

type LevelTab = Level | "kana";

const LEVEL_TABS: { id: LevelTab; label: string }[] = [
  { id: "kana", label: "Katakana" },
  { id: "N5", label: "N5" },
  { id: "N4", label: "N4" },
  { id: "N3", label: "N3" },
];

interface CategorizedVocab {
  group: VocabGroup;
  item: VocabEntry;
  partOfSpeech: VocabPartOfSpeech;
}

interface VocabExample {
  japanese: string;
  meaning: string;
}

function buildVocabExample(
  item: VocabEntry,
  partOfSpeech: VocabPartOfSpeech,
): VocabExample {
  switch (partOfSpeech) {
    case "verb":
      return {
        japanese: `わたしは${item.word}。`,
        meaning: `Tôi ${item.meaning}.`,
      };
    case "adjective":
      return {
        japanese: `これは${item.word}ものです。`,
        meaning: `Đây là một thứ ${item.meaning}.`,
      };
    case "adverb":
      return {
        japanese: `${item.word}話します。`,
        meaning: `Tôi nói ${item.meaning}.`,
      };
    default:
      return {
        japanese: `これは${item.word}です。`,
        meaning: `Đây là ${item.meaning}.`,
      };
  }
}

export function VocabList() {
  const [level, setLevel] = useState<LevelTab>("kana");
  const [partOfSpeech, setPartOfSpeech] = useState<VocabPartOfSpeechFilter>("all");
  const [groupId, setGroupId] = useState<string | null>(null);
  const { data: vocabGroups, status } = useVocabGroups();

  const groups = useMemo(
    () => vocabGroups.filter((group) => group.level === level),
    [level, vocabGroups],
  );

  const categorizedItems = useMemo<CategorizedVocab[]>(
    () =>
      groups.flatMap((group) =>
        group.items.map((item) => ({
          group,
          item,
          partOfSpeech: classifyVocabPartOfSpeech(item, group.label),
        })),
      ),
    [groups],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<VocabPartOfSpeech, number> = {
      noun: 0,
      verb: 0,
      adjective: 0,
      adverb: 0,
      other: 0,
    };

    for (const entry of categorizedItems) {
      counts[entry.partOfSpeech]++;
    }

    return counts;
  }, [categorizedItems]);

  const visibleItems = categorizedItems.filter((entry) => {
    if (partOfSpeech !== "all" && entry.partOfSpeech !== partOfSpeech) return false;
    if (groupId === "imported") return entry.item.source === "imported";
    if (groupId) return entry.group.id === groupId;
    return true;
  });

  const topicGroups = groups.filter((group) => !group.id.startsWith("imp-"));
  const hasImportedGroups = groups.some((group) => group.id.startsWith("imp-"));

  return (
    <>
      <div className="toolbar">
        {LEVEL_TABS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={level === item.id ? "default" : "outline"}
            aria-pressed={level === item.id}
            onClick={() => {
              setLevel(item.id);
              setPartOfSpeech("all");
              setGroupId(null);
            }}
          >
            {item.label}
          </Button>
        ))}
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
          {categorizedItems.length} từ
        </span>
        <ContentStatusNote status={status} />
      </div>

      <div className="vocab-filter">
        <span className="vocab-filter-label">Loại từ</span>
        <div className="toolbar">
          {VOCAB_PARTS_OF_SPEECH.map((item) => {
            const count =
              item.id === "all" ? categorizedItems.length : categoryCounts[item.id];

            return (
              <Button
                key={item.id}
                size="sm"
                variant={partOfSpeech === item.id ? "default" : "outline"}
                aria-pressed={partOfSpeech === item.id}
                onClick={() => setPartOfSpeech(item.id)}
              >
                {item.label} <span className="chip-count">{count}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="vocab-filter">
        <label className="vocab-filter-label" htmlFor="vocab-topic">
          Chủ đề
        </label>
        <Select
          value={groupId ?? "all"}
          onValueChange={(value) => setGroupId(value === "all" ? null : String(value))}
        >
          <SelectTrigger id="vocab-topic" className="filter-select">
            <SelectValue>
              {groupId === "imported"
                ? "Kho từ mở rộng"
                : topicGroups
                    .find((group) => group.id === groupId)
                    ?.label.replace(/^N[345] · /, "") || "Tất cả chủ đề"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chủ đề</SelectItem>
            <SelectGroup>
              <SelectLabel>Theo chủ đề</SelectLabel>
              {topicGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.label.replace(/^N[345] · /, "")}
                </SelectItem>
              ))}
            </SelectGroup>
            {hasImportedGroups && (
              <SelectItem value="imported">Kho từ mở rộng</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {visibleItems.some((entry) => entry.item.source === "imported") && (
        <p style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
          Kho từ mở rộng dùng nghĩa tiếng Anh. Loại từ của phần này được nhận diện từ dạng từ và
          nghĩa trong từ điển.
        </p>
      )}

      <div className="vocab-result-count">
        Hiển thị <b>{visibleItems.length}</b> từ
      </div>

      <div className="vocab">
        {visibleItems.map(({ group, item, partOfSpeech: category }) => {
          const example = buildVocabExample(item, category);

          return (
            <button
              className="v"
              key={`${group.id}-${item.word}`}
              onClick={() => speak(item.reading)}
            >
              <span className="vocab-card-heading">
                <span className="kw jp">{item.word}</span>
                <span className={`pos-tag pos-${category}`}>
                  {vocabPartOfSpeechLabel(category)}
                </span>
              </span>
              <span className="ro">
                {item.katakana ? item.romaji : `${item.reading} · ${item.romaji}`}
              </span>
              <span className="mn">
                {item.meaning}
                {item.source === "imported" && <span className="entag">EN</span>}
              </span>
              <span className="vocab-example">
                <span className="example-sentence-jp jp">
                  <HighlightedTerm text={example.japanese} term={item.word} />
                </span>
                <span className="example-sentence-meaning">{example.meaning}</span>
              </span>
            </button>
          );
        })}
      </div>

      {visibleItems.length === 0 && (
        <div className="vocab-empty">Không có từ nào trong bộ lọc này.</div>
      )}
    </>
  );
}
