"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';

interface TeamManagerProps {
  setlistId: string;
}

export default function TeamManager({ setlistId }: TeamManagerProps) {
  const [musicians, setMusicians] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar músicos y asignaciones actuales
  const fetchData = async () => {
    // 1. Traer todos los perfiles
    const { data: allMusicians } = await supabase.from('profiles').select('*').order('full_name');
    if (allMusicians) setMusicians(allMusicians);

    // 2. Traer asignaciones de ESTE setlist
    const { data: currentAssignments } = await supabase
      .from('assignments')
      .select('*')
      .eq('setlist_id', setlistId);
    if (currentAssignments) setAssignments(currentAssignments);
  };

  useEffect(() => {
    fetchData();
  }, [setlistId]);

  // Asignar o Desasignar (Toggle)
  const toggleAssignment = async (userId: string) => {
    setLoading(true);
    const existing = assignments.find(a => a.user_id === userId);

    if (existing) {
      // Si ya está, lo borramos (Desasignar)
      await supabase.from('assignments').delete().eq('id', existing.id);
    } else {
      // Si no está, lo creamos (Asignar)
      await supabase.from('assignments').insert([{
        setlist_id: setlistId,
        user_id: userId,
        status: 'pending' // Empieza como pendiente
      }]);
    }
    await fetchData();
    setLoading(false);
  };

  return (
    <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <User size={20} className="text-blue-600"/> Equipo para este evento
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {musicians.map(musician => {
          const assignment = assignments.find(a => a.user_id === musician.id);
          const isAssigned = !!assignment;

          return (
            <button
              key={musician.id}
              disabled={loading}
              onClick={() => toggleAssignment(musician.id)}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                isAssigned 
                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                  : 'bg-white border-gray-100 hover:border-gray-300'
              }`}
            >
              <div>
                <p className={`font-bold text-sm ${isAssigned ? 'text-blue-900' : 'text-gray-700'}`}>
                  {musician.full_name}
                </p>
                <p className="text-xs text-gray-400">{musician.main_instrument}</p>
              </div>

              {/* Icono de Estado */}
              {isAssigned ? (
                <div className="flex items-center gap-1">
                  {assignment.status === 'pending' && <Clock size={18} className="text-yellow-500" />}
                  {assignment.status === 'confirmed' && <CheckCircle size={18} className="text-green-500" />}
                  {assignment.status === 'declined' && <XCircle size={18} className="text-red-500" />}
                </div>
              ) : (
                <Plus size={18} className="text-gray-300" />
              )}
            </button>
          );
        })}
      </div>
      
      <p className="text-xs text-gray-400 mt-4 text-center">
        Haz clic para invitar. Icono amarillo = Pendiente de confirmación.
      </p>
    </div>
  );
}