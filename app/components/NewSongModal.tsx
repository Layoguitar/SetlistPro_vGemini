"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Music, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Song } from '@/types/database'; // Asegúrate de tener este tipo o usa 'any'

interface NewSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongCreated: (song: Song) => void;
}

export default function NewSongModal({ isOpen, onClose, onSongCreated }: NewSongModalProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [bpm, setBpm] = useState('');
  const [defaultKey, setDefaultKey] = useState('C');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Limpiar campos al abrir
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setArtist('');
      setBpm('');
      setDefaultKey('C');
      setError('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Verificar usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No estás autenticado");

      // 2. BUSCAR MI ORGANIZACIÓN (MÉTODO CORREGIDO ✅)
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (memberError || !member?.organization_id) {
        throw new Error("No se encontró tu banda. Intenta recargar la página.");
      }

      // 3. Insertar Canción
      const { data, error: insertError } = await supabase
        .from('songs')
        .insert([
          {
            title,
            artist,
            bpm: bpm ? parseInt(bpm) : null,
            default_key: defaultKey,
            content: '', 
            organization_id: member.organization_id, // Usamos el ID correcto
            duration_seconds: 300 // Valor por defecto para evitar error
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      onSongCreated(data);
      onClose();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al guardar la canción');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-950">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Music className="text-blue-500" size={20} />
            Nueva Canción
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Título</label>
            <input 
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="Ej: La Bondad de Dios"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Artista</label>
              <input 
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Ej: Bethel"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
             <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tono</label>
              <select 
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                value={defaultKey}
                onChange={(e) => setDefaultKey(e.target.value)}
              >
                 {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>
           <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">BPM</label>
              <input 
                type="number"
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Ej: 74"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
              />
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-white/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-6 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
            Guardar Canción
          </button>
        </div>
      </div>
    </div>
  );
}