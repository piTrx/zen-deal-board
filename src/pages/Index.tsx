import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, Euro, Target, Clock, Kanban, Users, Building2, CheckSquare, ArrowRight, CalendarDays,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ClosingSoon } from "@/components/dashboard/ClosingSoon";
import { startOfWeek, startOfMonth, startOfQuarter, format } from "date-fns";
import { es } from "date-fns/locale";

type Period = "week" | "month" | "quarter" | "all";

function getStartDate(period: Period): string | null {
  const now = new Date();
  if (period === "week") return startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  if (period === "month") return startOfMonth(now).toISOString();
  if (period === "quarter") return startOfQuarter(now).toISOString();
  return null;
}

const periods: { label: string; value: Period }[] = [
  { label: "Esta semana", value: "week" },
  { label: "Este mes", value: "month" },
  { label: "Este trimestre", value: "quarter" },
  { label: "Todo el tiempo", value: "all" },
];

export default function Index() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("month");
  const since = getStartDate(period);

  const { data: profile } = useQuery({
    queryKey: ["profile-dashboard", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("avatar_url, full_name").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Totales reales (RLS limita a lo visible por el usuario/equipo)
  const { data: totals, isLoading: totalsLoading } = useQuery({
    queryKey: ["dashboard-totals"],
    enabled: !!user,
    queryFn: async () => {
      const [deals, contacts, companies, tasks] = await Promise.all([
        supabase.from("deals").select("*", { count: "exact", head: true }),
        supabase.from("contacts").select("*", { count: "exact", head: true }),
        supabase.from("companies").select("*", { count: "exact", head: true }),
        supabase.from("tasks" as any).select("*", { count: "exact", head: true }).eq("completed", false),
      ]);
      return {
        deals: deals.count ?? 0,
        contacts: contacts.count ?? 0,
        companies: companies.count ?? 0,
        tasks: tasks.count ?? 0,
      };
    },
  });

  // Pipeline por etapas reales del primer pipeline
  const { data: stageData, isLoading: stagesLoading } = useQuery({
    queryKey: ["dashboard-stages"],
    enabled: !!user,
    queryFn: async () => {
      const { data: pipelines } = await supabase.from("pipelines").select("id, name").order("created_at").limit(1);
      if (!pipelines?.length) return null;
      const p = pipelines[0];
      const [{ data: stages }, { data: deals }] = await Promise.all([
        supabase.from("pipeline_stages").select("id, name, color, position").eq("pipeline_id", p.id).order("position"),
        supabase.from("deals").select("stage_id, value").eq("pipeline_id", p.id),
      ]);
      const rows = (stages ?? []).map((s: any) => {
        const ds = deals?.filter((d: any) => d.stage_id === s.id) ?? [];
        return { id: s.id, name: s.name, color: s.color, count: ds.length, value: ds.reduce((a, d: any) => a + Number(d.value || 0), 0) };
      });
      return { name: p.name, rows, max: Math.max(1, ...rows.map((r) => r.count)) };
    },
  });

  const { data: upcoming, isLoading: upcomingLoading } = useQuery({
    queryKey: ["dashboard-upcoming-tasks"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks" as any)
        .select("id, title, due_date, priority")
        .eq("completed", false)
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; title: string; due_date: string | null; priority: string }[];
    },
  });

  // Métricas del periodo (lógica anterior conservada)
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", period],
    queryFn: async () => {
      let dealsQuery = supabase.from("deals").select("*", { count: "exact", head: true });
      let valueQuery = supabase.from("deals").select("value");
      if (since) {
        dealsQuery = dealsQuery.gte("created_at", since);
        valueQuery = valueQuery.gte("created_at", since);
      }
      const { count: totalDeals } = await dealsQuery;
      const { data: valueData } = await valueQuery;
      const totalValue = valueData?.reduce((sum, d: any) => sum + Number(d.value || 0), 0) || 0;

      const { data: stages } = await supabase.from("pipeline_stages").select("id, name").in("name", ["Won", "Lost"]);
      const wonId = stages?.find((s: any) => s.name === "Won")?.id;
      const lostId = stages?.find((s: any) => s.name === "Lost")?.id;
      let wonQuery = supabase.from("deals").select("*", { count: "exact", head: true }).eq("stage_id", wonId || "");
      let lostQuery = supabase.from("deals").select("*", { count: "exact", head: true }).eq("stage_id", lostId || "");
      if (since) {
        wonQuery = wonQuery.gte("created_at", since);
        lostQuery = lostQuery.gte("created_at", since);
      }
      const { count: wonCount } = await wonQuery;
      const { count: lostCount } = await lostQuery;
      const closedTotal = (wonCount || 0) + (lostCount || 0);
      const winRate = closedTotal > 0 ? Math.round(((wonCount || 0) / closedTotal) * 100) : 0;

      let avgCycle = 0;
      if (user) {
        const { data: cycleData } = await (supabase.rpc as any)("avg_sales_cycle", { p_user_id: user.id, p_since: since });
        avgCycle = Number(cycleData) || 0;
      }
      return { totalDeals: totalDeals || 0, totalValue, winRate, avgCycle };
    },
  });

  const name = profile?.full_name || user?.user_metadata?.full_name || "";

  const kpis = [
    { label: "Oportunidades", value: totals?.deals, icon: Kanban, to: "/pipeline" },
    { label: "Contactos", value: totals?.contacts, icon: Users, to: "/contacts" },
    { label: "Empresas", value: totals?.companies, icon: Building2, to: "/companies" },
    { label: "Tareas pendientes", value: totals?.tasks, icon: CheckSquare, to: "/tasks" },
  ];

  const periodStats = [
    { label: "Ofertas creadas", value: String(stats?.totalDeals || 0), icon: Target },
    { label: "Valor del pipeline", value: formatCurrency(stats?.totalValue || 0), icon: Euro },
    { label: "Tasa de éxito", value: `${stats?.winRate || 0}%`, icon: TrendingUp },
    { label: "Ciclo medio", value: stats?.avgCycle ? `${stats.avgCycle} días` : "—", icon: Clock },
  ];

  return (
    <div className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={profile?.avatar_url || ""} className="object-cover" alt="" />
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {(name || user?.email || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Panel de control</h1>
            <p className="truncate text-sm text-muted-foreground">
              {name ? `Hola, ${name}. ` : ""}Este es el estado actual de tu trabajo comercial.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/tasks"><CheckSquare className="h-4 w-4" /> Tareas</Link></Button>
          <Button asChild size="sm"><Link to="/pipeline"><Kanban className="h-4 w-4" /> Abrir pipeline</Link></Button>
        </div>
      </header>

      <section aria-label="Resumen" className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to}
            className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{k.label}</span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <k.icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            {totalsLoading ? <Skeleton className="h-8 w-16" /> : (
              <p className="text-3xl font-bold tabular-nums">{k.value ?? 0}</p>
            )}
            <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary">
              Ver todo <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base font-semibold">
              Pipeline por etapas{stageData?.name ? <span className="font-normal text-muted-foreground"> · {stageData.name}</span> : null}
            </CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/pipeline">Ver pipeline <ArrowRight className="h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent>
            {stagesLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : !stageData || stageData.rows.length === 0 ? (
              <div className="flex flex-col items-start gap-3 py-6 text-sm text-muted-foreground">
                <p>Aún no hay etapas configuradas.</p>
                <Button asChild variant="outline" size="sm"><Link to="/settings">Configurar pipeline</Link></Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {stageData.rows.map((r) => (
                  <li key={r.id} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 sm:grid-cols-[minmax(0,11rem)_1fr_auto]">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} aria-hidden="true" />
                      <span className="truncate">{r.name}</span>
                    </span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <span className="block h-full rounded-full" style={{ width: `${(r.count / stageData.max) * 100}%`, backgroundColor: r.color }} />
                    </span>
                    <span className="text-right text-sm tabular-nums">
                      <strong>{r.count}</strong>
                      <span className="hidden text-muted-foreground sm:inline"> · {formatCurrency(r.value)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base font-semibold">Próximas tareas</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/calendar"><CalendarDays className="h-4 w-4" /> Agenda</Link></Button>
          </CardHeader>
          <CardContent>
            {upcomingLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !upcoming?.length ? (
              <div className="flex flex-col items-start gap-3 py-6 text-sm text-muted-foreground">
                <p>No tienes tareas pendientes.</p>
                <Button asChild variant="outline" size="sm"><Link to="/tasks">Ir a tareas</Link></Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="truncate text-sm">{t.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t.due_date ? format(new Date(t.due_date), "d MMM", { locale: es }) : "Sin fecha"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="period-title" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="period-title" className="text-lg font-semibold">Métricas del periodo</h2>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Periodo"><SelectValue /></SelectTrigger>
            <SelectContent>
              {periods.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 xl:grid-cols-4">
          {periodStats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-primary" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-7 w-20" /> : <div className="text-xl font-semibold tabular-nums">{s.value}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivity since={since} />
          <ClosingSoon since={since} />
        </div>
      </section>
    </div>
  );
}
