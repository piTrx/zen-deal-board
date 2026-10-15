import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPanel } from "@/components/auth/LoginPanel";
import { A1Logo } from "@/components/A1Mark";
import authBgAsset from "@/assets/auth-bg.jpg.asset.json";
import {
  Kanban, Users, CheckSquare, LayoutDashboard, Activity, CalendarDays, ShieldCheck, LifeBuoy, Building2,
} from "lucide-react";

const features = [
  { icon: Kanban, title: "Pipeline y oportunidades" },
  { icon: Users, title: "Contactos y empresas" },
  { icon: CheckSquare, title: "Tareas y seguimiento" },
];

const blocks = [
  { icon: Kanban, title: "Gestionar pipeline", text: "Mueve cada oportunidad entre las etapas definidas por tu equipo y consulta su estado." },
  { icon: Building2, title: "Centralizar información", text: "Contactos, empresas y notas de cada cliente reunidos en una misma ficha." },
  { icon: CheckSquare, title: "Organizar el trabajo", text: "Tareas con fecha, actividades registradas y calendario para planificar el día." },
];

const inside = [
  { icon: LayoutDashboard, title: "Dashboard", text: "Resumen de oportunidades, contactos, empresas y tareas pendientes." },
  { icon: Kanban, title: "Pipeline comercial", text: "Tablero por etapas con las oportunidades de tu equipo." },
  { icon: Activity, title: "Actividad reciente", text: "Llamadas, correos, reuniones y mensajes registrados." },
  { icon: CalendarDays, title: "Agenda y tareas", text: "Próximas tareas y calendario de seguimiento." },
];

export default function Landing() {
  const { session, loading, recovery } = useAuth();
  if (!loading && session) return <Navigate to={recovery ? "/reset-password" : "/dashboard"} replace />;

  return (
    <div className="force-light min-h-screen bg-background text-foreground">
      <a href="#acceso" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">
        Ir al acceso
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-8 lg:px-12">
          <Link to="/" aria-label="A1 CRM, inicio"><A1Logo /></Link>
          <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-4">
            <a href="#acceso" className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Acceso seguro</span>
            </a>
            <a href="#ayuda" className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <LifeBuoy className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Ayuda</span>
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden" aria-labelledby="hero-title">
          <img src={authBgAsset.url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
          <div className="relative grid w-full gap-10 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.2fr_minmax(0,440px)] lg:items-center lg:gap-16 lg:px-12 lg:py-24">
            <div className="max-w-2xl space-y-6">
              <h1 id="hero-title" className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl xl:text-6xl">
                Accede a tu espacio de trabajo comercial
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Desde aquí podrás consultar contactos y empresas, hacer seguimiento de oportunidades,
                organizar tus tareas y revisar tu actividad diaria.
              </p>
              <ul className="grid gap-3 sm:grid-cols-3">
                {features.map((f) => (
                  <li key={f.title} className="flex items-center gap-3 rounded-xl border border-border bg-card/80 p-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium">{f.title}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div id="acceso" className="scroll-mt-24">
              <LoginPanel postAuthUrl={window.location.origin} />
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-14 sm:px-8 lg:px-12" aria-label="Qué puedes hacer">
          <div className="grid gap-5 md:grid-cols-3">
            {blocks.map((b) => (
              <article key={b.title} className="rounded-2xl border border-border bg-card p-6">
                <b.icon className="mb-4 h-6 w-6 text-primary" aria-hidden="true" />
                <h2 className="mb-2 text-lg font-semibold">{b.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{b.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="w-full bg-secondary/60 px-4 py-14 sm:px-8 lg:px-12" aria-labelledby="inside-title">
          <h2 id="inside-title" className="mb-8 text-2xl font-bold sm:text-3xl">Qué encontrarás dentro de A1 CRM</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {inside.map((i) => (
              <article key={i.title} className="rounded-2xl bg-card p-6 shadow-sm">
                <i.icon className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mb-1 font-semibold">{i.title}</h3>
                <p className="text-sm text-muted-foreground">{i.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="ayuda" className="w-full scroll-mt-20 px-4 py-14 sm:px-8 lg:px-12" aria-labelledby="help-title">
          <h2 id="help-title" className="mb-4 text-2xl font-bold">Ayuda</h2>
          <ul className="max-w-3xl space-y-3 text-sm text-muted-foreground">
            <li><strong className="text-foreground">¿Olvidaste tu contraseña?</strong> Pulsa el enlace del formulario de acceso y te enviaremos un enlace de recuperación.</li>
            <li><strong className="text-foreground">¿Te han invitado?</strong> Abre el enlace de invitación recibido o <Link to="/auth" className="font-medium text-primary hover:underline">crea tu cuenta aquí</Link> con el mismo correo.</li>
            <li><strong className="text-foreground">¿Sin acceso?</strong> Pide a un administrador de tu equipo que te envíe una invitación.</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-6 text-sm text-muted-foreground sm:px-8 lg:px-12">
        © {new Date().getFullYear()} A1 CRM · Uso interno
      </footer>
    </div>
  );
}
