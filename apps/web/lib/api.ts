/**
 * Lớp gọi API. Tự động gắn access token và tự làm mới khi token hết hạn.
 *
 * Ghi chú bảo mật: token lưu trong localStorage để web (Vercel) và API
 * (Railway) khác domain vẫn hoạt động đơn giản. Đổi lại, token đọc được
 * bằng JavaScript nên nếu sau này nhúng script bên thứ ba thì nên chuyển
 * refresh token sang cookie httpOnly + SameSite=None.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const ACCESS_KEY = "kanado.access";
const REFRESH_KEY = "kanado.refresh";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readToken(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return readToken(ACCESS_KEY);
}

export function getRefreshToken() {
  return readToken(REFRESH_KEY);
}

export function storeTokens(result: AuthResult) {
  try {
    window.localStorage.setItem(ACCESS_KEY, result.accessToken);
    window.localStorage.setItem(REFRESH_KEY, result.refreshToken);
  } catch {
    /* trình duyệt chặn lưu trữ — vẫn dùng được trong phiên hiện tại */
  }
}

export function clearTokens() {
  try {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* bỏ qua */
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const message = body?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  } catch {
    /* không phải JSON */
  }
  return `Lỗi ${response.status}`;
}

let refreshing: Promise<boolean> | null = null;

/** Đổi refresh token lấy cặp token mới. Gộp các lời gọi trùng nhau. */
async function refreshTokens(): Promise<boolean> {
  if (refreshing) return refreshing;

  refreshing = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    storeTokens((await response.json()) as AuthResult);
    return true;
  })().finally(() => {
    refreshing = null;
  });

  return refreshing;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401 && retry && getRefreshToken()) {
    const ok = await refreshTokens();
    if (ok) return request<T>(path, options, false);
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */

export function register(email: string, password: string, displayName?: string) {
  return request<AuthResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName: displayName || undefined }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function me() {
  return request<AuthUser & { createdAt: string }>("/auth/me");
}

export async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  clearTokens();
}

/* ------------------------------------------------------------------ *
 * Tiến độ
 * ------------------------------------------------------------------ */

export interface KanaStatPayload {
  kanaKey: string;
  correct: number;
  wrong: number;
  streak: number;
}

export interface SrsCardPayload {
  cardId: string;
  deckId: string;
  box: number;
  dueDay: number;
}

export interface AttemptPayload {
  type: string;
  level: string;
  total: number;
  correct: number;
  seconds: number;
  createdAt: string;
}

export interface ProgressSnapshot {
  kanaStats: KanaStatPayload[];
  srsCards: SrsCardPayload[];
  attempts: (AttemptPayload & { id: string })[];
}

export function fetchProgress() {
  return request<ProgressSnapshot>("/progress");
}

export function syncProgress(payload: {
  kanaStats?: KanaStatPayload[];
  srsCards?: SrsCardPayload[];
  attempts?: AttemptPayload[];
}) {
  return request<ProgressSnapshot & { syncedAt: string }>("/progress/sync", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetProgress() {
  return request<{ ok: true }>("/progress", { method: "DELETE" });
}

export interface ProgressSummary {
  kana: { correct: number; wrong: number; accuracy: number | null };
  srs: { mastered: number; dueToday: number };
  recentAttempts: (AttemptPayload & { id: string })[];
}

export function fetchSummary() {
  return request<ProgressSummary>("/progress/summary");
}
