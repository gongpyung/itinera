import type { ThemeId } from "./types";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  hint: string;
  /** Two representative colors, used by the picker swatch. */
  swatch: [string, string];
};

export const THEMES: ThemeMeta[] = [
  {
    id: "harbour",
    label: "하버",
    hint: "청록 · 코랄 · 앰버 — 항구, 해안 도시",
    swatch: ["#007c75", "#f6eee8"],
  },
  {
    id: "sakura",
    label: "사쿠라",
    hint: "부드러운 핑크 · 크림 — 봄, 벚꽃",
    swatch: ["#e8435a", "#ffefee"],
  },
  {
    id: "ocean",
    label: "오션",
    hint: "시안 · 블루 — 해변, 섬, 겨울 바다",
    swatch: ["#0891b2", "#ecfeff"],
  },
  {
    id: "forest",
    label: "포레스트",
    hint: "진초록 · 올리브 — 자연, 하이킹",
    swatch: ["#16a34a", "#ecfdf5"],
  },
  {
    id: "sunset",
    label: "선셋",
    hint: "오렌지 · 딥레드 — 사막, 노을",
    swatch: ["#ea580c", "#fff7ed"],
  },
  {
    id: "monochrome",
    label: "모노크롬",
    hint: "그레이 · 블랙 — 도심, 비즈니스",
    swatch: ["#4b5563", "#f3f4f6"],
  },
];

export const THEME_MAP = Object.fromEntries(
  THEMES.map((theme) => [theme.id, theme]),
) as Record<ThemeId, ThemeMeta>;

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in THEME_MAP;
}
