import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { providerItems, reviews } from "../../../../db/schema";
import { providers } from "../../../../lib/providers";
import { catalogItemFromRow, duplicateKey, groupDuplicates, pickPrimary, type CatalogItem } from "../../../../lib/normalize";
import { UgcForm } from "../../../ugc-form";

const providerNames = new Map(providers.map(p => [p.id, p.name]));

async function findComparisonGroup(providerId: string, providerItemId: string): Promise<CatalogItem[] | null> {
  try {
    const db = getDb();
    const target = await db.select().from(providerItems)
      .where(and(eq(providerItems.providerId, providerId), eq(providerItems.providerItemId, providerItemId)))
      .limit(1);
    if (!target[0]) return null;
    const targetItem = catalogItemFromRow(target[0]);

    // Every available row is pulled and grouped in-process (mirrors /api/items) so the same
    // work surfaces one comparison table regardless of which provider's URL was opened.
    const allRows = await db.select().from(providerItems).where(eq(providerItems.available, true)).limit(500);
    const groups = groupDuplicates(allRows.map(catalogItemFromRow));
    const key = duplicateKey(targetItem);
    return groups.find(group => duplicateKey(group[0]) === key) ?? [targetItem];
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
  const group = await findComparisonGroup(provider, id);
  if (!group) return { title: "見つかりませんでした" };
  const primary = pickPrimary(group);
  const canonicalPath = `/items/${primary.providerId}/${primary.providerItemId}`;
  const providerLabel = group.length > 1 ? `${group.length}ヶ所で比較` : (providerNames.get(primary.providerId) ?? primary.providerId);
  return {
    title: primary.title,
    description: `${providerLabel}。「${primary.title}」の価格・配信状況を提供元ごとに比較し、審査済みレビューを表示します。`,
    alternates: { canonical: canonicalPath },
  };
}

export default async function ItemPage({ params }: { params: Promise<{ provider: string; id: string }> }) {
  const { provider, id } = await params;
  const group = await findComparisonGroup(provider, id);
  if (!group) notFound();

  const primary = pickPrimary(group);
  const productId = duplicateKey(primary);
  const approvedReviews = await findApprovedReviews(productId);
  const base = process.env.SITE_URL ?? "https://hikakulab.jp";
  const canonicalUrl = `${base}/items/${primary.providerId}/${primary.providerItemId}`;
  const averageRating = approvedReviews.length
    ? Math.round((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length) * 10) / 10
    : null;
  const sortedGroup = [...group].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: primary.title,
    url: canonicalUrl,
    ...(primary.maker ? { brand: { "@type": "Brand", name: primary.maker } } : {}),
    ...(primary.catalogNumber ? { sku: primary.catalogNumber } : {}),
    offers: sortedGroup.map(item => ({
      "@type": "Offer",
      url: item.affiliateUrl,
      priceCurrency: "JPY",
      ...(item.price ? { price: item.price } : {}),
      availability: item.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: providerNames.get(item.providerId) ?? item.providerId },
    })),
    ...(averageRating !== null ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: averageRating, reviewCount: approvedReviews.length },
    } : {}),
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
    <nav className="policyNav"><a href="/">トップ</a><a href="/#products">横断検索へ戻る</a><a href="/providers">対応ASP一覧</a></nav>
    <article className="itemShell">
      <p className="eyebrow">{sortedGroup.length > 1 ? `${sortedGroup.length}ヶ所で比較可能` : (providerNames.get(primary.providerId) ?? primary.providerId)}</p>
      <h1>{primary.title}</h1>
      <p className="ageNotice">18歳未満の方はご利用いただけません。本ページはテキスト情報のみで構成しています。</p>

      <section className="compareTable" aria-labelledby="compare-title">
        <h2 id="compare-title">提供元ごとの比較</h2>
        <table>
          <thead><tr><th>提供元</th><th>価格</th><th>配信状況</th><th>取得時刻</th><th /></tr></thead>
          <tbody>{sortedGroup.map(item => <tr key={`${item.providerId}:${item.providerItemId}`}>
            <td>{providerNames.get(item.providerId) ?? item.providerId}</td>
            <td>{item.price ? `${item.price.toLocaleString("ja-JP")}円` : "公式で確認"}</td>
            <td>{item.available ? "配信中" : "配信終了・要確認"}</td>
            <td>{new Date(item.fetchedAt).toLocaleString("ja-JP")}</td>
            <td><a href={item.affiliateUrl} rel="sponsored nofollow noopener" target="_blank">公式ページ →</a></td>
          </tr>)}</tbody>
        </table>
      </section>
      <p className="affiliate">PR・広告を含みます。価格・配信状況・詳細は必ずリンク先の公式ページでご確認ください。提供元ごとに配信条件が異なる場合があります。</p>

      <section className="itemReviews" aria-labelledby="item-reviews-title">
        <h2 id="item-reviews-title">審査済みレビュー{approvedReviews.length > 0 && `（${approvedReviews.length}件・平均${averageRating}、全提供元共通）`}</h2>
        {approvedReviews.length === 0
          ? <p className="noReviews">まだ審査を通過したレビューがありません。</p>
          : <ul className="reviewList">{approvedReviews.map(review => <li key={review.id}><div><b>{review.helpfulAxis}</b><span>満足度 {review.rating}</span></div><p>{review.body}</p></li>)}</ul>}
        <UgcForm productId={productId} />
      </section>
    </article>
  </>;
}
