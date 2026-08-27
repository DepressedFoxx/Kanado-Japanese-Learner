"use client";

import { type Level } from "@kanado/content";
import { useMemo, useState } from "react";
import { ContentStatusNote, useVocabGroups } from "@/lib/content";
import { speak } from "@/lib/speech";

type LevelTab = Level | "kana";

const TABS: { id: LevelTab; label: string }[] = [
  { id: "kana", label: "Katakana" },
  { id: "N5", label: "N5" },
  { id: "N4", label: "N4" },
  { id: "N3", label: "N3" },
];

export function VocabList() {
  const [tab, setTab] = useState<LevelTab>("kana");
  const { data: vocabGroups, status } = useVocabGroups();

  const groups = useMemo(() => vocabGroups.filter((g) => g.level === tab), [tab, vocabGroups]);
  const [groupId, setGroupId] = useState<string | null>(null);

  const group = groups.find((g) => g.id === groupId) ?? groups[0];

  return (
    <>
      <div className="toolbar">
        {TABS.map((item) => (
          <button
            key={item.id}
            className="chip"
            aria-pressed={tab === item.id}
            onClick={() => {
              setTab(item.id);
              setGroupId(null);
            }}
          >
            {item.label}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
          {groups.reduce((sum, g) => sum + g.items.length, 0)} từ trong {groups.length} nhóm
        </span>
        <ContentStatusNote status={status} />
      </div>

      <div className="toolbar">
        {groups.map((item) => (
          <button
            key={item.id}
            className="chip"
            aria-pressed={item.id === group?.id}
            onClick={() => setGroupId(item.id)}
          >
            {item.label.replace(/^N[345] · /, "")}
          </button>
        ))}
      </div>

      {group?.items.some((item) => item.source === "imported") && (
        <p style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
          Nhóm này lấy từ từ điển mở nên nghĩa là tiếng Anh. Các nhóm theo chủ đề phía trước có
          nghĩa tiếng Việt.
        </p>
      )}

      <div className="vocab">
        {group?.items.map((item) => (
          <button className="v" key={`${group.id}-${item.word}`} onClick={() => speak(item.reading)}>
            <span className="kw jp">{item.word}</span>
            <span className="ro">
              {item.katakana ? item.romaji : `${item.reading} · ${item.romaji}`}
            </span>
            <span className="mn">
              {item.meaning}
              {item.source === "imported" && <span className="entag">EN</span>}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
