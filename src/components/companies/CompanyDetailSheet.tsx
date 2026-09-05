import { useState, useEffect } from "react";
import { Company, useUpdateCompany, useDeleteCompany } from "@/hooks/useCompanies";
import { useContacts } from "@/hooks/useContacts";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CommunicationActions } from "@/components/communications/CommunicationActions";
import { useToast } from "@/hooks/use-toast";
import { Pencil, X, Save, Trash2, Globe, Factory, Users, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

interface CompanyDetailSheetProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyDetailSheet({ company, open, onOpenChange }: CompanyDetailSheetProps) {
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const { data: contacts } = useContacts();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editWebsite, setEditWebsite] = useState("");

  useEffect(() => {
    if (company && editing) {
      setEditName(company.name);
      setEditIndustry(company.industry || "");
      setEditWebsite(company.website || "");
    }
  }, [company, editing]);

  if (!company) return null;

  const linkedContacts = contacts?.filter((c) => c.company_id === company.id) || [];

  const handleSave = () => {
    updateCompany.mutate(
      { id: company.id, name: editName, industry: editIndustry || null, website: editWebsite || null },
      { onSuccess: () => { toast({ title: "Empresa actualizada" }); setEditing(false); } }
    );
  };

  const handleDelete = () => {
    deleteCompany.mutate(company.id, {
      onSuccess: () => { toast({ title: "Empresa eliminada" }); onOpenChange(false); },
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
            <h2 className="text-lg font-semibold truncate">{company.name}</h2>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sector</Label>
                <Input value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sitio web</Label>
                <Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateCompany.isPending}>
                  <Save className="h-4 w-4 mr-1" /> Guardar
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Factory className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{company.industry || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                {company.website ? (
                  <a href={company.website} target="_blank" rel="noopener" className="text-primary hover:underline">{company.website}</a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Creada el {format(new Date(company.created_at), "d MMM yyyy 'a las' HH:mm")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Actualizada el {format(new Date(company.updated_at), "d MMM yyyy 'a las' HH:mm")}</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" /> Contactos ({linkedContacts.length})
            </h4>
            {linkedContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay contactos vinculados a esta empresa.</p>
            ) : (
              <div className="space-y-2">
                {linkedContacts.map((c) => (
                  <div key={c.id} className="rounded-lg border p-3 text-sm space-y-2">
                    <div>
                      <p className="font-medium">{c.first_name} {c.last_name}</p>
                      {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                    </div>
                    <CommunicationActions
                      contactId={c.id}
                      companyId={company.id}
                      email={c.email}
                      phone={c.phone}
                      contactName={`${c.first_name} ${c.last_name}`}
                      subjectHint={company.name}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" /> Eliminar empresa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esto eliminará "{company.name}" de forma permanente y no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
