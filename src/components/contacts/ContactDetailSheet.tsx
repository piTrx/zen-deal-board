import { getActivityConfig } from "@/lib/activityTypes";
import { useState, useEffect } from "react";
import { Contact, useUpdateContact, useDeleteContact } from "@/hooks/useContacts";
import { useActivities } from "@/hooks/useActivities";
import { useTasks } from "@/hooks/useTasks";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { TaskItem } from "@/components/tasks/TaskItem";
import { CommunicationActions } from "@/components/communications/CommunicationActions";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { formatRelativeDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Phone, Briefcase, Tag, Pencil, X, Save, Trash2, Plus, FileText, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

interface ContactDetailSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailSheet({ contact, open, onOpenChange }: ContactDetailSheetProps) {
  const { data: activities } = useActivities({ limit: 20 });
  const { data: tasks } = useTasks({ contact_id: contact?.id });
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  useEffect(() => {
    if (contact && editing) {
      setEditFirstName(contact.first_name);
      setEditLastName(contact.last_name);
      setEditEmail(contact.email || "");
      setEditPhone(contact.phone || "");
      setEditPosition(contact.position || "");
      setEditTags(contact.tags?.join(", ") || "");
      setEditNotes((contact as any).notes || "");
    }
  }, [contact, editing]);

  if (!contact) return null;

  const contactActivities = activities?.filter((a) => a.contact_id === contact.id) || [];

  const handleSave = () => {
    updateContact.mutate(
      {
        id: contact.id,
        first_name: editFirstName,
        last_name: editLastName,
        email: editEmail || null,
        phone: editPhone || null,
        position: editPosition || null,
        tags: editTags ? editTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        notes: editNotes || null,
      },
      { onSuccess: () => { toast({ title: "Contacto actualizado" }); setEditing(false); } }
    );
  };

  const handleDelete = () => {
    deleteContact.mutate(contact.id, {
      onSuccess: () => { toast({ title: "Contacto eliminado" }); onOpenChange(false); },
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 border-b bg-background">
          <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-border/50">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(!editing)} title={editing ? "Cancelar edición" : "Editar"}>
              {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)} title="Cerrar">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="px-6 py-3">
            <h2 className="text-lg font-semibold truncate">{contact.first_name} {contact.last_name}</h2>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Contactar</h4>
            <CommunicationActions
              contactId={contact.id}
              companyId={contact.company_id}
              email={contact.email}
              phone={contact.phone}
              contactName={`${contact.first_name} ${contact.last_name}`}
            />
          </div>

          <Separator />

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre</Label><Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Apellidos</Label><Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Correo</Label><Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label>Teléfono</Label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
              <div className="space-y-2"><Label>Cargo</Label><Input value={editPosition} onChange={(e) => setEditPosition(e.target.value)} /></div>
              <div className="space-y-2"><Label>Etiquetas (separadas por comas)</Label><Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="p. ej. decisor, técnico" /></div>
              <div className="space-y-2"><Label>Notas</Label><RichTextEditor value={editNotes} onChange={setEditNotes} rows={4} /></div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateContact.isPending}><Save className="h-4 w-4 mr-1" /> Guardar</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{contact.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{contact.position || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{contact.companies?.name || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                {contact.tags && contact.tags.length > 0 ? (
                  contact.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              {(contact as any).notes && (
                <div className="text-sm">
                  <div className="flex items-center gap-1.5 mb-1"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Notas</span></div>
                  <p className="whitespace-pre-wrap">{(contact as any).notes}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Creado el {format(new Date(contact.created_at), "d MMM yyyy 'a las' HH:mm")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Actualizado el {format(new Date(contact.updated_at), "d MMM yyyy 'a las' HH:mm")}</span>
                </div>
              </div>
            </div>
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

          <div>
            <h4 className="text-sm font-semibold mb-3">Historial de actividad</h4>
            {contactActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay actividades.</p>
            ) : (
              <div className="space-y-3">
                {contactActivities.map((a) => (
                  <div key={a.id} className="text-sm">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{getActivityConfig(a.type).label} · {formatRelativeDate(a.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1" /> Eliminar contacto</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
                <AlertDialogDescription>Esto eliminará a {contact.first_name} {contact.last_name} de forma permanente y no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
      <CreateTaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} defaultContactId={contact.id} />
    </Sheet>
  );
}
