/**
 * Punto único de generación de texto.
 *
 * Toda la interfaz (asistente, resumen de oferta, redactar seguimiento) llama
 * aquí. Hoy solo existe el proveedor local (Ollama en tu equipo); cuando se
 * conecte un modelo en la nube basta con añadir una rama aquí sin tocar ninguna
 * pantalla.
 */
import { AiConfig } from "./config";
import { OllamaChatMessage, streamOllamaChat } from "./ollama";

export interface GenerateOptions {
  config: AiConfig;
  messages: OllamaChatMessage[];
  onToken: (chunk: string) => void;
  signal?: AbortSignal;
}

export async function generateText({
  config,
  messages,
  onToken,
  signal,
}: GenerateOptions): Promise<string> {
  if (config.provider === "cloud") {
    throw new Error(
      "Los modelos en la nube todavía no están conectados en esta aplicación."
    );
  }
  return streamOllamaChat({
    baseUrl: config.baseUrl,
    model: config.model,
    messages,
    onToken,
    signal,
  });
}
