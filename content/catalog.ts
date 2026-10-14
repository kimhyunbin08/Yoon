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

// One currency per time window (SPEC §2.4, D17). Piece ids equal window ids.
export const PIECES = [
  { id: "dawn", window: "dawn", nameKo: "새벽의 조각" },
  { id: "day", window: "day", nameKo: "낮의 조각" },
  { id: "evening", window: "evening", nameKo: "노을의 조각" },
  { id: "night", window: "night", nameKo: "밤의 조각" },
] as const satisfies readonly { id: TimeWindow; window: TimeWindow; nameKo: string }[];
export type PieceId = (typeof PIECES)[number]["id"];
export type Piece = (typeof PIECES)[number];

export const SLOTS = [
  "wallpaper",
  "windowCover",
  "windowView",
  "lighting",
  "deskLamp",
  "calendar",
  "wallDecor",
  "shelfObject",
  "desk",
  "deskObject1",
  "deskObject2",
  "plant",
  "floor",
] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_KO: Record<Slot, string> = {
  wallpaper: "벽지",
  windowCover: "창문 가림막",
  windowView: "창밖 풍경",
  lighting: "상단 전등",
  deskLamp: "책상 위 전등",
  calendar: "달력",
  wallDecor: "벽 장식",
  shelfObject: "선반 위",
  desk: "책상",
  deskObject1: "책상 위 1",
  deskObject2: "책상 위 2",
  plant: "화분",
  floor: "바닥",
};

type ThemeDef = { id: string; nameKo: string; descriptionKo: string; recipe: Partial<Record<PieceId, number>> };

export const THEMES = [
  {
    id: "dawn-garden",
    nameKo: "새벽 정원",
    descriptionKo: "이슬 맺힌 화분과 하얀 커튼",
    recipe: { dawn: 60, day: 20 },
  },
  {
    id: "sunny-cafe",
    nameKo: "햇살 카페",
    descriptionKo: "라떼 한 잔과 따뜻한 펜던트 조명",
    recipe: { day: 45, evening: 45 },
  },
  {
    id: "sunset-cat",
    nameKo: "노을 고양이",
    descriptionKo: "방석 위에서 잠든 고양이",
    recipe: { evening: 80 },
  },
  {
    id: "starry-library",
    nameKo: "별밤 도서관",
    descriptionKo: "촛불, 별 전구, 밤바다가 보이는 창",
    recipe: { night: 95, dawn: 10 },
  },
] as const satisfies readonly ThemeDef[];
export type ThemeId = (typeof THEMES)[number]["id"];
export type Theme = (typeof THEMES)[number];

export type WindowView = "hills" | "garden" | "sea" | "cafe" | "rooftops";
type ItemDef = { id: string; themeId: ThemeId; slot: Slot; nameKo: string; view?: WindowView };

// Each theme brings the 8–9 items that suit it, at most one per slot (SPEC §2.4).
// Ids are persisted in rooms: never rename. Dropped art is recoverable from commit ef7149e.
export const ITEMS = [
  { id: "garden-window", themeId: "dawn-garden", slot: "windowCover", nameKo: "하얀 커튼" },
  { id: "garden-view", themeId: "dawn-garden", slot: "windowView", nameKo: "정원 풍경", view: "garden" },
  { id: "paper-lantern", themeId: "dawn-garden", slot: "lighting", nameKo: "종이 등" },
  { id: "flower-calendar", themeId: "dawn-garden", slot: "calendar", nameKo: "꽃 달력" },
  { id: "garden-plants", themeId: "dawn-garden", slot: "shelfObject", nameKo: "화분 선반" },
  { id: "watering-can", themeId: "dawn-garden", slot: "deskObject1", nameKo: "물뿌리개" },
  { id: "flower-notebook", themeId: "dawn-garden", slot: "deskObject2", nameKo: "꽃잎 노트" },
  { id: "fern-pot", themeId: "dawn-garden", slot: "plant", nameKo: "고사리 화분" },
  { id: "garden-rug", themeId: "dawn-garden", slot: "floor", nameKo: "민트 러그" },

  { id: "cafe-curtain", themeId: "sunny-cafe", slot: "windowCover", nameKo: "카페 반커튼" },
  { id: "cafe-view", themeId: "sunny-cafe", slot: "windowView", nameKo: "카페 거리", view: "cafe" },
  { id: "pendant-lamp", themeId: "sunny-cafe", slot: "lighting", nameKo: "펜던트 조명" },
  { id: "banker-lamp", themeId: "sunny-cafe", slot: "deskLamp", nameKo: "뱅커스 램프" },
  { id: "tearoff-calendar", themeId: "sunny-cafe", slot: "calendar", nameKo: "일력" },
  { id: "menu-board", themeId: "sunny-cafe", slot: "wallDecor", nameKo: "카페 메뉴판" },
  { id: "coffee-jars", themeId: "sunny-cafe", slot: "shelfObject", nameKo: "원두 병" },
  { id: "cafe-table", themeId: "sunny-cafe", slot: "desk", nameKo: "카페 테이블" },
  { id: "latte-cake", themeId: "sunny-cafe", slot: "deskObject1", nameKo: "라떼와 케이크" },

  { id: "rooftop-view", themeId: "sunset-cat", slot: "windowView", nameKo: "지붕 풍경", view: "rooftops" },
  { id: "cat-lamp", themeId: "sunset-cat", slot: "deskLamp", nameKo: "고양이 귀 스탠드" },
  { id: "cat-calendar", themeId: "sunset-cat", slot: "calendar", nameKo: "고양이 달력" },
  { id: "sunset-poster", themeId: "sunset-cat", slot: "wallDecor", nameKo: "노을 포스터" },
  { id: "book-shelf", themeId: "sunset-cat", slot: "shelfObject", nameKo: "책과 선인장" },
  { id: "paw-desk", themeId: "sunset-cat", slot: "desk", nameKo: "발바닥 책상" },
  { id: "cat-grass", themeId: "sunset-cat", slot: "plant", nameKo: "캣그라스" },
  { id: "cat-cushion", themeId: "sunset-cat", slot: "floor", nameKo: "잠든 고양이" },

  { id: "star-wallpaper", themeId: "starry-library", slot: "wallpaper", nameKo: "별 벽지" },
  { id: "sea-window", themeId: "starry-library", slot: "windowCover", nameKo: "라벤더 커튼" },
  { id: "sea-view", themeId: "starry-library", slot: "windowView", nameKo: "밤바다", view: "sea" },
  { id: "star-garland", themeId: "starry-library", slot: "lighting", nameKo: "별 전구" },
  { id: "moon-clock", themeId: "starry-library", slot: "wallDecor", nameKo: "달 시계" },
  { id: "star-jars", themeId: "starry-library", slot: "shelfObject", nameKo: "별 유리병" },
  { id: "library-desk", themeId: "starry-library", slot: "desk", nameKo: "도서관 책상" },
  { id: "candle-books", themeId: "starry-library", slot: "deskObject1", nameKo: "촛불과 책" },
  { id: "floor-books", themeId: "starry-library", slot: "floor", nameKo: "책 더미" },

] as const satisfies readonly ItemDef[];
export type ItemId = (typeof ITEMS)[number]["id"];
export type Item = (typeof ITEMS)[number];

export const PIECE_BY_ID = Object.fromEntries(PIECES.map((p) => [p.id, p])) as Record<PieceId, Piece>;
export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<ThemeId, Theme>;
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<ItemId, Item>;
