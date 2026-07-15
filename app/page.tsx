import type { Metadata } from "next";
import { SiteClient } from "./site-client";

export const metadata: Metadata = {
  title: "FANZA GUIDE LAB｜作品選びを、透明に。",
  description: "DMM Affiliate API v3を活用する比較・発見メディア。評価軸、出典、広告関係を明示し、審査済みUGCで納得できる作品選びを支援します。",
  alternates: { canonical: "/" },
};

const siteUrl = process.env.SITE_URL ?? "https://fanza-sdk.example.com";
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: "FANZA GUIDE LAB", url: siteUrl, inLanguage: "ja-JP" },
    { "@type": "Organization", name: "FANZA GUIDE LAB 編集部", url: siteUrl },
    { "@type": "FAQPage", mainEntity: [
      { "@type": "Question", name: "ランキングはどのように作成していますか？", acceptedAnswer: { "@type": "Answer", text: "公式APIの公開情報、情報の鮮度、価格、ユーザーの審査済み評価を分離して表示し、広告報酬だけで順位を決めません。" } },
      { "@type": "Question", name: "口コミはすべて掲載されますか？", acceptedAnswer: { "@type": "Answer", text: "いいえ。個人情報、誹謗中傷、権利侵害、スパム、具体的すぎる性的表現を含む投稿は公開しません。" } }
    ] }
  ]
};

export default function Home() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /><SiteClient /></>;
}
