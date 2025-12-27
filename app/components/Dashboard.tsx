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
  Loader2,
  ChevronRight
} from 'lucide-react';

import SongLibrary from './SongLibrary';
import ProfileSettings from './ProfileSettings';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orgId, setOrgId] = useState<string | null>(null); 
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        if (profileData) setProfile(profileData);

        const { data: orgData } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', session.user.id)
            .maybeSingle();
        
        if (orgData) setOrgId(orgData.organization_id);
      }
      setLoading(false);
    };

    initData();
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');

  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- WIDGETS CON MEJOR CONTRASTE ---
  // Usamos bg-zinc-900 para las tarjetas y border-zinc-800 para los bordes.
  // Esto crea la separación visual contra el fondo negro.

  const renderHome = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-zinc-900/50">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {greeting}, <span className="text-indigo-400">{profile?.full_name?.split(' ')[0] || 'Músico'}</span>
          </h1>
          <p className="text-zinc-400 mt-1">Tu centro de comando.</p>
        </div>
        <div className="flex gap-3">
             <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-white hover:bg-zinc-800 transition-colors relative group">
                <Bell size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
                <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-900"></span>
             </button>
             <button className="px-5 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-white/5 transition-all active:scale-95">
                <Plus size={18} /> Nuevo Evento
             </button>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* TARJETA GRANDE: Próximo Evento (DESTACADA) */}
        <div className="md:col-span-2 bg-zinc-900/80 border border-zinc-800 p-8 rounded-3xl relative overflow-hidden group hover:border-zinc-700 transition-all">
            {/* Efecto de luz sutil */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider">Próximo Servicio</span>
                        </div>
                        <h3 className="text-3xl font-bold text-white">Culto Dominical</h3>
                    </div>
                    <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-lg text-sm font-mono text-zinc-300">
                        DOM 10:00 AM
                    </div>
                </div>

                {/* Lista vacía visualmente atractiva */}
                <div className="bg-black/20 rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center space-y-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <Music size={18} />
                    </div>
                    <p className="text-sm text-zinc-400">Aún no has agregado canciones a este setlist.</p>
                </div>

                <button onClick={() => setActiveTab('events')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group-hover:scale-[1.01]">
                    Gestionar Eventos <ChevronRight size={16} />
                </button>
            </div>
        </div>

        {/* COLUMNA LATERAL */}
        <div className="space-y-6">
             
             {/* Tarjeta de Estado */}
             <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl hover:bg-zinc-900 transition-colors">
                 <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4">Estado de Cuenta</h3>
                 <div className="flex items-center justify-between mb-2">
                     <span className="text-2xl font-bold text-white">{orgId ? 'Activo' : 'Sin Banda'}</span>
                     <div className={`px-2 py-1 rounded text-[10px] font-bold border ${orgId ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                        {orgId ? 'PRO' : 'FREE'}
                     </div>
                 </div>
                 <p className="text-xs text-zinc-500">Organización ID: {orgId ? 'Conectado' : 'Pendiente'}</p>
             </div>

             {/* Tarjeta de Acceso Rápido (Biblioteca) */}
             <div 
                onClick={() => setActiveTab('songs')}
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl cursor-pointer hover:border-indigo-500/50 hover:bg-zinc-800 transition-all group relative overflow-hidden"
             >
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 
                 <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                     <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:bg-indigo-500 transition-all duration-300">
                         <Search size={22} />
                     </div>
                     <div>
                        <h3 className="font-bold text-white text-lg">Biblioteca</h3>
                        <p className="text-zinc-500 text-sm mt-1">Buscar acordes y letras.</p>
                     </div>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );

  // --- PLACEHOLDERS ---
  const EventsPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in fade-in">
        <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-zinc-800 shadow-xl">
            <Calendar size={40} className="text-zinc-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Eventos</h2>
        <p className="text-zinc-500 max-w-md">Pronto podrás gestionar tus servicios aquí.</p>
    </div>
  );

  const TeamPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in fade-in">
        <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-zinc-800 shadow-xl">
            <Users size={40} className="text-zinc-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Equipo Global</h2>
        <p className="text-zinc-500 max-w-md">Gestiona los miembros de tu organización aquí.</p>
    </div>
  );

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black"><Loader2 className="animate-spin text-white"/></div>;

  return (
    // FONDO GENERAL: bg-black (Negro puro) para máximo contraste con las tarjetas
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500 selection:text-white flex relative overflow-hidden">
      
      {/* SIDEBAR: bg-zinc-950 (Ligeramente más claro que el negro puro para separarse) */}
      <aside className="hidden md:flex w-72 flex-col border-r border-zinc-900 bg-[#09090b] relative z-20 h-screen sticky top-0">
        <div className="p-8 flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Music size={16} className="text-black" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">SetlistPro</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
            {[
                { id: 'home', label: 'Inicio', icon: LayoutGrid },
                { id: 'songs', label: 'Canciones', icon: Music },
                { id: 'events', label: 'Eventos', icon: Calendar },
                { id: 'team', label: 'Equipo', icon: Users },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                        activeTab === item.id 
                        ? 'bg-zinc-900 text-white shadow-inner' 
                        : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
                    }`}
                >
                    <item.icon size={20} className={activeTab === item.id ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400'} />
                    {item.label}
                    {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                </button>
            ))}
        </nav>

        <div className="p-6 border-t border-zinc-900">
            <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-all border ${activeTab === 'profile' ? 'bg-zinc-900 border-zinc-800' : 'border-transparent hover:bg-zinc-900/50'}`}
            >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">
                             {profile?.full_name?.substring(0,2).toUpperCase() || 'YO'}
                        </div>
                    )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                    <div className="text-sm font-bold truncate text-white">{profile?.full_name || 'Usuario'}</div>
                    <div className="text-xs text-zinc-500 truncate">Ver Perfil</div>
                </div>
            </button>
            <button onClick={handleLogout} className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-bold text-zinc-600 hover:text-red-400 py-2 transition-colors">
                <LogOut size={14} /> Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 relative z-10 h-screen overflow-y-auto pb-24 md:pb-0 scrollbar-hide">
         <div className="max-w-7xl mx-auto p-4 md:p-10">
            
            {/* Header Móvil */}
            <div className="md:hidden flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Music size={16} />
                    </div>
                    <span className="font-bold text-lg">SetlistPro</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden" onClick={() => setActiveTab('profile')}>
                     {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                             {profile?.full_name?.substring(0,2).toUpperCase() || 'YO'}
                        </div>
                    )}
                </div>
            </div>

            {/* VISTAS */}
            {activeTab === 'home' && renderHome()}
            
            {activeTab === 'songs' && orgId && <SongLibrary orgId={orgId} />}
            {activeTab === 'songs' && !orgId && <div className="text-center p-10 text-zinc-500">Cargando biblioteca...</div>}
            
            {activeTab === 'events' && <EventsPlaceholder />}
            {activeTab === 'team' && <TeamPlaceholder />}
            {activeTab === 'profile' && <ProfileSettings />}
         
         </div>
      </main>

      {/* MENU MÓVIL (Fondo con blur para separar) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
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
                        : 'text-zinc-600 hover:text-zinc-300'
                    }`}
                >
                    <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                    {activeTab === item.id && <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1"></div>}
                </button>
            ))}
        </div>
      </nav>

    </div>
  );
}