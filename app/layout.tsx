import type { Metadata } from "next";
import { Noto_Sans_JP, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import "./recommend.css";
import "./taste.css";
import "./system.css";

const sans = Noto_Sans_JP({ variable: "--font-sans", subsets: ["latin"] });
const serif = Shippori_Mincho({ variable: "--font-serif", weight: ["600", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://hikakulab.jp"),
  title: { default: "比較LAB", template: "%s｜比較LAB" },
  description: "出典と評価軸がわかる、成人向け作品の横断比較・発見ガイド。",
  robots: { index: true, follow: true },
  openGraph: { type: "website", locale: "ja_JP", siteName: "比較LAB" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
