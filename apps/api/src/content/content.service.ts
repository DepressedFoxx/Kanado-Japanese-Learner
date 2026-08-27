import { Injectable } from "@nestjs/common";
import {
  clozeByLevel,
  confusablePairs,
  conjugation,
  coverage,
  coverageN3,
  decks,
  deckCards,
  grammarByLevel,
  kanaChart,
  kanjiByLevel,
  foundations,
  planSteps,
  planStepsN3,
  resources,
  resourcesN3,
  vocabGroups,
  type Level,
} from "@kanado/content";

export type LevelFilter = Level | "both";

/**
 * Nội dung học là dữ liệu tĩnh nên phục vụ thẳng từ package dùng chung —
 * nhanh hơn và không phụ thuộc DB. Bảng trong Postgres giữ cùng dữ liệu
 * để tra cứu, thống kê và soạn thêm nội dung bằng DBeaver.
 */
@Injectable()
export class ContentService {
  kana() {
    return { chart: kanaChart, confusables: confusablePairs };
  }

  kanji(level: LevelFilter) {
    return kanjiByLevel(level);
  }

  vocab() {
    return vocabGroups;
  }

  grammar(level: LevelFilter) {
    return { points: grammarByLevel(level), conjugation, foundations };
  }

  cloze(level: LevelFilter) {
    return clozeByLevel(level);
  }

  decks() {
    return decks;
  }

  deck(deckId: string) {
    return deckCards(deckId);
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
