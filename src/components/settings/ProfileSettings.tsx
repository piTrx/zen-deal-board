import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Building2 } from "lucide-react";
import { sanitizeErrorMessage } from "@/lib/sanitize";
import { useQueryClient } from "@tanstack/react-query";

export function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || "");
        setCompany(data.company || "");
        setAvatarUrl(data.avatar_url || "");
        setCompanyLogoUrl(data.company_logo_url || "");
      }
    });
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Tipo de archivo no válido", description: "Sube una imagen JPEG, PNG, GIF, WebP o SVG.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "El logo debe pesar menos de 2 MB.", variant: "destructive" });
      return;
    }

    setUploadingLogo(true);
    const path = `company-logos/${user.id}/logo.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Error al subir", description: sanitizeErrorMessage(uploadError.message), variant: "destructive" });
      setUploadingLogo(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").upsert({ user_id: user.id, company_logo_url: url }, { onConflict: "user_id" });
    setCompanyLogoUrl(url);
    queryClient.invalidateQueries({ queryKey: ["profile-sidebar"] });
    setUploadingLogo(false);
    toast({ title: "Logo de la empresa actualizado" });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Tipo de archivo no válido", description: "Sube una imagen JPEG, PNG, GIF o WebP.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "El avatar debe pesar menos de 2 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const path = `${user.id}/avatar.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Error al subir", description: sanitizeErrorMessage(uploadError.message), variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").upsert({ user_id: user.id, avatar_url: url }, { onConflict: "user_id" });
    setAvatarUrl(url);
    queryClient.invalidateQueries({ queryKey: ["profile-sidebar"] });
    setUploading(false);
    toast({ title: "Avatar actualizado" });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, full_name: fullName, company, company_logo_url: companyLogoUrl }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast({ title: "Error", description: sanitizeErrorMessage(error.message), variant: "destructive" });
    else {
      toast({ title: "Perfil actualizado" });
      queryClient.invalidateQueries({ queryKey: ["profile-sidebar"] });
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-lg">{(fullName || user?.email || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
          </label>
        </div>
        <div>
          <p className="font-medium">{fullName || "Tu nombre"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nombre completo</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={100} placeholder="p. ej. Acme S.A." />
        </div>
        <div className="space-y-2">
          <Label>Logo de la empresa</Label>
          <p className="text-xs text-muted-foreground -mt-1">Se muestra en la barra lateral en lugar del logo por defecto.</p>
          <div className="flex items-center gap-4">
            <div className="relative group h-14 w-14 rounded-lg border flex items-center justify-center overflow-hidden bg-muted">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt="Logo de la empresa" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-6 w-6 text-muted-foreground" />
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </label>
            </div>
            {companyLogoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (!user) return;
                  await supabase.from("profiles").update({ company_logo_url: null }).eq("user_id", user.id);
                  setCompanyLogoUrl("");
                  queryClient.invalidateQueries({ queryKey: ["profile-sidebar"] });
                  toast({ title: "Logo eliminado" });
                }}
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Correo electrónico</Label>
          <Input value={user?.email || ""} disabled />
        </div>
        <Button className="w-full sm:w-auto" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
