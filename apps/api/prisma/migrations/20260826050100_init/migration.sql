-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kana_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kanaKey" TEXT NOT NULL,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "wrong" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kana_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "srs_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "box" INTEGER NOT NULL DEFAULT 0,
    "dueDay" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "srs_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "correct" INTEGER NOT NULL,
    "seconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanji" (
    "id" SERIAL NOT NULL,
    "char" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "onyomi" TEXT NOT NULL,
    "kunyomi" TEXT NOT NULL,
    "exampleWord" TEXT NOT NULL,
    "exampleReading" TEXT NOT NULL,
    "exampleMeaning" TEXT NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "kanji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocab_items" (
    "id" SERIAL NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupLabel" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "romaji" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "isKatakana" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vocab_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grammar_points" (
    "id" SERIAL NOT NULL,
    "pattern" TEXT NOT NULL,
    "gloss" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "examples" JSONB NOT NULL,

    CONSTRAINT "grammar_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloze_questions" (
    "id" SERIAL NOT NULL,
    "sentence" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "distractors" TEXT[],
    "note" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "cloze_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kana_characters" (
    "id" SERIAL NOT NULL,
    "group" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "hiragana" TEXT,
    "katakana" TEXT NOT NULL,
    "romaji" TEXT NOT NULL,

    CONSTRAINT "kana_characters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "kana_stats_userId_idx" ON "kana_stats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "kana_stats_userId_kanaKey_key" ON "kana_stats"("userId", "kanaKey");

-- CreateIndex
CREATE INDEX "srs_cards_userId_deckId_idx" ON "srs_cards"("userId", "deckId");

-- CreateIndex
CREATE UNIQUE INDEX "srs_cards_userId_cardId_key" ON "srs_cards"("userId", "cardId");

-- CreateIndex
CREATE INDEX "test_attempts_userId_createdAt_idx" ON "test_attempts"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "kanji_char_key" ON "kanji"("char");

-- CreateIndex
CREATE INDEX "kanji_level_idx" ON "kanji"("level");

-- CreateIndex
CREATE INDEX "vocab_items_level_idx" ON "vocab_items"("level");

-- CreateIndex
CREATE UNIQUE INDEX "vocab_items_groupId_word_key" ON "vocab_items"("groupId", "word");

-- CreateIndex
CREATE INDEX "grammar_points_level_idx" ON "grammar_points"("level");

-- CreateIndex
CREATE UNIQUE INDEX "grammar_points_level_pattern_key" ON "grammar_points"("level", "pattern");

-- CreateIndex
CREATE INDEX "cloze_questions_level_idx" ON "cloze_questions"("level");

-- CreateIndex
CREATE UNIQUE INDEX "cloze_questions_level_sentence_key" ON "cloze_questions"("level", "sentence");

-- CreateIndex
CREATE UNIQUE INDEX "kana_characters_katakana_key" ON "kana_characters"("katakana");

-- CreateIndex
CREATE INDEX "kana_characters_group_idx" ON "kana_characters"("group");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kana_stats" ADD CONSTRAINT "kana_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "srs_cards" ADD CONSTRAINT "srs_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
