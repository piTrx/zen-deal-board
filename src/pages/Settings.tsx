import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { PipelineSettings } from "@/components/settings/PipelineSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { EmailTemplateSettings } from "@/components/settings/EmailTemplateSettings";
import { ConnectorSettings } from "@/components/settings/ConnectorSettings";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground mt-1">Gestiona tu cuenta y la configuración del embudo.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="pipeline">Embudo</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="templates">Plantillas de correo</TabsTrigger>
          <TabsTrigger value="connectors">Conectores</TabsTrigger>
        </TabsList>

        <TabsContent value="profile"><ProfileSettings /></TabsContent>
        <TabsContent value="pipeline"><PipelineSettings /></TabsContent>
        <TabsContent value="team"><TeamSettings /></TabsContent>
        <TabsContent value="notifications"><NotificationSettings /></TabsContent>
        <TabsContent value="templates"><EmailTemplateSettings /></TabsContent>
        <TabsContent value="connectors"><ConnectorSettings /></TabsContent>
      </Tabs>
    </div>
  );
}
