"use client";

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ChevronRight, Plus, Loader2, Music, Check, X, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface DashboardProps {
  onCreateNew: () => void;
  onEditSetlist: (id: string) => void;
}

export default function Dashboard({ onCreateNew, onEditSetlist }: DashboardProps) {
  const [setlists, setSetlists] = useState<any[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]); // Invitaciones personales
  const [loading, setLoading] = useState(true);

  // Estados del Usuario Real
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  // 1. CARGAR USUARIO AL INICIO
  useEffect(() => {
    const getUserData = async () => {
      // Obtenemos el usuario de la sesión actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUserId(user.id);
        
        // Buscamos su nombre real en la tabla 'profiles'
        const { data: profile } = await supabase
           .from('profiles')
           .select('full_name')
           .eq('id', user.id)
           .single();
           
        if (profile) setUserName(profile.full_name);
      }
    };
    getUserData();
  }, []);

  // 2. CARGAR DATOS DEL DASHBOARD
  const fetchData = async () => {
    // A) Cargar Setlists generales (Todos los eventos públicos)
    const { data: lists } = await supabase
      .from('setlists')
      .select('*, setlist_items(count)') 
      .order('created_at', { ascending: false });
    if (lists) setSetlists(lists);

    // B) Cargar MIS asignaciones (Solo si ya sabemos quién es el usuario)
    if (currentUserId) {
      const { data: assigns } = await supabase
        .from('assignments')
        .select(`
          id, status, 
          setlist:setlists (id, name, scheduled_date)
        `)
        .eq('user_id', currentUserId)
        .neq('status', 'declined'); // Ocultamos los que ya rechazó
      
      if (assigns) setMyAssignments(assigns);
    }
    setLoading(false);
  };

  // Recargar datos cuando tengamos el ID del usuario
  useEffect(() => {
    fetchData();
  }, [currentUserId]);

  // Función para Responder (Aceptar/Rechazar invitación)
  const handleRespond = async (assignmentId: string, newStatus: 'confirmed' | 'declined') => {
    await supabase.from('assignments').update({ status: newStatus }).eq('id', assignmentId);
    fetchData(); // Recargar para actualizar la interfaz
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      
      {/* HEADER DE BIENVENIDA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hola, {userName || 'Músico'} 👋
          </h1>
          <p className="text-gray-500 mt-1">Aquí tienes tus próximos eventos.</p>
        </div>
        <button 
          onClick={onCreateNew}
          className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus size={20} /> Crear Nuevo Setlist
        </button>
      </div>

      {/* --- SECCIÓN 1: MIS INVITACIONES (Solo si hay alguna pendiente o confirmada) --- */}
      {myAssignments.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
           <h2 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
             <Bell size={20}/> Tienes invitaciones
           </h2>
           <div className="grid gap-3">
             {myAssignments.map((assign: any) => (
               <div key={assign.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                 <div>
                    <h3 className="font-bold text-gray-900">{assign.setlist.name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(assign.setlist.scheduled_date).toLocaleDateString()}
                    </p>
                 </div>
                 
                 <div className="flex items-center gap-2">
                   {assign.status === 'pending' ? (
                     <>
                       <button 
                        onClick={() => handleRespond(assign.id, 'confirmed')}
                        className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 font-medium text-sm flex items-center gap-1 transition-colors">
                         <Check size={16}/> Voy
                       </button>
                       <button 
                        onClick={() => handleRespond(assign.id, 'declined')}
                        className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 font-medium text-sm flex items-center gap-1 transition-colors">
                         <X size={16}/> No puedo
                       </button>
                     </>
                   ) : (
                     <span className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full border border-green-100 flex items-center gap-1">
                       <Check size={14} /> Confirmado
                     </span>
                   )}
                   {/* Botón para ver el setlist */}
                   <button onClick={() => onEditSetlist(assign.setlist.id)} className="p-2 text-gray-400 hover:text-blue-600">
                     <ChevronRight />
                   </button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* --- SECCIÓN 2: TODOS LOS SETLISTS --- */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Historial de Eventos</h2>
        
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : setlists.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400">No hay eventos creados.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {setlists.map((setlist) => (
              <div 
                key={setlist.id}
                onClick={() => onEditSetlist(setlist.id)}
                className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                      {setlist.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Clock size={14} /> {new Date(setlist.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Music size={14} /> {setlist.setlist_items[0]?.count || 0} canciones</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-blue-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}