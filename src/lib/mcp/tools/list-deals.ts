import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_deals",
  title: "List deals",
  description: "List deals in the CRM pipeline visible to the signed-in user, newest first.",
  inputSchema: {
    search: z.string().trim().optional().describe("Filter deals whose title contains this text."),
    limit: z.number().int().min(1).max(100).optional().describe("Max deals to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("deals")
      .select("id, title, value, probability, close_date, notes, stage_id, pipeline_id, company_id, contact_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (search) query = query.ilike("title", `%${search}%`);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { deals: data ?? [] } };
  },
});
