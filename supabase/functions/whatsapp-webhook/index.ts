import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { phoneTail, safeEqual, stripWhatsApp, webhookToken } from "../_shared/whatsapp.ts";

const twiml = (status = 200) =>
  new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status,
    headers: { "Content-Type": "text/xml" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!TWILIO_API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
    console.error("whatsapp-webhook: faltan credenciales");
    return new Response("Server not configured", { status: 500 });
  }

  const expected = await webhookToken(TWILIO_API_KEY);
  const provided = new URL(req.url).searchParams.get("token");
  if (!safeEqual(provided, expected)) return new Response("Unauthorized", { status: 401 });

  const form = new URLSearchParams(await req.text());
  const from = stripWhatsApp(form.get("From") ?? "");
  const to = stripWhatsApp(form.get("To") ?? "");
  const body = form.get("Body");
  const sid = form.get("MessageSid") ?? form.get("SmsMessageSid");
  const mediaUrl = form.get("MediaUrl0");
  const messageStatus = form.get("MessageStatus");

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Callback de estado de un mensaje saliente
  if (messageStatus && sid && !body) {
    await supabase.from("whatsapp_messages").update({ status: messageStatus }).eq("message_sid", sid);
    return twiml();
  }

  if (!from) return twiml();

  // Emparejar con el contacto por teléfono
  let contactId: string | null = null;
  let companyId: string | null = null;
  let dealId: string | null = null;
  let ownerId: string | null = null;

  const tail = phoneTail(from);
  if (tail) {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, company_id, created_by, phone")
      .not("phone", "is", null);
    const match = (contacts ?? []).find((c) => phoneTail(c.phone) === tail);
    if (match) {
      contactId = match.id;
      companyId = match.company_id;
      ownerId = match.created_by;

      const { data: deals } = await supabase
        .from("deals")
        .select("id, owner_id, updated_at")
        .eq("contact_id", match.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (deals?.length) {
        dealId = deals[0].id;
        ownerId = deals[0].owner_id ?? ownerId;
      }
    }
  }

  let activityId: string | null = null;
  if (ownerId) {
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .insert({
        user_id: ownerId,
        type: "whatsapp",
        title: `WhatsApp recibido de ${from}`,
        description: body ?? (mediaUrl ? "Archivo adjunto recibido" : null),
        recipient: from,
        occurred_at: new Date().toISOString(),
        contact_id: contactId,
        company_id: companyId,
        deal_id: dealId,
      })
      .select("id")
      .single();
    if (activityError) console.error("Actividad no registrada:", activityError.message);
    activityId = activity?.id ?? null;
  }

  const { error } = await supabase.from("whatsapp_messages").upsert(
    {
      direction: "inbound",
      from_number: from,
      to_number: to,
      body,
      media_url: mediaUrl,
      message_sid: sid,
      status: "received",
      contact_id: contactId,
      company_id: companyId,
      deal_id: dealId,
      activity_id: activityId,
      user_id: ownerId,
    },
    { onConflict: "message_sid" },
  );
  if (error) console.error("Mensaje entrante no guardado:", error.message);

  return twiml();
});
