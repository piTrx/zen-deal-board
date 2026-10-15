import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { A1Logo } from "@/components/A1Mark";
import authBgAsset from "@/assets/auth-bg.jpg.asset.json";

export default function Auth() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Cargando" />
      </div>
    );
  }

  const nextParam = new URLSearchParams(window.location.search).get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
  const postAuthUrl = safeNext ? window.location.origin + safeNext : window.location.origin;

  if (session) {
    if (safeNext) return <Navigate to={safeNext} replace />;
    const pendingInvite = sessionStorage.getItem("pending_invite");
    if (pendingInvite) {
      sessionStorage.removeItem("pending_invite");
      return <Navigate to={`/invite/${pendingInvite}`} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <img src={authBgAsset.url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/40" />
        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          <Link to="/" aria-label="A1 CRM, inicio"><A1Logo /></Link>
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-bold leading-tight text-foreground xl:text-5xl">
              Accede a tu espacio de trabajo comercial
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Contactos, empresas, oportunidades, tareas y actividad diaria en un único sitio.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">Acceso exclusivo para el equipo.</p>
        </div>
      </div>

      <main className="flex flex-1 flex-col items-center justify-center p-5 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link to="/" className="lg:hidden" aria-label="A1 CRM, inicio"><A1Logo /></Link>
          <LoginPanel postAuthUrl={postAuthUrl} allowSignup />
        </div>
      </main>
    </div>
  );
}
