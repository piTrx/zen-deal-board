import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { sanitizeErrorMessage } from "@/lib/sanitize";
import { DMark } from "@/components/DMark";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    const timer = setTimeout(() => {
      setReady((r) => {
        if (!r) setInvalidLink(true);
        return r;
      });
    }, 4000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 8 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Contraseña actualizada", description: "Ya puedes entrar con tu nueva contraseña." });
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeErrorMessage(error.message || "Unknown error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <DMark className="h-9 w-9" />
          <span className="font-bold text-xl tracking-tight">Dealflow</span>
        </div>

        {invalidLink ? (
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">Enlace no válido</h1>
            <p className="text-sm text-muted-foreground">
              Este enlace ha caducado o ya se ha usado. Pide uno nuevo desde la pantalla de acceso.
            </p>
            <Button className="w-full" onClick={() => navigate("/auth", { replace: true })}>
              Volver a iniciar sesión
            </Button>
          </div>
        ) : !ready ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold mb-1">Crea una nueva contraseña</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Elige una contraseña de al menos 8 caracteres.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  maxLength={128}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Repite la contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  maxLength={128}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar contraseña"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
