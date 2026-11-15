// QUEST DAY: authenticated, explicitly confirmed permanent account deletion.
// The caller CANNOT nominate another user's ID. All qd_* tables reference
// auth.users(id) ON DELETE CASCADE, confirmed against the deployed database.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const CONFIRMATION = "계정 삭제";
const SITE = "https://leaple.github.io";
Deno.serve(async req => {
  const origin = req.headers.get("origin");
  // Allow only the public QUEST DAY site and standard Capacitor native origins.
  // Authentication is enforced separately against the caller's user JWT.
  const allowed = [SITE,"http://localhost","https://localhost","capacitor://localhost"];
  const responseHeaders: Record<string,string> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": origin && allowed.includes(origin) ? origin : SITE,
    "access-control-allow-headers": "authorization, apikey, x-client-info, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
  };
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: responseHeaders });
  if (origin && !allowed.includes(origin)) return respond({error:"Origin not allowed"},403);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders });
  if (req.method !== "POST") return respond({error:"Method not allowed"},405);
  let body: unknown;
  try { body = await req.json(); } catch { return respond({error:"Invalid request"},400); }
  if (!body || typeof body !== "object" ||
      (body as Record<string,unknown>).confirmation !== CONFIRMATION) {
    return respond({error:"Explicit deletion confirmation is required"},400);
  }
  const bearer=req.headers.get("authorization")||"";
  if (!/^Bearer\s+\S+$/.test(bearer)) return respond({error:"Sign in required"},401);
  const token=bearer.replace(/^Bearer\s+/,"");
  const url=Deno.env.get("SUPABASE_URL");
  const keys=Deno.env.get("SUPABASE_SECRET_KEYS");
  const secret=keys ? (JSON.parse(keys)?.default as string|undefined) : undefined;
  // Older Supabase projects may still use the legacy server-side service role.
  const serverKey=secret||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url||!serverKey) return respond({error:"Account deletion service is not configured"},503);
  const admin=createClient(url,serverKey,{
    auth:{autoRefreshToken:false,persistSession:false},
  });
  try{
    const {data,error}=await admin.auth.getUser(token);
    const user=data?.user;
    if(error||!user) return respond({error:"Please sign in again"},401);
    // Real email accounts must have signed in again recently (password challenge
    // is done by the UI). This cannot be bypassed by changing request JSON.
    if(!user.is_anonymous){
      const signedIn=Date.parse(user.last_sign_in_at||"");
      if(!Number.isFinite(signedIn)||Date.now()-signedIn>10*60*1000||
         Date.now()<signedIn-60_000){
        return respond({error:"Recent password sign-in required"},403);
      }
    }
    // Don't include a user_id from client input. Supabase Auth cascades removal
    // of cloud saves and all existing social tables via their FK constraints.
    const {error:deleted}=await admin.auth.admin.deleteUser(user.id);
    if(deleted){
      console.error("QUEST DAY account deletion failed",deleted.message);
      return respond({error:"Server deletion failed. Nothing was confirmed deleted."},500);
    }
    return respond({deleted:true});
  }catch(err){
    console.error("QUEST DAY account deletion service error",err);
    return respond({error:"Account deletion could not be completed"},500);
  }
});
