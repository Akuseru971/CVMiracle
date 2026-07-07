import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WMF 公式オンラインショップ | ドイツの上質なキッチンウェア",
  description:
    "WMF（ヴェーエムエフ）公式オンラインショップ。1853年から続くドイツNo.1キッチン＆テーブルウェアブランド。フライパン、圧力鍋、ナイフ、カトラリーなど上質な製品をお届けします。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${cormorant.variable}`}>
      <body className={`${notoSansJP.className} antialiased`}>{children}</body>
    </html>
  );
}
