"use client";

/**
 * Kho tiến độ học: localStorage là nguồn dùng ngay, server là nơi lưu bền.
 *
 * Nguyên tắc: app luôn chạy được khi offline hoặc chưa đăng nhập. Khi đã
 * đăng nhập, mọi thay đổi được gom lại và đẩy lên server sau 1,5 giây —
 * học không bị khựng vì chờ mạng.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as api from "./api";

export interface KanaStat {
  correct: number;
  wrong: number;
  streak: number;
}

export interface SrsState {
  box: number;
  dueDay: number;
  deckId: string;
}

export interface Attempt {
  type: string;
  level: string;
  total: number;
  correct: number;
  seconds: number;
  createdAt: string;
}

export interface ProgressState {
  kana: Record<string, KanaStat>;
  srs: Record<string, SrsState>;
  attempts: Attempt[];
}

export type SyncStatus = "local" | "syncing" | "synced" | "error";

const LS_KEY = "kanado.progress.v2";
const SYNC_DELAY = 1500;

const EMPTY: ProgressState = { kana: {}, srs: {}, attempts: [] };

export function today(): number {
  return Math.floor(Date.now() / 86_400_000);
}

function loadLocal(): ProgressState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return migrateLegacy();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      kana: parsed.kana ?? {},
      srs: parsed.srs ?? {},
      attempts: parsed.attempts ?? [],
    };
  } catch {
    return EMPTY;
  }
}

/** Nhặt lại tiến độ từ bản HTML một trang, để không mất công học lại. */
function migrateLegacy(): ProgressState {
  const state: ProgressState = { kana: {}, srs: {}, attempts: [] };
  try {
    const oldStats = JSON.parse(window.localStorage.getItem("kanado.v1") ?? "{}");
    for (const [key, value] of Object.entries(oldStats as Record<string, KanaStat>)) {
      state.kana[key] = {
        correct: value.correct ?? 0,
        wrong: value.wrong ?? 0,
        streak: value.streak ?? 0,
      };
    }

    const oldSrs = JSON.parse(window.localStorage.getItem("kanado.srs.v1") ?? "{}");
    for (const [cardId, value] of Object.entries(oldSrs as Record<string, { box: number; due: number }>)) {
      state.srs[cardId] = {
        box: value.box ?? 0,
        dueDay: value.due ?? today(),
        deckId: cardId.split("|")[0] ?? "",
      };
    }

    const oldTests = JSON.parse(window.localStorage.getItem("kanado.tests.v1") ?? "[]");
    for (const t of oldTests as { t: number; type: string; n: number; c: number; sec: number }[]) {
      state.attempts.push({
        type: t.type,
        level: "N5",
        total: t.n,
        correct: t.c,
        seconds: t.sec,
        createdAt: new Date(t.t).toISOString(),
      });
    }
  } catch {
    /* không có dữ liệu cũ thì thôi */
  }
  return state;
}

function saveLocal(state: ProgressState) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* hết dung lượng hoặc bị chặn — vẫn chạy tiếp trong phiên */
  }
}

