import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateActivity } from "@/hooks/useActivities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Mail, Phone, Loader2 } from "lucide-react";
import {
  CommunicationChannel,
  buildMailtoUrl,
  buildTelUrl,
  buildWhatsAppUrl,
  channelLabel,
  channelToActivityType,
  isValidEmail,
  missingDataMessage,
  normalizePhone,
  recipientForChannel,
} from "@/lib/communications";

interface CommunicationActionsProps {
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  email?: string | null;
  phone?: string | null;
  contactName?: string;
  /** Contexto por defecto para el asunto (p. ej. el título del deal). */
  subjectHint?: string;
  className?: string;
}

export function CommunicationActions({
  contactId,
  companyId,
  dealId,
  email,
  phone,
  contactName,
  subjectHint,
  className,
}: CommunicationActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createActivity = useCreateActivity();

  const [channel, setChannel] = useState<CommunicationChannel | null>(null);
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");

  const normalizedPhone = normalizePhone(phone);
  const hasEmail = isValidEmail(email);

  const openChannel = (c: CommunicationChannel) => {
    const recipient = recipientForChannel(c, { email, phone });
    if (!recipient) {
      toast({ title: "Falta información de contacto", description: missingDataMessage[c], variant: "destructive" });
      return;
    }

    const defaultSubject = subjectHint
      ? `${channelLabel[c]} sobre ${subjectHint}`
      : `${channelLabel[c]} con ${contactName || recipient}`;

    if (c === "whatsapp") {
      window.open(buildWhatsAppUrl(normalizedPhone!, subjectHint ? `Hola, te escribo sobre ${subjectHint}.` : undefined), "_blank", "noopener");
    } else if (c === "email") {
      window.open(buildMailtoUrl(email!.trim(), subjectHint || undefined), "_self");
    } else {
      window.open(buildTelUrl(normalizedPhone!), "_self");
    }

    setSubject(defaultSubject);
    setNotes("");
    setChannel(c);
  };

  const handleLog = () => {
    if (!user || !channel) return;
    const recipient = recipientForChannel(channel, { email, phone });
    createActivity.mutate(
      {
        user_id: user.id,
        type: channelToActivityType[channel],
        title: subject.trim() || channelLabel[channel],
        description: notes.trim() || null,
        contact_id: contactId || null,
        company_id: companyId || null,
        deal_id: dealId || null,
        recipient,
        occurred_at: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          toast({ title: "Interacción registrada" });
          setChannel(null);
        },
        onError: (e: any) => toast({ title: "No se pudo registrar", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className || ""}`}>
        <Button size="sm" variant="outline" onClick={() => openChannel("whatsapp")} disabled={!normalizedPhone} title={!normalizedPhone ? missingDataMessage.whatsapp : undefined}>
          <MessageCircle className="h-4 w-4 mr-1 text-emerald-500" /> WhatsApp
        </Button>
        <Button size="sm" variant="outline" onClick={() => openChannel("email")} disabled={!hasEmail} title={!hasEmail ? missingDataMessage.email : undefined}>
          <Mail className="h-4 w-4 mr-1 text-purple-500" /> Enviar email
        </Button>
        <Button size="sm" variant="outline" onClick={() => openChannel("call")} disabled={!normalizedPhone} title={!normalizedPhone ? missingDataMessage.call : undefined}>
          <Phone className="h-4 w-4 mr-1 text-blue-500" /> Llamar
        </Button>
      </div>
      {(!normalizedPhone || !hasEmail) && (
        <p className="mt-2 text-xs text-muted-foreground">
          {!normalizedPhone && !hasEmail
            ? "Falta el teléfono y el correo de este contacto."
            : !normalizedPhone
            ? "Falta el teléfono de este contacto."
            : "Falta el correo de este contacto."}
        </p>
      )}

      <Dialog open={!!channel} onOpenChange={(o) => !o && setChannel(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar {channel ? channelLabel[channel].toLowerCase() : ""}</DialogTitle>
            <DialogDescription>
              Se guardará el canal, la fecha y hora, tu usuario y el destinatario
              {channel ? ` (${recipientForChannel(channel, { email, phone })})` : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Asunto o descripción</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Resumen de la conversación, próximos pasos..." />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setChannel(null)}>Ahora no</Button>
              <Button onClick={handleLog} disabled={createActivity.isPending}>
                {createActivity.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar actividad"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
