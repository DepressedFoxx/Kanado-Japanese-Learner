import type { CoverageRow, PlanStep, Resource } from "./types";

/**
 * Lộ trình chặng hai: từ N4 lên N3.
 *
 * Khác với chặng N5-N4, ứng dụng này gần như không có nội dung N3 — đây thuần
 * là bản đồ đường đi, còn nguyên liệu phải lấy từ giáo trình và tài liệu thật.
 * Coverage bên dưới nói rõ chỗ nào app phủ được, chỗ nào không.
 */

/** Mục tiêu JLPT N3 (số cộng dồn, đã tính cả phần N5-N4). */
export const N3_TARGET = { kanji: 650, vocab: 3750, grammar: 150, listening: 60 } as const;

export const planStepsN3: PlanStep[] = [
  [
    "Trước khi bắt đầu",
    "Chắc N4 đã, đừng vội",
    "N4 chưa vững mà nhảy sang N3 là cách chắc chắn nhất để bỏ cuộc giữa chừng. Kiểm tra ba thứ: chia được đủ các thể động từ mà không cần nghĩ, đọc trôi 300 kanji N4 không cần furigana, và nghe hiểu hội thoại N4 ngay lần đầu. Thiếu bất kỳ cái nào thì quay lại củng cố trước.",
    "Đề Tổng hợp N5+N4 trong app đạt ≥ 90%, và đọc được một bài NHK Easy mà không tra quá 5 từ.",
  ],
  [
    "Toàn chặng",
    "Hiểu quy mô: N3 nặng gấp đôi N4",
    "Đây là bước nhảy lớn nhất trong cả thang JLPT. Kanji từ 300 lên khoảng 650, từ vựng từ 1.500 lên khoảng 3.750 — tức là gấp hơn hai lần rưỡi. Tính theo giờ học, N4 tốn khoảng 550-600 giờ tích luỹ, N3 khoảng 900-950 giờ. Nghĩa là riêng chặng N4 lên N3 đã ngốn 300-350 giờ nữa.",
    "Chấp nhận mốc 8-12 tháng ở nhịp 1 giờ/ngày, thay vì kỳ vọng vài tháng.",
  ],
  [
    "Tháng 1-4",
    "Kanji: 300 thành 650",
    "Mỗi ngày 5 chữ mới, không nghỉ. Ở mức này đừng học chữ rời nữa mà học theo từ ghép: 経済, 政治, 社会, 影響. Một chữ N3 thường có nhiều âm On và xuất hiện trong hàng chục từ — nhớ chữ mà không nhớ từ thì đọc vẫn không hiểu. Bộ thủ bắt đầu có ích thật sự để đoán nghĩa chữ chưa gặp.",
    "Đọc được 650 chữ trong ngữ cảnh, không phải nhận mặt chữ rời.",
  ],
  [
    "Tháng 1-7",
    "Từ vựng: 20-25 từ mỗi ngày",
    "Con số này nghe đáng sợ nhưng bắt buộc, vì 2.250 từ mới chia cho khoảng 300 ngày. Quan trọng hơn số lượng là cách học: từ N3 trở đi phải học từ trong câu, không học danh sách rời. Bắt đầu ghi lại câu gặp trong lúc đọc thay vì chép nghĩa tiếng Việt.",
    "Đọc một đoạn tin NHK Easy và hiểu được ý chính mà không tra từ điển.",
  ],
  [
    "Tháng 3-8",
    "Ngữ pháp: nhớ mẫu là chưa đủ",
    "N3 có khoảng 150 mẫu mới, nhưng cái khó không nằm ở số lượng mà ở việc phân biệt các mẫu gần giống nhau: ～によって và ～に対して, ～ば và ～たら và ～なら, ～ようだ và ～らしい và ～みたい. Đề thi hỏi đúng chỗ đó. Ngoài ra bắt đầu phân biệt văn nói và văn viết, vì đề đọc dùng văn viết còn đề nghe dùng văn nói.",
    "Chọn đúng mẫu trong nhóm 3-4 mẫu gần nghĩa, giải thích được vì sao mẫu kia sai.",
  ],
  [
    "Tháng 4 trở đi",
    "Đọc hiểu là nút thắt thật sự",
    "Đây là chỗ nhiều người trượt N3 dù thuộc đủ kanji và ngữ pháp. Bài đọc dài ra, phải tìm thông tin trong bảng biểu và quảng cáo, và thời gian rất chặt. Cách duy nhất là đọc nhiều: NHK News Web Easy hằng ngày, rồi chuyển dần sang NHK thường. Đọc rộng để quen tốc độ, đọc kỹ để phân tích câu dài — cần cả hai.",
    "Đọc xong một bài 500 chữ trong 5 phút và trả lời đúng câu hỏi ý chính.",
  ],
  [
    "Tháng 5 trở đi",
    "Nghe: tốc độ thật, không nhắc lại",
    "Nghe N3 nhanh hơn N4 rõ rệt, ít lặp lại, và nhiều lối nói rút gọn của đời thường (～ちゃう, ～とく, ～なきゃ). Mỗi ngày 30 phút, chia hai: 15 phút nghe có script để chép chính tả, 15 phút nghe thụ động lúc đi đường. Shadowing — nghe và nói đuổi theo — là bài tập hiệu quả nhất ở mức này.",
    "Nghe hiểu hội thoại N3 ngay lần đầu, không cần script.",
  ],
  [
    "Bước ngoặt",
    "Thôi dịch trong đầu",
    "Đây là thay đổi quan trọng nhất của chặng N3, và nó không nằm trong giáo trình nào. Ở N5-N4 bạn dịch từng câu sang tiếng Việt rồi mới hiểu — cách đó đủ nhanh cho câu ngắn nhưng sụp đổ khi câu dài ra. Từ giờ tập hiểu thẳng bằng tiếng Nhật: đọc lại nhiều lần tài liệu dễ thay vì tra từng từ tài liệu khó, và dùng từ điển Nhật-Nhật cho những từ đã biết đại ý.",
    "Đọc một trang tiếng Nhật mà không thấy tiếng Việt hiện lên trong đầu.",
  ],
  [
    "2 tháng cuối",
    "Luyện đề và phân bổ thời gian",
    "Chuyển hẳn sang đề thật, mỗi tuần một đề đầy đủ có bấm giờ. N3 khắt khe về thời gian hơn N4 nhiều, nên luyện chiến thuật: phần đọc làm câu ngắn trước, gặp bài dài hóc thì bỏ qua quay lại sau. Chấm xong phải phân tích từng câu sai thuộc dạng nào, chứ không chỉ đếm điểm.",
    "Ba đề thật liên tiếp đạt ≥ 110/180, không phần nào dưới 25/60.",
  ],
  [
    "Ngày thi",
    "Cấu trúc và điểm đỗ N3",
    "Ba phần thi: 文字・語彙 30 phút, 文法・読解 70 phút, 聴解 40 phút. Điểm chia làm ba mảng, mỗi mảng 60 điểm: Kiến thức ngôn ngữ, Đọc hiểu, Nghe hiểu. Khác N4 ở chỗ N3 tách Đọc thành mảng chấm riêng — nên đọc kém là trượt, dù hai mảng kia cao. Đỗ cần tổng ≥ 95/180 và mỗi mảng ≥ 19.",
    "Kiểm tra lại con số và hạn đăng ký trên jlpt.jp trước mỗi kỳ.",
  ],
].map(([milestone, title, body, criteria]) => ({ milestone, title, body, criteria }));

