"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  LayoutGrid, Music, Calendar, Users, UserCircle, LogOut, Plus, Search, 
  Loader2, ChevronRight, Sun, Moon, Clock, ArrowRight, Mic2 
} from 'lucide-react';

import SongLibrary from './SongLibrary';
import ProfileSettings from './ProfileSettings'; // Usará tu archivo avanzado
import SetlistEditor from './SetlistEditor';
import GlobalTeam from './GlobalTeam';
import Onboarding from './Onboarding';

interface Event { id: string; name: string; date: string; }

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orgId, setOrgId] = useState<string | null>(null); 
  const [userRole, setUserRole] = useState<string | null>(null); 
  const [greeting, setGreeting] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // DATOS PARA EL DASHBOARD
  const [events, setEvents] = useState<Event[]>([]);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState({ songs: 0, members: 0 });
  const [selectedSetlistId, setSelectedSetlistId] = useState<string | null>(null);

  const isAdmin = userRole === 'admin' || userRole === 'owner';

  // --- PERSISTENCIA Y CONFIGURACIÓN ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('setlistPro_activeTab');
      const savedSetlist = localStorage.getItem('setlistPro_selectedSetlistId');
      if (savedTab) setActiveTab(savedTab);
      if (savedSetlist && savedSetlist !== 'null') setSelectedSetlistId(savedSetlist);
      
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') { setIsDarkMode(false); document.documentElement.classList.remove('dark'); }
      else { setIsDarkMode(true); document.documentElement.classList.add('dark'); }
    }
  }, []);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('setlistPro_activeTab', activeTab); }, [activeTab]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedSetlistId) localStorage.setItem('setlistPro_selectedSetlistId', selectedSetlistId);
      else localStorage.removeItem('setlistPro_selectedSetlistId');
    }
  }, [selectedSetlistId]);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session) {
          // 1. Cargar Perfil
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          if (profileData) setProfile(profileData);
          
          // 2. Cargar Organización y Rol
          const { data: orgData } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', session.user.id).maybeSingle();
          if (orgData) {
              setOrgId(orgData.organization_id);
              setUserRole(orgData.role);
              
              // 3. Cargar Datos del Dashboard en paralelo
              await Promise.all([
                  fetchEvents(orgData.organization_id),
                  fetchStats(orgData.organization_id)
              ]);
          }
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    initData();
    
    // Saludo dinámico
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches');
  }, []);

  const fetchEvents = async (organizationId: string) => {
    const { data } = await supabase.from('setlists')
        .select('*')
        .eq('organization_id', organizationId)
        .order('date', { ascending: true });
    
    if (data) {
        setEvents(data);
        // Calcular próximo evento (el primero cuya fecha sea hoy o futuro)
        const today = new Date();
        today.setHours(0,0,0,0);
        const upcoming = data.find(e => new Date(e.date + 'T23:59:59') >= today);
        setNextEvent(upcoming || null);
    }
  };

  const fetchStats = async (organizationId: string) => {
      // Obtenemos conteos rápidos
      const { count: songs } = await supabase.from('songs').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId);
      const { count: members } = await supabase.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId);
      setStats({ songs: songs || 0, members: members || 0 });
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    localStorage.removeItem('setlistPro_activeTab');
    localStorage.removeItem('setlistPro_selectedSetlistId');
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#050505] text-gray-400"><Loader2 className="animate-spin mr-2" /> Cargando estudio...</div>;
  if (!orgId) return <Onboarding onComplete={() => window.location.reload()} />;

  // RENDERIZADO DE VISTAS
  const renderContent = () => {
    if (selectedSetlistId) return <div className="h-full flex flex-col animate-in fade-in slide-in-from-right duration-300"><SetlistEditor setlistId={selectedSetlistId === 'new' ? null : selectedSetlistId} onBack={() => { setSelectedSetlistId(null); if (orgId) fetchEvents(orgId); }} userRole={userRole} currentUserId={session?.user?.id} /></div>;
    if (activeTab === 'home') return renderHomeView();
    if (activeTab === 'songs') return <SongLibrary orgId={orgId} userRole={userRole} />; // Pasamos el userRole para la seguridad
    if (activeTab === 'events') return renderEventsView();
    if (activeTab === 'team') return <GlobalTeam orgId={orgId} userRole={userRole} />; 
    if (activeTab === 'profile') return <ProfileSettings />;
    return null;
  };

  // --- VISTA INICIO (DASHBOARD) ---
  const renderHomeView = () => {
    // Calculo de días restantes
    let daysLeft = null;
    if (nextEvent) {
        const diff = new Date(nextEvent.date).getTime() - new Date().setHours(0,0,0,0);
        daysLeft = Math.ceil(diff / (1000 * 3600 * 24));
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 md:p-10 max-w-7xl mx-auto">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4">
            <div>
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter">
                    {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">{profile?.full_name?.split(' ')[0] || 'Músico'}</span>
                </h1>
                <p className="text-gray-500 dark:text-zinc-400 mt-2 text-lg font-medium">Aquí está el resumen de tu banda.</p>
            </div>
            <button onClick={toggleTheme} className="p-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all shadow-sm">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            
            {/* 1. TARJETA HÉROE: PRÓXIMO EVENTO (Ocupa 2 columnas) */}
            <div className="md:col-span-2 lg:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => nextEvent && setSelectedSetlistId(nextEvent.id)}>
                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                
                <div className="relative z-10 h-full flex flex-col justify-between min-h-[200px]">
                    {nextEvent ? (
                        <>
                            <div className="flex justify-between items-start">
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-2">
                                    <Clock size={12}/> Próximo Servicio
                                </span>
                                {daysLeft !== null && (
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border border-white/10 ${daysLeft <= 1 ? 'bg-red-500/80 text-white animate-pulse' : 'bg-black/20'}`}>
                                        {daysLeft === 0 ? '¡Es Hoy!' : daysLeft === 1 ? 'Mañana' : `Faltan ${daysLeft} días`}
                                    </span>
                                )}
                            </div>
                            
                            <div className="mt-4">
                                <h2 className="text-3xl md:text-4xl font-black leading-tight mb-2 truncate">{nextEvent.name}</h2>
                                <p className="text-indigo-200 font-medium text-lg flex items-center gap-2">
                                    <Calendar size={18}/> {new Date(nextEvent.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                            </div>

                            <button className="mt-6 bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 w-fit hover:bg-indigo-50 transition-colors shadow-lg">
                                Ver Setlist <ArrowRight size={18}/>
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-6">
                            <Calendar size={48} className="mb-4 opacity-50"/>
                            <h3 className="text-2xl font-bold">Sin eventos próximos</h3>
                            <p className="text-indigo-200 mb-6 text-sm">Todo está tranquilo por ahora.</p>
                            {isAdmin && <button onClick={(e) => { e.stopPropagation(); setSelectedSetlistId('new'); }} className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl font-bold transition-colors text-sm">Crear Evento</button>}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. TARJETAS DE ESTADÍSTICAS */}
            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-zinc-800 p-6 rounded-[2rem] flex flex-col justify-between hover:border-indigo-500/30 transition-colors group cursor-pointer" onClick={() => setActiveTab('songs')}>
                 <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/10 text-orange-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Music size={24}/>
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-1">{stats.songs}</h3>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Canciones</p>
                    <p className="text-xs text-gray-400 mt-1">En repertorio</p>
                 </div>
            </div>

            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-zinc-800 p-6 rounded-[2rem] flex flex-col justify-between hover:border-indigo-500/30 transition-colors group cursor-pointer" onClick={() => setActiveTab('team')}>
                 <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/10 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users size={24}/>
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-1">{stats.members}</h3>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Miembros</p>
                    <p className="text-xs text-gray-400 mt-1">En el equipo</p>
                 </div>
            </div>

            {/* 3. ACCIONES RÁPIDAS */}
            <div className="md:col-span-3 lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest col-span-full mb-1 ml-1">Accesos Rápidos</div>
                
                {isAdmin && (
                    <button onClick={() => setSelectedSetlistId('new')} className="p-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-500 transition-all hover:shadow-lg group text-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Plus size={20}/></div>
                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200">Nuevo Evento</span>
                    </button>
                )}

                {isAdmin && (
                     <button onClick={() => { setActiveTab('songs'); setTimeout(() => { const btn = document.querySelector('button'); if(btn && btn.textContent?.includes('Nueva')) btn.click(); }, 100); }} className="p-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-500 transition-all hover:shadow-lg group text-center">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Mic2 size={20}/></div>
                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200">Nueva Canción</span>
                    </button>
                )}

                <button onClick={() => setActiveTab('songs')} className="p-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-500 transition-all hover:shadow-lg group text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Search size={20}/></div>
                    <span className="font-bold text-sm text-gray-700 dark:text-gray-200">Buscar Tema</span>
                </button>
                
                <button onClick={() => setActiveTab('profile')} className="p-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-500 transition-all hover:shadow-lg group text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><UserCircle size={20}/></div>
                    <span className="font-bold text-sm text-gray-700 dark:text-gray-200">Mi Perfil</span>
                </button>
            </div>

          </div>
        </div>
    );
  }

  // --- VISTA EVENTOS ---
  const renderEventsView = () => (
    <div className="space-y-6 p-4 md:p-10 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Agenda</h2>
                <p className="text-gray-500 text-sm mt-1">Todos los servicios programados.</p>
            </div>
            {isAdmin && <button onClick={() => setSelectedSetlistId('new')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all"><Plus size={18} /> Crear</button>}
        </div>
        <div className="grid gap-3">
            {events.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No hay eventos.</div>
            ) : events.map((event) => (
                <div key={event.id} onClick={() => setSelectedSetlistId(event.id)} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-zinc-800 p-5 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer group flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-50 dark:bg-zinc-900 rounded-xl font-bold text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
                            <span className="text-[10px] uppercase">{new Date(event.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                            <span className="text-lg leading-none">{new Date(event.date).getDate()}</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">{event.name}</h3>
                            <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2"><Clock size={12}/> {new Date(event.date).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"><ChevronRight size={16}/></div>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-sans flex overflow-hidden selection:bg-indigo-500/30">
      <aside className="hidden md:flex w-72 flex-col border-r border-gray-200 dark:border-zinc-900 bg-white dark:bg-[#050505] relative z-20 h-full">
        <div className="p-6 flex items-center gap-4 mb-2 shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30"><Music size={26} className="text-white" strokeWidth={2.5} /></div>
            <div className="flex flex-col justify-center"><span className="font-black text-xl tracking-tight leading-none text-gray-900 dark:text-white">Setlist<span className="text-indigo-600 dark:text-indigo-400">Pro</span></span><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Team Edition</span></div>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">{[{ id: 'home', label: 'Inicio', icon: LayoutGrid }, { id: 'songs', label: 'Canciones', icon: Music }, { id: 'events', label: 'Eventos', icon: Calendar }, { id: 'team', label: 'Equipo', icon: Users }].map((item) => (<button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedSetlistId(null); }} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold transition-all group relative overflow-hidden ${activeTab === item.id && !selectedSetlistId ? 'bg-[#111] text-white dark:bg-white dark:text-black shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900/50 hover:text-gray-900 dark:hover:text-white'}`}><item.icon size={20} className={`${activeTab === item.id && !selectedSetlistId ? 'text-indigo-400 dark:text-indigo-600' : 'group-hover:text-indigo-500'} transition-colors`} /> {item.label}{activeTab === item.id && !selectedSetlistId && <div className="absolute right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}</button>))}</nav>
        <div className="p-6 border-t border-gray-200 dark:border-zinc-900 shrink-0"><button onClick={() => { setActiveTab('profile'); setSelectedSetlistId(null); }} className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-all group"><div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-800 ring-2 ring-transparent group-hover:ring-indigo-500 transition-all"><div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300">{profile?.full_name?.substring(0,2).toUpperCase() || 'YO'}</div></div><div className="flex-1 text-left overflow-hidden"><div className="text-sm font-bold truncate text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">{profile?.full_name || 'Usuario'}</div><div className="text-xs text-gray-500">Ver Perfil</div></div></button><button onClick={handleLogout} className="mt-2 w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"><LogOut size={14} /> Cerrar Sesión</button></div>
      </aside>
      <main className="flex-1 relative h-full overflow-y-auto pb-24 md:pb-0 scrollbar-hide bg-gray-50 dark:bg-black transition-colors duration-300">{renderContent()}</main>
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-[#050505]/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-50 pb-safe"><div className="flex justify-around items-center p-2">{[{ id: 'home', icon: LayoutGrid }, { id: 'songs', icon: Music }, { id: 'events', icon: Calendar }, { id: 'profile', icon: UserCircle }].map((item) => (<button key={item.id} onClick={() => { setActiveTab(item.id); setSelectedSetlistId(null); }} className={`p-4 rounded-2xl transition-all ${activeTab === item.id && !selectedSetlistId ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400'}`}><item.icon size={24} /></button>))}</div></nav>
    </div>
  );
}