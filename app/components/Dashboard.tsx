"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  LayoutGrid, 
  Music, 
  Calendar, 
  Users, 
  UserCircle, 
  LogOut, 
  Plus, 
  Search, 
  Bell,
  Menu,
  X
} from 'lucide-react';

// Importamos tus componentes existentes
import SongLibrary from './SongLibrary';
import TeamManager from './TeamManager';
import ProfileSettings from './ProfileSettings';
// Si tienes un componente de Eventos, impórtalo aquí. Si no, usaremos un placeholder.
// import EventManager from './EventManager'; 

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [greeting, setGreeting] = useState('');

  // Efecto para cargar sesión y perfil
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
    });
    
    // Configurar saludo según la hora
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');

  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- VISTA: INICIO (HOME) ---
  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER DE BIENVENIDA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {greeting}, <span className="text-indigo-400">{profile?.full_name?.split(' ')[0] || 'Musico'}</span>
          </h1>
          <p className="text-gray-400 mt-1">Aquí tienes el resumen de tu ministerio hoy.</p>
        </div>
        <div className="flex gap-3">
             <button className="p-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
             </button>
             <button className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
                <Plus size={18} /> Nuevo Evento
             </button>
        </div>
      </div>

      {/* WIDGETS DE RESUMEN (BENTO GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Widget 1: Próximo Evento */}
        <div className="md:col-span-2 bg-[#111] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 blur-[50px] rounded-full group-hover:bg-indigo-600/20 transition-all"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider">Próximo Servicio</span>
                        <h3 className="text-2xl font-bold text-white mt-1">Culto Dominical AM</h3>
                    </div>
                    <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-mono text-gray-300">
                        DOM 10:00 AM
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">1</div>
                        <div className="flex-1">
                            <div className="text-white font-medium text-sm">Way Maker</div>
                            <div className="text-gray-500 text-xs">G • 68 BPM</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">2</div>
                        <div className="flex-1">
                            <div className="text-white font-medium text-sm">La Bondad de Dios</div>
                            <div className="text-gray-500 text-xs">A • 72 BPM</div>
                        </div>
                    </div>
                </div>

                <button onClick={() => setActiveTab('events')} className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-bold text-gray-300 transition-all">
                    Ver Setlist Completo
                </button>
            </div>
        </div>

        {/* Widget 2: Acciones Rápidas */}
        <div className="space-y-6">
             {/* Stats Card */}
             <div className="bg-[#111] border border-white/10 p-6 rounded-3xl">
                 <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Tu Repertorio</h3>
                 <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-black text-white">124</span>
                     <span className="text-sm text-gray-500">canciones</span>
                 </div>
                 <div className="mt-4 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[70%]"></div>
                 </div>
                 <p className="text-xs text-gray-500 mt-2">12 añadidas este mes</p>
             </div>

             {/* Quick Search */}
             <div 
                onClick={() => setActiveTab('songs')}
                className="bg-gradient-to-br from-indigo-900/20 to-[#111] border border-indigo-500/20 p-6 rounded-3xl cursor-pointer hover:border-indigo-500/50 transition-all group"
             >
                 <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mb-4 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                     <Search size={20} />
                 </div>
                 <h3 className="font-bold text-white">Buscar Canción</h3>
                 <p className="text-gray-400 text-sm mt-1">Encuentra acordes rápido.</p>
             </div>
        </div>

      </div>
    </div>
  );

  // --- COMPONENTE PLACEHOLDER PARA EVENTOS (Si no lo tienes aun) ---
  const EventsPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 animate-in fade-in">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Calendar size={40} className="text-gray-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Calendario de Eventos</h2>
        <p className="text-gray-400 max-w-md">Aquí podrás crear y gestionar los servicios dominicales y ensayos.</p>
        <button className="mt-6 px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">
            Crear primer evento
        </button>
    </div>
  );

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-indigo-500 selection:text-white flex relative overflow-hidden">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* --- SIDEBAR (SOLO DESKTOP) --- */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-[#050505] relative z-20 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Music size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">SetlistPro</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
            {[
                { id: 'home', label: 'Inicio', icon: LayoutGrid },
                { id: 'songs', label: 'Canciones', icon: Music },
                { id: 'events', label: 'Eventos', icon: Calendar },
                { id: 'team', label: 'Equipo', icon: Users },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeTab === item.id 
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <item.icon size={18} />
                    {item.label}
                </button>
            ))}
        </nav>

        {/* PERFIL MINI EN SIDEBAR */}
        <div className="p-4 border-t border-white/5">
            <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 w-full p-2 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-white/5' : 'hover:bg-white/5'}`}
            >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 border border-white/10">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-indigo-900 text-indigo-200">
                             {profile?.full_name?.substring(0,2).toUpperCase() || 'YO'}
                        </div>
                    )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                    <div className="text-sm font-bold truncate text-white">{profile?.full_name || 'Usuario'}</div>
                    <div className="text-xs text-gray-500 truncate">Mi Cuenta</div>
                </div>
            </button>
            <button onClick={handleLogout} className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 py-2">
                <LogOut size={14} /> Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative z-10 h-screen overflow-y-auto pb-24 md:pb-0">
         <div className="max-w-6xl mx-auto p-4 md:p-8">
            
            {/* Header Móvil (Solo visible en celular) */}
            <div className="md:hidden flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Music size={16} />
                    </div>
                    <span className="font-bold text-lg">SetlistPro</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden" onClick={() => setActiveTab('profile')}>
                     {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                             {profile?.full_name?.substring(0,2).toUpperCase() || 'YO'}
                        </div>
                    )}
                </div>
            </div>

            {/* RENDERIZADO DE PESTAÑAS */}
            {activeTab === 'home' && renderHome()}
            {activeTab === 'songs' && <SongLibrary />}
            {activeTab === 'events' && <EventsPlaceholder />} {/* O usa <EventManager /> si lo tienes */}
            {activeTab === 'team' && <TeamManager />}
            {activeTab === 'profile' && <ProfileSettings />}
         
         </div>
      </main>

      {/* --- BOTTOM NAVIGATION (SOLO MÓVIL) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
        <div className="flex justify-around items-center p-2">
            {[
                { id: 'home', label: 'Inicio', icon: LayoutGrid },
                { id: 'songs', label: 'Canciones', icon: Music },
                { id: 'events', label: 'Eventos', icon: Calendar },
                { id: 'team', label: 'Equipo', icon: Users },
                { id: 'profile', label: 'Perfil', icon: UserCircle },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                        activeTab === item.id 
                        ? 'text-indigo-400' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                    <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            ))}
        </div>
      </nav>

    </div>
  );
}