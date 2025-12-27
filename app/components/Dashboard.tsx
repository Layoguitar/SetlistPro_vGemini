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
  Loader2
} from 'lucide-react';

// Importamos tus componentes
import SongLibrary from './SongLibrary';
import ProfileSettings from './ProfileSettings';
// NOTA: No importamos TeamManager aquí porque ese es para eventos específicos.
// Usaremos un placeholder para el equipo global.

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orgId, setOrgId] = useState<string | null>(null); // Nuevo: Guardamos el ID de la org
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);

  // Efecto para cargar sesión, perfil y organización
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        // 1. Cargar Perfil
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        if (profileData) setProfile(profileData);

        // 2. Cargar Organización (Para pasársela a SongLibrary)
        const { data: orgData } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .maybeSingle();
        
        if (orgData) {
            setOrgId(orgData.organization_id);
        }
      }
      setLoading(false);
    };

    initData();
    
    // Configurar saludo
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');

  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- VISTA: INICIO (HOME) ---
  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {greeting}, <span className="text-indigo-400">{profile?.full_name?.split(' ')[0] || 'Músico'}</span>
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

      {/* WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Próximo Evento */}
        <div className="md:col-span-2 bg-[#111] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/10 blur-[50px] rounded-full group-hover:bg-indigo-600/20 transition-all"></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider">Próximo Servicio</span>
                        <h3 className="text-2xl font-bold text-white mt-1">Culto Dominical</h3>
                    </div>
                    <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-mono text-gray-300">DOM 10:00 AM</div>
                </div>
                <div className="space-y-3 opacity-60">
                    <p className="text-sm text-gray-400">Tu setlist aparecerá aquí cuando crees un evento.</p>
                </div>
                <button onClick={() => setActiveTab('events')} className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-bold text-gray-300 transition-all">
                    Gestionar Eventos
                </button>
            </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="space-y-6">
             <div className="bg-[#111] border border-white/10 p-6 rounded-3xl">
                 <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Estado</h3>
                 <div className="flex items-baseline gap-2">
                     <span className="text-4xl font-black text-white">{orgId ? 'Activo' : '-'}</span>
                 </div>
                 <p className="text-xs text-gray-500 mt-2">Organización conectada</p>
             </div>

             <div 
                onClick={() => setActiveTab('songs')}
                className="bg-gradient-to-br from-indigo-900/20 to-[#111] border border-indigo-500/20 p-6 rounded-3xl cursor-pointer hover:border-indigo-500/50 transition-all group"
             >
                 <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center mb-4 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                     <Search size={20} />
                 </div>
                 <h3 className="font-bold text-white">Biblioteca</h3>
                 <p className="text-gray-400 text-sm mt-1">Ver todas las canciones.</p>
             </div>
        </div>
      </div>
    </div>
  );

  // --- VISTAS PLACEHOLDER PARA EVITAR ERRORES ---
  const EventsPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 animate-in fade-in">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Calendar size={40} className="text-gray-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Eventos</h2>
        <p className="text-gray-400 max-w-md">Pronto podrás gestionar tus servicios aquí.</p>
    </div>
  );

  const TeamPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 animate-in fade-in">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Users size={40} className="text-gray-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Equipo Global</h2>
        <p className="text-gray-400 max-w-md">Gestiona los miembros de tu organización aquí.</p>
    </div>
  );

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#030303]"><Loader2 className="animate-spin text-indigo-500"/></div>;

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-indigo-500 selection:text-white flex relative overflow-hidden">
      
      {/* FONDO */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* --- SIDEBAR --- */}
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

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 relative z-10 h-screen overflow-y-auto pb-24 md:pb-0">
         <div className="max-w-6xl mx-auto p-4 md:p-8">
            
            {/* Header Móvil */}
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
            
            {/* Aquí pasamos orgId a SongLibrary para que no falle */}
            {activeTab === 'songs' && orgId && <SongLibrary orgId={orgId} />}
            {activeTab === 'songs' && !orgId && <div className="text-center p-10 text-gray-500">Cargando organización...</div>}
            
            {activeTab === 'events' && <EventsPlaceholder />}
            {activeTab === 'team' && <TeamPlaceholder />}
            {activeTab === 'profile' && <ProfileSettings />}
         
         </div>
      </main>

      {/* --- MENU MÓVIL INFERIOR --- */}
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