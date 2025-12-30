"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Music, Edit3, Save, ArrowLeft, Loader2, Trash2, Eye, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Definición de tipos
export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  default_key: string;
  content: string;
  organization_id?: string;
  duration_seconds?: number;
}

interface SongLibraryProps {
  orgId: string;
  userRole: string | null; // <--- NUEVO: Necesitamos saber el rol
}

export default function SongLibrary({ orgId, userRole }: SongLibraryProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- SEGURIDAD: ¿QUIÉN MANDA AQUÍ? ---
  const isAdmin = userRole === 'admin' || userRole === 'owner';

  // CARGAR CANCIONES
  useEffect(() => {
    if (orgId) fetchSongs();
  }, [orgId]);

  const fetchSongs = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .eq('organization_id', orgId)
            .order('title', { ascending: true });
        
        if (error) throw error;
        setSongs(data || []);
    } catch (error) {
        console.error("Error cargando canciones:", error);
    } finally {
        setLoading(false);
    }
  };

  // BÚSQUEDA LOCAL
  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong || !isAdmin) return; // Doble seguridad
    setIsSaving(true);

    try {
      if (editingSong.id === 'new') {
        // CREAR
        const { data, error } = await supabase.from('songs').insert([{
            title: editingSong.title,
            artist: editingSong.artist,
            bpm: editingSong.bpm,
            default_key: editingSong.default_key,
            content: editingSong.content,
            organization_id: orgId,
            duration_seconds: 300
        }]).select().single();
        
        if (error) throw error;
        setSongs([data, ...songs]); 
      } else {
        // ACTUALIZAR
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
        setSongs(songs.map(s => s.id === editingSong.id ? editingSong : s));
      }

      setEditingSong(null);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("¿Seguro que quieres borrar esta canción?")) return;
    
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (!error) {
      setSongs(songs.filter(s => s.id !== id));
      if (editingSong?.id === id) setEditingSong(null);
    } else {
        alert("Error al borrar");
    }
  };

  const handleNewSong = () => {
    if (!isAdmin) return;
    setEditingSong({
      id: 'new',
      title: '',
      artist: '',
      bpm: 70,
      default_key: 'C',
      content: '',
      duration_seconds: 300
    });
  };

  // Estilo base para inputs (cambia si está deshabilitado)
  const inputBaseClass = `w-full px-4 py-3 border rounded-lg outline-none font-medium transition-colors ${isAdmin ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'}`;

  // --- VISTA DETALLE (EDITOR O LECTOR) ---
  if (editingSong) {
    return (
      <div className="max-w-4xl mx-auto pb-20 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setEditingSong(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} /> Volver a la lista
          </button>
          
          <div className="flex items-center gap-2">
            {!isAdmin && <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full flex items-center gap-1"><Lock size={12}/> Modo Lectura</span>}
            <h2 className="text-xl font-bold text-gray-900">
                {editingSong.id === 'new' ? 'Nueva Canción' : isAdmin ? 'Editar Canción' : 'Detalles de la Canción'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6 relative">
          
          {/* Inputs protegidos con disabled={!isAdmin} */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Título</label>
              <input 
                required 
                disabled={!isAdmin} 
                className={inputBaseClass} 
                value={editingSong.title} 
                onChange={e => setEditingSong({...editingSong, title: e.target.value})} 
                placeholder="Ej. Alza tus ojos" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Artista</label>
              <input 
                disabled={!isAdmin}
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
                disabled={!isAdmin}
                className={inputBaseClass} 
                value={editingSong.default_key || 'C'} 
                onChange={e => setEditingSong({...editingSong, default_key: e.target.value})}
              >
                 {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(k => (<option key={k} value={k}>{k}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">BPM</label>
              <input 
                type="number" 
                disabled={!isAdmin}
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
               disabled={!isAdmin}
               placeholder="Pega aquí la letra..."
               className={`${inputBaseClass} font-mono text-sm leading-relaxed whitespace-pre min-h-[400px]`}
               value={editingSong.content || ''}
               onChange={e => setEditingSong({...editingSong, content: e.target.value})}
             />
          </div>

          {/* BARRA DE ACCIONES: SOLO VISIBLE PARA ADMIN */}
          {isAdmin && (
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                {editingSong.id !== 'new' && (
                    <button type="button" onClick={() => handleDelete(editingSong.id)} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors mr-auto flex items-center gap-2">
                    <Trash2 size={18}/> Eliminar
                    </button>
                )}
                <button type="button" onClick={() => setEditingSong(null)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar Cambios
                </button>
            </div>
          )}
        </form>
      </div>
    );
  }

  // --- VISTA LISTA ---
  return (
    <div className="max-w-5xl mx-auto space-y-6 h-full flex flex-col p-6">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Canciones</h1>
            {!isAdmin && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Lock size={10}/> Modo Lectura: Solo el líder puede editar.</p>}
          </div>
          
          {/* Botón crear oculto para miembros */}
          {isAdmin && (
            <button onClick={handleNewSong} className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
                <Plus size={20} /> Nueva Canción
            </button>
          )}
       </div>

       <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por título o artista..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400 shadow-sm transition-all"
          />
       </div>

       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
          {loading ? (
             <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-gray-400" size={32}/></div>
          ) : filteredSongs.length === 0 ? (
             <div className="flex-1 flex flex-col justify-center items-center text-gray-400 p-10">
                <Music size={48} className="mb-4 opacity-20"/>
                <p>No se encontraron canciones.</p>
             </div>
          ) : (
             <div className="overflow-y-auto flex-1">
                 <div className="divide-y divide-gray-100">
                    {filteredSongs.map(song => (
                    <div key={song.id} onClick={() => setEditingSong(song)} className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><Music size={20} /></div>
                            <div>
                                <div className="font-bold text-gray-900">{song.title}</div>
                                <div className="text-xs text-gray-500">{song.artist}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">{song.default_key}</span>
                                <span className="text-[10px] text-gray-400 mt-1">{song.bpm} bpm</span>
                            </div>
                            {/* Icono cambia según rol: Lápiz (Admin) o Ojo (Miembro) */}
                            {isAdmin ? (
                                <Edit3 size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                            ) : (
                                <Eye size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                            )}
                        </div>
                    </div>
                    ))}
                 </div>
             </div>
          )}
       </div>
    </div>
  );
}