import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_tasks",
  title: "List tasks",
  description: "List the signed-in user's CRM tasks, optionally only the open ones.",
  inputSchema: {
    only_open: z.boolean().optional().describe("Return only tasks that are not completed."),
    limit: z.number().int().min(1).max(100).optional().describe("Max tasks to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ only_open, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("tasks")
      .select("id, title, description, due_date, priority, completed, deal_id, contact_id, created_at")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(limit ?? 25);
    if (only_open) query = query.eq("completed", false);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { tasks: data ?? [] } };
  },
});
