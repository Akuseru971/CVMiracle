/*
 * Central content layer for the WMF Japan mobile experience.
 *
 * Content is reused from the official WMF Japan site (https://www.wmf.co.jp/,
 * https://shop.wmf.co.jp/shop/) and the WMF Germany reference
 * (https://www.wmf.com/de/en/). Category names follow the WMF Germany
 * "TASTE MATTERS" section, paired with the Japanese labels used on WMF Japan.
 *
 * Images are real WMF assets downloaded into /public/images
 * (category art + lifestyle from WMF Germany, product shots from the WMF
 * Fusiontec catalog, lifestyle from WMF Japan's CDN).
 *
 * TODO(prices): JPY prices below are representative WMF Japan Fusiontec Mineral
 * price points and should be confirmed against the live store
 * (https://shop.wmf.co.jp/shop/) before production launch — the storefront is
 * JS-rendered, so prices could not be crawled directly.
 */

export type Category = {
  id: string;
  name: string; // uppercase Latin (WMF Germany TASTE MATTERS)
  labelJa: string; // Japanese label (WMF Japan)
  subtitleJa: string;
  image: string;
  subcategories: string[];
};

export type BrowseItem = {
  id: string;
  labelJa: string;
  subtitleJa: string;
  image: string;
};

export type SeriesCollection = {
  id: string;
  name: string;
  subtitleJa: string;
  image: string;
  subcategories: string[];
};

export type LayerDetail = {
  id: string;
  kind: "category" | "series";
  nameLatin?: string;
  labelJa: string;
  subtitleJa: string;
  image: string;
  subcategories: string[];
};

export type ProductCategory =
  | "frypan"
  | "casserole"
  | "multipot"
  | "roaster"
  | "ricepot";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  badge?: string;
  sale?: boolean;
  oldPrice?: number;
  category?: ProductCategory;
  rank?: number;
};

export const bestSellerFilters: { id: "all" | ProductCategory; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "frypan", label: "フライパン" },
  { id: "casserole", label: "キャセロール" },
  { id: "multipot", label: "マルチポット" },
  { id: "roaster", label: "ロースター" },
  { id: "ricepot", label: "ライスポット" },
];

export const heroSlides = [
  {
    id: "hero-1",
    image: "/images/hero/hero-1.jpg",
    eyebrow: "WMF SINCE 1853",
    title: "毎日の料理を、もっと美しく。",
    subtitle: "WMF公式オンラインショップで、上質なキッチンウェアを。",
    primaryCta: "商品を見る",
    secondaryCta: "人気ランキングを見る",
  },
  {
    id: "hero-2",
    image: "/images/hero/hero-2.jpg",
    eyebrow: "MASTER SERIES",
    title: "ドイツの技術が、味を変える。",
    subtitle: "プロの現場から生まれた、確かな品質と佇まい。",
    primaryCta: "商品を見る",
    secondaryCta: "人気ランキングを見る",
  },
  {
    id: "hero-3",
    image: "/images/hero/hero-3.jpg",
    eyebrow: "FUSIONTEC PERFECTION",
    title: "天然鉱石から生まれた、上質。",
    subtitle: "美しさと機能を兼ね備えた、WMFのプレミアムシリーズ。",
    primaryCta: "シリーズを見る",
    secondaryCta: "人気ランキングを見る",
  },
];

