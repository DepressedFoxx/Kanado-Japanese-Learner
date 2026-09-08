"use client";

import { type DeckCard, type DeckKind, type Level } from "@kanado/content";
import { useCallback, useEffect, useRef, useState } from "react";
import { ContentStatusNote, useDeckCards, useDecks } from "@/lib/content";
import { speak } from "@/lib/speech";
import { today, useProgress } from "@/lib/store";
import { shuffle } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NEW_PER_SESSION = 12;

type Direction = "jp" | "vn";
type DeckLevel = Level | "kana";

const DECK_KIND_LABELS: Record<DeckKind, string> = {
  vocab: "Từ vựng",
  kanji: "Kanji",
  grammar: "Ngữ pháp",
};

const DECK_LEVEL_LABELS: Record<DeckLevel, string> = {
  kana: "Katakana",
  N5: "N5",
  N4: "N4",
  N3: "N3",
};

const DECK_LEVEL_ORDER: DeckLevel[] = ["kana", "N5", "N4", "N3"];

export function Flashcard() {
  const { srs, gradeCard } = useProgress();

  const { data: decks } = useDecks();
  const [deckId, setDeckId] = useState("kata");
  const { data: cards, status } = useDeckCards(deckId);
  const [direction, setDirection] = useState<Direction>("jp");
  const [queue, setQueue] = useState<DeckCard[]>([]);
  const [flipped, setFlipped] = useState(false);

  const selectedDeck = decks.find((deck) => deck.id === deckId) ?? decks[0];
  const selectedKind = selectedDeck?.kind ?? "vocab";
  const selectedLevel = selectedDeck?.level ?? "kana";
  const availableLevels = DECK_LEVEL_ORDER.filter((level) =>
    decks.some((deck) => deck.kind === selectedKind && deck.level === level),
  );
  const availableDecks = decks.filter(
    (deck) => deck.kind === selectedKind && deck.level === selectedLevel,
  );
  const topicDecks = availableDecks.filter((deck) => !deck.id.startsWith("imp-"));
  const importedDecks = availableDecks.filter((deck) => deck.id.startsWith("imp-"));

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

  const flipCard = useCallback(() => {
    if (!current) return;
    if (!flipped) speak(current.reading);
    setFlipped((value) => !value);
  }, [current, flipped]);

  const showPrevious = useCallback(() => {
    setQueue((previousQueue) => {
      if (previousQueue.length <= 1) return previousQueue;

      const last = previousQueue[previousQueue.length - 1];
      return [last, ...previousQueue.slice(0, -1)];
    });
    setFlipped(false);
  }, []);

  const showNext = useCallback(() => {
    setQueue((previousQueue) => {
      if (previousQueue.length <= 1) return previousQueue;

      const [first, ...rest] = previousQueue;
      return [...rest, first];
    });
    setFlipped(false);
  }, []);

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
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        flipCard();
        return;
      }
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
      if (event.key === "1") grade(0);
      if (event.key === "2") grade(1);
      if (event.key === "3") grade(2);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipCard, grade, showNext, showPrevious]);

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

  function selectFirstDeck(kind: DeckKind, level?: DeckLevel) {
    const nextDeck = decks.find(
      (deck) => deck.kind === kind && (level === undefined || deck.level === level),
    );

    if (nextDeck) setDeckId(nextDeck.id);
  }

  return (
    <>
      <Card className="flashcard-settings">
        <CardHeader>
          <CardTitle>Bộ thẻ</CardTitle>
        </CardHeader>
        <CardContent className="flashcard-settings-content">
          <div className="deck-picker">
            <div className="deck-picker-field">
              <label htmlFor="deck-kind">Loại nội dung</label>
              <Select
                value={selectedKind}
                onValueChange={(value) => selectFirstDeck(value as DeckKind)}
              >
                <SelectTrigger id="deck-kind" className="w-full">
                  <SelectValue>{DECK_KIND_LABELS[selectedKind]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(DECK_KIND_LABELS) as [DeckKind, string][]).map(
                    ([kind, label]) => (
                      <SelectItem key={kind} value={kind}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="deck-picker-field">
              <label htmlFor="deck-level">Cấp độ</label>
              <Select
                value={selectedLevel}
                onValueChange={(value) =>
                  selectFirstDeck(selectedKind, value as DeckLevel)
                }
              >
                <SelectTrigger id="deck-level" className="w-full">
                  <SelectValue>{DECK_LEVEL_LABELS[selectedLevel]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {DECK_LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="deck-picker-field deck-picker-field-wide">
              <label htmlFor="deck-specific">Bộ cụ thể</label>
              <Select
                value={deckId}
                onValueChange={(value) => setDeckId(value as string)}
              >
                <SelectTrigger id="deck-specific" className="w-full">
                  <SelectValue>
                    {selectedDeck?.label.replace(/^N[345] · /, "")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {topicDecks.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Theo chủ đề</SelectLabel>
                      {topicDecks.map((deck) => (
                        <SelectItem key={deck.id} value={deck.id}>
                          {deck.label.replace(/^N[345] · /, "")} ({deck.size} thẻ)
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {importedDecks.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Kho mở rộng</SelectLabel>
                      {importedDecks.map((deck) => (
                        <SelectItem key={deck.id} value={deck.id}>
                          {deck.label.replace(/^N[345] · Kho từ /, "Phần ")} (
                          {deck.size} thẻ)
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedDeck && (
            <div className="selected-deck-note">
              <span>Đang học</span>
              <b>{selectedDeck.label}</b>
              <Badge variant="secondary">{selectedDeck.size} thẻ</Badge>
            </div>
          )}
          <ContentStatusNote status={status} />

          <div className="direction-picker">
            <span>Chiều hỏi</span>
            <div className="toolbar">
              <Button
                variant={direction === "jp" ? "default" : "outline"}
                aria-pressed={direction === "jp"}
                onClick={() => setDirection("jp")}
              >
                Nhật → Việt
              </Button>
              <Button
                variant={direction === "vn" ? "default" : "outline"}
                aria-pressed={direction === "vn"}
                onClick={() => setDirection("vn")}
              >
                Việt → Nhật
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
          onClick={flipCard}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter") flipCard();
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
                <Button
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation();
                    loadMore();
                  }}
                >
                  Nạp thêm thẻ
                </Button>
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
        <Button variant="outline" disabled={queue.length <= 1} onClick={showPrevious}>
          ← Trước
        </Button>
        <Button variant="outline" onClick={() => current && speak(current.reading)}>
          Nghe đọc
        </Button>
        <Button variant="outline" disabled={queue.length <= 1} onClick={showNext}>
          Tiếp →
        </Button>
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
