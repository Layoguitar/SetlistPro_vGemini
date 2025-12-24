"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Clock, Music, FileText, Wifi, Loader2 } from 'lucide-react';
import type { SetlistItem } from '@/types/database';

interface LiveSetlistProps {
  setlistId: string;
  onBack: () => void;
}

export default function LiveSetlist({ setlistId, onBack }: LiveSetlistProps) {
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [setlistName, setSetlistName] = useState("");
  const [selectedItem, setSelectedItem] = useState<SetlistItem | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchData = async () => {
    const { data: setlist } = await supabase.from('setlists').select('name').eq('id', setlistId).single();
    if (setlist) setSetlistName(setlist.name);

    const { data } = await supabase
      .from('setlist_items')
      .select(`*, song:songs(*)`)
      .eq('setlist_id', setlistId)
      .order('position', { ascending: true });

    if (data) {
      setItems(data);
      if (!selectedItem && data.length > 0) {
        setSelectedItem(data[0]);
      }
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('live-setlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'setlist_items',
          filter: `setlist_id=eq.${setlistId}`,
        },
        (payload) => {
          console.log('Cambio detectado', payload);
          fetchData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setlistId]);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 overflow-hidden rounded-xl border border-gray-200 shadow-xl">
      
      {/* COLUMNA IZQUIERDA: LISTA */}
      <div className="w-1/3 min-w-[300px] bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft size={16} /> Volver
            </button>
            {isConnected && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full animate-pulse">
                    <Wifi size={10} /> EN VIVO
                </span>
            )}
        </div>
        <div className="p-4 border-b border-gray-100">
             <h2 className="font-bold text-gray-900 leading-tight">{setlistName || 'Cargando...'}</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
            {items.map((item, index) => (
                <div 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 flex gap-3 ${
                        selectedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                    }`}
                >
                    <div className="font-bold text-gray-300 text-lg w-6">{index + 1}</div>
                    <div className="flex-1">
                        <div className={`font-bold ${selectedItem?.id === item.id ? 'text-blue-900' : 'text-gray-900'}`}>
                            {item.title_override || item.song?.title}
                        </div>
                        {item.type === 'song' ? (
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <span className="font-medium bg-gray-100 px-1.5 rounded text-gray-600">{item.key_override || item.song?.default_key}</span>
                                <span>{item.song?.bpm} bpm</span>
                            </div>
                        ) : (
                            <div className="text-xs text-gray-400 mt-1 italic">Bloque / Nota</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* COLUMNA DERECHA: VISOR */}
      <div className="flex-1 bg-white overflow-y-auto p-8 md:p-12 relative">
         {selectedItem ? (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
                
                {/* Cabecera Item */}
                <div className="mb-8 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold tracking-widest text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                            {selectedItem.type === 'song' ? 'Canción' : 'Bloque'}
                        </span>
                        {selectedItem.type === 'song' && (
                            <span className="text-xs font-bold tracking-widest text-gray-500 uppercase flex items-center gap-1">
                                <Clock size={12}/> {Math.floor((selectedItem.duration_override || 0)/60)} min
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
                        {selectedItem.title_override || selectedItem.song?.title}
                    </h1>
                    {selectedItem.type === 'song' && (
                        <div className="flex items-center gap-4 text-gray-500 text-lg">
                            <span>{selectedItem.song?.artist}</span>
                            <span className="text-gray-300">|</span>
                            <span className="font-bold text-gray-900 bg-gray-100 px-3 rounded-md">
                                Tono: {selectedItem.key_override || selectedItem.song?.default_key}
                            </span>
                        </div>
                    )}
                </div>

                {/* CONTENIDO PRINCIPAL (LETRA) */}
                <div className="prose prose-lg max-w-none">
                    {selectedItem.type === 'song' ? (
                        selectedItem.song?.content ? (
                            // AQUÍ ESTÁ EL CAMBIO: font-mono
                            <pre className="font-mono whitespace-pre-wrap text-lg md:text-xl leading-relaxed text-gray-900 bg-white p-0 border-none shadow-none font-medium">
                                {selectedItem.song.content}
                            </pre>
                        ) : (
                            <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <FileText className="mx-auto mb-2 opacity-20" size={48} />
                                <p>No hay letra/acordes registrados.</p>
                            </div>
                        )
                    ) : (
                        <div className="flex items-center justify-center py-20 bg-gray-50 rounded-xl text-gray-500">
                           <span className="text-2xl font-light italic">
                             {selectedItem.title_override}
                           </span>
                        </div>
                    )}
                </div>
            </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <Music size={64} className="mb-4 opacity-20" />
                <p>Selecciona un ítem de la lista</p>
            </div>
         )}
      </div>
    </div>
  );
}