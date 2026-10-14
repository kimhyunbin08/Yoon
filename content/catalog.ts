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

export const SLOTS = [
  "wallpaper",
  "windowCover",
  "windowView",
  "lighting",
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
  lighting: "전등",
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
    recipe: { dew: 30, sunbeam: 25, sprout: 30, feather: 10, "pink-cloud": 10 },
  },
  {
    id: "sunny-cafe",
    nameKo: "햇살 카페",
    descriptionKo: "라떼 한 잔과 따뜻한 펜던트 조명",
    recipe: { cloud: 30, pencil: 20, "lemon-candy": 10, "sunset-glass": 25, "warm-light": 25, cocoa: 10 },
  },
  {
    id: "sunset-cat",
    nameKo: "노을 고양이",
    descriptionKo: "방석 위에서 잠든 고양이",
    recipe: { "sunset-glass": 30, "maple-leaf": 40, "warm-light": 20, "cat-bell": 10, "sunset-cat": 5 },
  },
  {
    id: "starry-library",
    nameKo: "별밤 도서관",
    descriptionKo: "촛불, 별 전구, 밤바다가 보이는 창",
    recipe: { star: 40, candle: 30, firefly: 30, moon: 10, letter: 10, aurora: 5, mug: 15 },
  },
  {
    id: "neon-glitch",
    nameKo: "네온 글리치",
    descriptionKo: "CRT 화면과 네온 간판, 지지직거리는 밤",
    recipe: { star: 30, firefly: 30, "warm-light": 25, "sunset-glass": 15, letter: 10, aurora: 5 },
  },
] as const satisfies readonly ThemeDef[];
export type ThemeId = (typeof THEMES)[number]["id"];
export type Theme = (typeof THEMES)[number];

export type WindowView = "hills" | "garden" | "sea" | "city" | "cafe" | "rooftops";
type ItemDef = { id: string; themeId: ThemeId; slot: Slot; nameKo: string; view?: WindowView };

