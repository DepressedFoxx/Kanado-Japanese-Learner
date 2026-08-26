"use client";

import { vocabGroups } from "@kanado/content";
import { useState } from "react";
import { speak } from "@/lib/speech";

export function VocabList() {
  const [groupId, setGroupId] = useState("kata");
  const group = vocabGroups.find((g) => g.id === groupId) ?? vocabGroups[0];

  return (
    <>
      <div className="toolbar">
        {vocabGroups.map((item) => (
          <button
            key={item.id}
            className="chip"
            aria-pressed={item.id === groupId}
            onClick={() => setGroupId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="vocab">
        {group.items.map((item) => (
          <button className="v" key={item.word} onClick={() => speak(item.reading)}>
            <span className="kw jp">{item.word}</span>
            <span className="ro">
              {item.katakana ? item.romaji : `${item.reading} · ${item.romaji}`}
            </span>
            <span className="mn">{item.meaning}</span>
          </button>
        ))}
      </div>
    </>
  );
}
