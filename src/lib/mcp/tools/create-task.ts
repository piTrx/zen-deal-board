import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_task",
  title: "Create task",
  description: "Create a CRM task for the signed-in user, optionally linked to a deal or contact.",
  inputSchema: {
    title: z.string().trim().min(1),
    description: z.string().trim().optional(),
    due_date: z.string().optional().describe("Due date, YYYY-MM-DD."),
    priority: z.enum(["low", "medium", "high"]).optional().describe("Defaults to medium."),
    deal_id: z.string().uuid().optional(),
    contact_id: z.string().uuid().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, description, due_date, priority, deal_id, contact_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title,
        description: description ?? null,
        due_date: due_date ?? null,
        priority: priority ?? "medium",
        deal_id: deal_id ?? null,
        contact_id: contact_id ?? null,
        user_id: ctx.getUserId()!,
      })
      .select()
      .single();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { task: data } };
  },
});
