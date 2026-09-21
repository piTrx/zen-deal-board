import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateDeal } from "@/hooks/useDeals";
import { useCompanies, useCreateCompany } from "@/hooks/useCompanies";
import { useContacts, useCreateContact } from "@/hooks/useContacts";
import { PipelineStage } from "@/hooks/usePipelineStages";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getCurrencySymbol } from "@/lib/formatters";
import { Loader2, Plus } from "lucide-react";

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: string;
  stages: PipelineStage[];
  defaultStageId?: string;
}

export function CreateDealDialog({ open, onOpenChange, pipelineId, stages, defaultStageId }: CreateDealDialogProps) {
  const { user } = useAuth();
  const createDeal = useCreateDeal();
  const { data: companies } = useCompanies();
  const { data: contacts } = useContacts();
  const createCompany = useCreateCompany();
  const createContact = useCreateContact();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [contactId, setContactId] = useState<string>("");
  const [stageId, setStageId] = useState(defaultStageId || stages[0]?.id || "");
  const [value, setValue] = useState("");
  const [probability, setProbability] = useState("50");
  const [closeDate, setCloseDate] = useState("");
  const [notes, setNotes] = useState("");

  // Sincroniza la etapa con la columna desde la que se abre el formulario
  useEffect(() => {
    if (open) {
      setStageId(defaultStageId || stages[0]?.id || "");
    }
  }, [open, defaultStageId, stages]);

  // Inline creation
  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyIndustry, setNewCompanyIndustry] = useState("");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("");

  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const resetInlineCompany = () => {
    setCompanyFormOpen(false);
    setNewCompanyName(""); setNewCompanyIndustry(""); setNewCompanyWebsite("");
  };
  const resetInlineContact = () => {
    setContactFormOpen(false);
    setNewFirstName(""); setNewLastName(""); setNewEmail(""); setNewPhone("");
  };

  const handleCreateCompany = async () => {
    if (!user || !newCompanyName.trim()) return;
    try {
      const company = await createCompany.mutateAsync({
        name: newCompanyName.trim(),
        industry: newCompanyIndustry || null,
        website: newCompanyWebsite || null,
        created_by: user.id,
      });
      setCompanyId(company.id);
      resetInlineCompany();
      toast({ title: "Empresa creada", description: `${company.name} asociada a la oferta` });
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo crear la empresa.", variant: "destructive" });
    }
  };

  const handleCreateContact = async () => {
    if (!user || !newFirstName.trim() || !newLastName.trim()) return;
    try {
      const contact = await createContact.mutateAsync({
        first_name: newFirstName.trim(),
        last_name: newLastName.trim(),
        email: newEmail || null,
        phone: newPhone || null,
        company_id: companyId || null,
        created_by: user.id,
      });
      setContactId(contact.id);
      resetInlineContact();
      toast({ title: "Contacto creado", description: `${contact.first_name} ${contact.last_name} asociado a la oferta` });
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo crear el contacto.", variant: "destructive" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !stageId) return;

    createDeal.mutate(
      {
        title,
        pipeline_id: pipelineId,
        stage_id: stageId,
        owner_id: user.id,
        created_by: user.id,
        company_id: companyId || null,
        contact_id: contactId || null,
        value: parseFloat(value) || 0,
        probability: parseInt(probability) || 50,
        close_date: closeDate || null,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Oferta creada", description: `"${title}" añadida al pipeline` });
          onOpenChange(false);
          setTitle(""); setCompanyId(""); setContactId(""); setValue(""); setProbability("50"); setCloseDate(""); setNotes("");
          resetInlineCompany(); resetInlineContact();
        },
        onError: () => {
          toast({ title: "Error", description: "No se pudo crear la oferta. Inténtalo de nuevo.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear nueva oferta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal-title">Título de la oferta *</Label>
            <Input id="deal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="p. ej. Licencia Empresarial" required maxLength={200} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={stageId} onValueChange={setStageId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-value">Valor ({getCurrencySymbol()})</Label>
              <Input id="deal-value" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" />
            </div>
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Empresa</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => { setCompanyFormOpen((o) => !o); setCompanyId(""); }}
              >
                <Plus className="h-3 w-3 mr-1" /> {companyFormOpen ? "Cancelar" : "Crear nueva empresa"}
              </Button>
            </div>
            {companyFormOpen ? (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="Nombre de la empresa *" maxLength={200} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input value={newCompanyIndustry} onChange={(e) => setNewCompanyIndustry(e.target.value)} placeholder="Sector" maxLength={100} />
                  <Input value={newCompanyWebsite} onChange={(e) => setNewCompanyWebsite(e.target.value)} placeholder="https://..." maxLength={500} />
                </div>
                <Button type="button" size="sm" onClick={handleCreateCompany} disabled={!newCompanyName.trim() || createCompany.isPending}>
                  {createCompany.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar empresa"}
                </Button>
              </div>
            ) : (
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {companies?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Contacto */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Contacto</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => { setContactFormOpen((o) => !o); setContactId(""); }}
              >
                <Plus className="h-3 w-3 mr-1" /> {contactFormOpen ? "Cancelar" : "Crear nuevo contacto"}
              </Button>
            </div>
            {contactFormOpen ? (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="Nombre *" maxLength={100} />
                  <Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Apellidos *" maxLength={100} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Correo" maxLength={255} />
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Teléfono" maxLength={30} />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateContact}
                  disabled={!newFirstName.trim() || !newLastName.trim() || createContact.isPending}
                >
                  {createContact.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar contacto"}
                </Button>
              </div>
            ) : (
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {contacts?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal-probability">Probabilidad (%)</Label>
              <Input id="deal-probability" type="number" min="0" max="100" value={probability} onChange={(e) => setProbability(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-close-date">Fecha de cierre</Label>
              <Input id="deal-close-date" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-notes">Notas</Label>
            <Textarea id="deal-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalles adicionales..." rows={3} maxLength={2000} />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createDeal.isPending}>
              {createDeal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear oferta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
