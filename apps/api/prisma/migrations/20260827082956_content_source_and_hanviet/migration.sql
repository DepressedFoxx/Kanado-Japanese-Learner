-- AlterTable
ALTER TABLE "kanji" ADD COLUMN     "frequency" INTEGER,
ADD COLUMN     "hanViet" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'vi',
ADD COLUMN     "strokes" INTEGER;

-- AlterTable
ALTER TABLE "vocab_items" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'vi';
