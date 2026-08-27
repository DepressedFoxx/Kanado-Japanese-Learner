"use client";

import { type DeckCard } from "@kanado/content";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContentStatusNote, useDeckCards, useDecks } from "@/lib/content";
import { speak } from "@/lib/speech";
import { today, useProgress } from "@/lib/store";
import { shuffle } from "@/lib/utils";

const NEW_PER_SESSION = 12;

type Direction = "jp" | "vn";

export function Flashcard() {
  const { srs, gradeCard } = useProgress();

  const { data: decks } = useDecks();
  const [deckId, setDeckId] = useState("kata");
  const { data: cards, status } = useDeckCards(deckId);
  const [direction, setDirection] = useState<Direction>("jp");
  const [queue, setQueue] = useState<DeckCard[]>([]);
  const [flipped, setFlipped] = useState(false);

  const srsRef = useRef(srs);
  srsRef.current = srs;

  const buildQueue = useCallback(() => {
    const day = today();
    const due: DeckCard[] = [];
    const fresh: DeckCard[] = [];

    for (const card of cards) {
      const state = srsRef.current[card.id];
      if (!state) fresh.push(card);
      else if (state.dueDay <= day) due.push(card);
    }

    setQueue([...shuffle(due), ...fresh.slice(0, NEW_PER_SESSION)]);
    setFlipped(false);
  }, [cards]);

  useEffect(() => {
    buildQueue();
  }, [buildQueue]);

  const current = queue[0] ?? null;

  const reveal = useCallback(() => {
    if (!current || flipped) return;
    setFlipped(true);
    speak(current.reading);
  }, [current, flipped]);

  const grade = useCallback(
    (value: 0 | 1 | 2) => {
      if (!current || !flipped) return;
      gradeCard(current.id, deckId, value);
      setQueue((prev) => {
        const [first, ...rest] = prev;
        return value === 0 ? [...rest, first] : rest;
      });
      setFlipped(false);
    },
    [current, flipped, gradeCard, deckId],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (!flipped) reveal();
        return;
      }
      if (event.key === "1") grade(0);
      if (event.key === "2") grade(1);
      if (event.key === "3") grade(2);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, reveal, grade]);

  const day = today();
  const dueCount = cards.filter((c) => {
    const s = srs[c.id];
    return s && s.dueDay <= day;
  }).length;
  const freshCount = cards.filter((c) => !srs[c.id]).length;
  const knownCount = cards.filter((c) => (srs[c.id]?.box ?? 0) >= 4).length;

  function loadMore() {
    const extra = cards.filter((card) => {
      const state = srs[card.id];
      return !state || state.dueDay <= day + 2;
    });
    setQueue(shuffle(extra.length ? extra : cards).slice(0, NEW_PER_SESSION));
    setFlipped(false);
  }

  return (
    <>
      <div className="card">
        <h3>Bộ thẻ</h3>
        <div className="toolbar">
          {decks.map((deck) => (
            <button
              key={deck.id}
              className="chip"
              aria-pressed={deckId === deck.id}
              onClick={() => setDeckId(deck.id)}
            >
              {deck.label}
            </button>
          ))}
        </div>
        <ContentStatusNote status={status} />
        <h3>Chiều hỏi</h3>
        <div className="toolbar">
          <button
            className="chip"
            aria-pressed={direction === "jp"}
            onClick={() => setDirection("jp")}
          >
            Nhật → Việt
          </button>
          <button
            className="chip"
            aria-pressed={direction === "vn"}
            onClick={() => setDirection("vn")}
          >
            Việt → Nhật
          </button>
        </div>
      </div>

      <div className="deckstat">
        <div className="due">
          <div className="v">{queue.length}</div>
          <div className="l">Còn trong phiên</div>
        </div>
        <div>
          <div className="v">{dueCount}</div>
          <div className="l">Đến hạn</div>
        </div>
        <div>
          <div className="v">{freshCount}</div>
          <div className="l">Chưa học</div>
        </div>
        <div>
          <div className="v">
            {knownCount}/{cards.length}
          </div>
          <div className="l">Đã thuộc</div>
        </div>
      </div>

      <div className="flipwrap">
        <div
          className={`flip${flipped ? " on" : ""}`}
          onClick={reveal}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter") reveal();
          }}
        >
          <div className="face front">
            {current ? (
              <CardFront card={current} direction={direction} />
            ) : (
              <div className="done">
                <div className="big vn">Xong bộ này hôm nay</div>
                <div className="note">
                  Quay lại vào ngày mai khi thẻ tới hạn, hoặc đổi sang bộ khác. Muốn học thêm ngay
                  thì nạp thêm thẻ.
                </div>
                <button
                  className="chip"
                  onClick={(event) => {
                    event.stopPropagation();
                    loadMore();
                  }}
                >
                  Nạp thêm thẻ
                </button>
              </div>
            )}
          </div>
          <div className="face back">
            {current && <CardBack card={current} direction={direction} />}
          </div>
        </div>
      </div>

      {flipped && current && (
        <div className="grades">
          <button className="grade g1" onClick={() => grade(0)}>
            <b>1</b>
            <span>Chưa nhớ</span>
          </button>
          <button className="grade g2" onClick={() => grade(1)}>
            <b>2</b>
            <span>Mơ hồ</span>
          </button>
          <button className="grade g3" onClick={() => grade(2)}>
            <b>3</b>
            <span>Nhớ rồi</span>
          </button>
        </div>
      )}

      <div className="toolbar" style={{ justifyContent: "center" }}>
        <button className="chip" onClick={reveal}>
          Lật thẻ (Space)
        </button>
        <button className="chip" onClick={() => current && speak(current.reading)}>
          Nghe đọc
        </button>
        <button className="chip" onClick={buildQueue}>
          Xếp lại phiên
        </button>
      </div>
    </>
  );
}

