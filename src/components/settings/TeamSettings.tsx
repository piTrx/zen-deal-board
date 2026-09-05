import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, X, Mail, Clock, Copy, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import {
  useMyTeam,
  useTeamInvitations,
  useTeamMembers,
  useCreateInvitation,
  useRevokeInvitation,
  inviteUrl,
  type AppRole,
} from "@/hooks/useTeamInvitations";
import { sanitizeErrorMessage } from "@/lib/sanitize";

export function TeamSettings() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("rep");

  const { data: team, isLoading: teamLoading } = useMyTeam();
  const { data: invitations, isLoading: invitesLoading } = useTeamInvitations(team?.id);
  const { data: members } = useTeamMembers(team?.id);
  const createInvite = useCreateInvitation(team?.id);
  const revokeInvite = useRevokeInvitation();

  const memberIds = members?.map((m) => m.user_id) ?? [];

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["team-profiles", memberIds.join(",")],
    enabled: memberIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", memberIds)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["all-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getRoleForUser = (userId: string) =>
    roles?.find((r) => r.user_id === userId)?.role || "rep";

  const roleBadgeVariant = (role: string) =>
    role === "admin" ? "default" : role === "manager" ? "secondary" : "outline";

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      toast.success("Enlace de invitación copiado.");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  };

  const handleInvite = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
      toast.error("Introduce un email válido.");
      return;
    }
    try {
      const invite = await createInvite.mutateAsync({ email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      setInviteRole("rep");
      await copyLink(invite.token);
      toast.success(`Invitación creada para ${invite.email}. Comparte el enlace copiado.`);
    } catch (e: any) {
      toast.error(sanitizeErrorMessage(e.message || "No se pudo crear la invitación"));
    }
  };

  const pending = (invitations ?? []).filter((i) => i.status === "pending");

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" /> Invitar compañero
          </CardTitle>
          <CardDescription>
            {teamLoading ? "Preparando tu equipo…" : `Se unirán a tu equipo: ${team?.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="invite-email">Correo electrónico</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="companero@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div className="w-full sm:w-36 space-y-1">
              <Label>Rol</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Responsable</SelectItem>
                  <SelectItem value="rep">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleInvite} disabled={!team || createInvite.isPending} className="w-full sm:w-auto">
                {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}
                Crear invitación
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              La invitación genera un enlace seguro (válido 14 días) que se copia automáticamente.
              Para enviarlo por email desde la app hace falta configurar un dominio de envío.
            </span>
          </div>
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" /> Invitaciones pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitesLoading ? (
              <Skeleton className="h-14 w-full" />
            ) : (
              pending.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invitado como {invite.role} · caduca el{" "}
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyLink(invite.token)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        revokeInvite.mutate(invite.id, {
                          onSuccess: () => toast.info(`Invitación de ${invite.email} revocada.`),
                          onError: (e: any) => toast.error(sanitizeErrorMessage(e.message)),
                        })
                      }
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" /> Miembros del equipo
          </CardTitle>
          <CardDescription>Personas que ya forman parte de tu equipo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {profilesLoading || teamLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : !profiles?.length ? (
            <div className="flex flex-col items-center py-8">
              <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Aún no hay miembros.</p>
            </div>
          ) : (
            profiles.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border p-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={p.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(p.full_name || "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.full_name || "Sin nombre"}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.company || "Sin compañía"}</p>
                </div>
                <Badge variant={roleBadgeVariant(getRoleForUser(p.user_id)) as any} className="capitalize">
                  {getRoleForUser(p.user_id)}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
