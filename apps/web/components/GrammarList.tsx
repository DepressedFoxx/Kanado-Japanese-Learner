"use client";

import { conjugation, grammar, type Level } from "@kanado/content";
import { useState } from "react";

export function GrammarList() {
  const [level, setLevel] = useState<Level>("N5");
  const points = grammar.filter((point) => point.level === level);
  const counts = {
    N5: grammar.filter((g) => g.level === "N5").length,
    N4: grammar.filter((g) => g.level === "N4").length,
  };

  return (
    <>
      <div className="toolbar">
        {(["N5", "N4"] as Level[]).map((item) => (
          <button
            key={item}
            className="chip"
            aria-pressed={level === item}
            onClick={() => setLevel(item)}
          >
            {item} · {counts[item]} mẫu
          </button>
        ))}
      </div>

      {level === "N4" && (
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

      <div className="glist">
        {points.map((point) => (
          <details className="gitem" key={`${point.level}-${point.pattern}`}>
            <summary>
              <span className="pat jp">{point.pattern}</span>
              <span className="gl">{point.gloss}</span>
            </summary>
            <div className="gbody">
              <p
                style={{ fontSize: "13.5px" }}
                dangerouslySetInnerHTML={{ __html: point.note }}
              />
              {point.examples.map((example, index) => (
                <div className="ex" key={index}>
                  <span className="j jp">{example.jp}</span>
                  <span className="vn">{example.vn}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
