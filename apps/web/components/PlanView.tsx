"use client";

import {
  coverage,
  coverageN3,
  planSteps,
  planStepsN3,
  resources,
  resourcesN3,
  type CoverageRow,
  type PlanStep,
  type Resource,
} from "@kanado/content";
import { useState } from "react";

type Stage = "n4" | "n3";

export function PlanView() {
  const [stage, setStage] = useState<Stage>("n4");
  const isN4 = stage === "n4";

  const steps: PlanStep[] = isN4 ? planSteps : planStepsN3;
  const rows: CoverageRow[] = isN4 ? coverage : coverageN3;
  const books: Resource[] = isN4 ? resources : resourcesN3;

  return (
    <>
      <div className="toolbar">
        <button className="chip" aria-pressed={isN4} onClick={() => setStage("n4")}>
          Chặng 1 · Bảng chữ → N4
        </button>
        <button className="chip" aria-pressed={!isN4} onClick={() => setStage("n3")}>
          Chặng 2 · N4 → N3
        </button>
      </div>

      <p className="lede">
        {isN4 ? (
          <>
            Từ chỗ vừa xong hiragana tới đủ sức thi N4 là khoảng{" "}
            <b>9–12 tháng nếu học 1 giờ/ngày</b>, hoặc <b>6–7 tháng nếu học 2 giờ/ngày</b> và không
            bỏ ngày.
          </>
        ) : (
          <>
            Chặng này nặng gấp đôi chặng trước: <b>8–12 tháng ở nhịp 1 giờ/ngày</b>. Kanji tăng từ
            300 lên khoảng 650, từ vựng từ 1.500 lên khoảng 3.750. Chỉ bắt đầu khi N4 đã thật chắc.
          </>
        )}
      </p>

      <div className="card">
        <h3>
          {isN4 ? "App phủ được bao nhiêu chặng đường" : "App phủ được bao nhiêu cho N3"}
        </h3>
        <div className="cover">
          {rows.map((row) => {
            const percent = Math.min(100, Math.round((row.have / row.need) * 100));
            const empty = percent === 0;
            return (
              <div className="crow" key={row.label}>
                <div className="clabel">
                  <span>{row.label}</span>
                  <b>
                    {row.note === "đủ dùng"
                      ? "đủ dùng"
                      : `${row.have} / ${row.need}${row.note ? ` ${row.note}` : ""}`}
                  </b>
                </div>
                <div className="ctrack">
                  <i
                    className={empty ? "none" : ""}
                    style={{ width: `${empty ? 100 : percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 13 }}>
          {isN4 ? (
            <>
              Thanh xám là yêu cầu của N4, thanh xanh là phần app này có sẵn. Chỗ còn thiếu phải lấy
              từ giáo trình và tài liệu nghe bên dưới — không có cách vòng.
            </>
          ) : (
            <>
              App có bộ N3 nhập môn để bắt đầu ngay, nhưng còn xa mới đủ cho cả kỳ thi — phần
              thiếu phải lấy từ giáo trình. Thanh đỏ là hai mảng app không dạy được: đọc hiểu và
              nghe, cộng lại chiếm 120/180 điểm của đề N3.
            </>
          )}
        </p>
      </div>

      <div className="card steps">
        {steps.map((step) => (
          <div className="step" key={step.milestone + step.title}>
            <div className="d">{step.milestone}</div>
            <div>
              <div className="t">{step.title}</div>
              <div className="b">{step.body}</div>
              {step.criteria && <div className="crit">Xong khi: {step.criteria}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Tài liệu bắt buộc kèm theo</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="htable">
            <tbody>
              <tr>
                <th>Mảng</th>
                <th>Tài liệu</th>
                <th>Ghi chú</th>
              </tr>
              {books.map((resource) => (
                <tr key={resource.area}>
                  <td>
                    <b>{resource.area}</b>
                  </td>
                  <td>{resource.items}</td>
                  <td style={{ color: "var(--ink-3)" }}>{resource.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isN4 ? (
        <>
          <div className="card">
            <h3>Khung một giờ mỗi ngày — giữ nguyên suốt cả chặng</h3>
            <div className="glist" style={{ fontSize: 14, color: "var(--ink-2)" }}>
              <div>
                <b style={{ color: "var(--ink)" }}>20 phút flashcard</b> — chạy hết thẻ đến hạn ở
                mọi bộ đang mở. Nghỉ hai ngày là số thẻ dồn gấp đôi.
              </div>
              <div>
                <b style={{ color: "var(--ink)" }}>20 phút giáo trình</b> — nửa bài Minna no
                Nihongo, gồm cả phần bài tập.
              </div>
              <div>
                <b style={{ color: "var(--ink)" }}>20 phút nghe</b> — từ tháng thứ 6 trở đi. Trước
                đó dùng 20 phút này cho kanji.
              </div>
              <div>
                <b style={{ color: "var(--ink)" }}>Mỗi Chủ nhật</b> — một đề ở tab Kiểm tra, đúng
                cấp độ đang học, 30 câu.
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Gõ tiếng Nhật trên Windows</h3>
            <div className="glist" style={{ fontSize: 14, color: "var(--ink-2)" }}>
              <div>
                <b style={{ color: "var(--ink)" }}>Cài</b> — Settings → Time &amp; language →
                Language &amp; region → Add a language → Japanese. Chuyển bàn phím bằng{" "}
                <b>Win + Space</b>.
              </div>
              <div>
                <b style={{ color: "var(--ink)" }}>Gõ</b> — bật chế độ あ, gõ romaji ra hiragana:{" "}
                <span className="mono">ka-i-sha</span> → かいしゃ. <b>Space</b> đổi sang kanji,{" "}
                <b>Enter</b> chốt.
              </div>
              <div>
                <b style={{ color: "var(--ink)" }}>Katakana</b> — gõ xong nhấn <b>F7</b> là chuyển
                ngay sang katakana.
              </div>
              <div>
                <b style={{ color: "var(--ink)" }}>Mẹo gõ</b> — ん gõ <span className="mono">nn</span>
                , chữ nhỏ っ gõ bằng cách lặp phụ âm (<span className="mono">kitte</span> → きって), ー
                gõ bằng phím gạch ngang.
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <h3>Khung một giờ mỗi ngày ở chặng N3</h3>
          <div className="glist" style={{ fontSize: 14, color: "var(--ink-2)" }}>
            <div>
              <b style={{ color: "var(--ink)" }}>15 phút kanji và từ vựng</b> — 5 chữ mới, 20-25 từ
              mới, học theo từ ghép và theo câu chứ không theo danh sách rời.
            </div>
            <div>
              <b style={{ color: "var(--ink)" }}>15 phút ngữ pháp</b> — một mẫu mới, và quan trọng
              hơn: so nó với các mẫu gần nghĩa đã học.
            </div>
            <div>
              <b style={{ color: "var(--ink)" }}>15 phút đọc</b> — một bài NHK News Web Easy. Đọc
              hết bài rồi mới tra từ, đừng tra giữa chừng.
            </div>
            <div>
              <b style={{ color: "var(--ink)" }}>15 phút nghe</b> — chép chính tả một đoạn ngắn có
              script, rồi shadowing chính đoạn đó.
            </div>
            <div>
              App ở chặng này: chạy bộ thẻ Kanji N3 và Ngữ pháp N3 mỗi ngày, đồng thời giữ nền N5–N4 khỏi rơi rụng bằng flashcard đến hạn mỗi
              ngày, mỗi tuần một đề Tổng hợp.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
