"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard"; // Asegúrate que Dashboard.tsx exista
import Onboarding from "./components/Onboarding";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [hasOrganization, setHasOrganization] = useState<boolean | null>(null); // null = cargando
  const [loading, setLoading] = useState(true);

  // 1. Verificar Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkOrganization(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkOrganization(session.user.id);
      else {
        setHasOrganization(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Verificar si pertenece a alguna organización
  const checkOrganization = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', userId)
        .limit(1); // Solo necesitamos saber si existe al menos uno

      if (error) throw error;
      
      setHasOrganization(data && data.length > 0);
    } catch (err) {
      console.error("Error checking org:", err);
    } finally {
      setLoading(false);
    }
  };

  // Callback cuando termina el onboarding
  const handleOnboardingComplete = () => {
    setHasOrganization(true); // Ya tiene org, mostrar dashboard
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

  // SI NO TIENE ORGANIZACIÓN -> ONBOARDING
  if (hasOrganization === false) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // SI TIENE ORGANIZACIÓN -> DASHBOARD
  return <Dashboard />;
}