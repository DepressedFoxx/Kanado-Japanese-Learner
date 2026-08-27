import { Injectable } from "@nestjs/common";
import {
  confusablePairs,
  conjugation,
  coverage,
  coverageN3,
  foundations,
  kanaChart,
  planSteps,
  planStepsN3,
  resources,
  resourcesN3,
  type Level,
} from "@kanado/content";
import { PrismaService } from "../prisma/prisma.service";

export type LevelFilter = Level | "both";

/**
 * Nội dung học chia làm hai loại nguồn:
 *
 *   - Kanji, từ vựng, ngữ pháp, câu hỏi đề đọc từ Postgres. Đây là phần bạn
 *     sẽ sửa và bổ sung, nên để database làm nguồn gốc: đổi trong DBeaver là
 *     web thấy ngay, không phải deploy lại.
 *
 *   - Bảng chữ, bảng chia động từ, phần nền tảng, lộ trình, danh sách bộ thẻ
 *     vẫn lấy từ package. Đó là khung sườn, gần như không đổi, và giữ ở code
 *     thì tránh được một vòng truy vấn cho mỗi lần mở trang.
 */
@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  kana() {
    return { chart: kanaChart, confusables: confusablePairs };
  }

  async kanji(level: LevelFilter) {
    const rows = await this.prisma.kanji.findMany({
      where: level === "both" ? {} : { level },
      orderBy: [{ level: "asc" }, { id: "asc" }],
    });

    return rows.map((row) => ({
      char: row.char,
      meaning: row.meaning,
      source: row.source,
      hanViet: row.hanViet ?? undefined,
      strokes: row.strokes ?? undefined,
      frequency: row.frequency ?? undefined,
      on: row.onyomi,
      kun: row.kunyomi,
      example: {
        word: row.exampleWord,
        reading: row.exampleReading,
        meaning: row.exampleMeaning,
      },
      level: row.level,
    }));
  }

  async vocab() {
    const rows = await this.prisma.vocabItem.findMany({
      orderBy: [{ groupId: "asc" }, { position: "asc" }],
    });

    // Gom lại thành nhóm, giữ đúng thứ tự đã seed.
    const groups = new Map<
      string,
      {
        id: string;
        label: string;
        level: string;
        items: {
          word: string;
          reading: string;
          romaji: string;
          meaning: string;
          katakana: boolean;
          source: string;
        }[];
      }
    >();

    for (const row of rows) {
      let group = groups.get(row.groupId);
      if (!group) {
        group = { id: row.groupId, label: row.groupLabel, level: row.level, items: [] };
        groups.set(row.groupId, group);
      }
      group.items.push({
        word: row.word,
        reading: row.reading,
        romaji: row.romaji,
        meaning: row.meaning,
        katakana: row.isKatakana,
        source: row.source,
      });
    }

    return [...groups.values()];
  }

  async grammar(level: LevelFilter) {
    const rows = await this.prisma.grammarPoint.findMany({
      where: level === "both" ? {} : { level },
      orderBy: [{ id: "asc" }],
    });

    return {
      points: rows.map((row) => ({
        pattern: row.pattern,
        gloss: row.gloss,
        note: row.note,
        examples: row.examples,
        level: row.level,
      })),
      conjugation,
      foundations,
    };
  }

  async cloze(level: LevelFilter) {
    const rows = await this.prisma.clozeQuestion.findMany({
      where: level === "both" ? {} : { level },
      orderBy: [{ id: "asc" }],
    });

    return rows.map((row) => ({
      sentence: row.sentence,
      answer: row.answer,
      distractors: row.distractors,
      note: row.note,
      translation: row.translation,
      level: row.level,
    }));
  }

  /** Bộ thẻ dựng từ chính nội dung trong DB, để thêm từ là có thẻ mới ngay. */
  async decks() {
    const [kanjiCounts, vocabGroups, grammarCounts] = await Promise.all([
      this.prisma.kanji.groupBy({ by: ["level"], _count: { _all: true } }),
      this.prisma.vocabItem.groupBy({
        by: ["groupId", "groupLabel", "level"],
        _count: { _all: true },
      }),
      this.prisma.grammarPoint.groupBy({ by: ["level"], _count: { _all: true } }),
    ]);

    const kanjiDeckId: Record<string, string> = { N5: "k5", N4: "k4", N3: "k3" };
    const grammarDeckId: Record<string, string> = { N5: "gr", N4: "gr4", N3: "gr3" };
    const order: Record<string, number> = { N5: 0, N4: 1, N3: 2 };

    const kanjiDecks = kanjiCounts
      .filter((row) => kanjiDeckId[row.level])
      .sort((a, b) => (order[a.level] ?? 9) - (order[b.level] ?? 9))
      .map((row) => ({
        id: kanjiDeckId[row.level],
        label: `Kanji ${row.level}`,
        kind: "kanji" as const,
        level: row.level,
        size: row._count._all,
      }));

    const vocabDecks = vocabGroups
      .sort((a, b) => a.groupId.localeCompare(b.groupId))
      .map((row) => ({
        id: row.groupId,
        label: row.groupLabel,
        kind: "vocab" as const,
        level: row.level,
        size: row._count._all,
      }));

    const grammarDecks = grammarCounts
      .filter((row) => grammarDeckId[row.level])
      .sort((a, b) => (order[a.level] ?? 9) - (order[b.level] ?? 9))
      .map((row) => ({
        id: grammarDeckId[row.level],
        label: `Ngữ pháp ${row.level}`,
        kind: "grammar" as const,
        level: row.level,
        size: row._count._all,
      }));

    return [...kanjiDecks, ...vocabDecks, ...grammarDecks];
  }

  async deck(deckId: string) {
    const kanjiLevel = { k5: "N5", k4: "N4", k3: "N3" }[deckId];
    if (kanjiLevel) {
      const rows = await this.prisma.kanji.findMany({
        where: { level: kanjiLevel },
        orderBy: { id: "asc" },
      });
      return rows.map((row) => ({
        id: `${deckId}|${row.char}`,
        deckId,
        kind: "kanji",
        front: row.char,
        reading: row.exampleReading,
        meaning: row.meaning,
        romaji: "",
        on: row.onyomi,
        kun: row.kunyomi,
        note: row.hanViet ? `Hán Việt: <b>${row.hanViet}</b>` : undefined,
        examples: [
          {
            jp: `${row.exampleWord}（${row.exampleReading}）`,
            vn: row.exampleMeaning,
          },
        ],
      }));
    }

    const grammarLevel = { gr: "N5", gr4: "N4", gr3: "N3" }[deckId];
    if (grammarLevel) {
      const rows = await this.prisma.grammarPoint.findMany({
        where: { level: grammarLevel },
        orderBy: { id: "asc" },
      });
      return rows.map((row) => {
        const examples = (row.examples as { jp: string; vn: string }[]) ?? [];
        return {
          id: `${deckId}|${row.pattern}`,
          deckId,
          kind: "grammar",
          front: row.pattern,
          reading: examples[0]?.jp ?? row.pattern,
          meaning: row.gloss,
          note: row.note,
          examples,
        };
      });
    }

    const rows = await this.prisma.vocabItem.findMany({
      where: { groupId: deckId },
      orderBy: { position: "asc" },
    });
    return rows.map((row) => ({
      id: `${deckId}|${row.word}`,
      deckId,
      kind: "vocab",
      front: row.word,
      reading: row.reading,
      meaning: row.meaning,
      romaji: row.romaji,
    }));
  }

  plan() {
    return {
      steps: planSteps,
      resources,
      coverage,
      n3: { steps: planStepsN3, resources: resourcesN3, coverage: coverageN3 },
    };
  }
}
