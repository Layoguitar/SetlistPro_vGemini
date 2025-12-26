"use client";

import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, Search, Loader2, Save, ArrowLeft, Trash2, Calendar, Clock, MoreVertical, Edit2 } from 'lucide-react';
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
  const [eventName, setEventName] = useState("Nuevo Evento");
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
      fetchDefaultSongs(); 
      if (!setlistId) return; 

      setIsLoading(true);
      const { data: setlist } = await supabase.from('setlists').select('*').eq('id', setlistId).single();
      if (setlist) {
        setEventName(setlist.name);
        setEventDate(setlist.scheduled_date); // Ya viene como YYYY-MM-DD
      }

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
    const { data: { user } } = await supabase.auth.getUser();
    if(user) {
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

        if(member?.organization_id) {
            const { data } = await supabase.from('songs')
                .select('*')
                .eq('organization_id', member.organization_id)
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
      const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
      
      if(member?.organization_id) {
          const { data } = await supabase.from('songs')
            .select('*')
            .eq('organization_id', member.organization_id)
            .ilike('title', `%${searchTerm}%`)
            .limit(10);
          if (data) setSearchResults(data);
      }
    };
    const timer = setTimeout(searchSongs, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- GESTIÓN ---
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

  // --- GUARDADO ---
  const handleSave = async () => {
    if (items.length === 0 && !confirm("¿Guardar setlist vacío?")) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
      if (!member?.organization_id) throw new Error("No tienes organización.");

      let currentSetlistId = setlistId;

      if (!currentSetlistId) {
        const { data, error } = await supabase.from('setlists').insert([{ 
          name: eventName, 
          scheduled_date: eventDate,
          organization_id: member.organization_id
        }]).select().single();
        if (error) throw error;
        currentSetlistId = data.id;
      } else {
        const { error } = await supabase.from('setlists')
            .update({ name: eventName, scheduled_date: eventDate })
            .eq('id', currentSetlistId);
        if (error) throw error;
      }

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
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalDuration = items.reduce((acc, item) => acc + (item.duration_override || 0), 0);
  const songsToDisplay = searchTerm.trim() === "" ? defaultSongs : searchResults;

  if (isLoading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-screen bg-gray-50 overflow-hidden">
      
      {/* HEADER MINIMALISTA (Tipo Notion/Google Docs) */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4 flex-1">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
                {/* Input de Título que parece texto */}
                <input 
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="text-lg font-bold text-gray-900 border-none outline-none bg-transparent placeholder:text-gray-300 focus:ring-0 p-0 hover:bg-gray-50 rounded px-1 transition-colors w-full md:w-96 truncate"
                    placeholder="Nombre del Evento"
                />
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 px-1">
                    <Calendar size={12} />
                    <input 
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="bg-transparent border-none p-0 text-gray-500 focus:ring-0 cursor-pointer h-auto w-auto"
                    />
                    <span>•</span>
                    <Clock size={12} />
                    <span>{Math.floor(totalDuration / 60)} min aprox.</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
             <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {isSaving ? "Guardando" : "Guardar"}
            </button>
        </div>
      </div>

      {/* ÁREA DE TRABAJO (2 Columnas) */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* COLUMNA IZQUIERDA: CONSTRUCTOR (Scroll independiente) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            
            {/* Buscador Integrado */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10 mx-auto max-w-3xl">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 transition-all text-sm font-medium"
                    placeholder="Buscar canción para agregar..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    />
                    
                    {/* Resultados Flotantes */}
                    {showDropdown && (songsToDisplay.length > 0 || searchTerm.length > 0) && (
                        <>
                            <div className="fixed inset-0 z-[5]" onClick={() => setShowDropdown(false)}></div>
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-2 overflow-hidden z-[6] max-h-80 overflow-y-auto">
                                <div className="p-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Biblioteca</span>
                                    <button onClick={() => { setIsModalOpen(true); setShowDropdown(false); }} className="text-xs font-bold text-blue-600 hover:underline">+ Crear Nueva</button>
                                </div>
                                {songsToDisplay.map(song => (
                                    <button key={song.id} onClick={() => addSong(song)} className="w-full text-left px-4 py-3 hover:bg-blue-50 flex justify-between border-b border-gray-50 transition-colors group">
                                        <div><span className="font-bold text-gray-900">{song.title}</span><br/><span className="text-xs text-gray-500">{song.artist}</span></div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 group-hover:bg-white">{song.default_key}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                {/* Bloques Rápidos (Horizontal) */}
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1 no-scrollbar">
                    {['Bienvenida', 'Oración', 'Predica', 'Cena', 'Ministración'].map(label => (
                    <button key={label} onClick={() => addBlock(label)} 
                        className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 whitespace-nowrap">
                        + {label}
                    </button>
                    ))}
                </div>
            </div>

            {/* LISTA DRAGGABLE */}
            <div className="mx-auto max-w-3xl pb-20">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="setlist">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} 
                                    className={`flex items-center gap-4 bg-white p-4 rounded-xl border transition-all group ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 rotate-1 z-50' : 'shadow-sm border-gray-200 hover:border-blue-300'}`}
                                >
                                <div {...provided.dragHandleProps} className="text-gray-300 cursor-grab px-1 hover:text-gray-500"><GripVertical size={20} /></div>
                                <span className="font-mono text-gray-300 font-bold w-6 text-center text-lg">{index + 1}</span>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <p className="font-bold text-gray-900 text-lg truncate">{item.title_override || item.song?.title}</p>
                                        {item.type === 'song' && (
                                            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{item.key_override}</span>
                                        )}
                                    </div>
                                    {item.type === 'song' && (
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                            <span>{item.song?.artist}</span>
                                            <span>•</span>
                                            <span>{item.song?.bpm} BPM</span>
                                        </div>
                                    )}
                                </div>
                                
                                <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                                </div>
                            )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        {items.length === 0 && (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
                                <Music size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-medium">El escenario está vacío</p>
                                <p className="text-sm opacity-60">Usa el buscador arriba para comenzar</p>
                            </div>
                        )}
                        </div>
                    )}
                    </Droppable>
                </DragDropContext>
            </div>
          </div>

          {/* COLUMNA DERECHA: TEAM (Fija, oculta en móvil) */}
          <div className="hidden lg:block w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
             {setlistId ? (
                <TeamManager setlistId={setlistId} />
             ) : (
                <div className="text-center py-10 opacity-50">
                    <p className="text-sm">Guarda para gestionar el equipo</p>
                </div>
             )}
          </div>
      </div>

      <NewSongModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSongCreated={addSong} />
    </div>
  );
}