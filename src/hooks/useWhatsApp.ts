import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

export interface WhatsAppMessage {
  id: string;
  direction: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  body: string | null;
  media_url: string | null;
  status: string;
  error_message: string | null;
  contact_id: string | null;
  deal_id: string | null;
  created_at: string;
}

export function useWhatsAppMessages(filters: { dealId?: string | null; contactId?: string | null }) {
  const queryClient = useQueryClient();
  const enabled = !!(filters.dealId || filters.contactId);

  const query = useQuery({
    queryKey: ["whatsapp_messages", filters.dealId ?? null, filters.contactId ?? null],
    enabled,
    queryFn: async () => {
      let q = supabase.from("whatsapp_messages").select("*").order("created_at", { ascending: true }).limit(200);
      if (filters.dealId) q = q.eq("deal_id", filters.dealId);
      else if (filters.contactId) q = q.eq("contact_id", filters.contactId);
      const { data, error } = await q;
      if (error) throw error;
      return data as WhatsAppMessage[];
    },
  });

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("whatsapp-messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["whatsapp_messages"] });
        queryClient.invalidateQueries({ queryKey: ["activities"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, enabled]);

  return query;
}

export function useSendWhatsApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      to: string;
      body: string;
      deal_id?: string | null;
      contact_id?: string | null;
      company_id?: string | null;
    }) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-send", { body: payload });
      if (error) {
        let details = error.message;
        if (error instanceof FunctionsHttpError) {
          const text = await error.context.text();
          try {
            const parsed = JSON.parse(text);
            details = parsed.details || parsed.error || text;
          } catch {
            details = text;
          }
        }
        throw new Error(details);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_messages"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
