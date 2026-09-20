import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAiConfig, useAiModels, useAiStatus } from "@/hooks/useAi";
import { DEFAULT_MODEL } from "@/lib/ai/config";
import { CheckCircle2, Copy, RefreshCw, TriangleAlert, Loader2, Terminal } from "lucide-react";
import { toast } from "sonner";

export function AiSettings() {
  const { config, update, authCommand } = useAiConfig();
  const { status, refetch, isFetching } = useAiStatus(config);
  const models = useAiModels(config);

  const [urlDraft, setUrlDraft] = useState(config.baseUrl);
  useEffect(() => setUrlDraft(config.baseUrl), [config.baseUrl]);

  const modelOptions = models.data ?? [];
  useEffect(() => {
    // Si el modelo guardado ya no existe, se propone el primero instalado.
    if (modelOptions.length && !modelOptions.includes(config.model)) {
      update({ model: modelOptions[0] });
    }
  }, [modelOptions, config.model, update]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("Tu navegador no ha permitido copiar. Selecciónalo y cópialo a mano.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <p className="text-sm text-muted-foreground">
        El asistente usa un modelo que se ejecuta en tu propio ordenador con Ollama. Tus datos no
        salen de tu equipo y no hay coste por uso.
      </p>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Conexión</CardTitle>
              <CardDescription className="text-xs">
                Dónde está tu modelo y cuál usa el CRM.
              </CardDescription>
            </div>
            <Badge variant={status.state === "ready" ? "default" : "outline"} className="text-xs shrink-0">
              {status.state === "ready"
                ? "Conectado"
                : status.state === "checking"
                ? "Comprobando…"
                : "Sin conexión"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-url">Dirección de Ollama</Label>
            <div className="flex gap-2">
              <Input
                id="ai-url"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onBlur={() => update({ baseUrl: urlDraft.trim() || "http://localhost:11434" })}
                placeholder="http://localhost:11434"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Volver a comprobar"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              <code>localhost</code> apunta a este equipo. Si Ollama está en otra máquina, pon su
              dirección (por ejemplo <code>http://192.168.1.20:11434</code>).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Modelo</Label>
            {models.isPending ? (
              <p className="text-sm text-muted-foreground">Leyendo modelos instalados…</p>
            ) : modelOptions.length ? (
              <Select value={config.model} onValueChange={(m) => update({ model: m })}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegir modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No he visto modelos instalados. Puedes escribir el nombre de uno a mano.
                </p>
                <Input
                  value={config.model}
                  onChange={(e) => update({ model: e.target.value })}
                  placeholder={DEFAULT_MODEL}
                />
              </div>
            )}
          </div>

          {status.state === "ready" ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
              <span>
                Todo listo: el asistente responde con <strong>{config.model}</strong>.
              </span>
            </div>
          ) : status.state !== "checking" ? (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>{status.error}</AlertTitle>
              {status.hints.length > 0 && (
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    {status.hints.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </AlertDescription>
              )}
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Permitir que el CRM escriba al modelo</CardTitle>
          <CardDescription className="text-xs">
            Ollama solo acepta peticiones de las páginas que tú autorices. Arráncalo con este
            comando y el CRM podrá usarlo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3">
            <Terminal className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <code className="text-xs break-all flex-1">{authCommand}</code>
            <Button variant="ghost" size="sm" className="h-7 shrink-0" onClick={() => copy(authCommand, "Comando")}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Si Ollama ya estaba funcionando, para el proceso y vuelve a arrancarlo con ese comando.
            Después pulsa <em>Volver a comprobar</em> aquí arriba.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Si Ollama no está en tu equipo</CardTitle>
          <CardDescription className="text-xs">
            Instala Ollama y descarga un modelo. Hace falta una vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3">
            <code className="text-xs break-all flex-1">curl -fsSL https://ollama.com/install.sh | sh</code>
            <Button variant="ghost" size="sm" className="h-7 shrink-0" onClick={() => copy("curl -fsSL https://ollama.com/install.sh | sh", "Comando")}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
            </Button>
          </div>
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3">
            <code className="text-xs break-all flex-1">ollama pull {DEFAULT_MODEL}</code>
            <Button variant="ghost" size="sm" className="h-7 shrink-0" onClick={() => copy(`ollama pull ${DEFAULT_MODEL}`, "Comando")}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
            </Button>
          </div>
          <p className="text-xs">
            En Windows y macOS la página oficial tiene el instalador. <strong>{DEFAULT_MODEL}</strong>{" "}
            es ligero y va bien en portátiles; modelos más grandes responden mejor pero van más despacio.
          </p>
        </CardContent>
      </Card>

      <Alert>
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Quien no tenga Ollama no verá el asistente funcionando</AlertTitle>
        <AlertDescription className="text-sm">
          El modelo corre en cada equipo, así que tus compañeros verán "Sin conexión" hasta que
          instalen Ollama o conectemos un modelo en la nube para todo el equipo.
        </AlertDescription>
      </Alert>
    </div>
  );
}
