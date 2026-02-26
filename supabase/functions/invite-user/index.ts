import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type UserRole = "employee" | "manager" | "admin";

interface InvitePayload {
  email: string;
  name: string;
  role: UserRole;
  storeIds: string[];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonError(
  message: string,
  status: number,
  allowedOrigin: string
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowedOrigin,
    },
  });
}

Deno.serve(async (req: Request) => {
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": siteUrl,
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonError("Missing authorization header", 401, siteUrl);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller's JWT
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: callerUser },
      error: callerError,
    } = await callerClient.auth.getUser();
    if (callerError || !callerUser) {
      return jsonError("Unauthorized", 401, siteUrl);
    }

    // Fetch caller's role via admin client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile, error: profileFetchError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", callerUser.id)
      .single();
    if (profileFetchError || !callerProfile) {
      return jsonError("Could not verify caller permissions", 403, siteUrl);
    }

    const callerRole: UserRole = callerProfile.role;
    if (callerRole !== "manager" && callerRole !== "admin") {
      return jsonError("Insufficient permissions", 403, siteUrl);
    }

    // Parse invite payload
    const body: InvitePayload = await req.json();
    const { email, name, role, storeIds } = body;

    if (!email || !name || !role || !storeIds || storeIds.length === 0) {
      return jsonError(
        "Missing required fields: email, name, role, storeIds",
        400,
        siteUrl
      );
    }

    const validRoles: UserRole[] = ["employee", "manager", "admin"];
    if (!validRoles.includes(role)) {
      return jsonError("Invalid role", 400, siteUrl);
    }

    if (!storeIds.every((id) => UUID_RE.test(id))) {
      return jsonError("Invalid store ID format", 400, siteUrl);
    }

    // Enforce manager restrictions server-side
    if (callerRole === "manager") {
      if (role !== "employee") {
        return jsonError("Managers can only invite employees", 403, siteUrl);
      }
      const { data: callerAccess } = await adminClient
        .from("user_store_access")
        .select("store_id")
        .eq("user_id", callerUser.id);

      const callerStoreIds = (callerAccess ?? []).map(
        (r: { store_id: string }) => r.store_id
      );
      const unauthorized = storeIds.filter(
        (id) => !callerStoreIds.includes(id)
      );
      if (unauthorized.length > 0) {
        return jsonError(
          "Cannot assign stores you do not have access to",
          403,
          siteUrl
        );
      }
    }

    // Send the invite — this creates the auth.users row
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { username: name, role },
        redirectTo: `${siteUrl}/set-password`,
      });

    if (inviteError) {
      console.error("inviteUserByEmail error:", inviteError);
      return jsonError("Failed to send invitation. Please try again.", 400, siteUrl);
    }

    const newUserId = inviteData.user.id;

    // Create the profiles row
    const { error: profileInsertError } = await adminClient
      .from("profiles")
      .insert({ id: newUserId, username: name, role });

    if (profileInsertError) {
      console.error("profiles insert error:", profileInsertError);
      // Rollback: remove the orphaned auth user
      await adminClient.auth.admin.deleteUser(newUserId);
      return jsonError(
        "Failed to create user profile. Invite rolled back.",
        500,
        siteUrl
      );
    }

    // Create user_store_access rows
    const accessRows = storeIds.map((storeId) => ({
      user_id: newUserId,
      store_id: storeId,
    }));
    const { error: accessError } = await adminClient
      .from("user_store_access")
      .insert(accessRows);

    if (accessError) {
      console.error("user_store_access insert error:", accessError);
      // Rollback: delete profile first, then the auth user
      await adminClient.from("profiles").delete().eq("id", newUserId);
      await adminClient.auth.admin.deleteUser(newUserId);
      return jsonError(
        "Failed to assign store access. Invite has been rolled back.",
        500,
        siteUrl
      );
    }

    return new Response(JSON.stringify({ success: true, userId: newUserId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": siteUrl,
      },
    });
  } catch (err) {
    console.error("invite-user function error:", err);
    return jsonError("Internal server error", 500, siteUrl);
  }
});
