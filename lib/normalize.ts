export type CatalogItem={providerId:string;providerItemId:string;title:string;maker?:string;catalogNumber?:string;price?:number;currency:"JPY";available?:boolean;affiliateUrl:string;fetchedAt:string;sourceType:"api"|"sdk"|"feed"|"link"};
const compact=(value:string)=>value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");
export function duplicateKey(item:CatalogItem){if(item.catalogNumber&&item.maker)return `${compact(item.maker)}:${compact(item.catalogNumber)}`;return `${compact(item.maker??"")}:${compact(item.title).slice(0,64)}`;}
export function groupDuplicates(items:CatalogItem[]){return Object.values(items.reduce<Record<string,CatalogItem[]>>((groups,item)=>{const key=duplicateKey(item);(groups[key]??=[]).push(item);return groups;},{}));}
