import { activityTypes, activityTypeConfig, ActivityType } from "@/lib/activityTypes";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateActivity } from "@/hooks/useActivities";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TemplatePickerDialog } from "@/components/activities/TemplatePickerDialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText } from "lucide-react";

interface LogActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDealId?: string;
  defaultContactId?: string;
}

export function LogActivityDialog({ open, onOpenChange, defaultDealId, defaultContactId }: LogActivityDialogProps) {
  const { user } = useAuth();
  const createActivity = useCreateActivity();
  const { toast } = useToast();

  const [type, setType] = useState<ActivityType>("note");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    createActivity.mutate(
      {
        user_id: user.id,
        type,
        title,
        description: description || null,
        deal_id: defaultDealId || null,
        contact_id: defaultContactId || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Actividad registrada" });
          onOpenChange(false);
          setTitle(""); setDescription(""); setType("note");
        },
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar actividad</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activityTypes.map((t) => (
                    <SelectItem key={t} value={t}>{activityTypeConfig[t].emoji} {activityTypeConfig[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Título *</Label>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setTemplatePickerOpen(true)}>
                  <FileText className="h-3 w-3 mr-1" /> Usar plantilla
                </Button>
              </div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="p. ej. Llamada de seguimiento" required />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={createActivity.isPending}>
                {createActivity.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar actividad"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <TemplatePickerDialog
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onSelect={(template) => {
          setTitle(template.subject);
          setDescription(template.body);
          setType("email");
        }}
      />
    </>
  );
}
