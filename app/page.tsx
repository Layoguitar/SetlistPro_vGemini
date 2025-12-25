"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import Onboarding from "./components/Onboarding";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [hasOrganization, setHasOrganization] = useState<boolean | null>(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Revisar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkOrganization(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Si iniciamos sesión, verificamos org de nuevo
        setLoading(true); 
        checkOrganization(session.user.id);
      } else {
        setHasOrganization(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOrganization = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle(); // Usamos maybeSingle para evitar errores si está vacío

      if (error) {
        console.error("Error verificando org:", error);
        // SI HAY ERROR, ASUMIMOS QUE NO TIENE ORG PARA QUE NO SE QUEDE TRABADO
        setHasOrganization(false);
      } else {
        // Si hay datos, tiene org (true). Si data es null, no tiene (false).
        setHasOrganization(!!data);
      }
    } catch (err) {
      console.error("Error crítico:", err);
      setHasOrganization(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setHasOrganization(true);
    // Recargar para asegurar que el Dashboard cargue los datos frescos
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  // AQUÍ ESTÁ LA CLAVE: Si es false, mostramos Onboarding
  if (hasOrganization === false) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Solo si es true mostramos Dashboard
  return <Dashboard />;
}