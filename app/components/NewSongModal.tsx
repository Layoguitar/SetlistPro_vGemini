"use client";

import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { Song } from '@/types/database';

interface NewSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSongCreated: (song: Song) => void;
}

export default function NewSongModal({ isOpen, onClose, onSongCreated }: NewSongModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    bpm: '70',
    default_key: 'C',
    time_signature: '4/4',
    content: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Identificar al usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No estás autenticado");

      // 2. Buscar a qué Organización pertenece
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      // Si no tiene organización, detenemos todo con un error claro
      if (!profile?.organization_id) {
        throw new Error("Tu usuario no tiene una organización vinculada.");
      }

      // 3. Crear la canción CON el ID de la organización
      const { data, error } = await supabase
        .from('songs')
        .insert([
          {
            title: formData.title,
            artist: formData.artist,
            bpm: parseInt(formData.bpm) || 0,
            default_key: formData.default_key,
            time_signature: formData.time_signature,
            content: formData.content, // Guardamos la letra
            organization_id: profile.organization_id, // <--- ¡ESTO ES LO QUE FALTABA!
            duration_seconds: 300
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onSongCreated(data);
        onClose();
        // Limpiar formulario
        setFormData({ title: '', artist: '', bpm: '70', default_key: 'C', time_signature: '4/4', content: '' });
      }

    } catch (error: any) {
      console.error('Error detallado:', error);
      // Este alert mostrará el error real si algo falla
      alert('Error: ' + (error.message || "Error desconocido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white placeholder:text-gray-400 font-medium";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900 text-lg">Nueva Canción</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                <input 
                  required
                  type="text" 
                  placeholder="Ej. La Bondad de Dios"
                  className={inputClassName}
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
            </div>

            <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Artista</label>
                <input 
                  type="text" 
                  placeholder="Ej. Bethel Music"
                  className={inputClassName}
                  value={formData.artist}
                  onChange={e => setFormData({...formData, artist: e.target.value})}
                />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tono</label>
              <select 
                className={inputClassName}
                value={formData.default_key}
                onChange={e => setFormData({...formData, default_key: e.target.value})}
              >
                {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">BPM</label>
              <input 
                type="number" 
                className={inputClassName}
                value={formData.bpm}
                onChange={e => setFormData({...formData, bpm: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Letra y Acordes</label>
            <textarea 
                rows={5}
                className={`${inputClassName} font-mono text-sm`}
                placeholder="Pega aquí la letra..."
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Guardar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}