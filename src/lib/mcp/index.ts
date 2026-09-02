import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listDealsTool from "./tools/list-deals";
import createDealTool from "./tools/create-deal";
import listPipelinesTool from "./tools/list-pipelines";
import listContactsTool from "./tools/list-contacts";
import createContactTool from "./tools/create-contact";
import listTasksTool from "./tools/list-tasks";
import createTaskTool from "./tools/create-task";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "mycrm",
  title: "MyCRM",
  version: "0.1.0",
  instructions:
    "Tools for the MyCRM sales CRM. Read and create deals, contacts and tasks, and inspect pipelines and their stages. All calls act as the signed-in CRM user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listPipelinesTool,
    listDealsTool,
    createDealTool,
    listContactsTool,
    createContactTool,
    listTasksTool,
    createTaskTool,
  ],
});
