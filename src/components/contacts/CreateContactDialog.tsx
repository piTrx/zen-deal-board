import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateContact } from "@/hooks/useContacts";
import { useCompanies, useCreateCompany } from "@/hooks/useCompanies";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContactDialog({ open, onOpenChange }: CreateContactDialogProps) {
  const { user } = useAuth();
  const createContact = useCreateContact();
  const { data: companies } = useCompanies();
  const createCompany = useCreateCompany();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let finalCompanyId = companyId || null;

    // Create new company if name provided and no existing selected
    if (!companyId && newCompanyName.trim()) {
      try {
        const newCompany = await createCompany.mutateAsync({ name: newCompanyName.trim(), created_by: user.id });
        finalCompanyId = newCompany.id;
      } catch {
        toast({ title: "Error al crear la empresa", variant: "destructive" });
        return;
      }
    }

    createContact.mutate(
      {
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        position: position || null,
        company_id: finalCompanyId,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        created_by: user.id,
      },
      {
        onSuccess: () => {
          toast({ title: "Contacto creado", description: `${firstName} ${lastName} añadido` });
          onOpenChange(false);
          setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setPosition(""); setCompanyId(""); setNewCompanyName(""); setTags("");
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir contacto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Apellidos *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required maxLength={100} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cargo</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="p. ej. Director de Ventas" maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Empresa</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar existente..." /></SelectTrigger>
              <SelectContent>
                {companies?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!companyId && (
              <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="O crear nueva empresa..." className="mt-2" />
            )}
          </div>
          <div className="space-y-2">
            <Label>Etiquetas (separadas por comas)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="p. ej. VIP, Enterprise" maxLength={255} />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createContact.isPending}>
              {createContact.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Añadir contacto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
