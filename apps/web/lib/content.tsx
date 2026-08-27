"use client";

/**
 * Nguồn nội dung học cho giao diện.
 *
 * Ưu tiên lấy từ API để nội dung sửa trong database hiện ra ngay, không cần
 * deploy lại. Nhưng API chạy trên gói free nên có thể đang ngủ hoặc chết —
 * lúc đó rơi về bản đóng gói sẵn trong bundle. Nghĩa là:
 *
 *   - Mở trang là học được ngay, không bao giờ trắng màn hình chờ mạng.
 *   - Nội dung mới trong DB xuất hiện ngay khi API trả lời xong.
 *
 * Mỗi loại nội dung chỉ tải một lần cho mỗi phiên, và tải theo nhu cầu chứ
 * không tải hết cùng lúc: vào tab Kanji mới tải kanji.
 */

import {
  decks as bundledDecks,
  deckCards as bundledDeckCards,
  clozeQuestions as bundledCloze,
  grammar as bundledGrammar,
  kanji as bundledKanji,
  vocabGroups as bundledVocabGroups,
  type ClozeQuestion,
  type DeckCard,
  type DeckMeta,
  type GrammarPoint,
  type KanjiEntry,
  type VocabGroup,
} from "@kanado/content";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "./api";

export type ContentStatus = "bundled" | "loading" | "live" | "offline";

interface Cached<T> {
  data: T;
  status: ContentStatus;
}

/** Bộ nhớ tạm dùng chung cả phiên, để đổi tab không phải tải lại. */
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

async function loadOnce<T>(key: string, path: string): Promise<T | null> {
  if (cache.has(key)) return cache.get(key) as T;

  let promise = inflight.get(key) as Promise<T | null> | undefined;
  if (!promise) {
    promise = (async () => {
      try {
        const response = await fetch(`${API_URL}${path}`);
        if (!response.ok) return null;
        const data = (await response.json()) as T;
        cache.set(key, data);
        return data;
      } catch {
        // API ngủ, mất mạng, hoặc CORS — dùng bản trong bundle.
        return null;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, promise as Promise<unknown>);
  }

  return promise;
}

/** Nạp một loại nội dung, trả về bản bundle trước rồi thay bằng bản từ API. */
function useRemoteContent<T>(key: string, path: string, fallback: T): Cached<T> {
  const [state, setState] = useState<Cached<T>>(() =>
    cache.has(key)
      ? { data: cache.get(key) as T, status: "live" }
      : { data: fallback, status: "bundled" },
  );

  useEffect(() => {
    let cancelled = false;
    if (cache.has(key)) return;

    setState({ data: fallback, status: "loading" });

    void loadOnce<T>(key, path).then((data) => {
      if (cancelled) return;
      if (data) setState({ data, status: "live" });
      else setState({ data: fallback, status: "offline" });
    });

    return () => {
      cancelled = true;
    };
    // fallback là hằng số lấy từ bundle nên không cần theo dõi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, path]);

  return state;
}

export function useKanji() {
  return useRemoteContent<KanjiEntry[]>("kanji", "/content/kanji?level=both", bundledKanji);
}

export function useVocabGroups() {
  return useRemoteContent<VocabGroup[]>("vocab", "/content/vocab", bundledVocabGroups);
}

export function useGrammar() {
  const remote = useRemoteContent<{ points: GrammarPoint[] }>(
    "grammar",
    "/content/grammar?level=both",
    { points: bundledGrammar },
  );
  return { data: remote.data.points, status: remote.status };
}

export function useCloze() {
  return useRemoteContent<ClozeQuestion[]>("cloze", "/content/cloze?level=both", bundledCloze);
}

export function useDecks() {
  return useRemoteContent<DeckMeta[]>("decks", "/content/decks", bundledDecks);
}

/**
 * Thẻ của một bộ. Không dùng useRemoteContent vì mỗi bộ là một khóa riêng và
 * người học đổi bộ liên tục — nạp theo bộ đang chọn thôi.
 */
export function useDeckCards(deckId: string): Cached<DeckCard[]> {
  const fallback = bundledDeckCards(deckId);
  const key = `deck:${deckId}`;
  const [state, setState] = useState<Cached<DeckCard[]>>(() =>
    cache.has(key)
      ? { data: cache.get(key) as DeckCard[], status: "live" }
      : { data: fallback, status: "bundled" },
  );

  useEffect(() => {
    let cancelled = false;
    const currentKey = `deck:${deckId}`;
    const currentFallback = bundledDeckCards(deckId);

    if (cache.has(currentKey)) {
      setState({ data: cache.get(currentKey) as DeckCard[], status: "live" });
      return;
    }

    setState({ data: currentFallback, status: "loading" });
    void loadOnce<DeckCard[]>(currentKey, `/content/decks/${encodeURIComponent(deckId)}`).then(
      (data) => {
        if (cancelled) return;
        if (data) setState({ data, status: "live" });
        else setState({ data: currentFallback, status: "offline" });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [deckId]);

  return state;
}

/** Dùng cho chỗ cần dữ liệu ngay trong hàm chứ không phải trong render. */
export function useContentLoader() {
  return useCallback(async () => {
    const [kanji, vocab, cloze] = await Promise.all([
      loadOnce<KanjiEntry[]>("kanji", "/content/kanji?level=both"),
      loadOnce<VocabGroup[]>("vocab", "/content/vocab"),
      loadOnce<ClozeQuestion[]>("cloze", "/content/cloze?level=both"),
    ]);
    return {
      kanji: kanji ?? bundledKanji,
      vocabGroups: vocab ?? bundledVocabGroups,
      cloze: cloze ?? bundledCloze,
    };
  }, []);
}

/** Nhãn nhỏ báo nội dung đang lấy từ đâu. */
export function ContentStatusNote({ status }: { status: ContentStatus }) {
  if (status === "live" || status === "loading") return null;
  return (
    <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
      {status === "offline"
        ? "Không gọi được máy chủ — đang dùng bản nội dung đóng gói sẵn."
        : "Đang dùng bản nội dung đóng gói sẵn."}
    </span>
  );
}
