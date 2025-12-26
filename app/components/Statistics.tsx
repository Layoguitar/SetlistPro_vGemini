"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BarChart3, Music, Calendar, Users, TrendingUp, History } from 'lucide-react';

export default function Statistics({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(true);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalSongsPlayed: 0,
    activeMusicians: 0,
    totalMusicians: 0
  });

  useEffect(() => {
    loadStats();
  }, [orgId]);

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Historial
      const { data: pastEvents } = await supabase
        .from('setlists')
        .select('*')
        .eq('organization_id', orgId)
        .lt('scheduled_date', today)
        .order('scheduled_date', { ascending: false });

      setHistory(pastEvents || []);

      // 2. Canciones
      const { data: allItems } = await supabase
        .from('setlist_items')
        .select('song_id, song:songs(title)')
        .eq('type', 'song');

      // 3. Miembros
      const { count: membersCount } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      // --- CÁLCULOS ---
      const songCounts: Record<string, { count: number, title: string }> = {};
      allItems?.forEach((item: any) => {
        if (!item.song_id || !item.song) return;
        const id = item.song_id;
        if (!songCounts[id]) songCounts[id] = { count: 0, title: item.song.title };
        songCounts[id].count++;
      });

      const sortedSongs = Object.values(songCounts).sort((a, b) => b.count - a.count).slice(0, 5);
      setTopSongs(sortedSongs);
      
      setStats({
        totalEvents: pastEvents?.length || 0,
        totalSongsPlayed: allItems?.length || 0,
        totalMusicians: membersCount || 0,
        activeMusicians: membersCount || 0
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando métricas...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><BarChart3 size={24} /></div>
        <div><h2 className="text-2xl font-bold text-gray-900">Estadísticas</h2><p className="text-gray-500">Rendimiento de la banda</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2"><Calendar className="text-blue-500" size={20} /><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Eventos Pasados</span></div>
            <div className="text-3xl font-black text-gray-900">{stats.totalEvents}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2"><Music className="text-pink-500" size={20} /><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Canciones Tocadas</span></div>
            <div className="text-3xl font-black text-gray-900">{stats.totalSongsPlayed}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <div className="flex items-center gap-3 mb-2"><Users className="text-green-500" size={20} /><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Equipo Total</span></div>
             <div className="text-3xl font-black text-gray-900">{stats.totalMusicians}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-gray-400" /> Top 5 Canciones</h3>
            <div className="space-y-3">
                {topSongs.map((song, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-500'}`}>#{idx + 1}</div>
                            <span className="font-bold text-gray-700">{song.title}</span>
                        </div>
                        <div className="text-xs font-bold bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">{song.count} veces</div>
                    </div>
                ))}
                {topSongs.length === 0 && <p className="text-center text-gray-400 text-sm">No hay suficientes datos aún.</p>}
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
             <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><History size={18} className="text-gray-400" /> Historial Reciente</h3>
            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-2">
                {history.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors rounded-lg">
                        <div>
                            <div className="font-bold text-gray-800">{event.name}</div>
                            <div className="text-xs text-gray-400">{new Date(event.scheduled_date).toLocaleDateString()}</div>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Finalizado</span>
                    </div>
                ))}
                 {history.length === 0 && <p className="text-center text-gray-400 text-sm">No hay historial.</p>}
            </div>
        </div>
      </div>
    </div>
  );
}