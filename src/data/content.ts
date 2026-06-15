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

export const campaignSlides = [
  {
    id: "cmp-1",
    image: "/images/campaign/kitchenminis.jpg",
    eyebrow: "PREMIUM SALE",
    title: "プレミアムセール開催中",
    body: "対象商品が今だけ特別価格。公式ショップ限定の特典をお見逃しなく。",
    cta: "セールを見る",
    sale: true,
  },
  {
    id: "cmp-2",
    image: "/images/campaign/flavour.png",
    eyebrow: "GIFT SELECTION",
    title: "無料ギフトサービス",
    body: "メッセージカードや包装を無料でご用意。大切な方への贈り物に。",
    cta: "ギフトを見る",
  },
  {
    id: "cmp-3",
    image: "/images/campaign/castiron.png",
    eyebrow: "FUSIONTEC MINERAL",
    title: "天然鉱石から生まれた素材",
    body: "美しさ、耐久性、使いやすさを兼ね備えたWMFを代表するシリーズ。",
    cta: "シリーズを見る",
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
  keywords: ["フライパン", "圧力鍋", "ギフト", "新商品", "20cm", "無水調理"],
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
