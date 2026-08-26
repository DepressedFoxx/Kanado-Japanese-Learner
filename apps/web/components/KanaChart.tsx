"use client";

import { confusablePairs, kanaChart, kanaKey } from "@kanado/content";
import { useState } from "react";
import { speak } from "@/lib/speech";
import { isMastered, isWeak, useProgress } from "@/lib/store";

export function KanaChart({ script }: { script: "hiragana" | "katakana" }) {
  const { kana } = useProgress();
  const [hideRomaji, setHideRomaji] = useState(false);

  const sections = kanaChart.filter(
    (section) => !(script === "hiragana" && section.group === "extended"),
  );

  return (
    <>
      <div className="toolbar">
        <button
          className="chip"
          aria-pressed={hideRomaji}
          onClick={() => setHideRomaji((v) => !v)}
        >
          Ẩn romaji
        </button>
        <div className="legend">
          <span>
            <i className="dot" style={{ background: "var(--good)" }} /> đã thuộc — đúng 4 lần liên
            tiếp
          </span>
          <span>
            <i className="dot" style={{ background: "var(--bad)" }} /> cần ôn lại
          </span>
        </div>
      </div>

      <div className={`chartwrap${hideRomaji ? " hide-romaji" : ""}`}>
        {sections.map((section) => (
          <div className="rowgroup" key={section.group}>
            <div className="glabel">
              <span className="tag">{section.label}</span>
              <span className="rule" />
            </div>
            <div className={`grid${section.columns === 3 ? " w3" : ""}`}>
              {section.rows.flat().map((cell, index) => {
                const entry = cell.entry;
                const char = entry ? (script === "hiragana" ? entry.hiragana : entry.katakana) : null;

                if (!entry || !char) {
                  return <button className="cell empty" key={index} disabled />;
                }

                const stat = kana[kanaKey(entry, script)];
                const tone = isMastered(stat) ? " mastered" : isWeak(stat) ? " weak" : "";

                return (
                  <button
                    className={`cell${tone}`}
                    key={index}
                    title={entry.romaji}
                    onClick={() => speak(char)}
                  >
                    <span className="k jp">{char}</span>
                    <span className="r">{entry.romaji}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {script === "katakana" && (
        <div className="card">
          <h3>Tám cặp dễ nhầm — điểm chết của katakana</h3>
          <p style={{ fontSize: "13.5px" }}>
            Phần lớn lỗi katakana đến từ đây. Nhớ mẹo phân biệt trước, rồi luyện riêng chúng bằng
            nhóm “Chỉ cặp dễ nhầm” ở tab Luyện bảng chữ.
          </p>
          <div className="pairs">
            {confusablePairs.map((pair) => (
              <div className="pair" key={pair.a + pair.b}>
                <div className="duo jp">
                  {pair.a} {pair.b}
                </div>
                <div className="tip" dangerouslySetInnerHTML={{ __html: pair.tip }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
