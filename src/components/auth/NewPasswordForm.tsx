import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export const MIN_PASSWORD_LENGTH = 12;

function explain(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("same") || m.includes("different from the old"))
    return "La nueva contraseña debe ser distinta de la actual.";
  if (m.includes("pwned") || m.includes("leaked") || m.includes("compromised") || m.includes("weak"))
    return "Esa contraseña aparece en filtraciones conocidas o es demasiado débil. Elige otra.";
  if (m.includes("reauthentication") || m.includes("current password") || m.includes("nonce"))
    return "Por seguridad, la configuración exige confirmar tu identidad antes de cambiarla. Cierra sesión y usa «¿Olvidaste tu contraseña?».";
  if (m.includes("session") || m.includes("jwt") || m.includes("not authenticated"))
    return "Tu sesión ha caducado. Vuelve a iniciar sesión e inténtalo de nuevo.";
  if (m.includes("rate") || m.includes("too many"))
    return "Demasiados intentos. Espera unos minutos.";
  if (m.includes("password"))
    return "La contraseña no cumple las reglas de seguridad configuradas. Prueba una más larga con letras, números y símbolos.";
  return "No se pudo actualizar la contraseña. Inténtalo de nuevo.";
}

interface Props {
  idPrefix: string;
  submitLabel?: string;
  onSuccess: () => void;
}

/** Formulario de nueva contraseña. Nunca guarda ni registra la contraseña. */
export function NewPasswordForm({ idPrefix, submitLabel = "Actualizar contraseña", onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password.length > 128) {
      setError("La contraseña no puede superar los 128 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("not authenticated");
      const { error: apiError } = await supabase.auth.updateUser({ password });
      if (apiError) throw apiError;
      setPassword("");
      setConfirm("");
      setShow(false);
      onSuccess();
    } catch (err: any) {
      setError(explain(String(err?.message || "")));
    } finally {
      setSubmitting(false);
    }
  };

  const errId = `${idPrefix}-error`;
  const type = show ? "text" : "password";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate autoComplete="off">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-new`}>Nueva contraseña</Label>
        <div className="relative">
          <Input id={`${idPrefix}-new`} type={type} autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} maxLength={128} className="h-11 pr-11"
            aria-invalid={!!error} aria-describedby={`${idPrefix}-hint${error ? ` ${errId}` : ""}`} />
          <button type="button" onClick={() => setShow((v) => !v)} aria-pressed={show}
            aria-label={show ? "Ocultar contraseñas" : "Mostrar contraseñas"}
            className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p id={`${idPrefix}-hint`} className="text-xs text-muted-foreground">
          Mínimo {MIN_PASSWORD_LENGTH} caracteres. Mejor si combina letras, números y símbolos.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-confirm`}>Repite la nueva contraseña</Label>
        <Input id={`${idPrefix}-confirm`} type={type} autoComplete="new-password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} maxLength={128} className="h-11"
          aria-invalid={!!error} aria-describedby={error ? errId : undefined} />
      </div>
      {error && <p id={errId} role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Guardando" /> : submitLabel}
      </Button>
    </form>
  );
}
