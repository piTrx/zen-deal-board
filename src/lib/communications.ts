import { ActivityType } from "@/lib/activityTypes";

export type CommunicationChannel = "whatsapp" | "email" | "call";

export const channelToActivityType: Record<CommunicationChannel, ActivityType> = {
  whatsapp: "whatsapp",
  email: "email",
  call: "call",
};

export const channelLabel: Record<CommunicationChannel, string> = {
  whatsapp: "WhatsApp",
  email: "Correo",
  call: "Llamada",
};

/** Normaliza un teléfono a dígitos con prefijo internacional (sin "+"). */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+") || trimmed.startsWith("00");
  const digits = trimmed.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length < 6) return null;
  // Si no lleva prefijo internacional, asumimos España (+34) para números de 9 dígitos.
  if (!hasPlus && digits.length === 9) return `34${digits}`;
  return digits;
}

export function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const base = `https://wa.me/${phone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildMailtoUrl(email: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const qs = params.toString();
  return `mailto:${email}${qs ? `?${qs}` : ""}`;
}

export function buildTelUrl(phone: string): string {
  return `tel:+${phone}`;
}

/** Destinatario legible según el canal. */
export function recipientForChannel(
  channel: CommunicationChannel,
  opts: { email?: string | null; phone?: string | null }
): string | null {
  if (channel === "email") return isValidEmail(opts.email) ? opts.email!.trim() : null;
  const phone = normalizePhone(opts.phone);
  return phone ? `+${phone}` : null;
}

export const missingDataMessage: Record<CommunicationChannel, string> = {
  whatsapp: "Este contacto no tiene un número de teléfono válido. Añádelo para usar WhatsApp.",
  email: "Este contacto no tiene una dirección de correo válida. Añádela para enviar un email.",
  call: "Este contacto no tiene un número de teléfono válido. Añádelo para poder llamar.",
};
