import { type KanjiEntry } from "@kanado/content";

export type KanjiCategory =
  | "number-time"
  | "people"
  | "place"
  | "nature"
  | "action"
  | "study-work"
  | "body-health"
  | "abstract-other";

export type KanjiCategoryFilter = KanjiCategory | "all";

export const KANJI_CATEGORIES: { id: KanjiCategoryFilter; label: string }[] = [
  { id: "all", label: "Tất cả chủ đề" },
  { id: "number-time", label: "Số & thời gian" },
  { id: "people", label: "Con người" },
  { id: "place", label: "Nơi chốn & phương hướng" },
  { id: "nature", label: "Thiên nhiên" },
  { id: "action", label: "Hành động" },
  { id: "study-work", label: "Học tập & công việc" },
  { id: "body-health", label: "Cơ thể & sức khỏe" },
  { id: "abstract-other", label: "Khái niệm & khác" },
];

const CATEGORY_CHARACTERS: Record<Exclude<KanjiCategory, "abstract-other">, Set<string>> = {
  "number-time": new Set(
    "一二三四五六七八九十百千万円日月曜年時分半今週毎午前後間朝昼夜早春夏秋冬",
  ),
  people: new Set("人男女子父母友兄姉弟妹夫妻親族者君民客主師員老若私彼僕"),
  place: new Set("上下中外右左東西南北国道駅店内辺近遠所場町村市区県州京都室家門階庭"),
  nature: new Set("山川田天空雨花草林森海池石竹貝犬猫鳥魚牛馬虫風雪雲晴星光火水木金土"),
  action: new Set("行来帰見聞話言食飲買出入立休会走歩起寝動作使持取送待開閉乗降止始終"),
  "study-work": new Set("学校語文字幕本会社仕事業働勉強教習読書問答題験研究経済政治法職"),
  "body-health": new Set("目耳口手足体心頭顔首声力病薬血骨歯肉身健命医"),
};

const CATEGORY_KEYWORDS: Record<Exclude<KanjiCategory, "abstract-other">, string[]> = {
  "number-time": [
    "số",
    "ngày",
    "tháng",
    "năm",
    "giờ",
    "tuần",
    "number",
    "day",
    "month",
    "year",
    "hour",
    "week",
    "time",
  ],
  people: [
    "người",
    "nam",
    "nữ",
    "bố",
    "mẹ",
    "person",
    "man",
    "woman",
    "father",
    "mother",
    "child",
  ],
  place: [
    "nơi",
    "trên",
    "dưới",
    "trong",
    "ngoài",
    "đông",
    "tây",
    "nam",
    "bắc",
    "place",
    "direction",
    "north",
    "south",
    "east",
    "west",
  ],
  nature: [
    "núi",
    "sông",
    "trời",
    "mưa",
    "cây",
    "hoa",
    "mountain",
    "river",
    "sky",
    "rain",
    "tree",
    "flower",
    "animal",
  ],
  action: [
    "đi",
    "đến",
    "về",
    "ăn",
    "uống",
    "nhìn",
    "nghe",
    "nói",
    "to go",
    "to come",
    "to eat",
    "to drink",
    "action",
  ],
  "study-work": [
    "học",
    "trường",
    "sách",
    "viết",
    "đọc",
    "công việc",
    "study",
    "school",
    "book",
    "write",
    "read",
    "work",
  ],
  "body-health": [
    "mắt",
    "tai",
    "tay",
    "chân",
    "cơ thể",
    "bệnh",
    "eye",
    "ear",
    "hand",
    "foot",
    "body",
    "sickness",
    "health",
  ],
};

const CLASSIFICATION_ORDER: Exclude<KanjiCategory, "abstract-other">[] = [
  "number-time",
  "people",
  "place",
  "nature",
  "body-health",
  "study-work",
  "action",
];

function meaningHasKeyword(meaning: string, keyword: string) {
  if (!/^[a-z ]+$/.test(keyword)) return meaning.includes(keyword);

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}(?=[^a-z]|$)`).test(meaning);
}

export function classifyKanji(item: KanjiEntry): KanjiCategory {
  const meaning = `${item.meaning} ${item.example.meaning}`.toLowerCase();

  for (const category of CLASSIFICATION_ORDER) {
    if (CATEGORY_CHARACTERS[category].has(item.char)) return category;
    if (CATEGORY_KEYWORDS[category].some((keyword) => meaningHasKeyword(meaning, keyword))) {
      return category;
    }
  }

  return "abstract-other";
}

export function kanjiCategoryLabel(category: KanjiCategory) {
  return KANJI_CATEGORIES.find((item) => item.id === category)?.label ?? "Khái niệm & khác";
}