interface StoreValue extends ProgressState {
  ready: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  recordKana: (kanaKey: string, correct: boolean) => void;
  gradeCard: (cardId: string, deckId: string, grade: 0 | 1 | 2) => void;
  addAttempt: (attempt: Attempt) => void;
  resetAll: () => Promise<void>;
  pullFromServer: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Khoảng cách ôn lại theo số hộp, tính bằng ngày. */
export const SRS_INTERVALS = [1, 2, 4, 8, 16, 30];

export function ProgressProvider({
  children,
  authed,
}: {
  children: ReactNode;
  authed: boolean;
}) {
  const [state, setState] = useState<ProgressState>(EMPTY);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const loaded = loadLocal();
    setState(loaded);
    saveLocal(loaded);
    setReady(true);
  }, []);

  const persist = useCallback((next: ProgressState) => {
    setState(next);
    saveLocal(next);
    dirty.current = true;
  }, []);

  const toPayload = useCallback((current: ProgressState) => ({
    kanaStats: Object.entries(current.kana).map(([kanaKey, s]) => ({ kanaKey, ...s })),
    srsCards: Object.entries(current.srs).map(([cardId, s]) => ({
      cardId,
      deckId: s.deckId,
      box: s.box,
      dueDay: s.dueDay,
    })),
    attempts: current.attempts,
  }), []);

  const applySnapshot = useCallback((snapshot: api.ProgressSnapshot) => {
    const merged: ProgressState = { kana: {}, srs: {}, attempts: [] };
    for (const s of snapshot.kanaStats) {
      merged.kana[s.kanaKey] = { correct: s.correct, wrong: s.wrong, streak: s.streak };
    }
    for (const c of snapshot.srsCards) {
      merged.srs[c.cardId] = { box: c.box, dueDay: c.dueDay, deckId: c.deckId };
    }
    merged.attempts = snapshot.attempts.map(({ type, level, total, correct, seconds, createdAt }) => ({
      type,
      level,
      total,
      correct,
      seconds,
      createdAt,
    }));
    setState(merged);
    saveLocal(merged);
  }, []);

  const syncNow = useCallback(async () => {
    if (!authed) return;
    setSyncStatus("syncing");
    try {
      const result = await api.syncProgress(toPayload(stateRef.current));
      applySnapshot(result);
      setLastSyncedAt(result.syncedAt);
      setSyncStatus("synced");
      dirty.current = false;
    } catch {
      setSyncStatus("error");
    }
  }, [authed, applySnapshot, toPayload]);

  const pullFromServer = useCallback(async () => {
    if (!authed) return;
    setSyncStatus("syncing");
    try {
      // Đẩy trạng thái cục bộ lên trước rồi lấy bản đã hợp nhất về:
      // đăng nhập trên máy mới không làm mất tiến độ đang có ở máy này.
      const result = await api.syncProgress(toPayload(stateRef.current));
      applySnapshot(result);
      setLastSyncedAt(result.syncedAt);
      setSyncStatus("synced");
      dirty.current = false;
    } catch {
      setSyncStatus("error");
    }
  }, [authed, applySnapshot, toPayload]);

  // Đẩy thay đổi lên server sau khi ngừng thao tác một nhịp.
  useEffect(() => {
    if (!authed || !ready || !dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void syncNow(), SYNC_DELAY);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state, authed, ready, syncNow]);

  // Đẩy nốt phần còn dở khi rời trang.
  useEffect(() => {
    if (!authed) return;
    const handler = () => {
      if (!dirty.current) return;
      const token = api.getAccessToken();
      if (!token) return;
      const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/progress/sync`;
      // fetch với keepalive sống sót qua lúc đóng tab, khác với fetch thường.
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(toPayload(stateRef.current)),
        keepalive: true,
      }).catch(() => undefined);
    };
    window.addEventListener("pagehide", handler);
    return () => window.removeEventListener("pagehide", handler);
  }, [authed, toPayload]);

  useEffect(() => {
    if (authed && ready) void pullFromServer();
    if (!authed) setSyncStatus("local");
  }, [authed, ready, pullFromServer]);

  const recordKana = useCallback(
    (kanaKey: string, correct: boolean) => {
      const current = stateRef.current;
      const prev = current.kana[kanaKey] ?? { correct: 0, wrong: 0, streak: 0 };
      const next: KanaStat = correct
        ? { correct: prev.correct + 1, wrong: prev.wrong, streak: prev.streak + 1 }
        : { correct: prev.correct, wrong: prev.wrong + 1, streak: 0 };
      persist({ ...current, kana: { ...current.kana, [kanaKey]: next } });
    },
    [persist],
  );

  const gradeCard = useCallback(
    (cardId: string, deckId: string, grade: 0 | 1 | 2) => {
      const current = stateRef.current;
      const prev = current.srs[cardId] ?? { box: 0, dueDay: today(), deckId };
      const t = today();

      let next: SrsState;
      if (grade === 0) {
        next = { box: 0, dueDay: t, deckId };
      } else if (grade === 1) {
        next = { box: Math.max(1, prev.box), dueDay: t + 1, deckId };
      } else {
        const box = Math.min(prev.box + 1, SRS_INTERVALS.length);
        next = { box, dueDay: t + SRS_INTERVALS[box - 1], deckId };
      }

      persist({ ...current, srs: { ...current.srs, [cardId]: next } });
    },
    [persist],
  );

  const addAttempt = useCallback(
    (attempt: Attempt) => {
      const current = stateRef.current;
      persist({ ...current, attempts: [...current.attempts, attempt].slice(-100) });
    },
    [persist],
  );

  const resetAll = useCallback(async () => {
    persist(EMPTY);
    if (authed) {
      try {
        await api.resetProgress();
        setSyncStatus("synced");
        dirty.current = false;
      } catch {
        setSyncStatus("error");
      }
    }
  }, [authed, persist]);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      ready,
      syncStatus,
      lastSyncedAt,
      recordKana,
      gradeCard,
      addAttempt,
      resetAll,
      pullFromServer,
      syncNow,
    }),
    [
      state,
      ready,
      syncStatus,
      lastSyncedAt,
      recordKana,
      gradeCard,
      addAttempt,
      resetAll,
      pullFromServer,
      syncNow,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useProgress(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useProgress phải nằm trong ProgressProvider");
  return ctx;
}

/* Tiện ích dùng chung cho các màn hình */

export function isMastered(stat?: KanaStat) {
  return !!stat && stat.streak >= 4;
}

export function isWeak(stat?: KanaStat) {
  return !!stat && stat.wrong > 0 && stat.streak < 2;
}
