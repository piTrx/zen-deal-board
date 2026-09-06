export const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

/** Número emisor de WhatsApp. Por defecto, el sandbox de Twilio. */
export function senderNumber(): string {
  const raw = Deno.env.get("WHATSAPP_FROM") ?? "+14155238886";
  return raw.startsWith("whatsapp:") ? raw : `whatsapp:${raw}`;
}

/** Token compartido para autenticar el webhook de Twilio (derivado de la clave de conexión). */
export async function webhookToken(connectionKey: string): Promise<string> {
  const data = new TextEncoder().encode(`whatsapp-webhook:${connectionKey}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function safeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Deja solo dígitos y devuelve los últimos 9 para emparejar contactos. */
export function phoneTail(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return null;
  return digits.slice(-9);
}

export function stripWhatsApp(value: string): string {
  return value.replace(/^whatsapp:/, "");
}
