import { cn } from "@/lib/utils";

/** Marca A1 CRM: cuadrado naranja con "A1". */
export function A1Mark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold tracking-tight text-primary-foreground",
        className,
      )}
    >
      A1
    </span>
  );
}

export function A1Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <A1Mark />
      <span className="text-lg font-bold tracking-tight text-foreground">
        A1 <span className="text-primary">CRM</span>
      </span>
    </span>
  );
}
