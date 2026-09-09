import type { Level, ListeningQuestionType, ReadingQuestionType } from "./types";

export interface JlptReadingSpec {
  type: ReadingQuestionType;
  label: string;
  targetCharacters: string;
}

export interface JlptLevelSpec {
  grammarReadingMinutes: number;
  listeningMinutes: number;
  reading: JlptReadingSpec[];
  listening: { type: ListeningQuestionType; label: string }[];
  referenceUrl: string;
}

/**
 * Ma trận biên soạn lấy từ "Purposes of test items" của JLPT.
 * Số ký tự là mục tiêu gần đúng, không phải giới hạn cứng của mọi đề thi.
 */
export const JLPT_CONTENT_SPEC: Record<Level, JlptLevelSpec> = {
  N5: {
    grammarReadingMinutes: 40,
    listeningMinutes: 30,
    reading: [
      { type: "short", label: "Đoạn ngắn", targetCharacters: "khoảng 80" },
      { type: "mid", label: "Đoạn trung bình", targetCharacters: "khoảng 250" },
      { type: "information", label: "Tìm thông tin", targetCharacters: "khoảng 250" },
    ],
    listening: [
      { type: "task", label: "Hiểu nhiệm vụ" },
      { type: "key-point", label: "Nắm thông tin chính" },
      { type: "verbal-expression", label: "Chọn câu phù hợp tình huống" },
      { type: "quick-response", label: "Phản hồi nhanh" },
    ],
    referenceUrl: "https://www.jlpt.jp/e/guideline/pdf/n5_e_revised.pdf",
  },
  N4: {
    grammarReadingMinutes: 55,
    listeningMinutes: 35,
    reading: [
      { type: "short", label: "Đoạn ngắn", targetCharacters: "khoảng 100-200" },
      { type: "mid", label: "Đoạn trung bình", targetCharacters: "khoảng 450" },
      { type: "information", label: "Tìm thông tin", targetCharacters: "khoảng 400" },
    ],
    listening: [
      { type: "task", label: "Hiểu nhiệm vụ" },
      { type: "key-point", label: "Nắm thông tin chính" },
      { type: "verbal-expression", label: "Chọn câu phù hợp tình huống" },
      { type: "quick-response", label: "Phản hồi nhanh" },
    ],
    referenceUrl: "https://www.jlpt.jp/e/guideline/pdf/n4_e_revised.pdf",
  },
  N3: {
    grammarReadingMinutes: 70,
    listeningMinutes: 40,
    reading: [
      { type: "short", label: "Đoạn ngắn", targetCharacters: "khoảng 150-200" },
      { type: "mid", label: "Đoạn trung bình", targetCharacters: "khoảng 350" },
      { type: "long", label: "Đoạn dài", targetCharacters: "khoảng 550" },
      { type: "information", label: "Tìm thông tin", targetCharacters: "khoảng 600" },
    ],
    listening: [
      { type: "task", label: "Hiểu nhiệm vụ" },
      { type: "key-point", label: "Nắm thông tin chính" },
      { type: "outline", label: "Hiểu ý tổng quát" },
      { type: "verbal-expression", label: "Chọn câu phù hợp tình huống" },
      { type: "quick-response", label: "Phản hồi nhanh" },
    ],
    referenceUrl: "https://www.jlpt.jp/e/guideline/pdf/n3_e.pdf",
  },
};
