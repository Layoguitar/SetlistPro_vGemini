"use client";

import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, Search, Loader2, Save, ArrowLeft, Trash2, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { SetlistItem, Song } from '@/types/database';
import NewSongModal from './NewSongModal';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import TeamManager from './TeamManager';

interface SetlistEditorProps {
  setlistId?: string | null;
  onBack: () => void;
}

export default function SetlistEditor({ setlistId, onBack }: SetlistEditorProps) {
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [eventName, setEventName] = useState("Servicio Dominical");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [defaultSongs, setDefaultSongs] = useState<Song[]>([]);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. CARGA DE DATOS
  useEffect(() => {
    const loadSetlistData = async () => {
      fetchDefaultSongs(); // Cargar canciones sugeridas siempre

      if (!setlistId) return; // Si es nuevo, paramos aquí

      setIsLoading(true);
      
      // A) Cargar info del setlist
      const { data: setlist } = await supabase.from('setlists').select('*').eq('id', setlistId).single();
      if (setlist) {
        setEventName(setlist.name);
        setEventDate(setlist.scheduled_date.split('T')[0]);
      }

      // B) Cargar los ítems
      const { data: itemsData } = await supabase
        .from('setlist_items')
        .select(`*, song:songs(*)`)
        .eq('setlist_id', setlistId)
        .order('position', { ascending: true });

      if (itemsData) setItems(itemsData);
      
      setIsLoading(false);
    };

    loadSetlistData();
  }, [setlistId]);

  const fetchDefaultSongs = async () => {
    // Buscamos canciones que pertenezcan a tu organización (vía perfil)
    const { data: { user } } = await supabase.auth.getUser();
    if(user) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
        if(profile) {
            const { data } = await supabase.from('songs')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .limit(20);
            if (data) setDefaultSongs(data);
        }
    }
  };

  // --- BÚSQUEDA ---
  useEffect(() => {
    const searchSongs = async () => {
      if (searchTerm.trim() === "") {
        setSearchResults([]);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if(!user) return;
      
      // Obtener Org ID
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      
      if(profile) {
          const { data } = await supabase.from('songs')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .ilike('title', `%${searchTerm}%`)
            .limit(10);
          if (data) setSearchResults(data);
      }
    };
    const timer = setTimeout(searchSongs, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- GESTIÓN DE ÍTEMS ---
  const addSong = (song: Song) => {
    const newItem: SetlistItem = {
      id: crypto.randomUUID(),
      setlist_id: setlistId || 'temp',
      song_id: song.id,
      type: 'song',
      position: items.length,
      title_override: null, key_override: song.default_key, duration_override: song.duration_seconds, note: null, song: song
    };
    setItems([...items, newItem]);
    setSearchTerm(""); setShowDropdown(false);
  };

  const addBlock = (label: string) => {
    const newItem: SetlistItem = {
      id: crypto.randomUUID(),
      setlist_id: setlistId || 'temp',
      song_id: null,
      type: 'block',
      position: items.length,
      title_override: label, key_override: null, duration_override: 300, note: null
    };
    setItems([...items, newItem]);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setItems(newItems.map((item, idx) => ({ ...item, position: idx })));
  };

  // --- GUARDADO (AQUÍ ESTABA EL ERROR) ---
  const handleSave = async () => {
    if (items.length === 0 && !confirm("¿Guardar setlist vacío?")) return;
    setIsSaving(true);

    try {
      // 1. OBTENER ORG_ID DEL USUARIO ACTUAL
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!profile?.organization_id) throw new Error("No tienes organización asignada. Contacta soporte.");

      let currentSetlistId = setlistId;

      // 2. CREAR O ACTUALIZAR SETLIST CON EL ORG_ID
      if (!currentSetlistId) {
        const { data, error } = await supabase.from('setlists').insert([{ 
          name: eventName, 
          scheduled_date: eventDate,
          organization_id: profile.organization_id // <--- CLAVE: Asignar a la organización
        }]).select().single();
        
        if (error) throw error;
        currentSetlistId = data.id;
      } else {
        const { error } = await supabase.from('setlists')
            .update({ name: eventName, scheduled_date: eventDate })
            .eq('id', currentSetlistId);
        if (error) throw error;
      }

      // 3. ACTUALIZAR ÍTEMS
      await supabase.from('setlist_items').delete().eq('setlist_id', currentSetlistId);

      const itemsToSave = items.map((item, index) => ({
        setlist_id: currentSetlistId,
        song_id: item.song_id,
        type: item.type,
        position: index,
        title_override: item.title_override,
        key_override: item.key_override,
        duration_override: item.duration_override,
        note: item.note
      }));

      if (itemsToSave.length > 0) {
        const { error: itemsError } = await supabase.from('setlist_items').insert(itemsToSave);
        if (itemsError) throw itemsError;
      }

      alert("¡Guardado exitosamente!");
      onBack();

    } catch (error: any) {
      console.error(error);
      alert("Error al guardar: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalDuration = items.reduce((acc, item) => acc + (item.duration_override || 0), 0);
  const songsToDisplay = searchTerm.trim() === "" ? defaultSongs : searchResults;

  if (isLoading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* HEADER TIPO SERVICIOS */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium">
          <ArrowLeft size={20} /> Volver
        </button>
        <div className="flex items-center gap-4">
             <span className="text-sm text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded-full">Total: {Math.floor(totalDuration / 60)} min</span>
             <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSaving ? "Guardando..." : "Guardar Setlist"}
            </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre del Evento</label>
            <input 
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="text-3xl font-bold text-gray-900 border-none outline-none w-full placeholder:text-gray-300 focus:ring-0 p-0"
                placeholder="Ej. Culto Dominical"
            />
        </div>
        <div className="flex items-center gap-2">
             <Calendar size={16} className="text-gray-400"/>
             <input 
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-sm font-medium text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer"
             />
        </div>
      </div>

      {/* ÁREA DE TRABAJO */}
      <div className="flex flex-col lg:flex-row gap-8">
          
          {/* COLUMNA IZQUIERDA: CONSTRUCTOR */}
          <div className="flex-1 space-y-4">
            
            {/* Buscador Rápido */}
            <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 shadow-sm"
                  placeholder="Escribe para buscar canciones..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                />
                 {/* Dropdown de Resultados */}
                {showDropdown && (songsToDisplay.length > 0 || searchTerm.length > 0) && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-2 overflow-hidden z-20 max-h-80 overflow-y-auto">
                            
                            <div className="p-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase">Resultados</span>
                                <button onClick={() => { setIsModalOpen(true); setShowDropdown(false); }} className="text-xs font-bold text-blue-600 hover:underline">+ Crear Nueva</button>
                            </div>

                            {songsToDisplay.map(song => (
                                <button key={song.id} onClick={() => addSong(song)} className="w-full text-left px-4 py-3 hover:bg-blue-50 flex justify-between border-b border-gray-50 transition-colors group">
                                    <div><span className="font-bold text-gray-900">{song.title}</span><br/><span className="text-xs text-gray-500">{song.artist}</span></div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 group-hover:bg-white">{song.default_key}</span>
                                        <span className="text-[10px] text-gray-400">{song.bpm} bpm</span>
                                    </div>
                                </button>
                            ))}
                            {songsToDisplay.length === 0 && (
                                <div className="p-4 text-center text-gray-400 text-sm">No encontramos esa canción. <br/> <button onClick={() => { setIsModalOpen(true); setShowDropdown(false); }} className="text-blue-600 font-bold hover:underline">Créala ahora</button></div>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            {/* Bloques Rápidos */}
            <div className="flex gap-2 flex-wrap">
                {['Bienvenida', 'Oración', 'Predica', 'Cena', 'Ministración'].map(label => (
                <button key={label} onClick={() => addBlock(label)} 
                    className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors border border-transparent hover:border-gray-300">
                    + {label}
                </button>
                ))}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="setlist">
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 min-h-[200px]">
                    {items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} 
                                className={`flex items-center gap-4 bg-white p-3 rounded-xl border transition-all ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 rotate-2' : 'shadow-sm border-gray-200 hover:border-blue-300'}`}
                            >
                            <div {...provided.dragHandleProps} className="text-gray-300 cursor-grab px-1 hover:text-gray-500"><GripVertical size={20} /></div>
                            <span className="font-bold text-gray-300 w-6 text-center text-lg">{index + 1}</span>
                            
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 text-lg">{item.title_override || item.song?.title}</p>
                                {item.type === 'song' && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{item.key_override}</span>
                                        <span className="text-xs text-gray-400">{item.song?.bpm} bpm • {item.song?.time_signature}</span>
                                    </div>
                                )}
                            </div>
                            
                            <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                            </div>
                        )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
                            <p>Tu setlist está vacío.</p>
                            <p className="text-sm">Usa el buscador arriba para agregar canciones.</p>
                        </div>
                    )}
                    </div>
                )}
                </Droppable>
            </DragDropContext>
          </div>

          {/* COLUMNA DERECHA: TEAM MANAGER (Solo si hay ID) */}
          <div className="lg:w-80 space-y-4">
             {setlistId ? (
                <TeamManager setlistId={setlistId} />
             ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Guarda el setlist para asignar músicos.</p>
                    <button onClick={handleSave} className="text-blue-600 text-sm font-bold hover:underline">Guardar Ahora</button>
                </div>
             )}
          </div>
      </div>

      <NewSongModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSongCreated={addSong} />
    </div>
  );
}