/**
 * Capa de conexión con Ollama.
 *
 * Ollama corre en el equipo del usuario y escucha en http://localhost:11434.
 * Es el navegador quien le escribe directamente, así que aquí solo interesan
 * tres cosas: saber si responde, qué modelos tiene instalados y generar texto
 * de forma progresiva. Los errores técnicos se traducen a mensajes claros.
 */

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type AiErrorKind =
  | "not_running"
  | "blocked_by_browser"
  | "model_missing"
  | "bad_request"
  | "aborted"
  | "unknown";

export class AiError extends Error {
  kind: AiErrorKind;
  /** Pasos concretos para arreglarlo, en lenguaje claro. */
  hints: string[];

  constructor(kind: AiErrorKind, message: string, hints: string[] = []) {
    super(message);
    this.name = "AiError";
    this.kind = kind;
    this.hints = hints;
  }
}

/** Traduce un fallo de red a un diagnóstico entendible. */
function classifyNetworkError(err: unknown, baseUrl: string): AiError {
  if (err instanceof DOMException && err.name === "AbortError") {
    return new AiError("aborted", "La generación se ha detenido.", []);
  }
  const message = err instanceof Error ? err.message : String(err);
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return new AiError(
      "not_running",
      "No he podido hablar con Ollama.",
      [
        "Comprueba que Ollama esté funcionando: ejecuta `ollama serve` o abre la aplicación de Ollama.",
        `Que la dirección ${baseUrl} sea correcta (se cambia en Ajustes → IA).`,
        "Si Ollama está en otra máquina, escribe ahí su dirección en lugar de localhost.",
      ]
    );
  }
  return new AiError("unknown", `Ha fallado la conexión con el modelo: ${message}`, [
    "Revisa el mensaje de la pantalla de Ajustes → IA.",
  ]);
}

/** `true` si el modelo está disponible (o si el propio modelo dice que no existe). */
export async function pingOllama(baseUrl: string, model?: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { method: "GET" });
    if (!res.ok) return false;
    if (!model) return true;
    const json = (await res.json()) as { models?: { name: string }[] };
    const names = (json.models ?? []).map((m) => m.name);
    return names.some((n) => n === model || n.split(":")[0] === model.split(":")[0]);
  } catch {
    return false;
  }
}

/** Modelos instalados en el equipo. */
export async function listModels(baseUrl: string): Promise<string[]> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/tags`, { method: "GET" });
  } catch (err) {
    throw classifyNetworkError(err, baseUrl);
  }
  if (!res.ok) {
    throw new AiError("bad_request", `Ollama ha respondido con el código ${res.status}.`, [
      "Revisa la dirección del servidor en Ajustes → IA.",
    ]);
  }
  const json = (await res.json()) as { models?: { name: string; size?: number }[] };
  return (json.models ?? [])
    .map((m) => m.name)
    .sort((a, b) => a.localeCompare(b));
}

interface StreamOptions {
  baseUrl: string;
  model: string;
  messages: OllamaChatMessage[];
  /** Se llama con cada trozo de texto generado. */
  onToken: (chunk: string) => void;
  /** Permite cancelar desde un botón. */
  signal?: AbortSignal;
}

/**
 * Genera texto con el modelo, entregándolo poco a poco.
 * No lleva temporizador de cancelación: un modelo grande puede tardar un rato.
 */
export async function streamOllamaChat({
  baseUrl,
  model,
  messages,
  onToken,
  signal,
}: StreamOptions): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
      signal,
    });
  } catch (err) {
    throw classifyNetworkError(err, baseUrl);
  }

  if (res.status === 404) {
    throw new AiError("model_missing", `El modelo "${model}" no está instalado en este equipo.`, [
      "Mira cuáles tienes ejecutando `ollama list` en la terminal.",
      `Descarga uno con \`ollama pull ${model}\`.`,
      "O elige otro en Ajustes → IA.",
    ]);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (/model .* not found|does not exist/i.test(text)) {
      throw new AiError("model_missing", `El modelo "${model}" no está instalado en este equipo.`, [
        `Descárgalo con \`ollama pull ${model}\` o elige otro en Ajustes → IA.`,
      ]);
    }
    throw new AiError("bad_request", `El modelo ha devuelto un error (código ${res.status}).`, [
      text.slice(0, 200),
    ]);
  }
  if (!res.body) {
    throw new AiError("unknown", "El modelo no ha devuelto contenido.", []);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Ollama responde líneas JSON (NDJSON).
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let parsed: { message?: { content?: string }; error?: string };
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        continue;
      }
      if (parsed.error) {
        throw new AiError("model_missing", `El modelo ha devuelto: ${parsed.error}`, [
          `Descarga el modelo con \`ollama pull ${model}\`.`,
        ]);
      }
      const chunk = parsed.message?.content;
      if (chunk) {
        full += chunk;
        onToken(chunk);
      }
    }
  }

  return full;
}
