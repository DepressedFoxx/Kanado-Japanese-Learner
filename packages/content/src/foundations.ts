import type { GrammarExample } from "./types";

/**
 * Nền tảng: trật tự từ và hệ thống thì.
 *
 * Phần này lẽ ra phải đứng trước mọi mẫu ngữ pháp nhưng lại hay bị bỏ qua, vì
 * giáo trình thường dạy thẳng vào mẫu câu. Không nắm trật tự từ và bảng bốn
 * dạng thì học mẫu nào cũng thành học thuộc lòng.
 */

export interface FoundationTopic {
  title: string;
  gloss: string;
  body: string;
  examples: GrammarExample[];
  /** bảng phụ, ví dụ ma trận thì */
  table?: { header: string[]; rows: string[][] };
}

export const foundations: FoundationTopic[] = [
  {
    title: "Trật tự câu: động từ luôn đứng cuối",
    gloss: "S – O – V, ngược với tiếng Việt",
    body: "Tiếng Việt là Chủ – Động – Tân (tôi ăn cơm). Tiếng Nhật là Chủ – Tân – Động (私はごはんを食べます). Động từ luôn khoá cuối câu, nên nghe tiếng Nhật phải nghe hết câu mới biết người ta làm gì hay không làm gì — phủ định cũng nằm ở đuôi động từ.",
    examples: [
      { jp: "私は　ごはんを　食べます。", vn: "Tôi ăn cơm. (tôi / cơm / ăn)" },
      { jp: "田中さんは　図書館で　日本語を　勉強します。", vn: "Anh Tanaka học tiếng Nhật ở thư viện." },
    ],
  },
  {
    title: "Trợ từ quyết định vai trò, không phải vị trí",
    gloss: "đổi chỗ được, bỏ trợ từ thì không",
    body: "Trong tiếng Việt, vị trí từ quyết định ai làm gì. Trong tiếng Nhật, trợ từ đứng sau danh từ mới làm việc đó: は đánh dấu chủ đề, が chủ ngữ, を tân ngữ, に đích đến, で nơi chốn. Vì vậy các thành phần giữa câu đảo chỗ cho nhau vẫn đúng nghĩa, miễn động từ ở cuối.",
    examples: [
      { jp: "図書館で　日本語を　勉強します。", vn: "Học tiếng Nhật ở thư viện." },
      { jp: "日本語を　図書館で　勉強します。", vn: "Cùng nghĩa — chỉ đổi nhấn mạnh." },
    ],
  },
  {
    title: "Bổ nghĩa luôn đứng TRƯỚC danh từ",
    gloss: "ngược hoàn toàn với tiếng Việt",
    body: "Tiếng Việt nói \"sách của tôi\", \"phòng yên tĩnh\", \"người tôi đã gặp hôm qua\" — bổ nghĩa đứng sau. Tiếng Nhật luôn ngược lại: tất cả phần bổ nghĩa, dù dài đến đâu, đều đứng trước danh từ nó bổ nghĩa. Đây là lý do câu tiếng Nhật dài rất khó đọc với người Việt: phải đọc đến cuối cụm mới biết đang nói về cái gì.",
    examples: [
      { jp: "私の　本", vn: "sách của tôi" },
      { jp: "しずかな　部屋", vn: "phòng yên tĩnh" },
      { jp: "きのう　会った　人", vn: "người (mà) hôm qua tôi đã gặp" },
    ],
  },
  {
    title: "Chỉ có HAI thì: quá khứ và phi quá khứ",
    gloss: "không có thì tương lai",
    body: "Đây là điều làm nhiều người bất ngờ: tiếng Nhật không có thì tương lai. Dạng \"phi quá khứ\" (ます / thể từ điển) dùng cho cả hiện tại lẫn tương lai — muốn nói rõ tương lai thì thêm trạng từ thời gian như あした, 来年. Ngược lại, mỗi động từ có bốn dạng do hai trục cắt nhau: quá khứ hay không, khẳng định hay phủ định.",
    examples: [
      { jp: "毎日　働きます。", vn: "Ngày nào tôi cũng làm việc. (hiện tại)" },
      { jp: "あした　働きます。", vn: "Mai tôi sẽ làm việc. (tương lai — vẫn dạng đó)" },
      { jp: "きのう　働きました。", vn: "Hôm qua tôi đã làm việc. (quá khứ)" },
    ],
    table: {
      header: ["", "Khẳng định", "Phủ định"],
      rows: [
        ["Phi quá khứ", "働きます", "働きません"],
        ["Quá khứ", "働きました", "働きませんでした"],
      ],
    },
  },
  {
    title: "Lịch sự là trục riêng, không phải thì",
    gloss: "thể ます và thể thường",
    body: "Cùng một nghĩa có hai cách nói: thể ます (lịch sự, dùng với người lạ và người trên) và thể thường (thân mật, dùng với bạn bè, và bắt buộc khi ghép vào các mẫu câu lớn hơn như ～と思います, ～とき, ～から). Người mới thường chỉ học thể ます rồi mắc kẹt ở N4, vì gần như mọi mẫu ngữ pháp N4 trở lên đều đòi thể thường.",
    examples: [
      { jp: "食べます　／　食べる", vn: "ăn — lịch sự / thân mật" },
      { jp: "食べません　／　食べない", vn: "không ăn" },
      { jp: "食べました　／　食べた", vn: "đã ăn" },
      { jp: "あした雨が降ると思います。", vn: "Tôi nghĩ mai mưa. (降る — bắt buộc thể thường)" },
    ],
  },
  {
    title: "Ba loại vị ngữ, chia khác nhau",
    gloss: "danh từ, tính từ い, tính từ な, động từ",
    body: "Câu tiếng Nhật kết thúc bằng một trong bốn loại vị ngữ, và mỗi loại chia theo cách riêng. Nhầm cách chia giữa tính từ い và tính từ な là lỗi phổ biến nhất của người mới: 高いです → 高かったです (đúng), 高いでした (sai).",
    examples: [
      { jp: "学生です　→　学生でした", vn: "là sinh viên → đã là sinh viên (danh từ)" },
      { jp: "高いです　→　高かったです", vn: "đắt → đã đắt (tính từ い — bỏ い thêm かった)" },
      { jp: "静かです　→　静かでした", vn: "yên tĩnh → đã yên tĩnh (tính từ な — chia như danh từ)" },
      { jp: "行きます　→　行きました", vn: "đi → đã đi (động từ)" },
    ],
    table: {
      header: ["Loại", "Hiện tại", "Quá khứ", "Phủ định"],
      rows: [
        ["Danh từ", "学生です", "学生でした", "学生ではありません"],
        ["Tính từ い", "高いです", "高かったです", "高くないです"],
        ["Tính từ な", "静かです", "静かでした", "静かではありません"],
        ["Động từ", "行きます", "行きました", "行きません"],
      ],
    },
  },
  {
    title: "Câu hỏi: thêm か, không đảo trật tự",
    gloss: "trật tự từ giữ nguyên",
    body: "Tiếng Anh đảo trợ động từ lên đầu, tiếng Việt thêm \"không\" ở cuối. Tiếng Nhật đơn giản hơn: giữ nguyên câu kể rồi thêm か. Từ để hỏi (なに, だれ, どこ) cũng đứng đúng vị trí mà câu trả lời sẽ đứng, không nhảy lên đầu câu.",
    examples: [
      { jp: "田中さんは　学生です。→　田中さんは　学生ですか。", vn: "Anh Tanaka là sinh viên. → …phải không?" },
      { jp: "何を　食べますか。", vn: "Bạn ăn gì? (何 đứng đúng chỗ của tân ngữ)" },
    ],
  },
  {
    title: "Chủ ngữ được lược bỏ liên tục",
    gloss: "biết rồi thì không nhắc lại",
    body: "Khác tiếng Anh, tiếng Nhật bỏ chủ ngữ ngay khi ngữ cảnh đã rõ — và điều này rất phổ biến, không phải nói tắt. 私は xuất hiện nhiều trong sách giáo khoa chỉ để dạy ngữ pháp; hội thoại thật gần như không nói. Nghe hiểu ở N3 khó lên chính vì phải tự suy ra ai đang làm gì.",
    examples: [
      { jp: "「ごはんを食べましたか。」「はい、食べました。」", vn: "\"Ăn cơm chưa?\" \"Rồi, ăn rồi.\" (không câu nào có chủ ngữ)" },
    ],
  },
];
