export type Provider={id:string;name:string;program:string;mode:"api"|"sdk"|"feed"|"link";required:string[];source:string;notes:string;group?:string};
export const providers:Provider[]=[
 {id:"fanza",name:"FANZA",program:"DMM Affiliate",mode:"api",required:["DMM_API_ID","DMM_AFFILIATE_ID"],source:"https://affiliate.dmm.com/",notes:"API v3"},
 {id:"duga",name:"DUGA",program:"APEXアフィリエイト",mode:"api",required:["DUGA_APP_ID","DUGA_AGENT_ID"],source:"https://duga.jp/",notes:"WebサービスAPI"},
 {id:"mgs",name:"MGS動画",program:"MGSアフィリエイト",mode:"sdk",required:["MGS_AFFILIATE_ID","MGS_FEED_URL"],source:"https://www.mgstage.com/",notes:"会員向けSDK・フィード"},
 {id:"dticash",name:"DTI CASH",program:"DTI CASH Affiliate",mode:"feed",required:["DTICASH_AFFILIATE_ID","DTICASH_SITE_CODE"],source:"https://www.dticash.com/",notes:"ネットワーク型。サイト別コードで管理"},
 {id:"1pondo",name:"一本道",program:"DTI CASH",mode:"link",required:["DTICASH_AFFILIATE_ID","DTICASH_SITE_CODE"],source:"https://www.dticash.com/",notes:"DTI CASH配下",group:"dticash"},
 {id:"caribbeancom",name:"カリビアンコム",program:"DTI CASH",mode:"link",required:["DTICASH_AFFILIATE_ID","DTICASH_SITE_CODE"],source:"https://www.dticash.com/",notes:"DTI CASH配下",group:"dticash"},
 {id:"10musume",name:"天然むすめ",program:"DTI CASH",mode:"link",required:["DTICASH_AFFILIATE_ID","DTICASH_SITE_CODE"],source:"https://www.dticash.com/",notes:"DTI CASH配下",group:"dticash"},
 {id:"pacopacomama",name:"パコパコママ",program:"DTI CASH",mode:"link",required:["DTICASH_AFFILIATE_ID","DTICASH_SITE_CODE"],source:"https://www.dticash.com/",notes:"DTI CASH配下",group:"dticash"},
 {id:"fc2",name:"FC2アフィリエイト",program:"FC2",mode:"link",required:["FC2_AFFILIATE_ID"],source:"https://affiliate.fc2.com/",notes:"FC2共通の成果リンク"},
 {id:"fc2-market",name:"FC2コンテンツマーケット",program:"商品別アフィリエイト",mode:"link",required:["FC2_CONTENT_MARKET_ID"],source:"https://help.fc2.com/contentsmarket/manual/group162/1136",notes:"商品ページで個別タグを取得",group:"fc2"},
 {id:"fc2-video",name:"FC2動画",program:"動画アフィリエイト",mode:"link",required:["FC2_VIDEO_ID"],source:"https://help.fc2.com/video/manual/group10/875",notes:"動画プレーヤー・サムネイル経由",group:"fc2"},
 {id:"fc2-live",name:"FC2ライブ",program:"ライブアフィリエイト",mode:"link",required:["FC2_LIVE_ID"],source:"https://live.fc2.com/affiliate_faq/",notes:"コンテンツマーケットとは別制度",group:"fc2"},
 {id:"fantia",name:"Fantia",program:"Fantiaアフィリエイト",mode:"link",required:["FANTIA_AFFILIATE_ID"],source:"https://help.fantia.jp/2250",notes:"申請後、商品・プラン別リンクを取得"},
 {id:"dlsite",name:"DLsite",program:"DLsiteアフィリエイト",mode:"link",required:["DLSITE_AFFILIATE_ID"],source:"https://www.dlsite.com/",notes:"成人向け同人動画等を別カテゴリで管理"},
 {id:"gyutto",name:"Gyutto",program:"Gyuttoアフィリエイト",mode:"link",required:["GYUTTO_AFFILIATE_ID"],source:"https://gyutto.com/",notes:"許可済み商品情報と成果リンク"},
 {id:"appollo",name:"appollo",program:"成人向け案件ASP",mode:"link",required:["APPOLLO_PARTNER_ID"],source:"https://www.appollo.jp/",notes:"案件・LP型。担当者提供リンクで接続"},
 {id:"tmp",name:"TMP（確認待ち）",program:"成人向けASP候補",mode:"link",required:["TMP_PARTNER_ID"],source:"/providers",notes:"公式URL・現行仕様を管理画面で確認後に有効化"},
 {id:"generic",name:"追加ASP",program:"公式SDK / API / Feed",mode:"feed",required:["GENERIC_PROVIDER_FEED_URL"],source:"/providers",notes:"新規ASPを設定だけで追加"}
];
export const statusOf=(p:Provider)=>({...p,enabled:p.required.every(k=>Boolean(process.env[k]))});
