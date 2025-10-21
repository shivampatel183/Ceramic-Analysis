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
    // 1. Authenticate the admin making the request
    const authHeader = req.headers.get("Authorization")!;
    const supabase_auth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user: admin_user },
      error: authErr,
    } = await supabase_auth.auth.getUser();
    if (authErr || !admin_user) {
      throw new Error("Admin not authenticated.");
    }

    // 2. Get the ID of the user to be deleted from the request body.
    const { user_id } = await req.json();
    if (!user_id) {
      throw new Error("User ID is required.");
    }

    // 3. Create a Supabase admin client to perform the deletion.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 4. VERIFY OWNERSHIP
    // Check if the user to be deleted was created by the admin making the request
    const { data: roleData, error: verifyError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("user_id", user_id)
      .eq("created_by", admin_user.id) // This is the key check
      .single();

    if (verifyError || !roleData) {
      throw new Error(
        "Permission denied: You can only delete users you created."
      );
    }

    // 5. Delete the user from the auth.users table.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user_id
    );

    if (deleteError) {
      throw deleteError;
    }

    // 6. Return a success message.
    return new Response(
      JSON.stringify({ message: "User deleted successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
