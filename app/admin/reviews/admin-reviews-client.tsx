"use client";
import { useState } from "react";

type PendingReview = { id: number; productId: string; body: string; rating: number; helpfulAxis: string; createdAt: string };

export function AdminReviewsClient() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [items, setItems] = useState<PendingReview[]>([]);
  const [message, setMessage] = useState("");

  async function load(currentSecret: string) {
    setMessage("読み込み中…");
    const response = await fetch("/api/admin/reviews", { headers: { "x-admin-secret": currentSecret } });
    if (!response.ok) { setMessage("認証に失敗しました。"); setUnlocked(false); return; }
    const data = await response.json() as { reviews: PendingReview[] };
    setItems(data.reviews);
    setUnlocked(true);
    setMessage(data.reviews.length ? "" : "審査待ちのレビューはありません。");
  }

  async function moderate(id: number, action: "approve" | "reject") {
    const response = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ id, action }),
    });
    if (response.ok) setItems(current => current.filter(item => item.id !== id));
    else setMessage("更新に失敗しました。");
  }

  if (!unlocked) {
    return <main className="adminGate">
      <h1>レビュー審査</h1>
      <form onSubmit={e => { e.preventDefault(); load(secret); }}>
        <label>管理シークレット<input type="password" value={secret} onChange={e => setSecret(e.target.value)} autoComplete="off" /></label>
        <button type="submit">開く</button>
      </form>
      <p aria-live="polite">{message}</p>
    </main>;
  }

  return <main className="adminReviews">
    <h1>レビュー審査（{items.length}件）</h1>
    <p aria-live="polite">{message}</p>
    <ul>
      {items.map(item => <li key={item.id}>
        <div className="meta"><span>{item.productId}</span><span>{item.helpfulAxis}・満足度{item.rating}</span><span>{new Date(item.createdAt).toLocaleString("ja-JP")}</span></div>
        <p>{item.body}</p>
        <div className="actions">
          <button type="button" onClick={() => moderate(item.id, "approve")}>承認</button>
          <button type="button" onClick={() => moderate(item.id, "reject")}>却下</button>
        </div>
      </li>)}
    </ul>
  </main>;
}
