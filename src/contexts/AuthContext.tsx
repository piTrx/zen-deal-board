import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/*
 * Recuperación de contraseña: guardamos solo una marca (sin token) en sessionStorage
 * cuando el enlace del correo indica type=recovery o llega el evento PASSWORD_RECOVERY.
 * Así la app puede llevar al usuario a /reset-password aunque la sesión se haya
 * creado antes de montar la página o el enlace haya caído en otra ruta.
 */
const RECOVERY_KEY = "a1_password_recovery_at";
const RECOVERY_TTL_MS = 60 * 60 * 1000;

function markRecovery() {
  try { sessionStorage.setItem(RECOVERY_KEY, String(Date.now())); } catch { /* noop */ }
}
export function clearRecoveryFlag() {
  try { sessionStorage.removeItem(RECOVERY_KEY); } catch { /* noop */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("a1-recovery-change"));
}
function readRecovery(): boolean {
  try {
    const at = Number(sessionStorage.getItem(RECOVERY_KEY));
    if (!at) return false;
    if (Date.now() - at > RECOVERY_TTL_MS) { clearRecoveryFlag(); return false; }
    return true;
  } catch { return false; }
}

// Se evalúa al cargar el módulo, antes de que el cliente limpie la URL.
if (typeof window !== "undefined") {
  const h = window.location.hash + window.location.search;
  if (h.includes("type=recovery")) markRecovery();
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** true solo si la sesión procede de un enlace de recuperación reciente. */
  recovery: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  recovery: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(readRecovery);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") { markRecovery(); setRecovery(true); }
        if (event === "SIGNED_OUT") { clearRecoveryFlag(); setRecovery(false); }
        if (event === "USER_UPDATED" && !readRecovery()) setRecovery(false);
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const onStorage = () => setRecovery(readRecovery());
    window.addEventListener("a1-recovery-change", onStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("a1-recovery-change", onStorage);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, recovery: recovery && !!session, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
