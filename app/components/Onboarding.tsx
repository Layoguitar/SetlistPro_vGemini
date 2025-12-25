"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Users, ArrowRight, Loader2 } from 'lucide-react';

interface OnboardingProps {
  userId: string;
  userEmail: string;
  onComplete: () => void; // Avisar que terminamos para recargar
}

export default function Onboarding({ userId, userEmail, onComplete }: OnboardingProps) {
  const [mode, setMode] = useState<'start' | 'create' | 'join'>('start');
  const [orgName, setOrgName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. CREAR NUEVA ORGANIZACIÓN (LIDER)
  const handleCreateOrg = async () => {
    setLoading(true);
    try {
      // A. Crear la Org
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name: orgName }])
        .select()
        .single();
      
      if (orgError) throw orgError;

      // B. Crear el Perfil del Admin vinculado a esa Org
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name: fullName,
          role: 'admin', // El que crea es Admin
          organization_id: org.id,
          main_instrument: 'Director'
        }]);

      if (profileError) throw profileError;

      onComplete(); // ¡Listo!
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. UNIRSE CON CÓDIGO (MÚSICO)
  const handleJoinOrg = async () => {
    setLoading(true);
    try {
      // A. Buscar la Org por el código
      const { data: org, error: findError } = await supabase
        .from('organizations')
        .select('id')
        .eq('invite_code', inviteCode.trim())
        .single();

      if (findError || !org) throw new Error("Código de invitación inválido");

      // B. Crear el Perfil del Músico vinculado a esa Org
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name: fullName,
          role: 'musician', // El que se une es Músico
          organization_id: org.id,
          main_instrument: 'Por definir'
        }]);

      if (profileError) throw profileError;

      onComplete();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // VISTA 1: ELEGIR CAMINO
  if (mode === 'start') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">¡Casi estamos listos!</h1>
          <p className="text-gray-500">Para empezar, dinos tu nombre.</p>
          <input 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-bold text-center text-lg outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tu Nombre y Apellido"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
          
          {fullName.length > 2 && (
            <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4">
              <button onClick={() => setMode('create')} className="bg-black text-white p-4 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-between group">
                <div className="text-left">
                  <div className="text-sm text-gray-400 font-normal">Soy Líder</div>
                  <div>Crear mi Iglesia/Banda</div>
                </div>
                <ArrowRight className="group-hover:translate-x-1 transition-transform"/>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">O</span></div>
              </div>

              <button onClick={() => setMode('join')} className="bg-white border-2 border-gray-200 text-gray-900 p-4 rounded-xl font-bold hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-between group">
                <div className="text-left">
                  <div className="text-sm text-gray-400 font-normal">Soy Músico</div>
                  <div>Tengo invitación</div>
                </div>
                <Users className="group-hover:scale-110 transition-transform"/>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // VISTA 2: CREAR
  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Nombra tu Equipo</h2>
          <input 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej. Iglesia Central, Banda Rock..."
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
          />
          <button 
            onClick={handleCreateOrg} 
            disabled={!orgName || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex justify-center"
          >
            {loading ? <Loader2 className="animate-spin"/> : "Crear y Entrar"}
          </button>
          <button onClick={() => setMode('start')} className="w-full text-gray-400 text-sm hover:text-gray-600">Volver</button>
        </div>
      </div>
    );
  }

  // VISTA 3: UNIRSE
  if (mode === 'join') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Ingresa el Código</h2>
          <p className="text-sm text-gray-500">Pídele el código de invitación a tu líder.</p>
          <input 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center tracking-widest text-xl uppercase"
            placeholder="XXXXXX"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
          />
          <button 
            onClick={handleJoinOrg} 
            disabled={inviteCode.length < 6 || loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 flex justify-center"
          >
            {loading ? <Loader2 className="animate-spin"/> : "Unirme al Equipo"}
          </button>
          <button onClick={() => setMode('start')} className="w-full text-gray-400 text-sm hover:text-gray-600">Volver</button>
        </div>
      </div>
    );
  }

  return null;
}