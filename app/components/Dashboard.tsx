"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Calendar, Plus, Music, Settings, LogOut, Loader2, Users } from 'lucide-react';
import Link from 'next/link';

// Tipos básicos para evitar errores
type Setlist = { id: string, name: string, date: string, items_count?: number };

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [setlists, setSetlists] = useState<Setlist[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Cargar Perfil
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);

        // 2. Cargar Organización (Banda)
        const { data: memberData } = await supabase
            .from('organization_members')
            .select('role, organizations(id, name, owner_id)')
            .eq('user_id', user.id)
            .single();
        
        if (memberData && memberData.organizations) {
            setOrg({ ...memberData.organizations, role: memberData.role }); // Guardamos rol y datos de la banda
            
            // 3. Cargar Setlists de esa banda
            // Nota: organizations es un array o objeto según la query, aquí asumimos objeto simple por el .single()
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
    window.location.reload(); // Recargar para que 'page.tsx' nos mande al Login
  };

  if (loading) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
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
            {/* Botón Ajustes (Solo visual por ahora) */}
            <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-sm">
                <Settings size={18} />
                <span className="hidden md:inline text-sm font-bold">Ajustes</span>
            </button>
            
            {/* BOTÓN CERRAR SESIÓN (NUEVO) */}
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
        
        {/* Tarjeta Próximo Evento */}
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

        {/* Tarjeta Estadísticas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Activos</h3>
            <div className="text-4xl font-bold text-blue-600">{setlists.length}</div>
            <div className="text-sm text-gray-400">Eventos futuros</div>
        </div>

        {/* Tarjeta CÓDIGO DE EQUIPO (Solo Admin) */}
        {org?.role === 'admin' ? (
             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
                <Music className="absolute -bottom-4 -right-4 text-white/10 w-32 h-32" />
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4">Código Equipo</h3>
                <div className="text-3xl font-mono font-bold tracking-wider select-all">{org?.id.slice(0,8)}...</div>
                <div className="text-xs text-blue-200 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Haz clic para copiar ID completo</div>
             </div>
        ) : (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
                 <Users className="text-gray-300 mb-2" size={32}/>
                 <p className="text-sm text-gray-400">Eres miembro del equipo</p>
             </div>
        )}
      </div>

      {/* LISTA DE EVENTOS (AGENDA) */}
      <section>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
                <Calendar size={20} className="text-gray-400"/> Agenda
            </h2>
            {org?.role === 'admin' && (
                <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors">
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