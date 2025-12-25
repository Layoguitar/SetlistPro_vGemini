"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Plus, Music, Settings, LogOut, Loader2, Users, X, Save } from 'lucide-react';
import Link from 'next/link';
// Importamos el componente de Perfil que ya tienes en tu proyecto
import ProfileSettings from './ProfileSettings'; 

type Setlist = { id: string, name: string, date: string, items_count?: number };

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  
  // ESTADOS PARA LOS MODALES
  const [showSettings, setShowSettings] = useState(false);
  const [showNewSetlistModal, setShowNewSetlistModal] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState('');
  const [creating, setCreating] = useState(false);

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
                .order('date', { ascending: true });
                
            setSetlists(setlistsData || []);
        }
    } catch (error) {
        console.error("Error cargando dashboard:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // --- FUNCIÓN PARA CREAR SETLIST ---
  const handleCreateSetlist = async () => {
    if (!newSetlistName.trim() || !org?.id) return;
    setCreating(true);

    try {
        const { data, error } = await supabase.from('setlists').insert([{
            name: newSetlistName,
            date: new Date().toISOString().split('T')[0], // Fecha de hoy
            organization_id: org.id // <--- AQUÍ ESTÁ LA CLAVE 🔑
        }]).select().single();

        if (error) throw error;

        // Recargamos la lista y cerramos el modal
        setSetlists([...setlists, data]);
        setShowNewSetlistModal(false);
        setNewSetlistName('');
    } catch (err) {
        console.error("Error creando setlist:", err);
        alert("Error al crear el evento. Revisa tus permisos.");
    } finally {
        setCreating(false);
    }
  };

  if (loading) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
    );
  }

  // SI ESTAMOS EN MODO AJUSTES, MOSTRAMOS EL PERFIL
  if (showSettings) {
      return (
          <div className="min-h-screen bg-gray-50 p-4">
              <button onClick={() => setShowSettings(false)} className="mb-4 flex items-center gap-2 text-gray-500 hover:text-black">
                  <X size={20} /> Volver al Dashboard
              </button>
              {/* Renderizamos tu componente de Perfil */}
              <ProfileSettings /> 
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 relative">
      
      {/* MODAL PARA NUEVO SETLIST */}
      {showNewSetlistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">Nuevo Evento</h3>
                  <input 
                    className="w-full border p-3 rounded-xl mb-4"
                    placeholder="Nombre (ej: Culto Domingo)"
                    value={newSetlistName}
                    onChange={e => setNewSetlistName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setShowNewSetlistModal(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
                      <button 
                        onClick={handleCreateSetlist} 
                        disabled={creating || !newSetlistName.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                      >
                          {creating && <Loader2 className="animate-spin" size={16} />}
                          Crear
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* HEADER */}
      <header className="flex justify-between items-start mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">
                Hola, {profile?.full_name?.split(' ')[0] || 'Músico'} 👋
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider">
                    {org?.name || 'Sin Banda'}
                </span>
                • {org?.role === 'admin' ? 'LÍDER' : 'MÚSICO'}
            </p>
        </div>

        <div className="flex items-center gap-2">
            {/* BOTÓN AJUSTES (AHORA FUNCIONA) */}
            <button 
                onClick={() => setShowSettings(true)}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-sm"
            >
                <Settings size={18} />
                <span className="hidden md:inline text-sm font-bold">Ajustes</span>
            </button>
            
            <button 
                onClick={handleLogout}
                className="p-2 bg-red-50 border border-red-200 rounded-xl text-red-600 hover:bg-red-100 transition-colors shadow-sm"
                title="Cerrar Sesión"
            >
                <LogOut size={18} />
            </button>
        </div>
      </header>

      {/* TARJETAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Próximo Evento</h3>
            {setlists.length > 0 ? (
                <div>
                    <div className="text-2xl font-bold truncate">{setlists[0].name}</div>
                    <div className="text-sm text-gray-500 mt-1">{setlists[0].date || 'Sin fecha'}</div>
                </div>
            ) : (
                <div className="text-2xl font-bold text-gray-300">-</div>
            )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Activos</h3>
            <div className="text-4xl font-bold text-blue-600">{setlists.length}</div>
            <div className="text-sm text-gray-400">Eventos futuros</div>
        </div>

        {org?.role === 'admin' ? (
             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
                <Music className="absolute -bottom-4 -right-4 text-white/10 w-32 h-32" />
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4">Código Equipo</h3>
                <div className="text-3xl font-mono font-bold tracking-wider select-all">{org?.id.slice(0,8)}...</div>
             </div>
        ) : (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                 <Users className="text-gray-300 mb-2" size={32}/>
                 <p className="text-sm text-gray-400">Eres miembro del equipo</p>
             </div>
        )}
      </div>

      {/* AGENDA */}
      <section>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <Calendar size={20} className="text-gray-400"/> Agenda
            </h2>
            {org?.role === 'admin' && (
                // BOTÓN NUEVO (AHORA FUNCIONA)
                <button 
                    onClick={() => setShowNewSetlistModal(true)}
                    className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors"
                >
                    <Plus size={16} /> Nuevo
                </button>
            )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[200px]">
            {setlists.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {setlists.map(setlist => (
                        <Link key={setlist.id} href={`/setlist/${setlist.id}`} className="block p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                            <div>
                                <div className="font-bold text-gray-900">{setlist.name}</div>
                                <div className="text-xs text-gray-500">{setlist.date || 'Fecha pendiente'}</div>
                            </div>
                            <div className="text-gray-400 group-hover:text-blue-600">Ver →</div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                    <p>No hay eventos próximos.</p>
                </div>
            )}
        </div>
      </section>
    </div>
  );
}