import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { providerItems, reviews } from "../../../../db/schema";
import { providers } from "../../../../lib/providers";
import { UgcForm } from "../../../ugc-form";

const providerNames = new Map(providers.map(p => [p.id, p.name]));

async function findItem(providerId: string, providerItemId: string) {
  try {
    const db = getDb();
    const rows = await db.select().from(providerItems)
      .where(and(eq(providerItems.providerId, providerId), eq(providerItems.providerItemId, providerItemId)))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function findApprovedReviews(productId: string) {
  try {
    const db = getDb();
    return await db.select().from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")))
      .orderBy(desc(reviews.createdAt))
      .limit(30);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ provider: string; id: string }> }): Promise<Metadata> {
  const { provider, id } = await params;
  const item = await findItem(provider, id);
  if (!item) return { title: "見つかりませんでした" };
  const providerName = providerNames.get(item.providerId) ?? item.providerId;
  return {
    title: item.title,
    description: `${providerName}で確認できる「${item.title}」の公式情報と審査済みレビュー。価格・配信状況・出典を明示して比較します。`,
    alternates: { canonical: `/items/${item.providerId}/${item.providerItemId}` },
    robots: { index: item.available, follow: true },
  };
}

export default async function ItemPage({ params }: { params: Promise<{ provider: string; id: string }> }) {
  const { provider, id } = await params;
  const item = await findItem(provider, id);
  if (!item) notFound();

  const productId = `${item.providerId}:${item.providerItemId}`;
  const approvedReviews = await findApprovedReviews(productId);
  const providerName = providerNames.get(item.providerId) ?? item.providerId;
  const base = process.env.SITE_URL ?? "https://fanza-sdk.example.com";
  const canonicalUrl = `${base}/items/${item.providerId}/${item.providerItemId}`;
  const averageRating = approvedReviews.length
    ? Math.round((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length) * 10) / 10
    : null;

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.title,
    url: canonicalUrl,
    ...(item.maker ? { brand: { "@type": "Brand", name: item.maker } } : {}),
    ...(item.catalogNumber ? { sku: item.catalogNumber } : {}),
    offers: {
      "@type": "Offer",
      url: item.affiliateUrl,
      priceCurrency: "JPY",
      ...(item.price ? { price: item.price } : {}),
      availability: item.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: providerName },
    },
    ...(averageRating !== null ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: averageRating, reviewCount: approvedReviews.length },
    } : {}),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
    <nav className="policyNav"><a href="/">トップ</a><a href="/#products">API検索へ戻る</a><a href="/providers">対応ASP一覧</a></nav>
    <article className="itemShell">
      <p className="eyebrow">{providerName}｜{item.sourceType.toUpperCase()}</p>
      <h1>{item.title}</h1>
      <p className="ageNotice">18歳未満の方はご利用いただけません。本ページはテキスト情報のみで構成しています。</p>
      <dl className="itemFacts">
        <div><dt>提供元</dt><dd>{providerName}</dd></div>
        {item.maker && <div><dt>メーカー</dt><dd>{item.maker}</dd></div>}
        {item.catalogNumber && <div><dt>品番</dt><dd>{item.catalogNumber}</dd></div>}
        <div><dt>価格</dt><dd>{item.price ? `${item.price.toLocaleString("ja-JP")}円` : "公式で確認"}</dd></div>
        <div><dt>配信状況</dt><dd>{item.available ? "配信中" : "配信終了・要確認"}</dd></div>
        <div><dt>情報取得</dt><dd>{item.fetchedAt.toLocaleString("ja-JP")}</dd></div>
      </dl>
      <a className="primary" href={item.affiliateUrl} rel="sponsored nofollow noopener" target="_blank">{providerName}の公式ページで確認 →</a>
      <p className="affiliate">PR・広告を含みます。価格・配信状況・詳細は必ずリンク先の公式ページでご確認ください。</p>

      <section className="itemReviews" aria-labelledby="item-reviews-title">
        <h2 id="item-reviews-title">審査済みレビュー{approvedReviews.length > 0 && `（${approvedReviews.length}件・平均${averageRating}）`}</h2>
        {approvedReviews.length === 0
          ? <p className="noReviews">まだ審査を通過したレビューがありません。</p>
          : <ul className="reviewList">{approvedReviews.map(review => <li key={review.id}><div><b>{review.helpfulAxis}</b><span>満足度 {review.rating}</span></div><p>{review.body}</p></li>)}</ul>}
        <UgcForm productId={productId} />
      </section>
    </article>
  </>;
}
