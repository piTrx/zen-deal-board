import { CommunicationChannel } from "@/lib/communications";

/**
 * Fase 2 — Integraciones reales de canales.
 *
 * NADA de esto está operativo todavía: son las piezas que habrá que
 * configurar con un proveedor externo y sus credenciales. La fase 1
 * (enlaces wa.me / mailto: / tel: + registro manual de actividad) no
 * depende de ninguna de ellas.
 */
export interface CommunicationProvider {
  id: string;
  channel: CommunicationChannel;
  name: string;
  /** Qué aportará cuando esté configurado. */
  capabilities: string[];
  /** Secretos / credenciales pendientes de configurar. */
  requiredSecrets: string[];
  /** Endpoints de backend previstos (aún no implementados). */
  plannedEndpoints: string[];
  status: "not_configured";
}

export const communicationProviders: CommunicationProvider[] = [
  {
    id: "whatsapp_cloud",
    channel: "whatsapp",
    name: "WhatsApp Business (Twilio)",
    capabilities: [
      "Enviar mensajes desde la ficha de la oferta sin salir del CRM",
      "Recibir las respuestas del cliente en la misma conversación",
      "Cada mensaje se registra automáticamente como actividad de WhatsApp",
    ],
    requiredSecrets: [
      "Estamos en el sandbox de Twilio: el cliente debe unirse enviando el código de acceso al número del sandbox",
      "Para escribir fuera de las 24 h desde su último mensaje hace falta una plantilla aprobada",
      "Para producción, un número de WhatsApp verificado a tu nombre",
    ],
    plannedEndpoints: ["whatsapp-send", "whatsapp-webhook"],
    status: "not_configured",
  },

  {
    id: "email_sync",
    channel: "email",
    name: "Email transaccional y sincronización de bandeja",
    capabilities: [
      "Enviar correos desde el CRM con plantillas",
      "Recibir respuestas y sincronizarlas en el historial",
      "Seguimiento de aperturas y entregas",
    ],
    requiredSecrets: [
      "Proveedor de envío (Resend/Brevo) y dominio verificado",
      "OAuth de Gmail o Microsoft 365 para sincronizar la bandeja",
    ],
    plannedEndpoints: ["email-send", "email-webhook", "email-sync"],
    status: "not_configured",
  },
  {
    id: "telephony",
    channel: "call",
    name: "Telefonía / VoIP",
    capabilities: [
      "Lanzar llamadas desde el CRM (click-to-call)",
      "Registrar duración, resultado y grabación",
      "Recibir llamadas entrantes asociadas al contacto",
    ],
    requiredSecrets: [
      "Proveedor de voz (Twilio Voice, Aircall o similar)",
      "Número saliente y webhook de estado de llamada",
    ],
    plannedEndpoints: ["call-start", "call-webhook"],
    status: "not_configured",
  },
];
