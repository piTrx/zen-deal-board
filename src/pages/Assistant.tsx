import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useAiConfig, useAiStatus } from "@/hooks/useAi";
import { generateText } from "@/lib/ai/generate";
import { AiError } from "@/lib/ai/ollama";
import { OllamaChatMessage } from "@/lib/ai/ollama";
import { ASSISTANT_SYSTEM_PROMPT, buildCrmSnapshot } from "@/lib/ai/crmContext";
import { Bot, Plus, TriangleAlert } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "¿Qué ofertas están estancadas?",
  "Resume la situación del pipeline",
  "¿Qué debo hacer hoy?",
];

const chatKey = (userId: string) => `dealflow.ai.chat.${userId}`;

function loadHistory(userId?: string): ChatMessage[] {
  if (!userId) return [];
  try {
    const raw = window.localStorage.getItem(chatKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export default function Assistant() {
  const { user } = useAuth();
  const { config } = useAiConfig();
  const { status } = useAiStatus(config);

  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory(user?.id));
  const [phase, setPhase] = useState<"idle" | "sending" | "streaming">("idle");
  const [error, setError] = useState<{ message: string; hints: string[] } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages(loadHistory(user?.id));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      window.localStorage.setItem(chatKey(user.id), JSON.stringify(messages));
    } catch {
      /* el navegador ha bloqueado el almacenamiento: seguimos sin historial */
    }
  }, [messages, user?.id]);

  const busy = phase !== "idle";
  const chatStatus = phase === "sending" ? "submitted" : phase === "streaming" ? "streaming" : "ready";

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      setError(null);
      const history = [...messages, { role: "user" as const, content: trimmed }];
      setMessages(history);
      setPhase("sending");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const snapshot = await buildCrmSnapshot();
        const payload: OllamaChatMessage[] = [
          { role: "system", content: `${ASSISTANT_SYSTEM_PROMPT}\n\nDatos del CRM:\n${snapshot.prompt}` },
          ...history.map((m) => ({ role: m.role, content: m.content })),
        ];

        let answer = "";
        await generateText({
          config,
          messages: payload,
          signal: controller.signal,
          onToken: (chunk) => {
            answer += chunk;
            setPhase("streaming");
            setMessages([...history, { role: "assistant", content: answer }]);
          },
        });

        if (!answer.trim()) {
          setMessages([
            ...history,
            { role: "assistant", content: "El modelo no ha devuelto texto. Vuelve a intentarlo." },
          ]);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setMessages((prev) =>
            prev[prev.length - 1]?.role === "assistant" && !prev[prev.length - 1].content
              ? prev.slice(0, -1)
              : prev
          );
        } else if (err instanceof AiError) {
          setError({ message: err.message, hints: err.hints });
        } else {
          setError({
            message: err instanceof Error ? err.message : "El modelo no ha respondido",
            hints: [],
          });
        }
      } finally {
        setPhase("idle");
        abortRef.current = null;
      }
    },
    [busy, config, messages]
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    if (user?.id) window.localStorage.removeItem(chatKey(user.id));
  }, [user?.id]);

  const header = useMemo(
    () => (
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asistente</h1>
          <p className="text-sm text-muted-foreground">
            Preguntas sobre tus ofertas y actividades. Se responde en tu equipo con{" "}
            <strong>{config.model}</strong>.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={clear} disabled={!messages.length}>
          <Plus className="h-4 w-4 mr-1" /> Nueva conversación
        </Button>
      </div>
    ),
    [clear, config.model, messages.length]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {header}

      {status.state !== "ready" && (
        <Alert variant="destructive" className="mb-4 shrink-0">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>
            {status.state === "checking" ? "Comprobando tu modelo…" : "El asistente no puede responder"}
          </AlertTitle>
          <AlertDescription className="text-sm">
            {status.error}
            {status.state !== "checking" && (
              <>
                {" "}
                Revisa los pasos en{" "}
                <Link to="/settings?tab=ia" className="underline font-medium">
                  Ajustes → IA
                </Link>
                .
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
          <Conversation className="flex-1 min-h-0">
            <ConversationContent className="p-4 gap-4">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<Bot className="h-8 w-8 text-muted-foreground" />}
                  title="Pregunta lo que quieras sobre tus ventas"
                  description="El asistente solo ve las ofertas y actividades a las que ya tienes acceso."
                />
              ) : (
                messages.map((m, i) => (
                  <Message key={i} from={m.role}>
                    <MessageContent>
                      {m.role === "assistant" ? (
                        m.content ? (
                          <MessageResponse>{m.content}</MessageResponse>
                        ) : phase === "sending" ? (
                          <Shimmer className="text-sm" duration={1.6}>
                            Pensando…
                          </Shimmer>
                        ) : null
                      ) : (
                        m.content
                      )}
                    </MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {error && (
            <div className="px-4 pb-2">
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
            </div>
          )}

          <div className="p-3 border-t shrink-0">
            {!messages.length && (
              <div className="flex flex-wrap gap-2 mb-2">
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="text-xs font-normal"
                    disabled={busy || status.state !== "ready"}
                    onClick={() => send(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            )}
            <PromptInput
              onSubmit={(message) => send(message.text)}
              className="w-full"
            >
              <PromptInputTextarea
                placeholder="Escribe tu pregunta…"
                autoFocus
                className="min-h-16"
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit
                  status={chatStatus}
                  disabled={status.state !== "ready"}
                  onStop={() => abortRef.current?.abort()}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
