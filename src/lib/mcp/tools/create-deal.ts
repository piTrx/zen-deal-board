import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_deal",
  title: "Create deal",
  description:
    "Create a new deal for the signed-in user. If no stage is given, the first stage of the first available pipeline is used.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Deal title."),
    value: z.number().nonnegative().optional().describe("Deal value in your currency."),
    stage_id: z.string().uuid().optional().describe("Pipeline stage id (see list_pipelines)."),
    close_date: z.string().optional().describe("Expected close date, YYYY-MM-DD."),
    notes: z.string().optional().describe("Free-form notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, value, stage_id, close_date, notes }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    let stageId = stage_id;
    let pipelineId: string | undefined;

    if (stageId) {
      const { data: stage, error } = await supabase
        .from("pipeline_stages")
        .select("id, pipeline_id")
        .eq("id", stageId)
        .maybeSingle();
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      if (!stage) return { content: [{ type: "text", text: "Stage not found" }], isError: true };
      pipelineId = stage.pipeline_id;
    } else {
      const { data: pipeline, error } = await supabase
        .from("pipelines")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      if (!pipeline) return { content: [{ type: "text", text: "No pipeline found. Create one in the app first." }], isError: true };
      pipelineId = pipeline.id;
      const { data: stage, error: stageError } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("pipeline_id", pipelineId)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (stageError) return { content: [{ type: "text", text: stageError.message }], isError: true };
      if (!stage) return { content: [{ type: "text", text: "Pipeline has no stages." }], isError: true };
      stageId = stage.id;
    }

    const { data, error } = await supabase
      .from("deals")
      .insert({
        title,
        value: value ?? null,
        close_date: close_date ?? null,
        notes: notes ?? null,
        stage_id: stageId!,
        pipeline_id: pipelineId!,
        owner_id: userId!,
        created_by: userId!,
      })
      .select()
      .single();

    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { deal: data } };
  },
});
