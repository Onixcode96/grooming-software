import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { session_id, appointment_id, mock } = body;

    if (!session_id || !appointment_id) {
      return new Response(JSON.stringify({ error: "Parametri mancanti" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // If real Stripe, verify the session
    if (stripeSecretKey && stripeSecretKey !== "mock" && !mock) {
      const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
        headers: { "Authorization": `Bearer ${stripeSecretKey}` },
      });
      const session = await stripeRes.json();

      if (session.payment_status !== "paid") {
        return new Response(JSON.stringify({ paid: false, error: "Pagamento non completato" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify appointment belongs to user
      if (session.metadata?.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Non autorizzato" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // MOCK MODE: accept any session starting with "mock_cs_"
    if (mock || !stripeSecretKey || stripeSecretKey === "mock") {
      if (!session_id.startsWith("mock_cs_")) {
        return new Response(JSON.stringify({ paid: false, error: "Sessione mock non valida" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Verify appointment belongs to user
    const { data: appointment, error: apptError } = await supabaseAdmin
      .from("appointments")
      .select("id, user_id, is_paid")
      .eq("id", appointment_id)
      .single();

    if (apptError || !appointment) {
      return new Response(JSON.stringify({ error: "Appuntamento non trovato" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (appointment.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (appointment.is_paid) {
      return new Response(JSON.stringify({ paid: true, already_paid: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update appointment as paid
    const { error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({ is_paid: true, payment_method: "online" })
      .eq("id", appointment_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ paid: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
