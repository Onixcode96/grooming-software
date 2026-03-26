import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get admin user id
    const { data: adminId } = await supabase.rpc("get_admin_user_id");
    if (!adminId) {
      return new Response(JSON.stringify({ error: "No admin found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find clients whose last completed appointment was exactly 30 days ago (± 1 day buffer)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

    const twentyNineDaysAgo = new Date();
    twentyNineDaysAgo.setDate(twentyNineDaysAgo.getDate() - 29);
    const dateStrEnd = twentyNineDaysAgo.toISOString().split("T")[0];

    // Get all users with their latest appointment
    const { data: appointments } = await supabase
      .from("appointments")
      .select("user_id, date")
      .in("status", ["confirmed", "completed"])
      .order("date", { ascending: false });

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by user, get latest date
    const latestByUser = new Map<string, string>();
    for (const apt of appointments) {
      if (!latestByUser.has(apt.user_id)) {
        latestByUser.set(apt.user_id, apt.date);
      }
    }

    const reminderMessage =
      "Care is a form of love... è passato un mese dall'ultima coccola! Se vuoi, sono qui per fissare il prossimo appuntamento. 🐾";

    let sent = 0;
    for (const [userId, lastDate] of latestByUser) {
      if (userId === adminId) continue;
      // Check if last visit was around 30 days ago
      if (lastDate >= dateStr && lastDate < dateStrEnd) {
        // Check we haven't already sent this reminder recently
        const { data: recentMessages } = await supabase
          .from("messages")
          .select("id")
          .eq("sender_id", adminId)
          .eq("receiver_id", userId)
          .ilike("content", "%è passato un mese%")
          .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          )
          .limit(1);

        if (!recentMessages || recentMessages.length === 0) {
          await supabase.from("messages").insert({
            sender_id: adminId,
            receiver_id: userId,
            content: reminderMessage,
          });
          sent++;
        }
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
