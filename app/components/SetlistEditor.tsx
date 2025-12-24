"use client";

import React, { useState, useEffect } from 'react';
import { GripVertical, Plus, Search, Loader2, Save, Music, ArrowLeft, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { SetlistItem, Song } from '@/types/database';
import NewSongModal from './NewSongModal';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// --- IMPORTAMOS EL GESTOR DE EQUIPO ---
import TeamManager from './TeamManager';

interface SetlistEditorProps {
  setlistId?: string | null;
  onBack: () => void;
}

export default function SetlistEditor({ setlistId, onBack }: SetlistEditorProps) {
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [eventName, setEventName] = useState("Nuevo Evento");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [defaultSongs, setDefaultSongs] = useState<Song[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. CARGA DE DATOS
  useEffect(() => {
    const loadSetlistData = async () => {
      if (!setlistId) {
        fetchDefaultSongs();
        return;
      }

      setIsLoading(true);
      
      // A) Cargar información del evento
      const { data: setlist } = await supabase
        .from('setlists')
        .select('*')
        .eq('id', setlistId)
        .single();
      
      if (setlist) setEventName(setlist.name);

      // B) Cargar los ítems
      const { data: itemsData } = await supabase
        .from('setlist_items')
        .select(`*, song:songs(*)`)
        .eq('setlist_id', setlistId)
        .order('position', { ascending: true });

      if (itemsData) setItems(itemsData);
      
      fetchDefaultSongs();
      setIsLoading(false);
    };

    loadSetlistData();
  }, [setlistId]);

  const fetchDefaultSongs = async () => {
    const { data } = await supabase.from('songs').select('*').limit(50);
    if (data) setDefaultSongs(data);
  };

  // --- BÚSQUEDA ---
  useEffect(() => {
    const searchSongs = async () => {
      if (searchTerm.trim() === "") {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      const { data } = await supabase.from('songs').select('*').ilike('title', `%${searchTerm}%`).limit(10);
      if (data) setSearchResults(data);
      setIsSearching(false);
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

  // --- GUARDADO ---
  const handleSave = async () => {
    if (items.length === 0) return alert("La lista está vacía.");
    setIsSaving(true);

    try {
      let currentSetlistId = setlistId;

      // 1. Crear o Actualizar Setlist
      if (!currentSetlistId) {
        const { data } = await supabase.from('setlists').insert([{ 
          name: eventName, scheduled_date: new Date().toISOString() 
        }]).select().single();
        if (data) currentSetlistId = data.id;
      } else {
        await supabase.from('setlists').update({ name: eventName }).eq('id', currentSetlistId);
      }

      if (!currentSetlistId) throw new Error("Error ID");

      // 2. Actualizar ítems (Borrar y reinsertar)
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

      await supabase.from('setlist_items').insert(itemsToSave);

      alert("¡Setlist guardado correctamente!");
      onBack();

    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalDuration = items.reduce((acc, item) => acc + (item.duration_override || 0), 0);
  const songsToDisplay = searchTerm.trim() === "" ? defaultSongs : searchResults;

  if (isLoading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="text-gray-500 font-medium">Volver al Dashboard</h2>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 w-full">
          <input 
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="text-2xl font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent transition-colors w-full"
            placeholder="Nombre del evento..."
          />
          <p className="text-gray-500 text-sm mt-1">Total: {Math.floor(totalDuration / 60)} min</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {/* BLOQUES RÁPIDOS */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['Bienvenida', 'Anuncios', 'Predica', 'Cena', 'Ministración'].map(label => (
          <button key={label} onClick={() => addBlock(label)} 
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 whitespace-nowrap shadow-sm">
            {label}
          </button>
        ))}
      </div>

      {/* BUSCADOR */}
      <div className="relative z-20">
        <div className="relative flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 shadow-sm"
                  placeholder="Buscar canción..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm">
              <Plus size={20} /> <span className="hidden sm:inline">Nueva</span>
            </button>
        </div>
        {showDropdown && songsToDisplay.length > 0 && (
            <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute top-full left-0 w-full bg-white border rounded-lg shadow-xl mt-2 overflow-hidden z-20 max-h-60 overflow-y-auto">
                    {songsToDisplay.map(song => (
                        <button key={song.id} onClick={() => addSong(song)} className="w-full text-left px-4 py-3 hover:bg-blue-50 flex justify-between border-b border-gray-50">
                            <div><span className="font-bold text-gray-900">{song.title}</span><br/><span className="text-xs text-gray-500">{song.artist}</span></div>
                            <div className="text-right"><span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded">{song.default_key}</span></div>
                        </button>
                    ))}
                </div>
            </>
        )}
      </div>

      {/* LISTA DRAG & DROP */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="setlist">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} className={`flex items-center gap-4 bg-white p-3 rounded-lg border shadow-sm ${snapshot.isDragging ? 'ring-2 ring-blue-500' : ''}`}>
                      <div {...provided.dragHandleProps} className="text-gray-300 cursor-grab px-1"><GripVertical size={20} /></div>
                      <span className="font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{item.title_override || item.song?.title}</p>
                        {item.type === 'song' && <p className="text-xs text-gray-500">{item.key_override} • {item.song?.bpm} bpm</p>}
                      </div>
                      <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* --- AQUÍ ESTÁ LA INTEGRACIÓN DEL TEAM MANAGER --- */}
      <div className="mt-8 border-t border-gray-100 pt-8">
         {/* Solo mostramos el gestor si el setlist ya está guardado (tiene ID) */}
         {setlistId ? (
            <TeamManager setlistId={setlistId} />
         ) : (
            <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center">
              <p className="text-gray-500 font-medium">Gestión de Equipo</p>
              <p className="text-gray-400 text-sm mt-1">Guarda el setlist primero para poder asignar músicos.</p>
            </div>
         )}
      </div>

      <NewSongModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSongCreated={addSong} />
    </div>
  );
}