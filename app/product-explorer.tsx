"use client";
import { useState } from "react";

type Item = { content_id?: string; title?: string; affiliateURL?: string; date?: string; prices?: { price?: string }; iteminfo?: { genre?: Array<{ name?: string }> } };

export function ProductExplorer() {
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("検索語を入力すると、公式APIの情報を安全に取得します。");
  async function search(event: React.FormEvent) {
    event.preventDefault(); setMessage("検索中…");
    try { const response = await fetch(`/api/items?keyword=${encodeURIComponent(keyword)}&hits=9`); const data = await response.json(); if (!response.ok) throw new Error(); setItems(data.items ?? []); setMessage(`${data.totalCount ?? 0}件から表示。取得：${new Date(data.fetchedAt).toLocaleString("ja-JP")}`); }
    catch { setItems([]); setMessage("公式情報を取得できませんでした。時間を置いてお試しください。"); }
  }
  return <section className="explorer section" id="products"><div className="sectionHead"><p className="eyebrow">OFFICIAL API SEARCH</p><h2>公式情報から探す</h2><p>画像に頼らず、タイトル・価格・ジャンル・更新日時で比較。</p></div><form className="searchForm" onSubmit={search}><label>キーワード<input value={keyword} onChange={e => setKeyword(e.target.value)} maxLength={80} placeholder="作品名・ジャンル" /></label><button>公式APIを検索</button></form><p aria-live="polite" className="searchStatus">{message}</p><div className="productGrid">{items.map((item, index) => <article key={item.content_id ?? index}><span>公式データ</span><h3>{item.title ?? "タイトル情報なし"}</h3><p>{item.iteminfo?.genre?.slice(0, 3).map(g => g.name).filter(Boolean).join(" / ") || "ジャンル未設定"}</p><dl><div><dt>価格</dt><dd>{item.prices?.price ?? "公式で確認"}</dd></div><div><dt>公開日</dt><dd>{item.date ?? "―"}</dd></div></dl>{item.affiliateURL && <a href={item.affiliateURL} rel="sponsored nofollow noopener" target="_blank">公式ページで確認 →</a>}</article>)}</div><p className="affiliate">PR・広告を含みます。価格・配信状況はリンク先で必ず再確認してください。API情報と編集部評価、UGCは混同しません。</p></section>;
}