export const categories: Category[] = [
  {
    id: "cutlery",
    name: "CUTLERY",
    labelJa: "カトラリー",
    subtitleJa: "際立った品質と使い心地の良さ",
    image: "/images/categories/cutlery.jpg",
    subcategories: [
      "カトラリーセット",
      "ディナーフォーク",
      "テーブルナイフ",
      "スプーン",
      "サービングカトラリー",
    ],
  },
  {
    id: "pots",
    name: "POTS",
    labelJa: "鍋",
    subtitleJa: "美しさと使いやすさを追求",
    image: "/images/categories/pots.jpg",
    subcategories: [
      "圧力鍋",
      "両手鍋",
      "片手鍋",
      "フュージョンテック ミネラル",
      "ステンレス鍋セット",
    ],
  },
  {
    id: "pans",
    name: "PANS",
    labelJa: "フライパン",
    subtitleJa: "毎日の料理に寄り添う一枚",
    image: "/images/categories/pans.jpg",
    subcategories: [
      "フライパン 20cm",
      "フライパン 24cm",
      "フライパン 28cm",
      "無水調理対応",
      "ノンスティック",
    ],
  },
  {
    id: "coffee",
    name: "COFFEE MACHINES",
    labelJa: "コーヒーマシン",
    subtitleJa: "一杯のために、ドイツの技術を",
    image: "/images/categories/coffee.jpg",
    subcategories: [
      "全自動コーヒーマシン",
      "ドリップマシン",
      "電気ケトル",
      "ミルクフォーマー",
    ],
  },
  {
    id: "knives",
    name: "KITCHEN KNIVES",
    labelJa: "ナイフ",
    subtitleJa: "鋭い切れ味、ドイツ最高レベルの品質",
    image: "/images/categories/knives.jpg",
    subcategories: [
      "シェフナイフ",
      "サントクナイフ",
      "ペティナイフ",
      "ナイフブロックセット",
      "包丁研ぎ",
    ],
  },
  {
    id: "appliances",
    name: "KITCHEN APPLIANCES",
    labelJa: "キッチン家電",
    subtitleJa: "効率と仕上がりを、両立する",
    image: "/images/categories/appliances.jpg",
    subcategories: [
      "トースター",
      "ブレンダー",
      "電気ケトル",
      "KITCHENminis",
      "ハンドブレンダー",
    ],
  },
  {
    id: "helpers",
    name: "KITCHEN HELPERS",
    labelJa: "キッチンツール",
    subtitleJa: "シンプルを究めた機能美",
    image: "/images/categories/helpers.jpg",
    subcategories: [
      "ターナー・お玉",
      "計量ツール",
      "ピーラー・おろし",
      "キッチンばさみ",
      "保存容器",
    ],
  },
];

/** Homepage category browse grid — inspired by two-column mobile category UX. */
export const browseCategories: BrowseItem[] = [
  {
    id: "pots",
    labelJa: "鍋",
    subtitleJa: "キャセロール・マルチポット",
    image: "/images/categories/pots.jpg",
  },
  {
    id: "pressure",
    labelJa: "圧力鍋",
    subtitleJa: "パーフェクトプラス・フュージョンテック",
    image: "/images/brand/perfection.jpg",
  },
  {
    id: "pans",
    labelJa: "フライパン",
    subtitleJa: "24cm・26cm・深型",
    image: "/images/categories/pans.jpg",
  },
  {
    id: "knives",
    labelJa: "包丁&ナイフ",
    subtitleJa: "三徳包丁・ナイフセット",
    image: "/images/categories/knives.jpg",
  },
  {
    id: "cutlery",
    labelJa: "カトラリー",
    subtitleJa: "スプーン・フォーク・セット",
    image: "/images/categories/cutlery.jpg",
  },
  {
    id: "helpers",
    labelJa: "キッチンツール",
    subtitleJa: "レードル・ターナー・ツールセット",
    image: "/images/categories/helpers.jpg",
  },
  {
    id: "drinkware",
    labelJa: "ドリンクウェア",
    subtitleJa: "タンブラー・ボトル",
    image: "/images/categories/coffee.jpg",
  },
  {
    id: "storage",
    labelJa: "保存容器",
    subtitleJa: "フードコンテナ・ガラス保存容器",
    image: "/images/products/product-4.jpg",
  },
  {
    id: "tableware",
    labelJa: "テーブルアクセサリー",
    subtitleJa: "サービング・テーブルウェア",
    image: "/images/lifestyle/jp-2.jpg",
  },
  {
    id: "accessories",
    labelJa: "アクセサリー",
    subtitleJa: "交換部品・消耗品",
    image: "/images/brand/iconic.jpg",
  },
];

