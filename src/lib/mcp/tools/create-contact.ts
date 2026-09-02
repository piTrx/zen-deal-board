import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_contact",
  title: "Create contact",
  description: "Create a new CRM contact owned by the signed-in user.",
  inputSchema: {
    first_name: z.string().trim().min(1),
    last_name: z.string().trim().min(1),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
    position: z.string().trim().optional(),
    company_id: z.string().uuid().optional().describe("Existing company id, if any."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ first_name, last_name, email, phone, position, company_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        first_name,
        last_name,
        email: email ?? null,
        phone: phone ?? null,
        position: position ?? null,
        company_id: company_id ?? null,
        created_by: ctx.getUserId()!,
      })
      .select()
      .single();
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { contact: data } };
  },
});
