import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_contacts",
  title: "List contacts",
  description: "List CRM contacts visible to the signed-in user, optionally filtered by name or email.",
  inputSchema: {
    search: z.string().trim().optional().describe("Filter by first name, last name, or email."),
    limit: z.number().int().min(1).max(100).optional().describe("Max contacts to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone, position, tags, company_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (search) {
      const q = `%${search}%`;
      query = query.or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`);
    }
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { contacts: data ?? [] } };
  },
});
