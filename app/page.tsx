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
    // Verificar sesión al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkUserOrg(session.user.id);
      else setLoading(false);
    });

    // Escuchar cambios de sesión (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserOrg(session.user.id);
      } else {
        setLoading(false);
        setHasOrg(null);
        setShowLogin(false); // Si cierra sesión, volver a la Landing
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserOrg = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setHasOrg(true);
      } else {
        setHasOrg(false);
      }
    } catch (error) {
      console.error(error);
      setHasOrg(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // 1. USUARIO LOGUEADO
  if (session) {
    // AQUÍ ESTÁ EL ARREGLO: Agregamos onComplete
    if (hasOrg === false) return <Onboarding onComplete={() => window.location.reload()} />;
    if (hasOrg === true) return <Dashboard />;
    return <div className="bg-black h-screen"></div>;
  }

  // 2. USUARIO NO LOGUEADO (Visitante)
  
  // Si hizo clic en "Iniciar Sesión", mostramos el formulario
  if (showLogin) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative">
             <button 
                onClick={() => setShowLogin(false)} 
                className="absolute top-6 left-6 text-sm font-bold text-gray-500 hover:text-black flex items-center gap-2 transition-colors"
             >
                ← Volver al inicio
             </button>
             <Auth />
        </div>
    );
  }

  // Por defecto: Mostramos la LANDING PAGE
  return <LandingPage onLoginClick={() => setShowLogin(true)} />;
}