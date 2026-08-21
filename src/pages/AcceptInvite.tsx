import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/lib/sanitize";

interface Preview {
  email: string;
  role: string;
  team_name: string;
  status: string;
  expires_at: string;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { session, user, loading } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [fetching, setFetching] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_invitation_preview", { _token: token });
      if (!error && data && (data as Preview[]).length) setPreview((data as Preview[])[0]);
      setFetching(false);
    })();
  }, [token]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    sessionStorage.setItem("pending_invite", token ?? "");
    return <Navigate to="/auth" replace />;
  }

  const invalid =
    !preview ||
    preview.status !== "pending" ||
    new Date(preview.expires_at) < new Date();

  const emailMismatch =
    preview && user?.email && preview.email.toLowerCase() !== user.email.toLowerCase();

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { error } = await supabase.rpc("accept_team_invitation", { _token: token! });
      if (error) throw error;
      toast.success(`Te has unido a ${preview?.team_name}`);
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      toast.error(sanitizeErrorMessage(e.message || "No se pudo aceptar la invitación"));
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Invitación de equipo
          </CardTitle>
          <CardDescription>
            {invalid
              ? "Esta invitación no es válida o ha caducado."
              : `Has sido invitado a unirte a ${preview!.team_name} como ${preview!.role}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invalid ? (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Pide a tu compañero que te envíe una invitación nueva.</span>
            </div>
          ) : emailMismatch ? (
            <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                La invitación es para <strong>{preview!.email}</strong>, pero has iniciado sesión como{" "}
                <strong>{user?.email}</strong>. Cambia de cuenta para aceptarla.
              </span>
            </div>
          ) : (
            <Button className="w-full" onClick={handleAccept} disabled={accepting}>
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><CheckCircle2 className="h-4 w-4 mr-1" /> Aceptar invitación</>)}
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>
            Ir al panel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
