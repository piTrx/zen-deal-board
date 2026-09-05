import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { setActiveCurrency, DEFAULT_CURRENCY } from "@/lib/formatters";

export const SUPPORTED_CURRENCIES = [
  { code: "EUR", label: "Euro (€)" },
  { code: "USD", label: "Dólar estadounidense ($)" },
  { code: "GBP", label: "Libra esterlina (£)" },
  { code: "CHF", label: "Franco suizo (CHF)" },
  { code: "MXN", label: "Peso mexicano (MX$)" },
];

/**
 * Currency is stored per account (profiles.currency) and per workspace (teams.currency).
 * The workspace value wins when the user belongs to a team, so each workspace can
 * have its own currency in the future.
 */
export function useCurrency() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["currency", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("currency")
        .eq("user_id", user!.id)
        .maybeSingle();

      const { data: membership } = await supabase
        .from("team_members")
        .select("teams(currency)")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();

      const teamCurrency = (membership as any)?.teams?.currency as string | undefined;
      return teamCurrency || (profile as any)?.currency || DEFAULT_CURRENCY;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrencySync() {
  const { data: currency } = useCurrency();
  useEffect(() => {
    setActiveCurrency(currency);
  }, [currency]);
  return currency || DEFAULT_CURRENCY;
}

export function useUpdateCurrency() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currency: string) => {
      if (!user) throw new Error("No hay sesión activa");

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ currency } as any)
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membership?.team_id) {
        await supabase.from("teams").update({ currency } as any).eq("id", membership.team_id);
      }

      return currency;
    },
    onSuccess: (currency) => {
      setActiveCurrency(currency);
      queryClient.invalidateQueries({ queryKey: ["currency"] });
    },
  });
}
