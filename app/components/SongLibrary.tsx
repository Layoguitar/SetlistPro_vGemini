"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Music, Edit3, Trash2, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Song } from '@/types/database';

interface SongLibraryProps {
  onBack: () => void;
}

export default function SongLibrary({ onBack }: SongLibraryProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar canciones al inicio
  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    
    // Filtramos por la organización del usuario
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
        
        if (profile?.organization_id) {
            let query = supabase
                .from('songs')
                .select('*')
                .eq('organization_id', profile.organization_id) // <--- FILTRO IMPORTANTE
                .order('title', { ascending: true });
            
            if (searchTerm) {
                query = query.ilike('title', `%${searchTerm}%`);
            }

            const { data } = await query;
            if (data) setSongs(data);
        }
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(fetchSongs, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;
    setIsSaving(true);

    try {
      // 1. Obtener Org ID para asegurar dónde guardamos
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (!profile?.organization_id) throw new Error("No tienes organización.");

      // 2. Guardar (Insertar o Actualizar)
      if (editingSong.id === 'new') {
        // CREAR NUEVA
        const { id, ...songData } = editingSong;
        const { error } = await supabase.from('songs').insert([{
            title: songData.title,
            artist: songData.artist,
            bpm: songData.bpm,
            default_key: songData.default_key,
            content: songData.content,
            organization_id: profile.organization_id, // <--- ESTO FALTABA
            duration_seconds: 300
        }]);
        if (error) throw error;
      } else {
        // ACTUALIZAR EXISTENTE
        const { error } = await supabase
          .from('songs')
          .update({
            title: editingSong.title,
            artist: editingSong.artist,
            bpm: editingSong.bpm,
            default_key: editingSong.default_key,
            content: editingSong.content
          })
          .eq('id', editingSong.id);
        if (error) throw error;
      }

      alert("¡Canción guardada correctamente!");
      setEditingSong(null);
      fetchSongs();

    } catch (error: any) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres borrar esta canción?")) return;
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (!error) {
      fetchSongs();
      if (editingSong?.id === id) setEditingSong(null);
    }
  };

  const handleNewSong = () => {
    setEditingSong({
      id: 'new',
      user_id: '',
      title: '',
      artist: '',
      bpm: 70,
      time_signature: '4/4',
      default_key: 'C',
      duration_seconds: 300,
      content: '',
      created_at: ''
    });
  };

  const inputBaseClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white placeholder:text-gray-400 font-medium";

  // --- VISTA EDITOR ---
  if (editingSong) {
    return (
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setEditingSong(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} /> Volver a la lista
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {editingSong.id === 'new' ? 'Nueva Canción' : 'Editar Canción'}
          </h2>
        </div>

        <form onSubmit={handleSave} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Título</label>
              <input 
                required
                className={inputBaseClass}
                value={editingSong.title}
                onChange={e => setEditingSong({...editingSong, title: e.target.value})}
                placeholder="Ej. Alza tus ojos"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Artista</label>
              <input 
                className={inputBaseClass}
                value={editingSong.artist || ''}
                onChange={e => setEditingSong({...editingSong, artist: e.target.value})}
                placeholder="Ej. Marco Barrientos"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Tono Original</label>
              <select 
                className={inputBaseClass}
                value={editingSong.default_key || 'C'}
                onChange={e => setEditingSong({...editingSong, default_key: e.target.value})}
              >
                 {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">BPM</label>
              <input 
                type="number"
                className={inputBaseClass}
                value={editingSong.bpm}
                onChange={e => setEditingSong({...editingSong, bpm: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div>
             <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase">Letra y Acordes</label>
                <span className="text-[10px] text-gray-400">Fuente monoespaciada activa</span>
             </div>
             <textarea 
               rows={15}
               placeholder="Pega aquí la letra..."
               className={`${inputBaseClass} font-mono text-sm leading-relaxed whitespace-pre`}
               value={editingSong.content || ''}
               onChange={e => setEditingSong({...editingSong, content: e.target.value})}
             />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
             {editingSong.id !== 'new' && (
                <button 
                  type="button"
                  onClick={() => handleDelete(editingSong.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors mr-auto"
                >
                  Eliminar Canción
                </button>
             )}

             <button 
               type="button"
               onClick={() => setEditingSong(null)}
               className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
             >
               Cancelar
             </button>
             <button 
               type="submit"
               disabled={isSaving}
               className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
             >
               {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
               Guardar Cambios
             </button>
          </div>
        </form>
      </div>
    );
  }

  // --- VISTA LISTA ---
  return (
    <div className="max-w-5xl mx-auto space-y-6">
       
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Canciones</h1>
          <button 
            onClick={handleNewSong}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm"
          >
            <Plus size={20} /> Nueva Canción
          </button>
       </div>

       {/* Buscador */}
       <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400 shadow-sm transition-all"
          />
       </div>

       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
             <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-gray-400"/></div>
          ) : songs.length === 0 ? (
             <div className="p-10 text-center text-gray-400">No se encontraron canciones en tu organización.</div>
          ) : (
             <div className="divide-y divide-gray-100">
                {songs.map(song => (
                   <div 
                     key={song.id} 
                     onClick={() => setEditingSong(song)}
                     className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between group transition-colors"
                   >
                      <div className="flex items-center gap-4">
                         <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                            <Music size={20} />
                         </div>
                         <div>
                            <div className="font-bold text-gray-900">{song.title}</div>
                            <div className="text-xs text-gray-500">{song.artist}</div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                         <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">{song.default_key}</span>
                            <span className="text-[10px] text-gray-400 mt-1">{song.bpm} bpm</span>
                         </div>
                         <Edit3 size={18} className="text-gray-300 group-hover:text-blue-500" />
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
}