/** WMF series / brand collections for the second browse tab. */
export const seriesCollections: SeriesCollection[] = [
  {
    id: "fusiontec-mineral",
    name: "Fusiontec Mineral",
    subtitleJa: "天然鉱石コーティングのフラッグシップ",
    image: "/images/brand/fusiontec.jpg",
    subcategories: ["フライパン", "キャセロール", "マルチポット", "ロースター", "ライスポット"],
  },
  {
    id: "perfect-plus",
    name: "Perfect Plus",
    subtitleJa: "圧力調理の定番シリーズ",
    image: "/images/brand/perfection.jpg",
    subcategories: ["圧力鍋 3L", "圧力鍋 4.5L", "圧力鍋 6L", "専用パーツ"],
  },
  {
    id: "profi-plus",
    name: "Profi Plus",
    subtitleJa: "プロ仕様のステンレス鍋",
    image: "/images/products/product-2.jpg",
    subcategories: ["ソースパン", "片手鍋", "両手鍋", "鍋セット"],
  },
  {
    id: "grand-gourmet",
    name: "Grand Gourmet",
    subtitleJa: "本格派ステンレスフライパン",
    image: "/images/products/product-10.jpg",
    subcategories: ["フライパン 24cm", "フライパン 28cm", "深型フライパン"],
  },
  {
    id: "cromargan",
    name: "Cromargan",
    subtitleJa: "WMF独自のステンレス鋼",
    image: "/images/brand/cromargan.jpg",
    subcategories: ["鍋", "フライパン", "カトラリー", "保存容器"],
  },
  {
    id: "function-4",
    name: "Function 4",
    subtitleJa: "4層構造の高機能フライパン",
    image: "/images/products/product-3.jpg",
    subcategories: ["フライパン 20cm", "フライパン 24cm", "フライパン 28cm"],
  },
  {
    id: "gourmet-plus",
    name: "Gourmet Plus",
    subtitleJa: "毎日使える上質な調理器具",
    image: "/images/products/product-5.jpg",
    subcategories: ["キャセロール", "ソースパン", "両手鍋"],
  },
  {
    id: "kineo",
    name: "Kineo",
    subtitleJa: "モダンなデザインの調理ツール",
    image: "/images/brand/damasteel.jpg",
    subcategories: ["ターナー", "お玉", "トング", "ツールセット"],
  },
  {
    id: "kult-x",
    name: "Kult X",
    subtitleJa: "洗練されたキッチンナイフ",
    image: "/images/categories/knives.jpg",
    subcategories: ["シェフナイフ", "三徳包丁", "ペティナイフ", "ナイフセット"],
  },
  {
    id: "lono",
    name: "Lono",
    subtitleJa: "上質なドリンク＆デザイン家電",
    image: "/images/categories/coffee.jpg",
    subcategories: ["電気ケトル", "トースター", "タンブラー", "ボトル"],
  },
];

