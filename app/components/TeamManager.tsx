"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Check, X, User, Trash2, Plus, ChevronDown, ChevronUp, CheckCircle2, Settings, Save, AlertCircle } from 'lucide-react';

interface TeamManagerProps {
  setlistId: string;
  userRole: string | null;
  currentUserId: string;
}

// Estructura por defecto (Backup por si falla la DB)
const DEFAULT_SECTIONS = [
  { title: "Banda", roles: ["Batería", "Bajo", "Guitarra Eléctrica", "Guitarra Acústica", "Teclas/Piano"] },
  { title: "Voces", roles: ["Líder de Alabanza", "Coro 1", "Coro 2"] },
  { title: "Técnica", roles: ["Sonido", "Multimedia", "Luces"] }
];

export default function TeamManager({ setlistId, userRole, currentUserId }: TeamManagerProps) {
  const [musicians, setMusicians] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>(DEFAULT_SECTIONS); // Estado dinámico de secciones
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // MODO EDICIÓN
  const [isEditing, setIsEditing] = useState(false);
  const [editedSections, setEditedSections] = useState<any[]>([]);

  const isAdmin = userRole === 'admin' || userRole === 'owner';

  useEffect(() => { fetchData(); }, [setlistId]);

  const fetchData = async () => {
    try {
        const { data: setlist } = await supabase.from('setlists').select('organization_id').eq('id', setlistId).single();
        
        if (setlist) {
            setOrganizationId(setlist.organization_id);
            
            // 1. Cargar Músicos
            const { data: team } = await supabase
                .from('organization_members')
                .select('user_id, profile:profiles(id, full_name, avatar_url, main_instrument)')
                .eq('organization_id', setlist.organization_id);
            if (team) setMusicians(team.map((t: any) => t.profile).filter(Boolean));

            // 2. Cargar Estructura Personalizada de la Organización
            const { data: org } = await supabase
                .from('organizations')
                .select('team_structure')
                .eq('id', setlist.organization_id)
                .single();
            
            if (org && org.team_structure) {
                setSections(org.team_structure);
            }
        }

        // 3. Cargar Asignaciones
        const { data: current } = await supabase.from('assignments').select('*').eq('setlist_id', setlistId);
        if (current) setAssignments(current);

    } catch (error) { console.error(error); }
  };

  // --- LÓGICA DE ASIGNACIÓN ---
  const handleAssign = async (userId: string, roleName: string) => {
    if (!isAdmin) return;
    const isBusy = assignments.find(a => a.user_id === userId);
    if (isBusy) return alert(`⚠️ Esa persona ya está asignada.`);
    
    await supabase.from('assignments').insert({ setlist_id: setlistId, user_id: userId, role: roleName, status: 'pending' });
    setOpenRole(null);
    await fetchData();
  };

  const handleRemove = async (id: string) => {
    if (!isAdmin) return;
    await supabase.from('assignments').delete().eq('id', id);
    fetchData();
  };

  const changeStatus = async (id: string, status: string) => {
    await supabase.from('assignments').update({ status }).eq('id', id);
    fetchData();
  };

  // --- LÓGICA DEL MODO EDICIÓN ---
  const startEditing = () => {
      setEditedSections(JSON.parse(JSON.stringify(sections))); // Copia profunda
      setIsEditing(true);
  };

  const saveConfiguration = async () => {
      if (!organizationId) return;
      try {
          const { error } = await supabase
            .from('organizations')
            .update({ team_structure: editedSections })
            .eq('id', organizationId);

          if (error) throw error;
          
          setSections(editedSections);
          setIsEditing(false);
          alert("¡Estructura guardada correctamente!");
      } catch (error) {
          console.error(error);
          alert("Error al guardar la configuración.");
      }
  };

  const addRoleToSection = (sectionIndex: number) => {
      const newName = prompt("Nombre del nuevo instrumento/rol:");
      if (!newName) return;
      
      const newSections = [...editedSections];
      newSections[sectionIndex].roles.push(newName);
      setEditedSections(newSections);
  };

  const deleteRoleFromSection = (sectionIndex: number, roleIndex: number) => {
      if (!confirm("¿Borrar este rol? (Las asignaciones actuales no se borrarán, pero dejará de aparecer en la lista)")) return;
      const newSections = [...editedSections];
      newSections[sectionIndex].roles.splice(roleIndex, 1);
      setEditedSections(newSections);
  };

  const addSection = () => {
      const newName = prompt("Nombre del nuevo Grupo (ej: Danza, Metales):");
      if (!newName) return;
      setEditedSections([...editedSections, { title: newName, roles: [] }]);
  };

  const deleteSection = (index: number) => {
      if (!confirm("¿Borrar todo este grupo y sus roles?")) return;
      const newSections = [...editedSections];
      newSections.splice(index, 1);
      setEditedSections(newSections);
  };

  const toggleRole = (role: string) => {
      setOpenRole(openRole === role ? null : role);
  };

  const confirmedCount = assignments.filter(a => a.status === 'confirmed').length;
  const pendingCount = assignments.filter(a => a.status === 'pending').length;

  // --- VISTA: MODO EDICIÓN ---
  if (isEditing) {
      return (
          <div className="flex flex-col h-full bg-white dark:bg-[#111]">
              <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-indigo-50 dark:bg-indigo-900/10">
                  <h3 className="font-bold text-indigo-700 dark:text-indigo-300 mb-2">Editar Estructura</h3>
                  <p className="text-xs text-indigo-600/70 dark:text-indigo-400 mb-4">Agrega o quita instrumentos según tu iglesia.</p>
                  <div className="flex gap-2">
                      <button onClick={saveConfiguration} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"><Save size={16}/> Guardar</button>
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 dark:bg-zinc-800 rounded-lg text-sm font-bold hover:bg-gray-300">Cancelar</button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {editedSections.map((section, sIndex) => (
                      <div key={sIndex} className="border border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-3 bg-gray-50/50 dark:bg-zinc-900/30">
                          <div className="flex justify-between items-center mb-3">
                              <input 
                                value={section.title}
                                onChange={(e) => {
                                    const newSecs = [...editedSections];
                                    newSecs[sIndex].title = e.target.value;
                                    setEditedSections(newSecs);
                                }}
                                className="bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none border-b border-transparent focus:border-indigo-500 w-full"
                              />
                              <button onClick={() => deleteSection(sIndex)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                          </div>
                          <div className="space-y-2 pl-2">
                              {section.roles.map((role: string, rIndex: number) => (
                                  <div key={rIndex} className="flex justify-between items-center bg-white dark:bg-black p-2 rounded-lg shadow-sm">
                                      <span className="text-xs text-gray-700 dark:text-gray-300">{role}</span>
                                      <button onClick={() => deleteRoleFromSection(sIndex, rIndex)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                                  </div>
                              ))}
                              <button onClick={() => addRoleToSection(sIndex)} className="w-full py-2 text-xs font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg border border-dashed border-indigo-200 dark:border-indigo-900 flex items-center justify-center gap-1">
                                  <Plus size={14}/> Agregar Rol
                              </button>
                          </div>
                      </div>
                  ))}
                  <button onClick={addSection} className="w-full py-3 bg-gray-100 dark:bg-zinc-800 text-gray-500 font-bold rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 hover:border-gray-400 flex items-center justify-center gap-2">
                      <Plus size={16}/> Nuevo Grupo
                  </button>
                  <div className="h-10"></div>
              </div>
          </div>
      );
  }

  // --- VISTA: MODO NORMAL ---
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111]">
      {/* HEADER FIXED */}
      <div className="p-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-black/20 shrink-0">
         <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="text-indigo-600" size={18}/> Gestión de Equipo
             </h3>
             {isAdmin && (
                 <button onClick={startEditing} className="p-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Editar roles e instrumentos">
                     <Settings size={16}/>
                 </button>
             )}
         </div>
         <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-2.5 text-center">
                <div className="text-xl font-black text-green-600 dark:text-green-500 leading-none">{confirmedCount}</div>
                <div className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Confirmados</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-2.5 text-center">
                <div className="text-xl font-black text-amber-500 leading-none">{pendingCount}</div>
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider">Pendientes</div>
            </div>
         </div>
      </div>

      {/* LISTA SCROLLEABLE */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
        {sections.map((section: any) => (
            <div key={section.title}>
                <h4 className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1 border-b border-gray-100 dark:border-zinc-800/50 pb-1">
                    {section.title}
                </h4>
                
                <div className="space-y-3">
                    {section.roles.map((role: string) => {
                        const assignment = assignments.find(a => a.role === role);
                        const person = assignment ? musicians.find(m => m.id === assignment.user_id) : null;
                        const isMe = person?.id === currentUserId;
                        const canEdit = isAdmin || isMe;
                        const isOpen = openRole === role;

                        return (
                            <div key={role} className="relative text-sm">
                                {person ? (
                                    // === ESTADO: OCUPADO ===
                                    <div className={`p-3 rounded-xl border transition-all flex flex-col gap-2 shadow-sm
                                        ${assignment.status === 'confirmed' ? 'bg-white dark:bg-[#161616] border-green-500/30' : 
                                          assignment.status === 'declined' ? 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 opacity-60' : 
                                          'bg-white dark:bg-[#161616] border-amber-400/50'}
                                    `}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden
                                                    ${assignment.status === 'confirmed' ? 'bg-green-500' : assignment.status === 'declined' ? 'bg-gray-400' : 'bg-amber-500'}
                                                `}>
                                                    {person.avatar_url ? (
                                                        <img src={person.avatar_url} className="w-full h-full object-cover"/>
                                                    ) : (
                                                        person.full_name.substring(0,2).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-[10px] text-gray-400 dark:text-zinc-500 leading-none mb-1 font-medium">{role}</div>
                                                    <div className="font-bold text-gray-900 dark:text-white truncate max-w-[140px] leading-tight">
                                                        {person.full_name} 
                                                        {isMe && <span className="ml-1 text-[8px] bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full">TÚ</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {isAdmin && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemove(assignment.id);
                                                    }}
                                                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            )}
                                        </div>
                                        {canEdit && assignment.status === 'pending' && (
                                            <div className="flex gap-2 mt-1">
                                                <button onClick={() => changeStatus(assignment.id, 'confirmed')} className="flex-1 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 py-1.5 rounded-lg text-xs font-bold flex justify-center items-center gap-1 transition-colors"><Check size={14}/> Confirmar</button>
                                                <button onClick={() => changeStatus(assignment.id, 'declined')} className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 py-1.5 rounded-lg text-xs font-bold flex justify-center items-center gap-1 transition-colors"><X size={14}/> Rechazar</button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // === ESTADO: VACÍO ===
                                    isAdmin ? (
                                        <div className="flex flex-col">
                                            <button 
                                                onClick={() => toggleRole(role)}
                                                className={`w-full p-2.5 border border-dashed rounded-xl flex items-center justify-between transition-all group/btn
                                                    ${isOpen 
                                                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' 
                                                        : 'border-gray-300 dark:border-zinc-700 hover:border-indigo-400 hover:text-indigo-500 hover:bg-gray-50 dark:hover:bg-zinc-800'}
                                                `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}>
                                                        <Plus size={16}/>
                                                    </div>
                                                    <div className="text-left">
                                                        <span className={`block text-xs font-bold ${isOpen ? 'text-indigo-600' : 'text-gray-700 dark:text-zinc-400'}`}>{role}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium">Vacante</span>
                                                    </div>
                                                </div>
                                                <div className="text-gray-400">
                                                    {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className="mt-2 ml-4 pl-4 border-l-2 border-indigo-100 dark:border-zinc-800 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                    <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase px-2">Sugerencias:</p>
                                                    {musicians.length === 0 && <div className="p-2 text-xs text-center text-gray-400 italic">No hay miembros.</div>}
                                                    {musicians.map(m => (
                                                        <button 
                                                            key={m.id} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAssign(m.id, role);
                                                            }}
                                                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left group/item transition-colors"
                                                        >
                                                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden shrink-0">
                                                                {m.avatar_url ? (
                                                                    <img src={m.avatar_url} className="w-full h-full object-cover"/>
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-500">{m.full_name?.substring(0,2)}</div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-bold text-gray-700 dark:text-zinc-300 group-hover/item:text-indigo-600 truncate">{m.full_name}</div>
                                                                {m.main_instrument && <div className="text-[9px] text-gray-400 truncate">{Array.isArray(m.main_instrument) ? m.main_instrument.join(', ') : m.main_instrument}</div>}
                                                            </div>
                                                            <CheckCircle2 size={14} className="text-gray-300 group-hover/item:text-indigo-500 opacity-0 group-hover/item:opacity-100 transition-opacity"/>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-3 border border-gray-100 dark:border-zinc-800 rounded-xl flex items-center gap-3 opacity-60">
                                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                                                <User size={14} className="text-gray-300"/>
                                            </div>
                                            <div className="text-xs text-gray-400">{role} <span className="italic">Vacante</span></div>
                                        </div>
                                    )
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        ))}
        <div className="h-10"></div>
      </div>
    </div>
  );
}