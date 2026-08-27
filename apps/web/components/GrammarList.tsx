"use client";

import { conjugation, foundations, grammar, type Level } from "@kanado/content";
import { useState } from "react";

type Tab = "base" | Level;

export function GrammarList() {
  const [tab, setTab] = useState<Tab>("base");

  const counts = {
    N5: grammar.filter((g) => g.level === "N5").length,
    N4: grammar.filter((g) => g.level === "N4").length,
  };

  return (
    <>
      <div className="toolbar">
        <button className="chip" aria-pressed={tab === "base"} onClick={() => setTab("base")}>
          Nền tảng · {foundations.length} mục
        </button>
        {(["N5", "N4"] as Level[]).map((level) => (
          <button
            key={level}
            className="chip"
            aria-pressed={tab === level}
            onClick={() => setTab(level)}
          >
            {level} · {counts[level]} mẫu
          </button>
        ))}
      </div>

      {tab === "base" && (
        <>
          <p className="lede" style={{ fontSize: 13.5 }}>
            Trật tự từ và hệ thống thì — phần lẽ ra phải học trước mọi mẫu câu, nhưng giáo trình
            thường dạy thẳng vào mẫu nên hay bị bỏ qua. Nắm tám mục này rồi thì các mẫu N5–N4 bên
            cạnh không còn là học thuộc lòng.
          </p>
          <div className="glist">
            {foundations.map((topic) => (
              <details className="gitem" key={topic.title} open={topic === foundations[0]}>
                <summary>
                  <span className="pat" style={{ fontFamily: "inherit", fontSize: 15 }}>
                    {topic.title}
                  </span>
                  <span className="gl">{topic.gloss}</span>
                </summary>
                <div className="gbody">
                  <p style={{ fontSize: "13.5px" }}>{topic.body}</p>
                  {topic.examples.map((example, index) => (
                    <div className="ex" key={index}>
                      <span className="j jp">{example.jp}</span>
                      <span className="vn">{example.vn}</span>
                    </div>
                  ))}
                  {topic.table && (
                    <div style={{ overflowX: "auto" }}>
                      <table className="htable conj">
                        <tbody>
                          <tr>
                            {topic.table.header.map((cell, index) => (
                              <th key={index}>{cell}</th>
                            ))}
                          </tr>
                          {topic.table.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </>
      )}

      {tab === "N4" && (
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

      {tab !== "base" && (
        <div className="glist">
          {grammar
            .filter((point) => point.level === tab)
            .map((point) => (
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
      )}
    </>
  );
}
