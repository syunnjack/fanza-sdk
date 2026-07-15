import type { providerItems } from "../db/schema";

export type CatalogItem={providerId:string;providerItemId:string;title:string;maker?:string;catalogNumber?:string;price?:number;currency:"JPY";available?:boolean;affiliateUrl:string;fetchedAt:string;sourceType:"api"|"sdk"|"feed"|"link"};
const compact=(value:string)=>value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");
export function duplicateKey(item:CatalogItem){if(item.catalogNumber&&item.maker)return `${compact(item.maker)}:${compact(item.catalogNumber)}`;return `${compact(item.maker??"")}:${compact(item.title).slice(0,64)}`;}
export function groupDuplicates(items:CatalogItem[]){return Object.values(items.reduce<Record<string,CatalogItem[]>>((groups,item)=>{const key=duplicateKey(item);(groups[key]??=[]).push(item);return groups;},{}));}

type ProviderItemRow = typeof providerItems.$inferSelect;

export function catalogItemFromRow(row: ProviderItemRow): CatalogItem {
  return {
    providerId: row.providerId,
    providerItemId: row.providerItemId,
    title: row.title,
    maker: row.maker ?? undefined,
    catalogNumber: row.catalogNumber ?? undefined,
    price: row.price ?? undefined,
    currency: "JPY",
    available: row.available,
    affiliateUrl: row.affiliateUrl,
    fetchedAt: row.fetchedAt.toISOString(),
    sourceType: row.sourceType as CatalogItem["sourceType"],
  };
}

// Picks one representative member of a duplicate group for canonical URLs and display order:
// a live-API-sourced record is the freshest, otherwise fall back to a stable alphabetical choice.
export function pickPrimary(group: CatalogItem[]): CatalogItem {
  return group.find(item => item.sourceType === "api") ?? [...group].sort((a, b) => a.providerId.localeCompare(b.providerId))[0];
}
