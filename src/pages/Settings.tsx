import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { PipelineSettings } from "@/components/settings/PipelineSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { EmailTemplateSettings } from "@/components/settings/EmailTemplateSettings";
import { ConnectorSettings } from "@/components/settings/ConnectorSettings";
import { AiSettings } from "@/components/settings/AiSettings";

export default function Settings() {
  const [params] = useSearchParams();
  const defaultTab = params.get("tab") || "profile";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground mt-1">Gestiona tu cuenta y la configuración del pipeline.</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="templates">Plantillas de correo</TabsTrigger>
          <TabsTrigger value="connectors">Conectores</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
        </TabsList>

        <TabsContent value="profile"><ProfileSettings /></TabsContent>
        <TabsContent value="pipeline"><PipelineSettings /></TabsContent>
        <TabsContent value="team"><TeamSettings /></TabsContent>
        <TabsContent value="notifications"><NotificationSettings /></TabsContent>
        <TabsContent value="templates"><EmailTemplateSettings /></TabsContent>
        <TabsContent value="connectors"><ConnectorSettings /></TabsContent>
        <TabsContent value="ia"><AiSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
