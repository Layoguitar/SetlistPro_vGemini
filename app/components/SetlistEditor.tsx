"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  ArrowLeft, Save, Search, Calendar, Plus, Trash2, GripVertical, 
  Music, Loader2, X, ChevronDown, PlayCircle, FileText, AlertCircle, Check, Lock, Type 
} from 'lucide-react';
import TeamManager from './TeamManager';
import LiveSetlist from './LiveSetlist';

interface SetlistEditorProps {
  setlistId: string | null;
  onBack: () => void;
  userRole: string | null;
  currentUserId: string;
}

interface SetlistItem {
  uniqueId: string;
  type: 'song' | 'block';
  songId: string | null;
  title: string;
  artist: string;
  bpm?: number | string;
  key?: string;
  content?: string;
  note?: string;
}

// Bloques predefinidos (los que ya tenías)
const QUICK_BLOCKS = ["Bienvenida", "Oración", "Predica", "Cena", "Ministración", "Anuncios", "Ofrenda"];

export default function SetlistEditor({ setlistId, onBack, userRole, currentUserId }: SetlistEditorProps) {
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [eventName, setEventName] = useState('Nuevo Servicio');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  
  // ESTADOS DE UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(false);

  const [availableSongs, setAvailableSongs] = useState<any[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<any[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // --- SEGURIDAD: ¿QUIÉN ES EL JEFE? ---
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  useEffect(() => {
    const timer = setTimeout(() => setDndEnabled(true), 100);
    if (setlistId) loadSetlist();
    loadSongsLibrary();

    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); clearTimeout(timer); };
  }, [setlistId]);

  useEffect(() => {
    if (searchTerm.trim() === '') { setFilteredSongs(availableSongs); } 
    else {
        const lower = searchTerm.toLowerCase();
        setFilteredSongs(availableSongs.filter(s => s.title.toLowerCase().includes(lower) || s.artist.toLowerCase().includes(lower)));
    }
  }, [searchTerm, availableSongs]);

  const loadSetlist = async () => {
    setLoading(true);
    try {
      const { data: setlist } = await supabase.from('setlists').select('*').eq('id', setlistId).single();
      if (setlist) { setEventName(setlist.name); setEventDate(setlist.date.split('T')[0]); }

      const { data: setlistItems } = await supabase
        .from('setlist_items')
        .select(`
            id, position, song_id, title_override, type, note, key_override,
            song:songs ( id, title, artist, default_key, bpm, content )
        `)
        .eq('setlist_id', setlistId)
        .order('position');

      if (setlistItems) {
        const formattedItems: SetlistItem[] = setlistItems.map((item: any) => {
            if (item.song) {
                return { 
                    type: 'song', 
                    uniqueId: item.id || Math.random().toString(), 
                    songId: item.song.id,
                    title: item.song.title,
                    artist: item.song.artist,
                    bpm: item.song.bpm,
                    key: item.key_override || item.song.default_key,
                    content: item.song.content,
                    note: item.note || ''
                };
            } else {
                return { 
                    type: 'block', 
                    uniqueId: item.id || Math.random().toString(),
                    songId: null,
                    title: item.title_override || 'Bloque', 
                    artist: 'Elemento',
                    note: item.note || ''
                };
            }
        });
        setItems(formattedItems);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const loadSongsLibrary = async () => {
    const { data } = await supabase.from('songs').select('*').order('title');
    if (data) { setAvailableSongs(data); setFilteredSongs(data); }
  };

  const handleSave = async () => {
    if (!isAdmin) return; // Doble seguridad
    if (!eventName.trim()) return alert("⚠️ Ponle nombre al servicio.");
    setSaving(true);
    setSaveSuccess(false);
    
    try {
        let currentSetlistId = setlistId;
        const { data: { user } } = await supabase.auth.getUser();

        if (!currentSetlistId) {
             const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user?.id).single();
             const { data: newSetlist, error } = await supabase.from('setlists').insert({
                 name: eventName, date: eventDate, organization_id: member?.organization_id
             }).select().single();
             
             if (error) throw error;
             currentSetlistId = newSetlist.id;
        } else {
             await supabase.from('setlists').update({ name: eventName, date: eventDate }).eq('id', currentSetlistId);
        }

        if (currentSetlistId) {
            await supabase.from('setlist_items').delete().eq('setlist_id', currentSetlistId);
            
            const itemsToInsert = items.map((item, index) => {
                const safeType = item.type || (item.songId ? 'song' : 'block');
                return {
                    setlist_id: currentSetlistId,
                    position: index,
                    type: safeType,
                    song_id: safeType === 'song' ? item.songId : null,
                    title_override: safeType === 'block' ? item.title : null,
                    key_override: safeType === 'song' ? item.key : null,
                    note: item.note || null
                };
            });

            if (itemsToInsert.length > 0) {
                const { error } = await supabase.from('setlist_items').insert(itemsToInsert);
                if (error) throw error;
            }
        }
        
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);

        if (!setlistId) {
             window.location.reload(); 
        }

    } catch (error: any) {
        alert("Error: " + error.message);
    } finally {
        setSaving(false);
    }
  };

  const addSong = (song: any) => {
    if (!isAdmin) return;
    setItems([...items, { 
        type: 'song', uniqueId: Math.random().toString(), songId: song.id, 
        title: song.title, artist: song.artist, bpm: song.bpm, key: song.default_key, content: song.content,
        note: '' 
    }]); 
    setSearchTerm(''); setShowResults(false);
  };

  const addBlock = (name: string) => {
    if (!isAdmin) return;
    setItems([...items, { 
        type: 'block', uniqueId: Math.random().toString(), songId: null, 
        title: name, artist: 'Bloque', note: '' 
    }]);
  };

  // NUEVA FUNCIÓN: Agregar bloque personalizado
  const addCustomBlock = () => {
    if (!isAdmin) return;
    const name = prompt("Escribe el nombre del bloque (ej: Dinámica, Video, Invitado):");
    if (name && name.trim()) {
        addBlock(name.trim());
    }
  };

  const removeSong = (index: number) => {
    if (!isAdmin) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItemNote = (index: number, val: string) => {
      if (!isAdmin) return; 
      const newItems = [...items];
      newItems[index].note = val;
      setItems(newItems);
  };

  // NUEVA FUNCIÓN: Editar el título del bloque
  const updateBlockTitle = (index: number, val: string) => {
      if (!isAdmin) return;
      const newItems = [...items];
      newItems[index].title = val;
      setItems(newItems);
  };

  const onDragEnd = (result: any) => {
    if (!isAdmin || !result.destination) return;
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setItems(newItems);
  };

  if (isLiveMode) return <LiveSetlist setlistId={setlistId || 'temp'} onBack={() => setIsLiveMode(false)} initialItems={items} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex flex-col font-sans">
      
      {/* HEADER DE NAVEGACIÓN */}
      <div className="bg-white dark:bg-[#111] border-b border-gray-200 dark:border-zinc-800 px-4 md:px-8 py-4 sticky top-0 z-30 flex items-center justify-between bg-white/80 dark:bg-[#111]/80 backdrop-blur-md">
         <div className="flex items-center gap-4 flex-1">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-500"><ArrowLeft size={22}/></button>
            <div className="flex flex-col w-full max-w-md">
                <input 
                    value={eventName} 
                    onChange={(e) => setEventName(e.target.value)} 
                    disabled={!isAdmin}
                    className="text-xl font-bold text-gray-900 dark:text-white bg-transparent outline-none placeholder:text-gray-400 w-full truncate disabled:opacity-80 disabled:cursor-default" 
                    placeholder="Nombre del Servicio..."
                />
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-0.5">
                    <div className="flex items-center gap-1">
                        <Calendar size={12}/>
                        <input 
                            type="date" 
                            value={eventDate} 
                            onChange={(e) => setEventDate(e.target.value)} 
                            disabled={!isAdmin}
                            className="bg-transparent outline-none cursor-pointer font-medium disabled:cursor-default"
                        />
                    </div>
                    {!isAdmin && <span className="flex items-center gap-1 text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full"><Lock size={10}/> Modo Lectura</span>}
                </div>
            </div>
         </div>
         <div className="flex items-center gap-2">
             <button onClick={() => setIsLiveMode(true)} disabled={items.length === 0} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all active:scale-95 disabled:opacity-50"><PlayCircle size={20} /><span className="hidden sm:inline">Presentar</span></button>
             
             {isAdmin && (
                 <button 
                    id="saveBtn" 
                    onClick={handleSave} 
                    disabled={saving} 
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg ${saveSuccess ? 'bg-green-500 text-white' : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80'}`}
                 >
                    {saving ? <Loader2 className="animate-spin" size={18}/> : saveSuccess ? <Check size={18} /> : <Save size={18}/>}
                    <span>{saving ? 'Guardando...' : saveSuccess ? '¡Guardado!' : 'Guardar'}</span>
                 </button>
             )}
         </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-6">
             
             {/* BUSCADOR Y BLOQUES: SOLO ADMIN */}
             {isAdmin && (
                 <>
                    <div ref={searchContainerRef} className="bg-white dark:bg-[#111] p-1 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 relative z-20">
                        <div className="relative flex items-center">
                            <Search className="absolute left-4 text-gray-400 pointer-events-none" size={20} />
                            <input type="text" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }} onFocus={() => setShowResults(true)} placeholder="Buscar canción..." className="w-full pl-12 pr-10 py-3 bg-transparent outline-none text-base dark:text-white" autoComplete="off"/>
                            <button onClick={() => setShowResults(!showResults)} className="absolute right-3 text-gray-400 hover:text-indigo-500 p-1">{showResults ? <X size={18}/> : <ChevronDown size={18}/>}</button>
                        </div>
                        {showResults && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto z-50">
                                {filteredSongs.length === 0 ? <div className="p-6 text-center text-gray-400"><p className="text-sm">No encontramos "{searchTerm}"</p></div> : filteredSongs.map(song => (
                                        <button key={song.id} onClick={() => addSong(song)} className="w-full text-left p-3.5 hover:bg-gray-50 dark:hover:bg-zinc-800 flex justify-between items-center border-b border-gray-50 dark:border-zinc-800/50 last:border-0 group">
                                            <div><div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{song.title}</div><div className="text-xs text-gray-400">{song.artist} • {song.default_key || '?'}</div></div>
                                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-zinc-900 flex items-center justify-center text-gray-300 group-hover:bg-indigo-500 group-hover:text-white"><Plus size={16}/></div>
                                        </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {QUICK_BLOCKS.map(block => (
                            <button key={block} onClick={() => addBlock(block)} className="px-3 py-1.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center gap-1 active:scale-95 shadow-sm"><Plus size={10}/> {block}</button>
                        ))}
                        {/* BOTÓN PARA AGREGAR TEXTO PERSONALIZADO */}
                        <button onClick={addCustomBlock} className="px-3 py-1.5 bg-white dark:bg-[#111] border border-dashed border-indigo-300 dark:border-indigo-800 rounded-lg text-xs font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-1 active:scale-95 shadow-sm">
                            <Type size={10}/> + Texto / Otro
                        </button>
                    </div>
                 </>
             )}

             {/* LISTA DE CANCIONES */}
             <div className="space-y-3 min-h-[300px]">
                 {items.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#111] rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800 text-center">
                        <Music size={32} className="mb-4 text-gray-300"/>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Setlist vacío</h3>
                        {isAdmin && <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">Usa el buscador para agregar canciones.</p>}
                     </div>
                 ) : (
                    dndEnabled ? (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="setlist" isDropDisabled={!isAdmin}>
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                        {items.map((item, index) => (
                                            <Draggable key={item.uniqueId} draggableId={String(item.uniqueId)} index={index} isDragDisabled={!isAdmin}>
                                                {(provided, snapshot) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps} className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${snapshot.isDragging ? 'bg-white dark:bg-[#1a1a1a] shadow-2xl scale-105 border-indigo-500 z-50' : 'bg-white dark:bg-[#111] border-gray-200 dark:border-zinc-800'} ${isAdmin ? 'hover:border-indigo-300 dark:hover:border-zinc-700' : ''} ${item.type === 'block' ? 'bg-gray-50/50 dark:bg-zinc-900/30' : ''}`}>
                                                        
                                                        {isAdmin ? (
                                                            <div {...provided.dragHandleProps} className="text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1"><GripVertical size={20}/></div>
                                                        ) : (
                                                            <div className="text-gray-300 p-1 w-7 text-center text-xs font-bold">{index + 1}</div>
                                                        )}

                                                        <div className="flex-1 min-w-0">
                                                            {item.type === 'block' ? (
                                                                <div className="flex items-center gap-3">
                                                                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[10px] font-black uppercase tracking-wider rounded">Bloque</span>
                                                                    {/* AQUÍ ESTÁ EL CAMBIO: INPUT SI ES ADMIN */}
                                                                    {isAdmin ? (
                                                                        <input 
                                                                            value={item.title}
                                                                            onChange={(e) => updateBlockTitle(index, e.target.value)}
                                                                            className="font-bold text-gray-700 dark:text-gray-300 bg-transparent outline-none border-b border-transparent focus:border-indigo-500 transition-all w-full"
                                                                        />
                                                                    ) : (
                                                                        <span className="font-bold text-gray-700 dark:text-gray-300 truncate">{item.title}</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-between items-center gap-4">
                                                                    <div className="truncate"><span className="font-bold text-gray-900 dark:text-white text-lg block truncate">{item.title}</span><span className="text-xs text-gray-500 font-medium truncate">{item.artist}</span></div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {item.bpm && <span className="hidden sm:inline-block text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded text-gray-500">{item.bpm} BPM</span>}
                                                                        <span className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-lg text-sm font-black text-gray-700 dark:text-white border border-gray-200 dark:border-zinc-700 shadow-sm">{item.key || '?'}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <FileText size={12} className="text-gray-400"/>
                                                                <input 
                                                                    value={item.note || ''} 
                                                                    onChange={(e) => updateItemNote(index, e.target.value)} 
                                                                    disabled={!isAdmin}
                                                                    placeholder={isAdmin ? "Nota opcional..." : "Sin notas"} 
                                                                    className="bg-transparent text-xs text-gray-500 dark:text-gray-400 placeholder:text-gray-300 w-full outline-none disabled:cursor-default"
                                                                />
                                                            </div>
                                                        </div>

                                                        {isAdmin && (
                                                            <button onClick={() => removeSong(index)} className="text-gray-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={18}/></button>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    ) : <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-gray-400"/></div>
                 )}
             </div>
          </div>

          <div className="lg:col-span-4 relative">
             <div className="lg:sticky lg:top-24 space-y-4">
                 {setlistId ? (
                     <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-120px)]">
                         <TeamManager setlistId={setlistId} userRole={userRole} currentUserId={currentUserId}/>
                     </div>
                 ) : (
                     <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 p-6 rounded-3xl text-center"><AlertCircle className="mx-auto mb-2 text-indigo-400" size={32}/><p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium">Guarda el evento primero.</p></div>
                 )}
             </div>
          </div>
      </div>
    </div>
  );
}