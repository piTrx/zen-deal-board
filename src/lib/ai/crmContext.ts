/**
 * Resumen de los datos del CRM que se pasa al modelo como contexto.
 *
 * Se lee con la sesión del usuario, así que el modelo solo ve lo que esa
 * persona ya puede ver en la aplicación (los permisos de la base de datos son
 * los mismos). Es solo lectura: nada de esto se modifica ni se guarda.
 */
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";

export interface CrmSnapshot {
  /** Texto compacto listo para meter en el aviso del sistema. */
  prompt: string;
  dealCount: number;
  activityCount: number;
}

interface DealRow {
  id: string;
  title: string;
  value: number;
  probability: number;
  close_date: string | null;
  stage_id: string;
  created_at: string;
  companies: { name: string } | null;
  contacts: { first_name: string; last_name: string } | null;
}

interface ActivityRow {
  id: string;
  type: string;
  title: string;
  created_at: string;
  deals: { title: string } | null;
  contacts: { first_name: string; last_name: string } | null;
}

function shortDate(iso: string | null): string {
  if (!iso) return "sin fecha";
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function relative(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  return `hace ${Math.round(days / 30)} meses`;
}

/**
 * Construye el resumen. `maxDeals` y `maxActivities` limitan lo que se envía al
 * modelo para que la respuesta no tarde de más en un equipo normal.
 */
export async function buildCrmSnapshot(maxDeals = 60, maxActivities = 40): Promise<CrmSnapshot> {
  const [{ data: pipelines }, { data: stages }, { data: deals }, { data: activities }] =
    await Promise.all([
      supabase.from("pipelines").select("id, name").order("created_at"),
      supabase.from("pipeline_stages").select("id, name, pipeline_id, position").order("position"),
      supabase
        .from("deals")
        .select("id, title, value, probability, close_date, stage_id, created_at, companies(name), contacts(first_name, last_name)")
        .order("updated_at", { ascending: false })
        .limit(maxDeals),
      supabase
        .from("activities")
        .select("id, type, title, created_at, deals(title), contacts(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(maxActivities),
    ]);

  const stageName = (id: string) =>
    (stages ?? []).find((s) => s.id === id)?.name ?? "etapa desconocida";
  const pipelineOf = (stageId: string) => {
    const stage = (stages ?? []).find((s) => s.id === stageId);
    return (pipelines ?? []).find((p) => p.id === stage?.pipeline_id)?.name ?? "pipeline";
  };

  const lines: string[] = [];
  lines.push(`Fecha de hoy: ${new Date().toLocaleDateString("es-ES")}.`);

  const pipelineNames = (pipelines ?? []).map((p) => p.name);
  if (pipelineNames.length) lines.push(`Pipelines: ${pipelineNames.join(", ")}.`);

  lines.push(`\nOfertas (${(deals ?? []).length}):`);
  for (const d of deals ?? []) {
    const who = d.contacts ? `${d.contacts.first_name} ${d.contacts.last_name}` : "sin contacto";
    const company = d.companies?.name ?? "sin empresa";
    lines.push(
      `- "${d.title}" | ${pipelineOf(d.stage_id)} / ${stageName(d.stage_id)} | ` +
        `${formatCurrency(Number(d.value || 0))} | ${d.probability}% | cierre ${shortDate(d.close_date)} | ` +
        `${company} | contacto ${who}`
    );
  }

  lines.push(`\nÚltimas actividades (${(activities ?? []).length}):`);
  for (const a of activities ?? []) {
    const subject = a.deals?.title ?? a.contacts?.first_name ?? "sin vínculo";
    lines.push(`- [${a.type}] ${a.title} (${subject}) ${relative(a.created_at)}`);
  }

  return {
    prompt: lines.join("\n"),
    dealCount: (deals ?? []).length,
    activityCount: (activities ?? []).length,
  };
}

export const ASSISTANT_SYSTEM_PROMPT =
  "Eres el asistente de un CRM de ventas. Respondes en español, de forma clara y breve, " +
  "con listas cuando ayude y citando nombres e importes tales como aparecen en los datos. " +
  "Si algo no está en los datos que se te pasan, dilo en lugar de inventarlo. " +
  "Nunca inventes ofertas, personas, fechas ni cantidades.";
