import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { MailCheck, Loader2 } from "lucide-react";

export function EmailNotConfirmed() {
  const { user, signOut } = useAuth();
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (!user?.email) return;
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setSending(false);
    if (error) {
      toast({ title: "No se pudo reenviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email enviado", description: "Revisa tu bandeja de entrada." });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <MailCheck className="mb-2 h-10 w-10 text-primary" />
          <CardTitle>Confirma tu email</CardTitle>
          <CardDescription>
            Hemos enviado un enlace de confirmación a {user?.email ?? "tu correo"}. Debes verificarlo
            antes de acceder al CRM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={resend} disabled={sending}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reenviar email de confirmación
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
            Ya lo he confirmado
          </Button>
          <Button variant="ghost" className="w-full" onClick={signOut}>
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
