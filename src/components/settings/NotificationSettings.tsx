import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const notificationTypes = [
  { key: "deal_assigned", label: "Deal asignado a mí" },
  { key: "mentions", label: "Alguien me menciona" },
  { key: "stage_changes", label: "Cambios de etapa del deal" },
  { key: "close_reminders", label: "Recordatorios de fecha de cierre" },
];

export function NotificationSettings() {
  return (
    <div className="space-y-6 max-w-md">
      <p className="text-sm text-muted-foreground">Elige qué notificaciones quieres recibir.</p>
      {notificationTypes.map((nt) => (
        <div key={nt.key} className="flex items-center justify-between">
          <Label htmlFor={nt.key} className="cursor-pointer">{nt.label}</Label>
          <Switch id={nt.key} defaultChecked />
        </div>
      ))}
    </div>
  );
}
