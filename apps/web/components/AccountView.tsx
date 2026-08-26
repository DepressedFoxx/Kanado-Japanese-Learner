"use client";

import { decks, kanji, kana } from "@kanado/content";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { isMastered, today, useProgress } from "@/lib/store";
import { formatDateTime, formatTime } from "@/lib/utils";

const TEST_NAME: Record<string, string> = {
  kana: "Bảng chữ",
  vocab: "Từ vựng",
  kanji: "Kanji",
  grammar: "Ngữ pháp",
  mix: "Tổng hợp",
};

const SYNC_TEXT: Record<string, string> = {
  local: "Chưa đăng nhập — tiến độ chỉ nằm trên máy này",
  syncing: "Đang đồng bộ…",
  synced: "Đã đồng bộ lên máy chủ",
  error: "Không đồng bộ được — sẽ thử lại ở thao tác kế tiếp",
};

export function AccountView() {
  const { user, ready } = useAuth();
  const { kana: kanaStats, srs, attempts, syncStatus, lastSyncedAt, syncNow, resetAll } =
    useProgress();

  if (!ready) return <div className="loading">Đang tải…</div>;

  if (!user) {
    return (
      <div className="panel">
        <div className="card authcard">
          <h2>Chưa đăng nhập</h2>
          <p style={{ fontSize: 13.5 }}>
            Tiến độ đang được lưu trong trình duyệt này. Đăng nhập để đồng bộ sang máy khác và không
            mất khi xoá dữ liệu trình duyệt.
          </p>
          <div className="toolbar">
            <Link className="btn" href="/login">
              Đăng nhập
            </Link>
            <Link className="chip" href="/register">
              Tạo tài khoản
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const day = today();
  const kanaValues = Object.values(kanaStats);
  const correct = kanaValues.reduce((sum, s) => sum + s.correct, 0);
  const wrong = kanaValues.reduce((sum, s) => sum + s.wrong, 0);
  const masteredKana = kanaValues.filter((s) => isMastered(s)).length;
  const totalKana = kana.filter((k) => k.hiragana).length + kana.length;

  const srsValues = Object.entries(srs);
  const masteredCards = srsValues.filter(([, s]) => s.box >= 4).length;
  const dueToday = srsValues.filter(([, s]) => s.dueDay <= day).length;
  const totalCards = decks.reduce((sum, deck) => sum + deck.size, 0);
  const masteredKanji = srsValues.filter(
    ([id, s]) => (id.startsWith("k5|") || id.startsWith("k4|")) && s.box >= 4,
  ).length;

  return (
    <div className="panel">
      <div>
        <h2>Tài khoản</h2>
        <p className="lede">
          {user.displayName ? `${user.displayName} · ` : ""}
          {user.email}
        </p>
      </div>

      <div className="card">
        <h3>Đồng bộ</h3>
        <div className="toolbar">
          <span className={`syncdot ${syncStatus === "synced" ? "on" : syncStatus === "error" ? "err" : "off"}`} />
          <span style={{ fontSize: 13.5 }}>{SYNC_TEXT[syncStatus]}</span>
          {lastSyncedAt && (
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
              lần cuối {formatDateTime(lastSyncedAt)}
            </span>
          )}
        </div>
        <div className="toolbar">
          <button className="chip" onClick={() => void syncNow()}>
            Đồng bộ ngay
          </button>
          <button
            className="chip"
            onClick={() => {
              if (confirm("Xoá toàn bộ tiến độ trên máy này và trên máy chủ?")) void resetAll();
            }}
          >
            Xoá toàn bộ tiến độ
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Tiến độ tổng</h3>
        <div className="cover">
          <Bar label="Ký tự bảng chữ đã thuộc" have={masteredKana} need={totalKana} />
          <Bar label="Kanji đã thuộc" have={masteredKanji} need={kanji.length} />
          <Bar label="Thẻ đã thuộc (mọi bộ)" have={masteredCards} need={totalCards} />
        </div>
        <div className="scorebar">
          <div className="score">
            <div className="v">{dueToday}</div>
            <div className="l">Thẻ đến hạn hôm nay</div>
          </div>
          <div className="score">
            <div className="v">
              {correct + wrong > 0 ? `${Math.round((correct / (correct + wrong)) * 100)}%` : "–"}
            </div>
            <div className="l">Chính xác bảng chữ</div>
          </div>
          <div className="score">
            <div className="v">{attempts.length}</div>
            <div className="l">Bài đã làm</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Mười bài kiểm tra gần nhất</h3>
        {attempts.length ? (
          <div style={{ overflowX: "auto" }}>
            <table className="htable">
              <tbody>
                <tr>
                  <th>Lúc</th>
                  <th>Đề</th>
                  <th>Cấp</th>
                  <th style={{ textAlign: "right" }}>Điểm</th>
                  <th style={{ textAlign: "right" }}>Thời gian</th>
                </tr>
                {[...attempts]
                  .slice(-10)
                  .reverse()
                  .map((attempt, index) => (
                    <tr key={index}>
                      <td>{formatDateTime(attempt.createdAt)}</td>
                      <td>{TEST_NAME[attempt.type] ?? attempt.type}</td>
                      <td>{attempt.level === "both" ? "N5+N4" : attempt.level}</td>
                      <td className="n">
                        {Math.round((attempt.correct / attempt.total) * 100)}%
                      </td>
                      <td className="n">{formatTime(attempt.seconds)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: 13 }}>Chưa có bài nào.</p>
        )}
      </div>
    </div>
  );
}

function Bar({ label, have, need }: { label: string; have: number; need: number }) {
  const percent = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 0;
  return (
    <div className="crow">
      <div className="clabel">
        <span>{label}</span>
        <b>
          {have} / {need}
        </b>
      </div>
      <div className="ctrack">
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