const layerDetailsMap: Record<string, LayerDetail> = {
  pots: {
    id: "pots",
    kind: "category",
    nameLatin: "POTS",
    labelJa: "鍋",
    subtitleJa: "美しさと使いやすさを追求した、WMFの鍋シリーズ",
    image: "/images/categories/pots.jpg",
    subcategories: ["キャセロール", "マルチポット", "両手鍋", "片手鍋", "ソースパン", "ロースター"],
  },
  pressure: {
    id: "pressure",
    kind: "category",
    nameLatin: "PRESSURE COOKERS",
    labelJa: "圧力鍋",
    subtitleJa: "時短調理と本格仕上がりを両立する、WMFの圧力鍋",
    image: "/images/brand/perfection.jpg",
    subcategories: ["パーフェクトプラス", "フュージョンテック", "専用パーツ", "圧力鍋 3L", "圧力鍋 4.5L"],
  },
  pans: {
    id: "pans",
    kind: "category",
    nameLatin: "PANS",
    labelJa: "フライパン",
    subtitleJa: "毎日の料理に寄り添う、上質な一枚",
    image: "/images/categories/pans.jpg",
    subcategories: ["フライパン 20cm", "フライパン 24cm", "フライパン 26cm", "フライパン 28cm", "深型フライパン"],
  },
  knives: {
    id: "knives",
    kind: "category",
    nameLatin: "KITCHEN KNIVES",
    labelJa: "包丁&ナイフ",
    subtitleJa: "鋭い切れ味、ドイツ最高レベルの品質",
    image: "/images/categories/knives.jpg",
    subcategories: ["三徳包丁", "シェフナイフ", "ペティナイフ", "ナイフセット", "包丁研ぎ"],
  },
  cutlery: {
    id: "cutlery",
    kind: "category",
    nameLatin: "CUTLERY",
    labelJa: "カトラリー",
    subtitleJa: "際立った品質と使い心地の良さ",
    image: "/images/categories/cutlery.jpg",
    subcategories: ["カトラリーセット", "ディナーフォーク", "スプーン", "テーブルナイフ", "サービングカトラリー"],
  },
  helpers: {
    id: "helpers",
    kind: "category",
    nameLatin: "KITCHEN HELPERS",
    labelJa: "キッチンツール",
    subtitleJa: "シンプルを究めた機能美",
    image: "/images/categories/helpers.jpg",
    subcategories: ["レードル", "ターナー", "トング", "計量ツール", "ツールセット"],
  },
  drinkware: {
    id: "drinkware",
    kind: "category",
    nameLatin: "DRINKWARE",
    labelJa: "ドリンクウェア",
    subtitleJa: "日常に溶け込む、上質なドリンク体験",
    image: "/images/categories/coffee.jpg",
    subcategories: ["タンブラー", "ボトル", "マグ", "ワイングラス", "カラフェ"],
  },
  storage: {
    id: "storage",
    kind: "category",
    nameLatin: "FOOD STORAGE",
    labelJa: "保存容器",
    subtitleJa: "鮮度を保ち、キッチンを美しく整える",
    image: "/images/products/product-4.jpg",
    subcategories: ["フードコンテナ", "ガラス保存容器", "ステンレス保存容器", "ランチボックス"],
  },
  tableware: {
    id: "tableware",
    kind: "category",
    nameLatin: "TABLE ACCESSORIES",
    labelJa: "テーブルアクセサリー",
    subtitleJa: "食卓を彩る、上質なサービング",
    image: "/images/lifestyle/jp-2.jpg",
    subcategories: ["サービングボウル", "プレート", "トレー", "テーブルウェアセット"],
  },
  accessories: {
    id: "accessories",
    kind: "category",
    nameLatin: "ACCESSORIES",
    labelJa: "アクセサリー",
    subtitleJa: "長く愛用するための交換部品と消耗品",
    image: "/images/brand/iconic.jpg",
    subcategories: ["交換部品", "消耗品", "専用パーツ", "お手入れ用品"],
  },
  coffee: {
    id: "coffee",
    kind: "category",
    nameLatin: "COFFEE MACHINES",
    labelJa: "コーヒーマシン",
    subtitleJa: "一杯のために、ドイツの技術を",
    image: "/images/categories/coffee.jpg",
    subcategories: ["全自動コーヒーマシン", "ドリップマシン", "電気ケトル", "ミルクフォーマー"],
  },
  appliances: {
    id: "appliances",
    kind: "category",
    nameLatin: "KITCHEN APPLIANCES",
    labelJa: "キッチン家電",
    subtitleJa: "効率と仕上がりを、両立する",
    image: "/images/categories/appliances.jpg",
    subcategories: ["トースター", "ブレンダー", "電気ケトル", "KITCHENminis", "ハンドブレンダー"],
  },
};

seriesCollections.forEach((series) => {
  layerDetailsMap[series.id] = {
    id: series.id,
    kind: "series",
    nameLatin: series.name.toUpperCase(),
    labelJa: series.name,
    subtitleJa: series.subtitleJa,
    image: series.image,
    subcategories: series.subcategories,
  };
});

export function getLayerDetail(id: string): LayerDetail | undefined {
  const mapped = layerDetailsMap[id];
  if (mapped) return mapped;

  const fromCategories = categories.find((c) => c.id === id);
  if (!fromCategories) return undefined;

  return {
    id: fromCategories.id,
    kind: "category",
    nameLatin: fromCategories.name,
    labelJa: fromCategories.labelJa,
    subtitleJa: fromCategories.subtitleJa,
    image: fromCategories.image,
    subcategories: fromCategories.subcategories,
  };
}

