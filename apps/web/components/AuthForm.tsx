"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_URL, ApiError, NetworkError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { login, register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isRegister) await register(email, password, displayName);
      else await login(email, password);
      router.push("/katakana");
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof NetworkError
          ? err.message
          : "Có lỗi không xác định. Mở Console của trình duyệt để xem chi tiết.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="card authcard">
        <h2>{isRegister ? "Tạo tài khoản" : "Đăng nhập"}</h2>
        <p style={{ fontSize: 13.5 }}>
          {isRegister
            ? "Tiến độ đang có trên máy này sẽ được đẩy lên tài khoản mới, không mất gì cả."
            : "Đăng nhập để tiến độ flashcard, bảng chữ và lịch sử thi theo bạn sang mọi thiết bị."}
        </p>

        <form onSubmit={submit} className="glist">
          {isRegister && (
            <div className="field">
              <label htmlFor="displayName">Tên hiển thị (không bắt buộc)</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                maxLength={60}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {isRegister && (
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Tối thiểu 8 ký tự.</span>
            )}
          </div>

          {error && <div className="formerr">{error}</div>}
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
            Đang gọi API: <span className="mono">{API_URL}</span>
          </div>

          <button className="btn block" type="submit" disabled={busy}>
            {busy ? "Đang xử lý…" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
          </button>
        </form>

        <p style={{ fontSize: 13 }}>
          {isRegister ? (
            <>
              Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
            </>
          ) : (
            <>
              Chưa có tài khoản? <Link href="/register">Tạo mới</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
