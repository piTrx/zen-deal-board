/**
 * Configuración del proveedor de IA.
 *
 * Se guarda en este navegador (no en la base de datos) porque la dirección del
 * modelo depende del equipo: "localhost" solo tiene sentido en la máquina donde
 * corre Ollama. Cada usuario de la cuenta tiene su propia configuración.
 */

export const DEFAULT_OLLAMA_URL = "http://localhost:11434";
export const DEFAULT_MODEL = "llama3.2";

export interface AiConfig {
  /** "ollama" (modelo local) | "cloud" (modelos de Lovable AI). */
  provider: "ollama" | "cloud";
  baseUrl: string;
  model: string;
}

const storageKey = (userId: string) => `dealflow.ai.config.${userId}`;

export const defaultConfig: AiConfig = {
  provider: "ollama",
  baseUrl: DEFAULT_OLLAMA_URL,
  model: DEFAULT_MODEL,
};

export function loadAiConfig(userId?: string | null): AiConfig {
  if (typeof window === "undefined" || !userId) return defaultConfig;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return defaultConfig;
    const parsed = JSON.parse(raw) as Partial<AiConfig>;
    return {
      provider: parsed.provider === "cloud" ? "cloud" : "ollama",
      baseUrl: (parsed.baseUrl || DEFAULT_OLLAMA_URL).replace(/\/+$/, ""),
      model: parsed.model || DEFAULT_MODEL,
    };
  } catch {
    return defaultConfig;
  }
}

export function saveAiConfig(userId: string, config: AiConfig) {
  try {
    window.localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ ...config, baseUrl: config.baseUrl.replace(/\/+$/, "") })
    );
  } catch {
    /* Almacenamiento no disponible: la configuración se mantiene en memoria. */
  }
}

/**
 * Origen que hay que autorizar en Ollama para que el CRM pueda escribirle.
 * En desarrollo el CRM se abre desde otra dirección (localhost:8080).
 */
export function appOrigins(): string[] {
  const origins = new Set<string>([window.location.origin]);
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    origins.add(`${window.location.protocol}//${window.location.hostname}:8080`);
  }
  return [...origins];
}

/** Comando listo para pegar en la terminal y autorizar al CRM. */
export function ollamaAuthCommand(origins: string[]): string {
  return `OLLAMA_ORIGINS="${origins.join(",")}" ollama serve`;
}
