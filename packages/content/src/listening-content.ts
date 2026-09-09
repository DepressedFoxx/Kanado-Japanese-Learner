import type { Level, ListeningContent, ListeningQuestionType } from "./types";

const ORIGINAL_SOURCE = {
  kind: "original",
  title: "Kanadō JLPT listening bundle",
  license: "Kanadō original content",
  note: "Kịch bản gốc, biên soạn theo dạng câu hỏi JLPT; có thể tạo audio bằng VOICEVOX.",
} as const;

type ListeningDraft = Omit<ListeningContent, "source">;

function listening(draft: ListeningDraft): ListeningContent {
  return { ...draft, source: ORIGINAL_SOURCE };
}

export const listeningContent: ListeningContent[] = [
  listening({
    id: "listen-n5-task-homework",
    level: "N5",
    type: "task",
    title: "Bài tập về nhà",
    situation: "先生が学生に話しています。学生は家で何をしますか。",
    turns: [
      { speaker: "先生", text: "今日は教科書の二十ページを読みましたね。" },
      { speaker: "先生", text: "家で二十一ページの問題をしてください。作文は来週でいいです。" },
      { speaker: "学生", text: "はい、分かりました。" },
    ],
    questions: [
      {
        prompt: "学生は家で何をしますか。",
        choices: ["二十ページを読みます", "二十一ページの問題をします", "作文を書きます", "教科書を買います"],
        answerIndex: 1,
        explanation: "先生は二十一ページの問題をするように言いました。",
      },
    ],
    tags: ["trường học", "nhiệm vụ"],
  }),
  listening({
    id: "listen-n5-key-station",
    level: "N5",
    type: "key-point",
    title: "Hẹn ở nhà ga",
    situation: "男の人と女の人が電話で話しています。二人は何時に会いますか。",
    turns: [
      { speaker: "男", text: "あした、駅で十時に会いませんか。" },
      { speaker: "女", text: "十時は病院にいます。十一時半はどうですか。" },
      { speaker: "男", text: "いいですね。駅の北口で会いましょう。" },
    ],
    questions: [
      {
        prompt: "二人は何時に会いますか。",
        choices: ["十時", "十時半", "十一時", "十一時半"],
        answerIndex: 3,
        explanation: "女の人が提案した十一時半に決まりました。",
      },
    ],
    tags: ["hẹn gặp", "thời gian"],
  }),
  listening({
    id: "listen-n5-verbal-cafe",
    level: "N5",
    type: "verbal-expression",
    title: "Gọi món ở quán cà phê",
    situation: "喫茶店で店員を呼んで、コーヒーを一つ注文します。何と言いますか。",
    visualPrompt: "Một khách đang nhìn thực đơn và gọi nhân viên phục vụ trong quán cà phê.",
    turns: [{ speaker: "ナレーター", text: "店員を呼んで、コーヒーを一つ注文します。" }],
    questions: [
      {
        prompt: "何と言いますか。",
        choices: ["すみません、コーヒーを一つお願いします", "コーヒーを飲みました", "コーヒーがありますかでした", "ここはコーヒーです"],
        answerIndex: 0,
        explanation: "店員を呼び、丁寧に注文する表現です。",
      },
    ],
    tags: ["quán cà phê", "biểu đạt tình huống"],
  }),
  listening({
    id: "listen-n5-quick-weather",
    level: "N5",
    type: "quick-response",
    title: "Trời lạnh",
    situation: "短い文を聞いて、最もよい返事を選びます。",
    turns: [{ speaker: "女", text: "今日は寒いですね。" }],
    questions: [
      {
        prompt: "最もよい返事はどれですか。",
        choices: ["そうですね", "いただきます", "おめでとう", "行ってきます"],
        answerIndex: 0,
        explanation: "相手の感想に同意する「そうですね」が自然です。",
      },
    ],
    tags: ["thời tiết", "phản hồi nhanh"],
  }),
  listening({
    id: "listen-n4-task-copy",
    level: "N4",
    type: "task",
    title: "Chuẩn bị tài liệu họp",
    situation: "会社で女の人と男の人が話しています。男の人はこのあと、まず何をしますか。",
    turns: [
      { speaker: "女", text: "山田さん、午後の会議で使う資料を十部コピーしてください。" },
      { speaker: "男", text: "はい。コピーしたら会議室に置きますか。" },
      { speaker: "女", text: "その前に、三ページの数字が正しいか、田中さんに確認してください。" },
      { speaker: "男", text: "分かりました。" },
    ],
    questions: [
      {
        prompt: "男の人はまず何をしますか。",
        choices: ["資料を十部コピーする", "会議室に資料を置く", "田中さんに数字を確認する", "会議に参加する"],
        answerIndex: 2,
        explanation: "コピーする前に田中さんへ確認します。",
      },
    ],
    tags: ["công việc", "thứ tự hành động"],
  }),
  listening({
    id: "listen-n4-key-gym",
    level: "N4",
    type: "key-point",
    title: "Đăng ký phòng tập",
    situation: "スポーツセンターで説明を聞いています。今月申し込むと、全部でいくら払いますか。",
    turns: [
      { speaker: "係員", text: "毎月の利用料金は三千円です。初めての方は、カード代として五百円かかります。" },
      { speaker: "係員", text: "今月は入会金二千円が無料です。運動用の靴はご自分で用意してください。" },
    ],
    questions: [
      {
        prompt: "今月申し込むと、全部でいくら払いますか。",
        choices: ["三千円", "三千五百円", "五千円", "五千五百円"],
        answerIndex: 1,
        explanation: "月額三千円とカード代五百円で、入会金は無料です。",
      },
    ],
    tags: ["dịch vụ", "giá tiền"],
  }),
  listening({
    id: "listen-n4-verbal-train",
    level: "N4",
    type: "verbal-expression",
    title: "Xin nhường đường trên tàu",
    situation: "電車を降りたいですが、ドアの前に人が立っています。何と言いますか。",
    visualPrompt: "Một hành khách muốn xuống tàu nhưng có người đứng chắn trước cửa.",
    turns: [{ speaker: "ナレーター", text: "次の駅で降りたいですが、前に人が立っています。" }],
    questions: [
      {
        prompt: "何と言いますか。",
        choices: ["降りてはいけません", "すみません、通してください", "ここに立ちましょう", "ドアを閉めてください"],
        answerIndex: 1,
        explanation: "道を空けてもらう丁寧な依頼です。",
      },
    ],
    tags: ["tàu điện", "yêu cầu"],
  }),
  listening({
    id: "listen-n4-quick-late",
    level: "N4",
    type: "quick-response",
    title: "Đến muộn",
    situation: "短い文を聞いて、最もよい返事を選びます。",
    turns: [{ speaker: "男", text: "電車が遅れて、約束の時間に間に合いそうにありません。" }],
    questions: [
      {
        prompt: "最もよい返事はどれですか。",
        choices: ["では、先に店に入っています", "電車に乗りませんでした", "時間は昨日でした", "約束してはいけません"],
        answerIndex: 0,
        explanation: "遅れるという連絡に対する自然な対応です。",
      },
    ],
    tags: ["đến muộn", "phản hồi nhanh"],
  }),
  listening({
    id: "listen-n3-task-presentation",
    level: "N3",
    type: "task",
    title: "Chuẩn bị thuyết trình",
    situation: "大学で先生と学生が話しています。学生はこのあと、何をしなければなりませんか。",
    turns: [
      { speaker: "学生", text: "先生、来週の発表資料を見ていただけますか。" },
      { speaker: "先生", text: "内容は分かりやすいですが、このグラフは少し古いですね。新しい資料を探して入れ替えてください。" },
      { speaker: "学生", text: "説明の順番も変えたほうがいいでしょうか。" },
      { speaker: "先生", text: "順番はこのままでいいです。ただ、発表は十分以内なので、最後の例を一つ減らしましょう。" },
    ],
    questions: [
      {
        prompt: "学生は資料をどう直しますか。",
        choices: ["グラフを新しくし、例を一つ減らす", "説明の順番だけを変える", "グラフを消し、例を増やす", "発表時間を長くする"],
        answerIndex: 0,
        explanation: "古いグラフを入れ替え、最後の例を一つ減らします。",
      },
    ],
    tags: ["đại học", "nhiệm vụ", "nhiều điều kiện"],
  }),
  listening({
    id: "listen-n3-key-delivery",
    level: "N3",
    type: "key-point",
    title: "Thay đổi thời gian giao hàng",
    situation: "女の人が配達会社に電話しています。荷物はいつ届くことになりましたか。",
    turns: [
      { speaker: "女", text: "明日の午前中に届く予定の荷物ですが、午後に変えられますか。" },
      { speaker: "係員", text: "午後二時から四時と、六時から八時が空いています。" },
      { speaker: "女", text: "四時まで仕事なので、遅いほうでお願いします。" },
      { speaker: "係員", text: "では、明日の午後六時から八時に変更します。" },
    ],
    questions: [
      {
        prompt: "荷物はいつ届きますか。",
        choices: ["明日の午前中", "明日の二時から四時", "明日の六時から八時", "今日の六時から八時"],
        answerIndex: 2,
        explanation: "仕事後に受け取れる六時から八時へ変更しました。",
      },
    ],
    tags: ["giao hàng", "thông tin chính"],
  }),
  listening({
    id: "listen-n3-outline-coworking",
    level: "N3",
    type: "outline",
    title: "Không gian làm việc chung",
    situation: "男の人が新しい施設について話しています。男の人が一番伝えたいことは何ですか。",
    turns: [
      {
        speaker: "男",
        text: "駅前に新しい共同オフィスができました。机や会議室を時間単位で借りることができ、会社員だけでなく学生も利用しています。私は家で仕事をすると集中できないときに使っています。料金は安くありませんが、そこで知り合った人から仕事のアイデアをもらうこともあります。単に場所を借りるだけではなく、違う仕事をする人と交流できる点が、この施設の大きな魅力だと思います。",
      },
    ],
    questions: [
      {
        prompt: "男の人が一番伝えたいことは何ですか。",
        choices: ["学生は利用できない", "料金が非常に安い", "家で仕事をするべきだ", "仕事をする場所と交流の機会が得られる"],
        answerIndex: 3,
        explanation: "最後に、人との交流が施設の大きな魅力だと述べています。",
      },
    ],
    tags: ["công việc", "ý chính", "quan điểm"],
  }),
  listening({
    id: "listen-n3-verbal-office",
    level: "N3",
    type: "verbal-expression",
    title: "Mượn phòng họp",
    situation: "予約していない会議室を、今から一時間だけ使いたいです。受付の人に何と言いますか。",
    visualPrompt: "Một nhân viên đứng tại quầy lễ tân và muốn hỏi mượn phòng họp còn trống.",
    turns: [{ speaker: "ナレーター", text: "予約していませんが、空いている会議室を一時間使いたいです。" }],
    questions: [
      {
        prompt: "何と言いますか。",
        choices: ["会議室を予約していただきました", "会議室が空いていたことがありますか", "今から一時間、使える会議室はありますか", "一時間後に会議室を使わせましたか"],
        answerIndex: 2,
        explanation: "空室の有無と利用可能性を丁寧に尋ねています。",
      },
    ],
    tags: ["văn phòng", "hỏi xin phép"],
  }),
  listening({
    id: "listen-n3-quick-report",
    level: "N3",
    type: "quick-response",
    title: "Báo cáo chưa hoàn thành",
    situation: "短い文を聞いて、最もよい返事を選びます。",
    turns: [{ speaker: "女", text: "頼んでいた報告書、今日中には無理そうですか。" }],
    questions: [
      {
        prompt: "最もよい返事はどれですか。",
        choices: ["はい、報告書を頼みません", "もう少しで終わるので、六時までには出せます", "今日中に読んだそうです", "無理をしたことがありません"],
        answerIndex: 1,
        explanation: "締め切りに間に合う見込みを具体的に答えています。",
      },
    ],
    tags: ["công việc", "phản hồi nhanh"],
  }),
];

export function listeningByLevel(level: Level | "both"): ListeningContent[] {
  return level === "both"
    ? listeningContent
    : listeningContent.filter((item) => item.level === level);
}

export function listeningByType(type: ListeningQuestionType): ListeningContent[] {
  return listeningContent.filter((item) => item.type === type);
}
