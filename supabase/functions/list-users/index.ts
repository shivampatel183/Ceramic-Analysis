import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 🟢 1. Create client with user's access token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // 🟢 2. Get the current (admin) user
    const {
      data: { user: adminUser },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error("Error getting admin user:", userError);
      throw userError;
    }

    if (!adminUser) {
      // Clear, specific error so callers can detect auth problems
      const authErr = new Error("Admin user not authenticated.");
      console.error(authErr.message);
      throw authErr;
    }

    // 🟢 3. Use the Service Role key (set in Supabase Function environment)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    // 🟢 4. Query users created by this admin
    const { data: users, error } = await supabaseAdmin
      .from("user_roles")
      .select(
        `
        role,
        users:user_id (
          id,
          email,
          created_at
        )
      `
      )
      .eq("created_by", adminUser.id);

    if (error) throw error;

    // 🟢 5. Format result
    const formattedUsers = users.map((item: any) => ({
      id: item.users.id,
      email: item.users.email,
      role: item.role,
      created_at: item.users.created_at,
    }));

    return new Response(JSON.stringify({ users: formattedUsers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    // Log full error for easier debugging in Supabase logs
    console.error(
      "Error in list-users function:",
      err?.message ?? err,
      err?.stack ?? ""
    );

    // Return 401 when authentication failed, otherwise 400
    const isAuthError = (err?.message || "")
      .toLowerCase()
      .includes("not authenticated");
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 401 : 400,
    });
  }
});
