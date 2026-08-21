import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "manager" | "rep";

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: AppRole;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
}

/** Returns the current user's team id, creating a default team if needed. */
export function useMyTeam() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-team", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ensure_default_team");
      if (error) throw error;
      const teamId = data as unknown as string;
      const { data: team } = await supabase
        .from("teams")
        .select("id, name")
        .eq("id", teamId)
        .maybeSingle();
      return { id: teamId, name: team?.name ?? "My Team" };
    },
  });
}

export function useTeamInvitations(teamId?: string) {
  return useQuery({
    queryKey: ["team-invitations", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invitations")
        .select("*")
        .eq("team_id", teamId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TeamInvitation[];
    },
  });
}

export function useTeamMembers(teamId?: string) {
  return useQuery({
    queryKey: ["team-members", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, user_id, joined_at")
        .eq("team_id", teamId!)
        .order("joined_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInvitation(teamId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      if (!teamId || !user) throw new Error("No team available");
      const { data, error } = await supabase
        .from("team_invitations")
        .insert({ team_id: teamId, email: email.trim().toLowerCase(), role, invited_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as TeamInvitation;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-invitations"] }),
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_invitations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-invitations"] }),
  });
}

export function inviteUrl(token: string) {
  return `${window.location.origin}/invite/${token}`;
}
