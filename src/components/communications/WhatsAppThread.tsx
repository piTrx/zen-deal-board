import { useState } from "react";
import { useWhatsAppMessages, useSendWhatsApp } from "@/hooks/useWhatsApp";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { normalizePhone } from "@/lib/communications";
import { Loader2, Send, MessageCircle } from "lucide-react";

interface WhatsAppThreadProps {
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  phone?: string | null;
  contactName?: string;
}

export function WhatsAppThread({ contactId, companyId, dealId, phone, contactName }: WhatsAppThreadProps) {
  const { toast } = useToast();
  const { data: messages, isLoading } = useWhatsAppMessages({ dealId, contactId });
  const sendMessage = useSendWhatsApp();
  const [text, setText] = useState("");

  const normalized = normalizePhone(phone);

  const handleSend = () => {
    if (!normalized) {
      toast({ title: "Falta el teléfono", description: "Añade un número al contacto para escribirle por WhatsApp.", variant: "destructive" });
      return;
    }
    if (!text.trim()) return;
    sendMessage.mutate(
      { to: `+${normalized}`, body: text.trim(), deal_id: dealId ?? null, contact_id: contactId ?? null, company_id: companyId ?? null },
      {
        onSuccess: () => {
          setText("");
          toast({ title: "Mensaje enviado por WhatsApp" });
        },
        onError: (e: Error) =>
          toast({ title: "No se pudo enviar", description: e.message, variant: "destructive" }),
      },
    );
  };

  return (
    <div>
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
        <MessageCircle className="h-4 w-4 text-emerald-500" /> Conversación de WhatsApp
      </h4>

      <div className="rounded-md border bg-muted/30 p-3 max-h-72 overflow-y-auto space-y-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : !messages?.length ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay mensajes{contactName ? ` con ${contactName}` : ""}. Escribe abajo para empezar la conversación.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.direction === "outbound" ? "bg-primary text-primary-foreground" : "bg-card border"
                }`}
              >
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                {m.media_url && <p className="text-xs italic opacity-80">Archivo adjunto recibido</p>}
                <p className="text-[10px] opacity-70 mt-1">
                  {new Date(m.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                  {m.direction === "outbound" ? ` · ${m.status}` : ""}
                </p>
                {m.error_message && <p className="text-[10px] text-destructive-foreground/90">No entregado</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-2 flex gap-2">
        <Textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={normalized ? "Escribe un mensaje..." : "Este contacto no tiene teléfono"}
          disabled={!normalized || sendMessage.isPending}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={!normalized || !text.trim() || sendMessage.isPending}>
          {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Cada mensaje enviado o recibido se guarda como actividad de WhatsApp en esta ficha.
      </p>
    </div>
  );
}
