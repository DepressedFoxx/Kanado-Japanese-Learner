import { BadRequestException, Controller, Get, Param, Query } from "@nestjs/common";
import { ContentService, LevelFilter } from "./content.service";

function parseLevel(value?: string): LevelFilter {
  if (!value || value === "both") return "both";
  if (value === "N5" || value === "N4" || value === "N3") return value;
  throw new BadRequestException("level chỉ nhận N5, N4, N3 hoặc both");
}

@Controller("content")
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get("kana")
  kana() {
    return this.content.kana();
  }

  @Get("kanji")
  kanji(@Query("level") level?: string) {
    return this.content.kanji(parseLevel(level));
  }

  @Get("vocab")
  vocab() {
    return this.content.vocab();
  }

  @Get("grammar")
  grammar(@Query("level") level?: string) {
    return this.content.grammar(parseLevel(level));
  }

  @Get("cloze")
  cloze(@Query("level") level?: string) {
    return this.content.cloze(parseLevel(level));
  }

  @Get("decks")
  decks() {
    return this.content.decks();
  }

  @Get("decks/:deckId")
  async deck(@Param("deckId") deckId: string) {
    const cards = await this.content.deck(deckId);
    if (!cards.length) throw new BadRequestException("Không có bộ thẻ nào tên " + deckId);
    return cards;
  }

  @Get("plan")
  plan() {
    return this.content.plan();
  }
}
