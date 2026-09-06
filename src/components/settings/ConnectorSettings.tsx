import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plug, ExternalLink, MessageCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { NavLink } from "react-router-dom";
import { communicationProviders } from "@/lib/communicationProviders";

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
        {connectors.map((c) => {
          const isTelegram = c.id === "telegram";
          return (
            <Card key={c.id} className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge variant={isTelegram ? "default" : "outline"} className="text-xs">
                    {isTelegram ? "Conectado" : "Disponible"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isTelegram ? (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <NavLink to="/telegram">
                      <MessageCircle className="h-3.5 w-3.5 mr-1" /> Abrir bandeja <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </NavLink>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleConnect(c.name)}>
                    <Plug className="h-3.5 w-3.5 mr-1" /> Conectar
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h3 className="text-sm font-semibold">Canales de comunicación</h3>
        <p className="text-sm text-muted-foreground mt-1">
          WhatsApp ya está conectado con Twilio (sandbox): puedes enviar y recibir mensajes desde la ficha de una oferta y
          cada mensaje queda registrado como actividad. El correo y la telefonía siguen abriendo la app del dispositivo y
          requieren contratar estos servicios:
        </p>
        <div className="mt-3 space-y-3">
          {communicationProviders.map((p) => {
            const isWhatsApp = p.channel === "whatsapp";
            return (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <Badge variant={isWhatsApp ? "default" : "outline"} className="text-xs shrink-0">
                    {isWhatsApp ? "Conectado (sandbox)" : "Pendiente de configurar"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0 text-xs text-muted-foreground space-y-2">
                <div>
                  <p className="font-medium text-foreground">Aportará:</p>
                  <ul className="list-disc pl-4">{p.capabilities.map((c) => <li key={c}>{c}</li>)}</ul>
                </div>
                <div>
                  <p className="font-medium text-foreground">Necesitarás:</p>
                  <ul className="list-disc pl-4">{p.requiredSecrets.map((s) => <li key={s}>{s}</li>)}</ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-muted p-3 text-sm text-muted-foreground">
        <ExternalLink className="h-4 w-4 mt-0.5 shrink-0" />
        <span>Los conectores se gestionan a través de la plataforma de integraciones de Lovable. Haz clic en "Conectar" en cualquier servicio para empezar.</span>
      </div>

    </div>
  );
}