// Best sellers — product names are the real WMF Japan ranking
// (集計期間 2026年5月1日〜5月31日, shop.wmf.co.jp).
export const bestSellers: Product[] = [
  {
    id: "bs-1",
    name: "フュージョンテック ミネラル マルチポット 14cm PL",
    price: 16500,
    image: "/images/products/product-1.jpg",
    badge: "人気商品",
    category: "multipot",
    rank: 1,
  },
  {
    id: "bs-2",
    name: "フュージョンテック ミネラル ロースター 24cm PL",
    price: 29700,
    image: "/images/products/product-2.jpg",
    badge: "公式ショップ限定",
    category: "roaster",
    rank: 2,
  },
  {
    id: "bs-3",
    name: "フュージョンテック ミネラル フライパン 24cm PL",
    price: 19800,
    image: "/images/products/product-3.jpg",
    badge: "人気商品",
    category: "frypan",
    rank: 3,
  },
  {
    id: "bs-4",
    name: "フュージョンテック ミネラル マルチポット 14cm MQ",
    price: 16500,
    image: "/images/products/product-4.jpg",
    badge: "人気商品",
    category: "multipot",
    rank: 4,
  },
  {
    id: "bs-5",
    name: "フュージョンテック ミネラル ローキャセロール 20cm PL",
    price: 23100,
    image: "/images/products/product-5.jpg",
    category: "casserole",
    rank: 5,
  },
  {
    id: "bs-6",
    name: "フュージョンテック ミネラル ライスポット 20cm PL",
    price: 24200,
    image: "/images/products/product-6.jpg",
    badge: "公式ショップ限定",
    category: "ricepot",
    rank: 6,
  },
  {
    id: "bs-7",
    name: "フュージョンテック ミネラル ハイキャセロール 24cm PL",
    price: 27500,
    image: "/images/products/product-7.jpg",
    category: "casserole",
    rank: 7,
  },
  {
    id: "bs-8",
    name: "フュージョンテック ミネラル ハイキャセロール 16cm PL",
    price: 20900,
    image: "/images/products/product-8.jpg",
    category: "casserole",
    rank: 8,
  },
];

export const newArrivals: Product[] = [
  {
    id: "na-1",
    name: "フュージョンテック ミネラル ソースパン 18cm",
    price: 18700,
    image: "/images/products/product-9.jpg",
    badge: "新商品",
  },
  {
    id: "na-2",
    name: "WMF プロフィセレクト プラス フライパン 28cm",
    price: 14300,
    image: "/images/products/product-10.jpg",
    badge: "新商品",
  },
  {
    id: "na-3",
    name: "フュージョンテック ミネラル ハイキャセロール 20cm MQ",
    price: 24200,
    image: "/images/products/product-1.jpg",
    badge: "新商品",
  },
  {
    id: "na-4",
    name: "WMF グランドゴア フライパン 24cm",
    price: 12100,
    image: "/images/products/product-3.jpg",
    badge: "新商品",
  },
];

export const featureSlides = [
  {
    id: "feat-1",
    image: "/images/brand/fusiontec.jpg",
    eyebrow: "FUSIONTEC MINERAL",
    title: "天然鉱石から生まれた、上質。",
    body: "美しさ、耐久性、使いやすさを兼ね備えたWMFを代表するプレミアムシリーズ。",
    cta: "シリーズを見る",
  },
  {
    id: "feat-2",
    image: "/images/brand/perfection.jpg",
    eyebrow: "PERFECT PLUS",
    title: "圧力調理の定番シリーズ",
    body: "時短調理と本格仕上がりを両立。毎日のキッチンを支える、WMFの圧力鍋。",
    cta: "商品を見る",
  },
  {
    id: "feat-3",
    image: "/images/brand/cromargan.jpg",
    eyebrow: "CROMArgAN",
    title: "WMF独自のステンレス鋼",
    body: "ドイツの技術が生み出す、美しい光沢と優れた耐久性。",
    cta: "コレクションを見る",
  },
  {
    id: "feat-4",
    image: "/images/lifestyle/jp-1.jpg",
    eyebrow: "SINCE 1853",
    title: "1853年より続く、ドイツNo.1",
    body: "キッチン＆テーブルウェアブランドとして、上質な道具を届け続けています。",
    cta: "ブランドストーリー",
  },
];

