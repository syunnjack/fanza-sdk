import {providers,statusOf} from "../../../lib/providers";
export async function GET(){return Response.json({providers:providers.map(p=>{const s=statusOf(p);return{id:s.id,name:s.name,program:s.program,mode:s.mode,enabled:s.enabled,notes:s.notes,group:s.group}}),policy:"公式に許可されたAPI・SDK・フィード・成果リンクだけを使用。報酬率は推薦順位から除外。"});}
