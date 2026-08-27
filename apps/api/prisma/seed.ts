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
        source: k.source,
        hanViet: k.hanViet ?? null,
        strokes: k.strokes ?? null,
        frequency: k.frequency ?? null,
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
        source: k.source,
        hanViet: k.hanViet ?? null,
        strokes: k.strokes ?? null,
        frequency: k.frequency ?? null,
      },
    });
  }
  return kanji.length;
}

async function seedVocab() {
  let count = 0;
  for (const group of vocabGroups) {
    // createMany + skipDuplicates nhanh hơn upsert nhiều lần, quan trọng vì
    // giờ có hơn 3.600 từ và Neon ở xa nên mỗi round trip tốn ~70ms.
    const rows = group.items.map((item, position) => ({
      groupId: group.id,
      groupLabel: group.label,
      level: group.level,
      word: item.word,
      reading: item.reading,
      romaji: item.romaji,
      meaning: item.meaning,
      isKatakana: item.katakana,
      source: item.source,
      position,
    }));

    await prisma.vocabItem.deleteMany({ where: { groupId: group.id } });
    await prisma.vocabItem.createMany({ data: rows });
    count += rows.length;
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

/**
 * Xoá bản ghi không còn trong nội dung hiện tại.
 *
 * Nếu chỉ upsert thì chữ hay từ đã bị loại khỏi package vẫn nằm lại trong DB,
 * và vì web giờ đọc nội dung từ DB nên người học sẽ thấy cả những mục lẽ ra
 * đã bỏ. Bước này giữ DB đúng bằng nội dung, không hơn.
 */
async function pruneStale() {
  const [kanjiGone, vocabGone, grammarGone, clozeGone, kanaGone] = await Promise.all([
    prisma.kanji.deleteMany({ where: { char: { notIn: kanji.map((k) => k.char) } } }),
    prisma.vocabItem.deleteMany({
      where: { groupId: { notIn: vocabGroups.map((g) => g.id) } },
    }),
    prisma.grammarPoint.deleteMany({
      where: { pattern: { notIn: grammar.map((g) => g.pattern) } },
    }),
    prisma.clozeQuestion.deleteMany({
      where: { sentence: { notIn: clozeQuestions.map((q) => q.sentence) } },
    }),
    prisma.kanaCharacter.deleteMany({
      where: { katakana: { notIn: kana.map((k) => k.katakana) } },
    }),
  ]);

  const total =
    kanjiGone.count + vocabGone.count + grammarGone.count + clozeGone.count + kanaGone.count;
  return total;
}

async function main() {
  console.log("Đang nạp nội dung vào Postgres…");
  console.log("  bảng chữ    :", await seedKana());
  console.log("  kanji       :", await seedKanji());
  console.log("  từ vựng     :", await seedVocab());
  console.log("  ngữ pháp    :", await seedGrammar());
  console.log("  câu hỏi đề  :", await seedCloze());
  const pruned = await pruneStale();
  if (pruned) console.log("  đã dọn      :", pruned, "bản ghi cũ không còn trong nội dung");
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