// One item per slot per theme (SPEC §2.4). Ids of the first 18 items predate v5 and must not change.
export const ITEMS = [
  { id: "garden-wallpaper", themeId: "dawn-garden", slot: "wallpaper", nameKo: "잎사귀 벽지" },
  { id: "garden-window", themeId: "dawn-garden", slot: "windowCover", nameKo: "하얀 커튼" },
  { id: "garden-view", themeId: "dawn-garden", slot: "windowView", nameKo: "정원 풍경", view: "garden" },
  { id: "paper-lantern", themeId: "dawn-garden", slot: "lighting", nameKo: "종이 등" },
  { id: "flower-calendar", themeId: "dawn-garden", slot: "calendar", nameKo: "꽃 달력" },
  { id: "leaf-frame", themeId: "dawn-garden", slot: "wallDecor", nameKo: "잎사귀 액자" },
  { id: "garden-plants", themeId: "dawn-garden", slot: "shelfObject", nameKo: "화분 선반" },
  { id: "trestle-desk", themeId: "dawn-garden", slot: "desk", nameKo: "나무 다리 책상" },
  { id: "watering-can", themeId: "dawn-garden", slot: "deskObject1", nameKo: "물뿌리개" },
  { id: "flower-notebook", themeId: "dawn-garden", slot: "deskObject2", nameKo: "꽃잎 노트" },
  { id: "fern-pot", themeId: "dawn-garden", slot: "plant", nameKo: "고사리 화분" },
  { id: "garden-rug", themeId: "dawn-garden", slot: "floor", nameKo: "민트 러그" },

  { id: "cafe-wallpaper", themeId: "sunny-cafe", slot: "wallpaper", nameKo: "줄무늬 벽지" },
  { id: "cafe-curtain", themeId: "sunny-cafe", slot: "windowCover", nameKo: "카페 반커튼" },
  { id: "cafe-view", themeId: "sunny-cafe", slot: "windowView", nameKo: "카페 거리", view: "cafe" },
  { id: "pendant-lamp", themeId: "sunny-cafe", slot: "lighting", nameKo: "펜던트 조명" },
  { id: "tearoff-calendar", themeId: "sunny-cafe", slot: "calendar", nameKo: "일력" },
  { id: "menu-board", themeId: "sunny-cafe", slot: "wallDecor", nameKo: "카페 메뉴판" },
  { id: "coffee-jars", themeId: "sunny-cafe", slot: "shelfObject", nameKo: "원두 병" },
  { id: "cafe-table", themeId: "sunny-cafe", slot: "desk", nameKo: "카페 테이블" },
  { id: "latte-cake", themeId: "sunny-cafe", slot: "deskObject1", nameKo: "라떼와 케이크" },
  { id: "moka-pot", themeId: "sunny-cafe", slot: "deskObject2", nameKo: "모카 포트" },
  { id: "olive-tree", themeId: "sunny-cafe", slot: "plant", nameKo: "올리브 나무" },
  { id: "checker-rug", themeId: "sunny-cafe", slot: "floor", nameKo: "체크 러그" },

  { id: "dot-wallpaper", themeId: "sunset-cat", slot: "wallpaper", nameKo: "땡땡이 벽지" },
  { id: "roller-shade", themeId: "sunset-cat", slot: "windowCover", nameKo: "롤 블라인드" },
  { id: "rooftop-view", themeId: "sunset-cat", slot: "windowView", nameKo: "지붕 풍경", view: "rooftops" },
  { id: "wall-sconce", themeId: "sunset-cat", slot: "lighting", nameKo: "벽등" },
  { id: "cat-calendar", themeId: "sunset-cat", slot: "calendar", nameKo: "고양이 달력" },
  { id: "sunset-poster", themeId: "sunset-cat", slot: "wallDecor", nameKo: "노을 포스터" },
  { id: "book-shelf", themeId: "sunset-cat", slot: "shelfObject", nameKo: "책과 선인장" },
  { id: "paw-desk", themeId: "sunset-cat", slot: "desk", nameKo: "발바닥 책상" },
  { id: "yarn-basket", themeId: "sunset-cat", slot: "deskObject1", nameKo: "털실 바구니" },
  { id: "fish-mug", themeId: "sunset-cat", slot: "deskObject2", nameKo: "물고기 머그" },
  { id: "cat-grass", themeId: "sunset-cat", slot: "plant", nameKo: "캣그라스" },
  { id: "cat-cushion", themeId: "sunset-cat", slot: "floor", nameKo: "잠든 고양이" },

  { id: "star-wallpaper", themeId: "starry-library", slot: "wallpaper", nameKo: "별 벽지" },
  { id: "sea-window", themeId: "starry-library", slot: "windowCover", nameKo: "라벤더 커튼" },
  { id: "sea-view", themeId: "starry-library", slot: "windowView", nameKo: "밤바다", view: "sea" },
  { id: "star-garland", themeId: "starry-library", slot: "lighting", nameKo: "별 전구" },
  { id: "moon-calendar", themeId: "starry-library", slot: "calendar", nameKo: "달 위상 달력" },
  { id: "moon-clock", themeId: "starry-library", slot: "wallDecor", nameKo: "달 시계" },
  { id: "star-jars", themeId: "starry-library", slot: "shelfObject", nameKo: "별 유리병" },
  { id: "library-desk", themeId: "starry-library", slot: "desk", nameKo: "도서관 책상" },
  { id: "candle-books", themeId: "starry-library", slot: "deskObject1", nameKo: "촛불과 책" },
  { id: "hourglass", themeId: "starry-library", slot: "deskObject2", nameKo: "모래시계" },
  { id: "tall-cactus", themeId: "starry-library", slot: "plant", nameKo: "기둥 선인장" },
  { id: "floor-books", themeId: "starry-library", slot: "floor", nameKo: "책 더미" },

  { id: "neon-wallpaper", themeId: "neon-glitch", slot: "wallpaper", nameKo: "네온 벽지" },
  { id: "city-window", themeId: "neon-glitch", slot: "windowCover", nameKo: "블라인드" },
  { id: "city-view", themeId: "neon-glitch", slot: "windowView", nameKo: "도시 야경", view: "city" },
  { id: "neon-tube", themeId: "neon-glitch", slot: "lighting", nameKo: "네온 막대" },
  { id: "led-calendar", themeId: "neon-glitch", slot: "calendar", nameKo: "LED 달력" },
  { id: "neon-sign", themeId: "neon-glitch", slot: "wallDecor", nameKo: "네온 간판" },
  { id: "boombox", themeId: "neon-glitch", slot: "shelfObject", nameKo: "붐박스와 카세트" },
  { id: "neon-desk", themeId: "neon-glitch", slot: "desk", nameKo: "LED 책상" },
  { id: "crt-monitor", themeId: "neon-glitch", slot: "deskObject1", nameKo: "CRT 모니터" },
  { id: "retro-keyboard", themeId: "neon-glitch", slot: "deskObject2", nameKo: "레트로 키보드" },
  { id: "neon-cactus", themeId: "neon-glitch", slot: "plant", nameKo: "네온 선인장" },
  { id: "neon-rug", themeId: "neon-glitch", slot: "floor", nameKo: "네온 격자 러그" },
] as const satisfies readonly ItemDef[];
export type ItemId = (typeof ITEMS)[number]["id"];
export type Item = (typeof ITEMS)[number];

export const PIECE_BY_ID = Object.fromEntries(PIECES.map((p) => [p.id, p])) as Record<PieceId, Piece>;
export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<ThemeId, Theme>;
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<ItemId, Item>;
