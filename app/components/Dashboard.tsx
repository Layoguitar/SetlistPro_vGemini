"use client";

import React, { useEffect, useState } from 'react';
import { Settings, Plus, Calendar, Clock, Music, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ProfileSettings from './ProfileSettings';

export default function Dashboard({ onCreateNew, onEditSetlist, onGoLive }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [setlists, setSetlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Estadísticas
  const [stats, setStats] = useState({ next: 0, month: 0, total: 0 });

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Cargar Perfil y Org
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*, organizations(invite_code, name)')
        .eq('id', user.id)
        .single();
      
      setProfile(userProfile);

      if (userProfile?.organization_id) {
        // 2. Cargar Setlists de la Organización
        const { data: lists } = await supabase
            .from('setlists')
            .select('*, setlist_items(count)') 
            .eq('organization_id', userProfile.organization_id)
            .order('scheduled_date', { ascending: true }); // Los más próximos primero
        
        if (lists) {
            // Filtrar eventos futuros vs pasados
            const now = new Date();
            const future = lists.filter(l => new Date(l.scheduled_date) >= new Date(now.setHours(0,0,0,0)));
            setSetlists(future);

            // Calcular Estadísticas
            setStats({
                next: future.length > 0 ? 1 : 0, // Hay un próximo?
                month: future.length, // Total activos
                total: lists.length // Histórico
            });
        }
      }
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (showSettings) {
    return <ProfileSettings userId={profile?.id} onBack={() => { setShowSettings(false); loadData(); }} />;
  }

  if (loading) return <div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    // CORRECCIÓN MÓVIL: Contenedor con altura dinámica y scroll propio
    <div className="h-[100dvh] w-full overflow-y-auto bg-gray-50">
      
      <div className="max-w-5xl mx-auto pt-6 px-4 space-y-8 pb-32">
        
        {/* HEADER + BOTONES */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Hola, {profile?.full_name?.split(' ')[0] || 'Músico'} 👋
            </h1>
            <p className="text-gray-500 mt-1 font-medium text-sm">
              {profile?.organizations?.name || 'Tu Banda'} • <span className="text-indigo-600 font-bold uppercase text-xs">{profile?.role === 'admin' ? 'Director' : 'Músico'}</span>
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowSettings(true)} 
                className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all"
              >
                <Settings size={18} /> Ajustes
              </button>
              
              {profile?.role === 'admin' && (
                <button 
                    onClick={onCreateNew} 
                    className="flex-1 md:flex-none bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg transition-transform active:scale-95 text-sm"
                >
                    <Plus size={18} /> Nuevo Evento
                </button>
              )}
          </div>
        </div>

        {/* TARJETAS DE ESTADÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Próximo Evento */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Próximo Evento</p>
              <div className="text-3xl font-bold text-gray-900 truncate">
                  {setlists[0] ? new Date(setlists[0].scheduled_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }) : '-'}
              </div>
              <p className="text-xs text-gray-400 truncate">{setlists[0]?.name || 'Sin programar'}</p>
          </div>

          {/* Activos */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Activos</p>
              <div className="text-3xl font-bold text-blue-600">{stats.month}</div>
              <p className="text-xs text-gray-400">Eventos futuros</p>
          </div>

          {/* Código Equipo */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between h-32 relative overflow-hidden group">
               <div className="relative z-10">
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Código Equipo</p>
                  <div 
                      onClick={() => {navigator.clipboard.writeText(profile?.organizations?.invite_code); alert("Copiado")}}
                      className="text-2xl font-mono font-bold mt-1 cursor-pointer hover:opacity-80 flex items-center gap-2"
                  >
                      {profile?.organizations?.invite_code || '---'}
                  </div>
               </div>
               <Music className="absolute -bottom-4 -right-4 text-white opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
          </div>
        </div>

        {/* LISTA DE EVENTOS */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-gray-400"/> Agenda
          </h2>
          
          {setlists.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-medium">No hay eventos próximos.</p>
              {profile?.role === 'admin' && <p className="text-sm text-blue-600 mt-2 cursor-pointer hover:underline" onClick={onCreateNew}>Crea el primero ahora</p>}
            </div>
          ) : (
            <div className="grid gap-3 pb-10"> 
              {setlists.map((setlist) => (
                <div 
                  key={setlist.id} 
                  onClick={() => profile?.role === 'admin' ? onEditSetlist(setlist.id) : onGoLive(setlist.id)} 
                  className="group bg-white p-4 md:p-5 rounded-2xl border border-gray-100 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 md:gap-5 overflow-hidden">
                    {/* Fecha Badge */}
                    <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold uppercase">{new Date(setlist.scheduled_date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                      <span className="text-xl font-bold leading-none">{new Date(setlist.scheduled_date).getDate()}</span>
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="font-bold text-base md:text-lg text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {setlist.name}
                      </h3>
                      <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1 shrink-0"><Clock size={12} /> {new Date(setlist.scheduled_date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="text-gray-300">•</span>
                        <span className="flex items-center gap-1 font-medium text-gray-600 truncate">{setlist.setlist_items[0]?.count || 0} canciones</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1 pl-2">
                    <ArrowRight size={20} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}