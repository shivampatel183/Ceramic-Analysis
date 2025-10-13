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
    // 1. Authenticate the admin making the request.
    const authHeader = req.headers.get("Authorization")!;
    const supabase_auth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user: admin_user },
    } = await supabase_auth.auth.getUser();
    if (!admin_user) throw new Error("Admin not authenticated.");

    // 2. Get details from the request body. **Now expecting 'department'**.
    const { email, password, department } = await req.json();
    if (!email || !password || !department) {
      throw new Error("Email, password, and department are required.");
    }

    // 3. Create a Supabase admin client for privileged operations.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 4. Create the new user in the auth system.
    const { data: newUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm the user
      });
    if (authError) throw authError;

    // 5. Add the user's role and department to the public.user_roles table.
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "user", // Hardcoding the role as 'user' as per your original logic
      department: department, // **Using the 'department' from the request body**
      created_by: admin_user.id,
    });
    if (roleError) throw roleError;

    // 6. Return the newly created user data.
    return new Response(JSON.stringify({ user: newUser.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
