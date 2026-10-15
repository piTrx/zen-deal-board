import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { sanitizeErrorMessage } from "@/lib/sanitize";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, MailCheck } from "lucide-react";

const emailSchema = z.string().trim().email("Introduce un correo electrónico válido").max(255);
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(128),
});
const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(1, "El nombre completo es obligatorio").max(100, "El nombre debe tener menos de 100 caracteres"),
});

type Mode = "login" | "signup" | "forgot";

interface LoginPanelProps {
  /** URL absoluta a la que volver tras confirmar el correo o tras Google. */
  postAuthUrl: string;
  /** Permite cambiar a "Crear cuenta" (necesario para invitaciones). */
  allowSignup?: boolean;
  className?: string;
}

export function LoginPanel({ postAuthUrl, allowSignup = false, className = "" }: LoginPanelProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (mode === "forgot") {
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) {
        setErrors({ email: parsed.error.errors[0].message });
        return;
      }
      setSubmitting(true);
      try {
        // Respuesta genérica siempre, exista o no la cuenta (anti-enumeración).
        await supabase.auth.resetPasswordForEmail(parsed.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      } catch {
        /* se ignora a propósito */
      } finally {
        setSubmitting(false);
        setResetSent(true);
      }
      return;
    }

    const schema = mode === "login" ? loginSchema : signupSchema;
    const parsed = schema.safeParse({ email, password, fullName });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((err) => { errs[err.path[0] as string] = err.message; });
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
        if (error) throw error;
      } else {
        const data = parsed.data as z.infer<typeof signupSchema>;
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { full_name: data.fullName }, emailRedirectTo: postAuthUrl },
        });
        if (error) throw error;
        toast({ title: "Revisa tu correo", description: "Te hemos enviado un enlace de confirmación para verificar tu cuenta." });
      }
    } catch (error: any) {
      toast({ title: "No se pudo continuar", description: sanitizeErrorMessage(error.message || "Error desconocido"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: postAuthUrl });
    if (error) toast({ title: "Error", description: String(error), variant: "destructive" });
  };

  const title = mode === "login" ? "Iniciar sesión" : mode === "signup" ? "Crear cuenta" : "Recuperar contraseña";
  const subtitle =
    mode === "login"
      ? "Usa tu cuenta corporativa para entrar."
      : mode === "signup"
      ? "Solo si has recibido una invitación al equipo."
      : "Te enviaremos un enlace para crear una nueva contraseña.";

  return (
    <section
      aria-labelledby="login-title"
      className={`w-full rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8 ${className}`}
    >
      <div className="mb-6 flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 id="login-title" className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {mode === "forgot" && resetSent ? (
        <div role="status" className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>
              Si existe una cuenta asociada a ese correo, recibirás en unos minutos un enlace para
              restablecer la contraseña. Revisa también la carpeta de spam.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => switchMode("login")}>
            <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="lp-fullName">Nombre completo</Label>
              <Input id="lp-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" maxLength={100}
                aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? "lp-fullName-err" : undefined} />
              {errors.fullName && <p id="lp-fullName-err" className="text-xs text-destructive">{errors.fullName}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="lp-email">Correo electrónico</Label>
            <Input id="lp-email" type="email" inputMode="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="nombre@empresa.com" maxLength={255}
              aria-invalid={!!errors.email} aria-describedby={errors.email ? "lp-email-err" : undefined} className="h-11" />
            {errors.email && <p id="lp-email-err" className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="lp-password">Contraseña</Label>
                {mode === "login" && (
                  <button type="button" onClick={() => switchMode("forgot")}
                    className="rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input id="lp-password" type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128}
                  aria-invalid={!!errors.password} aria-describedby={errors.password ? "lp-password-err" : undefined}
                  className="h-11 pr-11" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p id="lp-password-err" className="text-xs text-destructive">{errors.password}</p>}
            </div>
          )}

          <Button type="submit" className="h-11 w-full text-base" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Enviando" /> : (
              <>
                {mode === "login" ? "Iniciar sesión" : mode === "signup" ? "Crear cuenta" : "Enviar enlace"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>

          {mode === "forgot" && (
            <Button type="button" variant="ghost" className="w-full" onClick={() => switchMode("login")}>
              <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
            </Button>
          )}
        </form>
      )}

      {mode !== "forgot" && (
        <>
          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">o</span>
          </div>
          <Button type="button" variant="outline" className="h-11 w-full" onClick={handleGoogle}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continuar con Google
          </Button>
          {allowSignup && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "login" ? "¿Te han invitado al equipo?" : "¿Ya tienes una cuenta?"}{" "}
              <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="font-medium text-primary hover:underline">
                {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
              </button>
            </p>
          )}
        </>
      )}
    </section>
  );
}
