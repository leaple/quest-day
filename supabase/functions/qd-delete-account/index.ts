// QUEST DAY account deletion.
// Deployment is required before the app's account-deletion button can work.
// Never put a Supabase service-role/secret key in the web app or GitHub.
import { withSupabase } from "npm:@supabase/server@1";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "POST 요청만 허용됩니다." }, { status: 405 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "올바른 삭제 확인 요청이 아닙니다." }, { status: 400 });
    }
    if (
      !body || typeof body !== "object" ||
      !("confirmation" in body) || body.confirmation !== "계정 삭제"
    ) {
      return Response.json({ error: "계정 삭제 확인 문구가 일치하지 않습니다." }, { status: 400 });
    }

    // Verify the user directly with Supabase Auth, not a user ID supplied in the body.
    const { data: identity, error: identityError } = await ctx.supabase.auth.getUser();
    const userId = identity?.user?.id;
    const tokenId = ctx.userClaims?.id ?? ctx.jwtClaims?.sub;
    if (identityError || !userId || !tokenId || userId !== tokenId) {
      return Response.json({ error: "로그인이 만료되었습니다. 다시 로그인해 주세요." }, { status: 401 });
    }

    // All QUEST DAY user-owned tables in the reviewed SQL schemas reference
    // auth.users(id) ON DELETE CASCADE. Do not delete other users' records.
    // This MUST be tested in staging before deploying to production.
    const { error: deletionError } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId, false);
    if (deletionError) {
      console.error("QUEST DAY account deletion rejected", deletionError.message);
      return Response.json(
        { error: "계정 삭제가 완료되지 않았습니다. 다시 시도하거나 운영자에게 문의해 주세요." },
        { status: 500 },
      );
    }
    return Response.json({ deleted: true });
  }),
};
