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
  ChevronRight,
  Sun,
  Moon
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
  
  // Estado del Tema (Oscuro por defecto)
  const [isDarkMode, setIsDarkMode] = useState(true);

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
    
    // Configurar saludo
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');

    // Cargar preferencia de tema guardada o usar sistema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    } else {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    }

  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        setIsDarkMode(false);
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        setIsDarkMode(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- COMPONENTES INTERNOS ---

  const renderHome = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER CON TOGGLE DARK/LIGHT */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-gray-200 dark:border-zinc-900/50 transition-colors">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
            {greeting}, <span className="text-indigo-600 dark:text-indigo-400 transition-colors">{profile?.full_name?.split(' ')[0] || 'Músico'}</span>
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1 transition-colors">Tu centro de comando.</p>
        </div>
        
        <div className="flex gap-3">
             {/* BOTÓN SOL / LUNA */}
             <button 
                onClick={toggleTheme}
                className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all shadow-sm"
                title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
             >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             <button className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all relative group shadow-sm">
                <Bell size={20} className="text-gray-400 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
             </button>
             
             <button className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                <Plus size={18} /> <span className="hidden sm:inline">Nuevo Evento</span>
             </button>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* TARJETA GRANDE: Próximo Evento */}
        <div className="md:col-span-2 bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800 p-8 rounded-3xl relative overflow-hidden group hover:border-indigo-500/30 dark:hover:border-zinc-700 transition-all shadow-sm dark:shadow-none">
            {/* Efecto de luz (Solo en Dark Mode visualmente fuerte) */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-all pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider transition-colors">Próximo Servicio</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">Culto Dominical</h3>
                    </div>
                    <div className="px-4 py-2 bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-lg text-sm font-mono text-gray-600 dark:text-zinc-300 transition-colors">
                        DOM 10:00 AM
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-6 border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center text-center space-y-3 mb-8 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-transparent flex items-center justify-center text-gray-400 dark:text-zinc-500 shadow-sm dark:shadow-none">
                        <Music size={18} />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">Aún no has agregado canciones a este setlist.</p>
                </div>

                <button onClick={() => setActiveTab('events')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group-hover:scale-[1.01]">
                    Gestionar Eventos <ChevronRight size={16} />
                </button>
            </div>
        </div>

        {/* COLUMNA LATERAL */}
        <div className="space-y-6">
             
             {/* Tarjeta de Estado */}
             <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors shadow-sm dark:shadow-none">
                 <h3 className="text-gray-500 dark:text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 transition-colors">Estado de Cuenta</h3>
                 <div className="flex items-center justify-between mb-2">
                     <span className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{orgId ? 'Activo' : 'Sin Banda'}</span>
                     <div className={`px-2 py-1 rounded text-[10px] font-bold border ${orgId ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 border-green-200 dark:border-green-500/20' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500 border-gray-200 dark:border-zinc-700'}`}>
                        {orgId ? 'PRO' : 'FREE'}
                     </div>
                 </div>
                 <p className="text-xs text-gray-500 dark:text-zinc-500 transition-colors">Organización ID: {orgId ? 'Conectado' : 'Pendiente'}</p>
             </div>

             {/* Tarjeta de Biblioteca */}
             <div 
                onClick={() => setActiveTab('songs')}
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl cursor-pointer hover:border-indigo-500/50 hover:shadow-md dark:hover:bg-zinc-800 transition-all group relative overflow-hidden shadow-sm dark:shadow-none"
             >
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 
                 <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                     <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-gray-600 dark:text-white shadow-inner group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                         <Search size={22} />
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg transition-colors">Biblioteca</h3>
                        <p className="text-gray-500 dark:text-zinc-500 text-sm mt-1 transition-colors">Buscar acordes y letras.</p>
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
        <div className="w-24 h-24 bg-gray-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-gray-200 dark:border-zinc-800 shadow-xl">
            <Calendar size={40} className="text-gray-400 dark:text-zinc-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Eventos</h2>
        <p className="text-gray-500 dark:text-zinc-500 max-w-md transition-colors">Pronto podrás gestionar tus servicios aquí.</p>
    </div>
  );

  const TeamPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-in fade-in">
        <div className="w-24 h-24 bg-gray-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-gray-200 dark:border-zinc-800 shadow-xl">
            <Users size={40} className="text-gray-400 dark:text-zinc-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Equipo Global</h2>
        <p className="text-gray-500 dark:text-zinc-500 max-w-md transition-colors">Gestiona los miembros de tu organización aquí.</p>
    </div>
  );

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-black"><Loader2 className="animate-spin text-indigo-600 dark:text-white"/></div>;

  return (
    // FONDO GENERAL: Cambia de gray-50 (Luz) a black (Oscuro)
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-sans selection:bg-indigo-500 selection:text-white flex relative overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-72 flex-col border-r border-gray-200 dark:border-zinc-900 bg-white dark:bg-[#09090b] relative z-20 h-screen sticky top-0 transition-colors duration-300">
        <div className="p-8 flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-indigo-600 dark:bg-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Music size={16} className="text-white dark:text-black" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">SetlistPro</span>
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
                        ? 'bg-gray-100 dark:bg-zinc-900 text-indigo-600 dark:text-white shadow-sm dark:shadow-inner font-bold' 
                        : 'text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-900/50'
                    }`}
                >
                    <item.icon size={20} className={activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-600 group-hover:text-gray-600 dark:group-hover:text-zinc-400'} />
                    {item.label}
                    {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                </button>
            ))}
        </nav>

        <div className="p-6 border-t border-gray-200 dark:border-zinc-900">
            <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-all border ${activeTab === 'profile' ? 'bg-gray-100 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800' : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-900/50'}`}
            >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-zinc-400">
                             {profile?.full_name?.substring(0,2).toUpperCase() || 'YO'}
                        </div>
                    )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                    <div className="text-sm font-bold truncate text-gray-900 dark:text-white">{profile?.full_name || 'Usuario'}</div>
                    <div className="text-xs text-gray-500 dark:text-zinc-500 truncate">Ver Perfil</div>
                </div>
            </button>
            <button onClick={handleLogout} className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 py-2 transition-colors">
                <LogOut size={14} /> Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 relative z-10 h-screen overflow-y-auto pb-24 md:pb-0 scrollbar-hide bg-gray-50 dark:bg-black transition-colors duration-300">
         <div className="max-w-7xl mx-auto p-4 md:p-10">
            
            {/* Header Móvil */}
            <div className="md:hidden flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-zinc-900">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Music size={16} className="text-white" />
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">SetlistPro</span>
                </div>
                
                {/* Toggle Móvil (Sol/Luna) */}
                <button 
                    onClick={toggleTheme}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-white"
                >
                    {isDarkMode ? <Sun size={16}/> : <Moon size={16}/>}
                </button>
            </div>

            {/* VISTAS */}
            {activeTab === 'home' && renderHome()}
            
            {activeTab === 'songs' && orgId && <SongLibrary orgId={orgId} />}
            {activeTab === 'songs' && !orgId && <div className="text-center p-10 text-gray-500 dark:text-zinc-500">Cargando biblioteca...</div>}
            
            {activeTab === 'events' && <EventsPlaceholder />}
            {activeTab === 'team' && <TeamPlaceholder />}
            {activeTab === 'profile' && <ProfileSettings />}
         
         </div>
      </main>

      {/* MENU MÓVIL */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-black/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-50 pb-safe transition-colors duration-300">
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
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-300'
                    }`}
                >
                    <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                    {activeTab === item.id && <div className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-500 mt-1"></div>}
                </button>
            ))}
        </div>
      </nav>

    </div>
  );
}