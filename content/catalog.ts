// Static game content. Ids are persisted in user state: never rename, only add.

export const WINDOWS = ["dawn", "day", "evening", "night"] as const;
export type TimeWindow = (typeof WINDOWS)[number];

export const WINDOW_INFO: Record<TimeWindow, { nameKo: string; from: number; to: number }> = {
  dawn: { nameKo: "새벽", from: 5, to: 9 },
  day: { nameKo: "낮", from: 9, to: 17 },
  evening: { nameKo: "저녁", from: 17, to: 21 },
  night: { nameKo: "밤", from: 21, to: 5 },
};

// Eight sky phases are purely visual; piece drops use the four windows above.
export const SKY_PHASES = [
  { id: "predawn", from: 3 },
  { id: "dawn", from: 5 },
  { id: "morning", from: 7 },
  { id: "midday", from: 10 },
  { id: "afternoon", from: 14 },
  { id: "evening", from: 17 },
  { id: "twilight", from: 19 },
  { id: "night", from: 21 },
] as const;
export type SkyPhase = (typeof SKY_PHASES)[number]["id"];

export type Rarity = "common" | "rare" | "special";
export const RARITY_KO: Record<Rarity, string> = { common: "보통", rare: "희귀", special: "특별" };

type PieceDef = { id: string; window: TimeWindow; rarity: Rarity; nameKo: string };

export const PIECES = [
  { id: "dew", window: "dawn", rarity: "common", nameKo: "이슬" },
  { id: "sunbeam", window: "dawn", rarity: "common", nameKo: "아침 햇살" },
  { id: "mug", window: "dawn", rarity: "common", nameKo: "김 나는 머그" },
  { id: "feather", window: "dawn", rarity: "rare", nameKo: "참새 깃털" },
  { id: "pink-cloud", window: "dawn", rarity: "rare", nameKo: "분홍 구름" },
  { id: "sunrise-marble", window: "dawn", rarity: "special", nameKo: "해돋이 구슬" },

  { id: "cloud", window: "day", rarity: "common", nameKo: "뭉게구름" },
  { id: "pencil", window: "day", rarity: "common", nameKo: "연필" },
  { id: "sprout", window: "day", rarity: "common", nameKo: "새싹" },
  { id: "paper-plane", window: "day", rarity: "rare", nameKo: "종이비행기" },
  { id: "lemon-candy", window: "day", rarity: "rare", nameKo: "레몬 사탕" },
  { id: "rainbow", window: "day", rarity: "special", nameKo: "무지개 조각" },

  { id: "sunset-glass", window: "evening", rarity: "common", nameKo: "노을 유리" },
  { id: "warm-light", window: "evening", rarity: "common", nameKo: "따뜻한 불빛" },
  { id: "maple-leaf", window: "evening", rarity: "common", nameKo: "단풍잎" },
  { id: "cat-bell", window: "evening", rarity: "rare", nameKo: "고양이 방울" },
  { id: "cocoa", window: "evening", rarity: "rare", nameKo: "코코아" },
  { id: "sunset-cat", window: "evening", rarity: "special", nameKo: "노을 고양이" },

  { id: "star", window: "night", rarity: "common", nameKo: "별" },
  { id: "candle", window: "night", rarity: "common", nameKo: "작은 초" },
  { id: "firefly", window: "night", rarity: "common", nameKo: "반딧불" },
  { id: "moon", window: "night", rarity: "rare", nameKo: "달 조각" },
  { id: "letter", window: "night", rarity: "rare", nameKo: "밤 편지" },
  { id: "aurora", window: "night", rarity: "special", nameKo: "오로라 조각" },
] as const satisfies readonly PieceDef[];
export type PieceId = (typeof PIECES)[number]["id"];
export type Piece = (typeof PIECES)[number];

export const SLOTS = ["window", "wall", "shelf", "desk", "lighting", "floor"] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_KO: Record<Slot, string> = {
  window: "창문",
  wall: "벽",
  shelf: "선반",
  desk: "책상",
  lighting: "조명",
  floor: "바닥",
};

type ThemeDef = { id: string; nameKo: string; descriptionKo: string; recipe: Partial<Record<PieceId, number>> };

export const THEMES = [
  {
    id: "dawn-garden",
    nameKo: "새벽 정원",
    descriptionKo: "이슬 맺힌 화분과 하얀 커튼",
    recipe: { dew: 2, sunbeam: 2, sprout: 2, feather: 1, "pink-cloud": 1 },
  },
  {
    id: "sunny-cafe",
    nameKo: "햇살 카페",
    descriptionKo: "라떼 한 잔과 따뜻한 펜던트 조명",
    recipe: { cloud: 2, pencil: 1, "lemon-candy": 1, "sunset-glass": 2, "warm-light": 2, cocoa: 1 },
  },
  {
    id: "sunset-cat",
    nameKo: "노을 고양이",
    descriptionKo: "방석 위에서 잠든 고양이",
    recipe: { "sunset-glass": 2, "maple-leaf": 3, "warm-light": 1, "cat-bell": 1, "sunset-cat": 1 },
  },
  {
    id: "starry-library",
    nameKo: "별밤 도서관",
    descriptionKo: "촛불, 별 전구, 밤바다가 보이는 창",
    recipe: { star: 3, candle: 2, firefly: 2, moon: 1, letter: 1, aurora: 1, mug: 1 },
  },
] as const satisfies readonly ThemeDef[];
export type ThemeId = (typeof THEMES)[number]["id"];
export type Theme = (typeof THEMES)[number];

export type WindowView = "tower" | "garden" | "sea";
type ItemDef = { id: string; themeId: ThemeId; slot: Slot; nameKo: string; view?: WindowView };

export const ITEMS = [
  { id: "garden-window", themeId: "dawn-garden", slot: "window", nameKo: "정원 창", view: "garden" },
  { id: "garden-plants", themeId: "dawn-garden", slot: "shelf", nameKo: "화분 선반" },
  { id: "garden-rug", themeId: "dawn-garden", slot: "floor", nameKo: "민트 러그" },

  { id: "latte-cake", themeId: "sunny-cafe", slot: "desk", nameKo: "라떼와 케이크" },
  { id: "pendant-lamp", themeId: "sunny-cafe", slot: "lighting", nameKo: "펜던트 조명" },
  { id: "menu-board", themeId: "sunny-cafe", slot: "wall", nameKo: "카페 메뉴판" },

  { id: "cat-cushion", themeId: "sunset-cat", slot: "floor", nameKo: "잠든 고양이" },
  { id: "sunset-poster", themeId: "sunset-cat", slot: "wall", nameKo: "노을 포스터" },
  { id: "book-shelf", themeId: "sunset-cat", slot: "shelf", nameKo: "책과 선인장" },

  { id: "sea-window", themeId: "starry-library", slot: "window", nameKo: "밤바다 창", view: "sea" },
  { id: "star-garland", themeId: "starry-library", slot: "lighting", nameKo: "별 전구" },
  { id: "candle-books", themeId: "starry-library", slot: "desk", nameKo: "촛불과 책" },
  { id: "moon-clock", themeId: "starry-library", slot: "wall", nameKo: "달 시계" },
] as const satisfies readonly ItemDef[];
export type ItemId = (typeof ITEMS)[number]["id"];
export type Item = (typeof ITEMS)[number];

export const PIECE_BY_ID = Object.fromEntries(PIECES.map((p) => [p.id, p])) as Record<PieceId, Piece>;
export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<ThemeId, Theme>;
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<ItemId, Item>;
