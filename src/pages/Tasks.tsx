import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { TaskItem } from "@/components/tasks/TaskItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageBanner } from "@/components/PageBanner";
import { Plus, CheckSquare, Search } from "lucide-react";

export default function Tasks() {
  const [tab, setTab] = useState("todo");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: tasks, isLoading } = useTasks({ completed: tab === "completed" });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filtered = tasks
    ?.filter((t) => !priorityFilter || t.priority === priorityFilter)
    .filter((t) => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageBanner title="Tareas" description="Gestiona tus pendientes y recordatorios.">
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Añadir tarea
        </Button>
      </PageBanner>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="todo">Pendientes</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Todas las prioridades" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : !filtered?.length ? (
        <div className="flex flex-col items-center py-16">
          <CheckSquare className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-lg">{tab === "todo" ? "Todavía no hay tareas" : "No hay tareas completadas"}</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {tab === "todo" ? "Crea tu primera tarea para empezar." : "Completa una tarea para verla aquí."}
          </p>
          {tab === "todo" && (
            <Button variant="secondary" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Añadir tarea
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => <TaskItem key={task.id} task={task} onClick={() => setSelectedTask(task)} />)}
        </div>
      )}

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
      <TaskDetailDialog task={selectedTask} open={!!selectedTask} onOpenChange={(o) => { if (!o) setSelectedTask(null); }} />
    </div>
  );
}
