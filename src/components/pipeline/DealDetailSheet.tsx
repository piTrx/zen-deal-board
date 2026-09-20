import { activityTypes, activityTypeConfig, getActivityConfig, ActivityType } from "@/lib/activityTypes";
import { Deal, useUpdateDeal, useDeleteDeal } from "@/hooks/useDeals";
import { useActivities, useCreateActivity } from "@/hooks/useActivities";
import { useContacts } from "@/hooks/useContacts";
import { useCompanies } from "@/hooks/useCompanies";
import { useTasks } from "@/hooks/useTasks";
import { useDealAuditLog } from "@/hooks/useDealAuditLog";
import { useAuth } from "@/contexts/AuthContext";
import { PipelineStage } from "@/hooks/usePipelineStages";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { TaskItem } from "@/components/tasks/TaskItem";
import { CommunicationActions } from "@/components/communications/CommunicationActions";
import { WhatsAppThread } from "@/components/communications/WhatsAppThread";
import { DealAiActions } from "@/components/ai/DealAiActions";

import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Phone, Mail, Calendar, FileText, Trash2, Save, Pencil, X, Plus, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DealDetailSheetProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: PipelineStage[];
}

export function DealDetailSheet({ deal, open, onOpenChange, stages }: DealDetailSheetProps) {
  const { user } = useAuth();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const createActivity = useCreateActivity();
  const { data: activities } = useActivities({ limit: 10 });
  const { data: tasks } = useTasks({ deal_id: deal?.id });
  const { data: auditLog } = useDealAuditLog(deal?.id);
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editProbability, setEditProbability] = useState("");
  const [editCloseDate, setEditCloseDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStageId, setEditStageId] = useState("");
  const [editContactId, setEditContactId] = useState("");
  const [editCompanyId, setEditCompanyId] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const { data: allContacts } = useContacts();
  const { data: allCompanies } = useCompanies();

  useEffect(() => {
    if (deal && editing) {
      setEditTitle(deal.title);
      setEditValue(String(deal.value || 0));
      setEditProbability(String(deal.probability || 50));
      setEditCloseDate(deal.close_date || "");
      setEditNotes(deal.notes || "");
      setEditStageId(deal.stage_id);
      setEditContactId(deal.contact_id || "");
      setEditCompanyId(deal.company_id || "");
    }
  }, [deal, editing]);

  if (!deal) return null;

  const dealActivities = activities?.filter((a) => a.deal_id === deal.id) || [];
  const currentStage = stages.find((s) => s.id === deal.stage_id);
  const dealContact = allContacts?.find((c) => c.id === deal.contact_id);

  const handleQuickActivity = (type: ActivityType) => {
    if (!user || !activityTitle.trim()) {
      toast({ title: "Introduce un título", variant: "destructive" });
      return;
    }
    createActivity.mutate(
      { deal_id: deal.id, user_id: user.id, type, title: activityTitle },
      { onSuccess: () => { toast({ title: "Actividad registrada" }); setActivityTitle(""); } }
    );
  };

  const handleSave = () => {
    updateDeal.mutate(
      {
        id: deal.id, title: editTitle, value: parseFloat(editValue) || 0,
        probability: parseInt(editProbability) || 50, close_date: editCloseDate || null,
        notes: editNotes || null, stage_id: editStageId,
        contact_id: editContactId || null, company_id: editCompanyId || null,
      },
      { onSuccess: () => { toast({ title: "Oferta actualizada" }); setEditing(false); } }
    );
  };

  const handleDelete = () => {
    deleteDeal.mutate(deal.id, { onSuccess: () => { toast({ title: "Oferta eliminada" }); onOpenChange(false); } });
  };

  const formatAuditEntry = (entry: any) => {
    if (entry.field === "stage_id") {
      return `Etapa cambiada de ${entry.old_stage_name || "desconocida"} a ${entry.new_stage_name || "desconocida"}`;
    }
    if (entry.field === "value") {
      return `Valor cambiado de ${formatCurrency(Number(entry.old_value || 0))} a ${formatCurrency(Number(entry.new_value || 0))}`;
    }
    if (entry.field === "probability") {
      return `Probabilidad cambiada de ${entry.old_value}% a ${entry.new_value}%`;
    }
    return `${entry.field} modificado`;
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: currentStage?.color }} />
              {deal.title}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => setEditing(!editing)}>
              {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Valor</Label><Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} /></div>
                <div className="space-y-2"><Label>Probabilidad (%)</Label><Input type="number" min="0" max="100" value={editProbability} onChange={(e) => setEditProbability(e.target.value)} /></div>
              </div>
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select value={editStageId} onValueChange={setEditStageId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{stages.map((s) => <SelectItem key={s.id} value={s.id}><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />{s.name}</div></SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contacto</Label>
                <Select value={editContactId} onValueChange={setEditContactId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar contacto..." /></SelectTrigger>
                  <SelectContent>{allContacts?.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select value={editCompanyId} onValueChange={setEditCompanyId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar empresa..." /></SelectTrigger>
                  <SelectContent>{allCompanies?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Fecha de cierre</Label><Input type="date" value={editCloseDate} onChange={(e) => setEditCloseDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Notas</Label><RichTextEditor value={editNotes} onChange={setEditNotes} rows={3} /></div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateDeal.isPending}><Save className="h-4 w-4 mr-1" /> Guardar cambios</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Valor</span><p className="font-semibold text-lg">{formatCurrency(Number(deal.value))}</p></div>
                <div><span className="text-muted-foreground">Probabilidad</span><p className="font-semibold">{deal.probability}%</p></div>
                <div><span className="text-muted-foreground">Etapa</span><Badge style={{ backgroundColor: currentStage?.color, color: "white" }}>{currentStage?.name}</Badge></div>
                <div><span className="text-muted-foreground">Fecha de cierre</span><p>{deal.close_date ? formatDate(deal.close_date) : "Sin definir"}</p></div>
              </div>
              {deal.companies && <div className="text-sm"><span className="text-muted-foreground">Empresa</span><p className="font-medium">{deal.companies.name}</p></div>}
              {deal.contacts && <div className="text-sm"><span className="text-muted-foreground">Contacto</span><p className="font-medium">{deal.contacts.first_name} {deal.contacts.last_name}</p></div>}
              {deal.notes && <div className="text-sm"><span className="text-muted-foreground">Notas</span><p className="mt-1 whitespace-pre-wrap">{deal.notes}</p></div>}
            </>
          )}

          <Separator />

          {/* Communication channels */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Contactar</h4>
            {dealContact ? (
              <CommunicationActions
                contactId={dealContact.id}
                companyId={deal.company_id}
                dealId={deal.id}
                email={dealContact.email}
                phone={dealContact.phone}
                contactName={`${dealContact.first_name} ${dealContact.last_name}`}
                subjectHint={deal.title}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Asocia un contacto a esta oferta para poder escribirle o llamarle.</p>
            )}
          </div>

          {dealContact && (
            <>
              <Separator />
              <WhatsAppThread
                contactId={dealContact.id}
                companyId={deal.company_id}
                dealId={deal.id}
                phone={dealContact.phone}
                contactName={`${dealContact.first_name} ${dealContact.last_name}`}
              />
            </>
          )}

          {dealContact && (
            <>
              <Separator />
              <DealAiActions
                deal={deal}
                activities={(activities ?? []).filter((a) => a.deal_id === deal.id)}
                contactName={`${dealContact.first_name} ${dealContact.last_name}`}
                stageName={currentStage?.name}
              />
            </>
          )}

          <Separator />





          {/* Tasks Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Tareas</h4>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setTaskDialogOpen(true)}>
                <Plus className="h-3 w-3 mr-1" /> Añadir tarea
              </Button>
            </div>
            {!tasks?.length ? (
              <p className="text-sm text-muted-foreground">No hay tareas vinculadas.</p>
            ) : (
              <div className="space-y-2">{tasks.map((t) => <TaskItem key={t.id} task={t} />)}</div>
            )}
          </div>

          <Separator />

          {/* Quick Activity Log */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Registrar actividad</h4>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Título de la actividad..." value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} className="flex-1" />
            </div>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((t) => {
                const Icon = activityTypeConfig[t].icon;
                return (
                  <Button key={t} size="sm" variant="outline" onClick={() => handleQuickActivity(t)}>
                    <Icon className="h-3 w-3 mr-1" /> {activityTypeConfig[t].label}
                  </Button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Activity Timeline */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Cronología de actividad</h4>
            {dealActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no se han registrado actividades.</p>
            ) : (
              <div className="space-y-3">
                {dealActivities.map((a) => (
                  <div key={a.id} className="flex gap-3 text-sm">
                    <div className="mt-1">
                      {(() => {
                        const Icon = getActivityConfig(a.type).icon;
                        return <Icon className={`h-4 w-4 ${getActivityConfig(a.type).color}`} />;
                      })()}
                    </div>
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeDate(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Audit Trail */}
          {auditLog && auditLog.length > 0 && (
            <>
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                  <History className="h-4 w-4" /> Historial
                </h4>
                <div className="space-y-2">
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="text-xs text-muted-foreground">
                      <p>{formatAuditEntry(entry)}</p>
                      <p className="text-[10px]">{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" /> Eliminar oferta</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar oferta?</AlertDialogTitle>
                <AlertDialogDescription>Esto eliminará permanentemente "{deal.title}" y no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
      <CreateTaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} defaultDealId={deal.id} />
    </Sheet>
  );
}
