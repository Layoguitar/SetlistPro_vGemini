"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import LandingPage from './components/LandingPage';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasOrg, setHasOrg] = useState<boolean | null>(null);
  
  // Estado para controlar si mostramos el Login o la Landing
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // 1. Verificar sesión al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserOrg(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Escuchar cambios de sesión (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Al loguearse, ponemos loading true mientras verificamos la org
        setLoading(true);
        checkUserOrg(session.user.id);
      } else {
        setLoading(false);
        setHasOrg(null);
        setShowLogin(false); // Al cerrar sesión, volvemos a la Landing
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserOrg = async (userId: string) => {
    try {
      // Usamos .select() en lugar de .maybeSingle() para ser más robustos
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId);

      if (error) {
        console.error("Error consultando organización:", error.message);
        // Si hay un error de conexión o RLS, por seguridad no lo enviamos al onboarding
        // Podrías mostrar un mensaje de error o reintentar
        setHasOrg(false); 
      } else {
        // Si 'data' tiene elementos, es que el usuario pertenece a una banda
        if (data && data.length > 0) {
          console.log("Organización encontrada, redirigiendo a Dashboard...");
          setHasOrg(true);
        } else {
          console.log("No se encontraron organizaciones. Usuario nuevo.");
          setHasOrg(false);
        }
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      setHasOrg(false);
    } finally {
      setLoading(false);
    }
  };

  // PANTALLA DE CARGA
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // A. SI EL USUARIO YA INICIÓ SESIÓN
  if (session) {
    if (hasOrg === false) return <Onboarding onComplete={() => window.location.reload()} />;
    if (hasOrg === true) return <Dashboard />;
    // Estado fallback
    return <div className="bg-black h-screen"></div>;
  }

  // B. SI EL USUARIO NO HA INICIADO SESIÓN (VISITANTE)
  
  // Caso 1: Hizo clic en "Iniciar Sesión" -> Mostramos el Login con FONDO OSCURO
  if (showLogin) {
    return (
        <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-4 relative overflow-hidden">
             
             {/* FONDO ANIMADO */}
             <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,#030303_0%,transparent_100%)]"></div>
             </div>

             {/* Botón Volver */}
             <button 
                onClick={() => setShowLogin(false)} 
                className="absolute top-6 left-6 text-sm font-bold text-gray-500 hover:text-white flex items-center gap-2 transition-colors z-20"
             >
                ← Volver al inicio
             </button>
             
             {/* Formulario Auth centrado */}
             <div className="relative z-10 w-full flex justify-center">
                <Auth />
             </div>
        </div>
    );
  }

  // Caso 2: Por defecto -> Mostramos la LANDING PAGE
  return <LandingPage onLoginClick={() => setShowLogin(true)} />;
}