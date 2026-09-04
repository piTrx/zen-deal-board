import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchX, ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const wittyLines = [
    "Parece que este trato se cayó del pipeline.",
    "Esta página nos dio plantón como un lead frío.",
    "Buscamos en cada etapa del pipeline. Nada.",
    "Ni nuestro mejor comercial pudo cerrar esta página.",
  ];

  const randomLine = wittyLines[Math.floor(Math.random() * wittyLines.length)];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-lg space-y-6">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <SearchX className="h-12 w-12 text-primary" />
        </div>

        <div className="space-y-2">
          <h1
            className="text-7xl font-bold text-primary"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            404
          </h1>
          <p className="text-xl font-medium text-foreground">Página no encontrada</p>
        </div>

        <p className="text-muted-foreground text-lg italic">"{randomLine}"</p>

        <p className="text-sm text-muted-foreground">
          Redirigiendo a tu panel en{" "}
          <span className="font-semibold text-primary">{countdown}s</span>
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => navigate("/dashboard")} className="gap-2">
            <Home className="h-4 w-4" />
            Panel
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/60">
          Intentaste acceder a: <code className="rounded bg-muted px-1.5 py-0.5">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
