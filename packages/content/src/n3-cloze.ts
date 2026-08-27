/**
 * Ngân hàng câu hỏi điền chỗ trống N3.
 *
 * Ưu tiên các cặp mẫu gần nghĩa mà đề thi hay đánh: せい/おかげ, わけ/はず,
 * につれて/によって, さえ/しか. Phần giải thích nói rõ vì sao đáp án kia sai.
 *
 * Định dạng: [câu có ___, đáp án, lựa chọn sai, giải thích, dịch]
 */
import { validateClozeRows } from "./validate";

export const GBANK_N3: (string | string[])[][] = validateClozeRows([
  ["日本の文化___研究しています。","について",["に対して","によって","において"],"について nêu chủ đề của việc nghiên cứu; に対して là đối tượng mà thái độ hướng tới.","Tôi đang nghiên cứu về văn hóa Nhật."],
  ["先生___失礼なことを言ってしまった。","に対して",["について","にとって","によって"],"Thái độ hướng tới một người thì dùng に対して.","Tôi đã lỡ nói điều thất lễ với thầy."],
  ["人___考え方が違う。","によって",["について","に対して","にとって"],"によって mang nghĩa tùy theo, mỗi bên một khác.","Tùy người mà cách nghĩ khác nhau."],
  ["私___家族が一番大切です。","にとって",["について","によって","に関して"],"Đứng ở lập trường của ai để đánh giá thì dùng にとって.","Với tôi, gia đình quan trọng nhất."],
  ["留学生___日本に来ました。","として",["になって","にとって","によって"],"として chỉ tư cách, vai trò.","Tôi đến Nhật với tư cách du học sinh."],
  ["年をとる___、体が弱くなる。","につれて",["によって","に対して","として"],"Hai bên biến đổi song song và tự nhiên thì dùng につれて.","Càng lớn tuổi thì cơ thể càng yếu."],
  ["先生の___合格できました。","おかげで",["せいで","ために","くせに"],"Kết quả tốt dùng おかげで; せいで chỉ dùng khi kết quả xấu.","Nhờ có thầy mà em đã đỗ."],
  ["雨の___試合が中止になった。","せいで",["おかげで","ために","うちに"],"Kết quả xấu kèm ý trách móc thì dùng せいで.","Tại mưa mà trận đấu bị hủy."],
  ["知っている___教えてくれない。","くせに",["のに","ので","ばかり"],"くせに giống のに nhưng có rõ ý chê trách.","Biết vậy mà không chỉ cho."],
  ["10年も住んでいたのか。日本語が上手な___だ。","わけ",["はず","つもり","ところ"],"わけだ là vừa hiểu ra lý do; はずだ là suy đoán trước khi biết.","Sống tận 10 năm à. Thảo nào tiếng Nhật giỏi."],
  ["日本語が嫌いな___ではないが、難しい。","わけ",["はず","つもり","もの"],"～わけではない là phủ định nhẹ, đính chính suy đoán.","Không hẳn ghét tiếng Nhật, nhưng nó khó."],
  ["彼がそんなことを言う___がない。","わけ",["こと","もの","ところ"],"わけがない phủ định mạnh: không đời nào.","Không đời nào anh ấy nói vậy."],
  ["明日は試験だから、休む___にはいかない。","わけ",["こと","もの","ため"],"わけにはいかない là không thể vì lý do xã hội, không phải vì thiếu khả năng.","Mai thi nên không thể nghỉ."],
  ["この字は田中さんが書いた___違いない。","に",["は","が","で"],"～に違いない diễn tả suy đoán rất chắc chắn.","Chữ này chắc chắn anh Tanaka viết."],
  ["先月日本に来た___です。","ばかり",["ところ","まま","きり"],"たばかり là cảm giác vừa mới, tính bằng tuần tháng cũng được.","Tôi vừa mới sang Nhật tháng trước."],
  ["今、家を出る___です。","ところ",["ばかり","まま","うち"],"Thể từ điển + ところ nghĩa là sắp sửa làm.","Bây giờ tôi sắp ra khỏi nhà."],
  ["弟はゲーム___している。","ばかり",["だけ","しか","こそ"],"ばかり mang ý chê rằng chỉ mỗi việc đó, lặp mãi.","Em trai suốt ngày chỉ chơi game."],
  ["彼は英語___でなく、中国語も話せる。","だけ",["ばかり","しか","さえ"],"だけでなく～も là mẫu không những mà còn.","Không những tiếng Anh mà còn nói được tiếng Trung."],
  ["熱い___に食べてください。","うち",["まま","ところ","とたん"],"うちに là trong lúc trạng thái còn duy trì.","Hãy ăn khi còn nóng."],
  ["暗くならない___に帰りましょう。","うち",["まま","あと","とき"],"ないうちに là trước khi trạng thái thay đổi.","Về thôi, trước khi trời tối."],
  ["ドアを開けた___、猫が飛び出した。","とたん",["うちに","ばかり","ながら"],"たとたん: hai việc nối tiếp tức thì, vế sau ngoài dự tính.","Vừa mở cửa thì mèo lao ra."],
  ["彼に会う___、昔を思い出す。","たびに",["うちに","とたん","ながら"],"たびに nghĩa là lần nào cũng vậy.","Mỗi lần gặp anh ấy là tôi nhớ chuyện xưa."],
  ["朝ごはんを食べ___学校へ行った。","ずに",["ないで済み","なくて","ずには"],"ずに là dạng văn viết của ないで.","Tôi đi học mà không ăn sáng."],
  ["この量は一人では食べ___。","きれない",["きらない","かけない","がちない"],"きれない nghĩa là nhiều quá làm không xuể.","Lượng này một mình ăn không hết nổi."],
  ["冬は風邪をひき___です。","がち",["っぽい","きり","かけ"],"がち chỉ khuynh hướng hay xảy ra, thường tiêu cực.","Mùa đông hay bị cảm."],
  ["子どもが泥___になって帰ってきた。","だらけ",["がち","っぽい","気味"],"だらけ là bám đầy thứ gì đó, luôn mang nghĩa tiêu cực.","Thằng bé về nhà lấm đầy bùn."],
  ["これは子ども___の本です。","向け",["向き","そう","らしい"],"向け là cố ý làm dành cho đối tượng đó.","Đây là sách dành cho trẻ em."],
  ["立てない___疲れた。","ほど",["まで","くらいに","ばかり"],"ほど diễn tả mức độ bằng hình ảnh cụ thể.","Mệt đến mức không đứng nổi."],
  ["練習すれば___ほど上手になる。","する",["した","しない","して"],"Cấu trúc ～ば～ほど dùng thể ば cộng thể từ điển.","Càng luyện càng giỏi."],
  ["お金___あれば、何でもできる。","さえ",["しか","だけ","こそ"],"さえ～ば nghĩa là chỉ cần… là được.","Chỉ cần có tiền thì làm gì cũng được."],
  ["終電がないから、歩いて帰る___。","しかない",["だけない","ばかりない","さえない"],"しかない nghĩa là không còn lựa chọn nào khác.","Hết tàu cuối nên chỉ còn cách đi bộ về."],
  ["約束は守る___だ。","べき",["はず","つもり","こと"],"べきだ là điều đúng đắn nên làm về mặt đạo lý.","Đã hứa thì nên giữ lời."],
  ["連絡先が分からないので、知らせ___。","ようがない",["きれない","かけない","がちだ"],"ようがない nghĩa là muốn cũng không có cách nào.","Không biết địa chỉ nên không có cách nào báo."],
  ["先生が言った___にやってください。","とおり",["ばかり","ながら","うち"],"とおりに nghĩa là làm y như đã nêu.","Hãy làm đúng như thầy nói."],
  ["もう少し待って___です。","ほしい",["たい","ください","もらう"],"てほしい là muốn người khác làm; たい là tự mình muốn làm.","Tôi muốn anh đợi thêm chút."],
  ["毎日野菜を食べる___しています。","ように",["ことに","ために","そうに"],"ようにする là nỗ lực có ý thức để thành thói quen.","Tôi đang cố ăn rau mỗi ngày."],
  ["会議は9時から始まる___なっています。","ことに",["ように","ために","そうに"],"ことになっている là quy định, lịch trình đã định sẵn.","Theo quy định, cuộc họp bắt đầu từ 9 giờ."],
  ["部長にお酒を飲___。","まされた",["ませた","まれた","ませられる"],"Thể sai khiến bị động 飲まされる: bị ép phải uống.","Tôi bị trưởng phòng ép uống rượu."],
  ["先生はもう___か。","いらっしゃいました",["参りました","いたしました","申しました"],"Nói về hành động của thầy thì dùng tôn kính ngữ いらっしゃる.","Thầy đã đến chưa ạ?"],
  ["明日、そちらに___。","伺います",["いらっしゃいます","おっしゃいます","ご覧になります"],"Hành động của mình thì dùng khiêm nhường ngữ 伺う.","Ngày mai em xin đến chỗ đó ạ."],
  ["天気予報によると、明日は雪だ___。","ということだ",["わけだ","はずだ","ものだ"],"ということだ dùng để truyền đạt lại thông tin nghe được.","Theo dự báo thì nghe nói mai có tuyết."],
  ["こんな時間に電話するなんて、寝ている___。","に決まっている",["に違いない","わけがない","はずがない"],"に決まっている là niềm tin chủ quan chắc nịch của người nói.","Gọi giờ này thì chắc chắn người ta đang ngủ."],
  ["狭い___も、楽しい我が家。","ながら",["ばかり","だけ","こそ"],"ながらも thêm も thành ý nhượng bộ, khác ながら chỉ vừa làm vừa làm.","Tuy chật nhưng là mái nhà vui vẻ."],
], "câu hỏi N3");
