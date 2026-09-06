import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GATEWAY_URL, senderNumber, stripWhatsApp } from "../_shared/whatsapp.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
      return json({ error: "Faltan credenciales de configuración" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No autenticado" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "No autenticado" }, 401);
    const user = userData.user;

    const payload = await req.json().catch(() => null);
    const to = typeof payload?.to === "string" ? payload.to.trim() : "";
    const body = typeof payload?.body === "string" ? payload.body.trim() : "";
    const dealId = typeof payload?.deal_id === "string" ? payload.deal_id : null;
    const contactId = typeof payload?.contact_id === "string" ? payload.contact_id : null;
    const companyId = typeof payload?.company_id === "string" ? payload.company_id : null;

    if (!/^\+?\d{6,20}$/.test(to.replace(/[\s-]/g, ""))) {
      return json({ error: "Número de destino no válido" }, 400);
    }
    if (!body || body.length > 1500) {
      return json({ error: "El mensaje debe tener entre 1 y 1500 caracteres" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const toNumber = to.startsWith("+") ? to : `+${to.replace(/\D/g, "")}`;
    const from = senderNumber();

    const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: `whatsapp:${toNumber}`, From: from, Body: body }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error(`Twilio error [${response.status}]: ${details}`);
      await admin.from("whatsapp_messages").insert({
        direction: "outbound",
        from_number: stripWhatsApp(from),
        to_number: toNumber,
        body,
        status: "failed",
        error_message: details.slice(0, 500),
        contact_id: contactId,
        company_id: companyId,
        deal_id: dealId,
        user_id: user.id,
      });
      return json({ error: "El proveedor rechazó el envío", status: response.status, details }, response.status);
    }

    const result = await response.json();

    const { data: activity } = await admin
      .from("activities")
      .insert({
        user_id: user.id,
        type: "whatsapp",
        title: `WhatsApp enviado a ${toNumber}`,
        description: body,
        recipient: toNumber,
        occurred_at: new Date().toISOString(),
        deal_id: dealId,
        contact_id: contactId,
        company_id: companyId,
      })
      .select("id")
      .single();

    const { data: saved, error: saveError } = await admin
      .from("whatsapp_messages")
      .insert({
        direction: "outbound",
        from_number: stripWhatsApp(from),
        to_number: toNumber,
        body,
        message_sid: result.sid ?? null,
        status: result.status ?? "queued",
        contact_id: contactId,
        company_id: companyId,
        deal_id: dealId,
        activity_id: activity?.id ?? null,
        user_id: user.id,
      })
      .select()
      .single();

    if (saveError) console.error("No se pudo guardar el mensaje:", saveError.message);

    return json({ ok: true, message: saved, sid: result.sid });
  } catch (e) {
    console.error("whatsapp-send failed:", e);
    return json({ error: e instanceof Error ? e.message : "Error inesperado" }, 500);
  }
});
