import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type UserRole = "employee" | "manager" | "admin";
type Action = "list" | "update" | "deactivate" | "reactivate";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(
  data: unknown,
  status: number,
  allowedOrigin: string
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowedOrigin,
    },
  });
}

function jsonError(
  message: string,
  status: number,
  allowedOrigin: string
): Response {
  return jsonResponse({ error: message }, status, allowedOrigin);
}

function canManage(callerRole: UserRole, targetRole: UserRole): boolean {
  if (callerRole === "admin") {
    return targetRole === "employee" || targetRole === "manager";
  }
  if (callerRole === "manager") {
    return targetRole === "employee";
  }
  return false;
}

Deno.serve(async (req: Request) => {
  const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:5173";

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": siteUrl,
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonError("Method not allowed", 405, siteUrl);
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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch caller's profile
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

    const body = await req.json();
    const action: Action = body.action;

    // ── list ──────────────────────────────────────────────────────────────────
    if (action === "list") {
      const { data: callerAccess } = await adminClient
        .from("user_store_access")
        .select("store_id")
        .eq("user_id", callerUser.id);
      const callerStoreIds = (callerAccess ?? []).map(
        (r: { store_id: string }) => r.store_id
      );

      let profilesQuery = adminClient
        .from("profiles")
        .select("id, username, role, is_active")
        .neq("id", callerUser.id);

      if (callerRole === "manager") {
        profilesQuery = profilesQuery.eq("role", "employee");
      } else {
        profilesQuery = profilesQuery.in("role", ["employee", "manager"]);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) {
        return jsonError("Failed to fetch users", 500, siteUrl);
      }

      let targetProfiles = (profiles ?? []) as {
        id: string;
        username: string;
        role: UserRole;
        is_active: boolean;
      }[];

      // For managers: filter to users who share at least one store
      if (callerRole === "manager" && targetProfiles.length > 0) {
        const candidateIds = targetProfiles.map((p) => p.id);
        const { data: sharedAccess } = await adminClient
          .from("user_store_access")
          .select("user_id, store_id")
          .in("user_id", candidateIds)
          .in("store_id", callerStoreIds);
        const visibleUserIds = new Set(
          (sharedAccess ?? []).map((r: { user_id: string }) => r.user_id)
        );
        targetProfiles = targetProfiles.filter((p) =>
          visibleUserIds.has(p.id)
        );
      }

      // Fetch store access for all visible users
      const targetIds = targetProfiles.map((p) => p.id);
      const storeAccessMap: Record<string, string[]> = {};
      if (targetIds.length > 0) {
        const { data: allAccess } = await adminClient
          .from("user_store_access")
          .select("user_id, store_id")
          .in("user_id", targetIds);
        for (const row of allAccess ?? []) {
          if (!storeAccessMap[row.user_id]) storeAccessMap[row.user_id] = [];
          storeAccessMap[row.user_id].push(row.store_id);
        }
      }

      // Fetch emails from auth
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({
        perPage: 1000,
      });
      const emailMap: Record<string, string> = {};
      for (const u of authUsersData?.users ?? []) {
        emailMap[u.id] = u.email ?? "";
      }

      // Fetch available stores for the caller (for edit modal checkboxes)
      let storesQuery = adminClient.from("stores").select("id, name, location");
      if (callerRole === "manager") {
        storesQuery = storesQuery.in("id", callerStoreIds);
      }
      const { data: availableStores } = await storesQuery;

      const users = targetProfiles.map((p) => ({
        id: p.id,
        name: p.username,
        email: emailMap[p.id] ?? "",
        role: p.role,
        isActive: p.is_active,
        storeIds: storeAccessMap[p.id] ?? [],
      }));

      return jsonResponse(
        { users, availableStores: availableStores ?? [] },
        200,
        siteUrl
      );
    }

    // ── update ────────────────────────────────────────────────────────────────
    if (action === "update") {
      const { userId, name, role, storeIds } = body;

      if (!userId || !UUID_RE.test(userId)) {
        return jsonError("Invalid userId", 400, siteUrl);
      }

      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (!targetProfile) {
        return jsonError("User not found", 404, siteUrl);
      }

      if (!canManage(callerRole, targetProfile.role)) {
        return jsonError(
          "Insufficient permissions to modify this user",
          403,
          siteUrl
        );
      }

      if (callerRole === "manager") {
        const { data: callerAccess } = await adminClient
          .from("user_store_access")
          .select("store_id")
          .eq("user_id", callerUser.id);
        const callerStoreIds = (callerAccess ?? []).map(
          (r: { store_id: string }) => r.store_id
        );

        const { data: targetAccess } = await adminClient
          .from("user_store_access")
          .select("store_id")
          .eq("user_id", userId);
        const targetStoreIds = (targetAccess ?? []).map(
          (r: { store_id: string }) => r.store_id
        );
        const sharedStores = targetStoreIds.filter((id: string) =>
          callerStoreIds.includes(id)
        );
        if (sharedStores.length === 0) {
          return jsonError(
            "Cannot modify users outside your stores",
            403,
            siteUrl
          );
        }

        if (storeIds) {
          const unauthorized = storeIds.filter(
            (id: string) => !callerStoreIds.includes(id)
          );
          if (unauthorized.length > 0) {
            return jsonError(
              "Cannot assign stores you do not have access to",
              403,
              siteUrl
            );
          }
        }

        if (role && role !== "employee") {
          return jsonError(
            "Managers can only assign employee role",
            403,
            siteUrl
          );
        }
      }

      if (role !== undefined) {
        const validRoles: UserRole[] = ["employee", "manager", "admin"];
        if (!validRoles.includes(role)) {
          return jsonError("Invalid role", 400, siteUrl);
        }
        if (!canManage(callerRole, role)) {
          return jsonError(
            "Cannot assign a role equal to or higher than your own",
            403,
            siteUrl
          );
        }
      }

      const profileUpdate: Record<string, unknown> = {};
      if (name !== undefined) profileUpdate.username = name;
      if (role !== undefined) profileUpdate.role = role;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: updateError } = await adminClient
          .from("profiles")
          .update(profileUpdate)
          .eq("id", userId);
        if (updateError) {
          return jsonError("Failed to update user profile", 500, siteUrl);
        }
      }

      if (storeIds !== undefined) {
        if (
          !Array.isArray(storeIds) ||
          !storeIds.every(
            (id: unknown) => typeof id === "string" && UUID_RE.test(id)
          )
        ) {
          return jsonError("Invalid storeIds format", 400, siteUrl);
        }
        if (storeIds.length === 0) {
          return jsonError(
            "User must have at least one store assigned",
            400,
            siteUrl
          );
        }
        await adminClient
          .from("user_store_access")
          .delete()
          .eq("user_id", userId);
        const newRows = storeIds.map((storeId: string) => ({
          user_id: userId,
          store_id: storeId,
        }));
        const { error: accessError } = await adminClient
          .from("user_store_access")
          .insert(newRows);
        if (accessError) {
          return jsonError("Failed to update store access", 500, siteUrl);
        }
      }

      return jsonResponse({ success: true }, 200, siteUrl);
    }

    // ── deactivate ────────────────────────────────────────────────────────────
    if (action === "deactivate") {
      const { userId } = body;

      if (!userId || !UUID_RE.test(userId)) {
        return jsonError("Invalid userId", 400, siteUrl);
      }

      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (!targetProfile) {
        return jsonError("User not found", 404, siteUrl);
      }

      if (!canManage(callerRole, targetProfile.role)) {
        return jsonError(
          "Insufficient permissions to deactivate this user",
          403,
          siteUrl
        );
      }

      if (callerRole === "manager") {
        const { data: callerAccess } = await adminClient
          .from("user_store_access")
          .select("store_id")
          .eq("user_id", callerUser.id);
        const callerStoreIds = (callerAccess ?? []).map(
          (r: { store_id: string }) => r.store_id
        );
        const { data: targetAccess } = await adminClient
          .from("user_store_access")
          .select("store_id")
          .eq("user_id", userId);
        const sharedStores = (targetAccess ?? []).filter(
          (r: { store_id: string }) => callerStoreIds.includes(r.store_id)
        );
        if (sharedStores.length === 0) {
          return jsonError(
            "Cannot deactivate users outside your stores",
            403,
            siteUrl
          );
        }
      }

      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ is_active: false })
        .eq("id", userId);
      if (updateError) {
        return jsonError("Failed to deactivate user", 500, siteUrl);
      }

      const { error: banError } = await adminClient.auth.admin.updateUserById(
        userId,
        { ban_duration: "87600h" }
      );
      if (banError) {
        console.error("Failed to ban user in auth:", banError);
      }

      return jsonResponse({ success: true }, 200, siteUrl);
    }

    // ── reactivate ────────────────────────────────────────────────────────────
    if (action === "reactivate") {
      const { userId } = body;

      if (!userId || !UUID_RE.test(userId)) {
        return jsonError("Invalid userId", 400, siteUrl);
      }

      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (!targetProfile) {
        return jsonError("User not found", 404, siteUrl);
      }

      if (!canManage(callerRole, targetProfile.role)) {
        return jsonError(
          "Insufficient permissions to reactivate this user",
          403,
          siteUrl
        );
      }

      if (callerRole === "manager") {
        const { data: callerAccess } = await adminClient
          .from("user_store_access")
          .select("store_id")
          .eq("user_id", callerUser.id);
        const callerStoreIds = (callerAccess ?? []).map(
          (r: { store_id: string }) => r.store_id
        );
        const { data: targetAccess } = await adminClient
          .from("user_store_access")
          .select("store_id")
          .eq("user_id", userId);
        const sharedStores = (targetAccess ?? []).filter(
          (r: { store_id: string }) => callerStoreIds.includes(r.store_id)
        );
        if (sharedStores.length === 0) {
          return jsonError(
            "Cannot reactivate users outside your stores",
            403,
            siteUrl
          );
        }
      }

      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ is_active: true })
        .eq("id", userId);
      if (updateError) {
        return jsonError("Failed to reactivate user", 500, siteUrl);
      }

      const { error: unbanError } = await adminClient.auth.admin.updateUserById(
        userId,
        { ban_duration: "none" }
      );
      if (unbanError) {
        console.error("Failed to unban user in auth:", unbanError);
      }

      return jsonResponse({ success: true }, 200, siteUrl);
    }

    return jsonError("Invalid action", 400, siteUrl);
  } catch (err) {
    console.error("manage-users function error:", err);
    return jsonError("Internal server error", 500, siteUrl);
  }
});
