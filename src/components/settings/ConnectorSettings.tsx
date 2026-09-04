import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plug, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const connectors = [
  { id: "hubspot", name: "HubSpot", description: "Plataforma CRM para ventas, marketing y atención al cliente." },
  { id: "slack", name: "Slack", description: "Envía mensajes e interactúa con espacios de trabajo de Slack." },
  { id: "google_calendar", name: "Google Calendar", description: "Crea y gestiona eventos de Google Calendar." },
  { id: "telegram", name: "Telegram", description: "Plataforma de mensajería con API de bots para interacciones automatizadas." },
  { id: "elevenlabs", name: "ElevenLabs", description: "Generación de voz con IA, texto a voz y voz a texto." },
  { id: "firecrawl", name: "Firecrawl", description: "Herramienta de rastreo, búsqueda y recuperación con IA." },
  { id: "perplexity", name: "Perplexity", description: "Motor de búsqueda y respuestas con IA." },
  { id: "bigquery", name: "BigQuery", description: "Consulta y analiza datos en BigQuery." },
];

export function ConnectorSettings() {
  const handleConnect = (name: string) => {
    toast.info(`Para conectar ${name}, ve a Ajustes del proyecto → Conectores en Lovable.`);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-sm text-muted-foreground">
          Amplía tu CRM con integraciones externas. Conecta servicios de terceros para automatizar flujos de trabajo y sincronizar datos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {connectors.map((c) => (
          <Card key={c.id} className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{c.name}</CardTitle>
                <Badge variant="outline" className="text-xs">Disponible</Badge>
              </div>
              <CardDescription className="text-xs">{c.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="outline" size="sm" className="w-full" onClick={() => handleConnect(c.name)}>
                <Plug className="h-3.5 w-3.5 mr-1" /> Conectar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-md border border-muted p-3 text-sm text-muted-foreground">
        <ExternalLink className="h-4 w-4 mt-0.5 shrink-0" />
        <span>Los conectores se gestionan a través de la plataforma de integraciones de Lovable. Haz clic en "Conectar" en cualquier servicio para empezar.</span>
      </div>
    </div>
  );
}