export const resourcesN3: Resource[] = [
  [
    "Giáo trình khung",
    "Shin Kanzen Master N3 (bộ 5 cuốn) hoặc Sou Matome N3",
    "Shin Kanzen kỹ và khó hơn, hợp nếu muốn chắc. Sou Matome nhẹ hơn, hợp nếu thời gian gấp.",
  ],
  [
    "Cầu nối N4 lên N3",
    "Tobira, hoặc Try! N3",
    "Try! N3 dễ vào hơn, nên học trước khi mở Shin Kanzen để đỡ sốc.",
  ],
  [
    "Kanji",
    "Basic Kanji Book 2, Kanji Look and Learn",
    "Học theo từ ghép chứ không học chữ rời — đây là điểm khác N4.",
  ],
  [
    "Đọc",
    "NHK News Web Easy hằng ngày, rồi chuyển sang NHK thường",
    "Miễn phí và cập nhật mỗi ngày. Đây là nguồn quan trọng nhất của chặng N3.",
  ],
  [
    "Nghe",
    "Mimi kara Oboeru N3, podcast Nihongo con Teppei, drama có phụ đề tiếng Nhật",
    "Mỗi ngày 30 phút. Shadowing hiệu quả hơn nghe thụ động.",
  ],
  [
    "Luyện đề",
    "日本語能力試験 公式問題集 N3, Shin Kanzen Master 読解 N3",
    "Hai tháng cuối, mỗi tuần một đề bấm giờ.",
  ],
].map(([area, items, note]) => ({ area, items, note }));

/**
 * App phủ được bao nhiêu cho N3. Con số cố ý để trần trụi: phần lớn nội dung
 * N3 không có trong app, và giấu điều đó chỉ khiến người học vỡ kế hoạch.
 */
export function buildCoverageN3(
  kanjiCount: number,
  vocabCount: number,
  grammarN3Count: number,
): CoverageRow[] {
  return [
    { label: "Kanji", have: kanjiCount, need: N3_TARGET.kanji },
    { label: "Từ vựng", have: vocabCount, need: N3_TARGET.vocab },
    {
      label: "Mẫu ngữ pháp N3",
      have: grammarN3Count,
      need: N3_TARGET.grammar,
      note: "app chưa có nội dung N3 — dùng giáo trình",
    },
    {
      label: "Đọc hiểu",
      have: 0,
      need: 60,
      note: "điểm đọc — mảng chấm riêng ở N3, app không dạy được",
    },
    {
      label: "Luyện nghe",
      have: 0,
      need: N3_TARGET.listening,
      note: "điểm nghe — app không dạy được",
    },
  ];
}
