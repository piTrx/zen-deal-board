import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, MessageCircle, RefreshCw, Bot } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TelegramMessage {
  update_id: number;
  chat_id: number;
  user_id: number | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  chat_title: string | null;
  text: string | null;
  raw_update: any;
  created_at: string;
}

function useTelegramMessages() {
  return useQuery({
    queryKey: ["telegram_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("telegram_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as TelegramMessage[];
    },
  });
}

function useSendTelegramMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chat_id, text }: { chat_id: string | number; text: string }) => {
      const { data, error } = await supabase.functions.invoke("telegram-send", {
        body: { chat_id, text },
      });
      if (error) {
        const details = error instanceof Error ? error.message : String(error);
        throw new Error(details);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram_messages"] });
      toast.success("Mensaje enviado");
    },
    onError: (err: Error) => {
      toast.error("No se pudo enviar el mensaje", { description: err.message });
    },
  });
}

function groupByChat(messages: TelegramMessage[]) {
  const map = new Map<number, TelegramMessage[]>();
  for (const m of messages) {
    const list = map.get(m.chat_id) ?? [];
    list.push(m);
    map.set(m.chat_id, list);
  }
  return new Map([...map.entries()].sort((a, b) => {
    const aLast = a[1][0]?.created_at ?? "";
    const bLast = b[1][0]?.created_at ?? "";
    return bLast.localeCompare(aLast);
  }));
}

export default function Telegram() {
  const { data: messages, isLoading, refetch } = useTelegramMessages();
  const sendMessage = useSendTelegramMessage();
  const [chatId, setChatId] = useState("");
  const [text, setText] = useState("");
  const [activeChat, setActiveChat] = useState<number | null>(null);

  const chats = messages ? groupByChat(messages) : new Map<number, TelegramMessage[]>();
  const activeMessages = activeChat ? (chats.get(activeChat) ?? []) : [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const targetChat = activeChat ?? (chatId ? Number(chatId) : null);
    const messageText = activeChat ? text : text;
    if (!targetChat || !messageText.trim()) return;
    sendMessage.mutate(
      { chat_id: targetChat, text: messageText.trim() },
      {
        onSuccess: () => {
          setText("");
          if (!activeChat) setChatId("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Bot className="h-7 w-7" /> Telegram
        </h1>
        <p className="text-muted-foreground mt-1">
          Recibe mensajes de tu bot y responde desde el CRM.
        </p>
      </div>

      <Tabs defaultValue="chats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="send">Enviar mensaje</TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {chats.size === 0
                ? "Aún no has recibido mensajes. Escribe al bot para que aparezca aquí."
                : `${chats.size} chat${chats.size === 1 ? "" : "s"} activo${chats.size === 1 ? "" : "s"}`}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} /> Actualizar
            </Button>
          </div>

          {activeChat ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      {activeMessages[0]?.chat_title || activeMessages[0]?.username || `Chat ${activeChat}`}
                    </CardTitle>
                    <CardDescription>ID: {activeChat}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveChat(null)}>
                    Volver
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {[...activeMessages].reverse().map((m) => (
                    <div key={m.update_id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {m.username || `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Usuario"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(m.created_at), "d MMM HH:mm", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{m.text || <span className="italic text-muted-foreground">(mensaje sin texto)</span>}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSend} className="flex gap-2">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe una respuesta..."
                    className="min-h-[60px] flex-1"
                    rows={2}
                  />
                  <Button type="submit" disabled={sendMessage.isPending || !text.trim()} className="self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(chats.entries()).map(([chatId, msgs]) => {
                const last = msgs[0];
                return (
                  <Card
                    key={chatId}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setActiveChat(chatId)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {last?.chat_title || last?.username || `Chat ${chatId}`}
                      </CardTitle>
                      <CardDescription className="text-xs">{msgs.length} mensaje{msgs.length === 1 ? "" : "s"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{last?.text || "Mensaje sin texto"}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Último: {last ? format(new Date(last.created_at), "d MMM HH:mm", { locale: es }) : "—"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Enviar mensaje</CardTitle>
              <CardDescription>
                Escribe el ID del chat y el texto. Puedes copiar el ID desde cualquier mensaje recibido.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chat-id">Chat ID</Label>
                  <Input
                    id="chat-id"
                    type="text"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="p. ej. 123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message-text">Mensaje</Label>
                  <Textarea
                    id="message-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe aquí tu mensaje..."
                    rows={4}
                  />
                </div>
                <Button type="submit" disabled={sendMessage.isPending || !chatId || !text.trim()}>
                  <Send className="h-4 w-4 mr-1" /> Enviar
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="rounded-md border border-muted p-3 text-sm text-muted-foreground">
        <p>
          <Badge variant="outline" className="mr-2">Conectado</Badge>
          El bot está vinculado. Para probarlo, envía un mensaje a tu bot en Telegram y vuelve a esta pantalla.
        </p>
      </div>
    </div>
  );
}
