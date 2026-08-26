/**
 * Nạp nội dung học từ package @kanado/content vào Postgres.
 * Chạy lại được nhiều lần — dùng upsert nên không tạo bản ghi trùng.
 *
 *   npm run seed -w @kanado/api
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { grammar, kana, kanji, clozeQuestions, vocabGroups } from "@kanado/content";

const prisma = new PrismaClient();

async function seedKana() {
  for (const entry of kana) {
    await prisma.kanaCharacter.upsert({
      where: { katakana: entry.katakana },
      update: {
        group: entry.group,
        row: entry.row,
        hiragana: entry.hiragana,
        romaji: entry.romaji,
      },
      create: {
        group: entry.group,
        row: entry.row,
        hiragana: entry.hiragana,
        katakana: entry.katakana,
        romaji: entry.romaji,
      },
    });
  }
  return kana.length;
}

async function seedKanji() {
  for (const k of kanji) {
    await prisma.kanji.upsert({
      where: { char: k.char },
      update: {
        meaning: k.meaning,
        onyomi: k.on,
        kunyomi: k.kun,
        exampleWord: k.example.word,
        exampleReading: k.example.reading,
        exampleMeaning: k.example.meaning,
        level: k.level,
      },
      create: {
        char: k.char,
        meaning: k.meaning,
        onyomi: k.on,
        kunyomi: k.kun,
        exampleWord: k.example.word,
        exampleReading: k.example.reading,
        exampleMeaning: k.example.meaning,
        level: k.level,
      },
    });
  }
  return kanji.length;
}

async function seedVocab() {
  let count = 0;
  for (const group of vocabGroups) {
    for (const item of group.items) {
      await prisma.vocabItem.upsert({
        where: { groupId_word: { groupId: group.id, word: item.word } },
        update: {
          groupLabel: group.label,
          level: group.level,
          reading: item.reading,
          romaji: item.romaji,
          meaning: item.meaning,
          isKatakana: item.katakana,
        },
        create: {
          groupId: group.id,
          groupLabel: group.label,
          level: group.level,
          word: item.word,
          reading: item.reading,
          romaji: item.romaji,
          meaning: item.meaning,
          isKatakana: item.katakana,
        },
      });
      count++;
    }
  }
  return count;
}

async function seedGrammar() {
  for (const g of grammar) {
    await prisma.grammarPoint.upsert({
      where: { level_pattern: { level: g.level, pattern: g.pattern } },
      update: { gloss: g.gloss, note: g.note, examples: g.examples as unknown as Prisma.InputJsonValue },
      create: {
        pattern: g.pattern,
        gloss: g.gloss,
        note: g.note,
        level: g.level,
        examples: g.examples as unknown as Prisma.InputJsonValue,
      },
    });
  }
  return grammar.length;
}

async function seedCloze() {
  for (const q of clozeQuestions) {
    await prisma.clozeQuestion.upsert({
      where: { level_sentence: { level: q.level, sentence: q.sentence } },
      update: {
        answer: q.answer,
        distractors: q.distractors,
        note: q.note,
        translation: q.translation,
      },
      create: {
        sentence: q.sentence,
        answer: q.answer,
        distractors: q.distractors,
        note: q.note,
        translation: q.translation,
        level: q.level,
      },
    });
  }
  return clozeQuestions.length;
}

async function main() {
  console.log("Đang nạp nội dung vào Postgres…");
  console.log("  bảng chữ    :", await seedKana());
  console.log("  kanji       :", await seedKanji());
  console.log("  từ vựng     :", await seedVocab());
  console.log("  ngữ pháp    :", await seedGrammar());
  console.log("  câu hỏi đề  :", await seedCloze());
  console.log("Xong.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
