"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import SetlistEditor from "./components/SetlistEditor";
import LiveSetlist from "./components/LiveSetlist";
import SongLibrary from "./components/SongLibrary";
import Onboarding from "./components/Onboarding"; 
import { LogOut, Loader2 } from "lucide-react";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null); 
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'live' | 'songs'>('dashboard');
  const [selectedSetlistId, setSelectedSetlistId] = useState<string | null>(null);

  // 1. CONTROL DE SESIÓN Y PERFIL
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
      else setLoadingProfile(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkProfile(session.user.id);
      else {
        setHasProfile(false);
        setLoadingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. FUNCIÓN PARA VERIFICAR SI EL USUARIO EXISTE EN LA TABLA PROFILES
  const checkProfile = async (userId: string) => {
    setLoadingProfile(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    // Si no hay perfil, hasProfile es false para mostrar el Onboarding
    setHasProfile(!!data && !error);
    setLoadingProfile(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setHasProfile(null);
  };

  // 3. FUNCIONES DE NAVEGACIÓN (Para pasar al Dashboard)
  const handleCreateNew = () => { 
    setSelectedSetlistId(null); 
    setCurrentView('editor'); 
  };
  
  const handleEdit = (id: string) => { 
    setSelectedSetlistId(id); 
    setCurrentView('editor'); 
  };
  
  const handleGoLive = (id: string) => { 
    setSelectedSetlistId(id); 
    setCurrentView('live'); 
  };
  
  const handleBackToDashboard = () => { 
    setCurrentView('dashboard'); 
    setSelectedSetlistId(null); 
  };

  // --- LÓGICA DE RENDERIZADO ---

  // A. Pantalla de carga inicial
  if (loadingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Cargando SetlistPro...</p>
      </div>
    );
  }

  // B. Si no hay sesión iniciada
  if (!session) return <Auth />;

  // C. Si hay sesión pero no ha elegido si es Líder o Músico (Onboarding)
  if (session && hasProfile === false) {
    return (
      <Onboarding 
        userId={session.user.id} 
        userEmail={session.user.email || ""} 
        onComplete={() => checkProfile(session.user.id)} 
      />
    );
  }

  // D. Aplicación principal (Dashboard, Editor, etc.)
  return (
    <main className="min-h-screen bg-gray-50">
      
      {/* Header de navegación (Se oculta en el modo en vivo para no distraer) */}
      {currentView !== 'live' && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo y Nombre */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToDashboard}>
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                 <span className="text-white font-bold text-xs">SP</span>
              </div>
              <span className="font-bold text-gray-900 text-lg hidden sm:block tracking-tight">SetlistPro</span>
            </div>
            
            {/* Menú Central */}
            <nav className="flex items-center gap-1">
               <button 
                onClick={() => setCurrentView('dashboard')} 
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 Agenda
               </button>
               <button 
                onClick={() => setCurrentView('songs')} 
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${currentView === 'songs' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
               >
                 Canciones
               </button>
            </nav>

            {/* Cerrar Sesión */}
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2 transition-colors flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-bold uppercase">Salir</span>
              <LogOut size={20} />
            </button>
          </div>
        </header>
      )}

      {/* Contenedor de Vistas */}
      <div className={`mx-auto ${currentView === 'live' ? '' : 'p-6 max-w-6xl'}`}>
        
        {/* VISTA 1: DASHBOARD (Aquí pasamos las nuevas funciones) */}
        {currentView === 'dashboard' && (
          <Dashboard 
            onCreateNew={handleCreateNew} 
            onEditSetlist={handleEdit} 
            onGoLive={handleGoLive} 
          />
        )}

        {/* VISTA 2: EDITOR DE SETLISTS */}
        {currentView === 'editor' && (
           <div className="relative">
              <SetlistEditor setlistId={selectedSetlistId} onBack={handleBackToDashboard} />
              
              {/* Botón flotante para ir al modo vivo si el setlist ya existe */}
              {selectedSetlistId && (
                  <div className="fixed bottom-8 right-8 z-50">
                      <button 
                        onClick={() => handleGoLive(selectedSetlistId!)} 
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                      >
                          ⚡ MODO EN VIVO
                      </button>
                  </div>
              )}
           </div>
        )}

        {/* VISTA 3: MODO LECTURA (LIVE) */}
        {currentView === 'live' && selectedSetlistId && (
          <LiveSetlist setlistId={selectedSetlistId} onBack={handleBackToDashboard} />
        )}

        {/* VISTA 4: BIBLIOTECA DE CANCIONES */}
        {currentView === 'songs' && (
           <SongLibrary onBack={handleBackToDashboard} />
        )}

      </div>
    </main>
  );
}