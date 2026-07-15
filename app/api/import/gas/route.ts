import { getDb } from "../../../../db";
import { providerItems } from "../../../../db/schema";

type Input={providerId?:unknown;providerItemId?:unknown;title?:unknown;maker?:unknown;catalogNumber?:unknown;price?:unknown;affiliateUrl?:unknown;available?:unknown};
const clean=(value:unknown,max=200)=>String(value??"").trim().slice(0,max);

export async function POST(request:Request){
 const expected=process.env.GAS_IMPORT_SECRET;const supplied=request.headers.get("x-feed-secret");
 if(!expected||!supplied||supplied!==expected)return Response.json({error:"Unauthorized"},{status:401});
 try{const payload=await request.json() as {items?:Input[]};const items=(payload.items??[]).slice(0,500);if(!items.length)return Response.json({error:"No items"},{status:400});
 const db=getDb();let accepted=0;for(const item of items){const providerId=clean(item.providerId,40);const providerItemId=clean(item.providerItemId,100);const title=clean(item.title,300);const affiliateUrl=clean(item.affiliateUrl,1000);if(!providerId||!providerItemId||!title||!/^https:\/\//.test(affiliateUrl))continue;await db.insert(providerItems).values({providerId,providerItemId,title,maker:clean(item.maker,200)||null,catalogNumber:clean(item.catalogNumber,100)||null,price:Number.isFinite(Number(item.price))?Math.max(0,Math.round(Number(item.price))):null,affiliateUrl,sourceType:"feed",available:item.available!==false,fetchedAt:new Date()}).onConflictDoUpdate({target:[providerItems.providerId,providerItems.providerItemId],set:{title,affiliateUrl,fetchedAt:new Date(),available:item.available!==false}});accepted++;}
 return Response.json({ok:true,accepted,status:"pending_review"},{status:202});}catch{return Response.json({error:"Invalid feed"},{status:400});}
}
