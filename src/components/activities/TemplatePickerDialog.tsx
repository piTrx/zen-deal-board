import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: EmailTemplate) => void;
}

export function TemplatePickerDialog({ open, onOpenChange, onSelect }: TemplatePickerDialogProps) {
  const { data: templates } = useEmailTemplates();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Usar plantilla de correo</DialogTitle></DialogHeader>
        {!templates?.length ? (
          <div className="flex flex-col items-center py-8">
            <Mail className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Aún no hay plantillas. Crea una en Ajustes.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {templates.map((t) => (
              <Card key={t.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { onSelect(t); onOpenChange(false); }}>
                <CardContent className="p-3">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">Asunto: {t.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
