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
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    bpm: '70',
    default_key: 'C',
    time_signature: '4/4'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('songs')
        .insert([
          {
            title: formData.title,
            artist: formData.artist,
            bpm: parseInt(formData.bpm) || 0,
            default_key: formData.default_key,
            time_signature: formData.time_signature,
            duration_seconds: 300
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onSongCreated(data);
        onClose();
        setFormData({ title: '', artist: '', bpm: '70', default_key: 'C', time_signature: '4/4' });
      }

    } catch (error) {
      console.error('Error al crear canción:', error);
      alert('Hubo un error al guardar la canción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clases comunes para todos los inputs: Texto oscuro, fondo blanco, borde gris
  const inputClassName = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white placeholder:text-gray-400";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900">Nueva Canción</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Título */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Título</label>
            <input 
              required
              type="text" 
              placeholder="Ej. La Bondad de Dios"
              className={inputClassName} // Usamos la clase corregida aquí
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          {/* Artista */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Artista</label>
            <input 
              type="text" 
              placeholder="Ej. Bethel Music"
              className={inputClassName} // Y aquí
              value={formData.artist}
              onChange={e => setFormData({...formData, artist: e.target.value})}
            />
          </div>

          {/* Fila: Tono, BPM, Compás */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tono</label>
              <select 
                className={inputClassName} // Y aquí
                value={formData.default_key}
                onChange={e => setFormData({...formData, default_key: e.target.value})}
              >
                {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">BPM</label>
              <input 
                type="number" 
                className={inputClassName} // Y aquí
                value={formData.bpm}
                onChange={e => setFormData({...formData, bpm: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Compás</label>
              <select 
                className={inputClassName} // Y aquí también
                value={formData.time_signature}
                onChange={e => setFormData({...formData, time_signature: e.target.value})}
              >
                <option value="4/4">4/4</option>
                <option value="6/8">6/8</option>
                <option value="3/4">3/4</option>
                <option value="2/4">2/4</option>
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
              Guardar Canción
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}