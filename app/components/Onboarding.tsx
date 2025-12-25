"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, UserPlus, ArrowRight, Loader2, Music } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void; // Avisar al padre que ya terminamos
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [orgName, setOrgName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lógica: CREAR NUEVA BANDA
  const handleCreate = async () => {
    if (!orgName.trim()) return;
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No usuario");

      // 1. Crear la Organización
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name: orgName, owner_id: user.id }])
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Añadirme como Miembro (Admin)
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([{ 
            organization_id: org.id, 
            user_id: user.id, 
            role: 'admin' 
        }]);

      if (memberError) throw memberError;

      // ¡Éxito!
      onComplete();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al crear la banda');
    } finally {
      setLoading(false);
    }
  };

  // Lógica: UNIRSE A BANDA EXISTENTE
  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No usuario");

      // 1. Verificar si la org existe (buscando por ID)
      // Nota: En el futuro usaremos un código corto, por ahora es el UUID largo
      const { data: org, error: orgCheckError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', joinCode) // Aquí asumimos que el usuario pegó el UUID
        .single();

      if (orgCheckError || !org) throw new Error("No se encontró una banda con ese código ID.");

      // 2. Insertar miembro
      const { error: joinError } = await supabase
        .from('organization_members')
        .insert([{ 
            organization_id: org.id, 
            user_id: user.id, 
            role: 'member' 
        }]);

      if (joinError) {
          if (joinError.code === '23505') throw new Error("Ya eres miembro de esta banda.");
          throw joinError;
      }

      onComplete();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al unirse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl mb-4">
                <Music size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Bienvenido a Setlist Pro</h1>
            <p className="text-gray-400">Para comenzar, necesitas un equipo.</p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm text-center">
                {error}
            </div>
        )}

        {mode === 'menu' && (
            <div className="space-y-4">
                <button onClick={() => setMode('create')} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-2xl flex items-center gap-4 transition-all group text-left">
                    <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Crear nueva Banda</h3>
                        <p className="text-xs text-gray-500 mt-1">Serás el administrador y podrás invitar a otros.</p>
                    </div>
                    <ArrowRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button onClick={() => setMode('join')} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-2xl flex items-center gap-4 transition-all group text-left">
                    <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <UserPlus size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Unirme a un Equipo</h3>
                        <p className="text-xs text-gray-500 mt-1">Si ya tienes un código de invitación, úsalo aquí.</p>
                    </div>
                    <ArrowRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        )}

        {mode === 'create' && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h3 className="font-bold text-xl mb-4">Nombra tu Banda</h3>
                <input 
                    type="text" 
                    placeholder="Ej: Alabanza Domingo, Los Rockeros..." 
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 mb-6"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    autoFocus
                />
                <div className="flex gap-3">
                    <button onClick={() => setMode('menu')} className="flex-1 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors text-sm">Atrás</button>
                    <button 
                        onClick={handleCreate} 
                        disabled={loading || !orgName.trim()}
                        className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={18}/>}
                        Crear Banda
                    </button>
                </div>
            </div>
        )}

        {mode === 'join' && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <h3 className="font-bold text-xl mb-4">Código de Equipo</h3>
                <p className="text-xs text-gray-500 mb-4">Pide al administrador que copie el ID de la organización (ej: 550e8400...)</p>
                <input 
                    type="text" 
                    placeholder="Pega el código aquí..." 
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 mb-6 font-mono text-sm"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    autoFocus
                />
                <div className="flex gap-3">
                    <button onClick={() => setMode('menu')} className="flex-1 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors text-sm">Atrás</button>
                    <button 
                        onClick={handleJoin} 
                        disabled={loading || !joinCode.trim()}
                        className="flex-[2] bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={18}/>}
                        Unirme
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}