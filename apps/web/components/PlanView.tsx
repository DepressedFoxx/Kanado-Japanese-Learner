"use client";

import { coverage, planSteps, resources } from "@kanado/content";

export function PlanView() {
  return (
    <>
      <div className="card">
        <h3>Trang này phủ được bao nhiêu chặng đường</h3>
        <div className="cover">
          {coverage.map((row) => {
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
                  <i className={empty ? "none" : ""} style={{ width: `${empty ? 100 : percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 13 }}>
          Thanh xám là yêu cầu của N4, thanh xanh là phần app này có sẵn. Chỗ còn thiếu phải lấy từ
          giáo trình và tài liệu nghe bên dưới — không có cách vòng.
        </p>
      </div>

      <div className="card steps">
        {planSteps.map((step) => (
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
              {resources.map((resource) => (
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

      <div className="card">
        <h3>Khung một giờ mỗi ngày — giữ nguyên suốt cả chặng</h3>
        <div className="glist" style={{ fontSize: 14, color: "var(--ink-2)" }}>
          <div>
            <b style={{ color: "var(--ink)" }}>20 phút flashcard</b> — chạy hết thẻ đến hạn ở mọi bộ
            đang mở. Nghỉ hai ngày là số thẻ dồn gấp đôi.
          </div>
          <div>
            <b style={{ color: "var(--ink)" }}>20 phút giáo trình</b> — nửa bài Minna no Nihongo, gồm
            cả phần bài tập.
          </div>
          <div>
            <b style={{ color: "var(--ink)" }}>20 phút nghe</b> — từ tháng thứ 6 trở đi. Trước đó
            dùng 20 phút này cho kanji.
          </div>
          <div>
            <b style={{ color: "var(--ink)" }}>Mỗi Chủ nhật</b> — một đề ở tab Kiểm tra, đúng cấp độ
            đang học, 30 câu.
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Gõ tiếng Nhật trên Windows</h3>
        <div className="glist" style={{ fontSize: 14, color: "var(--ink-2)" }}>
          <div>
            <b style={{ color: "var(--ink)" }}>Cài</b> — Settings → Time &amp; language → Language
            &amp; region → Add a language → Japanese. Chuyển bàn phím bằng <b>Win + Space</b>.
          </div>
          <div>
            <b style={{ color: "var(--ink)" }}>Gõ</b> — bật chế độ あ, gõ romaji ra hiragana:{" "}
            <span className="mono">ka-i-sha</span> → かいしゃ. <b>Space</b> đổi sang kanji,{" "}
            <b>Enter</b> chốt.
          </div>
          <div>
            <b style={{ color: "var(--ink)" }}>Katakana</b> — gõ xong nhấn <b>F7</b> là chuyển ngay
            sang katakana.
          </div>
          <div>
            <b style={{ color: "var(--ink)" }}>Mẹo gõ</b> — ん gõ <span className="mono">nn</span>,
            chữ nhỏ っ gõ bằng cách lặp phụ âm (<span className="mono">kitte</span> → きって), ー gõ
            bằng phím gạch ngang.
          </div>
        </div>
      </div>
    </>
  );
}