function CardFront({ card, direction }: { card: DeckCard; direction: Direction }) {
  const eyebrow =
    card.kind === "grammar" ? "Mẫu câu" : card.kind === "kanji" ? "Kanji" : "Từ vựng";

  if (direction === "vn") {
    return (
      <>
        <div className="eyebrow">{card.kind === "kanji" ? "Kanji nào?" : "Nghĩa"}</div>
        <div className="big vn">{card.meaning}</div>
        <div className="hint">bấm để lật</div>
      </>
    );
  }

  return (
    <>
      <div className="eyebrow">{eyebrow}</div>
      <div
        className="big jp"
        style={card.kind === "kanji" ? { fontSize: "clamp(56px, 14vw, 92px)" } : undefined}
      >
        {card.front}
      </div>
      <div className="hint">bấm để lật</div>
    </>
  );
}

function CardBack({ card, direction }: { card: DeckCard; direction: Direction }) {
  const frontWasJapanese = direction === "jp";

  return (
    <>
      {frontWasJapanese ? (
        <div className="mean">{card.meaning}</div>
      ) : (
        <div
          className="big jp"
          style={card.kind === "kanji" ? { fontSize: "clamp(48px, 12vw, 76px)" } : undefined}
        >
          {card.front}
        </div>
      )}

      {card.kind === "kanji" && (
        <div className="romaji">
          ON {card.on || "—"} &nbsp;·&nbsp; KUN {card.kun || "—"}
        </div>
      )}

      {card.kind === "vocab" && (
        <>
          {card.reading !== card.front && <div className="read jp">{card.reading}</div>}
          {card.romaji && <div className="romaji">{card.romaji}</div>}
        </>
      )}

      {card.note && <div className="note" dangerouslySetInnerHTML={{ __html: card.note }} />}

      {card.examples?.map((example, index) => (
        <div key={index}>
          <div className="exj jp">{example.jp}</div>
          <div className="exv">{example.vn}</div>
        </div>
      ))}
    </>
  );
}
