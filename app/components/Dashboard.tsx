"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Plus, Music, Settings, LogOut, Loader2, Users, LayoutDashboard, Library, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Necesario para redirigir
import ProfileSettings from './ProfileSettings'; 
import SongLibrary from './SongLibrary';

type Setlist = { id: string, name: string, scheduled_date: string, items_count?: number };

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  
  const [activeTab, setActiveTab] = useState<'events' | 'songs' | 'team'>('events');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Eliminamos el estado del Modal, ya no lo necesitamos
  const [creating, setCreating] = useState(false);
  const router = useRouter(); // Para la redirección automática

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);

        const { data: memberData } = await supabase
            .from('organization_members')
            .select('role, organizations(id, name, owner_id)')
            .eq('user_id', user.id)
            .single();
        
        if (memberData && memberData.organizations) {
            setOrg({ ...memberData.organizations, role: memberData.role });
            const orgId = (memberData.organizations as any).id;
            
            const { data: setlistsData } = await supabase
                .from('setlists')
                .select('*')
                .eq('organization_id', orgId)
                .order('scheduled_date', { ascending: true }); // Usamos scheduled_date
                
            setSetlists(setlistsData || []);
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- CREACIÓN DIRECTA (SIN MODAL) ---
  const handleCreateSetlist = async () => {
    if (!org?.id) return;
    setCreating(true);

    try {
        // Nombre automático basado en la fecha
        const today = new Date();
        const defaultName = `Evento ${today.getDate()}/${today.getMonth() + 1}`;
        const defaultDate = today.toISOString().split('T')[0];

        const { data, error } = await supabase.from('setlists').insert([{
            name: defaultName,
            scheduled_date: defaultDate, 
            organization_id: org.id 
        }]).select().single();

        if (error) throw error;

        // ¡REDIRECCIÓN INMEDIATA AL EDITOR! 🚀
        router.push(`/setlist/${data.id}`);

    } catch (err) {
        alert("Error creando evento automático");
        setCreating(false);
    } 
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={32}/></div>;

  if (showSettings) return <div className="min-h-screen bg-gray-50 p-4"><ProfileSettings userId={profile?.id} onBack={() => setShowSettings(false)} /></div>;

  // --- VISTA MÚSICO ---
  if (org?.role === 'member') {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 relative">
            <header className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Hola, {profile?.full_name?.split(' ')[0]} 👋</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider">{org?.name}</span> • MÚSICO
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowSettings(true)} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 shadow-sm"><Settings size={18} /></button>
                    <button onClick={handleLogout} className="p-2 bg-red-50 border border-red-200 rounded-xl text-red-600 hover:bg-red-100 shadow-sm"><LogOut size={18} /></button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Próximo Evento</h3>
                    <div className="text-2xl font-bold truncate">{setlists[0]?.name || '-'}</div>
                    <div className="text-sm text-gray-500 mt-1">
                        {setlists[0]?.scheduled_date ? new Date(setlists[0].scheduled_date).toLocaleDateString() : 'Sin fecha'}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                    <Users className="text-gray-300 mb-2" size={32}/>
                    <p className="text-sm text-gray-400">Eres parte del equipo</p>
                </div>
            </div>

            <section>
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Calendar size={20} className="text-gray-400"/> Agenda</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[200px]">
                    {setlists.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {setlists.map(setlist => (
                                <Link key={setlist.id} href={`/setlist/${setlist.id}`} className="block p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                    <div>
                                        <div className="font-bold text-gray-900">{setlist.name}</div>
                                        <div className="text-xs text-gray-500">{new Date(setlist.scheduled_date).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-gray-400 group-hover:text-blue-600">Ver →</div>
                                </Link>
                            ))}
                        </div>
                    ) : <div className="flex items-center justify-center h-48 text-gray-400">No hay eventos próximos.</div>}
                </div>
            </section>
        </div>
    );
  }

  // --- VISTA LÍDER ---
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h1 className="font-black text-xl tracking-tight text-blue-600">SETLIST<span className="text-gray-900">PRO</span></h1>
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-500"><X size={20}/></button>
        </div>
        <div className="p-4 space-y-1">
            <button onClick={() => { setActiveTab('events'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'events' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><LayoutDashboard size={20} /> Eventos</button>
            <button onClick={() => { setActiveTab('songs'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'songs' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><Library size={20} /> Repertorio</button>
            <button onClick={() => { setActiveTab('team'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'team' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><Users size={20} /> Equipo</button>
        </div>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{profile?.full_name?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{profile?.full_name}</div>
                    <div className="text-xs text-gray-500 truncate">{org?.name}</div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowSettings(true)} className="flex items-center justify-center gap-2 p-2 rounded-lg border hover:bg-gray-50 text-xs font-bold text-gray-600"><Settings size={14}/> Ajustes</button>
                <button onClick={handleLogout} className="flex items-center justify-center gap-2 p-2 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold"><LogOut size={14}/> Salir</button>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="md:hidden p-4 border-b bg-white flex items-center justify-between shrink-0">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2"><Menu /></button>
            <span className="font-bold">{org?.name}</span>
            <div className="w-8"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {activeTab === 'events' && (
                <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header className="flex justify-between items-end mb-8">
                        <div><h2 className="text-2xl font-bold">Próximos Eventos</h2><p className="text-gray-500">Panel de Control de Líder</p></div>
                        {/* BOTÓN DE CREACIÓN DIRECTA */}
                        <button 
                            onClick={handleCreateSetlist} 
                            disabled={creating}
                            className="bg-black text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50"
                        >
                            {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} 
                            Nuevo Evento
                        </button>
                    </header>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"><div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Eventos</div><div className="text-3xl font-black text-gray-900">{setlists.length}</div></div>
                        <div className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-2xl shadow-lg text-white flex items-center justify-between">
                            <div><div className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Código de Invitación</div><div className="text-2xl font-mono font-bold tracking-widest select-all">{org?.id.slice(0,8)}...</div></div>
                            <div className="bg-white/20 p-2 rounded-lg"><Users size={24}/></div>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {setlists.map(setlist => (
                            <Link key={setlist.id} href={`/setlist/${setlist.id}`} className="bg-white p-5 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all group flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-lg flex flex-col items-center justify-center leading-none border border-blue-100">
                                        <span className="text-xs font-bold uppercase">{new Date(setlist.scheduled_date).toLocaleString('es-ES', { month: 'short' })}</span>
                                        <span className="text-lg font-black">{new Date(setlist.scheduled_date).getDate() || '?'}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{setlist.name}</h3>
                                        <p className="text-sm text-gray-500">{new Date(setlist.scheduled_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">→</div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'songs' && <div className="max-w-6xl mx-auto h-full animate-in fade-in slide-in-from-bottom-4 duration-500"><SongLibrary orgId={org?.id} /></div>}

            {activeTab === 'team' && (
                <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-bold mb-4">Gestión de Equipo</h2>
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
                        <Users size={48} className="mx-auto text-gray-300 mb-4"/>
                        <p className="text-gray-500 mb-6">Comparte este código con tus músicos:</p>
                        <div className="bg-gray-100 p-4 rounded-xl font-mono text-xl font-bold select-all inline-block mb-2 text-blue-600">{org?.id}</div>
                    </div>
                </div>
            )}
        </div>
      </main>

      {/* YA NO HAY MODAL AQUÍ */}
    </div>
  );
}