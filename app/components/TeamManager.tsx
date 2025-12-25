"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, XCircle, Clock, Plus, User, Trash2, Mic, Music, Speaker, ChevronDown } from 'lucide-react';

interface TeamManagerProps {
  setlistId: string;
}

// DEFINIMOS LA ESTRUCTURA DE TU BANDA
const SECTIONS = [
  {
    title: "Banda",
    icon: <Music size={16} />,
    roles: ["Batería", "Bajo", "Guitarra Eléctrica", "Guitarra Acústica", "Teclas/Piano"]
  },
  {
    title: "Voces",
    icon: <Mic size={16} />,
    roles: ["Líder de Alabanza", "Coro 1", "Coro 2"]
  },
  {
    title: "Técnica",
    icon: <Speaker size={16} />,
    roles: ["Sonido", "Multimedia", "Luces"]
  }
];

export default function TeamManager({ setlistId }: TeamManagerProps) {
  const [musicians, setMusicians] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
        if (profile) {
            const { data: team } = await supabase
                .from('profiles')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .order('full_name');
            if (team) setMusicians(team);
        }
    }

    const { data: current } = await supabase
      .from('assignments')
      .select('*')
      .eq('setlist_id', setlistId);
    if (current) setAssignments(current);
  };

  useEffect(() => { fetchData(); }, [setlistId]);

  const handleAssign = async (userId: string, roleName: string) => {
    setLoading(true);
    const isBusy = assignments.find(a => a.user_id === userId);
    if (isBusy) {
        alert("Esta persona ya tiene un puesto asignado.");
        setLoading(false);
        return;
    }

    await supabase.from('assignments').insert({
      setlist_id: setlistId,
      user_id: userId,
      role: roleName,
      status: 'pending'
    });
    
    await fetchData();
    setLoading(false);
  };

  const handleRemove = async (assignmentId: string) => {
    if(!confirm("¿Liberar este puesto?")) return;
    setLoading(true);
    await supabase.from('assignments').delete().eq('id', assignmentId);
    await fetchData();
    setLoading(false);
  };

  const toggleStatus = async (assignmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'confirmed' : currentStatus === 'confirmed' ? 'declined' : 'pending';
    await supabase.from('assignments').update({ status: newStatus }).eq('id', assignmentId);
    fetchData();
  };

  // Cálculos para las tarjetas
  const confirmedCount = assignments.filter(a => a.status === 'confirmed').length;
  const pendingCount = assignments.filter(a => a.status === 'pending').length;
  const declinedCount = assignments.filter(a => a.status === 'declined').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      
      {/* HEADER RE-DISEÑADO: Título + Tarjetas de Resumen */}
      <div className="p-5 border-b border-gray-100 bg-white space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
          <User size={20} className="text-blue-600"/> Gestión de Equipo
        </h3>
        
        {/* Grid de Estadísticas (Mini Tarjetas) */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-green-600 leading-none">{confirmedCount}</span>
                <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider mt-1 flex items-center gap-1">
                    <CheckCircle size={10} /> Confirmados
                </span>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-amber-500 leading-none">{pendingCount}</span>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mt-1 flex items-center gap-1">
                    <Clock size={10} /> Pendientes
                </span>
            </div>
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto max-h-[600px]">
        {SECTIONS.map((section) => (
            <div key={section.title} className="animate-in fade-in duration-500">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    {section.icon} {section.title}
                </h4>

                <div className="space-y-3">
                    {section.roles.map(roleName => {
                        const assignment = assignments.find(a => a.role === roleName);
                        const person = assignment ? musicians.find(m => m.id === assignment.user_id) : null;

                        return (
                            <div key={roleName} className="group">
                                {/* Encabezado del Rol */}
                                <div className="mb-1 flex justify-between items-end px-1">
                                    <span className="text-xs font-bold text-gray-500">{roleName}</span>
                                </div>

                                {/* TARJETA DEL PUESTO */}
                                {person ? (
                                    <div className={`relative flex items-center justify-between border rounded-xl p-3 shadow-sm transition-all ${
                                        assignment.status === 'confirmed' ? 'bg-white border-green-200 ring-1 ring-green-100' : 
                                        assignment.status === 'declined' ? 'bg-red-50 border-red-100' : 'bg-white border-amber-200 border-dashed'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm
                                                ${assignment.status === 'confirmed' ? 'bg-green-500' : assignment.status === 'declined' ? 'bg-red-400' : 'bg-amber-400'}
                                            `}>
                                                {person.full_name.substring(0,2)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 leading-tight">{person.full_name}</p>
                                                <button onClick={() => toggleStatus(assignment.id, assignment.status)} className="text-[10px] font-medium text-gray-400 hover:text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                                                    {assignment.status === 'confirmed' ? 'Confirmado' : assignment.status === 'declined' ? 'Rechazado' : 'Pendiente'}
                                                </button>
                                            </div>
                                        </div>

                                        <button onClick={() => handleRemove(assignment.id)} className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors">
                                            <Trash2 size={16} />
                                        </button>

                                        {/* Indicador visual de estado */}
                                        <div className={`absolute -right-1 -top-1 w-3 h-3 rounded-full border-2 border-white ${
                                            assignment.status === 'confirmed' ? 'bg-green-500' : 
                                            assignment.status === 'declined' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'
                                        }`}></div>
                                    </div>
                                ) : (
                                    // BOTÓN VACÍO (Estilo Minimalista)
                                    <div className="relative group/select">
                                        <button className="w-full flex items-center gap-3 border border-gray-200 border-dashed rounded-xl p-2.5 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100">
                                                <Plus size={16} />
                                            </div>
                                            <span className="text-sm font-medium">Asignar...</span>
                                        </button>

                                        {/* Dropdown flotante */}
                                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl hidden group-hover/select:block z-50 mt-1 max-h-48 overflow-y-auto">
                                            {musicians.length === 0 && <div className="p-3 text-xs text-center text-gray-400">No hay músicos</div>}
                                            {musicians.map(m => (
                                                <button 
                                                    key={m.id}
                                                    onClick={() => handleAssign(m.id, roleName)}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                                                >
                                                    <span className="font-bold text-gray-700">{m.full_name}</span>
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{m.main_instrument?.substring(0,3) || '?'}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}