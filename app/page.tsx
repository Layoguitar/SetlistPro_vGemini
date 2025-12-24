"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient"; // Asegúrate de importar esto
import Auth from "./components/Auth"; // Importamos el Login
import Dashboard from "./components/Dashboard";
import SetlistEditor from "./components/SetlistEditor";
import LiveSetlist from "./components/LiveSetlist";
import SongLibrary from "./components/SongLibrary";
import { LogOut } from "lucide-react";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'live' | 'songs'>('dashboard');
  const [selectedSetlistId, setSelectedSetlistId] = useState<string | null>(null);

  // 1. ESCUCHAR ESTADO DE SESIÓN (Login/Logout)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- SI NO HAY SESIÓN, MOSTRAMOS LOGIN ---
  if (!session) {
    return <Auth />;
  }

  // --- SI HAY SESIÓN, MOSTRAMOS LA APP ---
  const handleCreateNew = () => { setSelectedSetlistId(null); setCurrentView('editor'); };
  const handleEdit = (id: string) => { setSelectedSetlistId(id); setCurrentView('editor'); };
  const handleGoLive = (id: string) => { setSelectedSetlistId(id); setCurrentView('live'); };
  const handleBackToDashboard = () => { setCurrentView('dashboard'); setSelectedSetlistId(null); };

  return (
    <main className="min-h-screen bg-gray-50">
      
      {currentView !== 'live' && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToDashboard}>
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                 <span className="text-white font-bold text-xs">SP</span>
              </div>
              <span className="font-bold text-gray-900 text-lg hidden sm:block">SetlistPro</span>
            </div>
            
            <nav className="flex items-center gap-1">
               <button onClick={() => setCurrentView('dashboard')} className={`px-3 py-2 text-sm font-medium rounded-lg ${currentView === 'dashboard' ? 'bg-gray-100' : 'text-gray-500'}`}>1) Agenda</button>
               <button onClick={() => setCurrentView(selectedSetlistId ? 'editor' : 'dashboard')} className={`px-3 py-2 text-sm font-medium rounded-lg ${currentView === 'editor' ? 'bg-gray-100' : 'text-gray-500'}`}>2) Setlist</button>
               <button onClick={() => setCurrentView('songs')} className={`px-3 py-2 text-sm font-medium rounded-lg ${currentView === 'songs' ? 'bg-gray-100' : 'text-gray-500'}`}>4) Canciones</button>
            </nav>

            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 p-2" title="Cerrar Sesión">
              <LogOut size={20} />
            </button>
          </div>
        </header>
      )}

      <div className={`mx-auto ${currentView === 'live' ? '' : 'p-6 max-w-6xl'}`}>
        {currentView === 'dashboard' && <Dashboard onCreateNew={handleCreateNew} onEditSetlist={handleEdit} />}
        {currentView === 'editor' && (
           <div className="relative">
              <SetlistEditor setlistId={selectedSetlistId} onBack={handleBackToDashboard} />
              {selectedSetlistId && (
                  <div className="fixed bottom-6 right-6 z-50">
                      <button onClick={() => handleGoLive(selectedSetlistId!)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transition-transform hover:scale-105">
                          ⚡ MODO EN VIVO
                      </button>
                  </div>
              )}
           </div>
        )}
        {currentView === 'live' && selectedSetlistId && <LiveSetlist setlistId={selectedSetlistId} onBack={handleBackToDashboard} />}
        {currentView === 'songs' && <SongLibrary onBack={handleBackToDashboard} />}
      </div>
    </main>
  );
}