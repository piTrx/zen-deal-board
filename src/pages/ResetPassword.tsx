import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, clearRecoveryFlag } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import { A1Logo } from "@/components/A1Mark";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";

type State = "checking" | "recovery" | "signed-in" | "invalid";

export default function ResetPassword() {
  const { session, loading, recovery } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [waited, setWaited] = useState(false);

  // Damos margen a que el cliente procese el enlace del correo.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 3000);
    return () => clearTimeout(t);
  }, []);

  let state: State = "checking";
  if (session && recovery) state = "recovery";
  else if (!loading && waited) state = session ? "signed-in" : "invalid";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-5 sm:p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center"><Link to="/" aria-label="A1 CRM, inicio"><A1Logo /></Link></div>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8" aria-live="polite">
          {state === "checking" && (
            <div className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              Comprobando el enlace…
            </div>
          )}

          {state === "recovery" && (
            <>
              <div className="mb-6 flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h1 className="text-xl font-semibold">Crea una nueva contraseña</h1>
                  <p className="text-sm text-muted-foreground">Para {session?.user.email}.</p>
                </div>
              </div>
              <NewPasswordForm
                idPrefix="reset-pw"
                submitLabel="Guardar contraseña"
                onSuccess={() => {
                  clearRecoveryFlag();
                  toast({ title: "Contraseña actualizada", description: "Ya puedes entrar con tu nueva contraseña." });
                  navigate("/dashboard", { replace: true });
                }}
              />
            </>
          )}

          {state === "signed-in" && (
            <div className="space-y-4">
              <h1 className="text-xl font-semibold">Ya has iniciado sesión</h1>
              <p className="text-sm text-muted-foreground">
                Este enlace no corresponde a una recuperación activa. Puedes cambiar tu contraseña en
                Ajustes → Perfil → Seguridad de la cuenta.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild><Link to="/settings#seguridad">Ir a Seguridad de la cuenta</Link></Button>
                <Button asChild variant="outline"><Link to="/dashboard">Ir al panel</Link></Button>
              </div>
            </div>
          )}

          {state === "invalid" && (
            <div className="space-y-4">
              <h1 className="text-xl font-semibold">Enlace no válido</h1>
              <p className="text-sm text-muted-foreground">
                El enlace ha caducado o ya se ha usado. Pide uno nuevo con «¿Olvidaste tu contraseña?» en la pantalla de acceso.
              </p>
              <Button asChild className="w-full"><Link to="/auth">Volver a iniciar sesión</Link></Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
