export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Chuẩn hóa romaji người dùng gõ: chấp nhận si/shi, tu/tsu, hu/fu… */
const ROMAJI_ALIASES: Record<string, string> = {
  si: "shi", ti: "chi", tu: "tsu", hu: "fu", zi: "ji", di: "ji", du: "zu",
  sya: "sha", syu: "shu", syo: "sho", tya: "cha", tyu: "chu", tyo: "cho",
  jya: "ja", jyu: "ju", jyo: "jo", zya: "ja", zyu: "ju", zyo: "jo",
  o: "wo", nn: "n", vi: "vu",
};

export function normalizeRomaji(input: string): string {
  const cleaned = input.trim().toLowerCase().replace(/[^a-z]/g, "");
  return ROMAJI_ALIASES[cleaned] ?? cleaned;
}
