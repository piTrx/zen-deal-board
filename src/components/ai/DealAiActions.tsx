import { useRef, useState } from "react";
import { Deal } from "@/hooks/useDeals";
import { Activity } from "@/hooks/useActivities";
import { useAuth } from "@/contexts/AuthContext";
import { useAiConfig, useAiStatus } from "@/hooks/useAi";
import { generateText } from "@/lib/ai/generate";
import { AiError } from "@/lib/ai/ollama";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCreateActivity } from "@/hooks/useActivities";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, FileText, Copy, Save, Loader2, Square, TriangleAlert } from "lucide-react";

interface DealAiActionsProps {
  deal: Deal;
  activities: Activity[];
  contactName?: string;
  stageName?: string;
}

type Mode = "summary" | "followup";

function buildContext(deal: Deal, activities: Activity[], contactName?: string, stageName?: string) {
  const lines = [
    `Oferta: "${deal.title}"`,
    `Importe: ${formatCurrency(Number(deal.value || 0))} · Probabilidad: ${deal.probability}%`,
    `Etapa: ${stageName ?? "sin etapa"}`,
    `Empresa: ${deal.companies?.name ?? "sin empresa"}`,
    `Contacto: ${contactName ?? "sin contacto"}`,
    `Cierre previsto: ${deal.close_date ? new Date(deal.close_date).toLocaleDateString("es-ES") : "sin fecha"}`,
    deal.notes ? `Notas: ${deal.notes.slice(0, 500)}` : "",
    activities.length
      ? `Actividades registradas (${activities.length}):\n` +
        activities
          .slice(0, 12)
          .map((a) => `- [${a.type}] ${a.title} (${new Date(a.created_at).toLocaleDateString("es-ES")})`)
          .join("\n")
      : "Sin actividades registradas.",
  ];
  return lines.filter(Boolean).join("\n");
}

const INSTRUCTIONS: Record<Mode, string> = {
  summary:
    "Resume la situación de esta oferta en español: en qué punto está, qué es lo último que se sabe, " +
    "qué riesgo ves y cuál debería ser el siguiente paso. Máximo 6 líneas, sin preámbulos.",
  followup:
    "Redacta un mensaje corto de seguimiento para este cliente, en español, cercano y profesional, " +
    "sin saludos genéricos ni firmas. Máximo 5 líneas. Devuelve solo el texto del mensaje, sin explicaciones.",
};

export function DealAiActions({ deal, activities, contactName, stageName }: DealAiActionsProps) {
  const { user } = useAuth();
  const { config } = useAiConfig();
  const { status } = useAiStatus(config);
  const createActivity = useCreateActivity();
  const { toast } = useToast();

  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<{ message: string; hints: string[] } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ready = status.state === "ready";
  const disabledReason =
    status.state === "checking"
      ? "Comprobando la conexión con el modelo…"
      : status.state === "down" || status.state === "model_missing"
      ? status.error
      : "";

  const run = async (next: Mode) => {
    if (!ready || running) return;
    setMode(next);
    setError(null);
    setOutput("");
    setRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const messages = [
      {
        role: "system" as const,
        content:
          "Eres un asistente de ventas de un CRM. Respondes siempre en español, sin inventar datos.\n\n" +
          buildContext(deal, activities, contactName, stageName),
      },
      { role: "user" as const, content: INSTRUCTIONS[next] },
    ];

    try {
      await generateText({
        config,
        messages,
        signal: controller.signal,
        onToken: (chunk) => setOutput((prev) => prev + chunk),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        toast({ title: "Generación detenida" });
      } else if (err instanceof AiError) {
        setError({ message: err.message, hints: err.hints });
      } else {
        setError({
          message: err instanceof Error ? err.message : "El modelo no ha respondido",
          hints: [],
        });
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast({ title: "Copiado al portapapeles" });
    } catch {
      toast({ title: "Tu navegador no ha permitido copiar", variant: "destructive" });
    }
  };

  const saveAsActivity = () => {
    if (!user || !output.trim()) return;
    createActivity.mutate(
      {
        deal_id: deal.id,
        contact_id: deal.contact_id,
        company_id: deal.company_id,
        user_id: user.id,
        type: "note",
        title: mode === "followup" ? "Borrador de seguimiento (IA)" : "Resumen de la oferta (IA)",
        description: output,
      },
      {
        onSuccess: () => {
          toast({ title: "Guardado como actividad" });
          setOutput("");
          setMode(null);
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold mb-2">Asistente</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => run("summary")}
            disabled={!ready || running}
            title={disabledReason}
          >
            {running && mode === "summary" ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1" />
            )}
            Resumir
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => run("followup")}
            disabled={!ready || running}
            title={disabledReason}
          >
            {running && mode === "followup" ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5 mr-1" />
            )}
            Redactar seguimiento
          </Button>
          {running && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => abortRef.current?.abort()}
            >
              <Square className="h-3.5 w-3.5 mr-1" /> Detener
            </Button>
          )}
        </div>
        {!ready && (
          <p className="text-xs text-muted-foreground mt-2">
            {status.state === "checking"
              ? "El asistente está comprobando la conexión con tu modelo."
              : `${status.error} Arréglalo en Ajustes → IA.`}
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>{error.message}</AlertTitle>
          {error.hints.length > 0 && (
            <AlertDescription>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                {error.hints.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </AlertDescription>
          )}
        </Alert>
      )}

      {output && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              rows={mode === "followup" ? 5 : 7}
              className="text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={copy}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
              </Button>
              <Button size="sm" onClick={saveAsActivity} disabled={createActivity.isPending}>
                <Save className="h-3.5 w-3.5 mr-1" /> Guardar como actividad
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setOutput(""); setMode(null); }}>
                Descartar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