export const services = [
  {
    id: "svc-1",
    title: "メーカー公式ショップ",
    body: "公式ならではの豊富な品揃えと安心の品質保証。",
  },
  {
    id: "svc-2",
    title: "無料ギフトサービス",
    body: "ラッピング・メッセージカードを無料でご用意します。",
  },
  {
    id: "svc-3",
    title: "会員限定クーポン",
    body: "会員様優待セールやお誕生月クーポンをお届け。",
  },
  {
    id: "svc-4",
    title: "あんしんの保証",
    body: "公式ショップ購入品は保証対象。長く愛用いただけます。",
  },
];

export const recipes = [
  {
    id: "rcp-1",
    title: "無水調理で引き出す、野菜の甘み",
    tag: "RECIPE",
    image: "/images/lifestyle/jp-1.jpg",
  },
  {
    id: "rcp-2",
    title: "フュージョンテックで作る、週末の煮込み",
    tag: "INSPIRATION",
    image: "/images/lifestyle/jp-2.jpg",
  },
  {
    id: "rcp-3",
    title: "圧力鍋で時短、平日の本格ごはん",
    tag: "RECIPE",
    image: "/images/lifestyle/jp-3.jpg",
  },
];

export const news = [
  {
    id: "news-1",
    date: "2026.06.01",
    category: "CAMPAIGN",
    title: "プレミアムセールを開始しました。対象商品を特別価格でご提供。",
  },
  {
    id: "news-2",
    date: "2026.05.20",
    category: "NEW",
    title: "フュージョンテック ミネラル 新サイズが登場しました。",
  },
  {
    id: "news-3",
    date: "2026.05.10",
    category: "INFO",
    title: "会員様限定クーポンの配布を開始しました。マイページをご確認ください。",
  },
  {
    id: "news-4",
    date: "2026.04.28",
    category: "INFO",
    title: "ゴールデンウィーク期間中の出荷についてのお知らせ。",
  },
];

export const searchSuggestions = {
  recent: ["フュージョンテック ミネラル", "カトラリーセット", "ナイフ"],
  ranking: [
    "フュージョンテック ミネラル",
    "圧力鍋",
    "フライパン 24cm",
    "シェフナイフ",
    "カトラリーセット",
  ],
};

export const footerSections = [
  {
    id: "ft-1",
    title: "商品カテゴリー",
    links: ["フライパン", "鍋・圧力鍋", "ナイフ", "カトラリー", "キッチン家電", "ギフト"],
  },
  {
    id: "ft-2",
    title: "ご利用ガイド",
    links: ["ご注文方法", "お支払いについて", "配送について", "返品・交換", "会員サービス"],
  },
  {
    id: "ft-3",
    title: "お問い合わせ",
    links: ["カスタマーサポート", "よくあるご質問", "店舗案内", "修理について"],
  },
  {
    id: "ft-4",
    title: "公式サイト",
    links: ["WMFについて", "ブランドストーリー", "ニュース", "採用情報"],
  },
];

const layerProductKeywords: Record<string, string[]> = {
  pots: ["ポット", "キャセロール", "ロースター", "ライス"],
  pressure: ["圧力", "パーフェクト"],
  pans: ["フライパン"],
  knives: ["ナイフ", "包丁"],
  cutlery: ["カトラリー"],
  helpers: ["ツール", "ターナー"],
  drinkware: ["ケトル", "タンブラー", "ボトル"],
  storage: ["コンテナ", "保存"],
  tableware: ["サービング", "プレート"],
  accessories: ["パーツ", "部品"],
  "fusiontec-mineral": ["フュージョンテック"],
  "perfect-plus": ["パーフェクト", "圧力"],
  "profi-plus": ["プロフィ"],
  "grand-gourmet": ["グランドゴア"],
  cromargan: ["Cromargan", "クロマーガン"],
  "function-4": ["Function"],
  "gourmet-plus": ["Gourmet"],
  kineo: ["Kineo"],
  "kult-x": ["Kult", "ナイフ", "包丁"],
  lono: ["Lono", "ケトル"],
};

export function getBestSellersForLayer(id: string): Product[] {
  const keywords = layerProductKeywords[id];
  if (!keywords?.length) return bestSellers.slice(0, 4);

  const matched = bestSellers.filter((product) =>
    keywords.some((keyword) => product.name.includes(keyword)),
  );

  return (matched.length > 0 ? matched : bestSellers).slice(0, 4);
}
