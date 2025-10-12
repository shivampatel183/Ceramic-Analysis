// /supabase/functions/list-users/index.ts

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
    // 1. Create a client with the user's auth token to identify the caller
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // 2. Get the current (admin) user making the request
    const {
      data: { user: adminUser },
    } = await supabaseClient.auth.getUser();
    if (!adminUser) {
      throw new Error("Admin user not authenticated.");
    }

    // 3. Create a Supabase admin client to perform privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 4. STEP 1: Fetch the roles and user_ids created by this admin
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role, department") // Also select department if you need it
      .eq("created_by", adminUser.id);

    if (rolesError) throw rolesError;
    if (!rolesData || rolesData.length === 0) {
      // If the admin has created no users, return an empty array
      return new Response(JSON.stringify({ users: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 5. STEP 2: Get the list of all users from the admin API
    const {
      data: { users: allUsers },
      error: listError,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) throw listError;

    // 6. STEP 3: Combine the data in the function
    // We map over our rolesData and find the matching user from the full list
    const formattedUsers = rolesData
      .map((roleInfo) => {
        const matchingUser = allUsers.find((u) => u.id === roleInfo.user_id);
        return {
          id: roleInfo.user_id,
          email: matchingUser?.email || "N/A",
          role: roleInfo.role || "user",
          department: roleInfo.department || "N/A", // Include department
          created_at: matchingUser?.created_at,
        };
      })
      .filter((user) => user.email !== "N/A"); // Filter out any roles that don't have a matching user

    return new Response(JSON.stringify({ users: formattedUsers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Error in list-users function:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400, // Return 400 for general errors
    });
  }
});
