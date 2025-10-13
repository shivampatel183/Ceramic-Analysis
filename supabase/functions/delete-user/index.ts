// supabase/functions/delete-user/index.ts

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
    // 1. Get the ID of the user to be deleted from the request body.
    const { user_id } = await req.json();
    if (!user_id) {
      throw new Error("User ID is required.");
    }

    // 2. Create a Supabase admin client to perform the deletion.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 3. Delete the user from the auth.users table.
    // The user's entry in 'user_roles' should be deleted automatically
    // if you have set up a "cascade delete" foreign key constraint.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user_id
    );

    if (deleteError) {
      throw deleteError;
    }

    // 4. Return a success message.
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
