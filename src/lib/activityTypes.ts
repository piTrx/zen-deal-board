import { Phone, Mail, Calendar, FileText, MessageCircle, MapPin, LucideIcon } from "lucide-react";

export type ActivityType = "call" | "email" | "meeting" | "note" | "whatsapp" | "visit";

interface ActivityTypeConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
  labelPlural: string;
  emoji: string;
}

export const activityTypeConfig: Record<ActivityType, ActivityTypeConfig> = {
  call: { icon: Phone, color: "text-blue-500", bg: "bg-blue-50", label: "Llamada", labelPlural: "Llamadas", emoji: "📞" },
  email: { icon: Mail, color: "text-purple-500", bg: "bg-purple-50", label: "Correo", labelPlural: "Correos", emoji: "📧" },
  whatsapp: { icon: MessageCircle, color: "text-emerald-500", bg: "bg-emerald-50", label: "WhatsApp", labelPlural: "WhatsApp", emoji: "💬" },
  meeting: { icon: Calendar, color: "text-orange-500", bg: "bg-orange-50", label: "Reunión", labelPlural: "Reuniones", emoji: "📅" },
  visit: { icon: MapPin, color: "text-rose-500", bg: "bg-rose-50", label: "Visita", labelPlural: "Visitas", emoji: "📍" },
  note: { icon: FileText, color: "text-green-500", bg: "bg-green-50", label: "Nota", labelPlural: "Notas", emoji: "📝" },
};

export const activityTypes = Object.keys(activityTypeConfig) as ActivityType[];

export function getActivityConfig(type: string) {
  return activityTypeConfig[type as ActivityType] ?? activityTypeConfig.note;
}
