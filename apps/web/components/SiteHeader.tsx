"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  { href: "/listening", label: "Luyện nghe" },
  { href: "/reading", label: "Đọc hiểu" },
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
  const navigationRef = useRef<HTMLElement>(null);
  const { user, logout } = useAuth();
  const { kana, srs, syncStatus } = useProgress();
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("kanado-theme");
    const initialTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (!theme) return;

    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("kanado-theme", theme);
  }, [theme]);

  useEffect(() => {
    const currentTab = navigationRef.current?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );

    currentTab?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [pathname]);

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
    <header className="site-header">
      <div className="header-main">
        <Link href="/" className="brand">
          <span className="brand-mark jp" aria-hidden="true">
            仮名
          </span>
          <span className="brand-copy">
            <strong>Kanadō</strong>
            <small>Học tiếng Nhật tới N3</small>
          </span>
        </Link>

        <div className="hstat" aria-label="Tiến độ học tập">
          <div className="header-metric">
            <div className="num">{masteredKana + masteredCards}</div>
            <div className="lbl">Đã thuộc</div>
          </div>
          <div className="header-metric">
            <div className="num">
              {correct + wrong > 0 ? `${Math.round((correct / (correct + wrong)) * 100)}%` : "–"}
            </div>
            <div className="lbl">Chính xác</div>
          </div>
          <div className="header-metric">
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
              <button className="header-action" onClick={() => void logout()}>
                <LogOut size={15} aria-hidden="true" />
                <span>Thoát</span>
              </button>
            </>
          ) : (
            <Link href="/login" className="header-action">
              <LogIn size={15} aria-hidden="true" />
              <span>Đăng nhập</span>
            </Link>
          )}
          <button
            className="header-action header-theme"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            title={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          >
            {theme === "dark" ? (
              <Sun size={16} aria-hidden="true" />
            ) : (
              <Moon size={16} aria-hidden="true" />
            )}
            <span>Giao diện</span>
          </button>
        </div>
      </div>

      <div className="header-nav-wrap">
        <nav ref={navigationRef} aria-label="Nội dung học">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={pathname === tab.href ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
