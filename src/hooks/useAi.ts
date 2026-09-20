import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  AiConfig,
  appOrigins,
  defaultConfig,
  loadAiConfig,
  ollamaAuthCommand,
  saveAiConfig,
} from "@/lib/ai/config";
import { listModels, pingOllama } from "@/lib/ai/ollama";

export type AiStatus =
  | { state: "checking" }
  | { state: "ready" }
  | { state: "down"; error: string; hints: string[] }
  | { state: "model_missing"; error: string; hints: string[] };

/**
 * Configuración del asistente y estado de la conexión con el modelo.
 * Todo se guarda en este navegador: la dirección del modelo depende del equipo.
 */
export function useAiConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AiConfig>(() => loadAiConfig(user?.id));

  useEffect(() => {
    setConfig(loadAiConfig(user?.id));
  }, [user?.id]);

  const update = useCallback(
    (patch: Partial<AiConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...patch };
        if (user?.id) saveAiConfig(user.id, next);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
    },
    [queryClient, user?.id]
  );

  const origins = useMemo(() => (typeof window === "undefined" ? [] : appOrigins()), []);
  const authCommand = useMemo(() => ollamaAuthCommand(origins), [origins]);

  return { config, update, origins, authCommand, defaultConfig };
}

/** Comprueba si el modelo responde y si el modelo elegido está instalado. */
export function useAiStatus(config: AiConfig) {
  const query = useQuery({
    queryKey: ["ai-status", config.provider, config.baseUrl, config.model],
    queryFn: async () => {
      if (config.provider !== "ollama") {
        return { ok: false, error: "Los modelos en la nube aún no están conectados.", hints: [] };
      }
      const reachable = await pingOllama(config.baseUrl);
      if (!reachable) {
        return {
          ok: false,
          error: "No he podido hablar con Ollama.",
          hints: [
            "Ejecuta `ollama serve` o abre la aplicación de Ollama.",
            "Comprueba la dirección en Ajustes → IA.",
          ],
        };
      }
      const hasModel = await pingOllama(config.baseUrl, config.model);
      if (!hasModel) {
        return {
          ok: false,
          error: `El modelo "${config.model}" no está instalado.`,
          hints: [`Descárgalo con \`ollama pull ${config.model}\``, "O elige otro de la lista."],
        };
      }
      return { ok: true, error: "", hints: [] };
    },
    staleTime: 30_000,
    retry: false,
  });

  const status: AiStatus = useMemo(() => {
    if (query.isPending) return { state: "checking" };
    if (query.error) {
      return {
        state: "down",
        error: query.error instanceof Error ? query.error.message : "Fallo desconocido",
        hints: [],
      };
    }
    const data = query.data!;
    if (!data.ok) {
      return { state: "down", error: data.error, hints: data.hints };
    }
    return { state: "ready" };
  }, [query.isPending, query.error, query.data]);

  return { status, refetch: query.refetch, isFetching: query.isFetching };
}

/** Modelos instalados en el equipo. */
export function useAiModels(config: AiConfig) {
  return useQuery({
    queryKey: ["ai-models", config.baseUrl],
    queryFn: () => listModels(config.baseUrl),
    enabled: config.provider === "ollama",
    retry: false,
    staleTime: 60_000,
  });
}
