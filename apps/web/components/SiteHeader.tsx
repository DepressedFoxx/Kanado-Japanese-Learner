"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { isMastered, useProgress } from "@/lib/store";

const TABS = [
  { href: "/katakana", label: "Katakana" },
  { href: "/hiragana", label: "Hiragana" },
  { href: "/drill", label: "Luyện bảng chữ" },
  { href: "/flashcard", label: "Flashcard" },
  { href: "/vocab", label: "Từ vựng" },
  { href: "/kanji", label: "Kanji" },
  { href: "/grammar", label: "Ngữ pháp" },
  { href: "/test", label: "Kiểm tra" },
  { href: "/plan", label: "Lộ trình" },
];

const SYNC_LABEL: Record<string, string> = {
  local: "Chỉ lưu trên máy này",
  syncing: "Đang đồng bộ…",
  synced: "Đã đồng bộ",
  error: "Lỗi đồng bộ",
};

export function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { kana, srs, syncStatus } = useProgress();
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    if (theme) document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const kanaValues = Object.values(kana);
  const correct = kanaValues.reduce((sum, s) => sum + s.correct, 0);
  const wrong = kanaValues.reduce((sum, s) => sum + s.wrong, 0);
  const masteredKana = kanaValues.filter((s) => isMastered(s)).length;
  const masteredCards = Object.values(srs).filter((c) => c.box >= 4).length;

  function toggleTheme() {
    const current =
      theme ??
      (document.documentElement.getAttribute("data-theme") as "light" | "dark" | null) ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(current === "dark" ? "light" : "dark");
  }

  return (
    <header>
      <div className="bar">
        <Link href="/" className="brand" style={{ textDecoration: "none" }}>
          <span className="logo jp">仮名道</span>
          <span className="name">Học tiếng Nhật tới N4</span>
        </Link>

        <div className="hstat">
          <div>
            <div className="num">{masteredKana + masteredCards}</div>
            <div className="lbl">Đã thuộc</div>
          </div>
          <div>
            <div className="num">
              {correct + wrong > 0 ? `${Math.round((correct / (correct + wrong)) * 100)}%` : "–"}
            </div>
            <div className="lbl">Chính xác</div>
          </div>
          <div>
            <div className="num">{correct + wrong}</div>
            <div className="lbl">Lượt ôn</div>
          </div>
        </div>

        <div className="authbar">
          <span
            className={`syncdot ${syncStatus === "synced" ? "on" : syncStatus === "error" ? "err" : "off"}`}
            title={SYNC_LABEL[syncStatus]}
          />
          {user ? (
            <>
              <Link href="/account" className="who link-muted">
                {user.displayName || user.email}
              </Link>
              <button className="iconbtn" onClick={() => void logout()}>
                Thoát
              </button>
            </>
          ) : (
            <Link href="/login" className="iconbtn">
              Đăng nhập
            </Link>
          )}
          <button className="iconbtn" onClick={toggleTheme}>
            Sáng / Tối
          </button>
        </div>
      </div>

      <nav>
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-selected={pathname === tab.href}
            role="tab"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
